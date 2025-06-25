import 'font-awesome/css/font-awesome.min.css';
import 'file-icons-js/css/style.css';

import type { ComponentType } from 'react';

import { TreeViewContent as TreeViewContentInner } from '../tree/view/index.js';

export const TreeViewContent: ComponentType<any> = (props: any) => {
  return <TreeViewContentInner {...props} />;
};
export default TreeViewContent;
