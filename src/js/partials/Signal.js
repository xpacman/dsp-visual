/**
 * Created by paco on 7.4.18.
 */
const Decimal = require('decimal.js-light');
import {findIndexOfNearest} from '../utils/ArrayUtils';

export default class Signal {

  /**
   * @param values Array of arrays of values to set [ [x0, y0], ... ] optional
   * @param timeOffset number offset in time optional (default is zero)
   */
  constructor(values = [], timeOffset = 0) {
    // Minimum x value
    this.xMin = 0;
    // Maximum x value
    this.xMax = 0;
    // Step on x axis
    this.xStep = 0;
    // Function used to generate values
    this.func = null;
    // Time offset of this signal
    this._timeOffset = timeOffset;
    // Lastly set signal values array. Xmin and xMax will be set by automatically
    this._values = Array.isArray(values) && values.length > 0 ? this.values(values, true) : [];
  }

  /**
   * Will generate values for this signal. Will override current values.
   * @param xMin number minimal x value
   * @param xMax number maximal x value
   * @param step number step on x axis (between each x value)
   * @param func function function to generate values for each x
   * @return {Array|*} returns current signal values
   */
  generateValues(xMin, xMax, step = 0.01, func = null) {
    // Generated values will override current values
    this._values = [];
    this.xMin = xMin;
    this.xMax = xMax;
    this.xStep = step;
    this.func = func ? func : x => 0;

    step = new Decimal(step);
    xMax = new Decimal(xMax);
    for (let i = new Decimal(xMin); i.lessThanOrEqualTo(xMax); i = i.plus(step)) {

      this._values.push([i.toFixed(2), this.func(i.toFixed(2))]);
    }
    return this._values;
  }

  /**
   * Gets or sets signal values
   * @param values array of arrays [[x0, y0], ...]
   * @param withOffset boolean whether or not to consider current time offset
   * @param timeReverse boolean whether or not to reverse current values in time
   * @return {Signal.values}
   */
  values(values = null, withOffset = false, timeReverse = false) {

    if (!values) {
      let vals = this._values,
        ret = vals;

      if (timeReverse) {
        vals = this.timeReverse();
      }

      // If current time offset should be considered
      if (this.timeOffset() !== 0 && withOffset) {
        ret = [];
        const offset = new Decimal(this.timeOffset());
        vals.forEach(point => {
          ret.push([((new Decimal(point[0])).plus(offset)).toFixed(2), point[1]]);
        });
      }

      return ret;
    }

    if (values.length > 0) {
      // Adjust xDomain of the signal according to new values
      this.xDomain([values[0][0], values[values.length - 1][0]]);
    }
    return this._values = values;
  }

  /**
   * Returns current values reversed in time.
   * @return array points [[x0, y0],...] reversed in time
   */
  timeReverse() {
    const ret = [];
    this._values.forEach(point => ret.push([point[0] * -1, point[1]]));
    ret.sort((a, b) => a[0] - b[0]);
    return ret;
  }

  /**
   * Gets or sets current x domain
   * @param domain array [xMin, xMax]
   * @return array [xMin, xMax]
   */
  xDomain(domain = null) {

    if (!domain) {
      return [Number(this.xMin), Number(this.xMax)];
    }

    this.xMin = domain[0];
    this.xMax = domain[1];
    return domain;
  }

  /**
   * Returns point in signal as array [x, y] or undefined if point was not found in signal values
   * @param x number value of point to get
   * @return array|undefined
   */
  getPoint(x) {
    if (!isNaN(x)) {
      x = new Decimal(x);
      x = x.toFixed(2);
    }
    return this._values.find(point => {
      return point[0] === x
    });
  }

  /**
   * Returns array of points laying between min and max x provided
   * @param xMin
   * @param xMax
   * @return {Array.<[[x, y],...]>} points in range
   */
  getPointsInRange(xMin, xMax) {
    xMin = xMin < this.xMin ? this.xMin : xMin;
    xMax = xMax > this.xMax ? this.xMax : xMax;
    let minIndex = this._values.indexOf(this.getPoint(xMin)),
      maxIndex = this._values.indexOf(this.getPoint(xMax));

    // In case of negative values on x axis, we have to swap values
    if (minIndex > maxIndex) {
      const tmp = minIndex;
      minIndex = maxIndex;
      maxIndex = tmp;
    }

    if (xMax === this.xMax) {
      return this._values.slice(minIndex);
    }

    return this._values.slice(minIndex, maxIndex + 1);
  }

  /**
   * Sets value of point. If point exists, overrides its value, if it doesnt exist way it creates new point
   * and appends it before or after nearest point and returns newly set point
   * @param x value of the point
   * @param y value of the point
   * @return {[*,*]}
   */
  setPoint(x, y) {
    if (!isNaN(x)) {
      x = new Decimal(x);
      x = x.toFixed(2);
    }
    const point = this.getPoint(x);
    // If were able to get the point
    if (point) {
      // Set y value of the point
      point[1] = y;
    } else {
      // If no points are specified, just push new point
      if (this._values.length === 0) {
        this._values.push([x, y])
      } else {
        // Get nearest point index
        const nearest = findIndexOfNearest(this._values, (point => point[0]), x);
        // Check wheter to put new point before or after this nearest point
        if (this._values[nearest][0] > x) {
          this._values.splice(nearest, 0, [x, y]);
        } else {
          this._values.splice(nearest + 1, 0, [x, y]);
        }
      }

    }
    return [x, y];
  }

  /**
   * Returns samples from signal given
   * @param samplingRate number sampling frequency in Hz
   * @param signal Signal to sample
   * @return {Array} [[x0, y0],...] array of samples
   */
  static getSamples(samplingRate, signal) {
    // Get period from sampling frequency
    const period = 1 / samplingRate,
      xDomain = signal.xDomain(),
      samples = [];

    for (let i = xDomain[1]; i >= xDomain[0]; i -= period) {
      const x = new Decimal(Math.floor(i / period)),
        point = signal.getPoint(i),
        sample = [Math.floor(x).toFixed(2), 0];

      if (point) {
        sample[1] = point[1];
      }
      samples.unshift(sample);
    }

    return samples;
  }

  /**
   * Gets or sets time offset for this signal
   * @param offset
   * @return {*}
   */
  timeOffset(offset) {

    if (!offset) {
      return this._timeOffset;
    }

    return this._timeOffset = offset;
  }

}
