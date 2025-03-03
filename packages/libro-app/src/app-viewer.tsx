import type { NavigatableView } from '@difizen/libro-common/app';
import { ViewRender, ViewManager } from '@difizen/libro-common/app';
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
  Deferred,
  URI,
  CommandRegistry,
} from '@difizen/libro-common/app';
import { forwardRef } from 'react';

import './index.less';
import { LibroAppView } from './app-view.js';
import { AppViewerFactory } from './protocol.js';

export const AppViewerComponent = forwardRef(function LibroEditorComponent() {
  const instance = useInject<LibroAppViewer>(ViewInstance);

  return (
    <div className="libro-app-viewer-container">
      {instance.appView && <ViewRender view={instance.appView}></ViewRender>}
    </div>
  );
});

@transient()
@view(AppViewerFactory)
export class LibroAppViewer extends BaseView implements NavigatableView {
  @inject(CommandRegistry) commandRegistry: CommandRegistry;

  override view = AppViewerComponent;

  @prop()
  appView?: LibroAppView;

  @prop() filePath?: string;

  protected defer = new Deferred<void>();

  get ready() {
    return this.defer.promise;
  }

  constructor(
    @inject(ViewOption) options: { path: string },
    @inject(LabelProvider) labelProvider: LabelProvider,
    @inject(ViewManager) viewManager: ViewManager,
  ) {
    super();
    this.filePath = options.path;
    this.title.caption = options.path;
    const uri = new URI(options.path);
    viewManager
      .getOrCreateView(LibroAppView, options)
      .then((appView) => {
        this.appView = appView;
        return;
      })
      .catch(() => {
        //
      });
    const uriRef = URIIconReference.create('file', new VScodeURI(options.path));
    const iconClass = labelProvider.getIcon(uriRef);
    this.title.icon = <div className={iconClass} />;
    this.title.label = uri.displayName;
  }

  getResourceUri(): URI | undefined {
    return new URI(this.filePath);
  }

  createMoveToUri(resourceUri: URI): URI | undefined {
    this.filePath = resourceUri.path.toString();
    return resourceUri;
  }
}
