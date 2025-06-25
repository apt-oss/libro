import * as React from 'react';

import { getOrigin, ObservableContext, useInject } from '../../observable/index.js';
import type { ManaContext } from '../module/index.js';

import { DataContextManager } from './data-context-manager.js';

export interface DataContextProps {
  contextKey: any;
  children: React.ReactNode | React.ReactNode[];
}

interface DataContextRenderProps {
  context?: ManaContext | undefined;
  children: React.ReactNode | React.ReactNode[];
}

const DataContextRender = React.memo(
  function DataContextRender(props: DataContextRenderProps) {
    const { context, children } = props;
    if (context) {
      return (
        <ObservableContext.Provider value={{ getContainer: () => context.container }}>
          {children}
        </ObservableContext.Provider>
      );
    }
    return <></>;
  },
  (prev, next) => {
    return prev.context === next.context;
  },
);

export const DataContext = (props: DataContextProps) => {
  const { contextKey, children } = props;
  const dataContextManager = useInject<DataContextManager>(DataContextManager);
  const ctx = dataContextManager.getContext(getOrigin(contextKey));
  return <DataContextRender context={ctx}>{children}</DataContextRender>;
};
