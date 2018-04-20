/**
 * Created by paco on 10.4.18.
 */

import React from "react";
import PropTypes from 'prop-types';
import * as config from "../../config";
import {Stage, Layer, Rect, Line, Text, Group, Circle} from "react-konva";
import {scaleLinear, scaleBand, ticks} from 'd3-scale';
import Konva from "konva";
import {arrayEquals} from "../../utils/utils";

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
    // horizontal size of the chart [min, max]
    xRange: PropTypes.array,
    // x axis values [min, max]
    xDomain: PropTypes.array,
    // vertical size of the chart [min, max]
    yRange: PropTypes.array,
    // y axis values [min, max]
    yDomain: PropTypes.array,
    // Datas for chart -> {dataset name: [array of points]}
    datasets: PropTypes.object,
    // Config object for datasets {dataset name: {Konva Element konfigs}}
    config: PropTypes.object,
    // Children to be displayed in the plot area
    children: PropTypes.oneOfType([PropTypes.func, PropTypes.element, PropTypes.array, PropTypes.object]),
    // Content click callback
    onContentMousedown: PropTypes.func,
    // Content mouse up callback
    onContentMouseup: PropTypes.func,
    // Content mouse drag callback
    onContentMousedrag: PropTypes.func,
  };

  static defaultProps = {
    width: 500,
    height: 500,
    margins: [20, 75, 50, 20],
    xDomain: [0, 1],
    yDomain: [0, 1],
    tickMargins: {x: [0, 20], y: [20, 0]},
    datasets: {},
    config: {}
  };

  constructor(props) {
    super(props);

    // Linear Scales
    this.xScale = null;
    this.yScale = null;
    this.rescale(props);

    // Is mouse dragging
    this.isDragging = false;

    // Trimmed dimensions (including margins) -> [trimmed width, trimmed height]
    this.trimDims = [props.width - props.margins[1] - props.margins[3], props.height - props.margins[0] - props.margins[2]];

    // Last pointer position
    this.lastPointerPosition = null;
    // Current pointer position
    this.pointerPosition = null;

    // Refs
    this.xTicks = []; // X Ticks refs
    this.yTicks = []; // Y Ticks refs
    this.canvas = {
      stage: null,
      layers: []
    }; // Canvas refs holder
    // Konva lines
    this.dataLines = [];
    this._datasets = props.datasets;
  }

  componentDidMount() {

    // Delayed mount of konva components
    this.forceUpdate();

    // On mouse click callback
    if (this.canvas.stage) {
      this.canvas.stage.getStage().on("contentMousedown.proto", () => {
        this.isDragging = true;
        this.lastPointerPosition = this.getPointerPosition();
        this.pointerPosition = this.getPointerPosition();

        return this.props.onContentMousedown && this.props.onContentMousedown(this);
      });

      // On mouse up callback
      this.canvas.stage.getStage().on("contentMouseup.proto", () => {
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
          this.handleCrosshairsMove(cursorPosition);
        }

        // Click and drag block
        if (!this.isDragging) {
          return;
        }

        this.pointerPosition = cursorPosition;

        this.props.onContentMousedrag && this.props.onContentMousedrag(this);
        return this.lastPointerPosition = this.pointerPosition;
      });
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
    this.trimDims = [conf.width - conf.margins[1] - conf.margins[3], conf.height - conf.margins[0] - conf.margins[2]];

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
    const xCrosshairGroup = this.canvas.layers.crosshairsLayer.getChildren()[0];
    const yCrosshairGroup = this.canvas.layers.crosshairsLayer.getChildren()[1];
    xCrosshairGroup.setAttr("x", cursorPosition.x - this.props.margins[3]);
    yCrosshairGroup.setAttr("y", cursorPosition.y - this.props.margins[0]);
    const xText = xCrosshairGroup.getChildren()[1];
    xText.setAttr("text", this.getCordXValue(xCrosshairGroup.getPosition().x + this.props.margins[3], 2));
    const yText = yCrosshairGroup.getChildren()[1];
    yText.setAttr("text", this.getCordYValue(yCrosshairGroup.getPosition().y + this.props.margins[0], 2));
    this.canvas.layers.crosshairsLayer.batchDraw();

    this.xTicks.map((tick, index) => {
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

    this.yTicks.map((tick, index) => {
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
    return (this.props.xDomain[0] + value).toFixed(precision);
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
    return (this.props.yDomain[1] - value).toFixed(precision);
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
    // Prepare points for rendering
    let _points = [];

    // Points not set, get current dataset points
    if (!points) {

      if (!this._datasets[dataset]) {
        return console.log("Invalid dataset!");
      }

      this._datasets[dataset].forEach(point => {
        _points.push(xFunc(point[0]));
        _points.push(yFunc(point[1]));
      });

      // Return renderable dataset points
      return _points;
    }

    // Points are set, set dataset points
    this._datasets[dataset] = points;
    _points = this.datasetPoints(dataset);
    // Update visual signal
    this.dataLines[dataset].attrs.points = _points;
    this.canvas.layers.pointsLayer.batchDraw();
    return _points;
  }

  /**
   * Returns Konva config for dataset. Will fallback to default configs if not found.
   * @param dataset string name of the dataset
   * @return {*}
   */
  getDatasetConfig(dataset) {
    if (this.props.config[dataset]) {
      return this.props.config[dataset]
    }

    return config.signalLine.line
  }

  render() {
    const {wrapper, width, height, margins, tickMargins, datasets, xDomain, xRange, yDomain, yRange, children} = this.props;

    return (
      <Stage ref={(stage) => this.canvas.stage = stage}
             x={margins[3]}
             y={margins[0]}
             width={width}
             height={height}>
        <Layer ref={(layer) => this.canvas.layers["gridLayer"] = layer}>
          {
            this.getHorizontalGrid(10).map((grid, index) => {
              return (
                <Line key={index}
                      points={[this.xScale(grid[0]), grid[1], this.xScale(grid[2]), grid[3]]}
                      {...config.axisTickLine}
                />)
            })
          }
          {
            this.getVerticalGrid(10).map((grid, index) => {
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
              return <Line key={key} ref={(line) => this.dataLines[key] = line} {...this.getDatasetConfig(key)}
                           points={this.datasetPoints(key)}/>
            })
          }
        </Layer>

        <Layer ref={(layer) => this.canvas.layers["axisLayer"] = layer}>
          <Line
            points={[0, this.trimDims[1], this.trimDims[0], this.trimDims[1]]}
            {...config.axisLine}
          />
          {
            this.getHorizontalTicks(10).map((tick, index) => {
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
          <Rect {...config.axisBackground} x={0} y={height}
                width={width} height={margins[2]}/>
          <Line
            points={[this.trimDims[0], 0, this.trimDims[0], this.trimDims[1]]}
            {...config.axisLine}
          />
          <Rect {...config.axisBackground} x={this.trimDims[0]} y={0}
                width={margins[1]} height={this.trimDims[1]}/>
          {
            this.getVerticalTicks(10).map((tick, index) => {
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

      </Stage>
    )
  }

}
