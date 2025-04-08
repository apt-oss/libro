import { blue, gold, green, red } from '@ant-design/colors';
import type {
  ICellMetadata,
  ICodeCellMetadata,
  PartialJSONObject,
  INotebookContent,
} from '@difizen/libro-common';
import { ExecutableCellModel } from '@difizen/libro-core';
import type { IContentsModel } from '@difizen/libro-kernel';
import type { Event as ManaEvent, Emitter } from '@difizen/libro-common/app';

export interface ExecutionMeta extends PartialJSONObject {
  'shell.execute_reply.started': string; // Kernel 开始执行任务时间在 metadata 中的 key
  'shell.execute_reply.end': string; // Kernel 结束执行任务时间在 metadata 中的 key
  to_execute: string; // 用户点击执行任务在 metadata 中的 key
}

export interface CodeCellMetadata extends ICodeCellMetadata {
  execution: ExecutionMeta;
}

export type ExecutedWithKernelCellMeta = Partial<CodeCellMetadata | ICellMetadata>;

export interface ExecutedWithKernelCellModel extends ExecutableCellModel {
  metadata: ExecutedWithKernelCellMeta;
  kernelExecuting: boolean;
}

export const ExecutedWithKernelCellModel = {
  is: (arg: Record<any, any> | undefined): arg is ExecutedWithKernelCellModel => {
    return (
      ExecutableCellModel.is(arg) &&
      'kernelExecuting' in arg &&
      typeof (arg as any).kernelExecuting === 'boolean'
    );
  },
};

export type KernelStatusAndSelectorProvider = React.FC;
export const KernelStatusAndSelectorProvider = Symbol(
  'KernelStatusAndSelectorProvider',
);

export const LibroFileService = Symbol('LibroFileService');
export interface LibroFileService {
  fileSaveError: ManaEvent<Partial<IContentsModel>>;
  fileSaveErrorEmitter: Emitter<
    Partial<IContentsModel> & { msg?: string; cause?: string }
  >;
  read: (path: string) => Promise<IContentsModel | undefined>;
  write: (
    notebookContent: INotebookContent,
    currentFileContents: IContentsModel,
  ) => Promise<IContentsModel | undefined>;
}

export const ServerLaunchManager = Symbol('ServerLaunchManager');
export interface ServerLaunchManager {
  launch: () => Promise<any>;
}

export const libroArgsMimetype = 'application/vnd.libro.args+json';

export interface ServerStatus {
  category: string;
  color: string;
  text: string;
  text_zh: string;
}

export const statusToColor = {
  canRunImmediate: green[5],
  canRun: blue[5],
  blocking: gold[5],
  error: red[4],
};

export const jupyterServiceStatus: Record<string, ServerStatus> = {
  loading: {
    category: 'JupyterService',
    color: statusToColor.blocking,
    text: 'loading',
    text_zh: '加载中',
  },
  failed: {
    category: 'JupyterService',
    color: statusToColor.error,
    text: 'failed',
    text_zh: '加载失败',
  },
  loaded: {
    category: 'JupyterService',
    color: statusToColor.canRunImmediate,
    text: 'loaded',
    text_zh: '加载完成',
  },
};

export const kernelStatus: Record<string, ServerStatus> = {
  connecting: {
    category: 'Kernel',
    color: statusToColor.blocking,
    text: 'connecting',
    text_zh: '正在连接',
  },
  unknown: {
    category: 'Kernel',
    color: statusToColor.blocking,
    text: 'unknown',
    text_zh: '未知',
  },
  starting: {
    category: 'Kernel',
    color: statusToColor.blocking,
    text: 'starting',
    text_zh: '启动中',
  },
  idle: {
    category: 'Kernel',
    color: statusToColor.canRunImmediate,
    text: 'idle',
    text_zh: '空闲',
  },
  busy: {
    category: 'Kernel',
    color: statusToColor.canRun,
    text: 'busy',
    text_zh: '忙碌',
  },
  terminating: {
    category: 'Kernel',
    color: statusToColor.blocking,
    text: 'terminating',
    text_zh: '终止中',
  },
  restarting: {
    category: 'Kernel',
    color: statusToColor.blocking,
    text: 'restarting',
    text_zh: '重启中',
  },
  autorestarting: {
    category: 'Kernel',
    color: statusToColor.blocking,
    text: 'autorestarting',
    text_zh: '自动重启中',
  },
  dead: {
    category: 'Kernel',
    color: statusToColor.error,
    text: 'dead',
    text_zh: '终止',
  },
};
