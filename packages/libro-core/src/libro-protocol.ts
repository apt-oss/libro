/* eslint-disable @typescript-eslint/unified-signatures */
import type { IModel, IModelContentChange } from '@difizen/libro-code-editor';
import type {
  CellType,
  ICell,
  ICellMetadata,
  INotebookContent,
  INotebookMetadata,
} from '@difizen/libro-common';
import type { ISharedNotebook } from '@difizen/libro-shared-model';
import type { Disposable, Event } from '@difizen/libro-common/app';
import type { View } from '@difizen/libro-common/app';

import type { LibroCell } from './cell/index.js';
import type { LibroView } from './libro-view.js';
import type { VirtualizedManager } from './virtualized-manager.js';

export const LibroContextKeys = {
  active: 'active',
  focus: 'focus',
  commandMode: 'commandMode',
};

export const LibroToolbarArea = {
  HeaderLeft: 'header-left',
  HeaderCenter: 'header-center',
  HeaderRight: 'header-right',
  CellTop: 'top',
  CellRight: 'right',
};
export const NotebookOption = Symbol('NotebookOption');
/**
 * Libro 创建参数
 * 默认可 json 序列化
 */
export interface NotebookOption extends Options {
  id?: string;
  modelId?: string;
  [key: string]: any;
}

export const ModelFactory = Symbol('ModelFactory');
export type ModelFactory<T = NotebookOption> = (options: T) => NotebookModel;

export const NotebookModel = Symbol('NotebookModel');

export enum EditorStatus {
  NOTLOADED = 'not loaded',
  LOADING = 'loading',
  LOADED = 'loaded',
}

export type Options = {
  id?: string;
  [key: string]: any;
};

export interface ITracker {
  id: string;
  [key: string]: any;
  log: () => Record<string, any>;
}

export interface ScrollParams {
  cellIndex: number;
  cellOffset?: number;
}

export type NotebookModel = BaseNotebookModel & DndListModel;

export interface ICellContentChange {
  cell: CellView;
  changes: IModelContentChange[];
}
export interface BaseNotebookModel {
  id: string;
  version: number;
  /**
   * The dirty state of the model.
   * #### Notes
   * This should be cleared when the document is loaded from
   * or saved to disk.
   */
  dirty: boolean;
  executeCount: number;
  lastClipboardInteraction?: string;
  clipboard?: CellView | CellView[];
  active?: CellView | undefined;
  activeIndex: number;
  dndAreaNullEnable: boolean;
  noEditorMode: boolean;

  /**
   * Controlling whether the cell input is editable
   */
  inputEditable: boolean;

  outputEditable: boolean;

  /**
   * Controlling whether the cells list is editable
   */
  cellsEditable: boolean;
  /**
   * Controlling whether the cells can execute
   */
  runnable: boolean;
  /**
   * Controlling whether the notebook can save
   */
  savable: boolean;
  /**
   * The command mode of the model.
   */
  commandMode: boolean;

  trusted: boolean;

  onCommandModeChanged: Event<boolean>;

  /**
   * all changes
   */
  onChanged: Event<boolean>;

  /**
   * cell content & type
   */
  onSourceChanged: Event<boolean>;

  /**
   * cell create & delete
   */
  onCellViewChanged: Event<CellViewChange>;

  /**
   * cell content change detail
   */
  onCellContentChanged: Event<ICellContentChange>;

  getCells: () => CellView[];

  /**
   * Serialize the model to a string.
   */
  toString: () => string;

  /**
   * Deserialize the model from a string.
   *
   * #### Notes
   * Should emit a [contentChanged] signal.
   */
  fromString: (value: string) => void;

  /**
   * The list of cells in the notebook.
   */
  cells: CellView[];

  selections: CellView[];

  canUndo?: boolean;

  canRedo?: boolean;

  /**
   * The metadata associated with the notebook.
   */
  readonly metadata: INotebookMetadata;

  /**
   * The array of deleted cells since the notebook was last run.
   */
  readonly deletedCells: CellView[];

  /**
   * If the model is initialized or not.
   */
  isInitialized: boolean;

  initialize: () => Promise<CellOptions[]>;

  options: Options;

  /**
   * save notebook
   */
  toJSON: () => INotebookContent;

  saveNotebookContent: () => Promise<void>;

  fontSize: number;
  theme: string;

  /**
   * 聚焦
   */
  focus?: () => void;
  blur?: () => void;
  /**
   * 进入命令模式
   */
  enterCommandMode?: () => void;

  enterEditMode?: () => void;

  /**
   * all changes: cell value\cell type\cell output\ cell executecount\ cell or notebook metadata\cell create & delete
   * @returns
   */
  onChange?: () => void;

  onRestart?: Event<void>;

  onSourceChange?: (cells: CellView[]) => void;

  onCellContentChange: (changes: ICellContentChange) => void;

  interrupt?: () => void;

  canRun?: () => boolean;

  restart?: () => void;

  shutdown?: () => void;

  undo: () => void;

  redo: () => void;

  readonly sharedModel: ISharedNotebook;

  scrollToView: (cell: CellView, cellOffset?: number) => void;

