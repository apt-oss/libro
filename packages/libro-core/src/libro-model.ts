/* eslint-disable @typescript-eslint/unified-signatures */
import type {
  ICodeCell,
  INotebookContent,
  INotebookMetadata,
} from '@difizen/libro-common';
import { getOrigin, ConfigurationService } from '@difizen/libro-common/app';
import { Emitter } from '@difizen/libro-common/app';
import { prop } from '@difizen/libro-common/app';
import { inject, transient } from '@difizen/libro-common/app';
import { createMutex, YNotebook } from '@difizen/libro-shared-model';
import type {
  CellTypeAdaptor,
  ISharedNotebook,
  NotebookChange,
} from '@difizen/libro-shared-model';
import { v4 } from 'uuid';

import { LibroContentService } from './content/index.js';
import { isCellView, NotebookOption } from './libro-protocol.js';
import type {
  CellOptions,
  CellViewChange,
  DndListModel,
  NotebookModel,
  ScrollParams,
  CellView,
  MouseMode,
  ICellContentChange,
} from './libro-protocol.js';
import { EnterEditModeWhenAddCell } from './libro-setting.js';
import { VirtualizedManagerHelper } from './virtualized-manager-helper.js';

@transient()
export class LibroModel implements NotebookModel, DndListModel {
  @inject(NotebookOption) options: NotebookOption;
  @inject(LibroContentService) libroContentService: LibroContentService;
  @inject(VirtualizedManagerHelper) virtualizedManagerHelper: VirtualizedManagerHelper;
  @inject(ConfigurationService) configurationService: ConfigurationService;

  protected scrollToCellViewEmitter: Emitter;
  get onScrollToCellView() {
    return this.scrollToCellViewEmitter.event;
  }

  protected cellViewChangeEmitter: Emitter<CellViewChange> = new Emitter();
  get onCellViewChanged() {
    return this.cellViewChangeEmitter.event;
  }

  disposeScrollToCellViewEmitter() {
    this.scrollToCellViewEmitter.dispose();
  }

  protected onCommandModeChangedEmitter: Emitter<boolean> = new Emitter();
  get onCommandModeChanged() {
    return this.onCommandModeChangedEmitter.event;
  }

  protected onChangedEmitter: Emitter<boolean> = new Emitter();
  get onChanged() {
    return this.onChangedEmitter.event;
  }

  protected onSourceChangedEmitter: Emitter<boolean> = new Emitter();
  get onSourceChanged() {
    return this.onSourceChangedEmitter.event;
  }

  protected onRestartEmitter: Emitter<void> = new Emitter();
  get onRestart() {
    return this.onRestartEmitter.event;
  }

  protected onCellContentChangedEmitter: Emitter<ICellContentChange> = new Emitter();
  get onCellContentChanged() {
    return this.onCellContentChangedEmitter.event;
  }

  onCellContentChange(change: ICellContentChange) {
    this.onCellContentChangedEmitter.fire(change);
  }

  id: string;

  version = 0;

  /**
   * The shared notebook model.
   */
  readonly sharedModel: ISharedNotebook;

  /**
   * A mutex to update the shared model.
   */
  protected readonly _modelDBMutex = createMutex();

  @prop()
  lastClipboardInteraction?: string;

  clipboard?: CellView | CellView[];
  @prop()
  inputEditable = true;

  @prop()
  outputEditable = true;

  @prop()
  cellsEditable = true;

  @prop()
  noEditorMode = false;

  get executable() {
    return this.outputEditable && this.runnable;
  }

  set executable(value: boolean) {
    this.runnable = value;
  }

  @prop()
  savable = true;

  @prop()
  runnable = true;

  @prop()
  commandMode = true;

  @prop()
  isEditMode = true;

  @prop()
  dndAreaNullEnable = false;

  @prop()
  dirty = false;

  @prop()
  cells: CellView[] = [];

  getCells() {
    return this.cells.filter((cell) => !!cell);
  }

  @prop()
  active?: CellView;

  @prop()
  activeIndex = 0;

  @prop()
  hover: CellView | undefined = undefined;

