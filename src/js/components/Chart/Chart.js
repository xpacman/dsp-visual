/**
 * Created by paco on 10.4.18.
 */

import React from "react";
import PropTypes from 'prop-types';
import * as config from "../../config";
import {Stage, Layer, Rect, Line, Text, Group, Circle} from "react-konva";
import {scaleLinear, scaleBand, ticks} from 'd3-scale';
import {range} from 'd3-array';
import Konva from "konva";
const Decimal = require('decimal.js-light');
import Dataset from './Dataset';
import {arrayEquals, findIndexOfNearest} from "../../utils/ArrayUtils";

export default class Chart extends React.Component {

  static propTypes = {
    // Wrapper element reference where chart is mounted
    wrapper: PropTypes.any.isRequired,
    // Width of the chart
    width: PropTypes.number.isRequired,
    // Height of the chart
    height: PropTypes.number.isRequired,
    // Margins of the chart [top, right, bottom, left]
    margins: PropTypes.array,
    // Margins of the ticks {x: [horizontal, vertical], y: [...]}
    tickMargins: PropTypes.object,
    // Text to describe x axis
    xAxisLabel: PropTypes.string,
    // Text to describe y axis
    yAxisLabel: PropTypes.string,
    // Number of ticks on x axis
    xTicksCount: PropTypes.number,
    // Number of ticks on y axis
    yTicksCount: PropTypes.number,
    // Labels for this chart. Will be displayed as Konva Rect. You can pass [{x, y, width, height, config: <object Konva props>, content: <element>}]
    labels: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
    // Offsets of the labels {x: [horizontal, vertical], y: [...]}
    labelOffsets: PropTypes.object,
    // horizontal size of the chart [min, max]
    xRange: PropTypes.array,
    // X axis steps (crosshairs use this)
    xStep: PropTypes.number,
    // x axis values [min, max]
    xDomain: PropTypes.array,
    // vertical size of the chart [min, max]
    yRange: PropTypes.array,
    // y axis values [min, max]
    yDomain: PropTypes.array,
    // Datasets for chart -> {dataset name: {data: [array of points], config: {<Object with Konva config>}, element: <string konva element to be displayed e.x line or rect>}}
    datasets: PropTypes.object,
    // Children to be displayed in the plot area
    children: PropTypes.oneOfType([PropTypes.func, PropTypes.element, PropTypes.array, PropTypes.object]),
    // Content click callback
    onContentMousedown: PropTypes.func,
    // Content mouse up callback
    onContentMouseup: PropTypes.func,
    // Content mouse drag callback
    onContentMousedrag: PropTypes.func,
    // Ignore mousedown and mouseup events on this chart
    clickSafe: PropTypes.bool,
    // Crosshair for x axis hidden
    xCrosshairDisabled: PropTypes.bool,
    // Crosshair for y axis hidden
    yCrosshairDisabled: PropTypes.bool
  };

  static defaultProps = {
    width: 500,
    height: 500,
    xStep: 0.01,
    xTicksCount: 10,
    yTicksCount: 10,
    margins: [20, 75, 50, 20],
    xDomain: [0, 1],
    yDomain: [0, 1],
    tickMargins: {x: [0, 20], y: [20, 0]},
    labelOffsets: {x: [0, 0], y: [0, 0]},
    datasets: {},
    clickSafe: false,
    xCrosshairDisabled: false,
    yCrosshairDisabled: false
  };

  constructor(props) {
    super(props);

    // Linear Scales
    this.xScale = null;
    this.yScale = null;
    // Chart range
    this.xRange = null;
    // Step on x axis
    this.xStep = null;
    // Rescale will set xScale, yScale, xRange, xStep
    this.rescale(props);

    this.xTicksCount = props.xTicksCount;
    this.yTicksCount = props.yTicksCount;

    // Is mouse dragging
    this.isDragging = false;

    // Trimmed dimensions (including margins) -> [trimmed width, trimmed height]
    this.trimDims = [props.width - props.margins[1] - props.margins[3], props.height - props.margins[0] - props.margins[2]];

    // Last pointer position
    this.lastPointerPosition = null;
    // Current pointer position
    this.pointerPosition = {x: 0, y: 0};

    // Refs
    this.xTicks = []; // X Ticks refs
    this.yTicks = []; // Y Ticks refs
    this.canvas = {
      stage: null,
      layers: []
    }; // Canvas refs holder

    this._datasets = {};
  }


