/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from 'react';

import { Tracker } from './tracker.js';
import { Observability } from './utils.js';

interface Action<T> {
  key: keyof T;
  value: any;
}
function isAction(data: Record<string, any> | undefined): data is Action<any> {
  return !!data && data['key'] !== undefined && data['value'] !== undefined;
}
const reducer = <T>(state: Partial<T>, part: Action<T> | undefined) => {
  if (isAction(part)) {
    return { ...state, [part.key]: part.value };
  }
  return { ...state };
};

export function useObserve<T>(obj: T): T {
  const [, dispatch] = React.useReducer<
    (prevState: Partial<T>, action: Action<T>) => Partial<T>
  >(reducer, {});
  if (!Observability.canBeObservable(obj)) {
    return obj;
  }
  return Tracker.track(obj, dispatch);
}
/**
 * @deprecated
 */
export function useObservableState<T>(initialValue: T): T {
  const object = React.useMemo(() => {
    return initialValue;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return useObserve(object);
}
