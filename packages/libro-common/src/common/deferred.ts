import { noop } from './utils.js';

/**
 * Deferred pattern.
 */
export class Deferred<T> {
  public resolve: (value: T | PromiseLike<T>) => void = noop;
  public reject: (err?: any) => void = noop;
  public readonly promise: Promise<T>;

  constructor() {
    this.promise = new Promise<T>((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }
}
