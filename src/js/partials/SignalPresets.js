/**
 * Created by paco on 4.5.18.
 */
import Signal from "./Signal";

/**
 * Will return sin signal
 * @param xMin number min of signal x domain
 * @param xMax number max of signal x domain
 * @return {Signal} instance
 */
export function getSinSignal(xMin, xMax) {
  const signal = new Signal();
  signal.generateValues(xMin, xMax, 0.01, (x => Math.sin(x)));
  return signal;
}

/**
 * Will return dirac's impulse signal with impulse in xPeak
 * @param xMin number min of signal x domain
 * @param xMax number max of signal x domain
 * @param xPeak number x when impulse should occur
 * @param amplitude number amplitude of the impulse
 * @return {Signal}
 */
export function getDiracImpulseSignal(xMin, xMax, xPeak, amplitude = 1) {
  const signal = new Signal();
  signal.generateValues(xMin, xMax, 0.01, (x => Number(x) === Number(xPeak) ? amplitude : 0));
  return signal;
}

/**
 * Will return raising exponential signal with default base of 2. 2^x
 * @param xMin number min of signal x domain
 * @param xMax number max of signal x domain
 * @param base number base
 * @return {Signal}
 */
export function getExpUpSignal(xMin, xMax, base = 2) {
  const signal = new Signal();
  signal.generateValues(xMin, xMax, 0.01, (x => Math.pow(base, x)));
  return signal;
}

/**
 * Will return lowering exponential signal with default base of 2. (1 / 2)^x
 * @param xMin number min of signal x domain
 * @param xMax number max of signal x domain
 * @param base number base
 * @return {Signal}
 */
export function getExpDownSignal(xMin, xMax, base = 2) {
  const signal = new Signal();
  signal.generateValues(xMin, xMax, 0.01, (x => Math.pow(1 / base, x)));
  return signal;
}

/**
 * Will return rectangular signal. Rect will have center on xPeak
 * @param xMin number min of signal x domain
 * @param xMax number max of signal x domain
 * @param period number period of the wave
 * @return {Signal}
 */
export function getRectSignal(xMin, xMax, period = 1) {
  const signal = new Signal();
  signal.generateValues(xMin, xMax, 0.01, (x => Math.sign(Math.sin(x / period))));
  return signal;
}

/**
 * Will return sawtooth signal.
 * @param xMin number min of signal x domain
 * @param xMax number max of signal x domain
 * @param amplitude number amplitude of the signal
 * @param period number period of the signal
 * @return {Signal}
 */
export function getSawtoothSignal(xMin, xMax, amplitude = 1, period = 1) {
  const signal = new Signal();
  signal.generateValues(xMin, xMax, 0.01, (x => -((2 * amplitude) / Math.PI) * Math.atan((Math.cos((x * Math.PI) / period) / Math.sin((x * Math.PI) / period)))));
  return signal;
}

/**
 * Will return triangular signal.
 * @param xMin number min of signal x domain
 * @param xMax number max of signal x domain
 * @param amplitude number amplitude of the signal
 * @param period number period of the signal
 * @return {Signal}
 */
export function getTriangleSignal(xMin, xMax, amplitude = 1, period = 1) {
  const signal = new Signal();
  signal.generateValues(xMin, xMax, 0.01, (x => Math.abs(x % 4 - 2) - 1));
  return signal;
}
