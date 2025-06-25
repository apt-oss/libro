import * as React from 'react';

import { MenuContext } from './context.js';
import type { MenuItemProps } from './item.js';
import { getProps, getContent } from './item.js';
import './styles/index.less';

const noop = () => {
  //
};

export const MenuSubMenu: React.FC<MenuItemProps> = (props) => {
  const { hotkey, children, ...others } = props;
  const context = React.useContext(MenuContext);
  const { prefixCls } = context;
  const wrapProps = getProps({ ...props }, context, `${prefixCls}-submenu`);
  return (
    <div {...wrapProps}>
      {getContent(
        { ...others },
        context,
        noop,
        <span className={`${prefixCls}-submenu-arrow`} />,
        <div className={`${prefixCls}-submenu-menu`}>{children}</div>,
      )}
    </div>
  );
};