  @prop()
  isInitialized = false;

  @prop()
  executeCount = 0;

  @prop()
  mouseMode: MouseMode;

  @prop()
  selections: CellView[] = [];

  deletedCells: CellView[] = [];

  metadata: INotebookMetadata = {};

  @prop()
  customParams: Record<string, any> = {};

  @prop()
  libroViewClass = '';

  @prop()
  canUndo = false;

  @prop()
  canRedo = false;

  /**
   * 默认为true，可以在metadata修改
   */
  @prop()
  trusted = true;

  canRun() {
    return true;
  }

  getCustomKey(key: string) {
    return this.customParams[key];
  }

  setCustomKey(key: string, val: any) {
    this.customParams[key] = val;
    // 备份到metadata
    // 备份到metadata
    this.metadata['customParams'] = this.customParams;
  }

  // 字体大小
  @prop()
  fontSize = 12;

  // 主题
  @prop()
  theme = '';

  cellViewCache = new Map<string, CellView>();

  nbformat_minor = 4;
  nbformat = 4;

  cellTypeAdaptor?: CellTypeAdaptor;

  constructor() {
    this.id = v4();
    this.sharedModel = YNotebook.create({
      disableDocumentWideUndoRedo: false,
      cellTypeAdaptor: this.cellTypeAdaptor,
    });
    this.scrollToCellViewEmitter = new Emitter<ScrollParams>();
    this.sharedModel.changed(this.onSharedModelChanged);
    this.sharedModel.undoChanged((value) => {
      if (value !== this.canUndo) {
        this.canUndo = value;
      }
    });
    this.sharedModel.redoChanged((value) => {
      if (value !== this.canRedo) {
        this.canRedo = value;
      }
    });
  }

  protected onSharedModelChanged = (change: NotebookChange) => {
    let currpos = 0;
    change.cellsChange?.forEach((delta) => {
      if (delta.insert !== null && delta.insert !== undefined) {
        const cellViews = delta.insert.map((cell) => {
          const view = this.cellViewCache.get(cell.id)!;
          return view;
        });
        this.insertCellsView(cellViews, currpos);
        currpos += delta.insert.length;
        this.cellViewChangeEmitter.fire({
          insert: { index: currpos, cells: cellViews },
        });
      } else if (delta.delete !== null && delta.delete !== undefined) {
        const cellViews = this.cells.slice(currpos, currpos + delta.delete);
        this.removeRange(currpos, currpos + delta.delete);
        this.cellViewChangeEmitter.fire({
          delete: { index: currpos, number: delta.delete, cells: cellViews },
        });
      } else if (delta.retain !== null && delta.retain !== undefined) {
        currpos += delta.retain;
      }
    });
    if (
      (!this.inputEditable || !this.outputEditable || !this.cellsEditable) &&
      !this.runnable &&
      !this.isInitialized
    ) {
      this.selectCell(undefined);
      return;
    }
    this.selectCell(this.cells[this.activeIndex]);

    this.configurationService
      .get(EnterEditModeWhenAddCell)
      .then((value) => {
        if (value) {
          if (this.isEditMode) {
            this.enterEditMode();
          } else {
            this.enterCommandMode();
          }
        }
        return;
      })
      .catch(() => {
        //
      });
  };

  toString: () => string;
  fromString: (value: string) => void;

  /**
   * Serialize the model to JSON.
   */
  toJSON(): INotebookContent {
    return {
      metadata: this.metadata,
      nbformat_minor: this.nbformat_minor,
      nbformat: this.nbformat,
      cells: this.getCells().map((item) => item.toJSON()),
    };
  }

  /**
   * Deserialize the model from JSON.
   *
   * #### Notes
   * Should emit a [contentChanged] signal.
   */
  fromJSON(value: INotebookContent) {
    this.sharedModel.transact(() => {
      const useId = value.nbformat === 4 && value.nbformat_minor >= 5;
      const ycells = value.cells.map((cell) => {
        if (!useId) {
          delete cell.id;
        }
        return cell;
      });
      if (!ycells.length) {
        // Create cell when notebook is empty
        // (non collaborative)
        ycells.push({ cell_type: 'code' } as ICodeCell);
      }
      this.sharedModel.insertCells(this.sharedModel.cells.length, ycells);
      this.sharedModel.deleteCellRange(0, this.sharedModel.cells.length);
    });
  }

