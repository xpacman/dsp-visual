/**
 * Created by paco on 17.4.18.
 */

const Decimal = require('decimal.js-light');
import {max, min} from "d3-array";
import Signal from '../partials/Signal';

export default class ConvolutionEngine {

  static convolutionStep(inputSignal, kernelSignal) {
    // TODO: REVERSE INPUT SIGNAL IN TIME

    // Determine x domain of the output signal
    const x = [inputSignal.xMin, inputSignal.xMax, kernelSignal.xMin, kernelSignal.xMax],
      xAccessor = (x) => x,
      xDomain = [min(x.map(xAccessor)), max(x.map(xAccessor))],
      step = min([inputSignal.step, kernelSignal.step].map(xAccessor)),
      inputRange = [inputSignal.xMin, inputSignal.xMax],
      kernelRange = [kernelSignal.xMin, kernelSignal.xMax],
      inputTimeOffset = inputSignal.timeOffset(),
      kernelTimeOffset = kernelSignal.timeOffset();

    let outputSignal = new Signal(xDomain[0], xDomain[1], step),
      xMin = 0,
      xMax = 0,
      i = 0,
      j = 0;

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

      const kernelOverlappingPoints = kernelSignal.getPointsInRange(xMin, xMax);
      const inputOverlappingPoints = kernelSignal.getPointsInRange(-xMax, -xMin);

      let convY = 0,
        convX = 0;

      for (i = 0; i < inputOverlappingPoints.length; i++) {
        convY += inputOverlappingPoints[i][1] * kernelOverlappingPoints[i][1];

        if (i === inputOverlappingPoints.length - 1) {
          console.log(outputSignal.values()[i]);
        }
      }
    }

    if (inputRange[0] + inputSignal.timeOffset() >= kernelRange[1] + kernelSignal.timeOffset()) {
      console.log("compute all")
    }

  }

  static convolution(inputSignal, kernelSignal) {
    const inputValues = inputSignal.values(),
      kernelValues = kernelSignal.values(),
      samplesCount = inputValues.length + kernelValues.length - 1,
      outputValues = [],
      outputSignal = new Signal(-1, 1);

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

    outputSignal.values(outputValues);
    return outputSignal;
  }

}
