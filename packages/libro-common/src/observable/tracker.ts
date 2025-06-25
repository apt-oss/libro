/* eslint-disable @typescript-eslint/no-explicit-any */
import { getPropertyDescriptor, isPlainObject } from '../common/index.js';

import { ObservableSymbol } from './core.js';
import { Notifiable } from './notifiable.js';
import { Notifier } from './notifier.js';
import { observable } from './observable.js';
import { Observability } from './utils.js';

type Act = (...args: any) => void;

export function tryInvokeGetter(getter: () => any, proxy: any, origin: any) {
  try {
    return getter.call(proxy);
  } catch (e: any) {
    if (e instanceof TypeError && e.message.includes('Illegal invocation')) {
      return getter.call(origin);
    }
    throw e;
  }
}

export type Trackable = {
  [ObservableSymbol.Tracker]: Record<string, any>;
  [Trackable.activator]?: (() => void) | undefined;
};

export namespace Trackable {
  export const activator = Symbol('activator');

  export function is(target: any): target is Trackable {
    return (
      Observability.canBeObservable(target) && (target as any)[ObservableSymbol.Tracker]
    );
  }
  export function getOrigin(target: Trackable): any {
    return target[ObservableSymbol.Tracker];
  }
  export function tryGetOrigin(target: any): any {
    if (!is(target)) {
      return target;
    }
    return getOrigin(target);
  }
}
export namespace Tracker {
  export function set<T extends Record<any, any> = any>(target: T, act: Act, proxy: T) {
    Reflect.defineMetadata(act, proxy, target, ObservableSymbol.Tracker);
  }
  export function get<T extends Record<any, any> = any>(
    target: T,
    act: Act,
  ): (T & Trackable) | undefined {
    return Reflect.getMetadata(act, target, ObservableSymbol.Tracker);
  }
  export function has<T extends Record<any, any> = any>(target: T, act: Act) {
    return Reflect.hasOwnMetadata(act, target, ObservableSymbol.Tracker);
  }

  export function tramsform(toTrack: any, act: Act, activator?: () => void) {
    if (toTrack instanceof Array) {
      return transformArray(toTrack, act, activator);
    }
    if (toTrack instanceof Map) {
      return transformMap(toTrack, act, activator);
    }
    if (isPlainObject(toTrack)) {
      return transformPlainObject(toTrack, act, activator);
    }
    return toTrack;
  }
  export function transformArray(toTrack: any[], act: Act, activator?: () => void) {
    return new Proxy(toTrack, {
      get(target: any, property: string | symbol): any {
        const value = target[property];
        if (property === ObservableSymbol.Self) {
          return value;
        }
        if (Object.isFrozen(target)) {
          return value;
        }
        if (property === Trackable.activator) {
          return activator;
        }
        return track(value, act);
      },
    });
  }

  export function transformPlainObject(toTrack: any, act: Act, activator?: () => void) {
    return new Proxy(toTrack, {
      get(target: any, property: string | symbol): any {
        const value = target[property];
        if (property === ObservableSymbol.Self) {
          return value;
        }
        if (Object.isFrozen(target)) {
          return value;
        }
        if (property === Trackable.activator) {
          return activator;
        }
        return track(value, act);
      },
    });
  }

  export function transformMap(
    toTrack: Map<any, any>,
    act: Act,
    activator?: () => void,
  ) {
    return new Proxy(toTrack, {
      get(target: any, property: string | symbol): any {
        const value = target[property];
        if (property === ObservableSymbol.Self) {
          return value;
        }
        if (Object.isFrozen(target)) {
          return value;
        }
        if (property === Trackable.activator) {
          return activator;
        }
        if (property === 'get' && typeof value === 'function') {
          return function (...args: any[]) {
            const innerValue = value.apply(target, args);
            return track(innerValue, act);
          };
        }
        return value;
      },
    });
  }

  export function toInstanceTracker<T extends Record<any, any>>(origin: T, act: Act) {
    // try make observable
    if (!Observability.marked(origin)) {
      observable(origin);
    }

    const proxy = new Proxy(origin, {
      get(target: any, property: string | symbol): any {
        if (property === ObservableSymbol.Tracker) {
          return target;
        }
        if (property === ObservableSymbol.Self) {
          return target;
        }
        let notifier;
        let value;
        if (typeof property === 'string') {
          if (Observability.shouldKeepOrigin(target, property)) {
            return target[property];
          }
          const descriptor = getPropertyDescriptor(target, property);
          if (descriptor?.configurable === false && descriptor?.writable === false) {
            // non-configurable and non-writable property should return the actual value
            return target[property];
          }
          if (Observability.marked(target, property)) {
            notifier = Notifier.getOrCreate(target, property);
            Notifier.once(notifier, act, () => {
              act({
                key: property as keyof T,
                value: target[property],
              });
            });
            value = target[property];
            return track(value, act, true);
          }
          if (descriptor?.get) {
            return tryInvokeGetter(descriptor.get, proxy, target);
          }
        }
        value = target[property];
        return track(value, act, true);
      },
    });
    set(origin, act, proxy);
    return proxy;
  }
  export function toNotifiableTracker<T extends Record<any, any>>(
    origin: T,
    act: Act,
    asProperty: boolean,
  ) {
    let maybeNotifiable: T = Notifiable.get(origin);
    if (!maybeNotifiable) {
      maybeNotifiable = Notifiable.transform(origin);
    }
    // set reactable listener

    let activator;
    if (!asProperty && Notifiable.is(maybeNotifiable)) {
      const notifier = Notifiable.getNotifier(maybeNotifiable);
      activator = () => {
        Notifier.once(notifier, act, () => {
          act(origin);
        });
      };
      activator();
    }
    const proxy = tramsform(maybeNotifiable, act, activator);
    set(origin, act, proxy);
    return proxy;
  }

  export function track<T extends Record<any, any>>(
    object: T,
    act: Act,
    asProperty = false,
  ): T {
    if (!Observability.canBeObservable(object)) {
      return object;
    }
    // get origin
    let origin = object;
    if (Trackable.is(object)) {
      origin = Trackable.getOrigin(object);
    }
    origin = Observability.getOrigin(origin);
    // already has tracker
    let exist: (T & Trackable) | undefined = undefined;
    if (has(origin, act)) {
      exist = get(origin, act);
      if (exist) {
        if (exist[Trackable.activator]) {
          exist[Trackable.activator]();
        }
        return exist;
      }
    }
    if (Notifiable.canBeNotifiable(origin)) {
      return toNotifiableTracker(origin, act, asProperty);
    } else {
      return toInstanceTracker(origin, act);
    }
  }
}
