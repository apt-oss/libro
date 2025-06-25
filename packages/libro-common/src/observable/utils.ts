import 'reflect-metadata';
import type { Disposable } from '../common/index.js';
import { isPlainObject, getPropertyDescriptor } from '../common/index.js';

import { ObservableConfig } from './config.js';
import type { Traceable } from './core.js';
import { ObservableSymbol } from './core.js';

export namespace Observability {
  export function isTraceable(data: any): data is Traceable {
    return !!data && data[ObservableSymbol.Self];
  }

  export function isObject(obj: any): obj is Record<string | number | symbol, any> {
    return !!obj && typeof obj === 'object';
  }

  export function canBeObservable(
    obj: any,
  ): obj is Record<string | number | symbol, any> {
    if (!isObject(obj)) {
      return false;
    }
    if (ObservableConfig.shouldExclude(obj)) {
      return false;
    }
    return true;
  }

  export function marked(obj: any, property?: string | symbol): boolean {
    if (!isObject(obj)) {
      return false;
    }
    const origin = getOrigin(obj);
    if (property) {
      return Reflect.hasOwnMetadata(ObservableSymbol.Observable, origin, property);
    }
    return Reflect.hasOwnMetadata(ObservableSymbol.Observable, origin);
  }

  export function mark(obj: Record<any, any>, property?: string | symbol) {
    Reflect.defineMetadata(ObservableSymbol.Observable, true, obj);
    if (property) {
      Reflect.defineMetadata(ObservableSymbol.Observable, true, obj, property);
    }
  }

  export function defineOrigin(obj: Record<any, any>, property: string | symbol) {
    Reflect.defineMetadata(ObservableSymbol.KeepOrigin, true, obj, property);
  }

  export function shouldKeepOrigin(obj: any, property: string | symbol): boolean {
    if (!isObject(obj)) {
      return false;
    }
    const origin = getOrigin(obj);
    if (isPlainObject(origin)) {
      return false;
    }
    return Reflect.hasMetadata(
      ObservableSymbol.KeepOrigin,
      origin.constructor,
      property,
    );
  }

  export function getOrigin<T = any>(obj: T): T {
    if (!isTraceable(obj)) {
      return obj;
    }
    return obj[ObservableSymbol.Self];
  }

  export function equals(a: any, b: any) {
    return getOrigin(a) === getOrigin(b);
  }

  export function getDisposable(
    metaKey: any,
    obj: Record<string, any>,
    property?: string,
  ) {
    if (property) {
      return Reflect.getOwnMetadata(metaKey, obj, property);
    }
    return Reflect.getOwnMetadata(metaKey, obj);
  }

  export function setDisposable(
    metaKey: any,
    disposable: Disposable,
    obj: Record<string, any>,
    property?: string,
  ) {
    if (property) {
      Reflect.defineMetadata(metaKey, disposable, obj, property);
    }
    Reflect.defineMetadata(metaKey, disposable, obj);
  }
}

export namespace ObservableProperties {
  export function getOwn(obj: Record<string, any>): string[] | undefined {
    return Reflect.getOwnMetadata(ObservableSymbol.ObservableProperties, obj);
  }
  export function get(obj: Record<string, any>): string[] | undefined {
    return Reflect.getMetadata(ObservableSymbol.ObservableProperties, obj);
  }
  export function find(obj: Record<string, any>): string[] | undefined {
    if (obj && obj.constructor) {
      return get(obj.constructor);
    }
    return undefined;
  }

  export function add(obj: Record<any, any>, property: string): void {
    const existingProperties = getOwn(obj);
    if (existingProperties) {
      existingProperties.push(property);
    } else {
      const protoProperties = get(obj) || [];
      Reflect.defineMetadata(
        ObservableSymbol.ObservableProperties,
        [...protoProperties, property],
        obj,
      );
    }
  }
}

export namespace InstanceValue {
  export function set(target: any, property: string, value: any) {
    Reflect.defineMetadata(property, value, target);
  }
  export function get(target: any, property: string) {
    return Reflect.getMetadata(property, target);
  }
}

export type DesignType =
  | undefined
  | typeof Function
  | typeof String
  | typeof Boolean
  | typeof Number
  | typeof Array
  | typeof Map
  | typeof Object;

export const getOrigin = Observability.getOrigin;
export const equals = Observability.equals;

export function isReadonly(target: object, property: string | symbol): boolean {
  const descriptor = getPropertyDescriptor(target, property);
  if (descriptor?.configurable === false && descriptor?.writable === false) {
    // non-configurable and non-writable property should return the actual value
    return true;
  }
  return false;
}
