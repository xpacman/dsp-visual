/**
 * Created by paco on 13.2.18.
 */
import {scaleLinear, scaleBand, ticks} from 'd3-scale';

const defaultConfig = {
  // size of the chart [width, height]
  dimensions: [500, 500],
  // horizontal size of the chart [min, max]
  xRange: [0, 500],
  // x axis values [min, max]
  xDomain: [0, 1],
  // vertical size of the chart [min, max]
  yRange: [0, 500],
  // y axis values [min, max]
  yDomain: [0, 1],
  chartMargins: [0, 0, 0, 0]
};

/**
 * Class manages charts made with konva. Contains information about scales, min-max value domain, dimensions etc.
 */
export default class ChartManager {

  /**
   * @param config Object with props
   */
  constructor(config) {
    const conf = {...defaultConfig, ...config};
    this.rescale(conf.dimensions, conf.xRange, conf.xDomain, conf.yRange, conf.yDomain);
    // [top, right, bottom, left]
    this.chartMargins = conf.chartMargins;
  }

  /**
   * Generates new scales for dimensions, range and domain properties and also updates these properties
   * @param dimensions Array [width, height]
   * @param xRange Array [min, max]
   * @param xDomain Array [min, max]
   * @param yRange Array [min, max]
   * @param yDomain Array [min, max]
   */
  rescale(dimensions, xRange, xDomain, yRange, yDomain) {
    this.dimensions = dimensions;
    this.xRange = xRange;
    this.xDomain = xDomain;
    this.yRange = yRange;
    this.yDomain = yDomain;

    // D3 scales
    this.xScale = scaleLinear()
      .range(this.xRange)
      .domain(this.xDomain);
    this.yScale = scaleLinear()
      .range(this.yRange)
      .domain(this.yDomain);
  }

  /**
   * Generates ticks for x axis
   * @param count Number count of ticks
   * @return {Array} Array of arrays [[x,y],...] positions of ticks
   */
  getHorizontalTicks(count = 10) {
    const ret = [];
    this.xScale.ticks(count).map(tick => {
      ret.push([tick, this.dimensions[1] - this.chartMargins[2]])
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
      ret.push([tick, this.dimensions[1] - this.chartMargins[2], tick, this.chartMargins[0]])
    });
    return ret
  }

  /**
   * Generates ticks for y axis
   * @param count Number count of ticks
   * @return {Array} Array of arrays [[x,y],...] positions of ticks
   */
  getVerticalTicks(count = 10) {
    const ret = [];
    this.yScale.ticks(count).map(tick => {
      ret.push([this.dimensions[0] - this.chartMargins[1], tick])
    });
    return ret
  }

  /**
   * Generates grid lines for y axis
   * @param count Number count of ticks
   * @return {Array} Array of arrays [[x,y],...] positions of lines
   */
  getVerticalGrid(count = 10) {
    const ret = [];
    this.yScale.ticks(count).map(tick => {
      ret.push([this.dimensions[0] - this.chartMargins[1], tick, 0, tick])
    });
    return ret
  }

}
