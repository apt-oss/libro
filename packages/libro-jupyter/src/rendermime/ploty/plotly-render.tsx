import { useInject } from '@difizen/libro-common/app';
import type { BaseOutputView } from '@difizen/libro-core';
import type { IRenderMimeRegistry } from '@difizen/libro-rendermime';
import { RenderMimeRegistry } from '@difizen/libro-rendermime';
import { useEffect, useRef } from 'react';
import type { FC } from 'react';

import { renderPlotly } from './plotly-renderers.js';
import './index.less';

export const PlotlyRender: FC<{ model: BaseOutputView }> = (props: {
  model: BaseOutputView;
}) => {
  const { model } = props;
  const renderPlotlyRef = useRef<HTMLDivElement>(null);
  const defaultRenderMime = useInject<IRenderMimeRegistry>(RenderMimeRegistry);

  const mimeType = defaultRenderMime.preferredMimeType(model);
  useEffect(() => {
    if (mimeType) {
      renderPlotly({
        model: model,
        host: renderPlotlyRef.current as HTMLDivElement,
        source: model.data[mimeType],
        mimeType: mimeType,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="libro-plotly-render-container">
      <div className="libro-plotly-render" ref={renderPlotlyRef} />
    </div>
  );
};
