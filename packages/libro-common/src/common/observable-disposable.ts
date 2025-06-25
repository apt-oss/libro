import type { Disposable } from './disposable.js';
import type { Event } from './event.js';

/**
 * A disposable object with an observable `disposed` signal.
 */
export interface ObservableDisposable extends Disposable {
  /**
   * A signal emitted when the object is disposed.
   */
  readonly onDisposed: Event<void>;
}
