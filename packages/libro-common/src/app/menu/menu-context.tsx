import * as React from 'react';

import type { Menu } from './menu.js';

/**
 * @deprecated use useInject(MenuInstance) instead
 */
export const MenuContext = React.createContext<MenuContext.Context>({} as any);

// eslint-disable-next-line @typescript-eslint/no-redeclare
export namespace MenuContext {
  export interface Context {
    menu: Menu;
    data: any;
  }
}
