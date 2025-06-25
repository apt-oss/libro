import { ManaModule } from '../module/index.js';

import { DefaultActionMenuItem, DefaultGeneralMenuItem } from './default-menu-node.js';
import type { MenuNode } from './menu-protocol.js';
import { GeneralMenuItemFactory } from './menu-protocol.js';
import { ActionMenuItemFactory } from './menu-protocol.js';
import { MenuSymbol } from './menu-protocol.js';
import { MenuRegistry, MenuContribution } from './menu-registry.js';

export const MenuModule = ManaModule.create()
  .contribution(MenuContribution)
  .register(MenuRegistry, DefaultGeneralMenuItem, DefaultActionMenuItem)
  .register({
    token: GeneralMenuItemFactory,
    useDynamic: (ctx) => {
      return (item: MenuNode) => {
        const child = ctx.container.createChild();
        child.register({ token: MenuSymbol.MenuNodeSymbol, useValue: item });
        return child.get(DefaultGeneralMenuItem);
      };
    },
  })
  .register({
    token: ActionMenuItemFactory,
    useDynamic: (ctx) => {
      return (item: MenuNode) => {
        const child = ctx.container.createChild();
        child.register({ token: MenuSymbol.ActionMenuNodeSymbol, useValue: item });
        return child.get(DefaultActionMenuItem);
      };
    },
  });