  componentDidMount() {

    // Delayed mount of konva components
    this.forceUpdate();

    // On mouse click callback
    if (this.canvas.stage) {
      this.canvas.stage.getStage().on("contentMousedown.proto", () => {
        if (this.props.clickSafe) {
          return;
        }

        this.isDragging = true;
        this.lastPointerPosition = this.getPointerPosition();
        this.pointerPosition = this.getPointerPosition();

        return this.props.onContentMousedown && this.props.onContentMousedown(this);
      });

      // On mouse up callback
      this.canvas.stage.getStage().on("contentMouseup.proto", () => {
        if (this.props.clickSafe) {
          return;
        }

        this.isDragging = false;
        this.lastPointerPosition = this.getPointerPosition();
        this.pointerPosition = this.getPointerPosition();

        return this.props.onContentMouseup && this.props.onContentMouseup(this);
      });

      // Mouse dragging callback
      this.canvas.stage.getStage().on("contentMousemove.proto", () => {

        const cursorPosition = this.getPointerPosition();

        // Crosshairs support
        if (cursorPosition) {

          if (this.pointerPosition && (this.xStep.lessThanOrEqualTo(Math.abs(this.getCordXValue(this.pointerPosition.x) - this.getCordXValue(cursorPosition.x)).toFixed(2)))) {
            cursorPosition.x = this.xScale(this.xRange[findIndexOfNearest(this.xRange, (x => x), this.getCordXValue(cursorPosition.x))]) + this.props.margins[3];
          } else {
            cursorPosition.x = this.pointerPosition.x;
          }

          this.handleCrosshairsMove(cursorPosition);
          this.pointerPosition = cursorPosition;
        }

        // Click and drag block
        if (!this.isDragging) {
          return;
        }

        this.props.onContentMousedrag && this.props.onContentMousedrag(this);
        return this.lastPointerPosition = this.pointerPosition;
      });
    }
  }

  componentWillUnmount() {
    // Unbind events when unmounting the component
    if (this.canvas.stage) {
      this.canvas.stage.getStage().off("contentMousedown.proto");
      this.canvas.stage.getStage().off("contentMouseup.proto");
      this.canvas.stage.getStage().off("contentMousemove.proto");
    }
  }

  componentWillReceiveProps(nextProps) {
    // TODO: HANDLE DATASET PROPS CHANGE

    // If dimensions, range, or domain changed anyhow -> rescale
    if (this.props.width !== nextProps.width || this.props.height !== nextProps.height ||
      ((this.props.xRange || nextProps.xRange) && !arrayEquals(this.props.xRange, nextProps.xRange)) ||
      !arrayEquals(this.props.xDomain, nextProps.xDomain) ||
      !arrayEquals(this.props.yDomain, nextProps.yDomain) ||
      ((this.props.yRange || nextProps.yRange) && !arrayEquals(this.props.yRange, nextProps.yRange))) {
      this.rescale(nextProps);
    }
  }

  /**
   * Gets array of label or labels for this chart. If no labels defined, returns empty array
   * @return {Array}
   */
  getChartLabels() {
    let labels = [];

    if (this.props.labels) {

      if (Array.isArray(this.props.labels)) {
        labels = this.props.labels;
      } else if (typeof this.props.labels === "object") {
        labels.push(this.props.labels);
      }
    }
    return labels;
  }

  /**
   * Returns pointer position on chart working area.
   */
  getPointerPosition() {
    if (!this.canvas.stage) {
      return
    }

    const pos = this.canvas.stage.getStage().getPointerPosition();

    // Corrections
    if (pos.x < this.props.margins[3]) {
      pos.x = this.props.margins[3]
    }

    if (pos.y < this.props.margins[0]) {
      pos.y = this.props.margins[0]
    }

    if (pos.x > this.trimDims[0] + this.props.margins[3]) {
      pos.x = this.trimDims[0] + this.props.margins[3]
    }

    if (pos.y > this.trimDims[1] + this.props.margins[0]) {
      pos.y = this.trimDims[1] + this.props.margins[0]
    }

    return pos;
  }

