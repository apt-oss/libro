import { LibroJupyterConfiguration } from '@difizen/libro-jupyter';
import type { URI, ViewOpenHandlerOptions } from '@difizen/libro-common/app';
import { ConfigurationService, inject } from '@difizen/libro-common/app';
import {
  NavigatableViewOpenHandler,
  OpenHandler,
  singleton,
  Priority,
} from '@difizen/libro-common/app';

import type { LibroAppViewer } from './app-viewer.js';
import { AppViewerFactory } from './protocol.js';

interface AppOpenHandlerOptions extends ViewOpenHandlerOptions {
  isApp?: boolean;
}
@singleton({ contrib: OpenHandler })
export class LibroAppOpenHandler extends NavigatableViewOpenHandler<LibroAppViewer> {
  @inject(ConfigurationService) protected configurationService: ConfigurationService;

  id = AppViewerFactory;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  canHandle(uri: URI, _options?: AppOpenHandlerOptions) {
    if (uri.scheme === 'file' && uri.path.ext === '.ipynb' && _options?.isApp) {
      return Priority.PRIOR + 2;
    }
    return Priority.IDLE;
  }

  override async open(uri: URI, options: AppOpenHandlerOptions = {}) {
    const { viewOptions, ...extra } = options;
    const slot = await this.configurationService.get(
      LibroJupyterConfiguration['OpenSlot'],
    );
    return super.open(uri, {
      slot,
      viewOptions: {
        path: uri.path.toString(),
        ...viewOptions,
      },
      reveal: true,
      ...extra,
    });
  }
}
