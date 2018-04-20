import React from "react";
import {
  DropdownItem,
  DropdownMenu, DropdownToggle, FormGroup, Input, Label, Nav, Navbar, NavItem,
  UncontrolledDropdown
} from "reactstrap";
import styles from "./convolution.scss";
import Signals from "../../utils/Signals";
import ConvolutionEngine from "../../utils/ConvolutionEngine";
import {Chart, Scroller} from "../../components";
import {max, min} from "d3-array";
import Signal from "../../partials/Signal";
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
      }
    };

    // Signals
    this.timeDomain = [-10, 10]; // Time domain for signals
    this.signalH = new Signal(-2, 2); // Kernel signal
    this.signalX = new Signal(-2, 2, 0.01, null, null, this.timeDomain[0]); // Input signal
    this.signalOutput = new Signal(-1, 1); // Output (result) signal

    // Refs
    this.inputValues = null; // Input values ref
    this.kernelChartWrapper = null; // Kernel Chart wrapper ref
    this.inputChartWrapper = null; // Input Chart wrapper ref
    this.outputChartWrapper = null; // Output Chart wrapper ref
    this.stepChartWrapper = null; // Step Chart wrapper ref
    this.draggableChartWrapper = null; // Draggable Chart wrapper ref
    this.draggableChart = null; // Draggable Chart
    this.outputChart = null; // Output Chart
    this.stepChart = null; // Output Chart
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
    this.setState({inputValues: Signals.generateSinSignal()})
  }

  /**
   * Handles scroller move
   * @param position number percentual position of x
   **/
  moveScroller(position) {
    // Set time offset of signal
    this.signalX.timeOffset((position * (this.timeDomain[1] - this.timeDomain[0]) / 100) + this.timeDomain[0]);
    this.draggableChart.datasetPoints("inputSignal", this.signalX.values(null, true));
    this.signalOutput = ConvolutionEngine.convolution(this.signalX, this.signalH);
    this.outputChart.rescale({yDomain: [-50, 50]});
    this.outputChart.datasetPoints("outputSignal", this.signalOutput.values());
  }

  render() {
    const {dropdowns, inputValues, inputValid} = this.state;

    return (
      <div className={styles.container}>
        <Navbar dark className={styles.navbar}>
          <Nav>
            <NavItem className="d-inline-flex align-items-center px-3 polyEquation">
              test
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
                                              xDomain={[-2, 2]}
                                              yDomain={[-2, 2]}
                                              datasets={{inputSignal: this.signalX.values()}}
                                              config={{inputSignal: config.convolutionInputChart.line}}
                                              onContentMousedrag={(chart) => {
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
                                                const pointsToSet = this.signalX.getPointsInRange(min, max);
                                                // Set the points
                                                pointsToSet.forEach(point => this.signalX.setPoint(point[0], chart.getCordYValue(chart.pointerPosition.y)));
                                                // Set points for both, input chart and draggable chart
                                                chart.datasetPoints("inputSignal", this.signalX.values());
                                                this.draggableChart.datasetPoints("inputSignal", this.signalX.values(null, true));
                                              }}
                                              onContentMousedown={(chart) => {
                                                const pointerPos = chart.pointerPosition,
                                                  newPoint = this.signalX.setPoint(chart.getCordXValue(pointerPos.x, 3), chart.getCordYValue(pointerPos.y, 3));
                                                this.signalX.setPoint(newPoint[0], newPoint[1]);

                                                // Set points for both, input chart and draggable chart
                                                chart.datasetPoints("inputSignal", this.signalX.values());
                                                this.draggableChart.datasetPoints("inputSignal", this.signalX.values(null, true));
                                              }}/>
            }
          </div>

          <div id="step-chart-wrapper" ref={(elem) => this.stepChartWrapper = elem}
               className={`col-4 ${styles.chartWrapper}`}>
            {this.stepChartWrapper && <Chart ref={(chart) => this.stepChart = chart}
                                             wrapper={this.stepChartWrapper}
                                             width={this.stepChartWrapper.offsetWidth}
                                             height={this.stepChartWrapper.offsetHeight}
                                             xDomain={[-2, 2]}
                                             yDomain={[-2, 2]}/>
            }
          </div>

          <div id="kernel-chart-wrapper" ref={(elem) => this.kernelChartWrapper = elem}
               className={`col-4 ${styles.chartWrapper}`}>
            {this.kernelChartWrapper && <Chart wrapper={this.kernelChartWrapper}
                                               width={this.kernelChartWrapper.offsetWidth}
                                               height={this.kernelChartWrapper.offsetHeight}
                                               xDomain={[-2, 2]}
                                               yDomain={[-2, 2]}
                                               datasets={{kernelSignal: this.signalH.values()}}
                                               config={{kernelSignal: config.convolutionKernelChart.line}}
                                               onContentMousedrag={(chart) => {
                                                 // TODO: CHECK IF SUBSTRACTING GIVES RELEVANT VALUES (AFTER RESIZING)
                                                 let min = chart.getCordXValue(chart.lastPointerPosition.x);
                                                 let max = chart.getCordXValue(chart.pointerPosition.x);

                                                 // If user drags from right to left, swap values
                                                 if (min > max) {
                                                   const tmp = min;
                                                   min = max;
                                                   max = tmp;
                                                 }

                                                 // Determine which points to set (handles situation when user drags mouse too fast)
                                                 const pointsToSet = this.signalH.getPointsInRange(min, max);
                                                 // Set the points
                                                 pointsToSet.forEach(point => this.signalH.setPoint(point[0], chart.getCordYValue(chart.pointerPosition.y)));
                                                 // Set points for both, kernel chart and draggable chart
                                                 chart.datasetPoints("kernelSignal", this.signalH.values());
                                                 this.draggableChart.datasetPoints("kernelSignal", this.signalH.values());
                                               }}
                                               onContentMousedown={(chart) => {
                                                 const pointerPos = chart.pointerPosition,
                                                   newPoint = this.signalH.setPoint(chart.getCordXValue(pointerPos.x, 3), chart.getCordYValue(pointerPos.y, 3));
                                                 this.signalH.setPoint(newPoint[0], newPoint[1]);

                                                 // Set points for both, kernel chart and draggable chart
                                                 chart.datasetPoints("kernelSignal", this.signalH.values());
                                                 this.draggableChart.datasetPoints("kernelSignal", this.signalH.values());
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
                                               xDomain={[0, 800]}
                                               yDomain={[-10, 10]}
                                               datasets={{outputSignal: this.signalOutput.values()}}
                                               config={{outputSignal: config.convolutionOutputChart.line}}
            />
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
                                                  xDomain={this.timeDomain}
                                                  yDomain={[-2, 2]}
                                                  datasets={{
                                                    inputSignal: this.signalX.values(null, true),
                                                    kernelSignal: this.signalH.values()
                                                  }}
                                                  config={{
                                                    inputSignal: config.convolutionInputChart.line,
                                                    kernelSignal: config.convolutionKernelChart.line
                                                  }}/>
            }
          </div>
        </div>
        <div className={`row ${styles.chartRow}`} style={{height: 100}}>
          <div className={`col-12 ${styles.chartWrapper}`}>
            {this.draggableChartWrapper &&
            <Scroller
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
