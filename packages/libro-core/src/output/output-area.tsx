import type { IOutput, JSONObject } from '@difizen/libro-common';
import { getBundleOptions } from '@difizen/libro-common';
import { isError, isStream } from '@difizen/libro-common';
import type { ViewComponent, Contribution } from '@difizen/libro-common/app';
import {
  ViewOption,
  getOrigin,
  ViewRender,
  BaseView,
  Priority,
  useInject,
  view,
  ViewInstance,
} from '@difizen/libro-common/app';
import { Emitter, prop, contrib, inject, transient } from '@difizen/libro-common/app';
import { useEffect, forwardRef } from 'react';

import { ExecutableCellView } from '../cell/index.js';
import type { CellView } from '../libro-protocol.js';

import type {
  BaseOutputArea,
  BaseOutputView,
  IOutputAreaOption,
} from './output-protocol.js';
import { OutputContribution } from './output-protocol.js';

const LibroOutputAreaRender = forwardRef<HTMLDivElement>(
  function LibroOutputAreaRender(props, ref) {
    const outputArea = useInject<LibroOutputArea>(ViewInstance);
    // const cellModel = outputArea.cell.model;
    // const executing = ExecutableCellModel.is(cellModel) && cellModel.executing;

    useEffect(() => {
      outputArea.onUpdateEmitter.fire();
    }, [outputArea.onUpdateEmitter, outputArea.outputs]);
    const childrenCannotClear = [];
    const children = [];
    for (const output of outputArea.outputs) {
      if (output.allowClear === false) {
        childrenCannotClear.push(output);
      } else {
        children.push(output);
      }
    }
    return (
      <div
        className="libro-output-area"
        ref={ref}
        //设置最小高度，用于优化长文本输出再次执行时的页面的滚动控制
        // style={{ minHeight: `${executing ? outputArea.lastOutputContainerHeight + 'px' : 'unset'}` }}
      >
        {childrenCannotClear.map((output) => {
          return <ViewRender view={output} key={output.id} />;
        })}
        {children.map((output) => {
          return <ViewRender view={output} key={output.id} />;
        })}
      </div>
    );
  },
);

@transient()
@view('libro-output-area')
export class LibroOutputArea extends BaseView implements BaseOutputArea {
  override view: ViewComponent = LibroOutputAreaRender;
  @contrib(OutputContribution)
  outputProvider: Contribution.Provider<OutputContribution>;
  cell: CellView;
  @prop()
  outputs: BaseOutputView[] = [];

  // lastOutputContainerHeight?: number;

  constructor(@inject(ViewOption) option: IOutputAreaOption) {
    super();
    this.cell = option.cell;
  }
  disposed?: boolean | undefined;

  get length() {
    return this.outputs.length;
  }

  protected clearNext = false;
  protected lastStream = '';

  protected lastName?: 'stdout' | 'stderr';

  /**
   * @internal
   */
  onUpdateEmitter = new Emitter<void>();

  get onUpdate() {
    return this.onUpdateEmitter.event;
  }

  get(index: number): BaseOutputView {
    if (index >= 0 && index < this.outputs.length) {
      return this.outputs[index];
    }
    throw new Error('index out of range');
  }
  protected doCreateOutput(options: IOutput): Promise<BaseOutputView> {
    const provider = this.findProvider(options);

    return provider.factory({
      output: options,
      trusted: this.cell.model.trusted,
      cell: this.cell,
    });
  }
  add = async (output: IOutput): Promise<number> => {
    if (this.clearNext) {
      this.clear();
      this.clearNext = false;
    }
    // Consolidate outputs if they are stream outputs of the same kind.
    if (
      isStream(output) &&
      this.lastStream &&
      output.name === this.lastName &&
      this.shouldCombine({
        output,
        lastModel: this.outputs[this.length - 1],
      })
    ) {
      // In order to get a list change event, we add the previous
      // text to the current item and replace the previous item.
      // This also replaces the metadata of the last item.
      const normalizeOutput = normalize(output.text);
      this.lastStream += normalizeOutput;
      this.lastStream = removeOverwrittenChars(this.lastStream);
      output.text = this.lastStream;
      const index = this.length - 1;
      this.set(index, output, true);
      return this.length;
    }
    if (isStream(output)) {
      output.text = removeOverwrittenChars(normalize(output.text));
    }
    const outputModel = this.doCreateOutput(output);

    // Update the stream information.
    if (isStream(output)) {
      const normalizedOutput = normalize(output.text);
      this.lastStream = normalizedOutput;
      this.lastName = output.name;
    } else {
      this.lastStream = '';
    }
    const model = await outputModel;
    model.onDisposed(() => {
      this.remove(model);
    });
    return this.outputs.push(model);
  };

