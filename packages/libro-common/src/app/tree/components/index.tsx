import type { TreeNodeComponents } from '../tree.js';

import { TreeIdent } from './tree-ident.js';
import { TreeNodeCaptionAffixes } from './tree-node-caption-affix.js';
import { TreeNodeCaption } from './tree-node-caption.js';
import { TreeNodeExpansion } from './tree-node-expansion.js';
import { TreeNodeIconDecorator } from './tree-node-icon-decorator.js';
import { TreeNodeIcon } from './tree-node-icon.js';
import { TreeNodeTailDecorations } from './tree-node-tail-decoration.js';
import { TreeNodeComponent } from './tree-node.js';
import { TreeSwitchIcon } from './tree-switch-icon.js';

export const DefaultTreeNodeComponents: TreeNodeComponents = {
  TreeNodeExpansion,
  TreeNode: TreeNodeComponent,
  TreeNodeIcon,
  TreeNodeCaption,
  TreeNodeCaptionAffixes,
  TreeNodeTailDecorations,
  TreeNodeIconDecorator,
  TreeIdent,
  TreeSwitchIcon,
};
