import assert from 'assert';

import { noop } from '../common/index.js';

import { AsyncEmitter, AsyncCallbackList } from './async-event.js';

describe('AsyncEvent', () => {
  it('#callback list', (done) => {
    try {
      const list = new AsyncCallbackList();
      list.invoke();
      done();
    } catch (e) {
      done(e);
    }
  });

  it('#event basic', (done) => {
    let test = false;
    let asyncTest = false;
    const emitter = new AsyncEmitter<void>();
    emitter.event(() => {
      test = true;
    });
    emitter.eventAsync(() => {
      asyncTest = true;
    });
    emitter.fire();
    Promise.resolve()
      .then(() => {
        assert(test);
        assert(asyncTest);
        done();
        return;
      })
      .catch((e) => done(e));
  });
  it('#event hooks', () => {
    let added = false;
    const emitter = new AsyncEmitter<void>({
      onFirstListenerAdd: () => {
        added = true;
      },
      onLastListenerRemove: () => {
        added = false;
      },
    });
    const toDispose = emitter.eventAsync(noop);
    assert(added);
    toDispose.dispose();
    assert(!added);
  });

  it('#event dispose', () => {
    let test = false;
    const emitter = new AsyncEmitter<void>();
    emitter.eventAsync(() => {
      test = true;
    });
    emitter.dispose();
    emitter.fire();
    assert(!test);
  });
});
