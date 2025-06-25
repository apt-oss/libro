import * as React from 'react';

import type { Syringe } from '../../ioc/index.js';
import { ObservableContext, useInject } from '../../observable/index.js';
import { useMount, useUnmount } from '../utils/hooks.js';

import { useViewSize } from './hooks.js';
import { isForwardRefComponent } from './utils.js';
import type { View } from './view-protocol.js';
import type { ViewComponent } from './view-protocol.js';
import { OriginViewComponent } from './view-protocol.js';
import { ViewInstance } from './view-protocol.js';

import './index.less.js';

interface ViewContainerProps {
  component: ViewComponent;
  viewComponentProps: Record<string, any>;
  children: React.ReactNode;
}

export const ViewContainer = React.forwardRef<HTMLDivElement, ViewContainerProps>(
  function ViewContainer(props, containerRef) {
    const { viewComponentProps = {}, children, component } = props;
    const viewInstance = useInject<View>(ViewInstance);
    const Component = component;
    const className = viewInstance?.className ?? '.js';
    useMount(() => {
      if (typeof containerRef === 'object') {
        viewInstance.container = containerRef;
      }
      viewInstance.isVisible = true;
      viewInstance.onViewMount?.();
    });
    useUnmount(() => {
      viewInstance.isVisible = false;
      viewInstance.onViewUnmount?.();
    });

    useViewSize(viewInstance, containerRef);

    if (isForwardRefComponent(Component)) {
      return (
        <Component ref={containerRef} className={className} {...viewComponentProps}>
          {children}
        </Component>
      );
    }
    return (
      <div ref={containerRef} className={`mana-view-container ${className}`}>
        <Component {...viewComponentProps}>{children}</Component>
      </div>
    );
  },
);
export const ViewWrapper = (
  ViewComponent: React.FC | React.ForwardRefExoticComponent<any>,
  container: Syringe.Container,
) => {
  const ViewWrapperRender: WrapperViewComponent = ({
    children,
    ...props
  }: {
    children: React.ReactNode;
  }) => {
    const containerRef = React.useRef<HTMLDivElement>(null);
    return (
      <ObservableContext.Provider value={{ getContainer: () => container }}>
        <ViewContainer
          ref={containerRef}
          component={ViewComponent}
          viewComponentProps={props}
        >
          {children}
        </ViewContainer>
      </ObservableContext.Provider>
    );
  };
  ViewWrapperRender[OriginViewComponent] = ViewComponent;
  return ViewWrapperRender;
};

type WrapperViewComponent = React.FC<{ children: React.ReactNode }> & {
  [OriginViewComponent]?: React.FC | React.ForwardRefExoticComponent<any>;
};

export function isWrapperViewComponent(
  component: any,
): component is WrapperViewComponent {
  return component && component[OriginViewComponent] !== undefined;
}
