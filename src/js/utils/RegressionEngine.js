/**
 * Created by paco on 26.2.18.
 */
import linear from 'linear-solve';


export default class RegressionEngine {

  /**
   * Returns array of points approximated by line
   * Equation => y = ax + b
   * @param inputValues [[x1, y1],...]
   * @return Array of arrays [[x1, y1], [x2, y2],....]
   */
  static getLineApproximation(inputValues) {
    // Method getCoefficient ensures validation
    const coef = this.getCoefficients(inputValues);
    const ret = [];

    inputValues.map((point) => ret.push([point[0], coef.line[0] * point[0] + coef.line[1]]));
    return ret;
  }

  /**
   * Returns array of points approximated by parabola
   * Equation => y = c0 + c1x + c2x^2
   * @param inputValues [[x1, y1],...]
   * @return Array of arrays [[x1, y1], [x2, y2],....]
   */
  static getParabolaApproximation(inputValues) {
    // Method getCoefficient ensures validation
    const coef = this.getCoefficients(inputValues);
    const ret = [];

    inputValues.map(point =>
      ret.push([point[0], coef.parabola[0] + coef.parabola[1] * point[0] + coef.parabola[2] * Math.pow(point[0], 2)]));
    return ret;
  }

  /**
   * Returns array of points approximated by exponential
   * Equation => y = e^a * e^bx
   * @param inputValues [[x1, y1],...]
   * @return Array of arrays [[x1, y1], [x2, y2],....]
   */
  static getExponentialApproximation(inputValues) {
    // Method getCoefficient ensures validation
    const coef = this.getCoefficients(inputValues);
    const ret = [];

    inputValues.map(point =>
      ret.push([point[0], Math.exp(coef.exponential[0]) * Math.exp(coef.exponential[1] * point[0])]));
    return ret;
  }

  /**
   * Returns equation for line approximation as string
   * @param inputValues [[x1, y1],...]
   * @param decimalPlaces default = 4
   * @return {string}
   */
  static getLineEquation(inputValues, decimalPlaces = 4) {
    const coef = this.getCoefficients(inputValues);

    return `y = ${coef.line[0].toFixed(decimalPlaces)}x + ${coef.line[1].toFixed(decimalPlaces)}`;
  }

  /**
   * Returns equation for parabola approximation as string
   * @param inputValues [[x1, y1],...]
   * @param decimalPlaces default = 4
   * @return {string}
   */
  static getParabolaEquation(inputValues, decimalPlaces = 4) {
    const coef = this.getCoefficients(inputValues);

    return `y = ${coef.parabola[0].toFixed(decimalPlaces)} + ${coef.parabola[1].toFixed(decimalPlaces)}x +
     ${coef.parabola[2].toFixed(decimalPlaces)}x^2`;
  }

  /**
   * Returns equation for exponential approximation as string
   * @param inputValues [[x1, y1],...]
   * @param decimalPlaces default = 4
   * @return {string}
   */
  static getExponentialEquation(inputValues, decimalPlaces = 4) {
    const coef = this.getCoefficients(inputValues);

    return `y = e^${coef.exponential[0].toFixed(decimalPlaces)} * e^${coef.exponential[1].toFixed(decimalPlaces)}x`;
  }

  /**
   * Returns sum of least squares areas approximated by line
   * SUM (yi - (b + a * xi)^2
   * @param inputValues [[x1, y1],...]
   * @return float squares areas sum
   **/
  static getLineLeastSquares(inputValues) {
    // Method getCoefficient ensures validation
    const coef = this.getCoefficients(inputValues);
    let r2 = 0;

    inputValues.map(point => r2 += Math.pow(point[1] - (coef.line[1] + coef.line[0] * point[0]), 2));
    return r2;
  }

  /**
   * Returns sum of least squares areas approximated by parabola
   * SUM (yi - a - b * xi - c * xi^2)^2
   * @param inputValues [[x1, y1],...]
   * @return float squares areas sum
   **/
  static getParabolaLeastSquares(inputValues) {
    // Method getCoefficient ensures validation
    const coef = this.getCoefficients(inputValues);
    let r2 = 0;

    inputValues.map(point =>
      r2 += Math.pow(point[1] - coef.parabola[0] - coef.parabola[1] * point[0] -
        coef.parabola[2] * Math.pow(point[0], 2), 2));
    return r2;
  }

  /**
   * Returns sum of least squares areas approximated by exponential
   * SUM yi(ln(yi) - a - b * xi)^2
   * @param inputValues [[x1, y1],...]
   * @return float squares areas sum
   **/
  static getExponentialLeastSquares(inputValues) {
    // Method getCoefficient ensures validation
    const coef = this.getCoefficients(inputValues);
    let r2 = 0;

    inputValues.map(point =>
      r2 += point[1] * Math.pow(Math.log(point[1]) - coef.exponential[0] - coef.exponential[1] * point[0], 2));
    return r2;
  }

  /**
   * Calculates coefficients for approximations and returns them as object with key named like approximation and
   * value as array of coefficients
   * @param inputValues [[x1, y1],...]
   * @return {*} Object with keys line: array, parabola: array, exponential: array
   */
  static getCoefficients(inputValues) {
    // We always need almost two points for approximation
    if (inputValues.length < 2) {
      return false;
    }

    let n = inputValues.length,
      xi = 0,
      yi = 0,
      xiPow = 0,
      xiPow_3 = 0,
      xiPow_4 = 0,
      xiyi = 0,
      xiPowYi = 0,
      xi_lnyi = 0,
      lnyi = 0;

    inputValues.map((point) => {
      if (point.length !== 2) {
        return false;
      }

      xi += point[0];
      xiPow += Math.pow(point[0], 2);
      xiPow_3 += Math.pow(point[0], 3);
      xiPow_4 += Math.pow(point[0], 4);
      yi += point[1];
      xiyi += point[1] * point[0];
      xiPowYi += point[1] * Math.pow(point[0], 2);
      xi_lnyi += point[0] * Math.log(point[1]);
      lnyi += Math.log(point[1]);
    });

    // Get coefficients
    const lineA = (xi * yi - n * xiyi) / (Math.pow(xi, 2) - n * xiPow);
    const lineB = (xi * xiyi - xiPow * yi) / (Math.pow(xi, 2) - n * xiPow);
    const parabolaCoef = linear.solve([[n, xi, xiPow], [xi, xiPow, xiPow_3], [xiPow, xiPow_3, xiPow_4]], [yi, xiyi, xiPowYi]);
    const exponentialB = (n * xi_lnyi - xi * lnyi) / (n * xiPow - Math.pow(xi, 2));
    const exponentialA = (lnyi * xiPow - xi * xi_lnyi) / (n * xiPow - Math.pow(xi, 2));

    return {
      line: [lineA, lineB],
      parabola: [parabolaCoef[0], parabolaCoef[1], parabolaCoef[2]],
      exponential: [exponentialA, exponentialB]
    }
  }

}
