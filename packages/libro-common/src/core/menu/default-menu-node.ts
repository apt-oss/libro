/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Disposable, Event } from '../../common/index.js';
import { Emitter } from '../../common/index.js';
import { inject, transient } from '../../ioc/index.js';
import { getOrigin, prop } from '../../observable/index.js';
import { CommandRegistry } from '../command/command-registry.js';
import { renderNode } from '../view/utils.js';

import { CommandMenuNode, ExecutableMenuNode, MenuSymbol } from './menu-protocol.js';
import type { MenuItem, MenuPath, ActionMenuNode, MenuNode } from './menu-protocol.js';

/**
 * Node representing a (sub)menu in the menu tree structure.
 */
@transient()
export class DefaultActionMenuItem implements MenuNode, Disposable {
  readonly id: string;
  readonly key: string;

  disposed?: boolean | undefined;

  @prop()
  readonly order?: string | undefined;

  /**
   * Optional label for the item.
   */
  label?: React.ReactNode | React.FC;

  /**
   * Optional icon for the item.
   */
  readonly icon?: React.ReactNode | React.FC;

  readonly command?: string;

  execute?: (...args: any[]) => any;

  isEnabled?: ((...args: any[]) => boolean) | undefined;

  isVisible?: ((...args: any[]) => boolean) | undefined;

  isActive?: ((...args: any[]) => boolean) | undefined;

  protected disposedEventEmitter: Emitter<void> = new Emitter();

  protected readonly commands: CommandRegistry;
  protected readonly node: ActionMenuNode;
  protected readonly parentPath: MenuPath;

  onDisposed: Event<void> = this.disposedEventEmitter.event;
  constructor(
    @inject(CommandRegistry) commands: CommandRegistry,
    @inject(MenuSymbol.ActionMenuNodeSymbol) node: ActionMenuNode,
    @inject(MenuSymbol.ParentPathSymbol) parentPath: MenuPath,
  ) {
    this.commands = commands;
    this.node = node;
    this.parentPath = parentPath;
    this.order = node.order;
    this.label = node.label;
    this.icon = node.icon;
    this.id = node.id;
    this.key = parentPath.join('/') + '/' + this.id;
    if (CommandMenuNode.is(node)) {
      this.command = node.command;
      this.execute = this.doCommandExecute;
    }
    if (ExecutableMenuNode.is(node)) {
      this.execute = node.execute;
      this.isEnabled = node.isEnabled;
      this.isVisible = node.isVisible;
      this.isActive = node.isActive;
    }
  }

  protected doCommandExecute = (...args: any[]): any => {
    if (this.command) {
      return this.commands.executeCommand(this.command, ...args);
    }
  };

  dispose() {
    this.disposedEventEmitter.fire();
    this.disposed = true;
  }

  renderTitle = () => {
    let label = this.label;
    if (!label && this.command) {
      label = this.commands.getCommand(this.command)?.label;
    }
    return renderNode(label);
  };
  renderIcon = () => {
    let icon = this.icon;
    if (!icon && this.command) {
      icon = this.commands.getCommand(this.command)?.icon;
    }
    return renderNode(icon);
  };
}

/**
 * Node representing a (sub)menu in the menu tree structure.
 */
@transient()
export class DefaultGeneralMenuItem implements MenuNode, Disposable {
  readonly id: string;
  readonly key: string;
  readonly path: MenuPath;

  get isSubmenu(): boolean {
    return !!this.label;
  }

  @prop()
  readonly children: (MenuItem | DefaultActionMenuItem)[] = [];

  disposed?: boolean | undefined;

  @prop()
  order?: string | undefined;

  /**
   * Optional label for the item.
   */
  @prop()
  label?: React.ReactNode | React.FC;

  /**
   * Optional icon for the item.
   */
  @prop()
  icon?: React.ReactNode | React.FC;

  execute?: (...args: any[]) => any;

  isEnabled?: (...args: any[]) => boolean;

  isVisible?: (...args: any[]) => boolean;

  protected disposedEventEmitter: Emitter<void> = new Emitter();

  protected readonly commands: CommandRegistry;
  protected readonly node: MenuNode;
  protected readonly parentPath: MenuPath;

  onDisposed: Event<void> = this.disposedEventEmitter.event;
  constructor(
    @inject(CommandRegistry) commands: CommandRegistry,
    @inject(MenuSymbol.MenuNodeSymbol) node: MenuNode,
    @inject(MenuSymbol.ParentPathSymbol) parentPath: MenuPath,
  ) {
    this.commands = commands;
    this.node = node;
    this.parentPath = parentPath;
    this.order = node.order;
    this.label = node.label;
    this.icon = node.icon;
    this.id = node.id;
    this.key = parentPath.join('/') + '/' + this.id;
    this.path = [...parentPath, this.id];
  }

  /**
   * Inserts the given node at the position indicated by `sortString`.
   *
   * @returns a disposable which, when called, will remove the given node again.
   */
  public addNode = (item: MenuItem): MenuItem => {
    this.children.push(item);
    const remove = () => {
      const idx = this.children.indexOf(getOrigin(item));
      if (idx >= 0) {
        this.children.splice(idx, 1);
      }
    };
    item.onDisposed(remove);
    return item;
  };

  /**
   * Removes the first node with the given id.
   *
   * @param id node id.
   */
  public removeNode(id: string): void {
    const node = this.children.find((n) => n.id === id);
    if (node) {
      const idx = this.children.indexOf(node);
      if (idx >= 0) {
        this.children.splice(idx, 1);
      }
    }
  }

  dispose() {
    this.disposedEventEmitter.fire();
    this.disposed = true;
  }

  renderTitle = () => {
    return renderNode(this.label);
  };
  renderIcon = () => {
    return renderNode(this.icon);
  };
}
