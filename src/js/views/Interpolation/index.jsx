import React from "react";
import {
  DropdownItem,
  DropdownMenu, DropdownToggle, FormGroup, Input, Label, Nav, Navbar, NavItem,
  UncontrolledDropdown
} from "reactstrap";
import styles from "./interpolation.scss";
import Signals from "../../utils/Signals";
import {TopOptionsBar, TopOptionsBarDropdownItem, TopOptionsBarItem} from "../../components";
import {Line, Group, Circle} from "react-konva";
import {max, min} from "d3-array";
import InterpolationEngine from "../../utils/InterpolationEngine";
import Chart from "../../partials/Chart";
import config from "../../config";
import Konva from "konva";


export default class Interpolation extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      dropdowns: {
        inputValues: false,
        signals: false
      },
      inputValid: true,
      //inputValues: Signals.generateSinSignal()
      inputValues: [[1, 2], [2, 1.5], [2.5, 0.8], [4, 2.8]]
    };

    // Refs
    this.inputValues = null; // Input values ref
    this.chartWrapper = null; // Chart wrapper ref
    this.chart = null; // Chart instance ref
    this.getPoints = this.getPoints.bind(this);
  }

  componentDidMount() {
    setTimeout(() => {
      // Delayed mount of konva chart
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
   * Returns points for konva [x1, y1, x2, y2] (flattens an array of input values and scales them for canvas)
   * @param inputValues Array of arrays [[x1, y1],...]
   * @return {Array}
   */
  getPoints(inputValues) {
    const points = [];
    const that = this;
    if (that.chart) {
      inputValues.map((point) => {
        points.push(that.chart.xScale(point[0]));
        points.push(that.chart.yScale(point[1]))
      });
    }
    return points;
  }

  render() {
    const {dropdowns, inputValues, inputValid} = this.state;
    const that = this;

    return (
      <div className={styles.container}>
        <Navbar dark className={styles.navbar}>
          <Nav>

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
          {this.chartWrapper &&
          <Chart ref={(chart) => this.chart = chart}
                 wrapper={this.chartWrapper}
                 width={this.chartWrapper.offsetWidth}
                 height={this.chartWrapper.offsetHeight}
                 xDomain={[min(inputValues.map((d) => d[0])), max(inputValues.map((d) => Math.abs(d[0])))]}
                 yDomain={[0, max(inputValues.map((d) => Math.abs(d[1])))]}>
            {
              that.chart && inputValues.map((point, index) => {
                return (
                  <Group key={index} x={that.chart.xScale(point[0])} y={that.chart.yScale(point[1])}>
                    <Line points={[-10, 0, 10, 0]} {...config.pointCross}/>
                    <Line points={[0, -10, 0, 10]}{...config.pointCross}/>
                    <Circle {...config.pointCircle} x={0} y={0}/>
                  </Group>
                );
              })
            }

            <Line {...config.signalLine} points={that.getPoints(inputValues)}/>

            <Line {...config.signalLine} stroke="red"
                  points={that.getPoints(InterpolationEngine.getZeroOrderHoldInterpolation(inputValues))}/>

            <Line {...config.signalLine} stroke="white"
                  points={that.getPoints(InterpolationEngine.newtonInterpolation(inputValues, (() => {
                    const ret = [];
                    for (let i = 0; i <= 100; i++)
                      ret.push(i * 0.1);
                    return ret
                  })()))}/>
          </Chart>
          }
        </div>
      </div>
    );
  }
}
