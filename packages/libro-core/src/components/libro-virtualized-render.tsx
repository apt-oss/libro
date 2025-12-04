import { AutoSizer, List } from '@difizen/libro-virtualized';
import type { Grid } from '@difizen/libro-virtualized';
import type { ReactNode } from 'react';
import { memo, useEffect, useMemo, useRef, useState } from 'react';

import { EditorCellView } from '../cell/index.js';
import type { CellView, ScrollParams } from '../libro-protocol.js';
import type { LibroView } from '../libro-view.js';
import { useFrameMonitor } from '../utils/index.js';

import { DndCellRender } from './dnd-component/index.js';

interface LibroVirtualizedRowProps {
  style: Record<string, string>;
  cell: CellView;
}

export const LibroVirtualizedRow: React.FC<LibroVirtualizedRowProps> = memo(
  function LibroVirtualizedRow({ style, cell }: LibroVirtualizedRowProps) {
    const itemRef = useRef(null);

    // MarkDown Cell 需要隐藏其在虚拟滚动部分的占位div
    const isHidden = cell.hasInputHidden;

    return (
      <div ref={itemRef} style={{ ...style, visibility: 'hidden' }}>
        {isHidden || !cell.renderEditorIntoVirtualized || !EditorCellView.is(cell) ? (
          <></>
        ) : (
          // cell.editorView && <ViewRender view={cell.editorView} />
          cell.renderEditor && cell.renderEditor()
        )}
      </div>
    );
  },
);

