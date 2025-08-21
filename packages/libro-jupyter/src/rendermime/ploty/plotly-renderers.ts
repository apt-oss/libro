import type { JSONValue } from '@difizen/libro-common';
import type { BaseOutputView } from '@difizen/libro-core';
import type PlotlyType from 'plotly.js';
/**
 * The options used to create a renderer.
 */
export interface IRendererPlotlyOptions {
  /**
   * The host node for the text content.
   */
  host: HTMLElement;
  /**
   * The source text to render.
   */
  source: JSONValue;
  /**
   * The preferred mimeType to render.
   */
  mimeType: string;

  model: BaseOutputView;
}
/**
 * The MIME type for Plotly.
 * The version of this follows the major version of Plotly.
 */
export const MIME_TYPE = 'application/vnd.plotly.v1+json';

interface IPlotlySpec {
  data: PlotlyType.Data;
  layout: PlotlyType.Layout;
  frames?: PlotlyType.Frame[];
}
export class RenderedPlotly {
  /**
   * Create a new widget for rendering Plotly.
   */
  constructor(options: IRendererPlotlyOptions) {
    this._mimeType = options.mimeType;
    this.node = options.host;
    // Create image element
    this._img_el = document.createElement('img');
    this._img_el.className = 'plot-img';
    this.node.appendChild(this._img_el);

    // Install image hover callback
    this._img_el.addEventListener('mouseenter', () => {
      this.createGraph(this._model);
    });
  }

  /**
   * Render Plotly into this widget's node.
   */
  renderModel(model: BaseOutputView): Promise<void> {
    if (this.hasGraphElement()) {
      // We already have a graph, don't overwrite it
      return Promise.resolve();
    }

    // Save off reference to model so that we can regenerate the plot later
    this._model = model;

    // Check for PNG data in mime bundle
    const png_data = <string>model.data['image/png'];
    if (png_data !== undefined && png_data !== null) {
      // We have PNG data, use it
      this.updateImage(png_data);
      return Promise.resolve();
    } else {
      // Create a new graph
      return this.createGraph(model);
    }
  }

  protected hasGraphElement() {
    // Check for the presence of the .plot-container element that plotly.js
    // places at the top of the figure structure
    return this.node.querySelector('.plot-container') !== null;
  }

  protected updateImage(png_data: string) {
    this.hideGraph();
    this._img_el.src = 'data:image/png;base64,' + png_data;
    this.showImage();
  }

  protected hideGraph() {
    // Hide the graph if there is one
    const el = <HTMLDivElement>this.node.querySelector('.plot-container');
    if (el !== null && el !== undefined) {
      el.style.display = 'none';
    }
  }

  protected showGraph() {
    // Show the graph if there is one
    const el = <HTMLDivElement>this.node.querySelector('.plot-container');
    if (el !== null && el !== undefined) {
      el.style.display = 'block';
    }
  }

  protected hideImage() {
    // Hide the image element
    const el = <HTMLImageElement>this.node.querySelector('.plot-img');
    if (el !== null && el !== undefined) {
      el.style.display = 'none';
    }
  }

  protected showImage() {
    // Show the image element
    const el = <HTMLImageElement>this.node.querySelector('.plot-img');
    if (el !== null && el !== undefined) {
      el.style.display = 'block';
    }
  }

  protected createGraph(model: BaseOutputView): Promise<void> {
    const { data, layout, frames, config } = model.data[this._mimeType] as
      | any
      | IPlotlySpec;

    // Load plotly asynchronously
    const loadPlotly = async (): Promise<void> => {
      if (RenderedPlotly.Plotly === null) {
        RenderedPlotly.Plotly = await import('plotly.js');
        RenderedPlotly._resolveLoadingPlotly();
      }
      return RenderedPlotly.loadingPlotly;
    };

    return loadPlotly()
      .then(() => RenderedPlotly.Plotly!.react(this.node, data, layout, config))
      .then((plot) => {
        this.showGraph();
        this.hideImage();
        // this.update();
        if (frames) {
          RenderedPlotly.Plotly!.addFrames(this.node, frames);
        }
        if (this.node.offsetWidth > 0 && this.node.offsetHeight > 0) {
          RenderedPlotly.Plotly!.toImage(plot, {
            format: 'png',
            width: this.node.offsetWidth,
            height: this.node.offsetHeight,
          })
            .then((url: string) => {
              const imageData = url.split(',')[1];
              if (model.data['image/png'] !== imageData) {
                model.setData({
                  data: {
                    ...model.data,
                    'image/png': imageData,
                  },
                });
              }
              return;
            })
            .catch(console.error);
        }
        return;
      });
  }

  protected _mimeType: string;
  protected _img_el: HTMLImageElement;
  protected _model: BaseOutputView;
  protected node: HTMLElement;
  protected static Plotly: typeof PlotlyType | null = null;
  protected static _resolveLoadingPlotly: () => void;
  protected static loadingPlotly = new Promise<void>((resolve) => {
    RenderedPlotly._resolveLoadingPlotly = resolve;
  });
}

/**
 * Render an plotly into a host node.
 *
 * @param options - The options for rendering.
 *
 * @returns A promise which resolves when rendering is complete.
 */
export function renderPlotly(options: IRendererPlotlyOptions): Promise<void> {
  const plotlyRender = new RenderedPlotly(options);
  plotlyRender.renderModel(options.model); // Return the rendered promise.
  return Promise.resolve(undefined);
}
