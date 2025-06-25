import { useLayoutEffect } from 'react';
import ResizeObserver from 'resize-observer-polyfill';

import { useLatest } from '../utils/index.js';

import type { View } from './view-protocol.js';

export type Size = { width?: number; height?: number };

export function useViewSize(view: View, ref: React.ForwardedRef<HTMLDivElement>): void {
  const callback = useLatest((size: Size) => {
    view.onViewResize?.(size);
  });
  useLayoutEffect(() => {
    if (typeof ref !== 'object') {
      return () => {
        //
      };
    }
    const el = ref?.current;
    if (!el || !view.onViewResize) {
      return () => {
        //
      };
    }
    const resizeObserver = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        callback.current({
          width: entry.target.clientWidth,
          height: entry.target.clientHeight,
        });
      });
    });

    resizeObserver.observe(el as HTMLElement);
    return () => {
      resizeObserver.disconnect();
    };
  }, [callback, ref, view.container, view.onViewResize]);
}
