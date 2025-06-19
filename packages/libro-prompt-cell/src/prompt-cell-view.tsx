import { EditOutlined } from '@ant-design/icons';
import type { IRange } from '@difizen/libro-code-editor';
import type { ICodeCell, IOutput } from '@difizen/libro-common';
import { MIME } from '@difizen/libro-common';
import { isOutput } from '@difizen/libro-common';
import {
  getOrigin,
  inject,
  prop,
  transient,
  useInject,
  view,
  ViewInstance,
  ViewManager,
  ViewOption,
  ViewRender,
  watch,
  Deferred,
  ConfigurationService,
} from '@difizen/libro-common/app';
import { l10n } from '@difizen/libro-common/l10n';
import type {
  ExecutionMeta,
  KernelMessage,
  IOutputAreaOption,
  LibroCell,
  CellViewOptions,
} from '@difizen/libro-jupyter';
import {
  KernelError,
  LibroJupyterModel,
  CellService,
  LibroEditableExecutableCellView,
  LibroOutputArea,
} from '@difizen/libro-jupyter';
import { ChatComponents } from '@difizen/magent-chat';
import { Select, Tag } from 'antd';
import type { DefaultOptionType } from 'antd/es/select/index.js';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import breaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';

import { CodeBlock } from './code-block.js';
import { ChatRecordInput, VariableNameInput } from './input-handler/index.js';
import { LibroPromptCellModel } from './prompt-cell-model.js';
import { PromptScript } from './prompt-cell-script.js';
import './index.less';

export interface ChatObject {
  name: string;
  type: string;
  order: number;
  key: string;
  disabled?: boolean;
  support_interpreter?: 'dynamic' | 'immutable' | 'disable';
  interpreter_enabled?: boolean;
  [key: string]: any;
}

function ChatObjectFromKey(key: string): ChatObject {
  const [type, name] = key.split(':');
  return {
    name,
    type,
    key,
    order: 0,
    disabled: true,
  };
}
export interface ChatObjectOptions {
  order?: number;
  color?: string;
}

const ChatObjectOptions = (type: string): ChatObjectOptions => {
  switch (type) {
    case 'LLM':
      return {
        order: 1,
        color: 'blue',
      };
    case 'LMM':
      return {
        order: 2,
        color: 'cyan',
      };
    case 'VARIABLE':
      return {
        order: 3,
        color: 'red',
      };
    case 'API':
      return {
        order: 4,
        color: 'green',
      };
    case 'CUSTOM':
      return {
        order: 5,
        color: undefined,
      };
    default:
      return {
        order: undefined,
        color: undefined,
      };
  }
};

const InterpreterMode = () => {
  const instance = useInject<LibroPromptCellView>(ViewInstance);
  // const handleInterpreterSwitch = (checked: boolean) => {
  //   instance.model.interpreterEnabled = checked;
  //   if (instance.model.chatKey) {
  //     instance.switchInterpreterMode(instance.model.chatKey, checked);
  //     instance.model.promptOutput = undefined;
  //     instance.model.interpreterCode = undefined;
  //   }
  // };

  if (instance.model.supportInterpreter === 'immutable') {
    return (
      <Tag bordered={false} color="geekblue">
        Interpreter
      </Tag>
    );
  }

  // if (instance.model.supportInterpreter === 'dynamic') {
  //   return (
  //     <div>
  //       <span className="libro-prompt-cell-interpreter-switch-tip">
  //         {instance.model.interpreterEnabled ? '关闭 Interpreter' : '开启 Interpreter'}
  //       </span>
  //       <Switch
  //         size="small"
  //         className="libro-prompt-cell-interpreter-switch"
  //         onChange={handleInterpreterSwitch}
  //       />
  //     </div>
  //   );
  // }
  return null;
};

