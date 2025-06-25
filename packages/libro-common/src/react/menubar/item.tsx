import classnames from 'classnames';
import * as React from 'react';
import { useEffect } from 'react';
import * as ReactDom from 'react-dom';

import { MenubarContext } from './context.js';

function stopPropagation(e: MouseEvent) {
  e.stopPropagation();
}

export const MenubarItem = (props: MenubarItemProps) => {
  const context = React.useContext(MenubarContext);
  const menubarItemRef = React.useRef<HTMLDivElement | null>(null);
  const { text, children, hidden } = props;
  const { prefixCls, menubarActived } = context;
  const active =
    context.activeElementRef &&
    context.activeElementRef.current &&
    context.activeElementRef.current === menubarItemRef.current;
  const currentMenuActived = menubarActived && active;
  const baseCls = `${prefixCls}-item`;
  const popupClassName = `${context.prefixCls}-item-dropdown`;

  useEffect(() => {
    const element = menubarItemRef.current;
    if (element) {
      element.addEventListener('mousedown', stopPropagation);
    }
    return () => {
      if (element) {
        element.removeEventListener('mousedown', stopPropagation);
      }
    };
  }, []);

  const doActive = () => {
    context.setActiveElementRef(menubarItemRef);
  };

  const doDeactive = () => {
    context.setActiveElementRef();
  };

  const onToggleActive = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!currentMenuActived) {
      context.activeMenubar();
      doActive();
    }
  };

  const locatable = !!menubarItemRef.current;
  const getPortalItemStyle = () => {
    const node = menubarItemRef.current;
    if (!node) {
      return {};
    }
    const { offsetHeight } = node;
    const { top, left } = node.getBoundingClientRect();
    return { top: top + offsetHeight, left: left };
  };
  return (
    <div
      ref={menubarItemRef}
      className={classnames(baseCls, {
        [`${baseCls}-hidden`]: hidden,
        [`${baseCls}-hover`]: menubarActived,
        [`${baseCls}-active`]: currentMenuActived,
      })}
      onMouseEnter={doActive}
      onClick={onToggleActive}
    >
      <div
        className={classnames(`${baseCls}-text`, {
          [`${baseCls}-text-active`]: currentMenuActived,
        })}
        // onClick={onClick}
      >
        {text}
      </div>
      {currentMenuActived &&
        locatable &&
        ReactDom.createPortal(
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%' }}>
            <div>
              <div style={getPortalItemStyle()} className={popupClassName}>
                {children}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};

// eslint-disable-next-line @typescript-eslint/no-redeclare
export interface MenubarItemProps {
  text: string | React.ReactNode;
  hidden?: boolean;
  children?: React.ReactNode | React.ReactNode[];
}
