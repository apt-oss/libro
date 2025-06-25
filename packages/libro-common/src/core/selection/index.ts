import { ManaModule } from '../module/index.js';

import { SelectionService } from './selection-service.js';

export const SelectionModule = ManaModule.create().register(SelectionService);

export * from './selection-service.js';