const SelectionItemLabel: React.FC<{ item: ChatObject }> = (props: {
  item: ChatObject;
}) => {
  const item = props.item;

  return (
    <span
      className={classNames('libro-prompt-cell-selection', {
        'libro-prompt-cell-selection-disabled': item.disabled,
      })}
    >
      <Tag
        color={ChatObjectOptions(item.type).color}
        className="libro-prompt-cell-selection-tag"
      >
        {item.type}
      </Tag>
      <span className="libro-prompt-cell-selection-name">{item.name}</span>
    </span>
  );
};
const CellEditorRaw: React.FC = () => {
  const instance = useInject<LibroPromptCellView>(ViewInstance);
  useEffect(() => {
    if (instance.editorView?.editor) {
      instance.editor = getOrigin(instance.editorView?.editor);
    }
  }, [instance, instance.editorView?.editor]);
  return <>{instance.editorView && <ViewRender view={instance.editorView} />}</>;
};

export const CellEditor = React.memo(CellEditorRaw);

const PropmtEditorViewComponent = React.forwardRef<HTMLDivElement>(
  function PropmtEditorViewComponent(props, ref) {
    const instance = useInject<LibroPromptCellView>(ViewInstance);
    const LLMRender = ChatComponents.Markdown;
    const [selectedModel, setSelectedModel] = useState<string>(l10n.t('暂无内置模型'));
    useEffect(() => {
      // TODO: Data initialization should not depend on view initialization, which causes limitations in usage scenarios and multiple renderings.
      instance.model.variableName = instance.model.decodeObject.variableName;
      instance
        .updateChatObjects()
        .then(() => {
          const len = instance.chatObjects.length;
          if (len > 0) {
            if (!instance.model.decodeObject.chatKey) {
              instance.model.chatKey = instance.chatObjects[len - 1].key;
            } else {
              instance.model.chatKey = instance.model.decodeObject.chatKey;
            }
            setSelectedModel(instance.model.chatKey);
            return;
          }
          return;
        })
        .catch(() => {
          //
        });
      instance.updateChatRecords();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleChange = (value: string, options?: DefaultOptionType) => {
      instance.handleModelNameChange(value, options);
      setSelectedModel(value);
    };

    const replace = (data: string) => {
      if (instance instanceof LibroPromptCellView && instance.editor) {
        const length = instance.editor.model.value.length;
        const start = instance.editor.getPositionAt(0);
        const end = instance.editor.getPositionAt(length);
        if (start && end) {
          instance.editor.replaceSelection(data, {
            start,
            end,
          });
        }
      }
    };

    return (
      <div
        className={instance.className}
        ref={ref}
        tabIndex={10}
        onBlur={instance.blur}
      >
        <div className="libro-prompt-cell-header">
          <div>
            <span>
              <Select
                value={selectedModel}
                style={{ minWidth: 160 }}
                onChange={handleChange}
                options={instance.sortedChatObjects.map(instance.toSelectionOption)}
                bordered={false}
                onFocus={async () => {
                  await instance.updateChatObjects();
                }}
              />
            </span>
            <div className="libro-prompt-cell-interpreter-header-container">
              <InterpreterMode />
            </div>
            <VariableNameInput
              value={instance.model.variableName}
              checkVariableNameAvailable={instance.checkVariableNameAvailable}
              handleVariableNameChange={instance.handleVariableNameChange}
            />
          </div>
          <div className="libro-prompt-cell-right-header">
            <ChatRecordInput
              value={instance.model.record}
              handleChange={instance.handleRecordChange}
              records={instance.chatRecords}
              onFocus={instance.updateChatRecords}
            />
          </div>
        </div>
        {instance.interpreterEditMode && (
          <>
            <div className="libro-prompt-cell-model-prompt">
              {instance.model.prompt}
            </div>
            <div className="libro-prompt-cell-model-tip">
              <LLMRender
                type="message"
                remarkPlugins={[remarkGfm, breaks]}
                components={{ code: CodeBlock }}
              >
                {instance.model.promptOutput}
              </LLMRender>
            </div>
          </>
        )}
        <div className="libro-edit-container">
          {instance.interpreterEditMode && (
            <div
              className="libro-interpreter-edit-container"
              onClick={() => {
                instance.interpreterEditMode = false;
                if (instance.model.prompt) {
                  replace(instance.model.prompt);
                }
              }}
            >
              <div className="libro-interpreter-edit-tip">退出编辑</div>
              <EditOutlined className="libro-interpreter-edit-icon" />
            </div>
          )}
          <CellEditor />
        </div>
      </div>
    );
  },
);

@transient()
@view('prompt-editor-cell-view')
export class LibroPromptCellView extends LibroEditableExecutableCellView {
  override view = PropmtEditorViewComponent;

  declare model: LibroPromptCellModel;

  // TODO: Chat objects and chat message records should belong to libro rather than cell
  @prop()
  chatObjects: ChatObject[] = [];

  @prop()
  contextChatRecords: string[] = [];

  get interpreterEditMode() {
    return this.model._interpreterEditMode;
  }

  set interpreterEditMode(data) {
    this.model._interpreterEditMode = data;
    if (data) {
      this.model.prompt = this.model.value;
      this.model.mimeType = MIME.python;
      this.outputArea.clear();
      this.parent.enterEditMode();
      this.parent.model.savable = false;
      this.parent.model.runnable = false;
    } else {
      this.parent.model.savable = true;
      this.model.interpreterCode = this.model.value;
      this.model.mimeType = 'application/vnd.libro.prompt+json';
      this.parent.model.runnable = true;
      this.handleInterpreterOutput();
    }
  }

  handleInterpreterOutput = async () => {
    if (this.model.promptOutput) {
      await this.outputArea.add({
        data: {
          'application/vnd.libro.prompt+json': this.model.promptOutput,
        },
        metadata: {},
        output_type: 'display_data',
      });
    }
    if (this.model.interpreterCode) {
      await this.outputArea.add({
        data: {
          'application/vnd.libro.interpreter.code+text': this.model.interpreterCode,
        },
        metadata: {},
        output_type: 'display_data',
      });
      this.runInterpreterCode();
    }
  };

  get sortedChatObjects(): ChatObject[] {
    const map = new Map<string, ChatObject>();
    this.parent.model.cells.forEach((cell) => {
      if (cell.model instanceof LibroPromptCellModel && cell.model.chatKey) {
        map.set(cell.model.chatKey, ChatObjectFromKey(cell.model.chatKey));
      }
    });
    this.chatObjects.forEach((item) => {
      map.set(item.key, item);
    });
    return Array.from(map.values()).sort((a, b) => {
      if (a.disabled && !b.disabled) {
        return 1;
      }
      if (a.type !== b.type) {
        const aOrder = ChatObjectOptions(a.type).order || 0;
        const bOrder = ChatObjectOptions(b.type).order || 0;
        if (aOrder === bOrder && aOrder === 0) {
          return a.type.localeCompare(b.type);
        }
        return aOrder - bOrder;
      }
      return a.order - b.order;
    });
  }

  get chatRecords(): string[] {
    let records: string[] = [];
    const recordMap: Record<string, boolean> = {};
    this.parent.model.cells.forEach((cell) => {
      if (cell.model instanceof LibroPromptCellModel && cell.model.record) {
        records = records.concat(cell.model.record);
      }
    });
    return [...records, ...this.contextChatRecords]
      .filter((r) => {
        if (recordMap[r]) {
          return false;
        } else {
          recordMap[r] = true;
          return true;
        }
      })
      .sort((a, b) => a.localeCompare(b));
  }

  viewManager: ViewManager;

  @inject(PromptScript) promptScript: PromptScript;

  outputs: IOutput[];

  protected outputAreaDeferred = new Deferred<LibroOutputArea>();
  get outputAreaReady() {
    return this.outputAreaDeferred.promise;
  }

  constructor(
    @inject(ViewOption) options: CellViewOptions,
    @inject(CellService) cellService: CellService,
    @inject(ConfigurationService) configurationService: ConfigurationService,
    @inject(ViewManager) viewManager: ViewManager,
  ) {
    super(options, cellService, configurationService);
    this.options = options;
    this.viewManager = viewManager;
    this.className = this.className + ' prompt';

    this.outputs = options.cell?.outputs as IOutput[];

    // 创建outputArea
    this.viewManager
      .getOrCreateView<LibroOutputArea, IOutputAreaOption>(LibroOutputArea, {
        cellId: this.id,
        cell: this,
      })
      .then(async (outputArea) => {
        this.outputArea = outputArea;
        const output = this.outputs;
        if (isOutput(output)) {
          await this.outputArea.fromJSON(output);
        }
        this.outputAreaDeferred.resolve(outputArea);
        this.outputWatch();
        return;
      })
      .catch(() => {
        //
      });

    this.parentReady
      .then(() => {
        if (this.parent.model.onRestart) {
          this.parent.model.onRestart(() => {
            this.updateChatObjects();
            this.updateChatRecords();
          });
        }
        return;
      })
      .catch(() => {
        //
      });
  }

  override outputWatch() {
    this.toDispose.push(
      watch(this.outputArea, 'outputs', () => {
        this.parent.model.onChange?.();
      }),
    );
  }

  override toJSON(): LibroCell {
    const meta = super.toJSON();
    return {
      ...meta,
      source: meta.source ?? this.options.cell.source,
      outputs: this.outputArea?.toJSON() ?? this.outputs,
    } as ICodeCell;
  }

  override shouldEnterEditorMode(e: React.FocusEvent<HTMLElement>) {
    return getOrigin(this.editorView)?.editor?.host?.contains(
      e.target as HTMLElement,
    ) && this.parent.model.commandMode
      ? true
      : false;
  }

  override blur = () => {
    this.editorView?.editor?.setOption('styleActiveLine', false);
    this.editorView?.editor?.setOption('highlightActiveLineGutter', false);
  };

  override clearExecution = () => {
    this.model.clearExecution();
    this.outputArea.clear();
  };

  getSelections = (): [] => {
    return this.editor?.getSelections() as [];
  };

  getSelectionsOffsetAt = (selection: IRange) => {
    const isSelect = selection;
    const start = this.editor?.getOffsetAt(isSelect.start) ?? 0;
    const end = this.editor?.getOffsetAt(isSelect.end) ?? 0;
    return { start: start, end: end };
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

    try {
      // Promise.resolve().then(() => {
      this.clearExecution();
      // });
      const future = kernelConnection.requestExecute({
        code: cellContent,
      });

      let startTimeStr = null;
      this.model.executing = true;

      this.model.metadata['execution'] = {
        'shell.execute_reply.started': '',
        'shell.execute_reply.end': '',
        to_execute: new Date().toISOString(),
      } as ExecutionMeta;

      // Handle iopub messages
      future.onIOPub = (msg: any) => {
        this.model.msgChangeEmitter.fire(msg);
        if (msg.header.msg_type === 'execute_input') {
          this.model.kernelExecuting = true;
          startTimeStr = msg.header.date as string;
          const meta = this.model.metadata.execution as ExecutionMeta;
          if (meta) {
            meta['shell.execute_reply.started'] = startTimeStr;
          }
        }
        if (msg.header.msg_type === 'error') {
          this.model.hasExecutedError = true;
        }
      };

      const msgPromise = await future.done;
      this.model.executing = false;
      this.model.kernelExecuting = false;
      this.model.hasExecutedSuccess = !this.model.hasExecutedError;

      startTimeStr = msgPromise.metadata['started'] as string; // 更新startTimeStr
      const endTimeStr = msgPromise.header.date;

      this.model.metadata['execution']['shell.execute_reply.started'] = startTimeStr;
      this.model.metadata['execution']['shell.execute_reply.end'] = endTimeStr;

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

  async runInterpreterCode() {
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
    const cellModel = this.model;

    if (!cellModel.interpreterCode) {
      return false;
    }

    try {
      cellModel.executing = true;
      const future = kernelConnection.requestExecute({
        code: cellModel.interpreterCode,
      });

      let startTimeStr = '';
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

  fetch = async (
    content: KernelMessage.IExecuteRequestMsg['content'],
    ioCallback: (msg: KernelMessage.IIOPubMessage) => any,
  ) => {
    const model = this.parent?.model as LibroJupyterModel;
    await model.kcReady;
    const connection = model.kernelConnection!;
    const future = connection.requestExecute(content);
    future.onIOPub = (msg) => {
      ioCallback(msg);
    };
    return future.done as Promise<KernelMessage.IExecuteReplyMsg>;
  };

  updateChatObjects = async () => {
    return this.fetch(
      {
        code: this.promptScript.getChatObjects,
        store_history: false,
      },
      (msg) =>
        this.handleQueryResponse(msg, (result) => {
          try {
            const chatObjects = JSON.parse(result) as ChatObject[];
            this.chatObjects = chatObjects.map((item) => ({
              ...item,
              disabled: false,
            }));
          } catch (e) {
            //
          }
        }),
    );
  };

  switchInterpreterMode = async (chatKey: string, mode: boolean) => {
    return this.fetch(
      {
        code: this.promptScript.switchInterpreterMode(chatKey, mode),
        store_history: false,
      },
      (msg) => {
        //
      },
    );
  };

  updateChatRecords = async () => {
    return this.fetch(
      {
        code: this.promptScript.getChatRecoreds,
        store_history: false,
      },
      (msg) =>
        this.handleQueryResponse(msg, (result) => {
          try {
            this.contextChatRecords = JSON.parse(result) as string[];
          } catch (e) {
            //
          }
        }),
    );
  };

  toSelectionOption = (item: ChatObject) => {
    return {
      value: item.key,
      label: <SelectionItemLabel item={item} />,
      disabled: !!item.disabled,
      support_interpreter: item.support_interpreter,
    };
  };

  handleQueryResponse = (
    response: KernelMessage.IIOPubMessage,
    cb: (result: string) => void,
  ) => {
    const msgType = response.header.msg_type;
    switch (msgType) {
      case 'execute_result':
      case 'display_data': {
        const payload = response as KernelMessage.IExecuteResultMsg;
        let content: string = payload.content.data['text/plain'] as string;
        if (content.slice(0, 1) === "'" || content.slice(0, 1) === '"') {
          content = content.slice(1, -1);
          content = content.replace(/\\"/g, '"').replace(/\\'/g, "'");
        }

        cb(content);
        break;
      }
      case 'stream': {
        const payloadDisplay = response as KernelMessage.IStreamMsg;
        let contentStream: string = payloadDisplay.content.text as string;
        if (contentStream.slice(0, 1) === "'" || contentStream.slice(0, 1) === '"') {
          contentStream = contentStream.slice(1, -1);
          contentStream = contentStream.replace(/\\"/g, '"').replace(/\\'/g, "'");
        }
        cb(contentStream);
        break;
      }
      default:
        break;
    }
  };

  checkVariableNameAvailable = (variableName?: string) => {
    return (
      this.parent.model.cells.findIndex(
        (cell) =>
          cell.model instanceof LibroPromptCellModel &&
          cell.model.variableName === variableName,
      ) > -1
    );
  };
  handleModelNameChange = (value: string, option?: DefaultOptionType) => {
    this.model.chatKey = value;
    if (option) {
      this.model.supportInterpreter = option['support_interpreter'];
    }
  };
  handleVariableNameChange = (value?: string) => {
    this.model.variableName = value;
  };
  handleRecordChange = (value: string | undefined) => {
    this.model.record = value;
  };
}
