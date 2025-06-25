/* eslint-disable @typescript-eslint/no-non-null-assertion */
import classnames from 'classnames';
import * as React from 'react';

import { defaultPrefixCls } from '../constant.js';
import type { Layout } from '../layout/layout.js';

export const RESIZE_LOCK = 'resize-lock';
import './styles/index.less';

/**
 * 定义在flex模式下，setSize作用于哪一个元素
 * prev表示前一个元素
 * next表示后一个元素
 */
export enum ResizeFlexMode {
  Prev = 'prev',
  Next = 'next',
}

export interface ResizeHandleProps {
  prefixCls?: string | undefined;
  onFinished?: undefined | (() => void);
  onResize: undefined | ((prevElement: HTMLElement, nextElement: HTMLElement) => void);
  max?: number | undefined;
  min?: number | undefined;
  preserve?: number | undefined;
  className?: string | undefined;
  noColor?: boolean | undefined;
  delegate?: undefined | ((delegate: IResizeHandleDelegate) => void);
  findPrevElement?: undefined | ((direction?: boolean) => HTMLElement | undefined);
  findNextElement?: undefined | ((direction?: boolean) => HTMLElement | undefined);
  /**
   * 使用直接的size指定目标，不使用百分比
   * 传入值表示setSize的作用模式
   */
  flexMode?: ResizeFlexMode | undefined;
  direction: Layout.direction | undefined;
}

export interface IResizeHandleDelegate {
  setSize: (prev: number, next: number) => void;
  setRelativeSize: (prev: number, next: number) => void;
  getRelativeSize: () => number[];
  setAbsoluteSize: (size: number, isLatter?: boolean, keep?: boolean) => void;
  getAbsoluteSize: (isLatter?: boolean) => number;
}

function preventWebviewCatchMouseEvents() {
  const iframes = document.getElementsByTagName('iframe');
  const webviews = document.getElementsByTagName('webview');
  for (const webview of webviews as unknown as HTMLElement[]) {
    webview.classList.add('none-pointer-event');
  }
  for (const iframe of iframes as unknown as HTMLIFrameElement[]) {
    iframe.classList.add('none-pointer-event');
  }

  const shadowRootHost = document.getElementsByClassName('shadow-root-host');
  for (const host of shadowRootHost as unknown as HTMLElement[]) {
    host?.classList.add('none-pointer-event');
  }
}

function allowWebviewCatchMouseEvents() {
  const iframes = document.getElementsByTagName('iframe');
  const webviews = document.getElementsByTagName('webview');
  for (const webview of webviews as any) {
    webview.classList.remove('none-pointer-event');
  }
  for (const iframe of iframes as any) {
    iframe.classList.remove('none-pointer-event');
  }

  const shadowRootHost = document.getElementsByClassName('shadow-root-host');
  for (const host of shadowRootHost as unknown as HTMLElement[]) {
    host?.classList.remove('none-pointer-event');
  }
}

