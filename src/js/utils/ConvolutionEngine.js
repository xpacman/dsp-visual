/**
 * Created by paco on 17.4.18.
 */

export default class ConvolutionEngine {

  /**
   * Returns discrete convolution result of two signal value arrays
   * @param inputValues array input signal points [[x0, y0],...]
   * @param kernelValues array kernel signal points [[x0, y0],...]
   * @return {Array} of samples [[x0, y0],....]
   */
  static convolution(inputValues, kernelValues) {
    const samplesCount = inputValues.length + kernelValues.length - 1,
      outputValues = [];

    for (let i = 0; i < samplesCount; i++) {
      outputValues[i] = [i, 0]; // set to zero before sum
      for (let j = 0; j < kernelValues.length; j++) {

        // Skip convolution at the boundary
        if (!inputValues[i - j]) {
          continue;
        }
        outputValues[i][1] += inputValues[i - j][1] * kernelValues[j][1]; // convolve: multiply and accumulate
      }
    }

    return outputValues;
  }

  /**
   * Returns array of additions for convolution result. FUNCTION DOES NOT PROVIDE CONVOLUTION TIME REVERSE!
   * @param timeReversedValues array of points of time reversed input signal [[x0, y0],...]
   * @param kernelValues  array of points of kernel signal [[x0, y0],...]
   * @return {*} array of arrays [[input overlapping points <[[x0,y0],...]>, kernel overlapping points <[[x0, y0],...]>]
   * or empty array if no points are overlapping in time
   */
  static getConvolutionStep(timeReversedValues, kernelValues) {
    const ret = [];
    kernelValues.forEach((point, i) => {
      ret[i] = [point[0], 0];
      for (let j = 0; j < timeReversedValues.length - 1; j++) {
        if (timeReversedValues[j][0] === point[0]) {
          ret[i][1] = timeReversedValues[j][1] * point[1];
        }
      }
    });
    return ret;
  }

}
