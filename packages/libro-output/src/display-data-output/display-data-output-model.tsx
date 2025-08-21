import type { JSONObject } from '@difizen/libro-common';
import { getBundleOptions } from '@difizen/libro-common';
import {
  getOrigin,
  useInject,
  view,
  ViewInstance,
  ViewOption,
  inject,
  transient,
} from '@difizen/libro-common/app';
import { LibroOutputView } from '@difizen/libro-core';
import type { BaseOutputView, IOutputOptions } from '@difizen/libro-core';
import { RenderMimeRegistry } from '@difizen/libro-rendermime';
import type { IRenderMimeRegistry, IRendererFactory } from '@difizen/libro-rendermime';
import type { ReactNode } from 'react';
import { createElement, forwardRef } from 'react';

import '../index.less';

const DisplayDataOutputModelRender = forwardRef<HTMLDivElement, Record<string, never>>(
  function DisplayDataOutputModelRender(_props, ref): React.ReactElement {
    const output = useInject<DisplayDataOutputModel>(ViewInstance);
    const model = getOrigin(output);

    const factory = model.getRenderFactory();
    let children: ReactNode = null;
    if (factory && factory.render) {
      const renderFunction = factory.render;
      if (typeof renderFunction === 'function') {
        children = renderFunction({ model });
      }
    }
    return createElement(
      'div',
      {
        ref,
        className: 'libro-display-data-container',
      },
      children,
    );
  },
);
@transient()
@view('libro-display-data-output-model')
export class DisplayDataOutputModel extends LibroOutputView implements BaseOutputView {
  @inject(RenderMimeRegistry) renderMimeRegistry: IRenderMimeRegistry;
  renderFactory?: IRendererFactory;
  constructor(@inject(ViewOption) options: IOutputOptions) {
    super(options);
    const { data, metadata } = getBundleOptions(options.output);
    this.type = options.output.output_type;
    this.data = data as JSONObject;
    this.metadata = metadata;
  }

  getRenderFactory() {
    const renderMimeType = this.renderMimeRegistry.preferredMimeType(this);
    if (renderMimeType) {
      const renderMime = this.renderMimeRegistry.createRenderer(renderMimeType, this);
      this.renderFactory = getOrigin(renderMime);
      this.allowClear = renderMime.allowClear === false ? false : true;
      return renderMime;
    }
    return undefined;
  }
  override view = DisplayDataOutputModelRender;
  override toJSON() {
    if (this.raw.execution_count !== undefined) {
      return {
        output_type: this.raw.output_type,
        data: this.raw.data,
        metadata: this.raw.metadata,
        execution_count: this.raw.execution_count,
      };
    }
    return {
      output_type: this.raw.output_type,
      data: this.raw.data,
      metadata: this.raw.metadata,
    };
  }

  override dispose(force?: boolean): void {
    if (!force && this.allowClear === false) {
      return;
    }
    super.dispose();
  }
}