// 已经在上层判断是否为虚拟滚动
export const LibroCellsOutputRender: React.FC<{
  cells: CellView[];
  libroView: LibroView;
  addCellButtons: ReactNode;
}> = ({ cells, libroView, addCellButtons }) => {
  const parentRef = useRef(null);
  const listRef = useRef<List | null>(null);
  const noEditorAreaRef = useRef<HTMLDivElement | null>(null);
  const scrollTopRef = useRef(0);
  const viewportHeightRef = useRef(0);

  const [editorsOffset, setEditorsOffset] = useState<number[]>([]);

  const editorAreaHeight = useMemo(() => {
    const inputHeight = cells.map((cell: CellView) => {
      if (cell.editorAreaHeight) {
        return cell.editorAreaHeight;
      } else {
        return 0;
      }
    });
    return inputHeight;
  }, [cells]);

  const noEditorAreaHeight = useMemo(() => {
    // 如果只有一个Cell，则它的最小高度是200，防止右侧边栏被隐藏。
    const lastCellHeight = Math.max(
      cells[cells.length - 1].noEditorAreaHeight || 0,
      120,
    );

    const outputHeight = cells.map((cell: CellView, idx: number) => {
      if (idx === cells.length - 1) {
        return lastCellHeight;
      }

      if (cell.noEditorAreaHeight) {
        return cell.noEditorAreaHeight;
      } else {
        return 0;
      }
    });

    if (addCellButtons) {
      outputHeight.push(90);
    } //

    return outputHeight;
  }, [cells, addCellButtons]);

  const totalSize = useMemo(
    () => noEditorAreaHeight.reduce((pre, cur) => pre + cur),
    [noEditorAreaHeight],
  );

  // 绘制所有的非编辑器区域
  const noEditorArea = useMemo(() => {
    let position = -1;
    return (
      <div
        style={{
          position: 'absolute',
          visibility: 'visible',
          width: '100%',
          height: '100%',
        }}
        ref={noEditorAreaRef}
      >
        {cells
          // .filter((cell) => cell.collapsedHidden === false)
          .map((cell, index) => {
            position += 1;
            if (cell.collapsedHidden) {
              return null;
            }
            return (
              <DndCellRender
                cell={cell}
                key={cell.id}
                index={index}
                position={position}
              />
            );
          })}
        {addCellButtons}
      </div>
    );
  }, [cells, addCellButtons]);

  useEffect(() => {
    if (!listRef || !listRef.current || !libroView.model) {
      return;
    }

    libroView.model.onScrollToCellView((params: ScrollParams) => {
      const index = params.cellIndex;
      const offset = params.cellOffset || 0;
      const top = (editorsOffset[index] || 0) + offset;
      const height = (noEditorAreaHeight[index] || 0) + (editorAreaHeight[index] || 0);
      const viewportTop = scrollTopRef.current;
      const viewportHeight = viewportHeightRef.current;

      if (viewportHeight && height) {
        if (top > viewportTop && top + height < viewportTop + viewportHeight) {
          // 在可视范围内就不需要滚动
          return;
        }
        if (top < viewportTop) {
          listRef.current!.scrollToCellPosition(index, offset);
        } else {
          const prevCellNoEditorHeight = noEditorAreaHeight[index - 1] || 0;
          const prevCellEditorHeight = editorAreaHeight[index - 1] || 0;
          const centerOffset =
            offset -
            viewportHeight / 2 -
            (prevCellNoEditorHeight - prevCellEditorHeight);
          listRef.current!.scrollToCellPosition(index, centerOffset); // 把目标 cell 的顶部放到视窗的中间位置
        }
      } else {
        listRef.current!.scrollToCellPosition(index, offset);
      }
    });

    return () => {
      libroView.model.disposeScrollToCellViewEmitter();
    };
  }, [listRef, libroView, editorsOffset, noEditorAreaHeight, editorAreaHeight]);

  // 在Cell的高度变化时，触发重新计算所有Cell的高度偏移值
  useEffect(() => {
    if (!noEditorAreaRef.current) {
      return;
    }

    const newCellOffsets: number[] = [];
    const childNum = noEditorAreaRef.current.childNodes.length || 0;
    noEditorAreaRef.current.childNodes.forEach((child, index) => {
      // 最后一个child元素是 addCellButtons
      if (index === childNum - 1) {
        return;
      }

      const offsetTop = (child as HTMLDivElement).offsetTop;

      let offset = 0;
      if (cells[index].calcEditorOffset) {
        offset += cells[index].calcEditorOffset!();
      }

      newCellOffsets[index] = offsetTop + offset;
    });

    setEditorsOffset(newCellOffsets);
  }, [cells]);

  useFrameMonitor(
    {
      current: listRef.current?.Grid?._scrollingContainer,
    },
    libroView.libroViewTracker.isEnabledSpmReporter,
    (payload) => {
      const fpsTracker = libroView.libroViewTracker.getOrCreateTrackers({
        type: 'fps',
        id: libroView.model.options['modelId'] + 'fps',
      });
      fpsTracker['avgFPS'] = payload.summary.avgFPS;
      fpsTracker['maxFrameTime'] = payload.summary.maxFrameTime;
      fpsTracker['totalDropped'] = payload.summary.totalDropped;
      fpsTracker['extra'] = payload.frames;
      fpsTracker['cells'] = libroView.model.cells.length;
      fpsTracker['size'] = libroView.model.currentFileContents?.size;
      libroView.libroViewTracker.tracker(fpsTracker);
    },
  );

  return (
    <AutoSizer style={{ height: '100%', width: '100%' }} ref={parentRef}>
      {({ width, height }: { width: number; height: number }) => {
        viewportHeightRef.current = height;
        return (
          <List
            ref={listRef}
            width={width}
            height={height}
            rowCount={cells.length}
            rowHeight={50}
            // rowHeight={getOrCreateCache(libroView.id).rowHeight}
            rowRenderer={({ key, index, style }: any) => (
              <LibroVirtualizedRow key={key} style={style} cell={cells[index]} />
            )}
            cellsHeight={noEditorAreaHeight}
            totalSize={totalSize}
            editorAreaHeight={editorAreaHeight}
            noEditorArea={noEditorArea}
            editorsOffset={editorsOffset}
            onScroll={(scrollParams: {
              clientHeight: number;
              scrollHeight: number;
              scrollTop: number;
              scrollingContainer: Element;
            }) => {
              scrollTopRef.current = scrollParams.scrollTop;
              viewportHeightRef.current = scrollParams.clientHeight;
              libroView.cellScrollEmitter.fire({
                scrollingContainer: scrollParams.scrollingContainer,
                scrollTop: scrollParams.scrollTop,
              });
            }}
            onGridRendered={(Grid: Grid) => {
              libroView.virtualizedGridRenderedEmitter.fire(Grid);
            }}
          />
        );
      }}
    </AutoSizer>
  );
};
