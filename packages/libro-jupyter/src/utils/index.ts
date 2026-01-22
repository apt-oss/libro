import { l10n } from '@difizen/libro-common/l10n';
import type { CellModel } from '@difizen/libro-core';
import type { ServerManager } from '@difizen/libro-kernel';
import { duration } from 'moment';

import { LibroJupyterModel } from '../libro-jupyter-model.js';
import type { ServerStatus } from '../libro-jupyter-protocol.js';
import {
  jupyterServiceStatus,
  kernelStatus,
  statusToColor,
  ExecutedWithKernelCellModel,
} from '../libro-jupyter-protocol.js';

export const EXECUTE_INPUT = 'to_execute'; // 用户点击执行按钮的时间
export const EXECUTE_REPLY_START = 'shell.execute_reply.started'; // Kernel 开始执行任务时间在 metadata 中的 key
export const EXECUTE_REPLY_REPLY = 'shell.execute_reply.end'; // Kernel 结束执行任务时间在 metadata 中的 key

export function getDefaultKernel(): string {
  return 'Python 3';
}

export const isWaitingExecute = (model: CellModel) => {
  const { executing, kernelExecuting } =
    model as unknown as ExecutedWithKernelCellModel;
  return !kernelExecuting && executing;
};

export function formatTime(value: number): string {
  const time = duration(value);
  const hours = time.hours();
  const minutes = time.minutes();
  const seconds = time.seconds();
  const milliseconds = ('000' + time.milliseconds()).substr(-3);

  if (hours >= 1) {
    return hours + 'h ' + minutes + 'min ' + seconds + 's ' + milliseconds + 'ms';
  } else if (minutes >= 1) {
    return minutes + 'min ' + seconds + 's ' + milliseconds + 'ms';
  } else if (seconds >= 1) {
    return seconds + 's ' + milliseconds + 'ms';
  } else {
    return milliseconds + 'ms';
  }
}

export function parseExecutionInfoFromModel(
  model: CellModel,
): Record<string, string> | undefined {
  const executionInfo: Record<string, string> = model.metadata['execution'] as Record<
    string,
    string
  >;
  if (executionInfo) {
    const toExecuteTime = executionInfo[EXECUTE_INPUT]; // 用户点击执行按钮的时间
    const executeStartTime = executionInfo[EXECUTE_REPLY_START]; // Kernel 开始执行任务时间
    const executeFinishTime = executionInfo[EXECUTE_REPLY_REPLY]; // Kernel 结束执行任务时间
    return {
      toExecuteTime,
      executeStartTime,
      executeFinishTime,
    };
  }
  return;
}

export function isKernelIdle(libroModel?: LibroJupyterModel): boolean {
  return !!(
    libroModel &&
    libroModel.kernelConnection &&
    libroModel.kernelConnection.status === 'idle'
  );
}

export const getServiceStatusInfo = (
  serverManager: ServerManager | undefined,
  libroModel: LibroJupyterModel | undefined,
): ServerStatus => {
  if (!serverManager || serverManager.launching) {
    return jupyterServiceStatus['loading'];
  }

  if (
    !libroModel ||
    !(libroModel instanceof LibroJupyterModel) ||
    libroModel.kernelConnecting === true ||
    libroModel.kernelConnecting === undefined
  ) {
    return kernelStatus['connecting'];
  }

  if (!libroModel.kernelConnection) {
    return {
      color: statusToColor.blocking,
      text: 'no kernel',
      category: 'Kernel',
      text_zh: l10n.t('无内核'),
    };
  }

  let status = libroModel.kernelConnection.status;

  if (status === 'unknown') {
    const hasRunningCell = libroModel.cells.some((cell) => {
      return ExecutedWithKernelCellModel.is(cell.model) && cell.model.kernelExecuting;
    });
    if (hasRunningCell) {
      status = 'busy';
    }
  }

  return kernelStatus[status];
};

// 判断服务未启动、kernel正在连接 -> return false
export const kernelPrepared = (
  libroServerManager: ServerManager,
  libroModel: LibroJupyterModel | undefined,
) => {
  const libroExecuteStatus: ServerStatus = getServiceStatusInfo(
    libroServerManager,
    libroModel,
  );
  return !(
    libroExecuteStatus.category === 'Service' ||
    (libroExecuteStatus.category === 'Kernel' &&
      libroExecuteStatus.text === 'connecting')
  );
};
