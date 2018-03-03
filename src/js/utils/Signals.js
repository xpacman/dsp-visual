/**
 * Created by paco on 1.3.18.
 */


export default class Signals {

  /**
   * Generates array of arrays (points) for sin signal
   * @param min Number domain min
   * @param max Number domain max
   * @return Array [[x1, y1],...]
   */
  static generateSinSignal(min = 0, max = 10) {
    const ret = [];

    for (let i = min; i <= max / 0.5; i++) {
      ret.push([parseFloat((i * 0.5).toFixed(1)), parseFloat(Math.sin(i * 0.5).toFixed(3))]);
    }

    return ret;
  }

}
