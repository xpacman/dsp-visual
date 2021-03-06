/**
 * Created by paco on 27.2.18.
 */
const Decimal = require('decimal.js-light');
import Poly from "./Poly";

export default class InterpolationEngine {

  /**
   * Method will split input values given as array of arrays [[x1, y1],...] into two separate arrays of x and y values
   * Interpolation methods works with these
   * @param inputValues Array of arrays [[x1, y1],...]
   * @return {[*,*]} Array [x array, y array]
   */
  static splitPoints(inputValues) {
    const x = [],
      fx = [];

    inputValues.map(point => {
      x.push(parseFloat(point[0]));
      fx.push(parseFloat(point[1]));
    });
    return [x, fx];
  }

  /**
   * Returns zero order (stair) interpolation values to be displayed as konva line
   * @param inputValues Array of signal points [[x1, y1],...]
   * @return {Array} of interpolated points [[x1, y1],...]
   */
  static getZeroOrderHoldLine(inputValues) {
    const ret = [];

    inputValues.map((point, index) => {
      ret.push([point[0], point[1]]);

      if (inputValues[index + 1] !== undefined) {
        ret.push([inputValues[index + 1][0], point[1]]);
      }
    });

    return ret;
  }

  /**
   * Will return zero order hold interpolation in time given
   * @param samples array of arrays [[x0,y0],...]
   * @param samplingPeriod number sampling period
   * @param t number target time to interpolate
   * @param precision number of decimal places to work with
   * @return {number}
   */
  static zeroOrderHoldInterpolation(samples, samplingPeriod, t, precision = 3) {
    t = Number(t) + 0.001;
    const period = new Decimal(samplingPeriod),
      // Reconstruction function
      h = (time) => {
        if (0 <= time && time <= samplingPeriod) {
          // Zero order hold -> 1 for 0 <= t <= T
          return 1
        }
        return 0
      };
    let result = 0;
    samples.forEach((sample, i) => {
      result += sample[1] * h(t - i * period.toFixed(precision));
    });
    return result;
  }

  /**
   * Will return first order hold interpolation in time given
   * @param samples array of arrays [[x0,y0],...]
   * @param samplingPeriod number sampling period
   * @param t number target time to interpolate
   * @param precision number of decimal places to work with
   * @return {number}
   */
  static firstOrderHoldInterpolation(samples, samplingPeriod, t, precision = 3) {
    const period = new Decimal(samplingPeriod),
      // Reconstruction function
      h = (time) => {
        if (0 <= Math.abs(time) && Math.abs(time) <= period.toFixed(precision)) {
          // First order hold -> 1 - |t|/T for 0 <= |t| <= T
          return 1 - (Math.abs(time) / period.toFixed(precision));
        }
        return 0
      };
    let result = 0;
    samples.forEach((sample, i) => {
      result += sample[1] * h(t - i * period.toFixed(precision))
    });
    return result;
  }

  /**
   * Method will calculate Newton interpolation for given array of x values and returns result as array
   * @param inputValues Array of arrays (input points) [ [x1, y1], [x2, y2],... ] to calculate interpolation polynomial from
   * @param interpolatedPoints Array || Number X value(s) to calculate interpolation for. By default, all input X values
   * will be interpolated
   * @return {*} Array of interpolated points [ [x, interpolationResult],... ]
   */
  static newtonInterpolation(inputValues, interpolatedPoints = null) {
    // We always need almost two points for interpolation
    if (inputValues.length < 2) {
      return false;
    }

    // getNewtonPoly method works with separated x and y values so extract them from input values
    const splitPoints = this.splitPoints(inputValues),
      poly = this.getNewtonPoly(splitPoints[0], splitPoints[1]),
      ret = [];

    // Interpolate all input x values by default
    if (interpolatedPoints === null) {
      interpolatedPoints = splitPoints[0]
    }

    // If user entered only one number to calculate interpolation for, make array from it
    else if (!Array.isArray(interpolatedPoints)) {
      interpolatedPoints = [parseFloat(interpolatedPoints)];
    }

    // Calculate interpolation for each x point
    // P(x) = a0 + a1 * (x - x0) + a2 * (x - x0)*(x - x1) + a3 * (x - x0)*(x - x1)*(x - x2),...an * (x - x0)*...(x - xn-1)
    interpolatedPoints.map(xValue =>
      // Push result point [x, interpolationValue]
      ret.push([xValue, poly.solve(xValue)])
    );

    return ret;
  }

  /**
   * Will return string representation of Newton Interpolation Polynomial
   * @param inputValues Array of arrays [[x1, y1],...]
   * @return {*} Array
   */
  static getNewtonPolyEquation(inputValues) {
    if (inputValues.length < 2) {
      return false;
    }

    const splitPoints = this.splitPoints(inputValues);

    return this.getNewtonPoly(splitPoints[0], splitPoints[1]).toString()
  }

  /**
   * Returns Polynomial (Poly class) with ratio differences as coefficients
   * @param xValues Array of x values [x1, x2,...]
   * @param fXValues Array of f(x) values [f(x1), f(x2),...]
   * @return {Poly}
   */
  static getNewtonPoly(xValues, fXValues) {

    const parseNum = (v) => parseFloat(v),
      n = Math.min(xValues.length, fXValues.length),
      diff = [];
    xValues = xValues.map(parseNum);
    fXValues = fXValues.map(parseNum);

    // Iterate through input x and f(x) values and builds array (table) of ratio differences for polynomial construction
    for (let i = 0; i < n; i++) {
      diff[i] = fXValues[0];
      for (let j = 1; j < n - i; j++)
        // For example first level ratio difference is calculated like f[xi, xi+1] = (f(xi+1) - f(xi)) / (xi+1 - xi)
        fXValues[j - 1] = parseFloat(((fXValues[j] - fXValues[j - 1]) / (xValues[j + i] - xValues[j - 1])).toFixed(7));
    }

    let newtonPoly = [new Poly(diff[0])];
    for (let i = 1; i < diff.length; i++) {
      const pairs = [diff[i]];
      for (let j = 0; j < i; j++) {
        pairs.push([-xValues[j], 1]);
      }
      newtonPoly.push(Poly.multiply.apply(undefined, pairs));
    }

    return new Poly(newtonPoly);
  }

}