  onChange() {
    this.version++;
    this.dirty = true;
    this.onChangedEmitter.fire(true);
  }

  onSourceChange() {
    this.dirty = true;
    this.onSourceChangedEmitter.fire(true);
  }

  /**
   * override this method to load notebook from server
   * @returns
   */
  async loadNotebookContent(): Promise<INotebookContent> {
    return this.libroContentService.loadLibroContent(this.options, this);
  }

  async saveNotebookContent(): Promise<void> {
    return this.libroContentService.saveLibroContent(this.options, this);
  }

  async initialize(): Promise<CellOptions[]> {
    this.cells = [];
    getOrigin(this.sharedModel).transact(() => {
      this.sharedModel.deleteCellRange(0, this.sharedModel.cells.length);
    });
    const content = await this.loadNotebookContent();
    this.metadata = content.metadata;
    if (this.metadata?.['customParams']) {
      this.customParams = this.metadata?.['customParams'] as Record<string, any>;
    }
    if (this.metadata?.['trusted']) {
      this.trusted = this.metadata?.['trusted'] as boolean;
    }
    this.nbformat = content.nbformat;
    this.nbformat_minor = content.nbformat_minor;
    return content.cells.map((cell) => {
      return { cell };
    });
  }

  protected toCellIndex(arg: string | number | CellView): number | undefined {
    let index: number | undefined = undefined;
    if (typeof arg === 'number') {
      index = arg;
    } else if (typeof arg === 'string') {
      index = this.cells.findIndex((cell) => cell.id === arg);
    } else if (isCellView(arg)) {
      index = this.cells.findIndex((cell) => cell.id === arg.id);
    }
    return index;
  }
  selectCell = (cell: CellView | undefined) => {
    if (!cell || this.active?.id === cell.id) {
      return;
    }
    this.active = cell;
    cell.focus(false);
    const index = this.cells.findIndex((_cell) => _cell.id === cell.id);
    if (index > -1) {
      this.activeIndex = index;
    }
  };

  hoverCell = (cell?: CellView) => {
    this.hover = cell;
  };

  /**
   * 自动滚动到可视范围内
   */
  scrollToView(cell: CellView, cellOffset = 0) {
    const virtualizedManager = this.virtualizedManagerHelper.getOrCreate(this);
    if (virtualizedManager.isVirtualized) {
      const cellIndex = this.cells.findIndex((_cell) => _cell.id === cell.id);
      this.scrollToCellViewEmitter.fire({ cellIndex, cellOffset });
      return;
    }

    let target = document.getElementById(cell.id);
    if (!target) {
      return;
    }

    const _targetheight = target?.offsetHeight || 0;
    let offsetTop = (target?.offsetTop || 0) + cellOffset;
    while (
      target?.offsetParent &&
      !target?.offsetParent?.className?.includes('libro-view-content-left')
    ) {
      target = target?.offsetParent as HTMLElement;
      offsetTop += target?.offsetTop || 0;
    }
    if (target?.offsetParent?.parentElement && _targetheight) {
      const _height = target.offsetParent.parentElement.clientHeight;
      const _scrollTop = target.offsetParent.parentElement.scrollTop;
      if (offsetTop > _scrollTop && offsetTop + _targetheight < _height + _scrollTop) {
        // 在可视范围内就不需要滚动
        return;
      }
      if (offsetTop < _scrollTop) {
        target.offsetParent.parentElement.scrollTop = offsetTop;
      } else {
        //目标cell的高度大于屏幕的高度
        if (_targetheight >= _height) {
          target.offsetParent.parentElement.scrollTop = offsetTop - _height / 2;
        } else {
          target.offsetParent.parentElement.scrollTop =
            offsetTop + _targetheight - _height + 30; // 加缓冲向上不贴底部
        }
      }
    }
  }

