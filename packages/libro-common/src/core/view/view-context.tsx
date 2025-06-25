import * as React from 'react';

import { getOrigin, ObservableContext } from '../../observable/index.js';
import type { ManaContext } from '../module/index.js';

import { ViewMeta } from './view-meta.js';
import type { View } from './view-protocol.js';

export interface ViewContextProps {
  view: View;
  children: React.ReactNode | React.ReactNode[];
}

interface ViewContextRenderProps {
  context?: ManaContext;
  children: React.ReactNode | React.ReactNode[];
}

const ViewContextRender = React.memo(function ViewContextRender(
  props: ViewContextRenderProps,
) {
  const { context, children } = props;
  if (context) {
    return (
      <ObservableContext.Provider value={{ getContainer: () => context.container }}>
        {children}
      </ObservableContext.Provider>
    );
  }
  return <></>;
});

export const ViewContext = (props: ViewContextProps) => {
  const { view, children } = props;
  const manaContext = ViewMeta.getViewContext(getOrigin(view));
  return <ViewContextRender context={manaContext}>{children}</ViewContextRender>;
};