  protected remove(model: BaseOutputView) {
    let outputs = [...this.outputs];
    outputs = outputs.filter((item) => item !== model);
    this.outputs = outputs;
  }

  set = async (index: number, output: IOutput, shouldReplace?: boolean) => {
    if (shouldReplace) {
      const outputModel = this.outputs[index];
      const { data } = getBundleOptions(output);
      outputModel.data = data as JSONObject;
      outputModel.onUpdateEmitter.fire();
      // outputModel.data
    } else {
      const outputModel = this.doCreateOutput(output);
      const current = this.outputs[index];
      current.dispose();
      const model = await outputModel;
      model.onDisposed(() => {
        this.remove(model);
      });
      this.outputs[index] = model;
    }
  };
  clear(wait?: boolean | undefined) {
    this.lastStream = '';
    if (wait) {
      this.clearNext = true;
      return;
    }
    this.outputs.forEach((output) => {
      output.dispose();
    });
  }
  fromJSON = async (values: IOutput[]) => {
    if (!values) {
      return;
    }
    // this.clear();
    for (const value of values) {
      await this.add(value);
    }
  };
  toJSON = (): IOutput[] => {
    return this.outputs.map((output) => output.toJSON());
  };

  setupCellView(cell: CellView) {
    this.cell = cell;
  }

  protected findProvider(options: IOutput): OutputContribution {
    const prioritized = Priority.sortSync(
      this.outputProvider.getContributions(),
      (contribution) => contribution.canHandle(options),
    );
    const sorted = prioritized.map((c) => c.value);
    return sorted[0]!;
  }

  /**
   * Whether a new value should be consolidated with the previous output.
   *
   * This will only be called if the minimal criteria of both being stream
   * messages of the same type.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected shouldCombine(options: {
    output: IOutput;
    lastModel: BaseOutputView;
  }): boolean {
    return true;
  }
}

/**
 * Remove characters that are overridden by backspace characters.
 */
function fixBackspace(txt: string): string {
  let tmp = txt;
  do {
    // eslint-disable-next-line no-param-reassign
    txt = tmp;
    // Cancel out anything-but-newline followed by backspace
    tmp = txt.replace(/[^\n]\x08/gm, ''); // eslint-disable-line no-control-regex
  } while (tmp.length < txt.length);
  return txt;
}

/**
 * Remove chunks that should be overridden by the effect of
 * carriage return characters.
 */
function fixCarriageReturn(txt: string): string {
  // eslint-disable-next-line no-param-reassign
  txt = txt.replace(/\r+\n/gm, '\n'); // \r followed by \n --> newline
  while (txt.search(/\r[^$]/g) > -1) {
    const base = txt.match(/^(.*)\r+/m)![1];
    let insert = txt.match(/\r+(.*)$/m)![1];
    insert = insert + base.slice(insert.length, base.length);
    // eslint-disable-next-line no-param-reassign
    txt = txt.replace(/\r+.*$/m, '\r').replace(/^.*\r/m, insert);
  }
  return txt;
}

/*
 * Remove characters overridden by backspaces and carriage returns
 */
export function removeOverwrittenChars(text: string): string {
  return fixCarriageReturn(fixBackspace(text));
}

/**
 * Normalize an output.
 */
//TODO: output处理
export function normalize(value: string[] | string): string {
  if (Array.isArray(value)) {
    return value.join('');
  }
  return value;
}

export function hasErrorOutput(cell: CellView): boolean {
  if (!ExecutableCellView.is(cell)) {
    return false;
  }
  if (cell.outputArea && cell.outputArea.length) {
    return !!cell.outputArea.outputs.find((output) => isError(getOrigin(output.raw)));
  }
  return false;
}
