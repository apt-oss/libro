import { ManaModule } from '../module/index.js';

import { ApplicationStateService } from './application-state.js';
import { Application, ApplicationContribution } from './application.js';
import { DefaultWindowService } from './default-window-service.js';

export * from './application.js';
export * from './application-state.js';

export const ApplicationModule = ManaModule.create()
  .contribution(ApplicationContribution)
  .register(ApplicationStateService, Application, DefaultWindowService);
