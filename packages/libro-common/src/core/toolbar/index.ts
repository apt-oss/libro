import { ManaModule } from '../module/index.js';

import { DefaultToolbarItem } from './default-toolbar-item.js';
import { ToolbarNode, ToolbarItemFactory } from './toolbar-protocol.js';
import { ToolbarRegistry, ToolbarContribution } from './toolbar-registry.js';

export const CoreToolbarModule = ManaModule.create()
  .contribution(ToolbarContribution)
  .register(DefaultToolbarItem, ToolbarRegistry)
  .register({
    token: ToolbarItemFactory,
    useDynamic: (ctx) => {
      return (item: ToolbarNode) => {
        const child = ctx.container.createChild();
        child.register({ token: ToolbarNode, useValue: item });
        return child.get(DefaultToolbarItem);
      };
    },
  });

export * from './toolbar-protocol.js';
export * from './toolbar-registry.js';
export * from './default-toolbar-item.js';
