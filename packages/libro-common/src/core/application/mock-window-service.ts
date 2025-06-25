import { Event } from '../../common/index.js';
import { singleton } from '../../ioc/index.js';

import type { WindowService } from './application-protocol.js';

@singleton()
export class MockWindowService implements WindowService {
  openNewWindow(): undefined {
    return undefined;
  }
  canUnload(): boolean {
    return true;
  }
  get onUnload(): Event<void> {
    return Event.None;
  }
}
