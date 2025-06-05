import type { IOutput, JSONObject, PartialJSONObject } from '@difizen/libro-common';
import { BaseView, Emitter, prop, view, ViewOption } from '@difizen/libro-common/app';
import { inject, transient } from '@difizen/libro-common/app';
import type { FC } from 'react';
import { v4 } from 'uuid';

import type { CellView } from '../libro-protocol.js';

import type { IOutputOptions } from './output-protocol.js';
import type { ISetDataOptions, BaseOutputView } from './output-protocol.js';

const LibroOutputModelRender: FC<{ output: BaseOutputView }> = (props: {
  output: BaseOutputView;
}) => {
  const { output } = props;
  return <div>{JSON.stringify(output.toJSON(), null, 2)}</div>;
};

@transient()
@view('libro-output-model')
export class LibroOutputView extends BaseView implements BaseOutputView {
  override id = v4();

  // 增加cell属性，使得通过output可以找到Cell
  cell: CellView;

  @prop()
  raw: IOutput;

  @prop()
  allowClear = true;

  @prop()
  data: JSONObject;

  onUpdateEmitter = new Emitter<void>();

  get onUpdate() {
    return this.onUpdateEmitter.event;
  }

  @prop()
  metadata: PartialJSONObject;
  type: string;
  trusted: boolean;
  constructor(@inject(ViewOption) options: IOutputOptions) {
    super();
    this.raw = options.output;
    this.trusted = options.trusted;
    this.cell = options.cell;
    this.type = 'libro-default-output';
    this.data = {};
    this.metadata = {};
    this.onUpdate(() => {
      this.cell.parent.model.onChange?.();
    });
  }

  render: FC<{ output: BaseOutputView }> = LibroOutputModelRender;

  override dispose() {
    super.dispose();
  }
  toJSON() {
    return this.raw;
  }
  setData(options: ISetDataOptions): void {
    if (options.data) {
      this.data = options.data;
    }
    if (options.metadata) {
      this.metadata = options.metadata;
    }
  }
}

/**
 * @deprecated use LibroOutputView instead.
 */
export const LibroOutputModel = LibroOutputView;
