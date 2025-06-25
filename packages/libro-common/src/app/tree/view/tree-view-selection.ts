import type { SelectableTreeNode } from '../tree-selection.js';

import { TreeView } from './tree-view.js';

export type TreeViewSelection = readonly Readonly<SelectableTreeNode>[] & {
  source: TreeView;
};
export namespace TreeViewSelection {
  export function isSource(
    selection: Record<any, any> | undefined,
    source: TreeView,
  ): boolean {
    return getSource(selection) === source;
  }
  export function getSource(
    selection: Record<any, any> | undefined,
  ): TreeView | undefined {
    return is(selection) ? selection.source : undefined;
  }
  export function is(
    selection: Record<any, any> | undefined,
  ): selection is TreeViewSelection {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (
      Array.isArray(selection) &&
      'source' in selection &&
      (selection as any).source instanceof TreeView
    );
  }
  export function create(source: TreeView): TreeViewSelection {
    return Object.assign(source.model.selectedNodes, { source });
  }
}
