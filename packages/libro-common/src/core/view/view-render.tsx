import type { ReactNode } from 'react';
import { memo } from 'react';

import { useInject } from '../../observable/index.js';

import { isWrapperViewComponent } from './view-container.js';
import { ViewContext } from './view-context.js';
import type { View } from './view-protocol.js';
import { OriginViewComponent } from './view-protocol.js';
import { ViewComponent } from './view-protocol.js';

// import { ViewManager } from './view-manager.js';

export interface ViewRenderProps {
  view: View;
  shadow?: boolean;
  children?: ReactNode | ReactNode[];
}

const ViewComponentRender = (props: ViewRenderProps) => {
  const { shadow, children } = props;
  const Component = useInject<ViewComponent>(ViewComponent);
  const OriginComponent = useInject<ViewComponent>(OriginViewComponent);
  return shadow ? (
    <OriginComponent {...props}>{children}</OriginComponent>
  ) : (
    <Component {...props}>{children}</Component>
  );
};
export const ViewRender = memo(function ViewRender(props: ViewRenderProps) {
  const { view, shadow } = props;
  if (isWrapperViewComponent(view.view) && !shadow) {
    return <view.view {...props} />;
  }
  return (
    <ViewContext view={view}>
      <ViewComponentRender {...props} />
    </ViewContext>
  );
});
