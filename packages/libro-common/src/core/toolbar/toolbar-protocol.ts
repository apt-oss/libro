import type { Event, Disposable } from '../../common/index.js';
import type { CommandHandler } from '../command/index.js';

/**
 * Instance of toolbar
 * Use this token to get the toolbar instance when customizing elements on the toolbar.
 */
export const ToolbarInstance = Symbol('ToolbarInstance');

/**
 * Factory for instantiating toolbars.
 */
export const ToolbarItemFactory = Symbol('ToolbarItemFactory');

export interface ToolbarItemFactory {
  (item: ToolbarNode): ToolbarItem;
}
export const ToolbarNode = Symbol('ToolbarItemDefinition');

type Partial<T> = {
  [P in keyof T]?: T[P] | undefined;
};

export type ToolbarNode = BaseToolbarNode & Partial<CommandHandler>;
export interface BaseToolbarNode {
  /**
   * The unique ID of the toolbar item.
   */
  readonly id: string;

  /**
   * The command to execute.
   */
  readonly command: string;

  /**
   * Priority among the items. Can be negative. The smaller the number the left-most the item will be placed in the toolbar. It is `0` by default.
   */
  //   readonly priority?: number;

  /**
   * show in the `...` dropdown
   */
  readonly extra?: boolean | undefined;

  /**
   * The order to display toolbar item inline or in the `...` dropdown.
   */
  readonly order?: string | undefined;

  /**
   * When extra, group means that the item will be located in a submenu(s) of the `...` dropdown.
   * The submenu's title is named by the name in group, e.g. ['menu', 'submenu'].
   */
  readonly group?: string | string[] | undefined;
  /**
   * Optional label for the item.
   */
  readonly label?: React.ReactNode | React.FC;

  /**
   * Optional tooltip for the item.
   */
  readonly tooltip?: React.ReactNode | React.FC;

  /**
   * Optional icon for the item.
   */
  readonly icon?: React.ReactNode | React.FC;

  /**
   * Show toolbar item label inline.
   */
  readonly showLabelInline?: boolean | undefined;

  /**
   * Custom meta data for the item.
   */
  meta?: Record<string, any> | undefined;
}

export interface ToolbarItem extends ToolbarNode, Disposable {
  source: ToolbarNode;
  onDisposed: Event<void>;
}

export namespace ToolbarItem {
  export function isDefinition(
    arg: Record<string, any> | undefined,
  ): arg is ToolbarNode {
    return (
      !!arg &&
      'id' in arg &&
      'command' in arg &&
      typeof (arg as any).command === 'string'
    );
  }
  export function is(arg: Record<string, any> | undefined): arg is ToolbarItem {
    return isDefinition(arg) && 'onDisposed' in arg;
  }

  export function getGroupKey(record: ToolbarItem): string {
    if (!record.group) {
      return '';
    }
    if (typeof record.group === 'string') {
      return record.group;
    }
    return record.group.join('.');
  }
}
