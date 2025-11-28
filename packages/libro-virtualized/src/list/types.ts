import type * as React from 'react';

export type RowRendererParams = {
  index: number;
  isScrolling: boolean;
  isVisible: boolean;
  key: string;
  parent: Record<any, any>;
  style: Record<any, any>;
};

export type RowRenderer = (params: RowRendererParams) => React.ReactNode;

export type RenderedRows = {
  overscanStartIndex: number;
  overscanStopIndex: number;
  startIndex: number;
  stopIndex: number;
};

export type Scroll = {
  clientHeight: number;
  scrollHeight: number;
  scrollTop: number;
  scrollingContainer: Element;
};
