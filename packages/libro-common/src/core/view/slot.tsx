import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { memo } from 'react';

import type { Newable } from '../../common/index.js';
import { useInject, getOrigin } from '../../observable/index.js';

import { SlotViewManager } from './slot-view-manager.js';
import { ViewInstance } from './view-protocol.js';
import type { View } from './view-protocol.js';
import type { SlotView } from './view-protocol.js';
import { ViewRender } from './view-render.js';

export interface Props {
  name: string;
  viewProps?: undefined | Record<string, any>;
  children?: undefined | ReactNode | ReactNode[];
  slotView?: undefined | Newable<View>;
}

const SlotRender = memo(
  function SlotRenderInner(props: {
    view: View | undefined;
    children: React.ReactNode;
    viewProps?: Record<string, any> | undefined;
  }) {
    const { view, children, viewProps } = props;
    if (view) {
      return (
        <ViewRender view={view} {...viewProps}>
          {children}
        </ViewRender>
      );
    }
    return <></>;
  },
  (prev, next) => {
    return (
      prev.view === next.view &&
      prev.children === next.children &&
      prev.viewProps === next.viewProps
    );
  },
);

export const Slot: React.FC<Props> = (props: Props) => {
  const { name, children, viewProps, slotView } = props;
  const slotViewManager = useInject(SlotViewManager);
  slotViewManager.slotRendering(name);
  const areaView = slotViewManager.slotViewMap.get(name);
  const containerView = useInject<SlotView>(ViewInstance);

  useEffect(() => {
    slotViewManager.getOrCreateSlotView(name, slotView);
    slotViewManager.addSlotToView(name, getOrigin(containerView));
    return () => {
      slotViewManager.removeSlotFromView(name, getOrigin(containerView));
    };
  }, [name, containerView, slotViewManager, slotView]);
  if (slotView) {
    slotViewManager.setComponentSlotPreference(name, { slot: name, view: slotView });
  }

  return (
    <SlotRender view={areaView} viewProps={viewProps}>
      {children}
    </SlotRender>
  );
};
