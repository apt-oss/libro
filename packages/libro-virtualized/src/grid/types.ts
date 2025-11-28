import type * as React from 'react';

import type ScalingCellSizeAndPositionManager from './utils/scaling-cell-size-and-position-manager.js';

export type CellPosition = { columnIndex: number; rowIndex: number };

export type CellRendererParams = {
  columnIndex: number;
  isScrolling: boolean;
  isVisible: boolean;
  key: string;
  parent: object;
  rowIndex: number;
  style: object;
};

export type CellRenderer = (props: CellRendererParams) => React.ReactNode;

export type CellCache = Record<string, React.ReactNode>;
export type StyleCache = Record<string, object>;

export type CellRangeRendererParams = {
  cellCache: CellCache;
  cellRenderer: CellRenderer;
  columnSizeAndPositionManager: ScalingCellSizeAndPositionManager;
  columnStartIndex: number;
  columnStopIndex: number;
  deferredMeasurementCache?: object;
  horizontalOffsetAdjustment: number;
  isScrolling: boolean;
  isScrollingOptOut: boolean;
  parent: object;
  rowSizeAndPositionManager: ScalingCellSizeAndPositionManager;
  rowStartIndex: number;
  rowStopIndex: number;
  scrollLeft: number;
  scrollTop: number;
  styleCache: StyleCache;
  verticalOffsetAdjustment: number;
  visibleColumnIndices: Record<any, any>;
  visibleRowIndices: Record<any, any>;
};

export type CellRangeRenderer = (params: CellRangeRendererParams) => React.ReactNode[];

export type CellSizeGetter = (params: { index: number }) => number;

export type CellSize = CellSizeGetter | number;

export type NoContentRenderer = () => React.ReactNode | null;

export type Scroll = {
  scrollingContainer: Element;
  clientHeight: number;
  clientWidth: number;
  scrollHeight: number;
  scrollLeft: number;
  scrollTop: number;
  scrollWidth: number;
};

export type ScrollbarPresenceChange = {
  horizontal: boolean;
  vertical: boolean;
  size: number;
};

export type RenderedSection = {
  columnOverscanStartIndex: number;
  columnOverscanStopIndex: number;
  columnStartIndex: number;
  columnStopIndex: number;
  rowOverscanStartIndex: number;
  rowOverscanStopIndex: number;
  rowStartIndex: number;
  rowStopIndex: number;
};

export type OverscanIndicesGetterParams = {
  // One of SCROLL_DIRECTION_HORIZONTAL or SCROLL_DIRECTION_VERTICAL
  direction: 'horizontal' | 'vertical';

  // One of SCROLL_DIRECTION_BACKWARD or SCROLL_DIRECTION_FORWARD
  scrollDirection: -1 | 1;

  // Number of rows or columns in the current axis
  cellCount: number;

  // Maximum number of cells to over-render in either direction
  overscanCellsCount: number;

  // Begin of range of visible cells
  startIndex: number;

  // End of range of visible cells
  stopIndex: number;
};

export type OverscanIndices = {
  overscanStartIndex: number;
  overscanStopIndex: number;
};

export type OverscanIndicesGetter = (
  params: OverscanIndicesGetterParams,
) => OverscanIndices;

export type Alignment = 'auto' | 'end' | 'start' | 'center';

export type VisibleCellRange = {
  start?: number;
  stop?: number;
};
