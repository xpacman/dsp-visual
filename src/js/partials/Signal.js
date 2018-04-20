/**
 * Created by paco on 7.4.18.
 */
const Decimal = require('decimal.js-light');

export default class Signal {

  /**
   * @param xMin number minimum of x domain
   * @param xMax number maximum of x domain
   * @param step number sample step optional
   * @param values Array of arrays of values to set [ [x0, y0], ... ] optional
   * @param func function to apply for each x value optional (default null means input equals to output)
   * @param timeOffset number offset in time optional (default is zero)
   */
  constructor(xMin, xMax, step = 0.01, values = null, func = null, timeOffset = 0) {

    this.xMin = xMin;
    this.xMax = xMax;
    this.step = step;

    // Signal values array
    this._values = [];
    // Function used to generate values
    this.func = func ? func : x => 0;

    // If values are not set -> generate them
    if (!values) {
      step = new Decimal(step);
      xMax = new Decimal(xMax);

      for (let i = new Decimal(xMin); i.lessThanOrEqualTo(xMax); i = i.plus(step)) {

        this._values.push([i.toFixed(2), this.func(i.toFixed(2))]);
      }
    } else {
      this._values = values;
    }
    this._timeOffset = timeOffset;
  }

  /**
   * Gets or sets signal values
   * @param values array of arrays [[x0, y0], ...]
   * @param withOffset whether or not to take current time offset
   * @return {Signal.values}
   */
  values(values = null, withOffset = false) {
    if (!values) {

      // Dont forget current time offset
      if (this.timeOffset() !== 0 && withOffset) {
        const ret = [],
          offset = new Decimal(this.timeOffset());
        this._values.forEach(point => {
          ret.push([((new Decimal(point[0])).plus(offset)).toFixed(2), point[1]]);
        });
        // Return offseted values
        return ret;
      } else {
        return this._values;
      }
    }

    return this._values = values;
  }

  /**
   * Returns point in signal as array [x, y] or undefined if point was not found in signal values
   * @param x number value of point to get
   * @return array|undefined
   */
  getPoint(x) {
    x = new Decimal(x);
    return this._values.find(point => {
      return point[0] === x.toFixed(2)
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
    x = new Decimal(x);
    x = x.toFixed(2);
    const point = this.getPoint(x);
    // If were able to get the point
    if (point) {
      // Set y value of the point
      point[1] = y;
    } else {
      // Get nearest point index
      const nearest = Signal.findIndexOfClosest(this._values, x);
      // Check wheter to put new point before or after this nearest point
      if (this._values[nearest][0] > x) {
        this._values.splice(nearest, 0, [x, y]);
      } else {
        this._values.splice(nearest + 1, 0, [x, y]);
      }
    }
    return [x, y];
  }

  /**
   * Gets index of closest point
   * @param arr
   * @param target
   * @return {number}
   */
  static findIndexOfClosest(arr, target) {
    let closest = Number.MAX_SAFE_INTEGER;
    let index = 0;

    arr.forEach((point, i) => {
      let dist = Math.abs(target - point[0]);

      if (dist < closest) {
        index = i;
        closest = dist;
      }
    });
    return index;
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
