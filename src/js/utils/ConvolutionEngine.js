/**
 * Created by paco on 17.4.18.
 */

export default class ConvolutionEngine {

  /**
   * Returns convolution result of two signal value arrays
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
   * Returns array of overlapping points in time in each signal
   * @param inputSignal Signal instance of input signal
   * @param kernelSignal Signal instance of kernel signal
   * @return {*} array of arrays [[input overlapping points <[[x0,y0],...]>, kernel overlapping points <[[x0, y0],...]>]
   * or empty array if no points are overlapping in time
   */
  static getOverlappingPoints(inputSignal, kernelSignal) {
    const inputRange = inputSignal.xDomain(),
      kernelRange = kernelSignal.xDomain(),
      inputTimeOffset = inputSignal.timeOffset(),
      kernelTimeOffset = kernelSignal.timeOffset();

    let xMin = 0,
      xMax = 0;

    // Determine which points are overlapping
    if (inputRange[1] + inputTimeOffset >= kernelRange[0] + kernelTimeOffset
      && inputRange[0] + inputTimeOffset <= kernelRange[1] + kernelTimeOffset) {
      xMin = kernelRange[0] + kernelTimeOffset;
      xMax = inputRange[1] + inputTimeOffset;

      if (inputRange[0] + inputTimeOffset >= kernelRange[0] + kernelTimeOffset) {
        xMin = inputRange[0] + inputTimeOffset;

        if (inputRange[1] + inputTimeOffset >= kernelRange[1] + kernelTimeOffset) {
          xMax = kernelRange[1] + kernelTimeOffset;
        }
      }

      const kernelOverlappingPoints = kernelSignal.getPointsInRange(xMin, xMax),
        inputOverlappingPoints = kernelSignal.getPointsInRange(-xMax, -xMin);
      return [inputOverlappingPoints, kernelOverlappingPoints];
    }
    return [];
  }

}
