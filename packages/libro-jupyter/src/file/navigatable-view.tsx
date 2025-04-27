import type { LibroView } from '@difizen/libro-core';
import { LibroService, DocumentCommands } from '@difizen/libro-core';
import type { NavigatableView, Saveable } from '@difizen/libro-common/app';
import { ConfigurationService } from '@difizen/libro-common/app';
import { Disposable, DisposableCollection } from '@difizen/libro-common/app';
import {
  BaseView,
  inject,
  LabelProvider,
  prop,
  transient,
  URI as VScodeURI,
  URIIconReference,
  useInject,
  view,
  ViewInstance,
  ViewOption,
  ViewRender,
  Deferred,
  URI,
  CommandRegistry,
  Emitter,
} from '@difizen/libro-common/app';
import { createRef, forwardRef } from 'react';

import { LibroConfigAutoSave } from '../config/config.js';

export const LibroEditorComponent = forwardRef(function LibroEditorComponent() {
  const instance = useInject<LibroNavigatableView>(ViewInstance);

  if (!instance.libroView || !instance.libroView.view) {
    return null;
  }

  return <ViewRender view={instance.libroView} key={instance.filePath} />;
});

export const LibroNavigatableViewFactoryId = 'libro-navigatable-view-factory';
@transient()
@view(LibroNavigatableViewFactoryId)
export class LibroNavigatableView
  extends BaseView
  implements NavigatableView, Saveable
{
  @inject(LibroService) protected libroService: LibroService;

  @inject(CommandRegistry) commandRegistry: CommandRegistry;

  protected readonly toDisposeOnAutoSave = new DisposableCollection();

  override view = LibroEditorComponent;

  codeRef = createRef<HTMLDivElement>();

  @prop() filePath?: string;

  dirtyEmitter = new Emitter<void>();

  autoSaveDelay = 1000;

  get onDirtyChanged() {
    return this.dirtyEmitter.event;
  }

  autoSave: 'on' | 'off' = 'off';
  fileSize?: number;

  @prop()
  dirty: boolean;

  @prop()
  libroView?: LibroView;

  protected defer = new Deferred<void>();

  get ready() {
    return this.defer.promise;
  }

  constructor(
    @inject(ViewOption) options: { path: string; [key: string]: any },
    @inject(LabelProvider) labelProvider: LabelProvider,
    @inject(ConfigurationService) configurationService: ConfigurationService,
  ) {
    super();
    this.filePath = options.path;
    this.dirty = false;
    this.title.caption = options.path;
    this.fileSize = options['fileSize'];
    const uri = new URI(options.path);
    const uriRef = URIIconReference.create('file', new VScodeURI(options.path));
    const iconClass = labelProvider.getIcon(uriRef);
    this.title.icon = <div className={iconClass} />;
    this.title.label = uri.displayName;
    configurationService
      .get(LibroConfigAutoSave)
      .then((value) => {
        if (value) {
          this.autoSave = 'on';
          return;
        } else {
          this.autoSave = 'off';
          return;
        }
      })
      .catch(() => {
        //
      });
  }

  override async onViewMount(): Promise<void> {
    this.getOrCreateLibroView();
  }

  save = () => {
    this.commandRegistry.executeCommand(
      DocumentCommands['Save'].id,
      undefined,
      this.libroView,
      undefined,
      { reason: 'autoSave' },
    );
  };

  protected doAutoSave(): void {
    this.toDisposeOnAutoSave.dispose();
    const handle = window.setTimeout(() => {
      this.save();

      if (this.libroView) {
        this.libroView.model.dirty = false;
      }
    }, this.autoSaveDelay);
    this.toDisposeOnAutoSave.push(Disposable.create(() => window.clearTimeout(handle)));
  }

  protected async getOrCreateLibroView() {
    const libroView = await this.libroService.getOrCreateView({
      id: this.filePath,
      resource: this.filePath,
      fileSize: this.fileSize,
    });
    if (!libroView) {
      return;
    }
    this.libroView = libroView;
    this.libroView.model.onChanged(() => {
      this.dirty = true;
      this.dirtyEmitter.fire();
      if (this.autoSave === 'on') {
        this.doAutoSave();
      }
    });
    this.libroView.onSave(() => {
      this.dirty = false;
      this.dirtyEmitter.fire();
    });
    await this.libroView.initialized;
    this.libroView.focus();
    this.defer.resolve();
  }

  getResourceUri(): URI | undefined {
    return new URI(this.filePath);
  }

  createMoveToUri(resourceUri: URI): URI | undefined {
    this.filePath = resourceUri.path.toString();
    this.getOrCreateLibroView();
    return resourceUri;
  }
}
