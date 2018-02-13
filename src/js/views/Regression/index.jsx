import React from 'react';
import {Dropdown, DropdownToggle, DropdownMenu, DropdownItem, InputGroup, Input} from 'reactstrap';
import styles from './regression.scss';
import CanvasManager from '../../utils/CanvasManager';
import {Stage, Layer, Rect, Line, Text, Group} from 'react-konva';
import {max, min} from 'd3-array';
import Konva from 'konva';


export default class Regression extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      dropdowns: {
        inputValues: false,
        aproximation: false
      },
      inputValues: [5, 70, 140, 23, 250, 60, 300, 20],
    };

    this.canvasManager = new CanvasManager();
    this.chartMargins = [0, 75, 100, 0]; // Margins top, right, bottom, right and bottom are greater because we need leave space for axes
    this.xTickMargins = [20, 0];
    this.yTickMargins = [0, 20];
    this.inputValues = null; // Input values ref
    this.chartWrapper = null; // Chart wrapper ref
  }

  componentDidMount() {
    setTimeout(() => this.forceUpdate(), 1000); // Delayed mount of konva chart
  }

  componentWillUpdate(nextProps, nextState) {
    // If canvas wrapper exists
    if (this.chartWrapper !== null) {
      // If dimensions or data has changed anyhow -> rescale
      if ((this.chartWrapper.offsetWidth !== this.canvasManager.dimensions[0] || this.chartWrapper.offsetHeight !== this.canvasManager.dimensions[1])
        || this.state.inputValues !== nextState.inputValues) {
        this.canvasManager.dimensions = [this.chartWrapper.offsetWidth, this.chartWrapper.offsetHeight];
        const splitPoints = this.splitPoints(nextState.inputValues);
        // Minimum and maximum of X from input values
        this.canvasManager.xDomain = [min(splitPoints.xPoints.map((d) => d)), max(splitPoints.xPoints.map((d) => Math.abs(d)))];
        // From left edge to right edge minus space for axis
        this.canvasManager.xRange = [0, this.canvasManager.dimensions[0] - this.chartMargins[1]];
        // From zero to max Y point value
        this.canvasManager.yDomain = [0, max(splitPoints.yPoints.map((d) => Math.abs(d)))];
        // From bottom edge to top edge
        this.canvasManager.yRange = [this.canvasManager.dimensions[1] - this.chartMargins[2], 0];
        this.canvasManager.rescale();
        console.log("rescaled");
      }
    }
  }

  toggleDropdown(dropdown) {
    this.setState({dropdowns: {...this.state.dropdowns, [dropdown]: !this.state.dropdowns[dropdown]}})
  }

  /**
   * Split input values into two arrays of x and y values, places them inside an object and returns this object
   * @param inputValues array of input values
   * @return object of two arrays x and y points
   */
  splitPoints(inputValues) {
    const points = {xPoints: [], yPoints: []};
    inputValues.map((value, index) => {
      if (index % 2 === 0) {
        // Even value is x value
        points.xPoints.push(value);
      } else {
        points.yPoints.push(value);
      }
    });
    return points;
  }

  getPoints(inputValues, xScale, yScale) {
    const points = [];
    inputValues.map((value, index) => {
      // Even -> x value
      if (index % 2 === 0) {
        points.push(xScale(value))
      } else {
        points.push(yScale(value))
      }
    });
    return points;
  }

  render() {
    const {dropdowns, inputValues} = this.state;
    // Recalculated points from input values
    let points = [];
    let xTicks = [];
    let yTicks = [];
    if (this.chartWrapper !== null) {
      points = this.getPoints(inputValues, this.canvasManager.xScale, this.canvasManager.yScale);
      xTicks = this.canvasManager.xScale.ticks(10);
      xTicks.pop();
      yTicks = this.canvasManager.yScale.ticks(10);
      yTicks.shift();
    }

    return (
      <div className={styles.container}>
        <div className={styles.topOptionsBar}>
          <div className={`${styles.topOptionsBar__item}`}>
            Aproximace
          </div>
          <Dropdown className={`${styles["topOptionsBar__item--dropdown"]}`}
                    isOpen={dropdowns.inputValues}
                    toggle={this.toggleDropdown.bind(this, "inputValues")}>
            <DropdownToggle
              tag="span"
              className={`${styles["topOptionsBar__item--dropdown__dropdownToggle"]}`}
              onClick={this.toggleDropdown.bind(this, "inputValues")}
              data-toggle="dropdown"
              aria-expanded={dropdowns.inputValues}
              caret>
              Vstupní hodnoty
            </DropdownToggle>
            <DropdownMenu className={`${styles["topOptionsBar__item--dropdown__dropdownMenu"]}`}>
              <InputGroup>
                <Input placeholder="x1, y1, x2, y2,..."
                       type="text"
                       innerRef={(input) => this.inputValues = input}
                       defaultValue={inputValues.join()}
                       onChange={(event) => this.inputValues.value = event.target.value}
                       onBlur={() => {
                         const values = this.inputValues.value.split(",").map((item) => {
                           return parseInt(item, 10)
                         });
                         // TODO: IMPLEMENT VALIDATION PROCESS
                         this.setState({inputValues: values});
                       }}
                />
              </InputGroup>
            </DropdownMenu>
          </Dropdown>
        </div>
        <div id="regression-chart-wrapper" ref={(elem) => {
          this.chartWrapper = elem
        }} className="h-100 w-100">
          <Stage width={this.canvasManager.dimensions[0]}
                 height={this.canvasManager.dimensions[1]}>
            <Layer>
              <Line points={points}
                    stroke="green"
              />
            </Layer>
            <Layer>
              <Line
                points={[0, this.canvasManager.dimensions[1] - this.chartMargins[2], this.canvasManager.dimensions[0], this.canvasManager.dimensions[1] - this.chartMargins[2]]}
                stroke="#494949"
              />
              {
                xTicks.map((tick, index) => {
                  return <Group key={index}
                                x={this.canvasManager.xScale(tick) + this.xTickMargins[1]}
                                y={this.canvasManager.dimensions[1] - this.chartMargins[2] + this.xTickMargins[0]}>
                    <Text
                      text={tick}
                      x={0}
                      y={0}
                      fill="#494949"
                      fontSize={14}
                      offsetX={10}
                      align="center"
                    />
                    <Line
                      points={[0, -this.xTickMargins[0], 0, -this.canvasManager.dimensions[1]]}
                      stroke="#292b2c"
                    />
                  </Group>
                })
              }
              <Line
                points={[this.canvasManager.dimensions[0] - this.chartMargins[1], 0, this.canvasManager.dimensions[0] - this.chartMargins[1], this.canvasManager.dimensions[1]]}
                stroke="#494949"
              />
              {
                yTicks.map((tick, index) => {
                  return <Group key={index}
                                x={this.canvasManager.dimensions[0] - this.chartMargins[1] + this.yTickMargins[1]}
                                y={this.canvasManager.yScale(tick) + this.yTickMargins[0]}>
                    <Text
                      text={tick}
                      x={0}
                      y={0}
                      fill="#494949"
                      fontSize={14}
                      align="center"
                    />
                    <Line
                      points={[-this.yTickMargins[1], 0, -this.canvasManager.dimensions[0] - this.chartMargins[1], 0]}
                      stroke="#292b2c"
                    />
                  </Group>
                })
              }
            </Layer>
          </Stage>
        </div>
      </div>
    );
  }
}