  addCell = (cell: CellView, position?: number, mode?: string) => {
    this.insertCells([cell], position, mode);
  };

  async restart() {
    this.onRestartEmitter.fire();
  }

  insertCells = (cells: CellView[], position?: number, mode?: string) => {
    // 非初始化阶段才需要自动滚动
    if (!this.isInitialized) {
      this.activeIndex = 0;
    } else if (mode === 'above' && position !== undefined) {
      this.activeIndex = position;
    } else {
      if (position === this.cells.length) {
        this.activeIndex = position;
      } else {
        this.activeIndex = this.activeIndex + cells.length;
      }
    }
    this.isEditMode = true;

    const cellData = cells.map((cell) => {
      this.cellViewCache.set(cell.model.id, cell);
      return cell.toJSON();
    });

    getOrigin(this.sharedModel).transact(() => {
      const insertIndex = position ?? this.sharedModel.cells.length;
      getOrigin(this.sharedModel).insertCells(insertIndex, cellData);
    });
  };

  invertCell = (toAddcell: CellView, position: number) => {
    if (this.activeIndex !== position) {
      this.activeIndex = position;
    }
    const cellData = [toAddcell].map((_cell) => {
      this.cellViewCache.set(_cell.model.id, _cell);
      return _cell.toJSON();
    });
    this.isEditMode = true;
    getOrigin(this.sharedModel).transact(() => {
      const invertIndex = position ?? this.sharedModel.cells.length;
      getOrigin(this.sharedModel).deleteCell(invertIndex);
      getOrigin(this.sharedModel).insertCells(invertIndex, cellData);
    });
  };

  splitCell = (newCells: CellView[], position: number) => {
    const newActiveIndex = position + newCells.length - 1;
    if (this.activeIndex !== newActiveIndex) {
      this.activeIndex = newActiveIndex;
    }
    const cellData = newCells.map((_cell) => {
      this.cellViewCache.set(_cell.model.id, _cell);
      return _cell.toJSON();
    });
    getOrigin(this.sharedModel).transact(() => {
      getOrigin(this.sharedModel).deleteCell(position);
      getOrigin(this.sharedModel).insertCells(position, cellData);
    });
    //切分 Cell操作结束后进入编辑态
    this.enterEditMode();
  };

  protected insertCellsView = (cell: CellView[], position?: number) => {
    if (position === 0) {
      // unshift 存在性能问题
      // this.cells.unshift(...cell);

      const arr = [...this.cells];
      arr.splice(0, 0, ...cell);
      this.cells = arr;

      return;
    }
    if (position !== undefined) {
      const _cells: CellView[] = [];
      this.getCells().forEach((_cell, index) => {
        _cells.push(_cell);
        _cell.isAttached = true;
        if (index + 1 === position) {
          _cells.push(...cell);
        }
      });
      this.cells = _cells;
    } else {
      this.cells.push(...cell);
    }
  };

  removeRange(start: number, end: number) {
    // this.cells.splice(start, end - start);
    // 不使用splice的写法，除非设置了 ObservableConfig.async = true
    const arr = [...this.cells];
    arr.splice(start, end - start);
    this.cells = arr;
  }

  deleteCell(id: string | number): boolean;
  deleteCell(index: number): boolean;
  deleteCell(cell: CellView): boolean;
  deleteCell(arg: string | number | CellView) {
    const index = this.toCellIndex(arg);
    if (index === undefined) {
      return false;
    }
    if (this.activeIndex === this.cells.length - 1) {
      this.activeIndex = this.cells.length - 2;
    } else {
      this.activeIndex = index;
    }
    this.isEditMode = false;
    getOrigin(this.sharedModel).transact(() => {
      getOrigin(this.sharedModel).deleteCell(index);
    });
    return true;
  }

  /**
   * 删除 cell 节点
   * @param arg id、index、cell
   * @returns
   */
  protected deleteCellView(arg: string | number | CellView) {
    if (arg === this.active?.id) {
      // 如果删除项正好是选中项，则清空active
      this.active = undefined;
    }
    return this.doDeleteCell(arg);
  }

