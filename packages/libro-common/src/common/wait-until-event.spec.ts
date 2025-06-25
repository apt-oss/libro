import assert from 'assert';

import { WaitUntilEvent } from './index.js';
import { Emitter } from './index.js';
import { Deferred } from './index.js';

describe('wait until event', () => {
  it('#wait until', async () => {
    let did = false;
    const deferred = new Deferred<void>();
    const emitter = new Emitter<WaitUntilEvent>();
    emitter.event((e) => {
      if (e.waitUntil) {
        e.waitUntil(deferred.promise);
      }
      setTimeout(() => {
        deferred.resolve();
        did = true;
      }, 100);
    });
    await WaitUntilEvent.fire(emitter, {}, 50);
    assert(!did);
  });
  it('#wait until without waitable', async () => {
    let did = false;
    const emitter = new Emitter<WaitUntilEvent>();
    emitter.event(() => {
      did = true;
    });
    await WaitUntilEvent.fire(emitter, {}, 50);
    assert(did);
  });
  it('#wait until without timeout', async () => {
    let did = false;
    const deferred = new Deferred<void>();
    const emitter = new Emitter<WaitUntilEvent>();
    emitter.event((e) => {
      if (e.waitUntil) {
        e.waitUntil(deferred.promise);
      }
      setTimeout(() => {
        deferred.resolve();
        did = true;
      }, 100);
    });
    await WaitUntilEvent.fire(emitter, {});
    assert(did);
  });
});
it('#wait until can not called asynchronously', async () => {
  const deferred = new Deferred<void>();
  const emitter = new Emitter<WaitUntilEvent>();
  emitter.event((e) => {
    const { waitUntil } = e;
    if (waitUntil) {
      waitUntil(deferred.promise);
    }
    setTimeout(() => {
      try {
        if (waitUntil) {
          waitUntil(deferred.promise);
        }
      } catch (ex) {
        assert(ex);
      }
      deferred.resolve();
    }, 100);
  });
  WaitUntilEvent.fire(emitter, {});
});
