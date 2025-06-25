import assert from 'assert';

import { ObservableConfig, Observability } from './index.js';

describe('ObservableConfig', () => {
  it('#exclude', () => {
    const obj = {};
    assert(Observability.canBeObservable(obj));
    ObservableConfig.exclude((o) => o === obj);
    assert(!Observability.canBeObservable(obj));
  });
});
