import type { Emitter } from './event.js';

export type WaitUntilEvent = {
  /**
   * Allows to pause the event loop until the provided thenable resolved.
   * *Note:* It can only be called during event dispatch and not in an asynchronous manner
   * @param thenable A thenable that delays execution.
   */
  waitUntil?: (thenable: Promise<any>) => void;
};
export namespace WaitUntilEvent {
  /**
   * Fire all listeners in the same tick.
   * Use `AsyncEmitter.fire` to fire listeners async one after another.
   */
  export async function fire<T extends WaitUntilEvent>(
    emitter: Emitter<T>,
    event: Omit<T, 'waitUntil'>,
    timeout: number | undefined = undefined,
  ): Promise<void> {
    const waitables: Promise<void>[] = [];
    const asyncEvent = Object.assign(event, {
      waitUntil: (thenable: Promise<any>) => {
        if (Object.isFrozen(waitables)) {
          throw new Error('waitUntil cannot be called asynchronously.');
        }
        waitables.push(thenable);
      },
    }) as T;
    try {
      emitter.fire(asyncEvent);
      // Asynchronous calls to `waitUntil` should fail.
      Object.freeze(waitables);
    } finally {
      delete asyncEvent.waitUntil;
    }
    if (!waitables.length) {
      return;
    }
    if (timeout !== undefined) {
      await Promise.race([
        Promise.all(waitables),
        new Promise((resolve) => setTimeout(resolve, timeout)),
      ]);
    } else {
      await Promise.all(waitables);
    }
  }
}
