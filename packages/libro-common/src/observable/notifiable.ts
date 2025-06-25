/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable prefer-spread */
import { isPlainObject } from '../common/index.js';

import { ObservableSymbol } from './core.js';
import { Notifier } from './notifier.js';
import { isReadonly, Observability } from './utils.js';

export interface Notifiable {
  [ObservableSymbol.Notifier]: Notifier;
}

export namespace Notifiable {
  export const token = Symbol('Notifiable');
  export function is(target: any): target is Notifiable {
    return Observability.isObject(target) && !!target[ObservableSymbol.Notifier];
  }
  export function getNotifier(target: Notifiable): Notifier {
    return target[ObservableSymbol.Notifier];
  }
  export function tryGetNotifier(target: any): Notifier | undefined {
    if (is(target)) {
      return getNotifier(target);
    }
    return undefined;
  }
  export function set<T extends object>(target: T, value: Notifiable): void {
    Reflect.defineMetadata(token, value, target);
  }

  export function get<T extends object>(target: T): T & Notifiable {
    return Reflect.getMetadata(token, target);
  }
  export function canBeNotifiable(value: any): boolean {
    if (!Observability.isObject(value)) {
      return false;
    }
    if (Object.isFrozen(value)) {
      return false;
    }
    if (value instanceof Array) {
      return true;
    }
    if (value instanceof Map) {
      return true;
    }
    if (isPlainObject(value)) {
      return true;
    }
    return false;
  }
  export function transform<T = any>(target: T): T | (T & Notifiable) {
    if (is(target)) {
      return target;
    }
    if (!Observability.canBeObservable(target)) {
      return target;
    }
    const origin = Observability.getOrigin(target);
    const notifiable = Notifiable.get(origin);
    if (notifiable) {
      return notifiable;
    }
    if (origin instanceof Array) {
      return transformArray(origin);
    }
    if (origin instanceof Map) {
      return transformMap(origin);
    }
    if (isPlainObject(origin)) {
      return transformPlainObject(origin);
    }
    return target;
  }

  export function transformArray<T extends Array<any>>(target: T): T & Notifiable {
    const notifier = Notifier.getOrCreate(target);
    const notifiable = new Proxy(target, {
      get(self: any, property: string | symbol): any {
        if (property === ObservableSymbol.Notifier) {
          return notifier;
        }
        if (property === ObservableSymbol.Self) {
          return self;
        }
        const result = Reflect.get(self, property);
        if (isReadonly(target, property)) {
          return result;
        }
        const origin = Observability.getOrigin(result);
        return Notifiable.transform(origin);
      },
      set(self: any, prop: string | symbol, value: any): any {
        const result = Reflect.set(self, prop, value);
        notifier.notify(value);
        return result;
      },
    });
    set(target, notifiable);
    return notifiable;
  }

  export function transformPlainObject<T extends object>(target: T): T & Notifiable {
    const notifier = Notifier.getOrCreate(target);
    const notifiable = new Proxy(target, {
      get(self: any, property: string | symbol): any {
        if (property === ObservableSymbol.Notifier) {
          return notifier;
        }
        if (property === ObservableSymbol.Self) {
          return self;
        }
        const result = Reflect.get(self, property);
        if (isReadonly(target, property)) {
          return result;
        }
        const origin = Observability.getOrigin(result);
        return Notifiable.transform(origin);
      },
      set(self: any, prop: string | symbol, value: any): any {
        const result = Reflect.set(self, prop, value);
        notifier.notify(value);
        return result;
      },
      deleteProperty(self: any, prop: string | symbol): boolean {
        const result = Reflect.deleteProperty(self, prop);
        notifier.notify(undefined);
        return result;
      },
    });
    set(target, notifiable);
    return notifiable;
  }

  export function transformMap<T extends Map<any, any>>(target: T): T & Notifiable {
    const notifier = Notifier.getOrCreate(target);
    const notifiable = new Proxy(target, {
      get(self: any, prop: string | symbol): any {
        if (prop === ObservableSymbol.Notifier) {
          return notifier;
        }
        if (prop === ObservableSymbol.Self) {
          return self;
        }
        let result;
        switch (prop) {
          case 'delete':
            return (...args: any) => {
              result = self.delete.apply(self, args);
              notifier.notify(undefined);
              return result;
            };
          case 'clear':
            return (...args: any) => {
              result = (self as Map<any, any>).clear.apply(self, args);
              notifier.notify(undefined);
              return result;
            };
          case 'set':
            return (...args: any) => {
              result = self.set.apply(self, args);
              notifier.notify(undefined);
              return result;
            };
          case 'get':
            return (...args: any) => {
              result = self.get.apply(self, args);
              const origin = Observability.getOrigin(result);
              return Notifiable.transform(origin);
            };
          default:
            result = Reflect.get(self, prop);
            if (typeof result === 'function') {
              return result.bind(self);
            } else {
              const origin = Observability.getOrigin(result);
              return Notifiable.transform(origin);
            }
        }
      },
    });
    set(target, notifiable);
    return notifiable;
  }
}
