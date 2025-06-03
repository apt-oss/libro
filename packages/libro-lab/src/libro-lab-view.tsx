/* eslint-disable @typescript-eslint/no-unused-vars */
import type { NotebookOption } from '@difizen/libro-core';
import { VirtualizedManagerHelper } from '@difizen/libro-core';
import { CollapseServiceFactory, NotebookService } from '@difizen/libro-core';
import { notebookViewFactoryId } from '@difizen/libro-core';
import { LibroJupyterView } from '@difizen/libro-jupyter';
import { OpenerService, URI, view, ViewOption } from '@difizen/mana-app';
import { inject, transient } from '@difizen/mana-app';

@transient()
@view(notebookViewFactoryId)
export class LibroLabView extends LibroJupyterView {
  @inject(OpenerService) protected openService: OpenerService;

  constructor(
    @inject(ViewOption) options: NotebookOption,
    @inject(CollapseServiceFactory) collapseServiceFactory: CollapseServiceFactory,
    @inject(NotebookService) notebookService: NotebookService,
    @inject(VirtualizedManagerHelper)
    virtualizedManagerHelper: VirtualizedManagerHelper,
  ) {
    super(options, collapseServiceFactory, notebookService, virtualizedManagerHelper);
    const uri = new URI(options['resource']);
    this.uri = uri;
    this.title.label = uri.displayName;
  }

  override onViewMount = () => {
    this.libroService.active = this;
    this.libroSlotManager.setup(this);

    if (this.libroViewTracker.isEnabledSpmReporter) {
      this.libroViewTracker.getOrCreateTrackers({
        id: this.options.modelId || this.options.id,
      });
    }
    if (
      this.model.isInitialized &&
      (this.model.cells.length > 30 ||
        (this.model.options['fileSize'] || 0) / (1024 * 1024) >= 5)
    ) {
      this.addLargeFileWarning();
    }
    this.onOutputRenderTab((e) => {
      // console.log('🚀 ~ LibroLabView ~ this.onOutputRenderTab ~ e:', e);
    });
  };
}
