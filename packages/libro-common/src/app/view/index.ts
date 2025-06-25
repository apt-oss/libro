import { ManaModule } from '../../core/index.js';

import { BoxSlotView } from './box/index.js';
import { FlexSlotView } from './flex/index.js';
import { HeaderModule } from './header/index.js';
import { TabSlotView, SideTabView, CardTabView } from './tab/index.js';

export * from './components/index.js';
export * from './box/index.js';
export * from './tab/index.js';
export * from './flex/index.js';
export * from './header/index.js';

export const DefaultViewModule = ManaModule.create()
  .register(TabSlotView, SideTabView, CardTabView, BoxSlotView, FlexSlotView)
  .dependOn(HeaderModule);
