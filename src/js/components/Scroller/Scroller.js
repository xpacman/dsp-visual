/**
 * Created by paco on 16.4.18.
 */

import React from "react";
import PropTypes from "prop-types";
import {Stage, Layer, Rect} from "react-konva";

export default class Scroller extends React.Component {

  static propTypes = {
    width: PropTypes.number,
    height: PropTypes.number,
    // Current percentual progress of the scroller
    progress: PropTypes.number,
    // Precision of the scrolling
    precision: PropTypes.number,
    // Object with konva configs {handle: {<handle rect props>}, scroller: {<background rect props>}}
    config: PropTypes.object,
    // On scroll callback function
    onScroll: PropTypes.func
  };

  static defaultProps = {
    width: 500,
    height: 50,
    progress: 0,
    precision: 0,
    config: {}
  };

  constructor(props) {
    super(props);
    // Mouse drag
    this.isDragging = false;
    // Merge config
    this.config = {
      scroller: {fill: "#17191E", ...props.config.scroller},
      handle: {fill: "#565A66", height: props.height, width: (props.width * 10) / 100, ...props.config.handle}
    };

    // Stage where scroller is mounted in
    this.stage = null;
    this.layer = null;
    // Scroller ref
    this.handle = null;
    // Current x position of the handle
    this._position = null;
    // Current percentual position of the scroller
    this.progress = props.progress;
  }

  componentDidMount() {

    if (this.stage) {

      if (this.handle) {
        // Cursor change
        this.handle.on("mouseenter", () => this.stage.getStage().container().style.cursor = "pointer");
        this.handle.on("mousedown", () => this.stage.getStage().container().style.cursor = "move");
        this.handle.on("mouseup", () => this.stage.getStage().container().style.cursor = "pointer");
        this.handle.on("mouseleave", () => this.stage.getStage().container().style.cursor = "default");
      }

      // Initial progress
      this.position((this.props.width * this.props.progress) / 100);
      this.handle.offsetX(-this.position());

      // On mouse click callback
      this.stage.getStage().on("contentMousedown.proto", () => {
        this.isDragging = true;
        this.position(this.stage.getStage().getPointerPosition().x);
        // Set progress
        this.progress = this.positionToProgress();
        // Set position of the handle
        this.handle.offsetX(-this.position());
        // Render the layer
        this.layer.batchDraw();

        return this.props.onScroll && this.props.onScroll(this.progress);
      });

      // On mouse up callback
      this.stage.getStage().on("contentMouseup.proto", () => {
        this.isDragging = false;

        return true;
      });

      // Mouse dragging callback
      this.stage.getStage().on("contentMousemove.proto", () => {
        if (!this.isDragging) {
          return;
        }

        this.position(this.stage.getStage().getPointerPosition().x);
        // Set progress
        this.progress = this.positionToProgress();
        // Set position of the handle
        this.handle.offsetX(-this.position());
        // Render the layer
        this.layer.batchDraw();

        return this.props.onScroll && this.props.onScroll(this.progress);
      })
    }
  }

  /**
   * Calculates progress from position given.
   * @param position number x position. If not given, progress from actual scroller position will be returned
   * @param precision number of decimal places. Default 0.
   * @return {string}
   */
  positionToProgress(position = null, precision = this.props.precision) {
    const maxWidth = this.props.width,
      handleWidth = this.config.handle.width;
    let pos = position;

    if (!pos) {
      pos = this.position();
    }

    return ((pos * 100) / (maxWidth - handleWidth)).toFixed(precision);
  }

  /**
   * Gets or sets position
   * @param position number x position
   * @return {number|*|null}
   */
  position(position = null) {

    if (!position) {
      return this._position;
    }

    const handleWidth = this.config.handle.width / 2,
      maxWidth = this.props.width;

    if (position + handleWidth > maxWidth) {
      return this._position = maxWidth - handleWidth * 2;
    }

    if (position - handleWidth < 0) {
      return this._position = 0;
    }

    return this._position = position - handleWidth;
  }

  render() {
    const {width, height} = this.props;

    return (
      <Stage ref={(stage) => this.stage = stage}
             width={width}
             height={height}>
        <Layer ref={(layer) => this.layer = layer}>
          <Rect {...this.config.scroller} width={width} height={height} x={0} y={0}/>
          <Rect {...this.config.handle} x={0} y={0} ref={(elem) => this.handle = elem}/>
        </Layer>
      </Stage>
    )
  }
}