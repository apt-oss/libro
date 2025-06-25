import assert from 'assert';

import {
  CancellationToken,
  CancellationTokenSource,
  cancelled,
  checkCancelled,
  isCancelled,
} from './index.js';
import { Deferred } from './index.js';

describe('cancellation', () => {
  const waitTime = (number = 100) => {
    const waitDeferred = new Deferred<void>();
    setTimeout(() => {
      waitDeferred.resolve();
    }, number);
    return waitDeferred.promise;
  };
  it('#cancel', (done) => {
    let cancel = false;
    const source = new CancellationTokenSource();
    source.token.onCancellationRequested(() => {
      cancel = true;
    });
    const waitDeferred = new Deferred<void>();
    const wait = async (
      cb: () => Promise<void>,
      token: CancellationToken,
    ): Promise<boolean> => {
      await cb();
      if (token.isCancellationRequested) {
        return false;
      }
      return true;
    };
    const result = wait(() => {
      setTimeout(() => {
        waitDeferred.resolve();
      }, 100);
      return waitDeferred.promise;
    }, source.token);
    setTimeout(() => {
      source.cancel();
    }, 10);
    setTimeout(() => {
      assert(result);
      assert(cancel);
      done();
    }, 200);
  });

  it('#cancel return after done', async () => {
    let did = false;
    const source = new CancellationTokenSource();
    const wait = async (
      cb: () => Promise<void>,
      token: CancellationToken,
    ): Promise<boolean> => {
      await cb();
      if (token.isCancellationRequested) {
        return false;
      }
      return true;
    };
    wait(async () => {
      await waitTime();
      did = true;
    }, source.token)
      .then((result) => {
        assert(!result);
        assert(did);
        return result;
      })
      .catch(() => {
        assert(false);
      });
    source.cancel();
  });

  it('#cancel return when cancel', async () => {
    let did = false;
    const source = new CancellationTokenSource();
    const wait = async (
      cb: () => Promise<void>,
      token: CancellationToken,
    ): Promise<boolean> => {
      const waitDeferred = new Deferred<boolean>();
      token.onCancellationRequested(() => {
        waitDeferred.resolve(false);
      });
      cb()
        .then(() => {
          waitDeferred.resolve(true);
          return true;
        })
        .catch((ex) => {
          console.error(ex);
        });
      return waitDeferred.promise;
    };
    wait(async () => {
      await waitTime();
      did = true;
    }, source.token)
      .then((result) => {
        assert(!result);
        assert(!did);
        return result;
      })
      .catch((ex) => {
        console.error(ex);
      });
    source.cancel();
  });

  it('#CancellationToken Cancelled', () => {
    const source = new CancellationTokenSource();
    source.cancel();
    assert(source.token === CancellationToken.Cancelled);
  });

  it('#Cancellation dispose', () => {
    const source = new CancellationTokenSource();
    source.dispose();
    assert(source.token === CancellationToken.None);
  });

  it('#is cancelled', () => {
    assert(isCancelled(cancelled()));
  });

  it('#check cancelled', () => {
    const source = new CancellationTokenSource();
    source.cancel();
    try {
      checkCancelled(source.token);
    } catch (ex) {
      assert(isCancelled(ex as any));
    }
  });

  it('#short cut', () => {
    const source = new CancellationTokenSource();
    let onRequest = false;
    source.token.onCancellationRequested(() => {
      onRequest = true;
    });
    source.cancel();
    source.cancel();
    let result = true;
    assert(onRequest);
    const disposable = source.token.onCancellationRequested(() => {
      result = false;
    });
    disposable.dispose();
    source.cancel();
    assert(result);
  });
});
