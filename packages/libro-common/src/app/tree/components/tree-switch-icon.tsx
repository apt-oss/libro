import { DownOutlined } from '@ant-design/icons';
import * as React from 'react';

import type { TreeNodeProps } from '../tree.js';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const TreeSwitchIcon: React.FC<TreeNodeProps> = (_props: TreeNodeProps) => {
  return (
    <span className="tree-switcher">
      <DownOutlined style={{ fontSize: 12 }} />
    </span>
  );
};
