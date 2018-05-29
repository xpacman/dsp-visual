import React from "react";
import {
  DropdownItem,
  DropdownMenu, DropdownToggle, FormGroup, Input, Label, Nav, Navbar, NavItem, NavLink,
  UncontrolledDropdown
} from "reactstrap";
import styles from "./convolution.scss";
const Decimal = require('decimal.js-light');
import {Rect, Text} from "react-konva";
import ConvolutionEngine from "../../utils/ConvolutionEngine";
import * as Presets from "../../partials/SignalPresets";
import {Chart, Scroller} from "../../components";
import {max, min, extent} from "d3-array";
import Signal from "../../partials/Signal";
import {findIndexOfNearest} from '../../utils/ArrayUtils';
import config from "../../config";


export default class Convolution extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      dropdowns: {
        samplingRate: false,
        inputSignals: false,
        kernelSignals: false
      },
      samplingRate: 1 // Sampling frequency in Hz
    };

    // Slider progress
    this.progress = 0;
    // Convolution result
    this.result = [];
    this.outputChartXDomain = [-5, 15];
    this.outputChartYDomain = [-1, 1];

    // Signals
    this.timeDomain = [-5, 5]; // Time domain for signals
    this.draggableTimeDomain = [-10, 10]; // Time domain for dragging
    this.draggableStep = 1;
    this.kernelSignal = new Signal(); // Kernel discrete signal
    this.inputSignal = new Signal(); // Input discrete signal
    this.stepSignal = new Signal(); // Convolution step
    this.signalOutput = new Signal(); // Output (result) signal
    // Reset signals will set initial values
    this.resetSignals(true);

    // Refs
    this.samplingRate = null; // Sampling frequency ref
    this.wrappers = {}; // Object of wrappers (element refs) for charts
    this.dims = {}; // Object of dimensions for charts
    this.draggableChart = null; // Draggable Chart
    this.outputChart = null; // Output Chart
    this.stepChart = null; // Step Chart
    this.draggableChartOffsetLabel = null; // Draggable chart label text
    this.outputChartOffsetLabel = null; // Output chart label text
    this.stepChartLabel = null; // Step chart label
  }

  componentDidMount() {
    setTimeout(() => {
      // Delayed mount of konva components
      this.rescaleDimensions();
      // Listen for window resizes
      window.addEventListener("resize", () => this.rescaleDimensions());
    }, 1200);
  }

  componentWillUnmount() {
    window.removeEventListener("resize", () => this.forceUpdate());
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
   * @param resetInputs boolean whether or not to reset input (drawable) signal. Default false
   */
  resetSignals(resetInputs = false) {

    if (resetInputs) {
      // Regenerate values to initial
      this.kernelSignal.generateValues(this.timeDomain[0], this.timeDomain[1], this.state.samplingRate);
      this.inputSignal.generateValues(this.timeDomain[0], this.timeDomain[1], this.state.samplingRate);
    }

    this.inputSignal.timeOffset(this.draggableTimeDomain[0]).toFixed(2);
    this.stepSignal.generateValues(this.timeDomain[0], this.timeDomain[1], this.state.samplingRate);
    this.signalOutput.generateValues(this.outputChartXDomain[0], this.outputChartXDomain[1], 1);
  }

  setInputSignal(signal) {
    this.inputSignal = signal;
    this.resetApplication();
    this.computeConvolution();
  }

  setKernelSignal(signal) {
    this.kernelSignal = signal;
    this.resetApplication();
    this.computeConvolution();
  }

  /**
   * Resets application to the initial state. Empty result, scroller to zero, draggable chart to initial state
   */
  resetApplication(state = {}, resetInputs = false) {
    this.setState({...this.state, ...state});
    this.resetSignals(resetInputs);
    this.result = [];
    // Reset draggable chart and scroller
    this.moveScroller(0);
    this.draggableChart.datasetPoints("kernelSignal", this.kernelSignal.values());
  }

  /**
   * Will set new sampling rate, rerender sampled signal in chart
   * @param samplingRate number sampling frequency in Hz
   */
  setSamplingRate(samplingRate) {
    this.resetApplication({samplingRate: samplingRate})
  }

  /**
   * Handles drawing on charts
   * @param signalName string name of the this variable containing signal which is being drawed
   * @param chart Chart class instance we are drawing in
   */
  onChartDraw(signalName, chart) {
    /*
     Beznákovic dívka, jo, tu mám rád. Při myšlence na ni, chce se mi začít smát...a taky řvát, že po tom všem, znovu ji musím psát,
     */
    const pointerPos = chart.pointerPosition,
      placeToSet = findIndexOfNearest(this[signalName].values(), (point => point[0]), chart.getCordXValue(pointerPos.x, 3)),
      newPoint = this[signalName].setPoint(this[signalName].values()[placeToSet][0], chart.getCordYValue(pointerPos.y, 3));
    this[signalName].setPoint(newPoint[0], newPoint[1]);
    chart.datasetPoints(signalName, this[signalName].values());

    /* CODE FOR TIME CONTINUOUS SIGNAL
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
     */
  }

  /**
   * Handles click on drawable charts
   * @param signalName string name of the this variable containing signal which is being drawed
   * @param chart Chart class instance we are clicking in
   */
  onDrawableChartClick(signalName, chart) {
    // Input has changed -> reset application to beginning
    this.resetApplication();
    const pointerPos = chart.pointerPosition,
      placeToSet = findIndexOfNearest(this[signalName].values(), (point => point[0]), chart.getCordXValue(pointerPos.x, 3)),
      newPoint = this[signalName].setPoint(this[signalName].values()[placeToSet][0], chart.getCordYValue(pointerPos.y, 3));
    this[signalName].setPoint(newPoint[0], newPoint[1]);
    chart.datasetPoints(signalName, this[signalName].values());
  }

  computeConvolution() {
    this.result = ConvolutionEngine.convolution(this.inputSignal.values(), this.kernelSignal.values());
    // Convolution returns samples going from 0 time, we have to set time offset here
    const xMin = this.inputSignal.xDomain()[0],
      // Maximum y value of the convolution result
      resultMaxY = extent(this.result.map(point => point[1]));
    this.result.map((sample, i) => {
      sample[0] = (new Decimal(xMin + i * this.draggableStep)).toFixed(2);
    });
    // Rescale output chart for new result values
    this.outputChartXDomain = [this.result[0][0], this.result[this.result.length - 1][0]];
    this.outputChartYDomain = (resultMaxY[0] !== resultMaxY[1]) ? resultMaxY : [-1, 1];
    this.outputChart.rescale({yDomain: this.outputChartYDomain, xDomain: this.outputChartXDomain});
  }

  /**
   * Handles mouse up event upon drawable chart
   * @param signalName string name of the this variable containing signal which is being drawed
   * @param chart Chart class instance we are clicking in
   */
  onDrawableChartMouseUp(signalName, chart) {
    // Compute convolution on mouse up, save values as array
    this.computeConvolution();
    this.forceUpdate();
  }

  /**
   * Handles scroller move
   * @param position number percentual position of x
   **/
  moveScroller(position) {
    this.progress = position;
    // Move only by x range steps
    const offsetX = new Decimal(this.draggableChart.xRange[findIndexOfNearest(this.draggableChart.xRange, (x) => x, (position * (this.draggableTimeDomain[1] - this.draggableTimeDomain[0]) / 100) + this.draggableTimeDomain[0])]);
    // Set time offset of the signal
    this.inputSignal.timeOffset(offsetX.toFixed(2));
    // Update draggable chart
    this.draggableChart.datasetPoints("inputSignal", this.inputSignal.values(null, true, true));
    // Convolution result up to this scroller position progress
    const convResult = this.result.slice(0, this.result.findIndex((point => point[0] === offsetX.plus(this.inputSignal.xDomain()[1]).toFixed(2))) + 1),
      lastPoint = convResult.length > 0 ? convResult[convResult.length - 1][1] : 0;
    this.draggableChartOffsetLabel.setAttr("text", `Zpoždění = ${offsetX.toFixed(2)}`);
    this.draggableChart.refreshLayer("labels");
    // Handle step signal
    this.stepChartLabel.setAttr("text", `Příspěvek x[n] h[${offsetX.toFixed(2)} - n]`);
    this.stepSignal.values(ConvolutionEngine.getConvolutionStep(this.inputSignal.values(null, true, true), this.kernelSignal.values()));
    this.stepChart.datasetPoints("stepSignal", this.stepSignal.values());
    this.stepChart.refreshLayer("labels");
    // Set output signal values as portion of convolution result based on scroller progress
    this.signalOutput.values(convResult);
    this.outputChart.datasetPoints("outputSignal", this.signalOutput.values());
    this.outputChartOffsetLabel.setAttr("text", `y[${offsetX.toFixed(2)}] = x[n] ∗ h[n] = ∑ x[n] h[${offsetX.toFixed(2)} - n] = ${lastPoint.toFixed(2)}`);
    this.outputChart.refreshLayer("labels");
  }

  render() {
    const {dropdowns, samplingRate} = this.state,
      offsetX = Number(this.inputSignal.timeOffset()),
      samplingPeriod = new Decimal(1 / samplingRate);

    return (
      <div className={styles.container}>
        <Navbar dark className={styles.navbar}>
          <Nav>
            <NavItem className="d-inline-flex align-items-center px-3">
              Diskrétní lineární konvoluce
            </NavItem>

            <UncontrolledDropdown nav inNavbar
                                  className="d-inline-flex align-items-center px-3"
                                  isOpen={dropdowns.inputSignals}
                                  toggle={this.toggleDropdown.bind(this, "inputSignals")}>
              <DropdownToggle nav caret>
                Vstupní signál h[n]
              </DropdownToggle>
              <DropdownMenu>
                <DropdownItem
                  onClick={() => {
                    const signal = Presets.getBlankSignal(this.timeDomain[0], this.timeDomain[1], 1);
                    signal.setPoint(0, 1);
                    this.setInputSignal(signal);
                  }}>
                  Diracův impuls
                </DropdownItem>
                <DropdownItem
                  onClick={() => {
                    const signal = Presets.getBlankSignal(this.timeDomain[0], this.timeDomain[1], 1);
                    signal.setPoints([[-1, 1,], [0, 1], [1, 1]]);
                    this.setInputSignal(signal);
                  }}>
                  Obdélníkový
                </DropdownItem>
                <DropdownItem
                  onClick={() => {
                    const signal = Presets.getBlankSignal(this.timeDomain[0], this.timeDomain[1], 1);
                    signal.setPoints([[-3, 0.25,], [-2, 0.5], [-1, 0.75], [0, 1], [1, 0.75], [2, 0.5], [3, 0.25]]);
                    this.setInputSignal(signal);
                  }}>
                  Trojuhelníkový
                </DropdownItem>
                <DropdownItem
                  onClick={() => {
                    const signal = Presets.getBlankSignal(this.timeDomain[0], this.timeDomain[1], 1);
                    signal.setPoints([[-5, 1], [-4, 0.9], [-3, 0.8,], [-2, 0.7], [-1, 0.6], [0, 0.5], [1, 0.4], [2, 0.3], [3, 0.2], [4, 0.1]]);
                    this.setInputSignal(signal);
                  }}>
                  Exponenciála dolů
                </DropdownItem>
                <DropdownItem
                  onClick={() => {
                    const signal = Presets.getBlankSignal(this.timeDomain[0], this.timeDomain[1], 1);
                    signal.setPoints([[-4, 0.1], [-3, 0.2,], [-2, 0.3], [-1, 0.4], [0, 0.5], [1, 0.6], [2, 0.7], [3, 0.8], [4, 0.9], [5, 1]]);
                    this.setInputSignal(signal);
                  }}>
                  Exponenciála nahoru
                </DropdownItem>
              </DropdownMenu>
            </UncontrolledDropdown>

            <UncontrolledDropdown nav inNavbar
                                  className="d-inline-flex align-items-center px-3"
                                  isOpen={dropdowns.kernelSignals}
                                  toggle={this.toggleDropdown.bind(this, "kernelSignals")}>
              <DropdownToggle nav caret>
                Vstupní signál x[n]
              </DropdownToggle>
              <DropdownMenu>
                <DropdownItem
                  onClick={() => {
                    const signal = Presets.getBlankSignal(this.timeDomain[0], this.timeDomain[1], 1);
                    signal.setPoint(0, 1);
                    this.setKernelSignal(signal);
                  }}>
                  Diracův impuls
                </DropdownItem>
                <DropdownItem
                  onClick={() => {
                    const signal = Presets.getBlankSignal(this.timeDomain[0], this.timeDomain[1], 1);
                    signal.setPoints([[-1, 1,], [0, 1], [1, 1]]);
                    this.setKernelSignal(signal);
                  }}>
                  Obdélníkový
                </DropdownItem>
                <DropdownItem
                  onClick={() => {
                    const signal = Presets.getBlankSignal(this.timeDomain[0], this.timeDomain[1], 1);
                    signal.setPoints([[-3, 0.25,], [-2, 0.5], [-1, 0.75], [0, 1], [1, 0.75], [2, 0.5], [3, 0.25]]);
                    this.setKernelSignal(signal);
                  }}>
                  Trojuhelníkový
                </DropdownItem>
                <DropdownItem
                  onClick={() => {
                    const signal = Presets.getBlankSignal(this.timeDomain[0], this.timeDomain[1], 1);
                    signal.setPoints([[-5, 1], [-4, 0.9], [-3, 0.8,], [-2, 0.7], [-1, 0.6], [0, 0.5], [1, 0.4], [2, 0.3], [3, 0.2], [4, 0.1]]);
                    this.setKernelSignal(signal);
                  }}>
                  Exponenciála dolů
                </DropdownItem>
                <DropdownItem
                  onClick={() => {
                    const signal = Presets.getBlankSignal(this.timeDomain[0], this.timeDomain[1], 1);
                    signal.setPoints([[-4, 0.1], [-3, 0.2,], [-2, 0.3], [-1, 0.4], [0, 0.5], [1, 0.6], [2, 0.7], [3, 0.8], [4, 0.9], [5, 1]]);
                    this.setKernelSignal(signal);
                  }}>
                  Exponenciála nahoru
                </DropdownItem>
              </DropdownMenu>
            </UncontrolledDropdown>

            <NavItem className="d-inline-flex align-items-center px-3">
              <NavLink href="#" className="nav-link pr-3"
                       onClick={this.resetApplication.bind(this, {}, true)}>Vyčisti</NavLink>
            </NavItem>
          </Nav>
        </Navbar>

        <div className={`row h-100 ${styles.chartRow}`}>
          <div id="input-chart-wrapper" ref={(elem) => this.wrappers.inputChart = elem}
               className={`col-4 ${styles.chartWrapper}`}>
            {this.wrappers.inputChart && <Chart ref={(chart) => this.inputChart = chart}
                                                wrapper={this.wrappers.inputChart}
                                                width={this.dims.inputChart ? this.dims.inputChart[0] : 0}
                                                height={this.dims.inputChart ? this.dims.inputChart[1] : 0}
                                                xAxisLabel={"n"}
                                                yAxisLabel={"h[n]"}
                                                labels={{
                                                  x: 20,
                                                  y: 0,
                                                  width: 50,
                                                  height: 20,
                                                  content: <Text
                                                    text="Vstupní signál h[n]" {...config.chartLabelText} />
                                                }}
                                                xStep={1}
                                                xDomain={this.timeDomain}
                                                yDomain={[-1, 1]}
                                                datasets={{
                                                  inputSignal: {
                                                    data: this.inputSignal.values(),
                                                    config: {
                                                      ...config.convolutionInputChart.rect
                                                    },
                                                    element: "bar"
                                                  }
                                                }}
                                                onContentMousedrag={(chart) => {
                                                  this.onChartDraw("inputSignal", chart);
                                                  this.draggableChart.datasetPoints(`inputSignal`, this.inputSignal.values(null, true, true));
                                                }}
                                                onContentMouseup={this.onDrawableChartMouseUp.bind(this, "inputSignal")}
                                                onContentMousedown={(chart) => {
                                                  this.onDrawableChartClick("inputSignal", chart);
                                                  this.draggableChart.datasetPoints(`inputSignal`, this.inputSignal.values(null, true, true));
                                                }}/>
            }
          </div>

          <div id="kernel-chart-wrapper" ref={(elem) => this.wrappers.kernelChart = elem}
               className={`col-4 ${styles.chartWrapper}`}>
            {this.wrappers.kernelChart && <Chart wrapper={this.wrappers.kernelChart}
                                                 width={this.dims.kernelChart ? this.dims.kernelChart[0] : 0}
                                                 height={this.dims.kernelChart ? this.dims.kernelChart[1] : 0}
                                                 xAxisLabel={"n"}
                                                 yAxisLabel={"x[n]"}
                                                 labels={{
                                                   x: 20,
                                                   y: 0,
                                                   width: 50,
                                                   height: 20,
                                                   content: <Text
                                                     text="Vstupní signál x[n]" {...config.chartLabelText} />
                                                 }}
                                                 xStep={1}
                                                 xDomain={this.timeDomain}
                                                 yDomain={[-1, 1]}
                                                 datasets={{
                                                   kernelSignal: {
                                                     data: this.kernelSignal.values(),
                                                     config: {
                                                       ...config.convolutionKernelChart.rect
                                                     },
                                                     element: "bar"
                                                   }
                                                 }}
                                                 onContentMousedrag={(chart) => {
                                                   this.onChartDraw("kernelSignal", chart);
                                                   this.draggableChart.datasetPoints(`kernelSignal`, this.kernelSignal.values(null, true));
                                                 }}
                                                 onContentMouseup={this.onDrawableChartMouseUp.bind(this, "kernelSignal")}
                                                 onContentMousedown={(chart) => {
                                                   this.onDrawableChartClick("kernelSignal", chart);
                                                   this.draggableChart.datasetPoints(`kernelSignal`, this.kernelSignal.values(null, true));
                                                 }}/>
            }
          </div>

          <div id="step-chart-wrapper" ref={(elem) => this.wrappers.stepChart = elem}
               className={`col-4 ${styles.chartWrapper}`}>
            {this.wrappers.stepChart && <Chart ref={(chart) => this.stepChart = chart}
                                               wrapper={this.wrappers.stepChart}
                                               width={this.dims.stepChart ? this.dims.stepChart[0] : 0}
                                               height={this.dims.stepChart ? this.dims.stepChart[1] : 0}
                                               xAxisLabel={"n"}
                                               axisLabelOffsets={{x: [20, 0], y: [0, 0]}}
                                               clickSafe={true}
                                               xStep={1}
                                               xCrosshairDisabled={true}
                                               labels={{
                                                 x: 20,
                                                 y: 0,
                                                 width: 50,
                                                 height: 20,
                                                 content: <Text ref={(text) => this.stepChartLabel = text}
                                                                text={`Příspěvek x[n] h[${offsetX.toFixed(2)} - n]`} {...config.chartLabelText} />
                                               }}
                                               xDomain={this.timeDomain}
                                               yDomain={[-1, 1]}
                                               datasets={{
                                                 stepSignal: {
                                                   data: this.stepSignal.values(),
                                                   config: {
                                                     ...config.convolutionStepChart.rect
                                                   },
                                                   element: "bar"
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
                                                 xAxisLabel={"n"}
                                                 yAxisLabel={"y[n]"}
                                                 axisLabelOffsets={{
                                                   x: [20, 0],
                                                   y: [0, 0]
                                                 }}
                                                 xTicksCount={21}
                                                 labels={{
                                                   x: 20,
                                                   y: 0,
                                                   width: 50,
                                                   height: 20,
                                                   content: <Text ref={(text => this.outputChartOffsetLabel = text)}
                                                                  text={`y[${offsetX.toFixed(2)}] = x[n] ∗ h[n] = ∑ x[n] h[${offsetX.toFixed(2)} - n] = 0.00`} {...config.chartLabelText} />
                                                 }}
                                                 clickSafe={true}
                                                 xDomain={this.outputChartXDomain}
                                                 yDomain={this.outputChartYDomain}
                                                 xStep={this.draggableStep}
                                                 datasets={{
                                                   outputSignal: {
                                                     data: this.signalOutput.values(),
                                                     config: {
                                                       ...config.convolutionOutputChart.rect
                                                     },
                                                     element: "bar"
                                                   }
                                                 }}/>
            }
          </div>
        </div>
        <div className={`row h-100 ${styles.chartRow}`}>
          <div id="draggable-chart-wrapper" ref={(elem) => this.wrappers.draggableChart = elem}
               className={`col-12 ${styles.chartWrapper}`}>
            {this.wrappers.draggableChart && <Chart ref={(chart) => this.draggableChart = chart}
                                                    wrapper={this.wrappers.draggableChart}
                                                    width={this.dims.draggableChart ? this.dims.draggableChart[0] : 0}
                                                    height={this.dims.draggableChart ? this.dims.draggableChart[1] : 0}
                                                    xAxisLabel={"n"}
                                                    yAxisLabel={"y[n]"}
                                                    axisLabelOffsets={{x: [20, 0], y: [0, 0]}}
                                                    xTicksCount={20}
                                                    labels={{
                                                      x: 20,
                                                      y: 0,
                                                      width: 50,
                                                      height: 20,
                                                      content: <Text
                                                        ref={(text => this.draggableChartOffsetLabel = text)}
                                                        text={`Zpoždění = ${offsetX.toFixed(2)}`} {...config.chartLabelText} />
                                                    }}
                                                    clickSafe={true}
                                                    xStep={this.draggableStep}
                                                    xDomain={this.draggableTimeDomain}
                                                    yDomain={[-1, 1]}
                                                    datasets={{
                                                      inputSignal: {
                                                        data: this.inputSignal.values(null, true, true),
                                                        config: {
                                                          ...config.convolutionInputChart.rect
                                                        },
                                                        element: "bar"
                                                      },
                                                      kernelSignal: {
                                                        data: this.kernelSignal.values(),
                                                        config: {
                                                          ...config.convolutionKernelChart.rect
                                                        },
                                                        element: "bar"
                                                      },
                                                    }}/>
            }
          </div>
        </div>
        <div className={`row ${styles.chartRow}`} style={{height: 150}}>
          <div className={`col-12 ${styles.chartWrapper}`}>
            {this.wrappers.draggableChart &&
            <Scroller
              progress={this.progress}
              onScroll={this.moveScroller.bind(this)}
              precision={3}
              width={this.dims.draggableChart ? this.dims.draggableChart[0] : 0}
              height={150}/>}
          </div>
        </div>
      </div>
    );
  }
}
