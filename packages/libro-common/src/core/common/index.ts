import { ManaModule } from '../module/index.js';

import { DebugService, debug } from './debug.js';
import { StorageService } from './storage-protocol.js';
import { LocalStorageService, localStorageService } from './storage-service.js';

export * from './debug.js';
export * from './storage-service.js';
export * from './storage-protocol.js';

export const CommonModule = ManaModule.create()
  .register({
    token: StorageService,
    useValue: localStorageService,
  })
  .register({
    token: LocalStorageService,
    useValue: localStorageService,
  })
  .register({
    token: DebugService,
    useValue: debug,
  });
