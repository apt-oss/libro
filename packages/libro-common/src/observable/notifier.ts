/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Disposable } from '../common/index.js';
import { Event } from '../common/index.js';

import { AsyncEmitter } from './async-event.js';
import { ObservableConfig } from './config.js';
import type { Notify } from './core.js';
import { ObservableSymbol } from './core.js';
import { Notifiable } from './notifiable.js';
import { Observability } from './utils.js';

export interface Notification<T = any> {
  target: T;
  prop?: any;
}
export class Notifier implements Disposable {
  protected changedEmitter = new AsyncEmitter<Notification>();
  disposed = false;
  get onChange(): Event<any> {
    if (ObservableConfig.async) {
      return this.onChangeAsync;
    }
    return this.onChangeSync;
  }
  get onChangeAsync() {
    return this.changedEmitter.eventAsync;
  }
  get onChangeSync() {
    return this.changedEmitter.event;
  }

  dispose() {
    this.changedEmitter.dispose();
    this.disposed = true;
  }

  once(trigger: Notify, context?: any): Disposable {
    const toDispose = this.onChange((e) => {
      trigger(e.target, e.prop);
      toDispose.dispose();
    }, context);
    return toDispose;
  }

  notify(target: any, prop?: any): void {
    this.changedEmitter.fire({ target, prop });
    if (prop) {
      Notifier.trigger(target);
    }
  }

  static trigger(target: any, prop?: any): void {
    const exist = Notifier.get(target, prop);
    if (exist) {
      exist.notify(target, prop);
    }
  }
  static getOrCreate(target: any, prop?: any): Notifier {
    const notifier = Notifiable.getNotifier(target);
    if (notifier) {
      return notifier;
    }
    const origin = Observability.getOrigin(target);
    const exist = Notifier.get(origin, prop);
    if (exist && !exist.disposed) {
      return exist;
    }
    const ntf = new Notifier();
    Notifier.set(origin, ntf, prop);
    return ntf;
  }
  static find(target: any, prop?: any): Notifier | undefined {
    if (Observability.marked(target, prop) || Observability.canBeObservable(target)) {
      return Notifier.getOrCreate(target, prop);
    }
    return undefined;
  }
  static get(target: any, property?: any): Notifier | undefined {
    if (property === undefined) {
      return Reflect.getMetadata(ObservableSymbol.Notifier, target);
    } else {
      return Reflect.getMetadata(ObservableSymbol.Notifier, target, property);
    }
  }

  static set(target: any, notifier: Notifier, property?: any): void {
    if (property === undefined) {
      Reflect.defineMetadata(ObservableSymbol.Notifier, notifier, target);
    } else {
      Reflect.defineMetadata(ObservableSymbol.Notifier, notifier, target, property);
    }
  }

  static once(notifier: Notifier, key: any, onChange: () => void) {
    const toDispose = Observability.getDisposable(key, notifier);
    if (toDispose) {
      toDispose.dispose();
    }
    const disposable = notifier.once(() => {
      onChange();
    });
    Observability.setDisposable(key, disposable, notifier);
  }

  /**
   * Get event from target
   * @param target
   * @param prop
   * @param async false by default
   * @returns
   */
  static toEvent(target: any, prop?: any, async: boolean | null = false) {
    const notifier = Notifier.find(target, prop);
    if (notifier) {
      if (async === null) {
        return notifier.onChange;
      }
      if (async) {
        return notifier.onChangeAsync;
      } else {
        return notifier.onChangeSync;
      }
    }
    return Event.None;
  }
}
