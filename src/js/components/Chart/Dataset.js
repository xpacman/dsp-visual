/**
 * Created by paco on 23.4.18.
 */

import React from "react";
import PropTypes from 'prop-types';
import * as config from "../../config";
import {Rect, Line, Group} from "react-konva";
import Konva from "konva";

export default class Dataset extends React.Component {

  static propTypes = {
    // Data array of values [x0, y0, x1, y1,...]
    data: PropTypes.array.isRequired,
    // Config object for Konva Element
    config: PropTypes.object,
    // Y Position of the rect group
    y: PropTypes.number,
    // Konva element to display dataset (line: will set data as points to line, rect: will render rect for each x,y value)
    element: PropTypes.oneOf(["line", "rect"])
  };

  static defaultProps = {
    data: [],
    y: 0,
    config: config.signalLine.line,
    element: "line"
  };

  constructor(props) {
    super(props);

    this._data = props.data;
    this.config = props.config;

    // Refs will be stored here
    this.elements = {
      rect: null, // Group of rects
      line: null
    };
  }

  /**
   * Gets or sets current data
   * @param data array [x0, y0, x1, y1...]
   * @return {*}
   */
  data(data = null) {

    if (!data) {
      return this._data;
    }

    if (this.props.element === "line" && this.elements.line) {
      this.elements.line.attrs.points = data;
    }

    else if (this.props.element === "rect" && this.elements.rect) {
      const rects = this.elements.rect.children;
      let n = 0,
        x = 0,
        y = this.props.y,
        height = 0;

      data.forEach((value, i) => {
        if (i % 2 === 0) {
          x = value;
          height = -(y - data[i + 1]) + 1;

          // Child doesnt exist -> add
          if (!rects[n]) {
            this.elements.rect.add(new Konva.Rect({
              height: height,
              x: x,
              y: y,
              ...this.config
            }));
          }
          // Child exist -> update values
          else {
            rects[n].x(x);
            rects[n].y(y);
            rects[n].setAttrs(this.config);
            rects[n].attrs.height = height;
          }
          n++;
        }
      });
      // Remove old data
      rects.splice(n);
    }

    return this._data = data;
  }

  render() {
    const {element, y} = this.props,
      {_data, config} = this;

    switch (element) {
      case "rect":
        return (
          <Group ref={(grp) => this.elements.rect = grp}>
            {
              _data.map((value, i) => {

                if (i % 2 === 0) {
                  return (<Rect key={i} x={value}
                                height={-(y - _data[i + 1]) + 1}
                                y={y} {...config}/>)
                }
              })
            }
          </Group>
        );
        break;

      default:
        return (<Line ref={(line) => this.elements.line = line} {...config}
                      points={_data}/>)
    }
  }
}
