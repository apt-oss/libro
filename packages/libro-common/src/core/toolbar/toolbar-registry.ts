import { Emitter } from '../../common/index.js';
import type { Contribution } from '../../ioc/index.js';
import { contrib, inject, singleton, Syringe } from '../../ioc/index.js';
import { prop } from '../../observable/index.js';
import { ApplicationContribution } from '../application/index.js';

import type { ToolbarNode } from './toolbar-protocol.js';
import { ToolbarItem, ToolbarItemFactory } from './toolbar-protocol.js';
/**
 * Clients should implement this interface if they want to contribute to the toolbar.
 */
export const ToolbarContribution = Syringe.defineToken('ToolbarContribution');

export type ToolbarContribution = {
  /**
   * Registers toolbar items.
   * @param registry the toolbar registry.
   */
  registerToolbarItems: (registry: ToolbarRegistry) => void;
};

/**
 * Main, shared registry for tab-bar toolbar items.
 */
@singleton({ contrib: ApplicationContribution })
export class ToolbarRegistry implements ApplicationContribution {
  @prop()
  items: Map<string, ToolbarItem> = new Map();

  protected readonly toolbarItemFactory: ToolbarItemFactory;
  protected readonly contributionProvider: Contribution.Provider<ToolbarContribution>;

  constructor(
    @inject(ToolbarItemFactory)
    toolbarItemFactory: ToolbarItemFactory,
    @contrib(ToolbarContribution)
    contributionProvider: Contribution.Provider<ToolbarContribution>,
  ) {
    this.toolbarItemFactory = toolbarItemFactory;
    this.contributionProvider = contributionProvider;
  }

  protected readonly onDidChangeEmitter = new Emitter<void>();

  onStart(): void {
    const contributions = this.contributionProvider.getContributions();
    for (const contribution of contributions) {
      contribution.registerToolbarItems(this);
    }
  }

  /**
   * Registers the given item. Throws an error, if the corresponding command cannot be found or an item has been already registered for the desired command.
   *
   * @param item the item to register.
   */
  registerItem(def: ToolbarNode): ToolbarItem {
    const { id } = def;
    if (this.items.has(id)) {
      throw new Error(`A toolbar item is already registered with the '${id}' ID.`);
    }
    const item = ToolbarItem.is(def) ? def : this.toolbarItemFactory(def);
    this.items.set(id, item);
    item.onDisposed(() => this.items.delete(id));
    return item;
  }

  getToolbarItem(id: string): ToolbarItem | undefined {
    return this.items.get(id);
  }

  unregisterItem(itemOrId: ToolbarNode | string): void {
    const id = typeof itemOrId === 'string' ? itemOrId : itemOrId.id;
    this.items.delete(id);
  }
}
