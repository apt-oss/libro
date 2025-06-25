import type { CommandHandler } from '../command/command-protocol.js';

import type {
  DefaultActionMenuItem,
  DefaultGeneralMenuItem,
} from './default-menu-node.js';

export type ActionMenuItem = DefaultActionMenuItem;
export type GeneralMenuItem = DefaultGeneralMenuItem;

export type MenuPath = string[];

export namespace MenuSymbol {
  export const MenuNodeSymbol = Symbol('MenuNodeSymbol');
  export const ActionMenuNodeSymbol = Symbol('ActionMenuNodeSymbol');
  export const ParentPathSymbol = Symbol('ParentPathSymbol');
}

/**
 * Factory for instantiating menu item.
 */
export const GeneralMenuItemFactory = Symbol('GeneralMenuItemFactory');
export interface GeneralMenuItemFactory {
  (item: MenuNode, menuPath: MenuPath): GeneralMenuItem;
}
/**
 * Factory for instantiating menu item.
 */
export const ActionMenuItemFactory = Symbol('ActionMenuItemFactory');
export interface ActionMenuItemFactory {
  (item: ActionMenuNode, menuPath: MenuPath): ActionMenuItem;
}
/**
 * Base interface of the nodes used in the menu tree structure.
 */
export interface MenuNode {
  /**
   * The unique ID of the menu node.
   */
  label?: React.ReactNode | React.FC;
  /**
   * technical identifier.
   */
  readonly id: string;
  /**
   * The order to display menu node.
   */
  order?: string;
  /**
   * Optional icon for the menu item
   */
  icon?: React.ReactNode | React.FC;
}
export namespace MenuNode {
  export function is(arg: any): arg is MenuNode {
    return !!arg && typeof arg === 'object' && 'id' in arg;
  }
}

export interface CommandMenuNode extends MenuNode {
  /**
   * The command to execute.
   */
  command: string;
  /**
   * In addition to the mandatory command property, an alternative command can be defined.
   * It will be shown and invoked when pressing Alt while opening a menu.
   */
  alt?: string;
}

export namespace CommandMenuNode {
  /* Determine whether object is a MenuAction */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function is(arg: any): arg is CommandMenuNode {
    return MenuNode.is(arg) && 'command' in arg;
  }
}

export interface ExecutableMenuNode extends MenuNode, CommandHandler {
  command?: string;
  /**
   * In addition to the mandatory command property, an alternative command can be defined.
   * It will be shown and invoked when pressing Alt while opening a menu.
   */
  alt?: string;
}
export namespace ExecutableMenuNode {
  /* Determine whether object is a MenuAction */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function is(arg: any): arg is ExecutableMenuNode {
    return MenuNode.is(arg) && 'execute' in arg;
  }
}

export type ActionMenuNode = CommandMenuNode | ExecutableMenuNode;
export namespace ActionMenuNode {
  /* Determine whether object is a MenuAction */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function is(arg: any): arg is ActionMenuNode {
    return CommandMenuNode.is(arg) || ExecutableMenuNode.is(arg);
  }
}

export type MenuOptions = Omit<MenuNode, 'id'>;

export namespace MenuItem {
  /* Determine whether object is a MenuAction */
  export function isGeneralMenuItem(arg: any): arg is GeneralMenuItem {
    return (
      MenuNode.is(arg) && 'children' in arg && ('addNode' in arg || 'removeNode' in arg)
    );
  }
  /* Determine whether object is a MenuAction */
  export function isActionMenuItem(arg: any): arg is ActionMenuItem {
    return ActionMenuNode.is(arg) && 'command' in arg && 'onDisposed' in arg;
  }
}

export namespace ActionMenuItem {
  /**
   * @deprecated use MenuItem.isActionMenuItem instead
   * @param arg
   * @returns arg is ActionMenuItem
   */
  export function is(arg: any): arg is ActionMenuItem {
    return MenuItem.isActionMenuItem(arg);
  }
}

export namespace GeneralMenuItem {
  /**
   * @deprecated use MenuItem.isGeneralMenuItem instead
   * @param arg
   * @returns arg is GeneralMenuItem
   */
  export function is(arg: any): arg is GeneralMenuItem {
    return MenuItem.isGeneralMenuItem(arg);
  }
}

export type MenuItem = ActionMenuItem | GeneralMenuItem;
