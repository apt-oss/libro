import type * as nbformat from '@difizen/libro-common';
import type {
  LibroEditableExecutableCellView,
  ExecutableCellModel,
  IOutputAreaOption,
} from '@difizen/libro-core';
import { LibroOutputArea } from '@difizen/libro-core';
import {
  isClearOutputMsg,
  isDisplayDataMsg,
  isErrorMsg,
  isExecuteInputMsg,
  isExecuteReplyMsg,
  isExecuteResultMsg,
  isStreamMsg,
  isUpdateDisplayDataMsg,
} from '@difizen/libro-kernel';
import {
  inject,
  transient,
  view,
  ViewOption,
  DisposableCollection,
} from '@difizen/mana-app';

@transient()
@view('libro-output-area')
export class LibroJupyterOutputArea extends LibroOutputArea {
  declare cell: LibroEditableExecutableCellView;
  protected displayIdMap = new Map<string, number[]>();
  protected toDispose = new DisposableCollection();

  constructor(@inject(ViewOption) option: IOutputAreaOption) {
    super(option);
    this.handleMsg();
  }

  handleMsg() {
    const cellModel = this.cell.model as ExecutableCellModel;
    this.toDispose.push(
      cellModel.msgChangeEmitter.event((msg: any) => {
        const transientMsg = (msg.content.transient || {}) as nbformat.JSONObject;
        const displayId = transientMsg['display_id'] as string;
        if (isExecuteInputMsg(msg)) {
          cellModel.executeCount = msg.content.execution_count;
        }
        if (
          isDisplayDataMsg(msg) ||
          isStreamMsg(msg) ||
          isErrorMsg(msg) ||
          isExecuteResultMsg(msg)
        ) {
          const output: nbformat.IOutput = {
            ...msg.content,
            output_type: msg.header.msg_type,
          };
          this.add(output);
        }
        if (isUpdateDisplayDataMsg(msg)) {
          const output = { ...msg.content, output_type: 'display_data' };
          const targets = this.displayIdMap.get(displayId);
          if (targets) {
            for (const index of targets) {
              this.set(index, output);
            }
          }
        }
        if (displayId && isDisplayDataMsg(msg)) {
          const targets = this.displayIdMap.get(displayId) || [];
          targets.push(this.outputs.length);
          this.displayIdMap.set(displayId, targets);
        }
        //Handle an execute reply message.
        if (isExecuteReplyMsg(msg)) {
          const content = msg.content;
          if (content.status !== 'ok') {
            return;
          }
          const payload = content && content.payload;
          if (!payload || !payload.length) {
            return;
          }
          const pages = payload.filter((i: any) => i.source === 'page');
          if (!pages.length) {
            return;
          }
          const page = JSON.parse(JSON.stringify(pages[0]));
          const output: nbformat.IOutput = {
            output_type: 'display_data',
            data: page.data as nbformat.IMimeBundle,
            metadata: {},
          };
          this.add(output);
        }

        if (isClearOutputMsg(msg)) {
          const wait = msg.content.wait;
          this.clear(wait);
        }
      }),
    );
  }

  override dispose(): void {
    this.toDispose.dispose();
    this.displayIdMap.clear();
    super.dispose();
  }

  override clear(wait?: boolean | undefined): void {
    super.clear(wait);
    if (!wait) {
      this.displayIdMap.clear();
    }
  }
}
