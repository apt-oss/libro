import type { JSONObject } from '@difizen/libro-common';
import { getBundleOptions } from '@difizen/libro-common';
import {
  ConfigurationService,
  inject,
  prop,
  transient,
} from '@difizen/libro-common/app';
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
import { LargeOutputDisplay } from './output-configuration.js';

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
  @prop()
  isLargeOutputDisplay: boolean;

  constructor(
    @inject(ViewOption) options: IOutputOptions,
    @inject(ConfigurationService) configurationService: ConfigurationService,
  ) {
    super(options);
    const { data, metadata } = getBundleOptions(options.output);
    this.type = options.output.output_type;
    this.data = data as JSONObject;
    this.metadata = metadata;
    const localIsLargeOutputDisplay = localStorage.getItem(
      'is-libro-large-output-display',
    );
    configurationService
      .get(LargeOutputDisplay)
      .then((value: any) => {
        this.isLargeOutputDisplay =
          localIsLargeOutputDisplay !== null
            ? localIsLargeOutputDisplay === 'true'
            : (options.output['is_large_display'] as boolean) || true;
        this.isLargeOutputDisplay = this.isLargeOutputDisplay && value;
        return;
      })
      .catch(() => {
        //
      });
  }

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
      is_large_display: this.isLargeOutputDisplay,
    };
  }
}
