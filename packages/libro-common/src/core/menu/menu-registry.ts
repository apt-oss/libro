import type { MaybePromise } from '../../common/index.js';
import { Disposable } from '../../common/index.js';
import type { Contribution } from '../../ioc/index.js';
import { contrib, inject, singleton, Syringe } from '../../ioc/index.js';
import { ApplicationContribution } from '../application/application.js';
import { CommandRegistry } from '../command/command-registry.js';

import type {
  MenuOptions,
  MenuPath,
  ActionMenuNode,
  GeneralMenuItem,
} from './menu-protocol.js';
import { CommandMenuNode, ExecutableMenuNode } from './menu-protocol.js';
import {
  GeneralMenuItemFactory,
  MenuNode,
  MenuItem,
  ActionMenuItemFactory,
} from './menu-protocol.js';

export const MenuContribution = Syringe.defineToken('MenuContribution');

export type MenuContribution = {
  /**
   * Register menus.
   * @param menus the menu registry.
   */
  registerMenus: (menus: MenuRegistry) => void;
};

/**
 * Register and unregister menus, submenus and actions
 */
@singleton({ contrib: ApplicationContribution })
export class MenuRegistry implements ApplicationContribution {
  protected readonly root: GeneralMenuItem;
  protected readonly contributions: Contribution.Provider<MenuContribution>;
  protected readonly generalItemFactory: GeneralMenuItemFactory;
  protected readonly actionItemFactory: ActionMenuItemFactory;
  protected readonly commands: CommandRegistry;

  constructor(
    @contrib(MenuContribution) contributions: Contribution.Provider<MenuContribution>,
    @inject(GeneralMenuItemFactory) generalItemFactory: GeneralMenuItemFactory,
    @inject(ActionMenuItemFactory) actionItemFactory: ActionMenuItemFactory,
    @inject(CommandRegistry) commands: CommandRegistry,
  ) {
    this.contributions = contributions;
    this.generalItemFactory = generalItemFactory;
    this.actionItemFactory = actionItemFactory;
    this.commands = commands;
    this.root = generalItemFactory({ id: '' }, []);
  }

  onStart(): void {
    for (const contribution of this.contributions.getContributions()) {
      contribution.registerMenus(this);
    }
  }

  /**
   * Adds the given menu action to the menu denoted by the given path.
   *
   * @returns a disposable which, when called, will remove the menu action again.
   */
  registerMenuAction(menuPath: MenuPath, item: ActionMenuNode): Disposable {
    const menuNode = this.actionItemFactory(item, menuPath);
    const parent = this.getOrCreateGroup(menuPath);
    return parent.addNode(menuNode);
  }

  /**
   * Adds the given menu node to the menu denoted by the given path.
   *
   * @returns a disposable which, when called, will remove the menu node again.
   */
  registerMenuNode(menuPath: MenuPath, item: MenuNode): Disposable {
    const menuNode = this.generalItemFactory(item, menuPath);
    const parent = this.getOrCreateGroup(menuPath);
    return parent.addNode(menuNode);
  }

  registerGroupMenu(menuPath: MenuPath, options: MenuOptions = {}): Disposable {
    if (menuPath.length === 0) {
      throw new Error('The group menu path cannot be empty.');
    }
    const index = menuPath.length - 1;
    const menuId = menuPath[index];
    const groupPath = index === 0 ? [] : menuPath.slice(0, index);
    const parent = this.getOrCreateGroup(groupPath, options);
    let groupNode = this.getOrCreateSub(parent, menuId, options);
    if (!groupNode) {
      groupNode = this.generalItemFactory({ id: menuId, ...options }, parent.path);
      return parent.addNode(groupNode);
    }
    if (options.label) {
      groupNode.label = options.label;
    }
    if (options.icon) {
      groupNode.icon = options.icon;
    }
    if (options.order) {
      groupNode.order = options.order;
    }
    return Disposable.NONE;
  }

