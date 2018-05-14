import React from "react";
import {
  DropdownItem,
  DropdownMenu, DropdownToggle, FormGroup, Input, Label, Nav, Navbar, NavItem, NavLink,
  UncontrolledDropdown
} from "reactstrap";
import styles from "./regression.scss";
import {Rect} from "react-konva";
import {max, min} from "d3-array";
import {Chart} from "../../components";
import Signal from "../../partials/Signal";
import RegressionEngine from "../../utils/RegressionEngine";
import InterpolationEngine from "../../utils/InterpolationEngine";
import {findIndexOfNearest} from "../../utils/ArrayUtils";
import config from "../../config";


export default class Regression extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      dropdowns: {
        inputValues: false,
        approximation: false
      },
      selectedApproximation: 'line',
      displayLeastSquares: true
    };

    // Time and value domain for signal
    this.timeDomain = [0, 10];
    this.yDomain = [0, 10];

    // Signal
    this.inputSignal = new Signal([[0, 1], [2, 3], [5, 4], [6, 5], [8, 9], [9, 3]]);

    // Refs
    this.chartWrapper = null; // Chart wrapper ref
    this.chart = null; // Chart ref
  }

  componentDidMount() {
    setTimeout(() => {
      // Delayed mount of konva chart
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

  selectApproximation(approximation) {
    this.setState({selectedApproximation: approximation})
  }

  /**
   * Resets application to the initial state.
   */
  resetApplication(state = {}) {
    this.setState({...this.state, ...state});
    this.inputSignal.values([]);
    this.chart.datasetPoints("inputSignal", []);
    this.chart.datasetPoints("approximation", []);
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

  render() {
    const {dropdowns, selectedApproximation, displayLeastSquares} = this.state;
    let approxLabel = "",
      equation = "",
      leastSquares = [],
      leastSquaresSum = 0,
      approx = [],
      approxSignal = new Signal();

    switch (selectedApproximation) {
      // TODO: REMOVE THIS FUCKING SHIT
      case 'line':
        approxLabel = "Přímka";
        equation = RegressionEngine.getLineEquation(this.inputSignal.values());
        approxSignal.values(RegressionEngine.getLineApproximation(this.inputSignal.values()));
        leastSquares = this.getLeastSquares(this.inputSignal.values(), approxSignal.values());
        leastSquaresSum = RegressionEngine.getLineLeastSquares(this.inputSignal.values());
        break;
      case 'parabola':
        approxLabel = "Parabola";
        equation = RegressionEngine.getParabolaEquation(this.inputSignal.values());
        approx = RegressionEngine.getParabolaApproximation(this.inputSignal.values());
        if (approx.length >= 2) {
          // To make parabola smooth, use newton interpolation
          approxSignal.generateValues(approx[0][0], approx[approx.length - 1][0], 0.1);
          approx = InterpolationEngine.newtonInterpolation(approx, InterpolationEngine.splitPoints(approxSignal.values())[0]);
        }
        approxSignal.values(approx);
        leastSquares = this.getLeastSquares(this.inputSignal.values(), approxSignal.values());
        leastSquaresSum = RegressionEngine.getParabolaLeastSquares(this.inputSignal.values());
        break;
      case 'exponential':
        approxLabel = "Exponenciála";
        equation = RegressionEngine.getExponentialEquation(this.inputSignal.values());
        approx = RegressionEngine.getExponentialApproximation(this.inputSignal.values());
        if (approx.length >= 2) {
          // To make parabola smooth, use newton interpolation
          approxSignal.generateValues(approx[0][0], approx[approx.length - 1][0], 0.1);
          approx = InterpolationEngine.newtonInterpolation(approx, InterpolationEngine.splitPoints(approxSignal.values())[0]);
        }
        approxSignal.values(approx);
        leastSquares = this.getLeastSquares(this.inputSignal.values(), approxSignal.values());
        leastSquares.forEach(square => leastSquaresSum += Math.pow(square.size, 2));
        break;
      default:
        break;
    }

    /*
     <Layer ref={(layer) => this.pointsLayer = layer}>
     {

     {displayLeastSquares &&
     <Rect x={xShift} y={yShift}
     fillLinearGradientStartPoint={{x: 0, y: 0}}
     fillLinearGradientEndPoint={{x: Math.abs(leastSquareSize), y: Math.abs(leastSquareSize)}}
     {...config.leastSquares}
     width={Math.abs(leastSquareSize)}
     height={Math.abs(leastSquareSize)}/>
     }
     </Group>
     )
     })
     }

     <Line {...approxLineProps} points={this.getPoints(approxLineProps.points)}/>
     </Layer>
     */

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
                Aproximace {`${approxLabel}`}
              </DropdownToggle>
              <DropdownMenu >
                <DropdownItem onClick={this.selectApproximation.bind(this, "line")}>
                  Přímka
                </DropdownItem>
                <DropdownItem onClick={this.selectApproximation.bind(this, "parabola")}>
                  Parabola
                </DropdownItem>
                <DropdownItem onClick={this.selectApproximation.bind(this, "exponential")}>
                  Exponenciála
                </DropdownItem>
              </DropdownMenu>
            </UncontrolledDropdown>

            <FormGroup check
                       className="d-inline-flex align-items-center px-3">
              <Label check>
                <Input checked={displayLeastSquares}
                       onChange={() => this.setState({displayLeastSquares: !displayLeastSquares})}
                       type="checkbox"/>{' '}
                Zobrazovat nejmenší čtverce
              </Label>
            </FormGroup>

            <NavItem className="d-inline-flex align-items-center px-3">
              {equation}
            </NavItem>

            <NavItem className="d-inline-flex align-items-center px-3">
              p<sup>2</sup> = {leastSquaresSum ? leastSquaresSum.toFixed(3) : 0}
            </NavItem>
          </Nav>
        </Navbar>

        <div className={`row h-100 ${styles.chartRow}`}>
          <div id="regression-chart-wrapper" ref={(elem) => this.chartWrapper = elem}
               className={`col-12 ${styles.chartWrapper}`}>
            {this.chartWrapper && <Chart ref={(chart) => this.chart = chart}
                                         wrapper={this.chartWrapper}
                                         width={this.chartWrapper.offsetWidth}
                                         height={this.chartWrapper.offsetHeight}
                                         xAxisLabel={"x"}
                                         yAxisLabel={"y"}
                                         xDomain={this.timeDomain}
                                         yDomain={this.yDomain}
                                         datasets={{
                                           inputSignal: {
                                             data: this.inputSignal.values(),
                                             config: {
                                               cross: config.pointCross,
                                               dot: config.pointCircle
                                             },
                                             element: "cross"
                                           },
                                           approximation: {
                                             data: approxSignal.values(),
                                             config: {
                                               ...config.regressionChart.line,
                                             },
                                             element: "line"
                                           }
                                         }}
                                         onContentMouseup={this.onDrawableChartMouseUp.bind(this, "inputSignal")}
                                         onContentMousedown={(chart) => {
                                           this.onDrawableChartClick("inputSignal", chart);
                                         }}>
              {(chart) =>
              displayLeastSquares && leastSquares.map((square, i) => {
                return (
                  <Rect key={i}
                        x={chart.xScale(square.x)}
                        y={chart.yScale(square.y)}
                        width={chart.yScale(square.y) - chart.yScale(square.approxVal)}
                        height={-(chart.yScale(square.y) - chart.yScale(square.approxVal))}
                        stroke="red"
                        fill="rgba(255, 50, 50, 0.6)"
                  />);
              })
              }
            </Chart>
            }
          </div>
        </div>
      </div>
    );
  }
}
