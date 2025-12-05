import type { Contribution } from '@difizen/libro-common/app';
import { Priority, prop } from '@difizen/libro-common/app';
import { ApplicationContribution, ViewManager } from '@difizen/libro-common/app';
import { contrib, inject, singleton } from '@difizen/libro-common/app';

import type { CellView, CellModel, CellOptions } from '../libro-protocol.js';
import { LibroService } from '../libro-service.js';
import { LibroViewTracker } from '../libro-view-tracker.js';

import type { CellMeta } from './libro-cell-protocol.js';
import {
  CellService,
  getLibroCellType,
  CellViewContribution,
  CellModelContribution,
} from './libro-cell-protocol.js';

@singleton({ contrib: [CellService, ApplicationContribution] })
export class LibroCellService implements CellService, ApplicationContribution {
  @prop()
  cellsMeta: CellMeta[] = [];

  protected readonly modelProvider: Contribution.Provider<CellModelContribution>;
  protected readonly viewProvider: Contribution.Provider<CellViewContribution>;
  protected cellTypeToModelContribution: Map<string, CellModelContribution> = new Map();
  protected readonly viewManager: ViewManager;
  protected modelCache: Map<string, Map<string, CellModel>> = new Map();
  @inject(LibroViewTracker) libroViewTracker: LibroViewTracker;

  libroService: LibroService;
  constructor(
    @inject(ViewManager)
    viewManager: ViewManager,
    @inject(LibroService) libroService: LibroService,
    @contrib(CellModelContribution)
    modelProvider: Contribution.Provider<CellModelContribution>,
    @contrib(CellViewContribution)
    viewProvider: Contribution.Provider<CellViewContribution>,
  ) {
    this.modelProvider = modelProvider;
    this.viewProvider = viewProvider;
    this.viewManager = viewManager;
    this.libroService = libroService;
  }

  protected getContributionDefaultCellOption(ctb: CellModelContribution): CellOptions {
    if (ctb.getDefaultCellOption) {
      return ctb.getDefaultCellOption();
    }
    return this.cellTypeToOption(ctb.cellMeta.type);
  }

  initialize() {
    const prioritized = this.getDefaultOptionModelContributionPrioritized();
    const metas: CellMeta[] = [];
    prioritized.forEach((item) => {
      if (!this.cellTypeToModelContribution.get(item.cellMeta.type)) {
        this.cellTypeToModelContribution.set(item.cellMeta.type, item);
        metas.push(item.cellMeta);
      }
    });
    metas.sort((a, b) => a.order.localeCompare(b.order));
    this.cellsMeta = metas;
  }

  getDefaultCellOption(cellType: string) {
    const contribution = this.cellTypeToModelContribution.get(cellType);
    if (!contribution) {
      throw new Error(`no cell model contribution found for cell type ${cellType}`);
    }
    return this.getContributionDefaultCellOption(contribution);
  }

  protected cellTypeToOption(cellType: string): CellOptions {
    return { cell: { cell_type: cellType, source: '', metadata: {} } };
  }

  getModelFromCache(groupId: string, modelId: string) {
    return this.modelCache.get(groupId)?.get(modelId);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getOrCreateModel(options: CellOptions, cacheGroupId = ''): Promise<CellModel> {
    let cellmodelCache = this.modelCache.get(cacheGroupId);

    if (!cellmodelCache) {
      cellmodelCache = new Map();
      this.modelCache.set(cacheGroupId, cellmodelCache);
    }
    if (options.modelId) {
      const exist = this.modelCache.get(cacheGroupId)?.get(options.modelId);
      if (exist) {
        return exist;
      }
    }
    const modelProvider = this.findModelProvider(options);
    if (!modelProvider) {
      throw new Error('no cell model provider found');
    }
    const model = await modelProvider.createModel(options);
    cellmodelCache.set(model.id, model);
    return model;
  }
  async getOrCreateView(options: CellOptions, parentId: string): Promise<CellView> {
    const model = await this.getOrCreateModel(options, parentId);
    const viewProvider = this.findViewProvider(options);
    if (!viewProvider) {
      throw new Error('no cell view provider found');
    }

    const cellViewPromise = this.viewManager.getOrCreateView(viewProvider.view, {
      ...options,
      modelId: model.id,
      parentId: parentId,
      toJSON: () => ({
        id: options.id,
        modelId: model.id,
        parentId,
      }),
    });

    const cellView = await cellViewPromise;
    const parent = this.libroService.getViewCache().get(parentId);
    if (parent) {
      cellView.parent = parent;
    }
    return cellView;
  }

  findViewProvider(options: CellOptions): CellViewContribution | undefined {
    const prioritized = Priority.sortSync(
      this.viewProvider.getContributions(),
      (contribution) => this.canHandleOption(contribution, options),
    );

    const sorted = prioritized.map((c) => c.value);
    return sorted[0];
  }
  findModelProvider(options: CellOptions): CellModelContribution | undefined {
    const prioritized = Priority.sortSync(
      this.modelProvider.getContributions(),
      (contribution) => this.canHandleOption(contribution, options),
    );
    const sorted = prioritized.map((c) => c.value);
    return sorted[0];
  }

  protected getDefaultOptionModelContributionPrioritized(): CellModelContribution[] {
    const prioritized = Priority.sortSync(
      this.modelProvider.getContributions(),
      (contribution) => {
        const options = this.getContributionDefaultCellOption(contribution);
        return this.canHandleOption(contribution, options);
      },
    );
    const sorted = prioritized.map((c) => c.value);
    return sorted;
  }
  protected canHandleOption(
    ctb: CellModelContribution | CellViewContribution,
    options: CellOptions,
  ) {
    return ctb.canHandle(options, getLibroCellType(options));
  }
}
