import type { Disposable } from '@difizen/libro-common/app';
import { DisposableCollection, Emitter } from '@difizen/libro-common/app';
import { ThemeService, ViewManager } from '@difizen/libro-common/app';
import { inject, singleton, ConfigurationService } from '@difizen/libro-common/app';
import { prop } from '@difizen/libro-common/app';

import type {
  CellView,
  ICellContentChange,
  NotebookOption,
  NotebookView,
} from './libro-protocol.js';
import {
  notebookViewFactoryId,
  ModelFactory,
  NotebookService,
} from './libro-protocol.js';
import { SpmReporter } from './libro-setting.js';
import { LibroViewTracker } from './libro-view-tracker.js';

export interface NotebookViewChange {
  libroView: NotebookView;
  contentChanges: Array<{
    range: {
      start: number;
      end: number;
    };
    addedCells: CellView[];
    removedCells: CellView[];
  }>;
  cellChanges: Array<{
    cell: CellView;
  }>;
}

@singleton({ contrib: NotebookService })
export class LibroService implements NotebookService, Disposable {
  protected toDispose = new DisposableCollection();
  @inject(ModelFactory) protected libroModelFactory: ModelFactory;
  @inject(ViewManager) protected viewManager: ViewManager;
  @inject(ConfigurationService) configurationService: ConfigurationService;
  @inject(LibroViewTracker) protected libroViewTracker: LibroViewTracker;
  protected themeService: ThemeService;
  @prop()
  themeMode: string;

  @prop()
  hasFormatter = false;

  constructor(@inject(ThemeService) themeService: ThemeService) {
    this.themeService = themeService;
    this.themeMode = this.themeService.getCurrentTheme().type;
    this.themeService.onDidColorThemeChange((e) => {
      this.themeMode = e.newTheme.type;
    });
  }

  @prop() protected _active?: NotebookView;
  protected onActiveChangedEmitter: Emitter<NotebookView | undefined> = new Emitter();
  get onActiveChanged() {
    return this.onActiveChangedEmitter.event;
  }
  get active(): NotebookView | undefined {
    return this._active;
  }
  set active(value: NotebookView | undefined) {
    this._active = value;
    this.onActiveChangedEmitter.fire(value);
  }

  @prop() protected _focus?: NotebookView;
  protected onFocusChangedEmitter: Emitter<NotebookView | undefined> = new Emitter();
  get onFocusChanged() {
    return this.onFocusChangedEmitter.event;
  }

  protected onNotebookViewCreatedEmitter: Emitter<NotebookView> = new Emitter();
  get onNotebookViewCreated() {
    return this.onNotebookViewCreatedEmitter.event;
  }
  protected onNotebookViewSavedEmitter: Emitter<NotebookView> = new Emitter();
  get onNotebookViewSaved() {
    return this.onNotebookViewSavedEmitter.event;
  }
  protected onNotebookViewChangedEmitter: Emitter<NotebookViewChange> = new Emitter();
  get onNotebookViewChanged() {
    return this.onNotebookViewChangedEmitter.event;
  }
  protected onNotebookViewClosedEmitter: Emitter<NotebookView> = new Emitter();
  get onNotebookViewClosed() {
    return this.onNotebookViewClosedEmitter.event;
  }
  protected onNotebookCellCreatedEmitter: Emitter<CellView[]> = new Emitter();
  get onNotebookCellCreated() {
    return this.onNotebookCellCreatedEmitter.event;
  }
  protected onNotebookCellSavedEmitter: Emitter<CellView[]> = new Emitter();
  get onNotebookCellSaved() {
    return this.onNotebookCellSavedEmitter.event;
  }
  protected onNotebookCellChangedEmitter: Emitter<ICellContentChange> = new Emitter();
  get onNotebookCellChanged() {
    return this.onNotebookCellChangedEmitter.event;
  }
  protected onNotebookCellDeletedEmitter: Emitter<CellView[]> = new Emitter();
  get onNotebookCellDeleted() {
    return this.onNotebookCellDeletedEmitter.event;
  }

  get focus(): NotebookView | undefined {
    return this._focus;
  }
  set focus(value: NotebookView | undefined) {
    this._focus = value;
    this.onFocusChangedEmitter.fire(value);
  }

  get hasFocus(): boolean {
    return this._hasFocus;
  }

  getViewCache(): Map<string, NotebookView> {
    return this.libroViewTracker.viewCache;
  }

  deleteLibroViewFromCache(instance: NotebookView) {
    this.onNotebookViewClosedEmitter.fire(instance);
    this.libroViewTracker.viewCache.delete(instance.id);
    this.libroViewTracker.modelCache.delete(instance.model.id);
  }

  @prop()
  protected _hasFocus = false;

  getOrCreateModel(options: NotebookOption) {
    if (options.modelId) {
      const exist = this.libroViewTracker.modelCache.get(options.modelId);
      if (exist) {
        return exist;
      }
    }
    const model = this.libroModelFactory(options);
    this.libroViewTracker.modelCache.set(options.modelId || model.id, model);
    return model;
  }
  async getOrCreateView(options: NotebookOption): Promise<NotebookView> {
    if (this.libroViewTracker.isEnabledSpmReporter) {
      this.libroViewTracker.getOrCreateSpmTracker({
        id: options.modelId || options.id,
      });
    }
    const notebookViewPromise = this.viewManager.getOrCreateView<NotebookView>(
      notebookViewFactoryId,
      {
        ...(options || {}),
        modelId: options.modelId || options.id,
      },
    );
    const notebookView = await notebookViewPromise;
    if (!this.libroViewTracker.viewCache.has(notebookView.id)) {
      this.watchNotebookView(notebookView);
    }
    this.libroViewTracker.viewCache.set(notebookView.id, notebookView);

    return notebookViewPromise;
  }

  protected watchNotebookView(view: NotebookView) {
    view.initialized
      .then(() => {
        return this.onNotebookViewCreatedEmitter.fire(view);
      })
      .catch(() => {
        //
      });
    this.toDispose.push(
      view.onSave(() => {
        this.onNotebookViewSavedEmitter.fire(view);
      }),
    );
    this.toDispose.push(
      view.model.onCellContentChanged((e) => {
        this.onNotebookCellChangedEmitter.fire(e);
      }),
    );
    this.toDispose.push(
      view.model.onCellViewChanged((e) => {
        const changes: NotebookViewChange = {
          libroView: view,
          cellChanges: [],
          contentChanges: [],
        };

        if (e.delete) {
          changes.contentChanges.push({
            range: {
              start: e.delete.index,
              end: e.delete.index + e.delete?.number,
            },
            removedCells: e.delete.cells,
            addedCells: [],
          });
          this.onNotebookCellDeletedEmitter.fire(e.delete.cells);
        }

        if (e.insert) {
          changes.contentChanges.push({
            range: {
              start: e.insert.index,
              end: e.insert.index + e.insert?.cells.length,
            },
            removedCells: [],
            addedCells: e.insert.cells,
          });
          this.onNotebookCellCreatedEmitter.fire(e.insert.cells);
        }

        this.onNotebookViewChangedEmitter.fire(changes);
      }),
    );
  }

  setActive(view?: NotebookView): void {
    this._active = view;
    this.onActiveChangedEmitter.fire(view);
  }

  setHasFocus(hasFocus: boolean): void {
    this._hasFocus = hasFocus;
  }

  protected isDisposed = false;
  get disposed() {
    return this.isDisposed;
  }
  dispose() {
    this.toDispose.dispose();
    this.isDisposed = true;
  }
}
