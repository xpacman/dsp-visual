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
}
