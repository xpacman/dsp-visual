import React from 'react';
import {Dropdown, DropdownToggle, DropdownMenu, DropdownItem, Label, InputGroup, Input, FormGroup} from 'reactstrap';
import styles from './regression.scss';
import CanvasManager from '../../utils/CanvasManager';
import {TopOptionsBar, TopOptionsBarDropdownItem, TopOptionsBarItem} from '../../components'
import {Stage, Layer, Rect, Line, Text, Group, Circle} from 'react-konva';
import {max, min} from 'd3-array';
import RegressionEngine from '../../utils/RegressionEngine';
import {arrayEquals} from '../../utils/utils';
import config from '../../config';
import Konva from 'konva';


export default class Regression extends React.Component {
  constructor(props) {
    super(props);
    // Default input values
    const inputValues = [[0, 1], [1, 2], [3, 6], [6, 9]];
    this.state = {
      dropdowns: {
        inputValues: false,
        approximation: false
      },
      inputValid: true,
      inputValues: inputValues,
      selectedApproximation: 'line',
      displayLeastSquares: true
    };

    this.canvasManager = new CanvasManager(); // This class holds information about canvas size, scales etc...
    this.chartMargins = [0, 75, 100, 0]; // Margins top, right, bottom, left, right and bottom are greater because we need leave space for axes
    this.xTickMargins = [20, 0];
    this.yTickMargins = [0, 20];
    this.inputValues = null; // Input values ref
    this.chartWrapper = null; // Chart wrapper ref
    this.stage = null; // Konva stage ref
    this.crosshairsLayer = null; // Crosshairs layer ref
    this.pointsLayer = null; // Points layer ref
    this.axisLayer = null; // Axes layer ref

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
      if ((this.chartWrapper.offsetWidth !== this.canvasManager.dimensions[0] || this.chartWrapper.offsetHeight !== this.canvasManager.dimensions[1])
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
    this.canvasManager.dimensions = [this.chartWrapper.offsetWidth, this.chartWrapper.offsetHeight];
    // Minimum and maximum of X from input values
    this.canvasManager.xDomain = [min(data.map((d) => d[0])), max(data.map((d) => Math.abs(d[0])))];
    // From left edge to right edge minus space for axis
    this.canvasManager.xRange = [0, this.canvasManager.dimensions[0] - this.chartMargins[1]];
    // From zero to max Y point value
    this.canvasManager.yDomain = [0, max(data.map((d) => Math.abs(d[1])))];
    // From bottom edge to top edge
    this.canvasManager.yRange = [this.canvasManager.dimensions[1] - this.chartMargins[2], 0];
    this.canvasManager.rescale();
    this.forceUpdate();
  }

  toggleDropdown(dropdown) {
    this.setState({dropdowns: {...this.state.dropdowns, [dropdown]: !this.state.dropdowns[dropdown]}})
  }

  /**
   * Returns points for konva [x1, y1, x2, y2] (flattens an array of input values and scales them for canvas)
   * @param inputValues Array of arrays [[x1, y1],...]
   * @return {Array}
   */
  getPoints(inputValues) {
    const points = [];
    inputValues.map((point) => {
      points.push(this.canvasManager.xScale(point[0]));
      points.push(this.canvasManager.yScale(point[1]))
    });
    return points;
  }

  render() {
    const {dropdowns, inputValues, selectedApproximation, displayLeastSquares, inputValid} = this.state;

    const xTicks = {ticks: [], grid: [], tickRefs: []};
    const yTicks = {ticks: [], grid: []};

    if (this.chartWrapper !== null) {
      // Prepare ticks and grid for render (grid will be on separate layer, so split them right now instead of iterating through ticks twice)
      this.canvasManager.xScale.ticks(10).map((tick, index) => {
        const xPos = this.canvasManager.xScale(tick) + this.xTickMargins[1];
        const yPos = this.canvasManager.dimensions[1] - this.chartMargins[2] + this.xTickMargins[0];
        xTicks.ticks.push(<Text key={index}
                                text={tick}
                                ref={(elem) => xTicks.tickRefs.push(elem)}
                                x={xPos}
                                y={yPos}
                                {...config.axisTick}
        />);
        xTicks.grid.push(<Line key={index}
                               points={[xPos, yPos - this.xTickMargins[0], xPos, yPos - this.canvasManager.dimensions[1]]}
                               {...config.axisTickLine}
        />);
      });
      // Remove last tick and line (its redundant)
      xTicks.grid.pop();
      xTicks.ticks.pop();

      this.canvasManager.yScale.ticks(10).map((tick, index) => {
        const xPos = this.canvasManager.dimensions[0] - this.chartMargins[1] + this.yTickMargins[1];
        const yPos = this.canvasManager.yScale(tick) + this.yTickMargins[0];
        yTicks.ticks.push(<Text key={index}
                                text={tick}
                                x={xPos}
                                y={yPos}
                                {...config.axisTick}
        />);
        yTicks.grid.push(<Line key={index}
                               points={[xPos - this.yTickMargins[1], yPos, xPos - this.canvasManager.dimensions[0] - this.chartMargins[1], yPos]}
                               {...config.axisTickLine}
        />);
      })
    }
    // Remove first tick and line (its redundant)
    yTicks.grid.shift();
    yTicks.ticks.shift();

    let approxLineProps = {
      ...config.approximationLine
    };

    let approxLabel = "";
    let equation = "";
    let leastSquares = 0;

    switch (selectedApproximation) {
      case 'line':
        approxLabel = "Přímka";
        equation = RegressionEngine.getLineEquation(inputValues);
        leastSquares = RegressionEngine.getLineLeastSquares(inputValues);
        approxLineProps = {
          ...approxLineProps,
          points: RegressionEngine.getLineApproximation(inputValues),
          tension: 0.1,
          lineCap: 'round',
          lineJoin: 'round',
        };
        break;
      case 'parabola':
        approxLabel = "Parabola";
        equation = RegressionEngine.getParabolaEquation(inputValues);
        leastSquares = RegressionEngine.getParabolaLeastSquares(inputValues);
        approxLineProps = {
          ...approxLineProps,
          points: RegressionEngine.getParabolaApproximation(inputValues),
          tension: 0.3,
          lineCap: 'round',
          lineJoin: 'round',
        };
        break;
      case 'exponential':
        approxLabel = "Exponenciála";
        equation = RegressionEngine.getExponentialEquation(inputValues);
        leastSquares = RegressionEngine.getExponentialLeastSquares(inputValues);
        approxLineProps = {
          ...approxLineProps,
          points: RegressionEngine.getExponentialApproximation(inputValues),
          tension: 0.3,
          lineCap: 'round',
          lineJoin: 'round',
        };
        break;
      default:
        break;
    }

    return (
      <div className={styles.container}
           onMouseMove={() => {
             // Crosshairs handling
             if (this.crosshairsLayer !== null && this.stage !== null) {
               const cursorPosition = this.stage.getStage().getPointerPosition();

               if (cursorPosition) {
                 const dimensionsWithMargins = [this.canvasManager.dimensions[0] - this.chartMargins[1] - this.chartMargins[3], this.canvasManager.dimensions[1] - this.chartMargins[2]];
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
                 xText.setAttr("text", (this.canvasManager.xDomain[1] * (100 / (this.canvasManager.dimensions[0] - this.chartMargins[1]) * xCrosshairGroup.getPosition().x) / 100).toFixed(2));
                 const yText = yCrosshairGroup.getChildren()[1];
                 //xText.setAttr("text", this.canvasManager.xScale(xCrosshairGroup.getPosition().x));
                 this.crosshairsLayer.getLayer().batchDraw();

                 xTicks.ticks.map((tick, index) => {
                   // Crosshair is overlapping tick -> hide tick
                   if (tick.props.x >= cursorPosition.x - 30 && tick.props.x <= cursorPosition.x + 40) {
                     xTicks.tickRefs[index].visible(false);
                   }

                   else {
                     xTicks.tickRefs[index].visible(true);
                   }
                 });

                 this.axisLayer.batchDraw();
               }
             }
           }}>
        <TopOptionsBar>
          <div>
            <TopOptionsBarDropdownItem toggle={this.toggleDropdown.bind(this, "approximation")}
                                       isOpen={dropdowns.approximation}
                                       dropdownClass={styles.divider}
                                       dropdownMenuClass={"pl-2"}
                                       dropdownToggleText={`Aproximace ${approxLabel}`}>
              <FormGroup check>
                <Label check>
                  <Input type="radio" checked={selectedApproximation === "line"}
                         onChange={(event) => this.setState({selectedApproximation: event.target.name})}
                         name="line"/>{' '}
                  Přímka
                </Label>
              </FormGroup>

              <FormGroup check>
                <Label check>
                  <Input type="radio" checked={selectedApproximation === "parabola"}
                         onChange={(event) => this.setState({selectedApproximation: event.target.name})}
                         name="parabola"/>{' '}
                  Parabola
                </Label>
              </FormGroup>

              <FormGroup check>
                <Label check>
                  <Input type="radio" checked={selectedApproximation === "exponential"}
                         onChange={(event) => this.setState({selectedApproximation: event.target.name})}
                         name="exponential"/>{' '}
                  Exponenciála
                </Label>
              </FormGroup>
            </TopOptionsBarDropdownItem>

            <TopOptionsBarItem className={`ml-4 ${styles.divider}`}>
              <FormGroup check>
                <Label check>
                  <Input checked={displayLeastSquares}
                         onChange={() => this.setState({displayLeastSquares: !displayLeastSquares})}
                         type="checkbox"/>{' '}
                  Zobrazovat nejmenší čtverce
                </Label>
              </FormGroup>
            </TopOptionsBarItem>

            <TopOptionsBarItem className={`ml-4 ${styles.divider}`}>
              {equation}
            </TopOptionsBarItem>

            <TopOptionsBarItem className={"ml-4"}>
              p^2 = {leastSquares.toFixed(3)}
            </TopOptionsBarItem>
          </div>

          <TopOptionsBarDropdownItem toggle={this.toggleDropdown.bind(this, "inputValues")}
                                     isOpen={dropdowns.inputValues}
                                     dropdownMenuClass={`${styles.inputValuesDropdown} ${!inputValid ? styles.invalidInput : ""}`}
                                     dropdownToggleText={`Vstupní hodnoty`}>
            <InputGroup>
              <Input placeholder="x1, y1, x2, y2,..."
                     type="text"
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
            </InputGroup>
          </TopOptionsBarDropdownItem>
        </TopOptionsBar>

        <div id="regression-chart-wrapper" ref={(elem) => this.chartWrapper = elem} className="h-100 w-100">
          <Stage ref={(stage) => this.stage = stage}
                 width={this.canvasManager.dimensions[0]}
                 height={this.canvasManager.dimensions[1]}>
            <Layer ref={(layer) => this.gridLayer = layer}>
              {xTicks.grid}
              {yTicks.grid}
            </Layer>

            <Layer ref={(layer) => this.crosshairsLayer = layer}>
              <Group x={0}
                     y={0}>
                <Line points={[0, 0, 0, this.canvasManager.dimensions[1] - this.chartMargins[2]]}
                      {...config.crosshairLine}
                      name="xCrosshair"
                />
                <Text text={""}
                      x={0}
                      y={this.canvasManager.dimensions[1] - this.chartMargins[2] + this.xTickMargins[0]}
                      {...config.crosshairText}
                />
              </Group>
              <Group x={0}
                     y={0}>
                <Line points={[0, 0, this.canvasManager.dimensions[0] - this.chartMargins[1], 0]}
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
                  const leastSquareSize = this.canvasManager.yScale(point[1]) - this.canvasManager.yScale(approxLineProps.points[index][1]);
                  let xShift = 0;
                  let yShift = 0;

                  // Squares laying bellow approximation line must be flipped on vertical axis to approach approximation line
                  const bellow = this.canvasManager.yScale(point[1]) >= this.canvasManager.yScale(approxLineProps.points[index][1]);

                  // When function has raising trend, need to position squares differently
                  const nextIndex = index === approxLineProps.points.length - 1 ? index : index + 1;
                  const raising = point[1] < approxLineProps.points[nextIndex][1];
                  if (raising) {

                    if (bellow) {
                      yShift = -leastSquareSize
                    }

                    else {
                      xShift = leastSquareSize
                    }
                  }

                  else {
                    if (bellow) {
                      xShift = -leastSquareSize;
                      yShift = -leastSquareSize;
                    }
                  }

                  return (
                    <Group key={index} x={this.canvasManager.xScale(point[0])} y={this.canvasManager.yScale(point[1])}>
                      <Line points={[-10, 0, 10, 0]} {...config.pointCross}/>
                      <Line points={[0, -10, 0, 10]}{...config.pointCross}/>
                      <Circle {...config.pointCircle} x={0} y={0}/>
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

            <Layer ref={(layer) => this.axisLayer = layer}>
              <Rect {...config.axisBackground} x={this.canvasManager.dimensions[0] - this.chartMargins[1]} y={0}
                    width={this.chartMargins[1]} height={this.canvasManager.dimensions[1] - this.chartMargins[2]}/>
              <Line
                points={[0, this.canvasManager.dimensions[1] - this.chartMargins[2], this.canvasManager.dimensions[0], this.canvasManager.dimensions[1] - this.chartMargins[2]]}
                {...config.axisLine}
              />
              {xTicks.ticks}
              <Rect {...config.axisBackground} x={0} y={this.canvasManager.dimensions[1]}
                    width={this.canvasManager.dimensions[0]} height={this.chartMargins[2]}/>
              <Line
                points={[this.canvasManager.dimensions[0] - this.chartMargins[1], 0, this.canvasManager.dimensions[0] - this.chartMargins[1], this.canvasManager.dimensions[1]]}
                {...config.axisLine}
              />
              {yTicks.ticks}
            </Layer>
          </Stage>
        </div>
      </div>
    );
  }
}
