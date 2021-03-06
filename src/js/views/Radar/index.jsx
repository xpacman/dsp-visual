import React from "react";
import {
  DropdownItem,
  DropdownMenu, DropdownToggle, FormGroup, Input, Label, Nav, Navbar, NavItem, NavLink,
  UncontrolledDropdown
} from "reactstrap";
import styles from "./radar.scss";
const Decimal = require('decimal.js-light');
import {Rect, Text} from "react-konva";
import CorrelationEngine from "../../utils/CorrelationEngine";
import * as Presets from "../../partials/SignalPresets";
import {Chart, Scroller} from "../../components";
import {max, min, extent} from "d3-array";
import Signal from "../../partials/Signal";
import {findIndexOfNearest} from '../../utils/ArrayUtils';
import config from "../../config";


export default class Correlation extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      dropdowns: {
        samplingRate: false,
        noisePerformance: false,
        inputSignals: false
      },
      samplingRate: 1, // Sampling frequency in MHz
      noisePerformance: 1 // Noise performance of the received signal
    };

    // Slider progress
    this.progress = 50;
    // Correlation results
    this.result = [];
    this.outputAmplitude = [-1, 1];

    // Signals
    this.draggableOffset = 50; // Offset of the draggable signal
    this.timeDomain = [0, 10]; // Time domain for signals
    this.draggableTimeDomain = [0, 100]; // Time domain for dragging
    this.lag = this.getRandomLag(); // Lag of the received signal
    this.draggableStep = 1;
    this.inputSignal = Presets.getSinSignal(this.timeDomain[0], this.timeDomain[1]); // Input signal
    this.inputSignalSampled = new Signal(); // Discrete input signal
    this.receivedSignal = new Signal(); // Received signal
    this.draggableSignal = new Signal(); // Draggable signal for searching in cross correlation function
    this.draggableSignal.timeOffset(this.draggableOffset - this.lag);
    // Reset signals will set initial values
    this.resetSignals(true);
    this.computeCorrelation();

    // Refs
    this.samplingRate = null; // Sampling frequency input ref
    this.noisePerformance = null; // Noise performance input ref
    this.wrappers = {}; // Object of wrappers (element refs) for charts
    this.dims = {}; // Object of dimensions for charts
    this.outputChart = null; // Cross correlation function (output) Chart
    this.inputChart = null; // Input Chart
    this.receivedChart = null; // Step Chart
    this.outputChartOffsetLabel = null; // Output chart label text
    this.outputChartCorrelationResultLabel = null; // Correlation result label text
  }

  componentDidMount() {
    // Delayed mount of konva components
    setTimeout(() => {
      this.rescaleDimensions();
      // Listen for window resizes
      window.addEventListener("resize", () => this.rescaleDimensions());
    }, 1200);
  }

  componentWillUnmount() {
    window.removeEventListener("resize", () => this.forceUpdate());
  }

  componentDidUpdate(prevProps, prevState) {
    // Sampling rate changed
    if (prevState.samplingRate !== this.state.samplingRate || prevState.noisePerformance !== this.state.noisePerformance) {
      this.resetSignals();
      this.moveScroller(this.draggableOffset);
      // Input samples changed -> recompute correlation
      this.computeCorrelation();
      this.inputChart.datasetPoints("inputSignalSampled", this.inputSignalSampled.values());
      this.receivedChart.datasetPoints("receivedSignal", this.receivedSignal.values());
      this.outputChart.datasetPoints("receivedSignal", this.receivedSignal.values());
      // We want default offset here
      this.outputChart.datasetPoints("draggableSignal", this.draggableSignal.values(null, true));
    }
  }

  toggleDropdown(dropdown) {
    this.setState({dropdowns: {...this.state.dropdowns, [dropdown]: !this.state.dropdowns[dropdown]}})
  }

  /**
   * Will force update state and recalculates dimensions for canvas elements
   */
  rescaleDimensions() {
    Object.keys(this.wrappers).forEach(key => {
      this.dims[key] = this.getElementDimensions(this.wrappers[key]);
    });
    this.forceUpdate();
  }

  /**
   * Will return element array containing element width and height
   * @param element element reference
   * @return {[width, height]|array}
   */
  getElementDimensions(element) {
    if (element) {
      return [element.offsetWidth, element.offsetHeight];
    }
    return [undefined, undefined];
  }

  /**
   * Reset signals to initial values
   * @param resetInputs boolean whether or not to reset input (drawable) signal into its default
   */
  resetSignals(resetInputs = false) {

    if (resetInputs) {
      // Regenerate values to initial
      this.inputSignal = Presets.getSinSignal(this.timeDomain[0], this.timeDomain[1]);
    }
    this.inputSignalSampled.values(Signal.getSamples(this.state.samplingRate, this.inputSignal));
    this.receiveSignal(this.state.noisePerformance, this.lag);
  }

  setInputSignal(signal) {
    this.inputSignal = signal;
    this.resetApplication();
  }

  /**
   * Resets application to the initial state. Empty result, scroller to zero, draggable chart to initial state
   */
  resetApplication(state = {}) {
    this.setState({...this.state, ...state});
    this.resetSignals();
    // Input samples changed -> recompute correlation
    this.moveScroller(this.progress);
    this.computeCorrelation();
    this.inputChart.datasetPoints("inputSignalSampled", this.inputSignalSampled.values());
    this.receivedChart.datasetPoints("receivedSignal", this.receivedSignal.values());
    this.outputChart.datasetPoints("receivedSignal", this.receivedSignal.values());
    this.outputChart.datasetPoints("draggableSignal", this.draggableSignal.values(null, true));
  }

  getRandomLag() {
    return Math.floor(Math.random() * ((this.draggableTimeDomain[1] - 10) - (this.draggableTimeDomain[0] + 10)) + this.draggableTimeDomain[0] + 10);
  }

  /**
   * Will set sampling new sampling rate, rerender sampled signal in chart
   * @param samplingRate number sampling frequency in Hz
   */
  setSamplingRate(samplingRate) {
    this.setState({samplingRate: samplingRate});
  }

  /**
   * Will set white noise performance
   * @param performance number How "big" noise should be
   * @param lag number Delay of the received signal
   */
  setNoisePerformance(performance, lag = null) {
    if (lag !== null) {
      this.lag = lag;
    }
    this.setState({noisePerformance: performance});
  }

  /**
   * Simulate receive of the signal. Signal will be enchanced by noise and delayed by lag
   * @param noisePerformance number intensity of the noise
   * @param lag number delay in time
   */
  receiveSignal(noisePerformance = 1, lag = null) {
    // Generate noise
    const noise = CorrelationEngine.generateWhiteNoise(this.draggableTimeDomain[0], this.draggableTimeDomain[1], 1 / noisePerformance, -noisePerformance, noisePerformance),
      noisifiedInput = CorrelationEngine.noisifySignal(this.inputSignalSampled, noise, noisePerformance, lag);

    this.receivedSignal.values(noisifiedInput.values());
    if (lag !== null) {
      this.lag = lag;
    }
    // Rescale charts to fit amplitude
    this.outputAmplitude = extent(this.receivedSignal.values().map(point => point[1]));
    if (this.receivedChart && this.outputChart) {
      this.receivedChart.rescale({yDomain: this.outputAmplitude});
      this.outputChart.rescale({yDomain: this.outputAmplitude});
    }
  }

  /**
   * Handles drawing on charts
   * @param signalName string name of the this variable containing signal which is being drawed
   * @param chart Chart class instance we are drawing in
   */
  onChartDraw(signalName, chart) {
    let min = chart.getCordXValue(chart.lastPointerPosition.x);
    let max = chart.getCordXValue(chart.pointerPosition.x);
    // If user drags from right to left, swap values
    if (min > max) {
      const tmp = min;
      min = max;
      max = tmp;
    }
    // Determine which points to set (handles situation when user drags mouse too fast)
    const pointsToSet = this[signalName].getPointsInRange(min, max);
    // Set the points
    pointsToSet.forEach(point => this[signalName].setPoint(point[0], chart.getCordYValue(chart.pointerPosition.y)));
    chart.datasetPoints(signalName, this[signalName].values());
    this[`${signalName}Sampled`].values(Signal.getSamples(this.state.samplingRate, this[signalName]));
  }

  /**
   * Handles click on drawable charts
   * @param signalName string name of the this variable containing signal which is being drawed
   * @param chart Chart class instance we are clicking in
   */
  onDrawableChartClick(signalName, chart) {
    const pointerPos = chart.pointerPosition,
      newPoint = this[signalName].setPoint(chart.getCordXValue(pointerPos.x, 3), chart.getCordYValue(pointerPos.y, 3));
    this[signalName].setPoint(newPoint[0], newPoint[1]);
    // Make discrete signal
    this[`${signalName}Sampled`].values(Signal.getSamples(this.state.samplingRate, this[signalName]));
    chart.datasetPoints(signalName, this[signalName].values());
  }

  /**
   * Handles mouse up event upon drawable chart
   * @param signalName string name of the this variable containing signal which is being drawed
   * @param chart Chart class instance we are clicking in
   */
  onDrawableChartMouseUp(signalName, chart) {
    this.resetApplication();
  }

  computeCorrelation() {
    // ensure correlation works with arrays of same length
    let idx = 0;
    const input = [],
      samples = this.inputSignalSampled.values(null, this.lag);
    this.receivedSignal.values().forEach((point, i) => {
      input[i] = [point[0], 0];
      if (samples[idx] && point[0] === samples[idx][0]) {
        input[i][1] = point[1];
        idx++;
      }
    });
    // Adjust amplitude
    samples.map(point => point[1] *= this.state.noisePerformance);
    this.draggableSignal.values(samples);
    // Add padding to make draggable signal look pretty
    this.draggableSignal.setPoint((Number(samples[0][0]) - 0.01), 0);
    this.draggableSignal.setPoint((Number(samples[samples.length - 1][0]) + 0.01), 0);
    this.draggableSignal.setPoint(-100, 0);
    this.draggableSignal.setPoint(200, 0);
    // Compute correlation
    this.result = CorrelationEngine.crossCorrelation(input, this.receivedSignal.values());
  }

  getCorrelationResult(offsetX) {
    return this.result.find(shift => shift[0] === this.lag - Number(offsetX))[1];
  }

  /**
   * Handles scroller move
   * @param position number percentual position of x
   **/
  moveScroller(position) {
    this.progress = position;
    // Move only by x range steps
    const offsetX = new Decimal(this.outputChart.xRange[findIndexOfNearest(this.outputChart.xRange, (x) => x, (position * (this.draggableTimeDomain[1] - this.draggableTimeDomain[0]) / 100) + this.draggableTimeDomain[0])]),
      correlationFunc = this.getCorrelationResult(offsetX); // Correlation function result
    this.draggableOffset = offsetX;
    // Set time offset
    this.draggableSignal.timeOffset(offsetX.minus(this.lag).toFixed(2));
    // Update draggable chart
    this.outputChart.datasetPoints("draggableSignal", this.draggableSignal.values(null, true));
    this.outputChartOffsetLabel.setAttr("text", `Zpoždění τ = ${offsetX.toFixed(2)}[ms]`);
    this.outputChartCorrelationResultLabel.setAttr("text", `Rxy(${Number(offsetX).toFixed(2)}) = ${correlationFunc.toFixed(2)}`);
    this.outputChart.refreshLayer("labels");
  }

  render() {
    const {dropdowns, samplingRate, noisePerformance} = this.state;

    return (
      <div className={styles.container}>
        <Navbar dark className={styles.navbar}>
          <Nav>
            <NavItem className="d-inline-flex align-items-center px-3">
              Diskrétní křížová korelace
            </NavItem>

            <UncontrolledDropdown nav inNavbar
                                  className="d-inline-flex align-items-center px-3"
                                  isOpen={dropdowns.inputSignals}
                                  toggle={this.toggleDropdown.bind(this, "inputSignals")}>
              <DropdownToggle nav caret>
                Vstupní signál
              </DropdownToggle>
              <DropdownMenu>
                <DropdownItem
                  onClick={this.setInputSignal.bind(this, Presets.getSinSignal(this.timeDomain[0], this.timeDomain[1]))}>
                  Sinusový
                </DropdownItem>
                <DropdownItem
                  onClick={this.setInputSignal.bind(this, Presets.getRectSignal(this.timeDomain[0], this.timeDomain[1], 1))}>
                  Obdélníkový
                </DropdownItem>
                <DropdownItem
                  onClick={this.setInputSignal.bind(this, Presets.getSawtoothSignal(this.timeDomain[0], this.timeDomain[1], 1, 4))}>
                  Pilovitý
                </DropdownItem>
                <DropdownItem
                  onClick={this.setInputSignal.bind(this, Presets.getTriangleSignal(this.timeDomain[0], this.timeDomain[1]))}>
                  Trojuhelník
                </DropdownItem>
              </DropdownMenu>
            </UncontrolledDropdown>

            <UncontrolledDropdown nav inNavbar
                                  className="d-inline-flex align-items-center px-3"
                                  isOpen={dropdowns.samplingRate}
                                  toggle={this.toggleDropdown.bind(this, "samplingRate")}>
              <DropdownToggle nav caret>
                Vzorkovací frekvence
              </DropdownToggle>
              <DropdownMenu className="px-3">
                <FormGroup>
                  <Label for="exampleText">Vzorkovací frekvence [kHz]</Label>
                  <Input placeholder=""
                         type="number"
                         innerRef={(input) => this.samplingRate = input}
                         defaultValue={samplingRate}
                         onChange={(event) => {
                           if (event.target.value !== "" && event.target.value > 0) {
                             this.setSamplingRate(Number(event.target.value))
                           }
                         }}
                  />
                </FormGroup>
              </DropdownMenu>
            </UncontrolledDropdown>

            <NavItem className="d-inline-flex align-items-center px-3">
              <span className="pr-3">f<sub>vz</sub> = {(samplingRate).toFixed(2)}kHz</span>
              <span className="pr-3">T<sub>vz</sub> = {(1 / samplingRate).toFixed(2)}ms</span>
            </NavItem>

            <UncontrolledDropdown nav inNavbar
                                  className="d-inline-flex align-items-center px-3"
                                  isOpen={dropdowns.noisePerformance}
                                  toggle={this.toggleDropdown.bind(this, "noisePerformance")}>
              <DropdownToggle nav caret>
                Výkon šumu
              </DropdownToggle>
              <DropdownMenu className="px-3">
                <FormGroup>
                  <Label for="exampleText">Výkon šumu [-]</Label>
                  <Input placeholder=""
                         type="number"
                         innerRef={(input) => this.noisePerformance = input}
                         defaultValue={noisePerformance}
                         onChange={(event) => {
                           if (event.target.value !== "" && event.target.value > 0) {
                             this.setNoisePerformance(Number(event.target.value), this.getRandomLag())
                           }
                         }}
                  />
                </FormGroup>
              </DropdownMenu>
            </UncontrolledDropdown>

            <NavItem className="d-inline-flex align-items-center px-3">
              <span className="pr-3">Šum: {noisePerformance.toFixed(2)}</span>
            </NavItem>

            <NavItem className="d-inline-flex align-items-center px-3">
              <NavLink href="#" className="nav-link pr-3" onClick={() => {
                this.lag = this.getRandomLag();
                this.resetApplication();
              }}>Znáhodni šum</NavLink>
            </NavItem>
          </Nav>
        </Navbar>

        <div className={`row h-100 ${styles.chartRow}`}>
          <div id="input-chart-wrapper" ref={(elem) => this.wrappers.inputChart = elem}
               className={`col-12 ${styles.chartWrapper}`}>
            {this.wrappers.inputChart && <Chart ref={(chart) => this.inputChart = chart}
                                                wrapper={this.wrappers.inputChart}
                                                width={this.dims.inputChart ? this.dims.inputChart[0] : 0}
                                                height={this.dims.inputChart ? this.dims.inputChart[1] : 0}
                                                xAxisLabel={"t [ms]"}
                                                axisLabelOffsets={{x: [20, 0], y: [0, 0]}}
                                                labels={{
                                                  x: 20,
                                                  y: 0,
                                                  width: 50,
                                                  height: 20,
                                                  content: <Text
                                                    text="Vyslaný signál x(t)" {...config.chartLabelText} />
                                                }}
                                                xDomain={this.timeDomain}
                                                yDomain={[-1, 1]}
                                                datasets={{
                                                  inputSignal: {
                                                    data: this.inputSignal.values(),
                                                    config: config.correlationInputChart.line
                                                  },
                                                  inputSignalSampled: {
                                                    data: this.inputSignalSampled.values(),
                                                    config: {
                                                      ...config.correlationInputChart.rect,
                                                      width: 1
                                                    },
                                                    element: "bar"
                                                  }
                                                }}
                                                onContentMousedrag={(chart) => {
                                                  this.onChartDraw("inputSignal", chart);
                                                  chart.datasetPoints(`inputSignalSampled`, this.inputSignalSampled.values());
                                                }}
                                                onContentMouseup={this.onDrawableChartMouseUp.bind(this, "inputSignal")}
                                                onContentMousedown={(chart) => {
                                                  this.onDrawableChartClick("inputSignal", chart);
                                                  chart.datasetPoints(`inputSignalSampled`, this.inputSignalSampled.values());
                                                }}/>
            }
          </div>
        </div>

        <div className={`row h-100 ${styles.chartRow}`}>
          <div id="received-chart-wrapper" ref={(elem) => this.wrappers.receivedChart = elem}
               className={`col-12 ${styles.chartWrapper}`}>
            {this.wrappers.receivedChart && <Chart ref={(chart) => this.receivedChart = chart}
                                                   wrapper={this.wrappers.receivedChart}
                                                   width={this.dims.receivedChart ? this.dims.receivedChart[0] : 0}
                                                   height={this.dims.receivedChart ? this.dims.receivedChart[1] : 0}
                                                   xAxisLabel={"t [ms]"}
                                                   clickSafe={true}
                                                   xTicksCount={10}
                                                   xStep={0.01}
                                                   axisLabelOffsets={{x: [20, 0], y: [0, 0]}}
                                                   labels={{
                                                     x: 20,
                                                     y: 0,
                                                     width: 50,
                                                     height: 20,
                                                     content: <Text
                                                       text="Přijatý signál y(t)" {...config.chartLabelText} />
                                                   }}
                                                   xDomain={this.draggableTimeDomain}
                                                   yDomain={this.outputAmplitude}
                                                   datasets={{
                                                     receivedSignal: {
                                                       data: this.receivedSignal.values(),
                                                       config: config.correlationReceivedChart.line
                                                     }
                                                   }}/>
            }
          </div>
        </div>

        <div className={`row h-100 ${styles.chartRow}`}>
          <div id="output-chart-wrapper" ref={(elem) => this.wrappers.outputChart = elem}
               className={`col-12 ${styles.chartWrapper}`}>
            {this.wrappers.outputChart && <Chart ref={(chart) => this.outputChart = chart}
                                                 wrapper={this.wrappers.outputChart}
                                                 width={this.dims.outputChart ? this.dims.outputChart[0] : 0}
                                                 height={this.dims.outputChart ? this.dims.outputChart[1] : 0}
                                                 xAxisLabel={"τ [ms]"}
                                                 clickSafe={true}
                                                 axisLabelOffsets={{x: [20, 0], y: [0, 0]}}
                                                 labels={[{
                                                   x: 20,
                                                   y: 0,
                                                   width: 50,
                                                   height: 20,
                                                   content: <Text
                                                     text="Křížová korelační funkce Rxy(τ)" {...config.chartLabelText} />
                                                 }, {
                                                   x: 200,
                                                   y: 0,
                                                   width: 50,
                                                   height: 20,
                                                   content: <Text ref={(text => this.outputChartOffsetLabel = text)}
                                                                  text={`Zpoždění τ = ${Number(this.draggableOffset).toFixed(2)}[ms]`} {...config.chartLabelText} />
                                                 },
                                                   {
                                                     x: 350,
                                                     y: 0,
                                                     width: 50,
                                                     height: 20,
                                                     content: <Text
                                                       ref={(text => this.outputChartCorrelationResultLabel = text)}
                                                       text={`Rxy(${Number(this.draggableOffset).toFixed(2)}) = ${this.getCorrelationResult(this.draggableOffset).toFixed(2)}`} {...config.chartLabelText} />
                                                   }]}
                                                 xDomain={this.draggableTimeDomain}
                                                 yDomain={this.outputAmplitude}
                                                 xStep={1}
                                                 datasets={{
                                                   receivedSignal: {
                                                     data: this.receivedSignal.values(),
                                                     config: config.correlationOutputChart.receivedSignal.line
                                                   },
                                                   draggableSignal: {
                                                     data: this.draggableSignal.values(null, true),
                                                     config: config.correlationOutputChart.inputSignal.line
                                                   }
                                                 }}/>
            }
          </div>
        </div>

        <div className={`row ${styles.chartRow}`} style={{height: 100}}>
          <div className={`col-12 ${styles.chartWrapper}`}>
            {this.wrappers.outputChart &&
            <Scroller
              progress={Number(this.progress)}
              onScroll={this.moveScroller.bind(this)}
              precision={3}
              width={this.dims.outputChart ? this.dims.outputChart[0] : 0}
              height={50}/>}
          </div>
        </div>
      </div>
    );
  }
}