  customParams: Record<string, any>;
  getCustomKey: (key: string) => any;
  setCustomKey: (key: string, val: any) => void;

  libroViewClass: string;

  onScrollToCellView: Event<ScrollParams>;

  disposeScrollToCellViewEmitter: () => void;
}

export const notebookViewFactoryId = 'notebook-view-factory';

export type NotebookView = LibroView;

export interface CellView extends View {
  model: CellModel;
  parent: NotebookView;
  wrapperCls?: string;

  blur: () => void;
  focus: (isEdit: boolean) => void;

  shouldEnterEditorMode: (e: React.FocusEvent<HTMLElement>) => boolean;

  hasCellHidden: () => boolean;

  hasInputHidden: boolean;

  hasModal: boolean;

  /**
   * 是否被折叠隐藏
   */
  collapsedHidden: boolean;

  toJSON: () => ICell;

  toJSONWithoutId: () => ICell;

  editorAreaHeight?: number;

  cellViewTopPos?: number;

  noEditorAreaHeight: number;

  editorStatus?: EditorStatus;

  calcEditorAreaHeight?: () => number;

  calcEditorOffset?: () => number;

  renderEditorIntoVirtualized?: boolean;
}
function isView(data: object): data is View {
  return (
    !!data &&
    typeof data === 'object' &&
    'id' in data &&
    'view' in data &&
    typeof data['view'] === 'function'
  );
}
export function isCellView(view: View): view is CellView {
  return (
    isView(view) &&
    'model' in view &&
    'parent' in view &&
    'run' in view &&
    'toJSON' in view
  );
}

export const CellOptions = Symbol('CellOptions');
export interface CellOptions {
  // parent?: NotebookView;
  id?: string;
  modelId?: string;
  mimetype?: string;
  cell: LibroCell;
  [key: string]: any;
}

export const CellViewOptions = Symbol('CellViewOptions');
export interface CellViewOptions {
  parentId: string;
  id: string;
  modelId: string;
  mimetype?: string;
  cell: ICell;
  [key: string]: any;
}

export interface CellViewChange {
  insert?: { cells: CellView[]; index: number };
  delete?: { index: number; number: number; cells: CellView[] };
}

export interface CellModel extends IModel, Disposable {
  /**
   * A unique identifier for the cell.
   */
  id: string;

  version: number;

  source: string;

  /**
   * The type of the cell.
   */
  type: CellType;

  /**
   * A signal emitted when the content of the model changes.
   */
  // readonly contentChanged: Event<void>;

  /**
   * A signal emitted when a model state changes.
   */
  // readonly stateChanged: Event<IContentsChangedArgs<any>>;

  /**
   * Whether the cell is trusted.
   */
  trusted: boolean;

  /**
   * The metadata associated with the cell.
   */
  readonly metadata: Partial<ICellMetadata>;

  /**
   * Serialize the model to JSON.
   * 输出时的字段顺序也要保持稳定
   */
  toJSON: () => Omit<ICell, 'outputs'>;

  options: CellOptions;
  // run: () => Promise<boolean>;
}

export const NotebookService = Symbol('NotebookService');

export interface NotebookService {
  getOrCreateModel: (options: NotebookOption) => NotebookModel;
  getOrCreateView: (options: NotebookOption) => Promise<NotebookView>;
  setActive: (view: NotebookView | undefined) => void;
  onActiveChanged: Event<NotebookView | undefined>;
}

//#region Protocol for drag & drop
export const DragAreaKey = Symbol('DragAreaKey');

export type MouseMode = 'multipleSelection' | 'mouseDown' | 'drag';

export interface DndListModel {
  mouseMode?: MouseMode;
  active?: CellView | undefined;
  hover?: CellView | undefined;
  selectCell: (cell?: CellView) => void;
  addCell: (cell: CellView, position?: number, mode?: string) => void;
  insertCells: (cells: CellView[], position?: number, mode?: string) => void;
  invertCell: (toAddcell: CellView, position: number) => void;
  splitCell: (newCells: CellView[], position: number) => void;
  deleteCell: {
    (id: string): boolean;
    (index: number): boolean;
    (cell: CellView): boolean;
  };
  exchangeCell: {
    (source: CellView, target: CellView): boolean;
    (sourceIndex: number, targetIndex: number): boolean;
    (sourceId: string, targetId: string): boolean;
  };
  exchangeCells: (source: CellView[], targetIndex: number) => void;
}

export interface DndContentProps {
  cell: CellView;
  index: number;
  position: number;
}

export interface DndItemProps {
  isDragOver: boolean;
  isDrag: boolean;
  cell: CellView;
  isMouseOverDragArea?: boolean;
}
//#endregion

export interface VirtualizedManagerOption {
  libroModel: NotebookModel;
}
export const VirtualizedManagerOption = Symbol('VirtualizedManagerOption');

export const VirtualizedManagerOptionFactory = Symbol(
  'VirtualizedManagerOptionFactory',
);

export type VirtualizedManagerOptionFactory = (
  meta: VirtualizedManagerOption,
) => VirtualizedManager;
