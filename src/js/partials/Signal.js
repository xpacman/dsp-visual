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
   * @param func function to apply for each x value optional (default y value is zero)
   */
  constructor(xMin, xMax, step = 0.01, values = null, func = x => 0) {

    // Signal values array
    this._values = [];
    // Function used to generate values
    this.func = func;

    // If values are not set -> generate them
    if (!values) {
      step = new Decimal(step);
      xMax = new Decimal(xMax);

      for (let i = new Decimal(xMin); i.lessThanOrEqualTo(xMax); i = i.plus(step)) {
        this._values.push([i.toFixed(2), func(i.toFixed(2))]);
      }
    } else {
      this._values = values;
    }

  }

  /**
   * Gets or sets signal values
   * @param values array of arrays [[x0, y0], ...]
   * @return {Signal.values}
   */
  values(values = null) {
    if (!values) {
      return this._values;
    }
    return this._values = values;
  }

  /**
   * Returns point in signal as array [x, y] or undefined if point was not found in signal values
   * @param x number value of point to get
   * @return array|undefined
   */
  getPoint(x) {
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
    const minIndex = this._values.indexOf(this.getPoint(xMin));
    const maxIndex = this._values.indexOf(this.getPoint(xMax));
    return this._values.slice(minIndex, maxIndex);
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

}