  /**
   * Register a new menu at the given path with the given label.
   * (If the menu already exists without a label, iconClass or order this method can be used to set them.)
   *
   * @param menuPath the path for which a new submenu shall be registered.
   * @param label the label to be used for the new submenu.
   * @param options optionally allows to set an icon class and specify the order of the new menu.
   *
   * @returns if the menu was successfully created a disposable will be returned which,
   * when called, will remove the menu again. If the menu already existed a no-op disposable
   * will be returned.
   *
   * Note that if the menu already existed and was registered with a different label an error
   * will be thrown.
   */
  registerSubmenu(menuPath: MenuPath, options: MenuOptions = {}): Disposable {
    if (menuPath.length === 0) {
      throw new Error('The sub menu path cannot be empty.');
    }
    const index = menuPath.length - 1;
    const menuId = menuPath[index];
    const groupPath = index === 0 ? [] : menuPath.slice(0, index);
    const parent = this.getOrCreateGroup(groupPath, options);
    let groupNode = this.getOrCreateSub(parent, menuId, options);
    if (!groupNode) {
      groupNode = this.generalItemFactory({ id: menuId, ...options }, parent.path);
      return parent.addNode(groupNode);
    }
    if (options.label) {
      groupNode.label = options.label;
    }
    if (options.icon) {
      groupNode.icon = options.icon;
    }
    if (options.order) {
      groupNode.order = options.order;
    }
    return Disposable.NONE;
  }

  /**
   * Unregister all menu nodes with the same id as the given menu action.
   *
   * @param item the item whose id will be used.
   * @param menuPath if specified only nodes within the path will be unregistered.
   */
  unregisterMenuAction(item: ActionMenuNode, menuPath?: MenuPath): void;
  /**
   * Unregister all menu nodes with the given id.
   *
   * @param id the id which shall be removed.
   * @param menuPath if specified only nodes within the path will be unregistered.
   */
  // eslint-disable-next-line @typescript-eslint/unified-signatures
  unregisterMenuAction(id: string, menuPath?: MenuPath): void;
  unregisterMenuAction(
    itemOrCommandOrId: ActionMenuNode | string,
    menuPath?: MenuPath,
  ): void {
    const id = MenuNode.is(itemOrCommandOrId)
      ? itemOrCommandOrId.id
      : itemOrCommandOrId;

    if (menuPath) {
      const parent = this.getOrCreateGroup(menuPath);
      parent.removeNode(id);
      return;
    }

    this.unregisterMenuNode(id);
  }

  /**
   * Recurse all menus, removing any menus matching the `id`.
   *
   * @param id technical identifier of the `MenuNode`.
   */
  unregisterMenuNode(id: string): void {
    const recurse = (root: GeneralMenuItem) => {
      root.children.forEach((node) => {
        if (MenuItem.isGeneralMenuItem(node)) {
          node.removeNode(id);
          recurse(node);
        }
      });
    };
    recurse(this.root);
  }

  protected getOrCreateGroup(
    menuPath: MenuPath,
    options?: MenuOptions,
  ): GeneralMenuItem {
    let currentMenu = this.root;
    for (const segment of menuPath) {
      currentMenu = this.getOrCreateSub(currentMenu, segment, options);
    }
    return currentMenu;
  }

  protected getOrCreateSub(
    current: GeneralMenuItem,
    menuId: string,
    options: MenuOptions = {},
  ): GeneralMenuItem {
    const sub = current.children.find((e) => e.id === menuId);
    if (MenuItem.isGeneralMenuItem(sub)) {
      return sub;
    }
    if (sub) {
      throw new Error(`'${menuId}' is not a menu group.`);
    }
    const newSub = this.generalItemFactory({ id: menuId, ...options }, current.path);
    current.addNode(newSub);
    return newSub;
  }

  /**
   * Returns the menu at the given path.
   *
   * @param menuPath the path specifying the menu to return. If not given the empty path will be used.
   *
   * @returns the root menu when `menuPath` is empty. If `menuPath` is not empty the specified menu is
   * returned if it exists, otherwise an error is thrown.
   */
  getMenu(menuPath: MenuPath = []): GeneralMenuItem {
    return this.getOrCreateGroup(menuPath);
  }

  isVisible(item: MenuItem, ...args: any[]): boolean {
    if (ExecutableMenuNode.is(item)) {
      if (item.isVisible) {
        return item.isVisible(...args);
      }
    }
    if (CommandMenuNode.is(item)) {
      return this.commands.isVisible(item.command, ...args);
    }
    return true;
  }

  isEnabled(item: MenuItem, ...args: any[]): boolean {
    if (ExecutableMenuNode.is(item)) {
      if (item.isEnabled) {
        return item.isEnabled(...args);
      }
    }
    if (CommandMenuNode.is(item)) {
      return this.commands.isVisible(item.command, ...args);
    }
    return true;
  }

  execute(item: MenuItem, ...args: any[]): MaybePromise<void> {
    if (ExecutableMenuNode.is(item)) {
      return item.execute(...args);
    }
    if (CommandMenuNode.is(item)) {
      return this.commands.executeCommand(item.command, ...args);
    }
  }
}
