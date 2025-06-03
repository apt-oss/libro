import type { JSONObject } from '@difizen/libro-common';
import { getBundleOptions } from '@difizen/libro-common';
import { inject, prop, transient } from '@difizen/libro-common/app';
import {
  getOrigin,
  useInject,
  view,
  ViewInstance,
  ViewOption,
} from '@difizen/libro-common/app';
import { LibroOutputView } from '@difizen/libro-core';
import type { BaseOutputView, IOutputOptions } from '@difizen/libro-core';
import { RenderMimeRegistry } from '@difizen/libro-rendermime';
import type { IRenderMimeRegistry, IRendererFactory } from '@difizen/libro-rendermime';
import { forwardRef, useEffect, useState } from 'react';

import '../index.less';

const StreamOutputModelRender = forwardRef<HTMLDivElement>(
  function StreamOutputModelRender(_props, ref) {
    const output = useInject<StreamOutputModel>(ViewInstance);
    const model = getOrigin(output);
    const [refreshKey, setRefreshKey] = useState(new Date().getTime().toString());
    const factory = model.getRenderFactory();

    useEffect(() => {
      model.onUpdate(() => {
        setRefreshKey(new Date().getTime().toString());
      });
    });
    if (factory) {
      const OutputRender = factory.render;
      const children = <OutputRender model={model} key={refreshKey} />;
      return (
        <div ref={ref} className={'libro-stream-container'}>
          {children}
        </div>
      );
    } else {
      return null;
    }
  },
);
@transient()
@view('libro-stream-output-model')
export class StreamOutputModel extends LibroOutputView implements BaseOutputView {
  @inject(RenderMimeRegistry) renderMimeRegistry: IRenderMimeRegistry;
  renderFactory?: IRendererFactory;

  constructor(@inject(ViewOption) options: IOutputOptions) {
    super(options);
    const { data, metadata } = getBundleOptions(options.output);
    this.type = options.output.output_type;
    this.data = data as JSONObject;
    this.metadata = metadata;
  }
  @prop()
  isLargeOutputDisplay = true;

  getRenderFactory() {
    const renderMimeType = this.renderMimeRegistry.preferredMimeType(this);
    if (renderMimeType) {
      const renderMime = this.renderMimeRegistry.createRenderer(renderMimeType, this);
      this.renderFactory = getOrigin(renderMime);
      return renderMime;
    }
    return undefined;
  }
  override view = StreamOutputModelRender;
  override toJSON() {
    return {
      output_type: this.raw.output_type,
      name: this.raw.name,
      text: this.raw.text,
      display_text: this.raw['display_text'],
    };
  }
}