  /**
   * Generates new scales for dimensions, range and domain properties
   * @param config object
   */
  rescale(config = {}) {
    const conf = {...this.props, ...config};
    this.xStep = new Decimal(conf.xStep);
    this.trimDims = [conf.width - conf.margins[1] - conf.margins[3], conf.height - conf.margins[0] - conf.margins[2]];
    this.xRange = range(conf.xDomain[0], conf.xDomain[1] + 1, this.xStep.toFixed(2));

    // D3 scales
    this.xScale = scaleLinear()
      .range(conf.xRange ? conf.xRange : [0, this.trimDims[0]])
      .domain(conf.xDomain);
    this.yScale = scaleLinear()
      .range(conf.yRange ? conf.yRange : [this.trimDims[1], 0])
      .domain(conf.yDomain);
  }

  /**
   * Will move crosshairs to specific position
   * @param cursorPosition object {x: number, y: number} position of the cursor
   */
  handleCrosshairsMove(cursorPosition) {
    // Crosshair line and text are grouped for synchronized moving
    const xCrosshairGroup = this.canvas.layers.crosshairsLayer.getChildren()[0],
      yCrosshairGroup = this.canvas.layers.crosshairsLayer.getChildren()[1],
      xText = xCrosshairGroup.getChildren()[1],
      yText = yCrosshairGroup.getChildren()[1];

    if (!this.props.xCrosshairDisabled) {
      xCrosshairGroup.setAttr("x", cursorPosition.x - this.props.margins[3]);
      xText.setAttr("text", this.getCordXValue(xCrosshairGroup.getPosition().x + this.props.margins[3], 2));
    }

    if (!this.props.yCrosshairDisabled) {
      yCrosshairGroup.setAttr("y", cursorPosition.y - this.props.margins[0]);
      yText.setAttr("text", this.getCordYValue(yCrosshairGroup.getPosition().y + this.props.margins[0], 2));
    }

    this.canvas.layers.crosshairsLayer.batchDraw();

    !this.props.xCrosshairDisabled && this.xTicks.map((tick, index) => {
      // Crosshair is overlapping tick -> hide tick
      if (tick) {

        if (tick.x() >= cursorPosition.x - this.props.margins[3] - 20 && tick.x() <= cursorPosition.x) {
          this.xTicks[index].visible(false);
        }

        else {
          this.xTicks[index].visible(true);
        }
      }
    });

    !this.props.yCrosshairDisabled && this.yTicks.map((tick, index) => {
      // Crosshair is overlapping tick -> hide tick
      if (tick) {

        if (tick.y() >= cursorPosition.y - this.props.margins[0] - 10 && tick.y() <= cursorPosition.y) {
          this.yTicks[index].visible(false);
        }

        else {
          this.yTicks[index].visible(true);
        }
      }
    });

    this.canvas.layers.axisLayer.batchDraw();
  }

  /**
   * Generates ticks for x axis
   * @param count Number count of ticks
   * @return {Array} Array of arrays [[x,y],...] positions of ticks
   */
  getHorizontalTicks(count = 10) {
    const ret = [];
    this.xScale.ticks(count).map(tick => {
      ret.push([tick, this.trimDims[1]])
    });
    return ret
  }

  /**
   * Generates grid lines for x axis
   * @param count Number count of ticks
   * @return {Array} Array of arrays [[x,y],...] positions of lines
   */
  getHorizontalGrid(count = 10) {
    const ret = [];
    this.xScale.ticks(count).map(tick => {
      ret.push([tick, this.trimDims[1], tick, 0])
    });
    return ret
  }

  /**
   * Generates ticks for y axis
   * @param count Number of ticks
   * @return {Array} Array of arrays [[x,y],...] positions of ticks
   */
  getVerticalTicks(count = 10) {
    const ret = [];
    this.yScale.ticks(count).map(tick => {
      ret.push([this.trimDims[0], tick])
    });
    return ret
  }

