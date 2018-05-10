/**
 * Created by paco on 17.4.18.
 */
import Signal from "../partials/Signal";

export default class CorrelationEngine {

  /**
   * Will return signal noisified with white noise
   * @param signal Signal instance which values will be enchanced by noise (Will make copy of the values)
   * @param noise Signal instance representing noise signal
   * @param noisePerformance number how much distortion should be applied to the input signal values
   * @param lag number Optional lag in time for signal
   * @return {*} Signal
   */
  static noisifySignal(signal, noise, noisePerformance = 1, lag = null) {
    const ret = new Signal(signal.values());
    ret.timeOffset(lag);
    // Values of the input signal enchanced by lag
    const laggedValues = ret.values(null, true),
      noiseAmplitude = noise.getYDomain();
    // Merge input signal with noise
    laggedValues.forEach(point => {
      noise.setPoint(point[0], Number(point[1]) * noisePerformance + ((Math.random() * (noiseAmplitude[1] - noiseAmplitude[0]) + noiseAmplitude[0]) * (0.01 * noisePerformance)))
    });
    ret.values(noise.values());
    // Return signal
    return ret;
  }

  /**
   * Will return white noise as instance of Signal
   * @param xMin number Minimal x value
   * @param xMax number Maximal x value
   * @param xStep number Generate value for every xStep between xmin and xmax
   * @param minAmplitude number Minimal amplitude of the noise
   * @param maxAmplitude number Maximal amplitude of the noise
   * @return {Signal}
   */
  static generateWhiteNoise(xMin, xMax, xStep = 0.01, minAmplitude, maxAmplitude) {
    const noise = new Signal();
    noise.generateValues(xMin, xMax, xStep, (x => (Math.random() * (maxAmplitude - minAmplitude) + minAmplitude)));
    return noise;
  }

  static crossCorrelation(xSignalValues, ySignalValues, maxShift) {

    // Inputs have to be of the same length
    if (xSignalValues.length !== ySignalValues.length) {
      throw "Input signals have to be of the same length!"
    }

    let shiftingValues = [];

    for (let i = -ySignalValues.length + 1; i < ySignalValues.length; i++) {
      // Shift values
      shiftingValues = this.shift(ySignalValues, i);
      // Compute dot product from shifted values
      //console.log("shift: ", i, "dot:", this.dotProduct(xSignalValues, shiftingValues));
    }
  }

  /**
   * Shift values (x stays the same, y will be shifted)
   * @param input array of points [[x0,y0],...]
   * @param shift number to shift values by
   * @return {Array} array of arrays [[x0, y0],...]
   */
  static shift(input, shift) {
    const ret = [];

    for (let i = 0; i < input.length; i++) {
      // x value stays the same, y pre-padding by zero
      ret[i] = [input[i][0], 0];

      // shift the y value
      if ((shift + i >= 0) && (shift + i < input.length)) {
        ret[i][1] = input[shift + i][1];
      }
    }
    // Return shifted array
    return ret;
  }

  /**
   * Computes a dot product used in cross correlation
   * @param xSignalValues array of arrays [x0,y0],...]
   * @param ySignalValues array of arrays [x0,y0],...]
   * @return {number} dot product
   */
  static dotProduct(xSignalValues, ySignalValues) {

    // Inputs have to be of the same length
    if (xSignalValues.length !== ySignalValues.length) {
      throw "Input signals have to be of the same length!"
    }

    let sum = 0;

    for (let i = 0; i < xSignalValues.length; i++) {
      sum += xSignalValues[i][1] * ySignalValues[i][1];
    }

    return sum;
  }
}
