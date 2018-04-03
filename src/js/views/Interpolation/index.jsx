import React from "react";
import {
  DropdownItem,
  DropdownMenu, DropdownToggle, FormGroup, Input, Label, Nav, Navbar, NavItem,
  UncontrolledDropdown
} from "reactstrap";
import styles from "./interpolation.scss";
import ChartManager from "../../utils/ChartManager";
import Signals from "../../utils/Signals";
import {TopOptionsBar, TopOptionsBarDropdownItem, TopOptionsBarItem} from "../../components";
import {Stage, Layer, Rect, Line, Text, Group, Circle} from "react-konva";
import {max, min} from "d3-array";
import {arrayEquals} from "../../utils/utils";
import InterpolationEngine from "../../utils/InterpolationEngine";
import config from "../../config";
import Konva from "konva";


export default class Interpolation extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      dropdowns: {
        inputValues: false,
        approximation: false,
        signals: false
      },
      inputValid: true,
      //inputValues: Signals.generateSinSignal()
      inputValues: [[1, 2], [2, 1.5], [2.5, 0.8], [4, 2.8]]
    };

    this.chartManager = new ChartManager({chartMargins: [0, 75, 65, 0]}); // This class holds information about canvas size, scales etc...
    this.xTickMargins = [20, 0];
    this.yTickMargins = [0, 20];
    // Refs
    this.inputValues = null; // Input values ref
    this.chartWrapper = null; // Chart wrapper ref
    this.stage = null; // Konva stage ref
    this.crosshairsLayer = null; // Crosshairs layer ref
    this.pointsLayer = null; // Points layer ref
    this.axisLayer = null; // Axes layer ref
    this.xTicks = []; // X Ticks refs
    this.yTicks = []; // Y Ticks refs
  }

  componentDidMount() {
    setTimeout(() => {
      // Delayed mount of konva chart
      this.forceUpdate();
      // Listen for window resizes
      window.addEventListener("resize", () => this.forceUpdate());
    }, 1000);

  }

  componentWillUpdate(nextProps, nextState) {
    // If canvas wrapper exists
    if (this.chartWrapper !== null) {
      // If dimensions or data has changed anyhow -> rescale
      if ((this.chartWrapper.offsetWidth !== this.chartManager.dimensions[0] || this.chartWrapper.offsetHeight !== this.chartManager.dimensions[1])
        || !arrayEquals(this.state.inputValues, nextState.inputValues)) {
        this.rescale(nextState.inputValues);
      }
    }
  }

  /**
   * Rescales canvas for new data
   * @param data
   */
  rescale(data) {
    this.chartManager.rescale(
      [this.chartWrapper.offsetWidth, this.chartWrapper.offsetHeight],
      [0, this.chartWrapper.offsetWidth - this.chartManager.chartMargins[1]],
      [min(data.map((d) => d[0])), max(data.map((d) => Math.abs(d[0])))],
      [this.chartWrapper.offsetHeight - this.chartManager.chartMargins[2], 0],
      [0, max(data.map((d) => Math.abs(d[1])))]
    );
    this.forceUpdate();
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
      points.push(this.chartManager.xScale(point[0]));
      points.push(this.chartManager.yScale(point[1]))
    });
    return points;
  }

  render() {
    const {dropdowns, inputValues, inputValid} = this.state;

    return (
      <div className={styles.container}
           onMouseMove={() => {
             // Crosshairs handling
             if (this.crosshairsLayer !== null && this.stage !== null) {
               const cursorPosition = this.stage.getStage().getPointerPosition();

               if (cursorPosition) {
                 const dimensionsWithMargins = [this.chartManager.dimensions[0] - this.chartManager.chartMargins[1] - this.chartManager.chartMargins[3], this.chartManager.dimensions[1] - this.chartManager.chartMargins[2]];
                 if (cursorPosition.x > dimensionsWithMargins[0]) {
                   cursorPosition.x = dimensionsWithMargins[0]
                 }

                 if (cursorPosition.y > dimensionsWithMargins[1]) {
                   cursorPosition.y = dimensionsWithMargins[1]
                 }

                 // Crosshair line and text are grouped for synchronized moving
                 const xCrosshairGroup = this.crosshairsLayer.getChildren()[0];
                 const yCrosshairGroup = this.crosshairsLayer.getChildren()[1];
                 xCrosshairGroup.setAttr("x", cursorPosition.x);
                 yCrosshairGroup.setAttr("y", cursorPosition.y);
                 const xText = xCrosshairGroup.getChildren()[1];
                 xText.setAttr("text", (this.chartManager.xDomain[1] * (100 / (this.chartManager.dimensions[0] - this.chartManager.chartMargins[1]) * xCrosshairGroup.getPosition().x) / 100).toFixed(2));
                 const yText = yCrosshairGroup.getChildren()[1];
                 //xText.setAttr("text", this.chartManager.xScale(xCrosshairGroup.getPosition().x));
                 this.crosshairsLayer.getLayer().batchDraw();

                 this.xTicks.map((tick, index) => {
                   // Crosshair is overlapping tick -> hide tick
                   if (tick) {

                     if (tick.x() >= cursorPosition.x - 30 && tick.x() <= cursorPosition.x + 40) {
                       this.xTicks[index].visible(false);
                     }

                     else {
                       this.xTicks[index].visible(true);
                     }
                   }
                 });

                 this.axisLayer.batchDraw();
               }
             }
           }}>
        <Navbar dark className={styles.navbar}>
          <Nav>
            <NavItem className="d-inline-flex align-items-center px-3 polyEquation"
                     ref={(elem) =>
                       document.querySelector(".polyEquation").innerHTML = "Newtonova interpolace p(x) = " + InterpolationEngine.getNewtonPolyEquation(inputValues)}>
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
                         defaultValue={inputValues.join()}
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

        <div id="interpolation-chart-wrapper" ref={(elem) => this.chartWrapper = elem} className="h-100 w-100">
          <Stage ref={(stage) => this.stage = stage}
                 width={this.chartManager.dimensions[0]}
                 height={this.chartManager.dimensions[1]}>
            <Layer ref={(layer) => this.gridLayer = layer}>
              {
                this.chartManager.getHorizontalGrid(10).map((grid, index) => {
                  return (
                    <Line key={index}
                          points={[this.chartManager.xScale(grid[0]), grid[1], this.chartManager.xScale(grid[2]), grid[3]]}
                          {...config.axisTickLine}
                    />)
                })
              }
              {
                this.chartManager.getVerticalGrid(10).map((grid, index) => {
                  return (
                    <Line key={index}
                          points={[grid[0], this.chartManager.yScale(grid[1]), grid[2], this.chartManager.yScale(grid[3])]}
                          {...config.axisTickLine}
                    />)
                })
              }
            </Layer>

            <Layer ref={(layer) => this.crosshairsLayer = layer}>
              <Group x={0}
                     y={0}>
                <Line points={[0, 0, 0, this.chartManager.dimensions[1] - this.chartManager.chartMargins[2]]}
                      {...config.crosshairLine}
                      name="xCrosshair"
                />
                <Text text={""}
                      x={0}
                      y={this.chartManager.dimensions[1] - this.chartManager.chartMargins[2] + this.xTickMargins[0]}
                      {...config.crosshairText}
                />
              </Group>
              <Group x={0}
                     y={0}>
                <Line points={[0, 0, this.chartManager.dimensions[0] - this.chartManager.chartMargins[1], 0]}
                      {...config.crosshairLine}
                      name="yCrosshair"
                />
                <Text text={""}
                      x={0}
                      y={0}
                      {...config.crosshairText}
                />
              </Group>
            </Layer>

            <Layer ref={(layer) => this.pointsLayer = layer}>
              {
                inputValues.map((point, index) => {
                  return (
                    <Group key={index} x={this.chartManager.xScale(point[0])} y={this.chartManager.yScale(point[1])}>
                      <Line points={[-10, 0, 10, 0]} {...config.pointCross}/>
                      <Line points={[0, -10, 0, 10]}{...config.pointCross}/>
                      <Circle {...config.pointCircle} x={0} y={0}/>
                    </Group>
                  );
                })
              }

              <Line {...config.signalLine} points={this.getPoints(inputValues)}/>

              <Line {...config.signalLine} stroke="red"
                    points={this.getPoints(InterpolationEngine.getZeroOrderHoldInterpolation(inputValues))}/>

              <Line {...config.signalLine} stroke="white"
                    points={this.getPoints(InterpolationEngine.newtonInterpolation(inputValues, (() => {
                      const ret = [];
                      for (let i = 0; i <= 100; i++)
                        ret.push(i * 0.1);
                      return ret
                    })()))}/>
            </Layer>

            <Layer ref={(layer) => this.axisLayer = layer}>
              <Rect {...config.axisBackground} x={this.chartManager.dimensions[0] - this.chartManager.chartMargins[1]}
                    y={0}
                    width={this.chartManager.chartMargins[1]}
                    height={this.chartManager.dimensions[1] - this.chartManager.chartMargins[2]}/>
              <Line
                points={[0, this.chartManager.dimensions[1] - this.chartManager.chartMargins[2], this.chartManager.dimensions[0], this.chartManager.dimensions[1] - this.chartManager.chartMargins[2]]}
                {...config.axisLine}
              />
              {
                this.chartManager.getHorizontalTicks(10).map((tick, index) => {
                  return (
                    <Text key={index}
                          text={tick[0]}
                          ref={(elem) => this.xTicks.push(elem)}
                          x={this.chartManager.xScale(tick[0])}
                          y={tick[1]}
                          offsetX={10}
                          offsetY={-20}
                          {...config.axisTick}
                    />);
                })
              }
              <Rect {...config.axisBackground} x={0} y={this.chartManager.dimensions[1]}
                    width={this.chartManager.dimensions[0]} height={this.chartManager.chartMargins[2]}/>
              <Line
                points={[this.chartManager.dimensions[0] - this.chartManager.chartMargins[1], 0, this.chartManager.dimensions[0] - this.chartManager.chartMargins[1], this.chartManager.dimensions[1]]}
                {...config.axisLine}
              />
              {
                this.chartManager.getVerticalTicks(10).map((tick, index) => {
                  return (
                    <Text key={index}
                          text={tick[1]}
                          ref={(elem) => this.yTicks.push(elem)}
                          x={tick[0]}
                          y={this.chartManager.yScale(tick[1])}
                          offsetX={-20}
                          offsetY={10}
                          {...config.axisTick}
                    />);
                })
              }
            </Layer>
          </Stage>
        </div>
      </div>
    );
  }
}
