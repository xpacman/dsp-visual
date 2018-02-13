/**
 * Created by paco on 13.2.18.
 */
import {scaleLinear, scaleBand, ticks} from 'd3-scale';


export default class CanvasManager {

  /**
   *
   * @param dimensions Array [Width, Height] of canvas
   * @param xRange Array [min, max]
   * @param xDomain Array [min, max]
   * @param yRange Array [min, max]
   * @param yDomain Array [min, max]
   */
  constructor(dimensions = [500, 500], xRange = [0, 1], xDomain = [0, 1], yRange = [0, 1], yDomain = [0, 1]) {
    // [width, height] of canvas
    this._dimensions = dimensions;
    this._xRange = xRange;
    this._xDomain = xDomain;
    this._yRange = yRange;
    this._yDomain = yDomain;

    // D3 scales
    this._xScale = scaleLinear()
      .range(this._xRange)
      .domain(this._xDomain);

    this._yScale = scaleLinear()
      .range(this._yRange)
      .domain(this._yDomain);

  }

  /**
   * Generate new scales for range and domain properties
   */
  rescale() {
    this._xScale
      .range(this.xRange)
      .domain(this.xDomain);
    this._yScale
      .range(this.yRange)
      .domain(this.yDomain);
  }

  get dimensions() {
    return this._dimensions;
  }

  set dimensions(value) {
    this._dimensions = value;
  }

  get xRange() {
    return this._xRange;
  }

  set xRange(value) {
    this._xRange = value;
  }

  get xDomain() {
    return this._xDomain;
  }

  set xDomain(value) {
    this._xDomain = value;
  }

  get yRange() {
    return this._yRange;
  }

  set yRange(value) {
    this._yRange = value;
  }

  get yDomain() {
    return this._yDomain;
  }

  set yDomain(value) {
    this._yDomain = value;
  }

  get xScale() {
    return this._xScale;
  }

  set xScale(value) {
    this._xScale = value;
  }

  get yScale() {
    return this._yScale;
  }

  set yScale(value) {
    this._yScale = value;
  }
}