  protected doDeleteCell = (arg: string | number | CellView) => {
    const index = this.toCellIndex(arg);
    if (index !== undefined) {
      const _cells: CellView[] = [];
      this.getCells().forEach((item, _index) => {
        if (index !== _index) {
          _cells.push(item);
        }
      });
      this.cells = _cells;
      if (index !== this.cells.length) {
        this.selectCell(this.cells[index]);
      } else {
        this.selectCell(this.cells[index - 1]);
      }
      return true;
    }

    return false;
  };
  exchangeCell(source: CellView, target: CellView): boolean;
  exchangeCell(sourceIndex: number, targetIndex: number): boolean;
  exchangeCell(sourceId: string, targetId: string): boolean;
  exchangeCell(source: string | number | CellView, target: string | number | CellView) {
    const sourceIndex = this.toCellIndex(source);
    const targetIndex = this.toCellIndex(target);
    if (sourceIndex === undefined || targetIndex === undefined) {
      return false;
    }
    this.activeIndex = targetIndex;
    this.isEditMode = false;
    getOrigin(this.sharedModel).transact(() => {
      getOrigin(this.sharedModel).moveCell(sourceIndex, targetIndex);
    });
    this.activeIndex = targetIndex;
    return true;
  }

  exchangeCells(source: CellView[], targetIndex: number) {
    const startIndex = this.toCellIndex(source[0]);
    const endIndex = this.toCellIndex(source[source.length - 1]);
    if (startIndex === undefined || endIndex === undefined) {
      return false;
    }
    this.isEditMode = false;
    const cellData = source.map((cell) => {
      this.cellViewCache.set(cell.model.id, cell);
      return cell.toJSON();
    });

    getOrigin(this.sharedModel).transact(() => {
      if (targetIndex > endIndex) {
        //往下交换cell
        if (startIndex === this.activeIndex) {
          //active在头
          this.activeIndex = targetIndex - source.length;
        } else {
          //active在头尾
          this.activeIndex = targetIndex - 1;
        }
        getOrigin(this.sharedModel).deleteCellRange(startIndex, endIndex + 1);
        getOrigin(this.sharedModel).insertCells(targetIndex - source.length, cellData);
      } else {
        //往上交换cell
        if (startIndex === this.activeIndex) {
          //active在头
          this.activeIndex = targetIndex;
        } else {
          //active在尾
          this.activeIndex = targetIndex + 1;
        }
        getOrigin(this.sharedModel).deleteCellRange(startIndex, endIndex + 1);
        getOrigin(this.sharedModel).insertCells(targetIndex, cellData);
      }
    });
    return true;
  }

  /**
   * 交换 cell 节点位置
   * @param source id、index、cell
   * @param target id、index、cell
   * @returns
   */
  protected exchangeCellView(
    source: string | number | CellView,
    target: string | number | CellView,
  ) {
    const sourceIndex = this.toCellIndex(source);
    const targetIndex = this.toCellIndex(target);
    if (sourceIndex !== undefined && targetIndex !== undefined) {
      // 交换位置
      const sourceItem = this.cells[sourceIndex];
      const cells = [...this.cells];
      cells.splice(sourceIndex, 1);
      cells.splice(targetIndex, 0, sourceItem);
      this.cells = cells;
      setTimeout(() => {
        // 上下移动也需要调整可视区域范围
        this.scrollToView(sourceItem);
      }, 300);
      return true;
    }
    return false;
  }
  /**
   * 进入命令模式
   */
  enterCommandMode() {
    if (this.active) {
      this.commandMode = true;
      this.onCommandModeChangedEmitter.fire(true);
      this.active.blur();
    }
  }

  enterEditMode() {
    if (this.active) {
      if (this.selections.length !== 0) {
        this.selections = [];
      }
      this.commandMode = false;
      this.onCommandModeChangedEmitter.fire(false);
      this.active.focus(true);
    }
  }

  undo() {
    getOrigin(this.sharedModel).undo();
  }

  redo() {
    getOrigin(this.sharedModel).redo();
  }
}
