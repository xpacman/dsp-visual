import React from "react";
import {
  DropdownItem,
  DropdownMenu, DropdownToggle, FormGroup, Input, Label, Nav, Navbar, NavItem, NavLink,
  UncontrolledDropdown, Table
} from "reactstrap";
import styles from "./regression.scss";
import {Rect, Group, Text, Stage, Layer} from "react-konva";
import Konva from "konva";
import {max, min, extent} from "d3-array";
import {Chart} from "../../components";
import Signal from "../../partials/Signal";
import RegressionEngine from "../../utils/RegressionEngine";
import {findIndexOfNearest} from "../../utils/ArrayUtils";
import config from "../../config";

const initialAppState = {
  selectedApproximation: null,
  approxLevel: 1,
  displayLeastSquares: true,
  editingInputRowIndex: null
};


export default class Regression extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      dropdowns: {
        inputValues: false,
        approximation: false
      },
      ...initialAppState
    };

    // Time and value domain for signal
    this.timeDomain = [0, 10];
    this.yDomain = [0, 10];

    // Signal
    this.inputValues = new Signal([[0, 1], [2, 3], [5, 4], [6, 5], [8, 9], [9, 3]]);
    // Points to calculate approximation for -> each 0.01 x to make results smooth
    this.pointsToApproximate = new Signal();
    this.pointsToApproximate.generateValues(this.timeDomain[0], this.timeDomain[1], 0.01);
    this.approximationValues = []; // Approximation result points
    this.equation = null; // Approx. poly
    this.crosshairTime = 0; // Time user is pointing to
    this.approximationResult = 0; // Current approximation result
    this.leastSquares = [];

    // Refs
    this.wrappers = {}; // Object of wrappers (element refs) for charts
    this.dims = {}; // Object of dimensions for charts
    this.chart = null; // Chart ref
    this.equationsCanvas = {}; // Equations canvas ref
    this.equationText = null; // Equation text ref
    this.equationLabel = null; // Equation label ref
    this.equationResult = null; // Equation result text ref
    this.approximationCursor = null; // Circle which highlights current interpolated point
    this.leastSquaresRef = null; // Reference to least squares konva group
    this.leastSquaresSumText = null;
    this.editableInputRowX = null;
    this.editableInputRowY = null;
  }

  componentDidMount() {
    setTimeout(() => {
      // Delayed mount of konva components
      this.rescaleDimensions();
      this.setApproximationEquations(this.state.selectedApproximation);
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

  rescaleChart() {
    const offset = 2;
    this.timeDomain = extent(this.inputValues.values().map(point => Number(point[0])));
    this.timeDomain[0] = Math.floor(this.timeDomain[0]) - offset;
    this.timeDomain[1] = Math.floor(this.timeDomain[1]) + offset;
    this.yDomain = extent(this.inputValues.values().map(point => Number(point[1])));
    this.yDomain[0] = Math.floor(this.yDomain[0]) - offset;
    this.yDomain[1] = Math.floor(this.yDomain[1]) + offset;
    this.chart && this.chart.rescale({
      yDomain: this.yDomain,
      xDomain: this.timeDomain
    });
    this.pointsToApproximate.generateValues(this.timeDomain[0], this.timeDomain[1], 0.01);
    this.forceUpdate();
  }

  /**
   * Resets application to the initial state.
   */
  resetApplication(state = {}) {
    this.setState({...this.state, ...initialAppState, ...state});
    this.inputValues.values([]);
    this.approximationValues = [];
    this.equation = null;
    this.chart.datasetPoints("inputValues", []);
    this.chart.datasetPoints("approximation", []);
    this.setApproximationEquations(null, 1);
  }

  getLeastSquares(inputValues, approximationValues) {
    if (inputValues.length < 2 || approximationValues.length < 2) {
      return []
    }

    let size = 0,
      nearestApproxIndex = 0;
    const squares = [];

    inputValues.forEach(point => {
      nearestApproxIndex = findIndexOfNearest(approximationValues, (x => x[0]), point[0]);
      size = point[1] - approximationValues[nearestApproxIndex][1];
      squares.push({
        x: point[0],
        y: point[1],
        size: size,
        approxVal: approximationValues[nearestApproxIndex][1]
      })
    });
    return squares
  }

  renderLeastSquares(squares, visible = true) {
    if (this.chart !== null && this.leastSquaresRef !== null) {
      // Remove old squares
      this.leastSquaresRef.destroyChildren();

      // Render new ones
      squares.forEach((square, i) => {
        return (
          this.leastSquaresRef.add(
            new Konva.Rect({
              x: this.chart.xScale(square.x),
              y: this.chart.yScale(square.y),
              width: this.chart.yScale(square.y) - this.chart.yScale(square.approxVal),
              height: -(this.chart.yScale(square.y) - this.chart.yScale(square.approxVal)),
              stroke: "red",
              visible: visible
            })
          ));
      });
      this.chart.refreshLayer("points");
    }
  }

  getEditableInputRow(key, point = null) {
    return (
      <tr key={key}>
        <th scope="row">{key}</th>
        <td><Input innerRef={(input => {
          // Get ref
          this.editableInputRowX = input;
          // Set initial value
          if (input !== null && point !== null) {
            this.editableInputRowX.value = point[0];
          }
        })}
                   onChange={(event) => this.editableInputRowX.value = event.target.value}
                   type="number"/>
        </td>
        <td><Input innerRef={(input => {
          this.editableInputRowY = input;
          if (input !== null && point !== null) {
            this.editableInputRowY.value = point[1];
          }
        })} type="number"/></td>
        <td>
          <span className={`${styles.inputValuesRowActions} visible`} onClick={() => {
            const x = parseFloat(this.editableInputRowX.value),
              y = parseFloat(this.editableInputRowY.value);

            if (!isNaN(x) && !isNaN(y)) {
              point !== null && this.inputValues.removePoint(point[0]);
              // Update input values
              this.inputValues.setPoint(x, y);
              // Turn of editing
              this.setState({editingInputRowIndex: null});
              // Rescale chart
              this.rescaleChart();
            }
          }}>&#x2714;&nbsp;
          </span>
          <span className={`${styles.inputValuesRowActions} visible`} onClick={() => {
            this.setState({editingInputRowIndex: null})
          }}>&#x2718;
          </span>
        </td>
      </tr>)
  }

  getPolynomialApproximationMenuItems() {
    const items = [];
    // We support max 7th level poly approx.
    for (let i = 0; i < 7; i++) {
      items.push({
        label: `Polynom ${i + 1} stupně`,
        onClick: this.selectApproximation.bind(this, "poly", i + 1)
      })
    }
    return items;
  }

  selectApproximation(approx, level, state = {}) {
    this.setState({selectedApproximation: approx, approxLevel: level, ...state});
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
    chart.datasetPoints(signalName, this[signalName].values());
  }

  /**
   * Handles mouse up event upon drawable chart
   * @param signalName string name of the this variable containing signal which is being drawed
   * @param chart Chart class instance we are clicking in
   */
  onDrawableChartMouseUp(signalName, chart) {
    this.forceUpdate();
  }

  /**
   * Will set approximations equations to display
   * @param chosenApprox
   * @param level
   */
  setApproximationEquations(chosenApprox, level) {

    switch (chosenApprox) {
      case "poly":
        if (this.inputValues.values().length < 2)
          break;
        this.approximationValues = RegressionEngine.polynomialApproximation(this.inputValues.values(), level, this.pointsToApproximate.values());
        this.equation = RegressionEngine.getApproximationPolynomial(this.inputValues.values(), level);
        this.equationLabel && this.equationLabel.setAttr("text", `Aproximace polynomem ${level} stupně`);
        this.equationResult && this.equationResult.setAttr("text", `y(${this.crosshairTime}) = ${this.equation.solve(this.crosshairTime).toFixed(3)}`);
        this.equationText && this.equationText.setAttr("text", `y = ${this.equation.toString(true)}`);
        this.leastSquares = this.getLeastSquares(this.inputValues.values(), this.approximationValues);
        this.leastSquaresSumText && this.leastSquaresSumText.setAttr("text",
          `Součet chyb aproximace ${RegressionEngine.getPolyLeastSquaresEquationString(this.inputValues.values(), level)} = ${RegressionEngine.getPolyLeastSquaresSum(this.inputValues.values(), level).toFixed(3)}`);
        break;
      default:
        this.equationLabel && this.equationLabel.setAttr("text", "Zvolte aproximaci");
        this.equationResult && this.equationResult.setAttr("text", "");
        this.equationText && this.equationText.setAttr("text", "");
        this.leastSquaresSumText && this.leastSquaresSumText.setAttr("text", "");
        this.leastSquares = [];
        break;
    }

    this.chart && this.chart.refreshLayer("points");
    this.equationsCanvas.layer && this.equationsCanvas.layer.batchDraw();
  }

  render() {
    const {dropdowns, selectedApproximation, displayLeastSquares, approxLevel, editingInputRowIndex} = this.state;
    this.setApproximationEquations(selectedApproximation, approxLevel);
    this.renderLeastSquares(this.leastSquares, displayLeastSquares);

    return (
      <div className={styles.container}>
        <Navbar dark className={styles.navbar}>
          <Nav>
            <NavItem className="d-inline-flex align-items-center px-3">
              Lineární regrese
            </NavItem>

            <NavItem className="d-inline-flex align-items-center px-3">
              <NavLink href="#" className="nav-link pr-3" onClick={this.resetApplication.bind(this)}>Nová</NavLink>
            </NavItem>

            <UncontrolledDropdown nav inNavbar
                                  className="d-inline-flex align-items-center px-3"
                                  isOpen={dropdowns.approximation}
                                  toggle={this.toggleDropdown.bind(this, "approximation")}>
              <DropdownToggle nav caret>
                Aproximace
              </DropdownToggle>
              <DropdownMenu>
                {this.getPolynomialApproximationMenuItems().map((item, i) => (
                  <DropdownItem key={i} onClick={item.onClick}>
                    {item.label}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </UncontrolledDropdown>

            <NavItem className="d-inline-flex align-items-center px-3">
              <NavLink href="#" className="nav-link pr-3" onClick={() => {
                this.inputValues.generateValues(this.timeDomain[0], this.timeDomain[1], 1, (x) => this.inputValues.parseValue(Math.random() * (this.yDomain[1] - this.yDomain[0]) + this.yDomain[0], 3));
                this.forceUpdate();
              }}>Generuj hodnoty</NavLink>
            </NavItem>

            <FormGroup check
                       className="d-inline-flex align-items-center px-3">
              <Label check>
                <Input checked={displayLeastSquares}
                       onChange={() => this.setState({displayLeastSquares: !displayLeastSquares})}
                       type="checkbox"/>{' '}
                Zobrazovat nejmenší čtverce
              </Label>
            </FormGroup>

          </Nav>
        </Navbar>

        <div className={`row ${styles.h80} ${styles.chartRow}`}>
          <div id="regression-chart-wrapper" ref={(elem) => this.wrappers.chart = elem}
               className={`col-10 ${styles.chartWrapper}`}>
            {this.wrappers.chart && <Chart ref={(chart) => this.chart = chart}
                                           wrapper={this.wrappers.chart}
                                           width={this.dims.chart ? this.dims.chart[0] : 0}
                                           height={this.dims.chart ? this.dims.chart[1] : 0}
                                           xAxisLabel={"x"}
                                           yAxisLabel={"y(t)"}
                                           xDomain={this.timeDomain}
                                           yDomain={this.yDomain}
                                           datasets={{
                                             inputValues: {
                                               data: this.inputValues.values(),
                                               config: {
                                                 cross: config.pointCross,
                                                 dot: config.pointCircle
                                               },
                                               element: "cross"
                                             },
                                             approximation: {
                                               data: this.approximationValues,
                                               config: {
                                                 ...config.regressionChart.line,
                                               },
                                               element: "line"
                                             }
                                           }}
                                           onContentMousemove={(chart => {
                                             this.crosshairTime = chart.xCrosshairPosition();
                                             if (!chart.isDragging) {
                                               this.setApproximationEquations(selectedApproximation, approxLevel)
                                             }
                                           })}
                                           onContentMouseup={this.onDrawableChartMouseUp.bind(this, "inputValues")}
                                           onContentMousedown={(chart) => {
                                             this.onDrawableChartClick("inputValues", chart);
                                           }}>
              <Group ref={(grp => this.leastSquaresRef = grp)}/>
            </Chart>
            }
          </div>

          <div className={`col-2 ${styles.chartWrapper} ${styles.inputValuesPanel} h-100`}>
            <Table className={`${styles.inputValuesTable}`} striped>
              <thead>
              <tr>
                <th colSpan={4}>Vstupní hodnoty</th>
              </tr>
              <tr>
                <th>n</th>
                <th className="w-50 ">xₙ</th>
                <th className="w-50 ">yₙ(x)</th>
                <th>&#x270e;&nbsp;&#x2718;</th>
              </tr>
              </thead>
              <tbody>
              {this.inputValues.values().map((point, i) => {
                if (i === editingInputRowIndex) {
                  return this.getEditableInputRow(i, point)
                } else {
                  return (
                    <tr key={i} className={`${styles.inputValuesRow}`}>
                      <th scope="row">{i}</th>
                      <td className="w-50 ">{point[0]}</td>
                      <td className="w-50 ">{point[1]}</td>
                      <td>
                        <span className={`${styles.inputValuesRowActions}`} onClick={() => {
                          this.setState({editingInputRowIndex: i})
                        }}>&#x270e;&nbsp;</span>
                        <span className={`${styles.inputValuesRowActions}`} onClick={() => {
                          this.inputValues.removePoint(point[0]);
                          // Rescale chart
                          this.rescaleChart();
                        }}>&#x2718;</span>
                      </td>
                    </tr>
                  );
                }
              })}
              {editingInputRowIndex === this.inputValues.values().length ?
                this.getEditableInputRow(this.inputValues.values().length) :
                <tr className={`${styles.inputValuesRow} ${styles.inputValuesRowActions} visible`}>
                  <td colSpan={4} className="text-center"
                      onClick={() => this.setState({editingInputRowIndex: this.inputValues.values().length})}>
                    Přidat bod +
                  </td>
                </tr>
              }
              </tbody>
            </Table>
          </div>
        </div>

        <div className={`row ${styles.chartRow} ${styles.equationRow}`}>
          <div id="interpolation-equations-canvas-wrapper" ref={(elem) => this.wrappers.equationsCanvas = elem}
               className={`col-12 ${styles.chartWrapper}`}>
            <Stage ref={(stage => this.equationsCanvas.stage = stage)}
                   width={this.dims.equationsCanvas ? this.dims.equationsCanvas[0] : 0}
                   height={this.dims.equationsCanvas ? this.dims.equationsCanvas[1] : 0}>
              <Layer ref={(layer => this.equationsCanvas.layer = layer)}>
                <Text x={20} y={10} ref={(text => this.equationLabel = text)} {...config.equationText}/>
                <Text x={20} y={30} ref={(text => this.equationResult = text)} {...config.equationText}/>
                <Text x={20} y={50} ref={(text => this.equationText = text)} {...config.equationText}/>
                <Text x={20} y={70} ref={(text => this.leastSquaresSumText = text)} {...config.equationText}/>
              </Layer>
            </Stage>
          </div>
        </div>
      </div>
    );
  }
}