export const ResizeHandleHorizontal = (props: ResizeHandleProps) => {
  const prefixCls = props.prefixCls ?? defaultPrefixCls;
  const resizePrefix = `${prefixCls}-resize`;
  const ref = React.useRef<HTMLElement | null>();
  const resizing = React.useRef<boolean>(false);
  const startX = React.useRef<number>(0);
  const startPrevWidth = React.useRef<number>(0);
  const startNextWidth = React.useRef<number>(0);
  const prevElement = React.useRef<HTMLElement | null>();
  const nextElement = React.useRef<HTMLElement | null>();
  const requestFrame = React.useRef<number>();

  const setSize = (prev: number, next: number) => {
    const parentWidth = ref.current!.parentElement!.offsetWidth;
    const prevEle = props.findPrevElement
      ? props.findPrevElement()
      : prevElement.current!;
    const nextEle = props.findNextElement
      ? props.findNextElement()
      : nextElement.current!;
    if (
      (prevEle && prevEle.classList.contains(RESIZE_LOCK)) ||
      (nextEle && nextEle.classList.contains(RESIZE_LOCK))
    ) {
      return;
    }
    const prevMinResize = Number(prevEle!.dataset['minResize'] || 0);
    const nextMinResize = Number(nextEle!.dataset['minResize'] || 0);
    if (prevMinResize || nextMinResize) {
      if (prev * parentWidth <= prevMinResize || next * parentWidth <= nextMinResize) {
        return;
      }
    }
    if (nextEle) {
      nextEle.style.width = `${next * 100}%`;
    }
    if (prevEle) {
      prevEle.style.width = `${prev * 100}%`;
    }
    if (props.onResize && nextEle && prevEle) {
      props.onResize(prevEle, nextEle);
    }
  };

  const flexModeSetSize = (
    prevWidth: number,
    nextWidth: number,
    ignoreMin?: boolean,
    direction?: boolean,
  ) => {
    const prevEle = props.findPrevElement
      ? props.findPrevElement(direction)
      : prevElement.current!;
    const nextEle = props.findNextElement
      ? props.findNextElement(direction)
      : nextElement.current!;
    let fixedElement: HTMLElement;
    let flexElement: HTMLElement;
    let targetFixedWidth = 0;
    const prevMinResize = parseInt(prevEle!.dataset['minResize'] || '0', 10);
    const nextMinResize = parseInt(nextEle!.dataset['minResize'] || '0', 10);
    if (props.flexMode === ResizeFlexMode.Prev) {
      fixedElement = prevEle!;
      flexElement = nextEle!;
      targetFixedWidth = prevWidth;
      if (!ignoreMin) {
        if (prevMinResize > prevWidth) {
          targetFixedWidth = prevMinResize;
        } else if (nextMinResize > nextWidth) {
          targetFixedWidth = prevWidth + nextWidth - nextMinResize;
        }
      }
    } else {
      fixedElement = nextEle!;
      flexElement = prevEle!;
      targetFixedWidth = nextWidth;
      if (!ignoreMin) {
        if (nextMinResize > nextWidth) {
          targetFixedWidth = nextMinResize;
        } else if (prevMinResize > prevWidth) {
          targetFixedWidth = prevWidth + nextWidth - prevMinResize;
        }
      }
    }

    fixedElement.style.width = `${targetFixedWidth}px`;
    fixedElement.style.flexGrow = '0';
    fixedElement.style.flexShrink = '1';

    flexElement.style.width = '0';
    flexElement.style.flexGrow = '1';
    flexElement.style.flexShrink = '0';

    if (props.onResize && nextEle && prevEle) {
      props.onResize(prevEle, nextEle);
    }
  };

  /**
   * 处理存在置0的情况
   */
  const handleZeroSize = (prev: number, next: number) => {
    // 对于设置为0的情况，一般认为是会需要完全隐藏对应元素，并且当前handle变为不可用
    const prevEle = prevElement.current!;
    const nextEle = nextElement.current!;
    let hasZero = false;
    if (prevEle) {
      if (prev === 0) {
        prevEle.classList.add('kt_display_none');
        hasZero = true;
      } else {
        prevEle.classList.remove('kt_display_none');
      }
    }
    if (nextEle) {
      if (next === 0) {
        nextEle.classList.add('kt_display_none');
        hasZero = true;
      } else {
        nextEle.classList.remove('kt_display_none');
      }
    }
    if (ref.current) {
      if (hasZero) {
        ref.current.classList.add('none-pointer-event');
      } else {
        ref.current.classList.remove('none-pointer-event');
      }
    }
  };

  const setRelativeSize = (prev: number, next: number) => {
    const prevEle = prevElement.current!;
    const nextEle = nextElement.current!;
    let currentTotalWidth: number;
    if (props.flexMode) {
      currentTotalWidth =
        ((prevEle.offsetWidth + nextEle.offsetWidth) /
          prevEle.parentElement!.offsetWidth) *
        100;
    } else {
      currentTotalWidth =
        +nextElement.current!.style.width!.replace('%', '') +
        +prevElement.current!.style.width!.replace('%', '');
    }

    if (nextEle) {
      nextEle.style.width = `${(next / (prev + next)) * currentTotalWidth}%`;
    }
    if (prevEle) {
      prevEle.style.width = `${(prev / (prev + next)) * currentTotalWidth}%`;
    }
    handleZeroSize(prev, next);

    if (props.onResize && nextEle && prevEle) {
      props.onResize(prevEle, nextEle);
    }
  };

  const getRelativeSize = () => {
    const currentPrev = prevElement.current!.clientWidth;
    const currentNext = nextElement.current!.clientWidth;
    const totalSize = currentPrev + currentNext;
    const relativeSizes: number[] = [];
    relativeSizes.push(currentPrev / totalSize);
    relativeSizes.push(currentNext / totalSize);
    return relativeSizes;
  };

  const setAbsoluteSize = (size: number, isLatter?: boolean) => {
    const currentPrev = prevElement.current!.clientWidth;
    const currentNext = nextElement.current!.clientWidth;
    const totalSize = currentPrev + currentNext;
    if (props.flexMode) {
      const prevWidth =
        props.flexMode === ResizeFlexMode.Prev ? size : totalSize - size;
      const nextWidth =
        props.flexMode === ResizeFlexMode.Next ? size : totalSize - size;
      flexModeSetSize(prevWidth, nextWidth, true);
    } else {
      const currentTotalWidth =
        +nextElement.current!.style.width!.replace('%', '') +
        +prevElement.current!.style.width!.replace('%', '');
      if (isLatter) {
        nextElement.current!.style.width = `${currentTotalWidth * (size / totalSize)}%`;
        prevElement.current!.style.width = `${
          currentTotalWidth * (1 - size / totalSize)
        }%`;
      } else {
        prevElement.current!.style.width = `${currentTotalWidth * (size / totalSize)}%`;
        nextElement.current!.style.width = `${
          currentTotalWidth * (1 - size / totalSize)
        }%`;
      }
    }
    if (isLatter) {
      handleZeroSize(totalSize - size, size);
    } else {
      handleZeroSize(size, totalSize - size);
    }
    if (props.onResize) {
      props.onResize(prevElement.current!, nextElement.current!);
    }
  };

  const getAbsoluteSize = (isLatter?: boolean) => {
    if (isLatter) {
      return nextElement.current!.clientWidth;
    }
    return prevElement.current!.clientWidth;
  };

  const hideScrollBar = (element: HTMLElement) => {
    const elementClasses = element.classList;
    const hiddenClass = `${resizePrefix}-overflow-hidden`;
    if (!elementClasses?.contains(hiddenClass)) {
      elementClasses.add(hiddenClass);
    }
  };

  const restoreScrollBar = (element: HTMLElement) => {
    const elementClasses = element.classList;
    const hiddenClass = `${resizePrefix}-overflow-hidden`;
    if (elementClasses?.contains(hiddenClass)) {
      elementClasses.remove(hiddenClass);
    }
  };

  const onMouseMove = (e: MouseEvent) => {
    e.preventDefault();
    if (ref.current && ref.current.classList.contains('no-resize')) {
      return;
    }

    let prevWidth: number;
    let nextWidth: number;
    const moveDistance = e.pageX - startX.current;

    if (props.direction === 'right-to-left') {
      // 反向时位置对调 prev在后 next在前
      prevWidth = startPrevWidth.current - moveDistance;
      nextWidth = startNextWidth.current + moveDistance;
    } else {
      prevWidth = startPrevWidth.current + moveDistance;
      nextWidth = startNextWidth.current - moveDistance;
    }
    if (requestFrame.current) {
      window.cancelAnimationFrame(requestFrame.current);
    }
    const parentWidth = ref.current!.parentElement!.offsetWidth;
    requestFrame.current = window.requestAnimationFrame(() => {
      if (props.flexMode) {
        flexModeSetSize(prevWidth, nextWidth);
      } else {
        setSize(prevWidth / parentWidth, nextWidth / parentWidth);
      }
    });
  };
  const onMouseUp = () => {
    resizing.current = false;
    ref.current?.classList.remove(`${resizePrefix}-active`);
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    // 结束拖拽时恢复拖拽区域滚动条
    restoreScrollBar(prevElement.current!);
    restoreScrollBar(nextElement.current!);
    if (props.onFinished) {
      props.onFinished();
    }
    allowWebviewCatchMouseEvents();
  };
  const onMouseDown = (e: MouseEvent) => {
    resizing.current = true;
    ref.current?.classList.add(`${resizePrefix}-active`);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    startX.current = e.pageX;
    startPrevWidth.current = prevElement.current!.offsetWidth;
    startNextWidth.current = nextElement.current!.offsetWidth;
    // 开始拖拽时隐藏拖拽区域滚动条
    hideScrollBar(prevElement.current!);
    hideScrollBar(nextElement.current!);
    preventWebviewCatchMouseEvents();
  };

  React.useEffect(() => {
    if (ref.current) {
      ref.current.addEventListener('mousedown', onMouseDown);
      prevElement.current = ref.current.previousSibling as HTMLElement;
      nextElement.current = ref.current.nextSibling as HTMLElement;
    }

    return () => {
      if (ref.current) {
        ref.current.removeEventListener('mousedown', onMouseDown);
        ref.current.removeEventListener('mousemove', onMouseMove);
        ref.current.removeEventListener('mouseup', onMouseUp);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (props.delegate) {
    props.delegate({
      setSize,
      setAbsoluteSize,
      getAbsoluteSize,
      setRelativeSize,
      getRelativeSize,
    });
  }

  return (
    <div
      ref={(e) => {
        ref.current = e;
      }}
      className={classnames({
        [`${resizePrefix}-handle-horizontal`]: true,
        [`${resizePrefix}-with-color`]: !props.noColor,
        [props.className || '']: true,
      })}
    />
  );
};

export const ResizeHandleVertical = (props: ResizeHandleProps) => {
  const prefixCls = props.prefixCls ?? defaultPrefixCls;
  const resizePrefix = `${prefixCls}-resize`;
  const ref = React.useRef<HTMLElement>();
  const resizing = React.useRef<boolean>(false);
  const startY = React.useRef<number>(0);
  // const startHeight = React.useRef<number>(0);
  const startPrevHeight = React.useRef<number>(0);
  const startNextHeight = React.useRef<number>(0);
  const prevElement = React.useRef<HTMLElement>();
  const nextElement = React.useRef<HTMLElement>();

  const cachedPrevElement = React.useRef<HTMLElement>();
  const cachedNextElement = React.useRef<HTMLElement>();

  const requestFrame = React.useRef<number>();
  // direction: true为向下，false为向上
  const setSize = (prev: number, next: number, direction?: boolean) => {
    const prevEle = props.findPrevElement
      ? props.findPrevElement(direction)
      : prevElement.current!;
    const nextEle = props.findNextElement
      ? props.findNextElement(direction)
      : nextElement.current!;
    if (!nextEle || !prevEle) {
      return;
    }
    if (
      prevEle.classList.contains(RESIZE_LOCK) ||
      nextEle.classList.contains(RESIZE_LOCK)
    ) {
      return;
    }
    nextEle.style.height = `${next * 100}%`;
    prevEle.style.height = `${prev * 100}%`;
    if (props.onResize) {
      props.onResize(prevEle, nextEle);
    }
  };

  const flexModeSetSize = (
    prevHeight: number,
    nextHeight: number,
    ignoreMin?: boolean,
    direction?: boolean,
  ) => {
    const prevEle = props.findPrevElement
      ? props.findPrevElement(direction)
      : prevElement.current!;
    const nextEle = props.findNextElement
      ? props.findNextElement(direction)
      : nextElement.current!;
    let fixedElement: HTMLElement;
    let flexElement: HTMLElement;
    let targetFixedHeight = 0;
    const prevMinResize = parseFloat(prevEle!.dataset['minResize'] || '0');
    const nextMinResize = parseFloat(nextEle!.dataset['minResize'] || '0');
    if (props.flexMode === ResizeFlexMode.Prev) {
      fixedElement = prevEle!;
      flexElement = nextEle!;
      targetFixedHeight = prevHeight;
      if (!ignoreMin) {
        if (prevMinResize > prevHeight) {
          targetFixedHeight = prevMinResize;
        } else if (nextMinResize > nextHeight) {
          targetFixedHeight = prevHeight + nextHeight - nextMinResize;
        }
      }
    } else {
      fixedElement = nextEle!;
      flexElement = prevEle!;
      targetFixedHeight = nextHeight;
      if (!ignoreMin) {
        if (nextMinResize > nextHeight) {
          targetFixedHeight = nextMinResize;
        } else if (prevMinResize > prevHeight) {
          targetFixedHeight = prevHeight + nextHeight - prevMinResize;
        }
      }
    }

    fixedElement.style.height = `${targetFixedHeight}px`;
    fixedElement.style.flexGrow = '0';
    fixedElement.style.flexShrink = '1';

    flexElement.style.height = '0';
    flexElement.style.flexGrow = '1';
    flexElement.style.flexShrink = '0';

    if (props.onResize && nextEle && prevEle) {
      props.onResize(prevEle, nextEle);
    }
  };

  /**
   * 处理存在置0的情况
   */
  const handleZeroSize = (prev: number, next: number) => {
    // 对于设置为0的情况，一般认为是会需要完全隐藏对应元素，并且当前handle变为不可用
    const prevEle = prevElement.current!;
    const nextEle = nextElement.current!;
    let hasZero = false;
    if (prevEle) {
      if (prev === 0) {
        prevEle.classList.add('kt_display_none');
        hasZero = true;
      } else {
        prevEle.classList.remove('kt_display_none');
      }
    }
    if (nextEle) {
      if (next === 0) {
        nextEle.classList.add('kt_display_none');
        hasZero = true;
      } else {
        nextEle.classList.remove('kt_display_none');
      }
    }
    if (ref.current) {
      if (hasZero) {
        ref.current.classList.add('none-pointer-event');
      } else {
        ref.current.classList.remove('none-pointer-event');
      }
    }
  };

  const setRelativeSize = (prev: number, next: number) => {
    const prevEle = prevElement.current!;
    const nextEle = nextElement.current!;
    let currentTotalHeight;
    if (props.flexMode) {
      currentTotalHeight =
        ((prevEle.offsetHeight + nextEle.offsetHeight) /
          prevEle.parentElement!.offsetHeight) *
        100;
      // flexModeSetSize(prev / (prev + next) * totalHeight, next / (prev + next) * totalHeight, true);
    } else {
      currentTotalHeight =
        +nextEle.style.height!.replace('%', '') +
        +prevEle.style.height!.replace('%', '');
    }
    if (nextEle) {
      nextEle.style.height = `${(next / (prev + next)) * currentTotalHeight}%`;
    }
    if (prevEle) {
      prevEle.style.height = `${(prev / (prev + next)) * currentTotalHeight}%`;
    }

    handleZeroSize(prev, next);
    if (props.onResize && nextEle && prevEle) {
      props.onResize(prevEle, nextEle);
    }
  };

  const getRelativeSize = () => {
    const currentPrev = prevElement.current!.clientHeight;
    const currentNext = nextElement.current!.clientHeight;
    const totalSize = currentPrev + currentNext;
    const relativeSizes: number[] = [];
    relativeSizes.push(currentPrev / totalSize);
    relativeSizes.push(currentNext / totalSize);
    return relativeSizes;
  };

  const setDomSize = (
    prev: number,
    next: number,
    prevEle: HTMLElement,
    nextEle: HTMLElement,
  ) => {
    if (
      prevEle.classList.contains(RESIZE_LOCK) ||
      nextEle.classList.contains(RESIZE_LOCK)
    ) {
      return;
    }
    // 有固定尺寸时删除flex属性
    nextEle.style.height = `${next}px`;
    prevEle.style.height = `${prev}px`;
    nextEle.style.flex = 'unset';
    prevEle.style.flex = 'unset';
    if (props.onResize && nextEle && prevEle) {
      props.onResize(prevEle, nextEle);
    }
  };

  // keep = true 左右侧面板使用，保证相邻节点的总宽度不变
  const setAbsoluteSize = (size: number, isLatter?: boolean, keep?: boolean) => {
    const currentPrev = prevElement.current!.clientHeight;
    const currentNext = nextElement.current!.clientHeight;
    const totalSize = currentPrev + currentNext;
    if (props.flexMode) {
      const prevHeight =
        props.flexMode === ResizeFlexMode.Prev ? size : totalSize - size;
      const nextHeight =
        props.flexMode === ResizeFlexMode.Next ? size : totalSize - size;
      flexModeSetSize(prevHeight, nextHeight, true);
    } else {
      // eslint-disable-next-line no-useless-escape
      const nextH = +nextElement.current!.style.height!.replace(/\%|px/, '');
      // eslint-disable-next-line no-useless-escape
      const prevH = +prevElement.current!.style.height!.replace(/\%|px/, '');
      const currentTotalHeight = nextH + prevH;
      if (isLatter) {
        if (keep) {
          prevElement.current!.style.height = `${
            currentTotalHeight * (1 - size / totalSize)
          }%`;
        }
        const targetSize = currentTotalHeight * (size / totalSize);
        nextElement.current!.style.height =
          targetSize === 0 ? `${targetSize}px` : `${targetSize}%`;
      } else {
        prevElement.current!.style.height = `${
          currentTotalHeight * (size / totalSize)
        }%`;
        if (keep) {
          nextElement.current!.style.height = `${
            currentTotalHeight * (1 - size / totalSize)
          }%`;
        }
      }
    }
    if (isLatter) {
      handleZeroSize(totalSize - size, size);
    } else {
      handleZeroSize(size, totalSize - size);
    }
    if (props.onResize) {
      props.onResize(prevElement.current!, nextElement.current!);
    }
  };

  const getAbsoluteSize = (isLatter?: boolean) => {
    if (isLatter) {
      return nextElement.current!.clientHeight;
    }
    return prevElement.current!.clientHeight;
  };

  const onMouseMove = (e: MouseEvent) => {
    e.preventDefault();
    if (ref.current && ref.current.classList.contains('no-resize')) {
      return;
    }
    const direction = e.pageY > startY.current;
    // 若上层未传入findNextElement，dynamicNext为null，否则找不到符合要求的panel时返回undefined
    const dynamicNext = props.findNextElement ? props.findNextElement(direction) : null;
    const dynamicPrev = props.findPrevElement ? props.findPrevElement(direction) : null;
    // 作用元素变化重新初始化当前位置，传入findNextElement时默认已传入findPrevElement
    if (
      (dynamicNext !== null && cachedNextElement.current !== dynamicNext) ||
      (dynamicPrev !== null && cachedPrevElement.current !== dynamicPrev)
    ) {
      if (!dynamicNext || !dynamicPrev) {
        return;
      }
      cachedNextElement.current = dynamicNext!;
      cachedPrevElement.current = dynamicPrev!;
      startY.current = e.pageY;
      startPrevHeight.current = cachedPrevElement.current!.offsetHeight;
      startNextHeight.current = cachedNextElement.current!.offsetHeight;
    }

    let prevHeight: number;
    let nextHeight: number;
    const moveDistance = e.pageY - startY.current;

    if (props.direction === 'bottom-to-top') {
      // 反向时位置对调 prev在下 next在上
      prevHeight = startPrevHeight.current - moveDistance;
      nextHeight = startNextHeight.current + moveDistance;
    } else {
      prevHeight = startPrevHeight.current + moveDistance;
      nextHeight = startNextHeight.current - moveDistance;
    }

    if (requestFrame.current) {
      window.cancelAnimationFrame(requestFrame.current);
    }
    requestFrame.current = window.requestAnimationFrame(() => {
      const prevMinResize = parseFloat(
        cachedPrevElement.current!.dataset['minResize'] || '0',
      );
      const nextMinResize = parseFloat(
        cachedNextElement.current!.dataset['minResize'] || '0',
      );
      if (prevMinResize || nextMinResize) {
        if (prevHeight <= prevMinResize || nextHeight <= nextMinResize) {
          return;
        }
      }
      if (props.flexMode) {
        flexModeSetSize(prevHeight, nextHeight);
      } else {
        setDomSize(
          prevHeight,
          nextHeight,
          cachedPrevElement.current!,
          cachedNextElement.current!,
        );
      }
    });
  };

  const onMouseUp = () => {
    resizing.current = false;
    ref.current?.classList.remove(`${resizePrefix}-active`);
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    if (props.onFinished) {
      props.onFinished();
    }
    allowWebviewCatchMouseEvents();
  };

  const onMouseDown = (e: MouseEvent) => {
    resizing.current = true;
    ref.current?.classList.add(`${resizePrefix}-active`);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    startY.current = e.pageY;
    cachedNextElement.current = nextElement.current;
    cachedPrevElement.current = prevElement.current;
    startPrevHeight.current = prevElement.current!.offsetHeight;
    startNextHeight.current = nextElement.current!.offsetHeight;
    preventWebviewCatchMouseEvents();
  };

  React.useEffect(() => {
    ref.current!.addEventListener('mousedown', onMouseDown);
    prevElement.current = ref.current!.previousSibling as HTMLElement;
    nextElement.current = ref.current!.nextSibling as HTMLElement;
    return () => {
      ref.current!.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (props.delegate) {
    props.delegate({
      setSize,
      setAbsoluteSize,
      getAbsoluteSize,
      setRelativeSize,
      getRelativeSize,
    });
  }

  return (
    <div
      ref={(e) => e && (ref.current = e)}
      className={classnames({
        [`${resizePrefix}-handle-vertical`]: true,
        [props.className || '']: true,
        [`${resizePrefix}-with-color`]: !props.noColor,
      })}
    />
  );
};
