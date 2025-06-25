import { Disposable } from './disposable.js';
import { LinkedList } from './linkedList.js';
import type { MaybePromise } from './types.js';
import { noop } from './utils.js';

/**
 * Represents a typed event.
 */
export type Event<T> = {
  /**
   *
   * @param listener The listener function will be call when the event happens.
   * @param context The 'this' which will be used when calling the event listener.
   * @return a disposable to remove the listener again.
   */
  (listener: (e: T) => any, context?: any): Disposable;
};

export namespace Event {
  export const None: Event<void> = () => Disposable.NONE;

  /**
   * Given an event and a `map` function, returns another event which maps each element
   * through the mapping function.
   */
  export function map<I, O>(event: Event<I>, mapFunc: (i: I) => O): Event<O> {
    return (listener: (e: O) => any, context?: any) =>
      event((i) => listener.call(context, mapFunc(i)), undefined);
  }
}

type Callback = (...args: any[]) => any;
export class CallbackList implements Iterable<Callback> {
  protected _callbacks: [Callback, any][] | undefined;

  get length(): number {
    return (this._callbacks && this._callbacks.length) || 0;
  }

  public add(callback: Callback, context: any = undefined): void {
    if (!this._callbacks) {
      this._callbacks = [];
    }
    this._callbacks.push([callback, context]);
  }

  public remove(callback: Callback, context: any = undefined): void {
    if (!this._callbacks) {
      return;
    }

    let foundCallbackWithDifferentContext = false;
    for (let i = 0; i < this._callbacks.length; i += 1) {
      if (this._callbacks[i][0] === callback) {
        if (this._callbacks[i][1] === context) {
          // remove when callback & context match
          this._callbacks.splice(i, 1);
          return;
        }
        foundCallbackWithDifferentContext = true;
      }
    }

    if (foundCallbackWithDifferentContext) {
      throw new Error('You should remove it with the same context you add it');
    }
  }

  // tslint:disable-next-line:typedef
  public [Symbol.iterator]() {
    if (!this._callbacks) {
      return [][Symbol.iterator]();
    }
    const callbacks = this._callbacks.slice(0);

    return callbacks
      .map(
        (callback) =>
          (...args: any[]) =>
            callback[0].apply(callback[1], args),
      )
      [Symbol.iterator]();
  }

  public invoke(...args: any[]): any[] {
    const ret: any[] = [];
    for (const callback of this) {
      try {
        ret.push(callback(...args));
      } catch (e) {
        console.error(e);
      }
    }
    return ret;
  }

  public isEmpty(): boolean {
    return !this._callbacks || this._callbacks.length === 0;
  }

  public dispose(): void {
    this._callbacks = undefined;
  }
}

export type EmitterOptions = {
  onFirstListenerAdd?: (ctx: any) => void;
  onLastListenerRemove?: (ctx: any) => void;
};

export class Emitter<T = any> {
  protected _event?: Event<T>;
  protected _callbacks: CallbackList | undefined;
  protected _disposed = false;
  protected _options?: EmitterOptions | undefined;

  constructor(_options?: EmitterOptions) {
    this._options = _options;
  }

  /**
   * For the public to allow to subscribe
   * to events from this Emitter
   */
  get event(): Event<T> {
    if (!this._event) {
      this._event = (
        listener: (e: T) => any,
        thisArgs?: any,
        disposables?: Disposable[],
      ) => {
        if (!this._callbacks) {
          this._callbacks = new CallbackList();
        }
        if (
          this._options &&
          this._options.onFirstListenerAdd &&
          this._callbacks.isEmpty()
        ) {
          this._options.onFirstListenerAdd(this);
        }
        this._callbacks.add(listener, thisArgs);

        const result: Disposable = {
          dispose: () => {
            result.dispose = noop;
            if (!this._disposed) {
              this._callbacks!.remove(listener, thisArgs);
              result.dispose = noop;
              if (
                this._options &&
                this._options.onLastListenerRemove &&
                this._callbacks!.isEmpty()
              ) {
                this._options.onLastListenerRemove(this);
              }
            }
          },
        };
        if (Array.isArray(disposables)) {
          disposables.push(result);
        }

        return result;
      };
    }
    return this._event;
  }

  /**
   * To be kept protected to fire an event to
   * subscribers
   */
  fire(event: T): any {
    if (this._callbacks) {
      this._callbacks.invoke(event);
    }
  }

  /**
   * Process each listener one by one.
   * Return `false` to stop iterating over the listeners, `true` to continue.
   */
  async sequence(
    processor: (listener: (e: T) => any) => MaybePromise<boolean>,
  ): Promise<void> {
    if (this._callbacks) {
      for (const listener of this._callbacks) {
        // eslint-disable-next-line no-await-in-loop
        const result = await processor(listener);
        if (!result) {
          break;
        }
      }
    }
  }

  dispose(): void {
    if (this._callbacks) {
      this._callbacks.dispose();
      this._callbacks = undefined;
    }
    this._disposed = true;
  }
}

export class PauseableEmitter<T> extends Emitter<T> {
  protected _isPaused = 0;
  protected _eventQueue = new LinkedList<T>();
  protected _mergeFn: undefined | ((input: T[]) => T);
  protected _listeners: any;

  constructor(options?: EmitterOptions & { merge?: (input: T[]) => T }) {
    super(options);
    this._mergeFn = options?.merge;
  }

  pause(): void {
    this._isPaused++;
  }

  resume(): void {
    if (this._isPaused !== 0 && --this._isPaused === 0) {
      if (this._mergeFn) {
        // use the merge function to create a single composite
        // event. make a copy in case firing pauses this emitter
        const events = Array.from(this._eventQueue);
        this._eventQueue.clear();
        super.fire(this._mergeFn(events));
      } else {
        // no merging, fire each event individually and test
        // that this emitter isn't paused halfway through
        while (!this._isPaused && this._eventQueue.size !== 0) {
          super.fire(this._eventQueue.shift()!);
        }
      }
    }
  }

  override fire(event: T): void {
    if (this._listeners) {
      if (this._isPaused !== 0) {
        this._eventQueue.push(event);
      } else {
        super.fire(event);
      }
    }
  }
}
