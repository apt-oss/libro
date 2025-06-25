import assert from 'assert';

import { Deferred, Disposable, noop } from './index.js';
import { DisposableCollection } from './index.js';

describe('disposable', () => {
  it('#Disposable is', () => {
    assert(Disposable.is({ dispose: noop }));
  });
  it('#Disposable create', () => {
    let disposed = false;
    const disposable = Disposable.create(() => {
      disposed = true;
    });
    disposable.dispose();
    assert(disposed);
  });

  it('#Disposable collection', async () => {
    let disposeTimes = 0;
    let disposed = false;
    const collection = new DisposableCollection(
      Disposable.create(() => {
        disposeTimes += 1;
      }),
    );
    collection.push(
      Disposable.create(() => {
        disposeTimes += 1;
      }),
    );
    collection.push(
      Disposable.create(() => {
        disposeTimes += 1;
      }),
      Disposable.create(() => {
        disposeTimes += 1;
      }),
    );

    collection.pushAll([
      Disposable.create(() => {
        disposeTimes += 1;
      }),
      Disposable.create(() => {
        disposeTimes += 1;
      }),
    ]);
    const onDisposeDeferred = new Deferred<void>();
    collection.onDispose(() => {
      disposed = true;
      assert(disposed);
      onDisposeDeferred.resolve();
    });
    collection.dispose();
    await onDisposeDeferred.promise;
    assert(disposeTimes === 6);
  });

  it('#Disposable collection error disposable', () => {
    console.error = noop;
    let disposeTimes = 0;
    try {
      const collection = new DisposableCollection(
        Disposable.create(() => {
          disposeTimes += 1;
          throw new Error('Disposable collection error disposable');
        }),
      );
      collection.dispose();
      collection.dispose();
    } catch (e) {
      // noop
    } finally {
      assert(disposeTimes === 1);
    }
  });

  it('#Disposable collection dispose add', () => {
    let disposed = false;
    const collection = new DisposableCollection();

    const disposable = collection.push(
      Disposable.create(() => {
        disposed = true;
        throw new Error('Disposable collection error disposable');
      }),
    );
    disposable.dispose();
    collection.dispose();
    assert(!disposed);
  });
});
