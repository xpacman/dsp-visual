/**
 * Created by paco on 27.2.18.
 */


export default class InterpolationEngine {

  static getNewtonInterpolationPolynomial(inputValues) {
    // We always need almost two points for interpolation
    if (inputValues.length < 2) {
      return false;
    }

    console.log(this.getDifferences([-2, 0, 1, 3], [-39, 3, 6, 36]));
  }

  /**
   * Returns array (table) of ratio differences used for Newton Polynomial Interpolation
   * Function will recursively iterate through input x and f(x) values and builds array (table) of differences up to
   * point count - 1. So for example, for 4 input points [x, fx] we will get table of up to 3rd level differences.
   * For example first level ratio difference is calculated like f[xi, xi+1] = (f(xi+1) - f(xi)) / (xi+1 - xi)
   * @param xValues array of x values [x1, x2,...]
   * @param fXValues array of f(x) values [f(x1), f(x2),...]
   * @param differences array (optional) ratio differences are stored here across recursive function calls
   * @param level int (optional) level of current ratio difference
   * @return {*} array [[1 level ratio differences], [2 level ratio differences],...]
   */
  static getDifferences(xValues, fXValues, differences = [], level = 0) {

    // If there is only one f(x) value, we are on the end -> return stair like array of differences
    if (fXValues.length === 1) {
      return differences;
    }

    // Differences of the current level
    const difference = [];

    for (let row = 0; row < fXValues.length - 1; row++) {
      difference.push((fXValues[row + 1] - fXValues[row]) / (xValues[row + 1 + level] - xValues[row]));
    }

    // Push current level ratio differences to the table (array)
    differences.push(difference);
    // We are about to move to next level differences -> increment
    level++;
    return this.getDifferences(xValues, difference, differences, level)
  }
}
