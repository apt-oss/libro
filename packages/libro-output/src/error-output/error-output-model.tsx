import { defaultSanitizer, getBundleOptions } from '@difizen/libro-common';
import type { IError, JSONObject } from '@difizen/libro-common';
import { LibroOutputView } from '@difizen/libro-core';
import type { BaseOutputView, IOutputOptions } from '@difizen/libro-core';
import { RenderMimeRegistry, renderText } from '@difizen/libro-rendermime';
import type { IRenderMimeRegistry } from '@difizen/libro-rendermime';
import { inject, transient } from '@difizen/libro-common/app';
import {
  getOrigin,
  prop,
  useInject,
  view,
  ViewInstance,
  ViewOption,
} from '@difizen/libro-common/app';
import { Button } from 'antd';
import { forwardRef, createRef, useEffect } from 'react';
import '../index.less';

const ErrorOutputModelRender = forwardRef<HTMLDivElement>(
  function ErrorOutputModelRender(_props, ref) {
    const output = useInject<ErrorOutputModel>(ViewInstance);
    const model = getOrigin(output);
    const source = getOrigin(output).raw as IError;
    const defaultRenderMime = useInject<IRenderMimeRegistry>(RenderMimeRegistry);
    const traceback = source.traceback.join('\n');
    const defaultRenderMimeType = defaultRenderMime.preferredMimeType(model);
    const streamRef = createRef<HTMLDivElement>();

    useEffect(() => {
      renderText({
        host: streamRef.current as HTMLDivElement,
        sanitizer: defaultSanitizer,
        source: traceback,
        mimeType: defaultRenderMimeType || '',
      });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const handleShowErrorDetail = () => {
      output.showErrorDetail = !output.showErrorDetail;
    };

    return (
      <div ref={ref} className="libro-error-container">
        <div className="libro-text-render-container">
          <div className="libro-error-label libro-text-render">
            <pre>
              <span className="ansi-red-fg">{source.ename}</span>
              {': ' + source.evalue}
            </pre>
            <Button
              className="libro-show-error-detail-button"
              danger
              onClick={handleShowErrorDetail}
            >
              {output.showErrorDetail ? 'Hide' : 'Show'} error details
            </Button>
          </div>
        </div>
        <div className="libro-text-render-container">
          <div
            className="libro-text-render"
            ref={streamRef}
            style={{ display: `${output.showErrorDetail ? 'block' : 'none'} ` }}
          />
        </div>
      </div>
    );
  },
);
@transient()
@view('libro-error-output-model')
export class ErrorOutputModel extends LibroOutputView implements BaseOutputView {
  constructor(@inject(ViewOption) options: IOutputOptions) {
    super(options);
    const { data, metadata } = getBundleOptions(options.output);
    this.type = options.output.output_type;
    this.data = data as JSONObject;
    this.metadata = metadata;
  }
  override view = ErrorOutputModelRender;
  override toJSON() {
    return {
      output_type: this.raw.output_type,
      ename: this.raw.ename,
      evalue: this.raw.evalue,
      traceback: this.raw.traceback,
    };
  }
  @prop()
  showErrorDetail = false;
}
