import { noop } from './utils.js';

export type Disposable = {
  disposed?: boolean | undefined;
  /**
   * Dispose this object.
   */
  dispose: () => void;
};
export namespace Disposable {
  export function is(arg: any): arg is Disposable {
    return (
      !!arg &&
      typeof arg === 'object' &&
      'dispose' in arg &&
      typeof arg.dispose === 'function'
    );
  }
  export function create(func: () => void): Disposable {
    return {
      dispose: func,
    };
  }

  export const NONE = create(noop);
}

export interface Disposed {
  disposed: boolean;
}

export namespace Disposed {
  export function is(arg: any): arg is Disposed {
    return (
      !!arg &&
      typeof arg === 'object' &&
      'disposed' in arg &&
      typeof arg.disposed === 'boolean'
    );
  }
}
