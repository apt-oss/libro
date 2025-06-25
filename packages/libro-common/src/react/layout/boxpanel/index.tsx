import clsx from 'classnames';
import * as React from 'react';

import { defaultPrefixCls } from '../../constant.js';
import { Layout } from '../layout.js';

import { BoxPanelContext } from './context.js';
import { Pane } from './Pane.js';
import './styles/index.less';

export interface BoxPanelProps {
  prefixCls?: string | undefined;
  className?: string | undefined;
  direction?: Layout.direction;
  defaultSize?: number | string;
  flex?: number;
  zIndex?: number;
  style?: React.CSSProperties;
  children?: React.ReactNode | React.ReactNode[];
}

export type BoxPanel = React.ForwardRefExoticComponent<
  BoxPanelProps & React.RefAttributes<HTMLDivElement>
> & { Pane: typeof Pane };

export const BoxPanel: BoxPanel = React.forwardRef<HTMLDivElement, BoxPanelProps>(
  function BoxPanel(
    {
      prefixCls = defaultPrefixCls,
      className,
      children = [],
      direction = 'left-to-right',
      defaultSize,
      zIndex,
      style,
    },
    containerRef: React.ForwardedRef<HTMLDivElement>,
  ) {
    const baseCls = `${prefixCls}-boxpanel`;
    const arrayChildren = React.Children.toArray(children);

    return (
      <div
        ref={containerRef}
        className={clsx(baseCls, className)}
        style={{
          ...style,
          flexDirection: Layout.getFlexDirection(direction),
          zIndex,
          [Layout.getMinSizeProperty(direction)]: defaultSize,
        }}
      >
        {arrayChildren.map((child, index) => {
          return (
            <BoxPanelContext.Provider value={{ prefixCls, direction }} key={index}>
              {child}
            </BoxPanelContext.Provider>
          );
        })}
      </div>
    );
  },
) as BoxPanel;

BoxPanel.Pane = Pane;
