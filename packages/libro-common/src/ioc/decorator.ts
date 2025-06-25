/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  injectable as inversInjectable,
  inject as inversifyInject,
  named as inversifyNamed,
} from 'inversify';

import type { Decorator } from './core.js';
import { Syringe } from './core.js';
import { namedToIdentifier, tokenToIdentifier } from './inversify-api/index.js';

export function injectable<T = any>(
  option: Syringe.DecoratorOption<T> = {},
): Decorator<T> {
  const decorator = inversInjectable();
  return (target: any) => {
    Reflect.defineMetadata(Syringe.ClassOptionSymbol, { ...option, target }, target);
    decorator(target);
  };
}

export function singleton<T = any>(
  option: Syringe.DecoratorOption<T> = {},
): Decorator<T> {
  return (target, ...args) => {
    injectable({ ...option, lifecycle: Syringe.Lifecycle.singleton })(target, ...args);
    return target;
  };
}

export function transient<T = any>(
  option: Syringe.DecoratorOption<T> = {},
): Decorator<T> {
  return (target, ...args) => {
    injectable({ ...option, lifecycle: Syringe.Lifecycle.transient })(target, ...args);
    return target;
  };
}

export function inject(
  token: Syringe.Token<any>,
  // Typescript 5 makes type-checking more accurate for decorators under --experimentalDecorators,
  // We can get a type error: Parameters of type undefined cannot be assigned to parameters of type string,
  // Let's leave the targetKey type loose and wait for inversify to fix the type problem.
): (target: any, targetKey: any, index?: number | undefined) => void {
  return inversifyInject(tokenToIdentifier(token));
}
export function named(
  name: Syringe.Named,
): (target: any, targetKey: any, index?: number | undefined) => void {
  return inversifyNamed(namedToIdentifier(name));
}
export { postConstruct, optional, unmanaged, decorate } from 'inversify';
