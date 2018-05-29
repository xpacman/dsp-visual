import React from "react";
import {
  DropdownItem,
  DropdownMenu, DropdownToggle, FormGroup, Input, Label, Nav, Navbar, NavItem,
  UncontrolledDropdown, NavLink
} from "reactstrap";
import styles from "./interpolation.scss";
import Signal from "../../partials/Signal";
const Decimal = require('decimal.js-light');
import {TopOptionsBar, TopOptionsBarDropdownItem, TopOptionsBarItem, Chart} from "../../components";
import * as Presets from "../../partials/SignalPresets";
import {Text, Stage, Layer, Circle} from "react-konva";
import {max, min} from "d3-array";
import InterpolationEngine from "../../utils/InterpolationEngine";
import config from "../../config";

const initialState = {
  display: {
    originalSignal: true,
    originalSampled: true,
    zeroOrderHold: false,
    firstOrderHold: false,
    newton: false
  }
};

export default class Interpolation extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      dropdowns: {
        samplingRate: false,
        signals: false
      },
      display: initialState.display,
      chosenInterpolation: null,
      samplingRate: 1 // Sampling frequency in Hz
    };

    // Signals
    this.timeDomain = [0, 14];
    this.originalSignal = Presets.getSinSignal(this.timeDomain[0], this.timeDomain[1]);
    this.yDomain = this.originalSignal.getYDomain();
    this.originalSampled = new Signal(Signal.getSamples(this.state.samplingRate, this.originalSignal));

    this.crosshairTime = 0; // Time user is pointing to
    this.interpolationValue = 0; // Current interpolation result

    // Refs
    this.samplingRate = null; // Input values ref
    this.wrappers = {}; // Object of wrappers (element refs) for charts
    this.dims = {}; // Object of dimensions for charts
    this.chart = null; // Chart instance ref
    this.equationsCanvas = {}; // Equations canvas ref
    this.equationText = null; // Equation text ref
    this.equationLabel = null; // Equation label ref
    this.reconstructionFunctionText = null; // Recon. f(t) text ref
    this.legendText = null; // Bottom most text ref
    this.interpolationCursor = null; // Circle which highlights current interpolated point
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
   * Will set new input signal
   * @param signal Signal instance to be set as input signal
   */
  setInputSignal(signal) {
    this.resetApplication({display: this.state.display});
    this.originalSignal = signal;
    this.originalSampled.values(Signal.getSamples(this.state.samplingRate, this.originalSignal));
    this.chart.datasetPoints("originalSampled", this.originalSampled.values())
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
  }

  /**
   * Handles click on drawable charts
   * @param signalName string name of the this variable containing signal which is being drawed
   * @param chart Chart class instance we are clicking in
   */
  onDrawableChartClick(signalName, chart) {
    // Input has changed -> reset application to beginning
    this.resetApplication({display: this.state.display});
    const pointerPos = chart.pointerPosition,
      newPoint = this[signalName].setPoint(chart.getCordXValue(pointerPos.x, 3), chart.getCordYValue(pointerPos.y, 3));
    this[signalName].setPoint(newPoint[0], newPoint[1]);
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
   * Will toggle visibility of signal
   * @param name string name of the signal
   * @param visible bool true -> visible, false -> hidden
   */
  toggleSignal(name, visible) {
    this.chart.datasetConfig(name, {visible: visible});
    this.setState({display: {...this.state.display, [name]: visible}});
  }

  /**
   * Will set sampling new sampling rate, rerender sampled signal in chart
   * @param samplingRate number sampling frequency in Hz
   */
  setSamplingRate(samplingRate) {
    this.originalSampled.values(Signal.getSamples(samplingRate, this.originalSignal));
    this.chart.datasetPoints("originalSampled", this.originalSampled.values());
    this.resetApplication({samplingRate: samplingRate, display: {...this.state.display, originalSampled: true}})
  }

  /**
   * Will set interpolation equations to display
   * @param chosenInterpolation
   */
  setInterpolationEquations(chosenInterpolation) {
    let interpolation = 0;
    const samplingPeriod = 1 / this.state.samplingRate;

    switch (chosenInterpolation) {
      case "newton":
        interpolation = InterpolationEngine.newtonInterpolation(this.originalSampled.values(), this.crosshairTime)[0][1];
        this.equationLabel && this.equationLabel.setAttr("text", "Newtonův interpolační polynom");
        this.equationText && this.equationText.setAttr("text", `Rekonstruovaný xᵣ(${this.crosshairTime}) = Pₙ(${this.crosshairTime} = ${interpolation.toFixed(3)}`);
        this.reconstructionFunctionText && this.reconstructionFunctionText.setAttr("text", `Pₙ(t) = ${InterpolationEngine.getNewtonPolyEquation(this.originalSampled.values())}`);
        this.legendText && this.legendText.setAttr("text", "");
        break;
      case "zeroOrderHold":
        interpolation = InterpolationEngine.zeroOrderHoldInterpolation(this.originalSampled.values(), samplingPeriod.toFixed(3), this.crosshairTime);
        this.equationLabel && this.equationLabel.setAttr("text", "Schodová interpolace (Zero order hold)");
        this.equationText && this.equationText.setAttr("text", `Rekonstruovaný xᵣ(${this.crosshairTime}) = xₛ(t) ∗ h(t) = ∑ xₛ[n] h(${this.crosshairTime} - n * ${samplingPeriod.toFixed(3)}) = ${interpolation.toFixed(3)}`);
        this.reconstructionFunctionText && this.reconstructionFunctionText.setAttr("text", "Rekonstrukční funkce h(t) = 1 pro 0 <= t <= T, 0 jinak");
        this.legendText && this.legendText.setAttr("text", `xₛ => Vzorkovaný signál, T = ${samplingPeriod.toFixed(3)}ms`);
        break;
      case "firstOrderHold":
        interpolation = InterpolationEngine.firstOrderHoldInterpolation(this.originalSampled.values(), samplingPeriod.toFixed(3), this.crosshairTime);
        this.equationLabel && this.equationLabel.setAttr("text", "Lineární interpolace (First order hold)");
        this.equationText && this.equationText.setAttr("text", `Rekonstruovaný xᵣ(${this.crosshairTime}) = xₛ(t) ∗ h(t) = ∑ xₛ[n] h(${this.crosshairTime} - n * ${samplingPeriod.toFixed(3)}) = ${interpolation.toFixed(3)}`);
        this.reconstructionFunctionText && this.reconstructionFunctionText.setAttr("text", "Rekonstrukční funkce h(t) = 1 - (|t| / T) pro 0 <= |t| <= T, 0 jinak");
        this.legendText && this.legendText.setAttr("text", `xₛ => Vzorkovaný signál, T = ${samplingPeriod.toFixed(3)}ms`);
        break;
      default:
        this.reconstructionFunctionText && this.reconstructionFunctionText.setAttr("text", "");
        this.equationLabel && this.equationLabel.setAttr("text", "Zvolte interpolaci");
        this.equationText && this.equationText.setAttr("text", "");
        this.legendText && this.legendText.setAttr("text", "");
        break;
    }

    this.interpolationValue = interpolation;
    if (this.interpolationCursor !== null && this.chart !== null) {
      if (chosenInterpolation !== null) {
        // Handle highlight cursor
        this.interpolationCursor.setAttrs({
          visible: true,
          x: this.chart.xScale(this.crosshairTime),
          y: this.chart.yScale(this.interpolationValue),
        })
      } else {
        this.interpolationCursor.setAttr("visible", false)
      }
      this.chart.refreshLayer("points");
    }
    this.equationsCanvas.layer && this.equationsCanvas.layer.batchDraw();
  }

  /**
   * Will reset application to initial state
   * @param state object extra state data to be set along with defaults
   */
  resetApplication(state = {}) {
    let st = {...state, display: {...initialState.display, ...state.display}};
    this.setState(st);
    // Reset to initial state
    Object.keys(st.display).forEach(key => this.chart.datasetConfig(key, {visible: st.display[key]}));
    this.forceUpdate();
  }

  render() {
    const {dropdowns, samplingRate, display, chosenInterpolation} = this.state,
      samplingPeriod = new Decimal(1 / samplingRate);
    this.setInterpolationEquations(chosenInterpolation);

    return (
      <div className={styles.container}>
        <Navbar dark className={styles.navbar}>
          <Nav>
            <NavItem className="d-inline-flex align-items-center px-3">
              Interpolace a rekonstrukce signálu
            </NavItem>
            <UncontrolledDropdown nav inNavbar
                                  className="d-inline-flex align-items-center px-3"
                                  isOpen={dropdowns.signals}
                                  toggle={this.toggleDropdown.bind(this, "signals")}>
              <DropdownToggle nav caret>
                Signál
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
                  onClick={this.setInputSignal.bind(this, Presets.getTriangleSignal(this.timeDomain[0], this.timeDomain[1], 1, 4))}>
                  Trojuhelník
                </DropdownItem>
              </DropdownMenu>
            </UncontrolledDropdown>

            <NavItem className="d-inline-flex align-items-center px-3">
              <NavLink href="#" className="nav-link pr-3"
                       onClick={() => {
                         this.originalSignal = Presets.getBlankSignal(this.timeDomain[0], this.timeDomain[1]);
                         this.originalSampled = new Signal(Signal.getSamples(this.state.samplingRate, this.originalSignal));
                         this.resetApplication({chosenInterpolation: null})
                       }}>Vyčisti</NavLink>
            </NavItem>

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
              <span className="pr-3">f<sub>vz</sub> = {samplingRate.toFixed(3)}kHz</span>
              <span className="pr-3">T<sub>vz</sub> = {samplingPeriod.toFixed(3)}ms</span>
            </NavItem>

            <NavItem className="d-inline-flex align-items-center px-3">
              <FormGroup check>
                <Label check className="py-2">
                  <Input checked={display.originalSignal}
                         onChange={() => this.toggleSignal("originalSignal", !display.originalSignal)}
                         type="checkbox"/>{' '}
                  &nbsp;Původní signál x(t)&nbsp;<span className={styles.legendSquare}
                                                       style={{background: config.interpolationOriginalSignal.line.stroke}}/>
                </Label>
              </FormGroup>
            </NavItem>

            <NavItem className="d-inline-flex align-items-center px-3">
              <FormGroup check>
                <Label check className="py-2">
                  <Input checked={display.originalSampled}
                         onChange={() => this.toggleSignal("originalSampled", !display.originalSampled)}
                         type="checkbox"/>{' '}
                  &nbsp;Vzorkovaný signál xₛ[n]&nbsp;<span className={styles.legendSquare}
                                                           style={{background: config.interpolationSampledSignal.rect.stroke}}/>
                </Label>
              </FormGroup>
            </NavItem>

            <NavItem className="d-inline-flex align-items-center px-3">
              <NavLink href="#" className="nav-link pr-3"
                       onClick={this.resetApplication.bind(this, {
                         display: {zeroOrderHold: true},
                         chosenInterpolation: "zeroOrderHold"
                       })}>Schodová interpolace&nbsp;
                <span className={styles.legendSquare}
                      style={{background: config.interpolationZOHSignal.line.stroke}}/></NavLink>
            </NavItem>

            <NavItem className="d-inline-flex align-items-center px-3">
              <NavLink href="#" className="nav-link pr-3"
                       onClick={this.resetApplication.bind(this, {
                         display: {firstOrderHold: true},
                         chosenInterpolation: "firstOrderHold"
                       })}>Lineární interpolace&nbsp;
                <span className={styles.legendSquare}
                      style={{background: config.interpolationFOHSignal.line.stroke}}/></NavLink>
            </NavItem>

          </Nav>
        </Navbar>

        <div className={`row ${styles.chartRow} ${styles.h90}`}>
          <div id="interpolation-chart-wrapper" ref={(elem) => this.wrappers.chart = elem}
               className={`col-12 ${styles.chartWrapper}`}>
            {this.wrappers.chart && <Chart ref={(chart) => this.chart = chart}
                                           wrapper={this.wrappers.chart}
                                           width={this.dims.chart ? this.dims.chart[0] : 0}
                                           height={this.dims.chart ? this.dims.chart[1] : 0}
                                           xAxisLabel={"t"}
                                           labels={{
                                             x: 20,
                                             y: 0,
                                             width: 50,
                                             height: 20,
                                             content: <Text text={`x(t) ↑`} {...config.chartLabelText} />
                                           }}
                                           xDomain={this.timeDomain}
                                           yDomain={this.yDomain}
                                           datasets={{
                                             originalSignal: {
                                               data: this.originalSignal.values(),
                                               config: {
                                                 ...config.interpolationOriginalSignal.line,
                                                 visible: display.originalSignal
                                               }
                                             },
                                             originalSampled: {
                                               data: this.originalSampled.values(),
                                               config: {
                                                 ...config.interpolationSampledSignal.rect,
                                                 visible: display.originalSampled,
                                                 width: 1
                                               },
                                               element: "bar"
                                             },
                                             zeroOrderHold: {
                                               data: InterpolationEngine.getZeroOrderHoldLine(this.originalSampled.values()),
                                               config: {
                                                 ...config.interpolationZOHSignal.line,
                                                 visible: display.zeroOrderHold
                                               }
                                             },
                                             firstOrderHold: {
                                               data: this.originalSampled.values(),
                                               config: {
                                                 ...config.interpolationFOHSignal.line,
                                                 visible: display.firstOrderHold
                                               }
                                             },
                                             newton: {
                                               data: InterpolationEngine.newtonInterpolation(this.originalSampled.values()),
                                               config: {
                                                 ...config.interpolationFOHSignal.line,
                                                 visible: display.newton
                                               }
                                             }
                                           }}
                                           onContentMousemove={(chart => {
                                             this.crosshairTime = chart.xCrosshairPosition();
                                             if (!chart.isDragging) {
                                               this.setInterpolationEquations(chosenInterpolation)
                                             }
                                           })}
                                           onContentMousedrag={(chart => {
                                             this.onChartDraw("originalSignal", chart);
                                             this.originalSampled.values(Signal.getSamples(this.state.samplingRate, this.originalSignal));
                                             chart.datasetPoints("originalSampled", this.originalSampled.values())
                                           })}
                                           onContentMousedown={(chart => {
                                             this.onDrawableChartClick("originalSignal", chart);
                                             this.originalSampled.values(Signal.getSamples(this.state.samplingRate, this.originalSignal));
                                             chart.datasetPoints("originalSampled", this.originalSampled.values())
                                           })}
                                           onContentMouseup={(chart => {
                                             this.onDrawableChartMouseUp("originalSignal", chart)
                                           })}>
              {(chart => {
                return (<Circle ref={(point => this.interpolationCursor = point)}
                                y={chart.yScale(this.interpolationValue)}
                                visible={chosenInterpolation !== null} {...config.interpolationCursor}/>)
              })}
            </Chart>
            }
          </div>
        </div>

        <div className={`row ${styles.chartRow} ${styles.h10}`}>
          <div id="interpolation-equations-canvas-wrapper" ref={(elem) => this.wrappers.equationsCanvas = elem}
               className={`col-12 ${styles.chartWrapper}`}>
            <Stage ref={(stage => this.equationsCanvas.stage = stage)}
                   width={this.dims.equationsCanvas ? this.dims.equationsCanvas[0] : 0}
                   height={this.dims.equationsCanvas ? this.dims.equationsCanvas[1] : 0}>
              <Layer ref={(layer => this.equationsCanvas.layer = layer)}>
                <Text x={20} y={10} ref={(text => this.equationLabel = text)} {...config.equationText}/>
                <Text x={20} y={30} ref={(text => this.equationText = text)} {...config.equationText}/>
                <Text x={20} y={50} ref={(text => this.reconstructionFunctionText = text)} {...config.equationText}/>
                <Text x={20} y={70} ref={(text => this.legendText = text)} {...config.equationText}/>
              </Layer>
            </Stage>
          </div>
        </div>
      </div>
    );
  }
}
