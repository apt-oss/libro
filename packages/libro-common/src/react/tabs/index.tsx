import { EllipsisOutlined, CloseOutlined, PlusOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import type { TabsProps as RcTabsProps } from 'rc-tabs';
import RcTabs, { TabPane } from 'rc-tabs';
import type { EditableConfig } from 'rc-tabs/lib/interface';
import * as React from 'react';

import { getPrefixCls } from '../util.js';
import './styles/index.less';

export type { TabPaneProps } from 'rc-tabs';
export type TabsType = 'line' | 'card' | 'editable-card';
export type TabsPosition = 'top' | 'right' | 'bottom' | 'left';

export interface TabsProps extends Omit<RcTabsProps, 'editable'> {
  type?: TabsType;
  hideAdd?: boolean;
  centered?: boolean;
  addIcon?: React.ReactNode;
  onEdit?: (
    e: React.MouseEvent | React.KeyboardEvent | string,
    action: 'add' | 'remove',
  ) => void;
}

interface Tabs extends React.FC<TabsProps> {
  TabPane: typeof TabPane;
}

export const Tabs: Tabs = ({
  type,
  className,
  onEdit,
  hideAdd,
  centered,
  addIcon,
  ...props
}: TabsProps) => {
  const { moreIcon = <EllipsisOutlined /> } = props;
  // const { getPrefixCls, direction } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('tabs');

  let editable: EditableConfig | undefined;
  if (type === 'editable-card') {
    editable = {
      onEdit: (editType, { key, event }) => {
        onEdit?.(editType === 'add' ? event : key!, editType);
      },
      removeIcon: <CloseOutlined />,
      addIcon: addIcon || <PlusOutlined />,
      showAdd: hideAdd !== true,
    };
  }

  return (
    <RcTabs
      // direction={direction}
      {...props}
      className={classNames(
        {
          // [`${prefixCls}-${size}`]: size,
          [`${prefixCls}-card`]: ['card', 'editable-card'].includes(type as string),
          [`${prefixCls}-editable-card`]: type === 'editable-card',
          [`${prefixCls}-centered`]: centered,
        },
        className,
      )}
      editable={editable}
      moreIcon={moreIcon}
      prefixCls={prefixCls}
    />
  );
};

Tabs.TabPane = TabPane;
