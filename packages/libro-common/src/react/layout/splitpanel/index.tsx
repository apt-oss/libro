/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-nested-ternary */
import clsx from 'classnames';
import * as React from 'react';

import { Emitter } from '../../../common/index.js';
import { defaultPrefixCls } from '../../constant.js';
import type { IResizeHandleDelegate } from '../../resize/index.js';
import { ResizeFlexMode } from '../../resize/index.js';
import { Layout } from '../layout.js';

import { SplitPanelContext } from './context.js';
import { Pane } from './pane.js';
import './styles/index.less';

export interface SplitPanelProps {
  prefixCls?: string;
  className?: string;
  direction?: Layout.direction;
  id: string;
  // setAbsoluteSize 时保证相邻节点总宽度不变
  resizeKeep?: boolean;
  // used in accordion
  // dynamicTarget?: boolean;
  // 控制使用传入尺寸之和作为总尺寸或使用dom尺寸
  useDomSize?: boolean;
  children?: React.ReactNode | React.ReactNode[];
  onResize?: (slot?: string) => void;
  onSizeChanged?: (size: { slot: string; size: number }[]) => void;
}

type ChildType = React.ReactNode & {
  props: Record<string, any>;
};

const getProp = (child: ChildType, prop: string) => {
  return child && child.props && child.props[prop];
};

export type SplitPanel = React.ForwardRefExoticComponent<
  SplitPanelProps & React.RefAttributes<HTMLDivElement>
> & { Pane: typeof Pane };