  /**
   * Generates grid lines for y axis
   * @param count Number of ticks
   * @return {Array} Array of arrays [[x,y],...] positions of lines
   */
  getVerticalGrid(count = 10) {
    const ret = [];
    this.yScale.ticks(count).map(tick => {
      ret.push([this.trimDims[0], tick, 0, tick])
    });
    return ret
  }

  /**
   * Returns x value relative to x coordinate value
   * @param x number position on canvas
   * @param precision number precision for to fixed
   * @return {string}
   */
  getCordXValue(x, precision = 2) {
    // Value converted from canvas coords
    const value = (this.props.xDomain[1] - this.props.xDomain[0]) * (100 / (this.trimDims[0]) * (x - this.props.margins[3]) / 100);
    return (Number(this.props.xDomain[0]) + value).toFixed(precision);
  }

  /**
   * Returns y value relative to y coordinate value
   * @param y number position on canvas
   * @param precision number precision for to fixed
   * @return {string}
   */
  getCordYValue(y, precision = 2) {
    // Value converted from canvas coords
    const value = (this.props.yDomain[1] - this.props.yDomain[0]) * (100 / (this.trimDims[1]) * (y - this.props.margins[0]) / 100);
    return (Number(this.props.yDomain[1]) - value).toFixed(precision);
  }

  /**
   * Simple function will redraw konva layer by the name given
   * @param layer string layer name, one of [points, axis, crosshairs, labels, grid]
   */
  refreshLayer(layer) {
    const l = this.canvas.layers[`${layer}Layer`];
    if (l) {
      l.batchDraw();
    }
  }

  /**
   * Gets or sets current dataset config
   * @param dataset string dataset name
   * @param config object Konva config object
   * @return {*} object
   */
  datasetConfig(dataset, config = null) {

    if (this._datasets[dataset]) {

      // If config is not set, get current dataset config
      if (!config) {
        return this._datasets[dataset].config();
      }

      // Update dataset configs (will merge old and new)
      this._datasets[dataset].config(config);
      // Update visual signal
      this.refreshLayer("points");
      // Return renderable dataset points
      return config;
    }
  }

  /**
   * Gets or sets dataset points, scaled by functions supplied in parameters
   * @param dataset string dataset name
   * @param points array of arrays [[x0, y0],...] points
   * @param xFunc function to apply to each x value
   * @param yFunc function to apply to each y value
   * @return {Array}
   */
  datasetPoints(dataset, points = null, xFunc = this.xScale, yFunc = this.yScale) {

    if (this._datasets[dataset]) {

      // Points not set, get current dataset points
      if (!points) {
        return this._datasets[dataset].data();
      }

      let _points = [];

      // Points are set, set dataset points
      points.forEach(point => {
        _points.push(xFunc(point[0]));
        _points.push(yFunc(point[1]));
      });

      this._datasets[dataset].data(_points);
      // Update visual signal
      this.refreshLayer("points");
      // Return renderable dataset points
      return _points;
    }

  }

