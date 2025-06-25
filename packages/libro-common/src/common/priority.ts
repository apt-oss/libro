import type { MaybeArray } from './types.js';

import type { MaybePromise } from './index.js';

export enum Priority {
  PRIOR = 1000,
  DEFAULT = 100,
  IDLE = -1,
}

export namespace Priority {
  export type PriorityObject<T> = {
    readonly priority: number;
    readonly value: T;
  };
  export type GetPriority<T> = (value: T) => MaybePromise<number>;
  export type GetPrioritySync<T> = (value: T) => number;

  export function isValid<T>(p: PriorityObject<T>): boolean {
    return p.priority > 0;
  }
  export function compare<T>(p: PriorityObject<T>, p2: PriorityObject<T>): number {
    return p2.priority - p.priority;
  }

  export async function toPriorityObject<T>(
    rawValue: T,
    getPriority: GetPriority<T>,
  ): Promise<PriorityObject<T>>;
  export async function toPriorityObject<T>(
    rawValue: T[],
    getPriority: GetPriority<T>,
  ): Promise<PriorityObject<T>[]>;
  export async function toPriorityObject<T>(
    rawValue: MaybeArray<T>,
    getPriority: GetPriority<T>,
  ): Promise<MaybeArray<PriorityObject<T>>> {
    if (rawValue instanceof Array) {
      return Promise.all(rawValue.map((v) => toPriorityObject(v, getPriority)));
    }
    const value = rawValue;
    const priority = await getPriority(value);
    return { priority, value };
  }
  export async function sort<T>(
    values: T[],
    getPriority: GetPriority<T>,
  ): Promise<PriorityObject<T>[]> {
    const prioritizeable = await toPriorityObject(values, getPriority);
    return prioritizeable.filter(isValid).sort(compare);
  }

  export function toPriorityObjectSync<T>(
    rawValue: T,
    getPriority: GetPrioritySync<T>,
  ): PriorityObject<T>;
  export function toPriorityObjectSync<T>(
    rawValue: T[],
    getPriority: GetPrioritySync<T>,
  ): PriorityObject<T>[];
  export function toPriorityObjectSync<T>(
    rawValue: MaybeArray<T>,
    getPriority: GetPrioritySync<T>,
  ): MaybeArray<PriorityObject<T>> {
    if (rawValue instanceof Array) {
      return rawValue.map((v) => toPriorityObjectSync(v, getPriority));
    }
    const value = rawValue;
    const priority = getPriority(value);
    return { priority, value };
  }
  export function sortSync<T>(
    values: T[],
    getPriority: GetPrioritySync<T>,
  ): PriorityObject<T>[] {
    const prioritizeable = toPriorityObjectSync(values, getPriority);
    return prioritizeable.filter(isValid).sort(compare);
  }
}
