import React from "react";
import {
  DropdownItem,
  DropdownMenu, DropdownToggle, FormGroup, Input, Label, Nav, Navbar, NavItem,
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
    this.kernelSignal = new Signal(); // Kernel signal
    this.inputSignal = new Signal(); // Input signal
    this.inputSignalSampled = new Signal([], this.draggableTimeDomain[0]); // Discrete input signal
    this.kernelSignalSampled = new Signal(); // Discrete kernel signal
    this.stepSignal = new Signal(); // Convolution step
    this.signalOutput = new Signal(); // Output (result) signal
    // Reset signals will set initial values
    this.resetSignals(true);

    // Refs
    this.samplingRate = null; // Sampling frequency ref
    this.kernelChartWrapper = null; // Kernel Chart wrapper ref
    this.inputChartWrapper = null; // Input Chart wrapper ref
    this.outputChartWrapper = null; // Output Chart wrapper ref
    this.stepChartWrapper = null; // Step Chart wrapper ref
    this.draggableChartWrapper = null; // Draggable Chart wrapper ref
    this.draggableChart = null; // Draggable Chart
    this.outputChart = null; // Output Chart
    this.stepChart = null; // Step Chart
    this.draggableChartOffsetLabel = null; // Draggable chart label text
    this.outputChartOffsetLabel = null; // Output chart label text
  }

  componentDidMount() {
    setTimeout(() => {
      // Delayed mount of konva components
      this.forceUpdate();
      // Listen for window resizes
      window.addEventListener("resize", () => this.forceUpdate());
    }, 1000);
  }

  componentWillUnmount() {
    window.removeEventListener("resize", () => this.forceUpdate());
  }

  toggleDropdown(dropdown) {
    this.setState({dropdowns: {...this.state.dropdowns, [dropdown]: !this.state.dropdowns[dropdown]}})
  }

  /**
   * Reset signals to initial values
   * @param resetInputs boolean whether or not to reset input (drawable) signal. Default false
   */
  resetSignals(resetInputs = false) {

    if (resetInputs) {
      // Regenerate values to initial
      this.kernelSignal.generateValues(this.timeDomain[0], this.timeDomain[1]);
      this.inputSignal.generateValues(this.timeDomain[0], this.timeDomain[1]);
    }

    this.inputSignalSampled.timeOffset(this.draggableTimeDomain[0].toFixed(2));
    this.inputSignalSampled.values(Signal.getSamples(this.state.samplingRate, this.inputSignal));
    this.kernelSignalSampled.values(Signal.getSamples(this.state.samplingRate, this.kernelSignal));
    this.signalOutput.values([]);
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
  resetApplication(state = {}) {
    this.setState({...this.state, ...state});
    this.resetSignals();
    this.result = [];
    // Reset draggable chart and scroller
    this.moveScroller(0);
    this.draggableChart.datasetPoints("kernelSignalSampled", this.kernelSignalSampled.values());
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
    // Input has changed -> reset application to beginning
    this.resetApplication();
    const pointerPos = chart.pointerPosition,
      newPoint = this[signalName].setPoint(chart.getCordXValue(pointerPos.x, 3), chart.getCordYValue(pointerPos.y, 3));
    this[signalName].setPoint(newPoint[0], newPoint[1]);
    // Make discrete signal
    this[`${signalName}Sampled`].values(Signal.getSamples(this.state.samplingRate, this[signalName]));
    chart.datasetPoints(signalName, this[signalName].values());
  }

  computeConvolution() {
    this.result = ConvolutionEngine.convolution(this.inputSignalSampled.values(), this.kernelSignalSampled.values());
    // Convolution returns samples going from 0 time, we have to set time offset here
    const xMin = this.inputSignalSampled.xDomain()[0],
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
    this.inputSignalSampled.timeOffset(offsetX.toFixed(2));
    // Update draggable chart
    this.draggableChart.datasetPoints("inputSignalSampled", this.inputSignalSampled.values(null, true, true));
    // Convolution result up to this scroller position progress
    const convResult = this.result.slice(0, this.result.findIndex((point => point[0] === offsetX.plus(this.inputSignalSampled.xDomain()[1]).toFixed(2))) + 1),
      lastPoint = convResult.length > 0 ? convResult[convResult.length - 1][1] : 0;
    this.draggableChartOffsetLabel.setAttr("text", `Zpoždění = ${offsetX.toFixed(2)}ms`);
    this.draggableChart.refreshLayer("labels");
    // Handle step signal
    this.stepSignal.values([[0, lastPoint]]);
    this.stepChart.datasetPoints("stepSignal", this.stepSignal.values());
    // Set output signal values as portion of convolution result based on scroller progress
    this.signalOutput.values(convResult);
    this.outputChart.datasetPoints("outputSignal", this.signalOutput.values());
    this.outputChartOffsetLabel.setAttr("text", `y(${offsetX.toFixed(2)}) = ∑ x(n) ∗ h(${offsetX.toFixed(2)} - n) = ${lastPoint.toFixed(2)}`);
    this.outputChart.refreshLayer("labels");
  }

  render() {
    const {dropdowns, samplingRate} = this.state,
      offsetX = this.inputSignalSampled.timeOffset(),
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
                  onClick={this.setInputSignal.bind(this, Presets.getExpDownSignal(this.timeDomain[0], this.timeDomain[1]))}>
                  Exponenciála dolů
                </DropdownItem>
                <DropdownItem
                  onClick={this.setInputSignal.bind(this, Presets.getExpUpSignal(this.timeDomain[0], this.timeDomain[1]))}>
                  Exponenciála nahoru
                </DropdownItem>
              </DropdownMenu>
            </UncontrolledDropdown>

            <UncontrolledDropdown nav inNavbar
                                  className="d-inline-flex align-items-center px-3"
                                  isOpen={dropdowns.kernelSignals}
                                  toggle={this.toggleDropdown.bind(this, "kernelSignals")}>
              <DropdownToggle nav caret>
                Výstupní signál
              </DropdownToggle>
              <DropdownMenu>
                <DropdownItem
                  onClick={this.setKernelSignal.bind(this, Presets.getSinSignal(this.timeDomain[0], this.timeDomain[1]))}>
                  Sinusový
                </DropdownItem>
                <DropdownItem
                  onClick={this.setKernelSignal.bind(this, Presets.getRectSignal(this.timeDomain[0], this.timeDomain[1], 1))}>
                  Obdélníkový
                </DropdownItem>
                <DropdownItem
                  onClick={this.setKernelSignal.bind(this, Presets.getSawtoothSignal(this.timeDomain[0], this.timeDomain[1], 1, 4))}>
                  Pilovitý
                </DropdownItem>
                <DropdownItem
                  onClick={this.setKernelSignal.bind(this, Presets.getExpDownSignal(this.timeDomain[0], this.timeDomain[1]))}>
                  Exponenciála dolů
                </DropdownItem>
                <DropdownItem
                  onClick={this.setKernelSignal.bind(this, Presets.getExpUpSignal(this.timeDomain[0], this.timeDomain[1]))}>
                  Exponenciála nahoru
                </DropdownItem>
              </DropdownMenu>
            </UncontrolledDropdown>

            <NavItem className="d-inline-flex align-items-center px-3">
              <span className="pr-3">f<sub>vz</sub> = {samplingRate.toFixed(2)}kHz</span>
              <span className="pr-3">T<sub>vz</sub> = {samplingPeriod.toFixed(2)}ms</span>
            </NavItem>
          </Nav>
        </Navbar>

        <div className={`row h-100 ${styles.chartRow}`}>
          <div id="input-chart-wrapper" ref={(elem) => this.inputChartWrapper = elem}
               className={`col-4 ${styles.chartWrapper}`}>
            {this.inputChartWrapper && <Chart ref={(chart) => this.inputChart = chart}
                                              wrapper={this.inputChartWrapper}
                                              width={this.inputChartWrapper.offsetWidth}
                                              height={this.inputChartWrapper.offsetHeight}
                                              xAxisLabel={"t [ms]"}
                                              labelOffsets={{x: [20, 0], y: [0, 0]}}
                                              labels={{
                                                x: 20,
                                                y: 0,
                                                width: 50,
                                                height: 20,
                                                content: <Text text="Vstupní signál h(t)" {...config.chartLabelText} />
                                              }}
                                              xDomain={this.timeDomain}
                                              yDomain={[-1, 1]}
                                              datasets={{
                                                inputSignal: {
                                                  data: this.inputSignal.values(),
                                                  config: config.convolutionInputChart.line
                                                }
                                              }}
                                              onContentMousedrag={(chart) => {
                                                this.onChartDraw("inputSignal", chart);
                                                this.draggableChart.datasetPoints(`inputSignalSampled`, this.inputSignalSampled.values(null, true, true));
                                              }}
                                              onContentMouseup={this.onDrawableChartMouseUp.bind(this, "inputSignal")}
                                              onContentMousedown={(chart) => {
                                                this.onDrawableChartClick("inputSignal", chart);
                                                this.draggableChart.datasetPoints(`inputSignalSampled`, this.inputSignalSampled.values(null, true, true));
                                              }}/>
            }
          </div>

          <div id="step-chart-wrapper" ref={(elem) => this.stepChartWrapper = elem}
               className={`col-4 ${styles.chartWrapper}`}>
            {this.stepChartWrapper && <Chart ref={(chart) => this.stepChart = chart}
                                             wrapper={this.stepChartWrapper}
                                             width={this.stepChartWrapper.offsetWidth}
                                             height={this.stepChartWrapper.offsetHeight}
                                             xAxisLabel={"t [ms]"}
                                             labelOffsets={{x: [20, 0], y: [0, 0]}}
                                             clickSafe={true}
                                             xTicksCount={1}
                                             xStep={1}
                                             xCrosshairDisabled={true}
                                             labels={{
                                               x: 20,
                                               y: 0,
                                               width: 50,
                                               height: 20,
                                               content: <Text text="x(n) ∗ h(t - n)" {...config.chartLabelText} />
                                             }}
                                             xDomain={[-1, 1]}
                                             yDomain={this.outputChartYDomain}
                                             datasets={{
                                               stepSignal: {
                                                 data: this.stepSignal.values(),
                                                 config: {
                                                   ...config.convolutionStepChart.rect,
                                                   width: this.stepChartWrapper.offsetWidth - 95,
                                                   offsetX: (this.stepChartWrapper.offsetWidth - 95) / 2
                                                 },
                                                 element: "bar"
                                               }
                                             }}/>
            }
          </div>

          <div id="kernel-chart-wrapper" ref={(elem) => this.kernelChartWrapper = elem}
               className={`col-4 ${styles.chartWrapper}`}>
            {this.kernelChartWrapper && <Chart wrapper={this.kernelChartWrapper}
                                               width={this.kernelChartWrapper.offsetWidth}
                                               height={this.kernelChartWrapper.offsetHeight}
                                               xAxisLabel={"t [ms]"}
                                               labelOffsets={{x: [20, 0], y: [0, 0]}}
                                               labels={{
                                                 x: 20,
                                                 y: 0,
                                                 width: 50,
                                                 height: 20,
                                                 content: <Text
                                                   text="Výstupní signál x(t)" {...config.chartLabelText} />
                                               }}
                                               xDomain={this.timeDomain}
                                               yDomain={[-1, 1]}
                                               datasets={{
                                                 kernelSignal: {
                                                   data: this.kernelSignal.values(),
                                                   config: config.convolutionKernelChart.line
                                                 }
                                               }}
                                               onContentMousedrag={(chart) => {
                                                 this.onChartDraw("kernelSignal", chart);
                                                 this.draggableChart.datasetPoints(`kernelSignalSampled`, this.kernelSignalSampled.values(null, true));
                                               }}
                                               onContentMouseup={this.onDrawableChartMouseUp.bind(this, "kernelSignal")}
                                               onContentMousedown={(chart) => {
                                                 this.onDrawableChartClick("kernelSignal", chart);
                                                 this.draggableChart.datasetPoints(`kernelSignalSampled`, this.kernelSignalSampled.values(null, true));
                                               }}/>
            }
          </div>

        </div>
        <div className={`row h-100 ${styles.chartRow}`}>
          <div id="output-chart-wrapper" ref={(elem) => this.outputChartWrapper = elem}
               className={`col-12 ${styles.chartWrapper}`}>
            {this.outputChartWrapper && <Chart ref={(chart) => this.outputChart = chart}
                                               wrapper={this.outputChartWrapper}
                                               width={this.outputChartWrapper.offsetWidth}
                                               height={this.outputChartWrapper.offsetHeight}
                                               xAxisLabel={"t [ms]"}
                                               labelOffsets={{x: [20, 0], y: [0, 0]}}
                                               yAxisLabel={"y(t)"}
                                               xTicksCount={21}
                                               labels={{
                                                 x: 20,
                                                 y: 0,
                                                 width: 50,
                                                 height: 20,
                                                 content: <Text ref={(text => this.outputChartOffsetLabel = text)}
                                                                text={`y(${offsetX}) = ∑ x(n) ∗ h(${offsetX} - n) = 0.00`} {...config.chartLabelText} />
                                               }}
                                               clickSafe={true}
                                               xDomain={this.outputChartXDomain}
                                               yDomain={this.outputChartYDomain}
                                               xStep={this.draggableStep}
                                               datasets={{
                                                 outputSignal: {
                                                   data: this.signalOutput.values(),
                                                   config: {
                                                     ...config.convolutionOutputChart.rect,
                                                     width: this.outputChartWrapper.offsetWidth / 21 - 10,
                                                     offsetX: (this.outputChartWrapper.offsetWidth / 21 - 10) / 2
                                                   },
                                                   element: "bar"
                                                 }
                                               }}/>
            }
          </div>
        </div>
        <div className={`row h-100 ${styles.chartRow}`}>
          <div id="draggable-chart-wrapper" ref={(elem) => this.draggableChartWrapper = elem}
               className={`col-12 ${styles.chartWrapper}`}>
            {this.draggableChartWrapper && <Chart ref={(chart) => this.draggableChart = chart}
                                                  wrapper={this.draggableChartWrapper}
                                                  width={this.draggableChartWrapper.offsetWidth}
                                                  height={this.draggableChartWrapper.offsetHeight}
                                                  xAxisLabel={"t [ms]"}
                                                  labelOffsets={{x: [20, 0], y: [0, 0]}}
                                                  xTicksCount={20}
                                                  labels={[
                                                    {
                                                      x: 20,
                                                      y: 0,
                                                      width: 50,
                                                      height: 20,
                                                      content: <Text
                                                        text={"Vzorkovaný h(t)"} {...config.chartLabelText} />
                                                    },
                                                    {
                                                      x: 120,
                                                      y: 0,
                                                      width: 50,
                                                      height: 20,
                                                      content: <Text
                                                        text={"Vzorkovaný x(t)"} {...config.chartLabelText} />
                                                    },
                                                    {
                                                      x: 220,
                                                      y: 0,
                                                      width: 50,
                                                      height: 20,
                                                      content: <Text
                                                        ref={(text => this.draggableChartOffsetLabel = text)}
                                                        text={`Zpoždění = ${offsetX}ms`} {...config.chartLabelText} />
                                                    }]}
                                                  clickSafe={true}
                                                  xStep={this.draggableStep}
                                                  xDomain={this.draggableTimeDomain}
                                                  yDomain={[-1, 1]}
                                                  datasets={{
                                                    inputSignalSampled: {
                                                      data: this.inputSignalSampled.values(null, true, true),
                                                      config: {
                                                        ...config.convolutionInputChart.rect,
                                                        width: this.draggableChartWrapper.offsetWidth / 21 - 10,
                                                        offsetX: (this.draggableChartWrapper.offsetWidth / 21 - 10) / 2
                                                      },
                                                      element: "bar"
                                                    },
                                                    kernelSignalSampled: {
                                                      data: this.kernelSignalSampled.values(),
                                                      config: {
                                                        ...config.convolutionKernelChart.rect,
                                                        width: this.draggableChartWrapper.offsetWidth / 21 - 10,
                                                        offsetX: (this.draggableChartWrapper.offsetWidth / 21 - 10) / 2
                                                      },
                                                      element: "bar"
                                                    },
                                                  }}/>
            }
          </div>
        </div>
        <div className={`row ${styles.chartRow}`} style={{height: 100}}>
          <div className={`col-12 ${styles.chartWrapper}`}>
            {this.draggableChartWrapper &&
            <Scroller
              progress={this.progress}
              onScroll={this.moveScroller.bind(this)}
              precision={3}
              width={this.draggableChartWrapper.offsetWidth}
              height={100}/>}
          </div>
        </div>
      </div>
    );
  }
}
