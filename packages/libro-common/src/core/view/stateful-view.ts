import { BaseView } from './default-view.js';
import type { StatefulView } from './view-protocol.js';

export abstract class BaseStatefulView extends BaseView implements StatefulView {
  constructor() {
    super();
    Promise.resolve()
      .then(() => {
        return this.afterRestore();
      })
      .catch(console.error);
  }
  abstract storeState(): Record<string, any>;
  abstract restoreState(oldState: Record<string, any>): void;

  /**
   * initialize after restore state
   */
  afterRestore() {
    // do something
  }
}
