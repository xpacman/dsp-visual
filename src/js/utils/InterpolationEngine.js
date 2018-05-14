/**
 * Created by paco on 27.2.18.
 */

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
   * Returns zero order (stair) interpolation from input values (signal [[x1, y1],...])
   * @param inputValues Array of signal points [[x1, y1],...]
   * @return {Array} of interpolated points [[x1, y1],...]
   */
  static getZeroOrderHoldInterpolation(inputValues) {
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
    if (!interpolatedPoints) {
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

/**
 * Class representing polynomial, supports multiplication
 */
class Poly {

  constructor(coeff) {
    this.coeff = !(coeff instanceof Array) ? Array.prototype.slice.call(arguments) : coeff;
    this.length = this.coeff.length;
    this.multiply = function (poly) {
      if (!poly) return this;

      const totalLength = this.coeff.length + poly.coeff.length - 1,
        result = new Array(totalLength);

      for (let i = 0; i < result.length; i++)
        result[i] = 0;

      for (let i = 0; i < this.coeff.length; i++) {
        for (let j = 0; j < poly.coeff.length; j++) {
          result[i + j] += this.coeff[i] * poly.coeff[j];
        }
      }
      return new Poly(result);
    }
  }

  /**
   * Will make binomials from arguments and multiplies them recursively
   * @return {undefined}
   */
  static multiply() {
    let args = Array.prototype.slice.call(arguments),
      result = undefined;

    for (let i = 0; i < args.length; i++) {
      if (!(args[i] instanceof Poly))
        args[i] = new Poly(args[i]);

      result = args[i].multiply(result);
    }
    return result;
  };

  /**
   * Solves polynomial for x value
   * @param x number X value to solve polynomial for
   * @return {number}
   */
  solve(x) {
    let multiStr = [],
      ret = 0;
    for (let i = this.coeff.length - 1; i >= 0; i--) {
      for (let j = this.coeff[i].length - 1; j >= 0; j--) {
        if (!multiStr[j]) {
          multiStr[j * 2] = 0;
          multiStr[j * 2 + 1] = j.toFixed(1); // as string !important
        }
        multiStr[j * 2] += this.coeff[i].coeff[j];
      }
    }

    for (let i = 0; i < this.coeff.length; i++) {
      ret += multiStr[i * 2] * Math.pow(x, parseFloat(multiStr[i * 2 + 1]));
    }
    return ret
  }

  /**
   * Will return string interpretation of polynomial in final form
   * @return {string}
   */
  toString() {
    let multiStr = [];
    for (let i = this.coeff.length - 1; i >= 0; i--) {
      for (let j = this.coeff[i].length - 1; j >= 0; j--) {
        if (!multiStr[j]) {
          multiStr[j * 2] = 0;
          multiStr[j * 2 + 1] = ( (j !== 0 ? " x" : "") + (j !== 1 && j !== 0 ? "<sup>" + j + "</sup>" : "") ) + " +";
        }
        multiStr[j * 2] += this.coeff[i].coeff[j];
      }
    }

    for (let i = multiStr.length - 2; i >= 0; i -= 2) {
      multiStr[i] = parseFloat(multiStr[i].toFixed(7));
      if (multiStr[i + 2] < 0 || !multiStr[i + 2])
        multiStr[i + 1] = multiStr[i + 1].replace(/\+\s?$/, '');
    }

    return multiStr.join('').replace(/([\-\+])/g, ' $1 ')
  }
}
