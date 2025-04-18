import type { ViewComponent } from '@difizen/libro-common/app';
import { Deferred } from '@difizen/libro-common/app';
import { useInject, watch } from '@difizen/libro-common/app';
import { BaseView, view, ViewInstance, ViewOption } from '@difizen/libro-common/app';
import { inject } from '@difizen/libro-common/app';
import { DisposableCollection } from '@difizen/libro-common/app';
import { prop } from '@difizen/libro-common/app';
import React from 'react';

import type { CellViewOptions, CellModel } from '../libro-protocol.js';
import type { CellView, NotebookView } from '../libro-protocol.js';

import { CellService } from './libro-cell-protocol.js';
import type { LibroCell } from './libro-cell-protocol.js';
import type { LibroCellService } from './libro-cell-service.js';
import { ExecutableCellModel } from './libro-executable-cell-model.js';

export const LibroCellComponent = React.forwardRef(function LibroCellComponent() {
  const instance = useInject<LibroCellView>(ViewInstance);
  return <>{instance.model.value}</>;
});

@view('libro-cell-view')
export class LibroCellView extends BaseView implements CellView {
  protected override toDispose = new DisposableCollection();
  options: CellViewOptions;

  @prop()
  noEditorAreaHeight = 0;

  @prop()
  cellViewTopPos = 0;

  @prop()
  renderEditorIntoVirtualized = false;

  @prop()
  model: CellModel;
  protected cellService: CellService;
  override view: ViewComponent = LibroCellComponent;

  protected _parent: NotebookView;

  get parent() {
    return this._parent;
  }
  set parent(value: NotebookView) {
    this._parent = value;
    this.parentDefer.resolve(this.parent);
  }

  protected parentDefer = new Deferred<NotebookView>();

  get parentReady() {
    return this.parentDefer.promise;
  }

  @prop()
  override className?: string | undefined = 'libro-cell-view-container';

  @prop()
  hasInputHidden: boolean;

  @prop()
  collapsedHidden = false;

  @prop()
  hasModal = false;

  constructor(
    @inject(ViewOption) options: CellViewOptions,
    @inject(CellService) cellService: CellService,
  ) {
    super();
    this.cellService = cellService;
    this.options = options;
    this.hasInputHidden = false;
    const model = cellService.getModelFromCache(options.parentId, options.modelId);
    if (!model) {
      console.warn('cell model does not exist');
      throw new Error('cell model does not exist');
    }
    this.model = model;
    this.cellWatch();
  }

  override onViewMount(): void {
    const id = this.options.id + this.parent.id + 'add';
    if (
      (this.cellService as LibroCellService).libroViewTracker.isEnabledSpmReporter &&
      this.options.id &&
      (this.cellService as LibroCellService).libroViewTracker.hasTracker(id)
    ) {
      const cellTracker = (
        this.cellService as LibroCellService
      ).libroViewTracker.getOrCreateTrackers({
        id,
      });
      cellTracker['endTime'] = Date.now();
      cellTracker['extra'].cellType = this.model.type;
      (this.cellService as LibroCellService).libroViewTracker.tracker(cellTracker);
    }
  }

  override onViewUnmount(): void {
    const id = this.model.id + this.parent.id + 'delete';
    if (
      (this.cellService as LibroCellService).libroViewTracker.isEnabledSpmReporter &&
      (this.cellService as LibroCellService).libroViewTracker.hasTracker(id)
    ) {
      const cellTracker = (
        this.cellService as LibroCellService
      ).libroViewTracker.getOrCreateTrackers({
        id,
      });
      cellTracker['endTime'] = Date.now();
      cellTracker['extra'].cellType = this.model.type;
      (this.cellService as LibroCellService).libroViewTracker.tracker(cellTracker);
    }
  }

  cellWatch() {
    this.toDispose.push(
      watch(this.model, 'value', () => {
        this.parent.model.onChange?.();
        this.parent.model.onSourceChange?.([this]);
      }),
    );
    this.toDispose.push(
      watch(this.model, 'type', () => {
        this.parent.model.onChange?.();
        this.parent.model.onSourceChange?.([this]);
      }),
    );
    if (ExecutableCellModel.is(this.model)) {
      this.toDispose.push(
        watch(this.model, 'executeCount', () => {
          this.parent.model.onChange?.();
        }),
      );
    }
  }

  // 计算编辑器区相对于编辑器区垂直方向的偏移量
  calcEditorOffset() {
    return 16 + 1;
  }

  hasCellHidden() {
    return this.hasInputHidden;
  }

  async run() {
    return Promise.resolve(true);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  shouldEnterEditorMode(e: React.FocusEvent<HTMLElement>) {
    return false;
  }

  blur() {
    //
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  focus(isEdit: boolean) {
    //
  }

  disposed = false;
  override dispose() {
    this.toDispose.dispose();
    super.dispose();
  }
  toJSON(): LibroCell {
    const meta = { ...(this.model.toJSON() as LibroCell) };
    const modelContribution = this.cellService.findModelProvider(this.model.options);
    if (modelContribution?.cellMeta.nbformatType) {
      meta.metadata.libroCellType = modelContribution?.cellMeta.type;
      meta.cell_type = modelContribution?.cellMeta.nbformatType;
    }
    return meta;
  }

  toJSONWithoutId = () => {
    const JsonObject = this.toJSON();
    delete JsonObject.id;
    return {
      ...JsonObject,
    };
  };
}
