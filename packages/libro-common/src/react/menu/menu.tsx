import classNames from 'classnames';
import * as React from 'react';

import { MenuContext } from './context.js';
import { MenuDivider } from './divider.js';
import { MenuItem } from './item.js';
import { MenuSubMenu } from './submenu.js';
import './styles/index.less';

export interface MenuProps {
  prefixCls?: string;
  className?: string;
  children?: React.ReactNode | React.ReactNode[];
}

const defaultProps: MenuProps = {
  prefixCls: 'mana',
};

export interface Menu extends React.FC<MenuProps> {
  Item: typeof MenuItem;
  Divider: typeof MenuDivider;
  SubMenu: typeof MenuSubMenu;
}

export const Menu: Menu = (props: MenuProps) => {
  const { prefixCls = defaultProps.prefixCls, className, children } = props;
  const baseCls = `${prefixCls}-menu`;
  const ContextProvider = MenuContext.Provider;
  const contextValue: MenuContext.Context = {
    prefixCls: baseCls,
  };
  if (!children || (children instanceof Array && children.length === 0)) {
    return null;
  }

  return (
    <div className={classNames(baseCls, className)}>
      <ContextProvider value={contextValue}>{children}</ContextProvider>
    </div>
  );
};

Menu.Item = MenuItem;
Menu.Divider = MenuDivider;
Menu.SubMenu = MenuSubMenu;