  render() {
    const {wrapper, children, width, height, margins, tickMargins, datasets, xAxisLabel, yAxisLabel, labelOffsets} = this.props;

    return (
      <Stage ref={(stage) => this.canvas.stage = stage}
             x={margins[3]}
             y={margins[0]}
             width={width}
             height={height}>
        <Layer ref={(layer) => this.canvas.layers["gridLayer"] = layer}>
          {
            this.getHorizontalGrid(this.xTicksCount).map((grid, index) => {
              return (
                <Line key={index}
                      points={[this.xScale(grid[0]), grid[1], this.xScale(grid[2]), grid[3]]}
                      {...config.axisTickLine}
                />)
            })
          }
          <Line points={[0, 0, this.trimDims[0], 0]} {...config.axisTickLine} />
          {
            this.getVerticalGrid(this.yTicksCount).map((grid, index) => {
              return (
                <Line key={index}
                      points={[grid[0], this.yScale(grid[1]), grid[2], this.yScale(grid[3])]}
                      {...config.axisTickLine}
                />)
            })
          }
        </Layer>

        <Layer ref={(layer) => this.canvas.layers["pointsLayer"] = layer}>
          {
            Object.keys(datasets).map(key => {
              return (<Dataset key={key} ref={(set) => this._datasets[key] = set}
                               y={this.yScale(datasets[key].config.y !== undefined ? datasets[key].config.y : 0)}
                               element={datasets[key].element ? datasets[key].element : "line"}
                               config={datasets[key].config}
                               data={this.datasetPoints(key, datasets[key].data)}/>)
            })
          }
          {
            children && (typeof children === "function" ? children(this) : children)
          }
        </Layer>

        <Layer ref={(layer) => this.canvas.layers["axisLayer"] = layer}>
          <Rect {...config.axisBackground} x={-margins[3]} y={-margins[0]}
                width={width} height={margins[0]}/>
          <Rect {...config.axisBackground} x={-margins[3]} y={-margins[0]}
                width={margins[3]} height={height}/>
          <Rect {...config.axisBackground} x={-margins[3]} y={height - margins[0] - margins[2]}
                width={width} height={margins[2]}/>
          {
            xAxisLabel && <Text text={`${xAxisLabel} →`} x={this.trimDims[0] - margins[1] / 2}
                                offsetX={labelOffsets.x[0]}
                                offsetY={labelOffsets.x[1]}
                                y={this.trimDims[1] / 2 + 5} {...config.axisLabel}/>
          }
          <Line
            points={[0, this.trimDims[1], this.trimDims[0], this.trimDims[1]]}
            {...config.axisLine}
          />
          {
            this.getHorizontalTicks(this.xTicksCount).map((tick, index) => {
              return (
                <Text key={index}
                      text={tick[0].toFixed(2)}
                      ref={(elem) => this.xTicks.push(elem)}
                      x={this.xScale(tick[0])}
                      y={tick[1]}
                      offsetX={10}
                      offsetY={-20}
                      {...config.axisTick}
                />);
            })
          }
          {
            yAxisLabel && <Text text={`${yAxisLabel} ↑`} x={this.trimDims[0] / 2 - margins[3] - 5}
                                offsetX={labelOffsets.y[0]}
                                offsetY={labelOffsets.y[1]}
                                y={margins[0] / 2} {...config.axisLabel}/>
          }
          <Line
            points={[this.trimDims[0], 0, this.trimDims[0], this.trimDims[1]]}
            {...config.axisLine}
          />
          <Rect {...config.axisBackground} x={this.trimDims[0]} y={0}
                width={margins[1]} height={this.trimDims[1]}/>
          {
            this.getVerticalTicks(this.yTicksCount).map((tick, index) => {
              return (
                <Text key={index}
                      text={tick[1].toFixed(2)}
                      ref={(elem) => this.yTicks.push(elem)}
                      x={tick[0] + tickMargins.y[0]}
                      y={this.yScale(tick[1])}
                      offsetY={5}
                      {...config.axisTick}
                />
              );
            })
          }
        </Layer>

        <Layer ref={(layer) => this.canvas.layers["crosshairsLayer"] = layer}>
          <Group x={0}
                 y={0}>
            <Line points={[0, 0, 0, this.trimDims[1]]}
                  {...config.crosshairLine}
                  name="xCrosshair"
            />
            <Text text={""}
                  x={tickMargins.x[0]}
                  y={this.trimDims[1] + tickMargins.x[1]}
                  {...config.crosshairText}
            />
          </Group>
          <Group x={0}
                 y={0}>
            <Line points={[0, 0, this.trimDims[0], 0]}
                  {...config.crosshairLine}
                  name="yCrosshair"
            />
            <Text text={""}
                  x={this.trimDims[0] + tickMargins.y[0] + 10}
                  y={tickMargins.y[1] - 5}
                  {...config.crosshairText}
            />
          </Group>
        </Layer>

        <Layer ref={(layer => this.canvas.layers["labelsLayer"] = layer)}>
          {
            this.getChartLabels().map((label, index) => {
              return (
                <Group key={index} x={label.x - margins[3]} y={label.y - margins[0]}>
                  <Rect x={0} y={0} width={label.width} height={label.height} {...label.config}/>
                  {label.content}
                </Group>
              )
            })
          }
        </Layer>

      </Stage>
    )
  }

}
