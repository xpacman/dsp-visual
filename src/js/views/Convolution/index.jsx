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
import {Chart, Scroller} from "../../components";
import {max, min} from "d3-array";
import Signal from "../../partials/Signal";
import {findIndexOfNearest} from '../../utils/ArrayUtils';
import config from "../../config";


export default class Convolution extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      dropdowns: {
        inputValues: false,
        signals: false
      },
      inputValid: true,
      //inputValues: Signals.generateSinSignal()
      inputValues: {
        x: [[0, 2], [1, 3], [2, 1.5], [2.5, 0.8], [4, 2.8]], // x input signal
        h: [[0, 0], [1, 4], [2, 3], [2.5, 2], [4, 1]] // h kernel signal
      },
      samplingRate: 5 // Sampling frequency in Hz
    };

    // Slider progress
    this.progress = 0;
    // Convolution result
    this.result = [];
    this.outputChartXDomain = [-1, 3];
    this.outputChartYDomain = [-3, 3];

    // Signals
    this.timeDomain = [-1, 1]; // Time domain for signals
    this.draggableTimeDomain = [-2, 2]; // Time domain for dragging
    this.draggableStep = 0.2;
    this.kernelSignal = new Signal(); // Kernel signal
    this.inputSignal = new Signal(); // Input signal
    this.inputSignalSampled = new Signal([], this.draggableTimeDomain[0]); // Discrete input signal
    this.kernelSignalSampled = new Signal(); // Discrete kernel signal
    this.stepSignal = new Signal(); // Convolution step
    this.signalOutput = new Signal(); // Output (result) signal
    // Reset signals will set initial values
    this.resetSignals(true);

    // Refs
    this.inputValues = null; // Input values ref
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

  toggleDropdown(dropdown) {
    this.setState({dropdowns: {...this.state.dropdowns, [dropdown]: !this.state.dropdowns[dropdown]}})
  }

  setSignalPreset(signal) {
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

  /**
   * Resets application to the initial state. Empty result, scroller to zero, draggable chart to initial state
   */
  resetApplication() {
    this.resetSignals();
    this.result = [];
    // Reset draggable chart and scroller
    this.moveScroller(0);
    this.draggableChart.datasetPoints("kernelSignalSampled", this.kernelSignalSampled.values());
    this.forceUpdate();
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
    // Set points for both, this chart and draggable chart
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
    // Set points for both, this chart and draggable chart
    chart.datasetPoints(signalName, this[signalName].values());
  }

  /**
   * Handles mouse up event upon drawable chart
   * @param signalName string name of the this variable containing signal which is being drawed
   * @param chart Chart class instance we are clicking in
   */
  onDrawableChartMouseUp(signalName, chart) {
    // Compute convolution on mouse up, save values as array
    this.result = ConvolutionEngine.convolution(this.inputSignalSampled.values(), this.kernelSignalSampled.values());
    // Convolution returns samples going from 0 time, we have to set time offset here
    const xMin = this.inputSignalSampled.xDomain()[0];
    let xMax = 0;
    this.result.map((sample, i) => {
      sample[0] = (new Decimal(xMin + i * this.draggableStep)).toFixed(2);
      xMax = sample[0];
    });
    // Rescale output chart for new result values
    this.outputChartXDomain = [xMin, xMax];
    this.outputChartYDomain = [-3, 3];
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
    this.draggableChartOffsetLabel.setAttr("text", `t = ${offsetX.toFixed(2)}`);
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
    const {dropdowns, inputValues, inputValid, samplingRate} = this.state,
      offsetX = this.inputSignalSampled.timeOffset();

    return (
      <div className={styles.container}>
        <Navbar dark className={styles.navbar}>
          <Nav>
            <NavItem className="d-inline-flex align-items-center px-3 polyEquation">
              Diskrétní lineární konvoluce
            </NavItem>
            <UncontrolledDropdown nav inNavbar
                                  className="d-inline-flex align-items-center px-3"
                                  isOpen={dropdowns.signals}
                                  toggle={this.toggleDropdown.bind(this, "signals")}>
              <DropdownToggle nav caret>
                Signál
              </DropdownToggle>
              <DropdownMenu >
                <DropdownItem onClick={this.setSignalPreset.bind(this, "sin")}>
                  Sinusový
                </DropdownItem>
                <DropdownItem>
                  Diracův impuls
                </DropdownItem>
                <DropdownItem>
                  Exponenciála nahoru
                </DropdownItem>
                <DropdownItem>
                  Exponenciála dolů
                </DropdownItem>
              </DropdownMenu>
            </UncontrolledDropdown>
            <UncontrolledDropdown nav inNavbar
                                  className="d-inline-flex align-items-center px-3"
                                  isOpen={dropdowns.inputValues}
                                  toggle={this.toggleDropdown.bind(this, "inputValues")}>
              <DropdownToggle nav caret>
                Vstupní hodnoty
              </DropdownToggle>
              <DropdownMenu className="px-3">
                <FormGroup>
                  <Label for="exampleText">Vstupní hodnoty x1,y1,...</Label>
                  <Input placeholder="x1, y1, x2, y2,..."
                         type="textarea"
                         innerRef={(input) => this.inputValues = input}
                         defaultValue={inputValues.x.join()}
                         onChange={(event) => this.inputValues.value = event.target.value}
                         onBlur={() => {
                           // Because we are processing points as array of arrays in our engine [[x1, y1],...]
                           // we need to make this array of arrays from string input
                           const input = this.inputValues.value.split(",");

                           // Check count of the values
                           if (input.length % 2 === 0 && input.length >= 4) {

                             const values = [];
                             input.map((item, index) => {
                               if (index % 2 === 0) {
                                 values.push([parseFloat(item, 10), parseFloat(input[index + 1], 10)])
                               }
                             });

                             // All is good => set values to state
                             if (values.find((element) => isNaN(element[0]) || isNaN(element[1])) === undefined) {
                               this.setState({inputValues: values, inputValid: true});
                               return true;
                             }
                           }

                           this.setState({inputValid: false});
                           return 0;
                         }}
                  />
                </FormGroup>
              </DropdownMenu>
            </UncontrolledDropdown>
          </Nav>
        </Navbar>

        <div className={`row h-100 ${styles.chartRow}`}>
          <div id="input-chart-wrapper" ref={(elem) => this.inputChartWrapper = elem}
               className={`col-4 ${styles.chartWrapper}`}>
            {this.inputChartWrapper && <Chart ref={(chart) => this.inputChart = chart}
                                              wrapper={this.inputChartWrapper}
                                              width={this.inputChartWrapper.offsetWidth}
                                              height={this.inputChartWrapper.offsetHeight}
                                              xAxisLabel={"t"}
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
                                             xAxisLabel={"t"}
                                             clickSafe={true}
                                             xTicksCount={2}
                                             xStep={1}
                                             labels={{
                                               x: 20,
                                               y: 0,
                                               width: 50,
                                               height: 20,
                                               content: <Text text="x(n) ∗ h(t - n)" {...config.chartLabelText} />
                                             }}
                                             xDomain={this.timeDomain}
                                             yDomain={this.outputChartYDomain}
                                             datasets={{
                                               stepSignal: {
                                                 data: this.stepSignal.values(),
                                                 config: {
                                                   ...config.convolutionStepChart.rect,
                                                   width: this.stepChartWrapper.offsetWidth - 95,
                                                   offsetX: (this.stepChartWrapper.offsetWidth - 95) / 2
                                                 },
                                                 element: "rect"
                                               }
                                             }}/>
            }
          </div>

          <div id="kernel-chart-wrapper" ref={(elem) => this.kernelChartWrapper = elem}
               className={`col-4 ${styles.chartWrapper}`}>
            {this.kernelChartWrapper && <Chart wrapper={this.kernelChartWrapper}
                                               width={this.kernelChartWrapper.offsetWidth}
                                               height={this.kernelChartWrapper.offsetHeight}
                                               xAxisLabel={"t"}
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
                                               xAxisLabel={"t"}
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
                                                   element: "rect"
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
                                                  xAxisLabel={"t"}
                                                  xTicksCount={20}
                                                  labels={[{
                                                    x: 20,
                                                    y: 0,
                                                    width: 50,
                                                    height: 20,
                                                    content: <Text ref={(text => this.draggableChartOffsetLabel = text)}
                                                                   text={`t = ${offsetX}`} {...config.chartLabelText} />
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
                                                      element: "rect"
                                                    },
                                                    kernelSignalSampled: {
                                                      data: this.kernelSignalSampled.values(),
                                                      config: {
                                                        ...config.convolutionKernelChart.rect,
                                                        width: this.draggableChartWrapper.offsetWidth / 21 - 10,
                                                        offsetX: (this.draggableChartWrapper.offsetWidth / 21 - 10) / 2
                                                      },
                                                      element: "rect"
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
