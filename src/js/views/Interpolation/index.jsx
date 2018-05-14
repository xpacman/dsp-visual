import React from "react";
import {
  DropdownItem,
  DropdownMenu, DropdownToggle, FormGroup, Input, Label, Nav, Navbar, NavItem,
  UncontrolledDropdown
} from "reactstrap";
import styles from "./interpolation.scss";
import Signal from "../../partials/Signal";
const Decimal = require('decimal.js-light');
import {TopOptionsBar, TopOptionsBarDropdownItem, TopOptionsBarItem, Chart} from "../../components";
import * as Presets from "../../partials/SignalPresets";
import {Text} from "react-konva";
import {max, min} from "d3-array";
import InterpolationEngine from "../../utils/InterpolationEngine";
import config from "../../config";

const initialState = {
  display: {
    originalSignal: true,
    originalSampled: true,
    zeroOrderHold: false,
    firstOrderHold: false
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
      samplingRate: 1 // Sampling frequency in Hz
    };

    // Signals
    this.timeDomain = [0, 14];
    this.originalSignal = Presets.getSinSignal(this.timeDomain[0], this.timeDomain[1]);
    this.yDomain = this.originalSignal.getYDomain();
    this.originalSampled = new Signal(Signal.getSamples(this.state.samplingRate, this.originalSignal));

    // Refs
    this.samplingRate = null; // Input values ref
    this.chartWrapper = null; // Chart wrapper ref
    this.chart = null; // Chart instance ref
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

  /**
   * Will set new input signal
   * @param signal Signal instance to be set as input signal
   */
  setInputSignal(signal) {
    this.resetApplication({display: {originalSampled: false}});
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
    this.resetApplication({display: {originalSampled: false}});
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
    this.resetApplication({samplingRate: samplingRate})
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
    const {dropdowns, samplingRate, display} = this.state,
      samplingPeriod = new Decimal(1 / samplingRate);

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

            <FormGroup check
                       className="d-inline-flex align-items-center px-3">
              <Label check>
                <Input checked={display.originalSignal}
                       onChange={() => this.toggleSignal("originalSignal", !display.originalSignal)}
                       type="checkbox"/>{' '}
                &nbsp;Původní signál <span className={styles.legendSquare}
                                           style={{background: config.interpolationOriginalSignal.line.stroke}}/>
              </Label>
            </FormGroup>
            <FormGroup check
                       className="d-inline-flex align-items-center px-3">
              <Label check>
                <Input checked={display.originalSampled}
                       onChange={() => this.toggleSignal("originalSampled", !display.originalSampled)}
                       type="checkbox"/>{' '}
                &nbsp;Vzorkovaný signál <span className={styles.legendSquare}
                                              style={{background: config.interpolationSampledSignal.rect.stroke}}/>
              </Label>
            </FormGroup>
            <FormGroup check
                       className="d-inline-flex align-items-center px-3">
              <Label check>
                <Input checked={display.zeroOrderHold}
                       onChange={() => this.toggleSignal("zeroOrderHold", !display.zeroOrderHold)}
                       type="checkbox"/>{' '}
                &nbsp;Schodová interpolace <span className={styles.legendSquare}
                                                 style={{background: config.interpolationZOHSignal.line.stroke}}/>
              </Label>
            </FormGroup>
            <FormGroup check
                       className="d-inline-flex align-items-center px-3">
              <Label check>
                <Input checked={display.firstOrderHold}
                       onChange={() => this.toggleSignal("firstOrderHold", !display.firstOrderHold)}
                       type="checkbox"/>{' '}
                &nbsp;Lineární interpolace <span className={styles.legendSquare}
                                                 style={{background: config.interpolationFOHSignal.line.stroke}}/>
              </Label>
            </FormGroup>
          </Nav>
        </Navbar>

        <div className={`row h-100 ${styles.chartRow}`}>
          <div id="interpolation-chart-wrapper" ref={(elem) => this.chartWrapper = elem}
               className={`col-12 ${styles.chartWrapper}`}>
            {this.chartWrapper && <Chart ref={(chart) => this.chart = chart}
                                         wrapper={this.chartWrapper}
                                         width={this.chartWrapper.offsetWidth}
                                         height={this.chartWrapper.offsetHeight}
                                         xAxisLabel={"t [ms]"}
                                         yAxisLabel={"x(t)"}
                                         labelOffsets={{x: [20, 0], y: [0, 0]}}
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
                                             data: InterpolationEngine.getZeroOrderHoldInterpolation(this.originalSampled.values()),
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
                                           }
                                         }}
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
                                         })}/>
            }
          </div>
        </div>
      </div>
    );
  }
}
