/**
 * Created by paco on 23.4.18.
 */

import React from "react";
import PropTypes from 'prop-types';
import * as config from "../../config";
import {Rect, Line, Group, Circle} from "react-konva";
import Konva from "konva";

export default class Dataset extends React.Component {

  static propTypes = {
    // Data array of values [x0, y0, x1, y1,...]
    data: PropTypes.array.isRequired,
    // Config object for Konva Element
    config: PropTypes.object,
    // Y Position of the rect group
    y: PropTypes.number,
    // Konva element to display dataset (line: will set data as points to line, bar: will render rect for each x,y value)
    element: PropTypes.oneOf(["line", "bar", "cross"])
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
    this._config = props.config;
    this.data = this.data.bind(this);

    // Refs will be stored here
    this.elements = {
      bar: null, // Group of bars
      cross: null, // Group of crosses (group of groups)
      line: null
    };
  }

  /**
   * Gets or sets current config
   * @param config object Konva config object
   * @return {*} object
   */
  config(config = null) {

    if (config) {
      this._config = {...this._config, ...config};
    }
    return this._config;
  }

  /**
   * Gets or sets current data (props)
   * @param data array of objects [{...props},...]
   * @return {*}
   */
  data(data = null) {

    if (!data) {
      return this._data;
    }

    if (this.props.element === "line" && this.elements.line) {
      this.elements.line.attrs.points = data;
    }

    else if (this.props.element === "bar" && this.elements.bar) {
      const bars = this.elements.bar.children;
      let n = 0,
        x = 0,
        y = this.props.y,
        height = 0;

      data.forEach((value, i) => {
        if (i % 2 === 0) {
          x = value;
          height = -(y - data[i + 1]) + 1;

          // Child doesnt exist -> add
          if (!bars[n]) {
            this.elements.bar.add(new Konva.Rect({
              height: height,
              x: x,
              y: y,
              ...this._config
            }));
          }
          // Child exist -> update values
          else {
            bars[n].x(x);
            bars[n].y(y);
            bars[n].setAttrs(this._config);
            bars[n].attrs.height = height;
          }
          n++;
        }
      });
      // Remove old data
      bars.splice(n);
    }

    else if (this.props.element === "cross" && this.elements.cross) {
      // Todo: update
    }

    return this._data = data;
  }

  render() {
    const {element, y} = this.props,
      {_data, _config} = this;

    switch (element) {

      case "bar":
        return (
          <Group ref={(grp) => this.elements.bar = grp}>
            {
              _data.map((value, i) => {

                if (i % 2 === 0) {
                  return (<Rect key={i} x={value}
                                height={-(y - _data[i + 1]) + 1}
                                y={y} {..._config}/>)
                }
              })
            }
          </Group>
        );
        break;

      case "cross":
        return (
          <Group ref={(grp) => this.elements.cross = grp}>
            {
              _data.map((value, i) => {
                if (i % 2 === 0) {
                  return (
                    <Group key={i} x={value} y={_data[i + 1]}>
                      <Line points={[-10, 0, 10, 0]} {..._config.cross}/>
                      <Line points={[0, -10, 0, 10]} {..._config.cross}/>
                      <Circle x={0} y={0} {..._config.dot} />
                    </Group>)
                }
              })
            }
          </Group>
        );
        break;

      default:
        return (<Line ref={(line) => this.elements.line = line} points={_data} {..._config}/>)
    }
  }
}
