import type {
  CodeEditorView,
  CodeEditorViewOptions,
  IEditor,
} from '@difizen/libro-code-editor';
import { CodeEditorManager } from '@difizen/libro-code-editor';
import { CellUri } from '@difizen/libro-common';
import {
  Disposable,
  DisposableCollection,
  getOrigin,
  inject,
  prop,
  ViewOption,
  ViewRender,
  watch,
} from '@difizen/libro-common/app';
import type { ReactNode } from 'react';

import { LibroContextKey } from '../libro-context-key.js';
import type { CellView, CellViewOptions } from '../libro-protocol.js';
import { EditorStatus } from '../libro-protocol.js';
import { isCellView } from '../libro-protocol.js';

import { CellService } from './libro-cell-protocol.js';
import { LibroCellView } from './libro-cell-view.js';

export interface EditorCellView extends CellView {
  editor: IEditor | undefined;

  redo: () => void;

  undo: () => void;

  renderEditor: () => ReactNode;
}

export const EditorCellView = {
  is: (arg: Record<any, any> | undefined): arg is EditorCellView => {
    return (
      !!arg &&
      isCellView(arg as any) &&
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      'redo' in arg &&
      typeof (arg as any).redo === 'function' &&
      'undo' in arg &&
      typeof (arg as any).undo === 'function'
    );
  },
};

/**
 * 带有编辑器能力的cell view，例如raw、markdown、python、sql等
 * 超出编辑器的相关能力放在其他的更高抽象中
 */
export abstract class LibroEditorCellView
  extends LibroCellView
  implements EditorCellView
{
  protected toDisposeOnEditor = new DisposableCollection();
  @prop()
  editor: IEditor | undefined;

  @inject(LibroContextKey) protected readonly libroContextKey: LibroContextKey;
  @inject(CodeEditorManager) codeEditorManager: CodeEditorManager;

  @prop()
  editorView?: CodeEditorView;

  constructor(
    @inject(ViewOption) options: CellViewOptions,
    @inject(CellService) cellService: CellService,
  ) {
    super(options, cellService);
  }

  protected getEditorOption(): CodeEditorViewOptions {
    const option: CodeEditorViewOptions = {
      uuid: CellUri.from(this.parent.model.id, this.model.id).toString(),
      editorHostId: this.parent.id + this.id,
      model: this.model,
      config: {
        readOnly: !this.parent.model.inputEditable,
        editable: this.parent.model.inputEditable,
      },
    };
    return option;
  }

  protected async afterEditorReady() {
    this.focusEditor();
    this.toDisposeOnEditor.push(
      watch(this.parent.model, 'inputEditable', () => {
        this.editorView?.editor?.setOption(
          'readOnly',
          getOrigin(!this.parent.model.inputEditable),
        );
      }),
    );
    this.toDisposeOnEditor.push(
      this.editorView?.onModalChange((val) => (this.hasModal = val)) ?? Disposable.NONE,
    );
    this.toDisposeOnEditor.push(
      this.editor?.onModelContentChanged?.((e) => {
        this.parent.model.onCellContentChange({ cell: this, changes: e });
      }) ?? Disposable.NONE,
    );
  }

  async createEditor() {
    const option = this.getEditorOption();

    this.editorStatus = EditorStatus.LOADING;

    // 防止虚拟滚动中编辑器被频繁创建
    if (this.editorView) {
      this.editorStatus = EditorStatus.LOADED;
      return;
    }

    const editorView = await this.codeEditorManager.getOrCreateEditorView(option);

    this.editorView = editorView;
    this.editorStatus = EditorStatus.LOADED;

    editorView.onEditorStatusChange((e) => {
      if (e.status === 'ready') {
        this.editor = this.editorView!.editor;
        this.afterEditorReady();
        if (this.parent.libroViewTracker.isEnabledSpmReporter) {
          if (
            this.parent.libroViewTracker.hasTracker(
              this.parent.model.options['modelId'] || this.parent.model.options['id'],
            )
          ) {
            const libroTracker = this.parent.libroViewTracker.getOrCreateSpmTracker({
              id:
                this.parent.model.options['modelId'] || this.parent.model.options['id'],
            });
            libroTracker.endTime = Date.now();
            libroTracker.extra.cellsCount = this.parent.model.cells.length;
            this.parent.libroViewTracker.tracker(libroTracker);
          }
          const id = this.options.id + this.parent.id + 'add';
          if (this.options.id && this.parent.libroViewTracker.hasTracker(id)) {
            const cellTracker = this.parent.libroViewTracker.getOrCreateSpmTracker({
              id,
            });
            cellTracker.endTime = Date.now();
            cellTracker.extra.cellType = this.model.type;
            this.parent.libroViewTracker.tracker(cellTracker);
          }
        }
      } else if (e.status === 'disposed') {
        this.toDisposeOnEditor.dispose();
      }
    });
  }

  @prop()
  editorStatus: EditorStatus = EditorStatus.NOTLOADED;

  renderEditor = () => {
    if (this.editorView) {
      return <ViewRender view={this.editorView} />;
    }
    return null;
  };

  override onViewMount() {
    super.onViewMount();
    this.createEditor();
    //选中cell时才focus
    if (this.parent.model.active?.id === this.id) {
      this.focus(!this.parent.model.commandMode);
    }
  }

  override shouldEnterEditorMode(e: React.FocusEvent<HTMLElement>) {
    return getOrigin(this.editorView)?.editor?.host?.contains(
      e.target as HTMLElement,
    ) && this.parent.model.commandMode
      ? true
      : false;
  }

  protected focusEditor() {
    //选中cell、编辑模式、非只读时才focus
    if (
      this.editorView?.editor &&
      this.editorView.editorStatus === 'ready' &&
      this.parent.model.active?.id === this.id &&
      !this.parent.model.commandMode &&
      this.libroContextKey.commandModeEnabled === true && // 排除弹窗等情况
      this.parent.model.inputEditable
    ) {
      this.editorView?.editor.setOption('styleActiveLine', true);
      this.editorView?.editor.setOption('highlightActiveLineGutter', true);
      this.editorView?.editor.focus();
    }
  }

  override focus = (toEdit: boolean) => {
    if (toEdit) {
      this.focusEditor();
    } else {
      if (this.container?.current?.parentElement?.contains(document.activeElement)) {
        return;
      }
      this.container?.current?.parentElement?.focus();
    }
  };

  override blur = () => {
    this.editorView?.editor?.setOption('styleActiveLine', false);
    this.editorView?.editor?.setOption('highlightActiveLineGutter', false);
  };

  get wrapperCls() {
    return '';
  }

  redo(): void {
    this.editor?.redo();
  }

  undo(): void {
    this.editor?.undo();
  }
}
