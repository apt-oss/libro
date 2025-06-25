import assert from 'assert';

import type { Disposable } from './index.js';
import { noop } from './index.js';
import { Deferred } from './index.js';
import { Emitter, Event } from './index.js';

describe('event', () => {
  describe('Event', () => {
    it('#event map transformer', (done) => {
      const emitterNumber = new Emitter<number>();
      const eventString = Event.map(emitterNumber.event, (e) => e.toString());
      eventString((e) => {
        assert(typeof e === 'string');
        done();
      });
      emitterNumber.fire(1);
    });
  });

  it('#event basic', (done) => {
    let test = false;
    const emitter = new Emitter<void>();
    emitter.event(() => {
      test = true;
      assert(test);
      done();
    });
    emitter.fire();
  });

  it('#listener dispose', (done) => {
    let test = true;
    const emitter = new Emitter<void>();
    const disposable = emitter.event(() => {
      test = false;
    });
    emitter.event(() => {
      assert(test);
      done();
    });
    disposable.dispose();
    disposable.dispose();
    emitter.fire();
  });

  it('#emitter dispose', async () => {
    let test = true;
    const emitter = new Emitter<void>();
    emitter.event(() => {
      test = false;
    });
    emitter.event(() => {
      test = false;
    });
    emitter.dispose();
    emitter.fire();
    const doneDeferred = new Deferred<void>();
    setTimeout(() => {
      assert(test);
      doneDeferred.resolve();
    }, 100);
    await doneDeferred.promise;
  });

  it('#emitter option', async () => {
    let firstListenerAdded = false;
    let lastListenerRemoved = false;
    const emitter = new Emitter<void>({
      onFirstListenerAdd: () => {
        firstListenerAdded = true;
      },
      onLastListenerRemove: () => {
        lastListenerRemoved = true;
      },
    });
    const disposable = emitter.event(noop);
    disposable.dispose();
    const doneDeferred = new Deferred<void>();
    setTimeout(() => {
      assert(firstListenerAdded);
      assert(lastListenerRemoved);
      doneDeferred.resolve();
    }, 50);
    await doneDeferred.promise;
  });

  it('#event option', async () => {
    let test = true;
    const context = {};
    const disposables: Disposable[] = [];
    const emitter = new Emitter<void>();
    disposables.push(emitter.event(() => (test = true), context));
    disposables.push(emitter.event(() => (test = true), context));
    disposables.forEach((toDispose) => toDispose.dispose());
    const doneDeferred = new Deferred<void>();
    setTimeout(() => {
      assert(test);
      doneDeferred.resolve();
    }, 50);
    await doneDeferred.promise;
  });

  it('#emitter sequence listeners', async () => {
    const emitter = new Emitter<void>();
    emitter.event(() => true);
    let sequenceTimes1 = 0;
    await emitter.sequence((listener) => {
      sequenceTimes1 += 1;
      return !!listener();
    });
    assert(sequenceTimes1 === 1); // all listener
    sequenceTimes1 = 0;
    emitter.event(() => true);
    emitter.event(() => false);
    emitter.event(() => true);
    await emitter.sequence((listener) => {
      sequenceTimes1 += 1;
      return !!listener();
    });
    assert(sequenceTimes1 === 3); // stop at index 2
  });

  it('#emitter dispose without callbacks', () => {
    const emitter = new Emitter<void>();
    const disposable = emitter.event(() => true);
    try {
      (emitter as any)._callbacks._callbacks = undefined;
      disposable.dispose();
      assert(true);
    } catch (ex) {
      assert(false);
    }
  });

  it('#listener add remove with error context', () => {
    const emitter = new Emitter<void>();
    const disposable = emitter.event(() => true, {});
    try {
      (emitter as any)._callbacks._contexts = [{}];
      disposable.dispose();
    } catch (ex: any) {
      assert(
        ex.message ===
          'When adding a listener with a context, you should remove it with the same context',
      );
    }
  });

  it('#emitter sequence listeners without callbacks', async () => {
    const emitter = new Emitter<void>();
    emitter.event(() => true);
    let sequenceTimes1 = 0;
    (emitter as any)._callbacks._callbacks = undefined;
    await emitter.sequence((listener) => {
      sequenceTimes1 += 1;
      return !!listener();
    });
    assert(sequenceTimes1 === 0); // all listener
  });

  it('#error listener', (done) => {
    console.error = noop;
    let times = 0;
    const emitter = new Emitter<void>();
    emitter.event(() => {
      times += 1;
      throw new Error('error listener');
    });
    emitter.event(() => {
      times += 1;
    });
    try {
      emitter.fire();
      assert(times === 2); // all listener

      done();
    } catch (e) {
      //
    }
  });
});
