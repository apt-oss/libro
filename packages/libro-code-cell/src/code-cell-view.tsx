/* eslint-disable @typescript-eslint/no-parameter-properties */
/* eslint-disable @typescript-eslint/parameter-properties */
import type { CodeEditorViewOptions } from '@difizen/libro-code-editor';
import { CodeEditorManager } from '@difizen/libro-code-editor';
import type { ICodeCell, IOutput } from '@difizen/libro-common';
import { CellUri } from '@difizen/libro-common';
import { isOutput } from '@difizen/libro-common';
import type { ViewSize } from '@difizen/libro-common/app';
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
import { l10n } from '@difizen/libro-common/l10n'; /* eslint-disable react-hooks/exhaustive-deps */
import type {
  IOutputAreaOption,
  LibroCell,
  CellViewOptions,
} from '@difizen/libro-core';
import {
  CellService,
  EditorStatus,
  LibroEditableExecutableCellView,
  LibroOutputArea,
  VirtualizedManagerHelper,
} from '@difizen/libro-core';
import hljs from 'highlight.js';
import { useEffect, useRef, memo, forwardRef } from 'react';

// 引入高亮样式
import 'highlight.js/styles/vs.css';
import './index.less';

import type { LibroCodeCellModel } from './code-cell-model.js';

function countLines(inputString: string) {
  const lines = inputString.split('\n');
  return lines.length;
}

const CellEditor: React.FC = () => {
  const instance = useInject<LibroCodeCellView>(ViewInstance);
  const virtualizedManagerHelper = useInject(VirtualizedManagerHelper);
  const virtualizedManager = virtualizedManagerHelper.getOrCreate(
    instance.parent.model,
  );
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (instance.editorView?.editor) {
      instance.editor = getOrigin(instance.editorView?.editor);
    }
  }, [instance, instance.editorView?.editor]);

  if (virtualizedManager.isVirtualized) {
    instance.renderEditorIntoVirtualized = true;
    if (instance.setEditorHost) {
      instance.setEditorHost(editorRef);
    }

    const editorAreaHeight = instance.calcEditorAreaHeight();

    return (
      <div
        style={{
          height: `${editorAreaHeight || 0}px`,
          width: '100%',
        }}
        ref={editorRef}
      />
    );
  } else {
    return <>{instance.editorView && <ViewRender view={instance.editorView} />}</>;
  }
};

const CellWithoutEditor: React.FC = () => {
  const instance = useInject<LibroCodeCellView>(ViewInstance);
  const codeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (codeRef.current) {
      // 先高亮代码
      const hljsValue = hljs.highlight(instance.model.value, {
        language: 'python',
      });
      codeRef.current.innerHTML = hljsValue.value;
    }
  }, [instance.model.value]);
  return (
    <pre className="cell-no-editor-input">
      <code ref={codeRef}></code>
    </pre>
  );
};

export const CellEditorMemo = memo(CellEditor);

const CodeEditorViewComponent = forwardRef<HTMLDivElement>(
  function CodeEditorViewComponent(props, ref) {
    const instance = useInject<LibroCodeCellView>(ViewInstance);

    return (
      <div
        className={instance.className}
        ref={ref}
        tabIndex={10}
        onBlur={instance.blur}
      >
        {instance.parent.model.noEditorMode ? (
          <CellWithoutEditor />
        ) : (
          <CellEditorMemo />
        )}
      </div>
    );
  },
);

@transient()
@view('code-editor-cell-view')
export class LibroCodeCellView extends LibroEditableExecutableCellView {
  override view = CodeEditorViewComponent;

  viewManager: ViewManager;

  declare model: LibroCodeCellModel;

  outputs: IOutput[];

  @prop()
  editorAreaHeight = 0;

  @prop()
  override noEditorAreaHeight = 0;

  @prop()
  override cellViewTopPos = 0;

  @prop()
  override editorStatus: EditorStatus = EditorStatus.NOTLOADED;

  protected outputAreaDeferred = new Deferred<LibroOutputArea>();
  get outputAreaReady() {
    return this.outputAreaDeferred.promise;
  }

  override renderEditor = () => {
    if (this.editorView) {
      return <ViewRender view={this.editorView} />;
    }
    return null;
  };

  override onViewResize(size: ViewSize) {
    if (size.height) {
      this.editorAreaHeight = size.height;
    }
  }

  calcEditorAreaHeight() {
    if (
      this.editorStatus === EditorStatus.NOTLOADED ||
      this.editorStatus === EditorStatus.LOADING
    ) {
      const { lineHeight, paddingTop, paddingBottom, scrollBarHeight } =
        this.codeEditorManager.getUserEditorConfig(this.model);

      const codeHeight = countLines(this.model.value) * (lineHeight ?? 20);
      const editorPadding = paddingTop + paddingBottom;

      const editorAreaHeight = codeHeight + editorPadding + scrollBarHeight;

      this.editorAreaHeight = editorAreaHeight;
    }

    // 编辑器已经加载的情况下cell高度都由对它的高度监听得到。
    return this.editorAreaHeight;
  }

  constructor(
    @inject(ViewOption) options: CellViewOptions,
    @inject(CellService) cellService: CellService,
    @inject(ConfigurationService) configurationService: ConfigurationService,
    @inject(ViewManager) viewManager: ViewManager,
    @inject(CodeEditorManager) codeEditorManager: CodeEditorManager,
  ) {
    super(options, cellService, configurationService);
    this.options = options;
    this.viewManager = viewManager;
    this.codeEditorManager = codeEditorManager;

    this.outputs = options.cell?.outputs as IOutput[];
    this.className = this.className + ' code';

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
      .catch(console.error);
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
      outputs: this.outputArea?.toJSON() ?? this.outputs,
    } as ICodeCell;
  }

  override onViewMount() {
    super.onViewMount();
    this.createEditor();
  }

  setEditorHost(ref: React.RefObject<HTMLDivElement>) {
    const editorHostId = this.parent.id + this.id;
    this.codeEditorManager.setEditorHostRef(editorHostId, ref);
  }

  protected override getEditorOption(): CodeEditorViewOptions {
    const option: CodeEditorViewOptions = {
      uuid: CellUri.from(this.parent.model.id, this.model.id).toString(),
      editorHostId: this.parent.id + this.id,
      model: this.model,
      config: {
        readOnly: !this.parent.model.inputEditable,
        editable: this.parent.model.inputEditable,
        placeholder: l10n.t('请输入代码'),
      },
    };
    return option;
  }

  override clearExecution = () => {
    this.model.clearExecution();
    this.outputArea.clear();
  };
}
