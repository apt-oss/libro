import { useUnmount } from '@difizen/libro-common/app';
import type { RefObject } from 'react';
import { useEffect } from 'react';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';

function useRafState<S>(initialState?: S) {
  const ref = useRef(0);
  const [state, setState] = useState<S | undefined>(initialState);

  const setRafState = useCallback((value: S) => {
    cancelAnimationFrame(ref.current);

    ref.current = requestAnimationFrame(() => {
      setState(value);
    });
  }, []);

  useUnmount(() => {
    cancelAnimationFrame(ref.current);
  });

  return [state, setRafState] as const;
}

type Size = { width: number; height: number };
export function useSize(ref: RefObject<HTMLDivElement>): Size | undefined {
  const [size, setSize] = useRafState<Size>();
  useLayoutEffect(() => {
    const el = ref?.current;
    if (!el) {
      return;
    }
    const resizeObserver = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        const { clientWidth, clientHeight } = entry.target;
        setSize({
          width: clientWidth,
          height: clientHeight,
        });
      });
    });

    resizeObserver.observe(el);
    return () => {
      resizeObserver.disconnect();
    };
  }, [ref, setSize]);
  return size;
}

interface FrameMetrics {
  timestamp: number;
  fps: number;
  frameTime: number;
  droppedFrames: number;
}

export const useFrameMonitor = (
  scrollContainerRef: React.RefObject<HTMLElement>,
  isEnabledSpmReporter: boolean,
  onReport?: (payload: { frames: FrameMetrics[]; summary: any }) => void,
) => {
  const frameData = useRef<FrameMetrics[]>([]);
  const lastFrameTime = useRef(performance.now());
  const frameCount = useRef(0);
  const lastScrollPos = useRef(0);
  const rafId = useRef<number>();
  const isMonitoring = useRef(false);
  // const reportTimeout = useRef<NodeJS.Timeout>();
  const intervalId = useRef<NodeJS.Timeout>();
  const scrollDebounceTimer = useRef<NodeJS.Timeout>();

  const stopFrameCapture = useCallback(() => {
    if (rafId.current) {
      cancelAnimationFrame(rafId.current);
    }
    if (intervalId.current) {
      clearInterval(intervalId.current);
    }
    isMonitoring.current = false;
    frameCount.current = 0;
    lastFrameTime.current = performance.now();
  }, []);

  const startFrameCapture = useCallback(() => {
    if (isMonitoring.current) {
      return;
    }

    const calculateFPS = () => {
      if (!isMonitoring.current) {
        return;
      }
      const now = performance.now();
      const delta = now - lastFrameTime.current;
      frameData.current.push({
        timestamp: now,
        fps: Math.round((frameCount.current * 1000) / delta),
        frameTime: delta / frameCount.current,
        droppedFrames: Math.max(0, Math.floor(delta / 16.67) - frameCount.current),
      });
      lastFrameTime.current = now;
      frameCount.current = 0;
    };

    const loop = () => {
      if (isMonitoring.current) {
        frameCount.current++;
        rafId.current = requestAnimationFrame(loop);
      }
    };

    isMonitoring.current = true;
    frameCount.current = 0;
    lastFrameTime.current = performance.now();

    if (intervalId.current) {
      clearInterval(intervalId.current);
    }
    intervalId.current = setInterval(calculateFPS, 1500); // 每秒生成一个数据点
    rafId.current = requestAnimationFrame(loop);
  }, []);

  const reportFrames = useCallback(() => {
    if (frameData.current.length === 0) {
      return;
    }

    const send = () => {
      const payload = {
        frames: frameData.current,
        summary: {
          avgFPS:
            frameData.current.reduce((a, b) => a + b.fps, 0) / frameData.current.length,
          maxFrameTime: Math.max(...frameData.current.map((f) => f.frameTime)),
          totalDropped: frameData.current.reduce((a, b) => a + b.droppedFrames, 0),
        },
      };
      if (onReport) {
        onReport(payload); // 触发外部回调
      }
      frameData.current = [];
    };

    requestIdleCallback(send, { timeout: 1000 }) || setTimeout(send, 0);
  }, [onReport]); // 添加 onReport 依赖

  useEffect(() => {
    if (!isEnabledSpmReporter) {
      return;
    }
    const container = scrollContainerRef.current || (window as unknown as HTMLElement);

    const handleScroll = () => {
      // const currentScroll =
      //   (container as Window).scrollY || (container as HTMLElement).scrollTop;
      const currentScroll =
        container instanceof Window ? container.scrollY : container.scrollTop;
      const scrollDelta = Math.abs(currentScroll - lastScrollPos.current);

      if (scrollDelta > 10) {
        if (!isMonitoring.current) {
          startFrameCapture();
        }

        clearTimeout(scrollDebounceTimer.current);
        scrollDebounceTimer.current = setTimeout(() => {
          stopFrameCapture();
          reportFrames();
        }, 2000);
      }

      lastScrollPos.current = currentScroll;
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
      stopFrameCapture();
    };
  }, [
    scrollContainerRef,
    startFrameCapture,
    stopFrameCapture,
    reportFrames,
    isEnabledSpmReporter,
  ]);

  return { frameData, reportFrames };
};
