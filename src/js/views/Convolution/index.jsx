import React from "react";
import {
  DropdownItem,
  DropdownMenu, DropdownToggle, FormGroup, Input, Label, Nav, Navbar, NavItem,
  UncontrolledDropdown
} from "reactstrap";
import styles from "./convolution.scss";
import Signals from "../../utils/Signals";
import {TopOptionsBar, TopOptionsBarDropdownItem, TopOptionsBarItem} from "../../components";
import {max, min} from "d3-array";
import Signal from "../../partials/Signal";
import Chart from "../../partials/Chart";
import config from "../../config";
import Konva from "konva";


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
    this.signalH = null; // Kernel signal
    this.signalX = null; // Input signal
    this.signalOutput = null; // Output (result) signal

    this.isPaint = false; // Canvas hand drawing
    this.lastPointerPosition = null;

    // Refs
    this.inputValues = null; // Input values ref
    this.kernelChartWrapper = null; // Kernel Chart wrapper ref
    this.inputChartWrapper = null; // Input Chart wrapper ref
    this.outputChartWrapper = null; // Output Chart wrapper ref
    this.stepChartWrapper = null; // Step Chart wrapper ref
    this.draggableChartWrapper = null; // Draggable Chart wrapper ref
    this.kernelChart = null; // Kernel Chart ref
    this.outputChart = null; // Output Chart ref
    this.inputChart = null; // Input Chart ref
    this.stepChart = null; // Step Chart ref
    this.draggableChart = null; // Draggable Chart ref
  }

  componentDidMount() {
    setTimeout(() => {
      // Delayed mount of konva components
      this.forceUpdate();
      // Listen for window resizes
      window.addEventListener("resize", () => this.forceUpdate());
    })
  }

  toggleDropdown(dropdown) {
    this.setState({dropdowns: {...this.state.dropdowns, [dropdown]: !this.state.dropdowns[dropdown]}})
  }

  setSignalPreset(signal) {
    this.setState({inputValues: Signals.generateSinSignal()})
  }

  /**
   * Returns points for konva [x1, y1, x2, y2] (flattens an array of input values and scales them for canvas)
   * @param inputValues Array of arrays [[x1, y1],...]
   * @return {Array}
   */
  getPoints(inputValues) {
    const points = [];
    inputValues.map((point) => {
      points.push(this.kernelChart.xScale(point[0]));
      points.push(this.kernelChart.yScale(point[1]))
    });
    return points;
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
          <div id="kernel-chart-wrapper" ref={(elem) => this.kernelChartWrapper = elem}
               className={`col-4 ${styles.chartWrapper}`}>
            {this.kernelChartWrapper && <Chart ref={(chart) => this.kernelChart = chart}
                                               wrapper={this.kernelChartWrapper}
                                               width={this.kernelChartWrapper.offsetWidth}
                                               height={this.kernelChartWrapper.offsetHeight}
                                               xDomain={[0, 5]}
                                               yDomain={[-2, 2]}
                                               onContentRender={(chart) => {
                                                 const stage = chart.canvas.stage(),
                                                   layer = chart.canvas.getLayer("pointsLayer"),
                                                   canvas = chart.getCanvas(),
                                                   context = chart.getContext();

                                                 // Set attributes for canvas
                                                 canvas.width = chart.trimDims[0];
                                                 canvas.height = chart.trimDims[1];

                                                 // Create plot image for free drawing
                                                 chart.canvas.createPlotImage("pointsLayer", {
                                                   stroke: 'green',
                                                   shadowBlur: 5
                                                 });

                                                 context.strokeStyle = "#df4b26";
                                                 context.lineWidth = 5;
                                                 context.lineJoin = "round";

                                                 // Redraw
                                                 stage.draw();

                                                 this.lastPointerPosition = {
                                                   x: chart.xScale(0),
                                                   y: chart.yScale(0)
                                                 };

                                                 /*
                                                  Beznákovic dívka, jo, tu mám rád. Při myšlence na ni, chce se mi začít smát...a taky řvát, že po tom všem, znovu ji musím psát,
                                                  */

                                                 // Prepare signal
                                                 this.signalH = new Signal(chart.props.xDomain[0], chart.props.xDomain[1]);
                                                 context.globalCompositeOperation = 'source-over';
                                                 context.beginPath();
                                                 context.moveTo(this.lastPointerPosition.x, this.lastPointerPosition.y);
                                                 this.signalH.values().forEach((point => {
                                                     context.lineTo(chart.xScale(point[0]), chart.yScale(point[1]));
                                                   }
                                                 ));
                                                 context.closePath();
                                                 context.stroke();
                                                 layer.draw();
                                               }}
                                               onContentMousemove={(chart) => {
                                                 if (!this.isPaint) {
                                                   return;
                                                 }

                                                 const stage = chart.canvas.stage(),
                                                   image = chart.getPlotImage(),
                                                   context = chart.getContext(),
                                                   layer = chart.canvas.getLayer("pointsLayer");

                                                 let localPos = {
                                                   x: this.lastPointerPosition.x - image.x(),
                                                   y: this.lastPointerPosition.y - image.y()
                                                 };
                                                 let min = chart.getCordXValue(localPos.x);
                                                 const pos = stage.getPointerPosition();
                                                 localPos = {
                                                   x: pos.x - image.x(),
                                                   y: pos.y - image.y()
                                                 };
                                                 let max = chart.getCordXValue(localPos.x);

                                                 // If user drags from right to left, swap values
                                                 if (min > max) {
                                                   const tmp = min;
                                                   min = max;
                                                   max = tmp;
                                                 }
                                                 // Determine which points to set (handles situation when user drags mouse too fast)
                                                 const pointsToSet = this.signalH.getPointsInRange(min, max);
                                                 context.beginPath();
                                                 // Clear canvas before drawing
                                                 chart.canvas.clear();
                                                 // Set the points
                                                 pointsToSet.forEach(point => this.signalH.setPoint(point[0], chart.getCordYValue(localPos.y)));
                                                 // Finally render points
                                                 this.signalH.values().forEach(point =>
                                                   context.lineTo(chart.xScale(point[0]), chart.yScale(point[1])));
                                                 context.stroke();

                                                 this.lastPointerPosition = pos;
                                                 layer.draw();
                                               }}
                                               onContentMouseup={(chart) => {
                                                 this.isPaint = false;
                                               }}
                                               onContentMousedown={(chart) => {
                                                 this.isPaint = true;
                                                 const pointerPos = chart.canvas.stage().getPointerPosition(),
                                                   context = chart.canvas.getContext(),
                                                   layer = chart.canvas.getLayer("pointsLayer");

                                                 // Clear canvas before drawing
                                                 chart.canvas.clear();
                                                 context.beginPath();
                                                 const newPoint = this.signalH.setPoint(chart.getCordXValue(pointerPos.x, 3), chart.getCordYValue(pointerPos.y, 3));
                                                 this.signalH.setPoint(newPoint[0], newPoint[1]);
                                                 this.signalH.values().forEach(point =>
                                                   context.lineTo(chart.xScale(point[0]), chart.yScale(point[1])));
                                                 context.stroke();
                                                 layer.draw();
                                                 this.lastPointerPosition = pointerPos;
                                               }}
            />
            }
          </div>
          <div id="output-chart-wrapper" ref={(elem) => this.outputChartWrapper = elem}
               className={`col-4 ${styles.chartWrapper}`}>
            {this.outputChartWrapper && <Chart ref={(chart) => this.outputChart = chart}
                                               wrapper={this.outputChartWrapper}
                                               width={this.outputChartWrapper.offsetWidth}
                                               height={this.outputChartWrapper.offsetHeight}
                                               xDomain={[0, 5]}
                                               yDomain={[-2, 2]}/>
            }
          </div>
          <div id="input-chart-wrapper" ref={(elem) => this.inputChartWrapper = elem}
               className={`col-4 ${styles.chartWrapper}`}>
            {this.inputChartWrapper && <Chart ref={(chart) => this.inputChart = chart}
                                              wrapper={this.inputChartWrapper}
                                              width={this.inputChartWrapper.offsetWidth}
                                              height={this.inputChartWrapper.offsetHeight}
                                              xDomain={[0, 5]}
                                              yDomain={[-2, 2]}/>
            }
          </div>
        </div>
        <div className={`row h-100 ${styles.chartRow}`}>
          <div id="step-chart-wrapper" ref={(elem) => this.stepChartWrapper = elem}
               className={`col-12 ${styles.chartWrapper}`}>
            {this.stepChartWrapper && <Chart ref={(chart) => this.stepChart = chart}
                                             wrapper={this.stepChartWrapper}
                                             width={this.stepChartWrapper.offsetWidth}
                                             height={this.stepChartWrapper.offsetHeight}
                                             xDomain={[0, 5]}
                                             yDomain={[-2, 2]}/>
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
                                                  xDomain={[0, 5]}
                                                  yDomain={[-2, 2]}/>
            }
          </div>
        </div>
      </div>
    );
  }
}
