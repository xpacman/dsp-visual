/**
 * Created by paco on 1.3.18.
 */
import InterpolationEngine from './InterpolationEngine';

export default class Signals {

  /**
   * Generates array of arrays (points) for sin signal. Default will generate one period of sin(x) signal
   * @param min Number domain min
   * @param max Number domain max
   * @return Array [[x1, y1],...]
   */
  static generateSinSignal(min = 0, max = 2 * Math.PI) {
    const ret = [],
      // To be smooth enough
      step = Math.PI / 12;

    for (let i = min; i <= max / step; i++) {
      ret.push([parseFloat((i * step).toFixed(3)), parseFloat(Math.sin(i * step).toFixed(3))]);
    }

    return ret;
  }

}
