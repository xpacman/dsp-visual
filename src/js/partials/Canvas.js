/**
 * Created by paco on 10.4.18.
 */

import * as conf from "../config";
import Konva from "konva";

export default class Canvas {

  /**
   * Creates wrapping class for Konva components and canvas. This class works above React Konva components, holds refs to them etc...
   * @param wrapperRef elem reference to wrapping element
   * @param dimensions array [width, height] dimensions of canvas (optional)
   * @param stage elem reference to Konva stage containing canvas (optional)
   * @param layers object {layerName: <Konva Layer element>} (optional)
   * @param canvas elem reference to html canvas element (optional)
   */
  constructor(wrapperRef, dimensions = [500, 500], stage = null, layers = {}, canvas = null) {
    // Canvas wrapper reference
    this.wrapper = wrapperRef;
    // Width and height of the canvas
    this.dimensions = dimensions;
    // Context styles
    this.contextAttrs = {...conf.canvas};
    // Canvas stage
    this._stage = stage;
    // Canvas layers
    this._layers = layers;
    // Canvas context
    this.canvas = canvas === null ? document.createElement('canvas') : canvas;
    this.context = this.canvas.getContext('2d');
    // Canvas drawing handle trough konva image
    this.plotImage = null;
    // Set configs
    Object.keys(this.contextAttrs).forEach(key => {
      this.context[key] = this.contextAttrs[key];
    });
  }

  /**
   * Gets or sets stage
   * @param stage
   * @return {*}
   */
  stage(stage = null) {
    if (!stage) {
      return this._stage
    } else {
      this._stage = stage.getStage();
    }
  }

  /**
   * Adds new layer
   * @param name string Layer name
   * @param layer object Konva layer
   */
  addLayer(name, layer) {
    if (!layer)
      return false;

    layer.setName(name);
    this._layers[name] = layer;
  }

  getLayer(name) {
    return this._layers[name].getLayer()
  }

  /**
   * Creates special Konva Image and mounts it into specific layer. Returns newly created image. Free drawing is handled by this
   * @param targetLayer string Layer name where to mount plot image
   * @param config object Konva.Image config
   * @return {Konva.Image}
   */
  createPlotImage(targetLayer, config = {}) {
    const conf = {...config, image: this.canvas, x: 0, y: 0};
    this.plotImage = new Konva.Image(conf);
    this.getLayer(targetLayer).add(this.plotImage);
    return this.plotImage;
  }

  /**
   * Gets or sets layers
   * @param layers
   * @return {{}|*}
   */
  layers(layers = null) {
    if (layers) {
      this._layers = layers;
    } else {
      return this._layers
    }
  }

  /**
   * Clears context
   * @param width
   * @param height
   */
  clear(width = this.dimensions[0], height = this.dimensions[1]) {
    this.context.clearRect(0, 0, width, height);
  }

  getCanvas() {
    return this.canvas;
  }

  getContext() {
    return this.context;
  }

  getPlotImage() {
    return this.plotImage;
  }

}