export const SplitPanel = React.forwardRef(function SplitPanel(
  {
    prefixCls = defaultPrefixCls,
    id,
    className,
    children = [],
    direction = 'left-to-right',
    resizeKeep = true,
    useDomSize,
    onResize,
    onSizeChanged,
    ...restProps
  }: SplitPanelProps,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  const baseCls = `${prefixCls}-splitpanel`;

  const ResizeHandle = Layout.getResizeHandle(direction);
  // convert children to list
  const childList = React.Children.toArray(children) as ChildType[];
  const totalFlexNum = childList.reduce(
    (accumulator, item) =>
      accumulator + (getProp(item, 'flex') !== undefined ? item.props.flex : 1),
    0,
  );
  const elements: React.ReactNode[] = [];
  const resizeDelegates = React.useRef<IResizeHandleDelegate[]>([]);
  // const eventBus = useInjectable<IEventBus>(IEventBus);
  const resizeEventEmmiter = new Emitter<{ slot: string }>();
  // const rootRef = React.useRef<HTMLElement>();

  //
  // const splitPanelService = useInjectable<SplitPanelManager>(SplitPanelManager).getService(id);
  // splitPanelService.panels = [];

  const maxLockState = React.useRef(childList.map(() => false));
  const hideState = React.useRef(childList.map(() => false));
  const resizeLockState = React.useRef(
    maxLockState.current.slice(0, childList.length - 1),
  );
  const [locks, setLocks] = React.useState<boolean[]>(resizeLockState.current);
  const [hides, setHides] = React.useState<boolean[]>(hideState.current);
  const [maxLocks, setMaxLocks] = React.useState<boolean[]>(maxLockState.current);

  // 获取setSize的handle，对于最右端或最底部的视图，取上一个位置的handle
  const setSizeHandle = (index: number) => {
    return (size?: number, isLatter?: boolean) => {
      const targetIndex = isLatter ? index - 1 : index;
      const delegete = resizeDelegates.current[targetIndex];
      if (delegete) {
        delegete.setAbsoluteSize(
          size !== undefined ? size : getProp(childList[index], 'defaultSize'),
          isLatter,
          resizeKeep,
        );
      }
    };
  };

  const setRelativeSizeHandle = (index: number) => {
    return (prev: number, next: number, isLatter?: boolean) => {
      const targetIndex = isLatter ? index - 1 : index;
      const delegete = resizeDelegates.current[targetIndex];
      if (delegete) {
        delegete.setRelativeSize(prev, next);
      }
    };
  };

  const getSizeHandle = (index: number) => {
    return (isLatter?: boolean) => {
      const targetIndex = isLatter ? index - 1 : index;
      const delegete = resizeDelegates.current[targetIndex];
      if (delegete) {
        return delegete.getAbsoluteSize(isLatter);
      }
      return 0;
    };
  };

  const getRelativeSizeHandle = (index: number) => {
    return (isLatter?: boolean) => {
      const targetIndex = isLatter ? index - 1 : index;
      const delegete = resizeDelegates.current[targetIndex];
      if (delegete) {
        return delegete.getRelativeSize();
      }
      return [0, 0];
    };
  };

  const lockResizeHandle = (index: number) => {
    return (lock: boolean | undefined, isLatter?: boolean) => {
      const targetIndex = isLatter ? index - 1 : index;
      const newResizeState = resizeLockState.current.map((state, idx) =>
        // eslint-disable-next-line no-nested-ternary
        idx === targetIndex ? (lock !== undefined ? lock : !state) : state,
      );
      resizeLockState.current = newResizeState;
      setLocks(newResizeState);
    };
  };

  const setMaxSizeHandle = (index: number) => {
    return (lock: boolean | undefined, _isLatter?: boolean) => {
      const newMaxState = maxLockState.current.map((state, idx) =>
        idx === index ? (lock !== undefined ? lock : !state) : state,
      );
      maxLockState.current = newMaxState;
      setMaxLocks(newMaxState);
    };
  };

  const fireResizeEvent = (slot?: string) => {
    if (onResize) {
      onResize(slot);
    }
    if (onSizeChanged) {
      const sizeArr = childList.map((child, idx) => {
        const size = getSizeHandle(idx)(idx === childList.length - 1);
        return { slot: getProp(child, 'slot') as string, size };
      });
      onSizeChanged(sizeArr);
    }
    if (slot) {
      resizeEventEmmiter.fire({ slot });
    }
  };

  const hidePanelHandle = (index: number) => {
    return (show?: boolean) => {
      const newHideState = hideState.current.map((state, idx) =>
        idx === index ? (show !== undefined ? !show : !state) : state,
      );
      hideState.current = newHideState;
      const location =
        getProp(childList[index], 'slot') || getProp(childList[index], 'id');
      if (location) {
        fireResizeEvent(location);
      }
      setHides(newHideState);
    };
  };

  childList.forEach((element, index) => {
    if (index !== 0) {
      const targetElement = index === 1 ? childList[index - 1] : childList[index];
      let flexMode: ResizeFlexMode | undefined;
      if (getProp(element, 'flexGrow')) {
        flexMode = ResizeFlexMode.Prev;
      } else if (getProp(childList[index - 1], 'flexGrow')) {
        flexMode = ResizeFlexMode.Next;
      }
      elements.push(
        <ResizeHandle
          className={
            getProp(targetElement, 'noResize') || locks[index - 1] ? 'no-resize' : ''
          }
          onResize={(_prev, _next) => {
            const prevLocation =
              getProp(childList[index - 1], 'slot') ||
              getProp(childList[index - 1], 'id');
            const nextLocation =
              getProp(childList[index], 'slot') || getProp(childList[index], 'id');
            fireResizeEvent(prevLocation!);
            fireResizeEvent(nextLocation!);
          }}
          noColor={true}
          // findNextElement={
          //   dynamicTarget
          //     ? (resizeDirection: boolean) =>
          //         splitPanelService.getFirstResizablePanel(index - 1, resizeDirection)
          //     : undefined
          // }
          // findPrevElement={
          //   dynamicTarget
          //     ? (resizeDirection: boolean) =>
          //         splitPanelService.getFirstResizablePanel(index - 1, resizeDirection, true)
          //     : undefined
          // }
          key={`split-handle-${index}`}
          delegate={(delegate) => {
            resizeDelegates.current.push(delegate);
          }}
          flexMode={flexMode}
          direction={direction}
        />,
      );
    }
    elements.push(
      <SplitPanelContext.Provider
        key={index}
        value={{
          setSize: setSizeHandle(index),
          getSize: getSizeHandle(index),
          setRelativeSize: setRelativeSizeHandle(index),
          getRelativeSize: getRelativeSizeHandle(index),
          lockSize: lockResizeHandle(index),
          setMaxSize: setMaxSizeHandle(index),
          hidePanel: hidePanelHandle(index),
        }}
      >
        <div
          data-min-resize={getProp(element, 'minResize')}
          // ref={ele => {
          //   if (ele && splitPanelService.panels.indexOf(ele) === -1) {
          //     splitPanelService.panels.push(ele);
          //   }
          // }}
          id={getProp(element, 'id') /* @deprecated: query by data-view-id */}
          className={getProp(element, 'className')}
          style={{
            // 手风琴场景，固定尺寸和flex尺寸混合布局；需要在resize flex模式下禁用
            ...(element.props.flex &&
            !element.props.savedSize &&
            !childList.find((item) => item!.props.flexGrow)
              ? { flex: element.props.flex }
              : { [Layout.getSizeProperty(direction)]: getElementSize(element) }),
            // 相对尺寸带来的问题，必须限制最小最大尺寸
            [Layout.getMinSizeProperty(direction)]: getProp(element, 'minSize')
              ? `${element.props.minSize}px`
              : '-1px',
            [Layout.getMaxSizeProperty(direction)]:
              maxLocks[index] && getProp(element, 'minSize')
                ? `${element.props.minSize}px`
                : 'unset',
            // resize flex模式下应用flexGrow
            ...(getProp(element, 'flexGrow') !== undefined
              ? { flexGrow: element.props.flexGrow }
              : {}),
            display: hides[index] ? 'none' : 'block',
          }}
        >
          {element}
        </div>
      </SplitPanelContext.Provider>,
    );
  });

  function getElementSize(element: any) {
    if (element.props.savedSize) {
      return `${element.props.savedSize}px`;
    }
    if (element.props.defaultSize !== undefined) {
      return `${element.props.defaultSize}px`;
    }
    if (element.props.flex) {
      return `${(element.props.flex / totalFlexNum) * 100}%`;
    }
    return `${(1 / totalFlexNum) * 100}%`;
  }

  React.useEffect(() => {
    // if (rootRef.current) {
    //   splitPanelService.rootNode = rootRef.current;
    // }
    const disposer = resizeEventEmmiter.event((e) => {
      if (e.slot === id) {
        childList.forEach((c) => {
          fireResizeEvent(getProp(c, 'slot') || getProp(c, 'id'));
        });
      }
    });
    return () => {
      disposer.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={ref}
      {...restProps}
      className={clsx(baseCls, className)}
      style={{ flexDirection: Layout.getFlexDirection(direction) }}
    >
      {elements}
    </div>
  );
}) as SplitPanel;

SplitPanel.Pane = Pane;
