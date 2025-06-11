import { LibroCodeCellView } from '@difizen/libro-code-cell';
import type {
  CodeEditorViewOptions,
  CompletionProvider,
  CompletionProviderOption,
  TooltipProvider,
  TooltipProviderOption,
} from '@difizen/libro-code-editor';
import { transient } from '@difizen/libro-common/app';
import { view } from '@difizen/libro-common/app';
import { getOrigin } from '@difizen/libro-common/app';
import { l10n } from '@difizen/libro-common/l10n';
import { KernelError } from '@difizen/libro-kernel';
import type { KernelMessage } from '@difizen/libro-kernel';

import { LibroJupyterModel } from '../libro-jupyter-model.js';
import type { ExecutionMeta } from '../libro-jupyter-protocol.js';
import type { LibroJupyterView } from '../libro-jupyter-view.js';

import type { JupyterCodeCellModel } from './jupyter-code-cell-model.js';

@transient()
@view('jupyter-code-cell-view')
export class JupyterCodeCellView extends LibroCodeCellView {
  declare protected _parent: LibroJupyterView;

  override get parent() {
    return this._parent;
  }
  override set parent(value: LibroJupyterView) {
    this._parent = value;
    this.parentDefer.resolve(this.parent);
  }

  // override view = JupyterCodeCellComponent;
  declare model: JupyterCodeCellModel;

  override clearExecution = () => {
    this.model.clearExecution();
    Promise.resolve()
      .then(() => {
        this.outputArea.clear();
        return;
      })
      .catch(console.error);
  };

  protected override getEditorOption(): CodeEditorViewOptions {
    const options = super.getEditorOption();

    return {
      ...options,
      tooltipProvider: this.tooltipProvider,
      completionProvider: this.completionProvider,
    };
  }

  override async onViewMount(): Promise<void> {
    super.onViewMount();
    const kcReady = getOrigin((this.parent.model as LibroJupyterModel).kcReady);
    const kernelConnection = await kcReady;
    // kernel重启后，清除执行状态，输出不变
    kernelConnection?.statusChanged((e) => {
      const terminateStatus: KernelMessage.Status[] = [
        'autorestarting',
        'starting',
        'restarting',
      ];
      if (terminateStatus.includes(e)) {
        this.model.clearExecution();
        this.model.executing = false;
      }
    });
  }

  tooltipProvider: TooltipProvider = async (option: TooltipProviderOption) => {
    const cellContent = this.model.value;
    const kernelConnection = getOrigin(
      (this.parent.model as LibroJupyterModel).kernelConnection,
    );
    if (!kernelConnection) {
      alert(l10n.t('Kernel Connection 还没有建立'));
      return null;
    }
    const reply = await kernelConnection.requestInspect({
      code: cellContent,
      cursor_pos: option.cursorPosition,
      detail_level: 1,
    });

    const value = reply.content;

    if (value.status !== 'ok' || !value.found) {
      return null;
    }
    return value.data['text/plain'] as string;
  };

  completionProvider: CompletionProvider = async (option: CompletionProviderOption) => {
    const cellContent = this.model.source;
    const kernelConnection = getOrigin(
      (this.parent.model as LibroJupyterModel).kernelConnection,
    );
    if (!kernelConnection) {
      alert(l10n.t('Kernel Connection 还没有建立'));
      throw new Error(l10n.t('Kernel Connection 还没有建立'));
    }
    const reply = await kernelConnection.requestComplete({
      code: cellContent,
      cursor_pos: option.cursorPosition,
    });

    const value = reply.content;

    if (value.status === 'abort') {
      throw new Error('abort');
    }

    if (value.status === 'error') {
      throw new Error(value.ename);
    }

    return {
      matches: value.matches,
      cursor_start: value.cursor_start,
      cursor_end: value.cursor_end,
      metadata: value.metadata,
    };
  };

  override async run() {
    const libroModel = this.parent.model;

    if (
      !libroModel ||
      !(libroModel instanceof LibroJupyterModel) ||
      !libroModel.kernelConnection ||
      libroModel.kernelConnection.isDisposed
    ) {
      return false;
    }

    const kernelConnection = getOrigin(libroModel.kernelConnection);
    const cellContent = this.model.source;
    const cellModel = this.model;

    try {
      // if (this.outputArea instanceof LibroOutputArea)
      //   this.outputArea.lastOutputContainerHeight =
      //     this.outputArea.container?.current?.clientHeight;
      cellModel.executing = true;
      const future = kernelConnection.requestExecute({
        code: cellContent,
      });

      let startTimeStr = '';
      this.clearExecution();

      // Handle iopub messages
      future.onIOPub = (msg: any) => {
        if (msg.header.msg_type === 'execute_input') {
          cellModel.metadata.execution = {
            'shell.execute_reply.started': '',
            'shell.execute_reply.end': '',
            to_execute: new Date().toISOString(),
          } as ExecutionMeta;
          cellModel.kernelExecuting = true;
          startTimeStr = msg.header.date as string;
          const meta = cellModel.metadata.execution as ExecutionMeta;
          if (meta) {
            meta['shell.execute_reply.started'] = startTimeStr;
          }
        }
        cellModel.msgChangeEmitter.fire(msg);
      };
      // Handle the execute reply.
      future.onReply = (msg: any) => {
        cellModel.msgChangeEmitter.fire(msg);
      };

      const msgPromise = await future.done;
      cellModel.executing = false;
      cellModel.kernelExecuting = false;

      startTimeStr = msgPromise.metadata['started'] as string;
      const endTimeStr = msgPromise.header.date;

      (cellModel.metadata.execution as ExecutionMeta)['shell.execute_reply.started'] =
        startTimeStr;
      (cellModel.metadata.execution as ExecutionMeta)['shell.execute_reply.end'] =
        endTimeStr;

      if (!msgPromise) {
        return true;
      }

      if (msgPromise.content.status === 'ok') {
        return true;
      } else {
        throw new KernelError(msgPromise.content);
      }
    } catch (reason: any) {
      if (reason.message.startsWith('Canceled')) {
        return false;
      }
      throw reason;
    }
  }
}
