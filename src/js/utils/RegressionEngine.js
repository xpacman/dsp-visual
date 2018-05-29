/**
 * Created by paco on 26.2.18.
 */
import linear from 'linear-solve';
import Poly from "./Poly";

export default class RegressionEngine {

  /**
   * Will calculate approximation error using least squares
   * @param inputValues
   * @param level
   * @return {number}
   */
  static getPolyLeastSquaresSum(inputValues, level) {
    const coefs = this.coefs(inputValues, level);
    let sum = 0,
      step = 0;

    inputValues.forEach(point => {
      step = point[1];
      coefs.forEach((coef, i) => step -= coef * Math.pow(point[0], i));
      sum += Math.pow(step, 2);
    });

    return sum;
  }

  /**
   * Will return string representation of least squares equation
   * @param inputValues
   * @param level
   * @return {string}
   */
  static getPolyLeastSquaresEquationString(inputValues, level) {
    const coefs = this.coefs(inputValues, level);
    let string = "p²(";

    coefs.forEach((coef, i) => {
      string += `c${Poly.subScript(i)}`;
      if (i !== coefs.length - 1) {
        string += ", "
      }
    });
    string += ") = Σ (yₙ - ";
    coefs.forEach((coef, i) => {
      string += `c${Poly.subScript(i)}${i > 0 ? "xₙ" : ""}${i > 1 ? Poly.superScript(i) : ""}`;
      if (i !== coefs.length - 1) {
        string += " - "
      }
    });
    string += `)${Poly.superScript(2)}`;
    return string;
  }

  /**
   * Will return instance of Poly which can be solved for any x to get approximation of input values
   * @param inputValues array of arrays [[x0,y0],...]
   * @param level number min 1, level polynomial
   * @return {Poly} instance of polynomial with coefficients
   */
  static getApproximationPolynomial(inputValues, level) {

    if (inputValues.length < 2) {
      throw "At least two points are needed for approximation."
    }

    const coefs = this.coefs(inputValues, level);
    return new Poly(new Poly(coefs));
  }

  /**
   * Will return approximated values as array of arrays
   * @param inputValues array of arrays [[x0,y0],...]
   * @param level number min 1, level polynomial
   * @param toApproximate array or number x to solve polynomial for. By default all input values will be inteprolated
   * @return {Array} [[x0, y0],...]
   */
  static polynomialApproximation(inputValues, level, toApproximate = null) {
    const poly = this.getApproximationPolynomial(inputValues, level),
      ret = [];
    let accessor = (point) => point[0];

    if (toApproximate === null) {
      toApproximate = inputValues;
    } else {

      if (!Array.isArray(toApproximate)) {
        toApproximate = [parseFloat(toApproximate)];
        accessor = (point) => point;
      }
    }

    toApproximate.forEach((point, i) => {
      ret[i] = [accessor(point), poly.solve(accessor(point))];
    });

    return ret;
  }

  /**
   * Will solve equation matrix to get coefficients for polynomial specified in the level
   * @param inputValues array of arrays [[x0,y0],...]
   * @param level number min 1, level polynomial
   * @return {x} array of coefficients [c_0,...c_level+1]
   */
  static coefs(inputValues, level) {

    if (level < 1) {
      throw "Only polynomials of level 1 or higher are allowed";
    }

    const leftSums = [], // Partial sums for the left side of the equation matrix [ row[col, col, col,...], row[...],... ]
      rightSums = []; // Partial sums for the right side of the equation matrix [ row1Result, row2Result,... ]

    // Very first value is (points count)
    leftSums[0] = [inputValues.length];

    // Build up matrix
    inputValues.forEach((point) => {

      for (let j = 0; j <= level; j++) {
        // Left side
        // Inicialize row
        if (leftSums[j] === undefined) {
          leftSums[j] = []
        }

        for (let i = 0; i <= level; i++) {

          // Skip first column of the first row
          if (j === 0 && i === 0) {
            continue;
          }

          // Inicialize column
          if (leftSums[j][i] === undefined) {
            leftSums[j][i] = 0
          }
          leftSums[j][i] += Math.pow(point[0], i + j)
        }

        // Right side
        if (rightSums[j] === undefined) {
          rightSums[j] = 0
        }
        rightSums[j] += point[1] * Math.pow(point[0], j)
      }
    });

    return linear.solve(leftSums, rightSums);
  }

}
