module.exports = {
  crosshairLine: {
    stroke: "#292b2c",
    opacity: 0.5
  },
  crosshairText: {
    fill: "#999999",
    fontSize: 10,
    offsetX: 10,
    align: "center"
  },
  equationText: {
    fill: "#fff",
    fontSize: 13,
    align: "center"
  },
  axisTickLine: {
    stroke: "#292b2c",
    strokeWidth: 1,
  },
  axisTick: {
    fill: "#999999",
    fontSize: 10,
    align: "center"
  },
  axisLabel: {
    fill: "#999999",
    fontSize: 12,
    align: "center"
  },
  axisLine: {
    stroke: "#494949",
    strokeWidth: 1
  },
  axisBackground: {
    fill: "#000"
  },
  pointCross: {
    stroke: "white"
  },
  pointCircle: {
    radius: 3,
    fill: "red"
  },
  chartLabelText: {
    fill: "white",
    fontSize: 12,
    align: "center",
    offsetY: -3
  },
  regressionChart: {
    line: {
      stroke: "#DFB126",
      lineWidth: 5,
      lineJoin: "round"
    },
    leastSquares: {
      stroke: "red",
      fill: "rgba(255, 50, 50, 0.6)",
    }
  },
  signalLine: {
    stroke: "green",
    strokeWidth: 3,
    lineCap: "round",
    lineJoin: "round"
  },
  canvas: {
    fillStyle: "#000",
    font: "10px sans-serif",
    globalAlpha: 1,
    globalCompositeOperation: "source-over",
    lineCap: "butt",
    lineDashOffset: 0,
    lineJoin: "round",
    lineWidth: 5,
    miterLimit: 10,
    shadowBlur: 0,
    shadowColor: "rgba(0, 0, 0, 0)",
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    strokeStyle: "#df4b26",
    textAlign: "start",
    textBaseline: "alphabetic"
  },
  interpolationOriginalSignal: {
    line: {
      stroke: "#DFB126",
      lineWidth: 5,
      lineJoin: "round"
    }
  },
  interpolationSampledSignal: {
    rect: {
      stroke: "#D4243C",
      fill: "#D4243C",
    }
  },
  interpolationZOHSignal: {
    line: {
      stroke: "#B8D725",
      strokeWidth: 4,
      lineJoin: "round"
    }
  },
  interpolationFOHSignal: {
    line: {
      stroke: "#df4b26",
      strokeWidth: 4,
      lineJoin: "round"
    }
  },
  interpolationCursor: {
    radius: 4,
    fill: "white"
  },
  convolutionKernelChart: {
    line: {
      stroke: "#df4b26",
      lineWidth: 5,
      lineJoin: "round"
    },
    rect: {
      fill: "rgba(223, 77, 38, 0.8)",
      stroke: "#df4b26",
      width: 10,
      offsetX: 5
    }
  },
  convolutionInputChart: {
    line: {
      stroke: "#DFB126",
      lineWidth: 5,
      lineJoin: "round"
    },
    rect: {
      fill: "rgba(223, 177, 38, 0.8)",
      stroke: "#DFB126",
      width: 10,
      offsetX: 5
    }
  },
  convolutionOutputChart: {
    line: {
      stroke: "#B8D725",
      lineWidth: 5,
      lineJoin: "round"
    },
    rect: {
      fill: "rgba(108, 198, 34, 0.8",
      stroke: "#B8D725",
      width: 10,
      offsetX: 5
    }
  },
  convolutionStepChart: {
    line: {
      stroke: "#D4243C",
      lineWidth: 5,
      lineJoin: "round"
    },
    rect: {
      fill: "rgba(170, 16, 37, 0.8)",
      stroke: "#D4243C",
      width: 10,
      offsetX: 5
    }
  },
  correlationInputChart: {
    line: {
      stroke: "#DFB126",
      lineWidth: 5,
      lineJoin: "round"
    },
    rect: {
      fill: "rgba(170, 16, 37, 0.8)",
      stroke: "#D4243C"
    }
  },
  correlationOutputChart: {
    receivedSignal: {
      line: {
        stroke: "rgba(223, 77, 38, 0.5)",
        lineWidth: 5,
        lineJoin: "round"
      }
    },
    inputSignal: {
      line: {
        stroke: "#B8D725",
        lineWidth: 5,
        lineJoin: "round"
      },
      rect: {
        fill: "rgba(108, 198, 34, 0.8",
        stroke: "#B8D725",
        width: 4,
        offsetX: 2
      }
    }
  },
  correlationReceivedChart: {
    line: {
      stroke: "#df4b26",
      lineWidth: 5,
      lineJoin: "round"
    },
    rect: {
      fill: "rgba(223, 77, 38, 0.8)",
      stroke: "#df4b26"
    }
  },
  scroller: {
    scroller: {
      fill: "#17191E"
    },
    handle: {
      fill: "#565A66"
    }
  }
};
