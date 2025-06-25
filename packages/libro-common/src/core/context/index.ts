import { ManaModule } from '../module/index.js';

import { DataContextManager } from './data-context-manager.js';
import {
  DataContextContriburtion,
  DataContextSymbol,
} from './data-context-protocol.js';

export * from './data-context.js';
export * from './data-context-manager.js';
export * from './data-context-protocol.js';

export const ContextModule = ManaModule.create()
  .contribution(DataContextContriburtion)
  .register(DataContextManager, {
    token: DataContextSymbol,
    useDynamic: (ctx) => ctx,
  });
