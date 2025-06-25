import clsx from 'classnames';
import * as React from 'react';

import { Layout } from '../layout.js';

import { BoxPanelContext } from './context.js';
import './styles/index.less';

export interface PaneProps {
  flex?: number;
  defaultSize?: number;
  overflow?: string;
  //   id: string;
  zIndex?: number;
  style?: React.CSSProperties;
  className?: string;
  children?: React.ReactNode;
}

export const Pane: React.FC<PaneProps> = ({
  children,
  flex,
  overflow,
  defaultSize,
  //   id,
  zIndex,
  style,
  className,
}) => {
  return (
    <BoxPanelContext.Consumer>
      {({ prefixCls, direction }) => {
        const baseCls = `${prefixCls}-boxpanel`;
        return (
          <div
            className={clsx(`${baseCls}-wrapper`, className)}
            style={{
              ...style,
              flex,
              overflow,
              zIndex,
              [Layout.getMinSizeProperty(direction)]: defaultSize,
            }}
          >
            {children}
          </div>
        );
      }}
    </BoxPanelContext.Consumer>
  );
};
