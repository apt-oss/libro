import type { URI } from '../../common/index.js';

import { BaseView } from './default-view.js';
import type { View } from './view-protocol.js';

/**
 * `Navigatable` provides an access to an URI of an underlying instance of `Resource`.
 */
export interface Navigatable {
  /**
   * Return an underlying resource URI.
   */
  getResourceUri: () => URI | undefined;
  /**
   * Creates a new URI to which this navigatable should moved based on the given target resource URI.
   */
  createMoveToUri: (resourceUri: URI) => URI | undefined;
}

export namespace Navigatable {
  export function is(arg: Record<any, any> | undefined): arg is Navigatable {
    return !!arg && 'getResourceUri' in arg && 'createMoveToUri' in arg;
  }
}

export type NavigatableView = BaseView & Navigatable;
export namespace NavigatableView {
  export function is(arg: Record<any, any> | undefined): arg is NavigatableView {
    return arg instanceof BaseView && Navigatable.is(arg);
  }
  export function getUri(widget?: View): URI | undefined {
    if (is(widget)) {
      return widget.getResourceUri();
    }
    return undefined;
  }
}

export interface NavigatableViewOptions {
  kind: 'navigatable.js';
  uri: string;
  counter?: number;
}
export namespace NavigatableWidgetOptions {
  export function is(arg: Record<any, any> | undefined): arg is NavigatableViewOptions {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return !!arg && 'kind' in arg && (arg as any).kind === 'navigatable.js';
  }
}
