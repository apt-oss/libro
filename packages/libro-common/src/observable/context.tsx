import { createContext, useContext, useMemo } from 'react';

import type { Observable } from './core.js';
import { useObserve } from './hooks.js';

export type ContextConfig<T> = {
  context: T;
};

export const defaultContainerContext: Observable.ContainerContext = {
  getContainer: () => undefined,
};
export class ObservableContextImpl implements Observable.ContainerContext {
  protected context: Observable.ContainerContext = defaultContainerContext;
  config(info: Observable.ContainerContext): void {
    this.context = info;
  }
  getContainer = (): Observable.Container | undefined => this.context.getContainer();
}

export const defaultObservableContext = new ObservableContextImpl();

export const ObservableContext = createContext<Observable.ContainerContext>(
  defaultObservableContext,
);

export function useInject<T>(identifier: Observable.Token<T>): T {
  const { getContainer } = useContext(ObservableContext);
  const obj = useMemo<T>(() => {
    const container = getContainer();
    if (!container) {
      throw new Error(
        'Can not find container in context, please check the context settings.',
      );
    }
    return container.get<T>(identifier);
  }, [getContainer, identifier]);
  return useObserve(obj);
}
