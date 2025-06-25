import classNames from 'classnames';
import * as React from 'react';

import { MenuContext } from './context.js';

export interface MenuItemProps {
  className?: string;
  icon?: React.ReactNode;
  text?: string | React.ReactNode;
  hotkey?: string;
  active?: boolean;
  hidden?: boolean;
  disabled?: boolean;
  children?: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
}

export function getProps(
  props: MenuItemProps,
  context: MenuContext.Context,
  extraCls?: string,
) {
  const { className, disabled, active, hidden } = props;
  const { prefixCls } = context;
  const baseCls = `${prefixCls}-item`;
  return {
    className: classNames(
      baseCls,
      extraCls,
      {
        [`${baseCls}-active`]: active,
        [`${baseCls}-hidden`]: hidden,
        [`${baseCls}-disabled`]: disabled,
      },
      className,
    ),
  };
}

export function getContent(
  props: MenuItemProps,
  context: MenuContext.Context,
  onClick: React.MouseEventHandler<HTMLButtonElement>,
  innerExtra?: any,
  outerExtra?: any,
) {
  const { icon, text, hotkey, children } = props;
  const { prefixCls } = context;
  const baseCls = `${prefixCls}-item`;
  return (
    <>
      <button type="button" className={`${baseCls}-button`} onClick={onClick}>
        <span>
          <span className={`${baseCls}-icon`}>
            {icon && React.isValidElement(icon) && icon}
          </span>

          <span className={`${baseCls}-text`}>{text || children}</span>
        </span>
        <span>
          {hotkey && <span className={`${baseCls}-hotkey`}>{hotkey}</span>}
          {innerExtra}
        </span>
      </button>
      {outerExtra}
    </>
  );
}
export const MenuItem = (props: MenuItemProps) => {
  const context = React.useContext(MenuContext);
  const triggerHandler: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    if (!props.disabled && !props.hidden) {
      if (props.onClick) {
        props.onClick(e);
      }
    }
  };
  return (
    <div onMouseDown={(e) => e.stopPropagation()} {...getProps(props, context)}>
      {getContent(props, context, triggerHandler)}
    </div>
  );
};
