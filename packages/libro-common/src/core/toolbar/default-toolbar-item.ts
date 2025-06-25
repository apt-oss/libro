import type { Event } from '../../common/index.js';
import { Emitter } from '../../common/index.js';
import { inject } from '../../ioc/index.js';
import { transient } from '../../ioc/index.js';
import { prop } from '../../observable/index.js';

import { ToolbarNode } from './toolbar-protocol.js';
import type { ToolbarItem } from './toolbar-protocol.js';

@transient()
export class DefaultToolbarItem implements ToolbarItem {
  readonly id: string;
  readonly command: string;

  source: ToolbarNode;

  meta?: Record<string, any> | undefined;

  @prop()
  readonly extra?: boolean | undefined;

  @prop()
  readonly showLabelInline?: boolean | undefined;

  @prop()
  readonly order?: string | undefined;

  @prop()
  readonly group?: string | string[] | undefined;

  protected disposedEventEmitter: Emitter<void> = new Emitter();

  onDisposed: Event<void> = this.disposedEventEmitter.event;

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

  readonly execute?: ((...args: any[]) => any) | undefined;
  readonly isEnabled?: ((...args: any[]) => boolean) | undefined;
  readonly isVisible?: ((...args: any[]) => boolean) | undefined;
  readonly isActive?: ((...args: any[]) => boolean) | undefined;

  item: ToolbarNode;

  constructor(@inject(ToolbarNode) item: ToolbarNode) {
    this.item = item;
    this.source = item;
    this.id = item.id;
    this.command = item.command;
    this.extra = item.extra;
    this.order = item.order;
    this.label = item.label;
    this.tooltip = item.tooltip;
    this.icon = item.icon;
    this.meta = item.meta;
    this.group = item.group;
    this.showLabelInline = item.showLabelInline;
    this.isActive = item.isActive;
    this.isEnabled = item.isEnabled;
    this.isVisible = item.isVisible;
    this.execute = item.execute;
  }
  disposed?: boolean | undefined;

  dispose() {
    this.disposedEventEmitter.fire();
  }
}
