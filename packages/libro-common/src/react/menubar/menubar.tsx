import classnames from 'classnames';
import addEventListener from 'rc-util/lib/Dom/addEventListener';
import * as React from 'react';
import './styles/index.less';
import '../menu/styles/index.less';

import { MenubarContext } from './context.js';
import { MenubarItem } from './item.js';

export interface MenubarProps {
  prefixCls?: string;
  className?: string;
  extra?: React.ReactNode;
  children?: React.ReactNode | React.ReactNode[];
}
export const defaultMenubarProps: MenubarProps = {
  prefixCls: 'mana',
};

export const Menubar = (props: MenubarProps) => {
  const removeDocEventRef = React.useRef<(() => void) | undefined>(undefined);
  const menubarContentRef = React.useRef<HTMLDivElement | null>(null);
  const [active, setActive] = React.useState(false);
  const [activeElementRef, setActiveElementRef] = React.useState<
    React.MutableRefObject<HTMLDivElement | null> | undefined
  >(undefined);

  const unbindDocEvent = () => {
    if (removeDocEventRef.current) {
      removeDocEventRef.current();
      removeDocEventRef.current = undefined;
    }
  };

  React.useEffect(() => {
    return () => {
      unbindDocEvent();
    };
  }, []);

  const activeMenubar = () => {
    setActive(true);
    if (!removeDocEventRef.current) {
      const onDocumentMouseDown = (e: any) => {
        if (e.defaultPrevented) {
          return;
        }
        const nativeEvent = e.nativeEvent as MouseEvent;
        if (activeElementRef?.current?.contains(nativeEvent.target as HTMLElement)) {
          return;
        }
        setActive(false);
        setActiveElementRef(undefined);
        unbindDocEvent();
      };
      const onDocumentClick = (e: any) => {
        if (e.defaultPrevented) {
          return;
        }
        const nativeEvent = e.nativeEvent as MouseEvent;
        if (activeElementRef?.current?.contains(nativeEvent.target as HTMLElement)) {
          return;
        }
        setActive(false);
        setActiveElementRef(undefined);
        unbindDocEvent();
      };
      const { remove: removeMouseDown } = addEventListener(
        document.documentElement,
        'mousedown',
        onDocumentMouseDown,
      );
      const { remove: removeClick } = addEventListener(
        document.documentElement,
        'click',
        onDocumentClick,
      );
      const remove = () => {
        removeMouseDown();
        removeClick();
      };
      removeDocEventRef.current = remove;
    }
  };

  const inContent = (element: HTMLElement) => {
    if (menubarContentRef && menubarContentRef.current) {
      return menubarContentRef.current.contains(element);
    }
    return false;
  };

  const {
    prefixCls = defaultMenubarProps.prefixCls,
    className,
    children,
    extra,
  } = props;
  const baseCls = `${prefixCls}-menubar`;
  const contextValue: MenubarContext.Contexts = {
    prefixCls: baseCls,
    activeMenubar,
    menubarActived: active === true,
    inContent,
    activeElementRef,
    setActiveElementRef,
  };

  return (
    <div className={classnames(baseCls, className)}>
      <div className={`${baseCls}-content`}>
        <div className={`${baseCls}-content-inner`} ref={menubarContentRef}>
          <MenubarContext.Provider value={contextValue}>
            {children}
          </MenubarContext.Provider>
        </div>
        {extra && <div className={`${baseCls}-content-extras`}>{extra}</div>}
      </div>
    </div>
  );
};

Menubar.Item = MenubarItem;
