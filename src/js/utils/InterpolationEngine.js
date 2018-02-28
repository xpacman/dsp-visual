/**
 * Created by paco on 27.2.18.
 */


export default class InterpolationEngine {

  /**
   * Method will calculate Newton interpolation for given array of x values and returns result as array or as a number
   * if only one point is given
   * @param inputValues Array of arrays (input points) [ [x1, y1], [x2, y2],... ]
   * @param xValues Array || Number X value(s) to calculate interpolation for
   * @return {*} Array of interpolated points [ [x, interpolationResult],... ]
   */
  static getNewtonInterpolation(inputValues, xValues) {
    // We always need almost two points for interpolation
    if (inputValues.length < 2) {
      return false;
    }

    // If user entered only one number to calculate interpolation for, make array from it but first check if its a number
    if (!Array.isArray(xValues)) {

      if (isNaN(xValues)) {
        return false
      }

      xValues = [xValues];
    }

    // getDifferences method works with separated x and y values so extract them from input values
    const xInputValues = [],
      fXInputValues = [];

    inputValues.map(point => {
      xInputValues.push(point[0]);
      fXInputValues.push(point[1]);
    });

    const differences = this.getDifferences(xInputValues, fXInputValues),
      ret = [];

    // Calculate interpolation for each x point
    // P(x) = a0 + a1 * (x - x0) + a2 * (x - x0)*(x - x1) + a3 * (x - x0)*(x - x1)*(x - x2),...an * (x - x0)*...(x - xn-1)
    xValues.map(xValue => {
      // fXValues[0] is the zero level ratio difference coefficient (a0)
      let result = fXInputValues[0];

      for (let i = 0; i < differences.length; i++) {
        let step = differences[i];

        for (let y = 0; y <= i; y++)
          step *= (xValue - xInputValues[y])

        // Step by step... :)
        result += step;
      }

      // Push result point [x, interpolationValue]
      ret.push([xValue, result]);
    });

    return ret;
  }

  /**
   * Returns array (table) of ratio differences used for Newton Polynomial Interpolation
   * Function will recursively iterate through input x and f(x) values and builds array (table) of differences up to
   * point count - 1. So for example, for 4 input points [x, fx] we will get table of up to 3rd level differences.
   * For example first level ratio difference is calculated like f[xi, xi+1] = (f(xi+1) - f(xi)) / (xi+1 - xi)
   * @param xValues Array of x values [x1, x2,...]
   * @param fXValues Array of f(x) values [f(x1), f(x2),...]
   * @param differences Array (optional) ratio differences are stored here across recursive function calls
   * @param level int (optional) level of current ratio difference
   * @return {*} Array [[1 level ratio difference coefficient (a1)], [2 level ratio difference coefficient (a2)],...]
   */
  static getDifferences(xValues, fXValues, differences = [], level = 0) {

    // If there is only one f(x) value, we are on the end -> return array of ratio difference coefficients
    if (fXValues.length === 1) {
      return differences;
    }

    // Differences of the current level
    const difference = [];

    for (let row = 0; row < fXValues.length - 1; row++)
      // For example first level difference is => f[xi, xi+1] = (f(xi+1) - f(xi)) / (xi+1 - xi)
      difference.push((fXValues[row + 1] - fXValues[row]) / (xValues[row + 1 + level] - xValues[row]));

    // Push current level ratio difference to the table (array). We want only first index because that is the coefficient.
    differences.push(difference[0]);
    // We are about to move to next level differences -> increment
    level++;
    return this.getDifferences(xValues, difference, differences, level)
  }
}
