import {
  getOrigin,
  useInject,
  useObserve,
  ViewInstance,
} from '@difizen/libro-common/app';
import classNames from 'classnames';
import { throttle } from 'lodash';
import type { FC, ReactNode } from 'react';
import {
  useRef,
  useCallback,
  createContext,
  useMemo,
  forwardRef,
  memo,
  useEffect,
  useState,
} from 'react';
import { createRoot } from 'react-dom/client';

import type { CellService } from '../../cell/index.js';
import { ExecutableCellModel } from '../../cell/index.js';
import { LibroCellService } from '../../cell/index.js';
import type { CellView, DndContentProps } from '../../libro-protocol.js';
import { isCellView } from '../../libro-protocol.js';
import type { LibroView } from '../../libro-view.js';
import { VirtualizedManagerHelper } from '../../virtualized-manager-helper.js';
import { LibroCellsOutputRender } from '../libro-virtualized-render.js';

import './index.less';

interface IDragContextType {
  dragOverIndex?: number;
  isDraging: boolean;
  sourceIndex?: number;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDrop: (e: React.DragEvent, index: number) => void;
  onDragEnd: (e?: React.DragEvent, index?: number) => void;
  fragFromRef: any;
}

export const DragContext = createContext<IDragContextType>({
  dragOverIndex: undefined,
  isDraging: false,
  sourceIndex: undefined,
  onDragStart: () => {
    return;
  },
  onDragOver: () => {
    return;
  },
  onDrop: () => {
    return;
  },
  onDragEnd: () => {
    return;
  },
  fragFromRef: {},
});

const MultipleImageCompnent = ({ selections }: { selections: CellView[] }) => {
  const firstCell = selections[0];
  const executable = ExecutableCellModel.is(firstCell.model);
  const executeState =
    ExecutableCellModel.is(firstCell.model) && !firstCell.model.executing
      ? firstCell.model.executeCount || ' '
      : '*';
  return (
    <div className="libro-drag-image-container">
      <div className="libro-cell-drag-image-input-container">
        {executable && (
          <pre className="libro-execute-state-tip">{`[${executeState}]:`}</pre>
        )}
        <pre className="cell-drag-image-input">
          <code>{firstCell.model.value}</code>
        </pre>
        <div className="libro-dnd-cascading-multiple-selection" />
      </div>
    </div>
  );
};

const CellImageComponent = ({ cell }: { cell: CellView }) => {
  const executable = ExecutableCellModel.is(cell.model);
  const executeState =
    ExecutableCellModel.is(cell.model) && !cell.model.executing
      ? cell.model.executeCount || ' '
      : '*';

  return (
    <div className="libro-single-drag-image-container">
      <div className="libro-cell-drag-image-input-container">
        {executable && (
          <pre className="libro-execute-state-tip">{`[${executeState}]:`}</pre>
        )}
        <pre className="cell-drag-image-input">
          <code>{cell.model.value}</code>
        </pre>
      </div>
    </div>
  );
};

export const DndCellRender: FC<DndContentProps> = memo(function DndCellRender({
  cell,
  index,
  ...props
}: DndContentProps) {
  const observableCell = useObserve(cell);
  const instance = useInject<LibroView>(ViewInstance);
  const DndCellContainer = instance.dndContentRender;

  return (
    <DndCellContainer cell={observableCell} key={cell.id} index={index} {...props} />
  );
});

// 定义一个函数用于渲染非虚拟列表时的单元格
const renderNonVirtualListCells = (cells: CellView[]) => {
  let position = -1;
  return (
    <div style={{ height: '100%', overflow: 'visible' }}>
      {cells
        // .filter((cell) => !cell.collapsedHidden)
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
    </div>
  );
};

export const DndCellsRender = forwardRef<
  HTMLDivElement,
  { libroView: LibroView; addCellButtons: ReactNode }
>(function DndCellsRender(
  { libroView, addCellButtons }: { libroView: LibroView; addCellButtons: ReactNode },
  ref,
) {
  const LoadingRender = getOrigin(libroView.loadingRender);
  const virtualizedManagerHelper = useInject(VirtualizedManagerHelper);
  const virtualizedManager = virtualizedManagerHelper.getOrCreate(libroView.model);

  const cells = libroView.model.getCells().reduce<CellView[]>(function (a, b) {
    if (a.indexOf(b) < 0) {
      a.push(b);
    }
    return a;
  }, []);

  const [isVirtualList, setIsVirtualList] = useState<boolean>(false);
  const [isJudging, setIsJudging] = useState<boolean>(true);

  useEffect(() => {
    if (!libroView.model.isInitialized) {
      return;
    }

    let size = undefined;
    let path = undefined;

    // TODO: 类型处理
    const model = libroView.model as any;
    if (model.currentFileContents && model.currentFileContents.size) {
      size = model.currentFileContents.size; // 单位 byte
      path = model.currentFileContents.path || '';
    }

    setIsJudging(true);
    virtualizedManager
      .openVirtualized(cells.length, size, path)
      .then((willOpen) => {
        setIsVirtualList(willOpen);
        return;
      })
      .catch(() => {
        setIsVirtualList(false);
      })
      .finally(() => {
        setIsJudging(false);
      })
      .catch((e) => {
        //
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [virtualizedManager, libroView.model.isInitialized]);

  const isInitialized = libroView.model.isInitialized;
  const isLoading = !isInitialized || isJudging;
  const shouldRenderCells = isInitialized && !isJudging;

  return (
    <>
      <div
        className={classNames(
          'libro-dnd-cells-container',
          isVirtualList && 'virtual_list_container',
        )}
        ref={ref}
      >
        {isLoading && <LoadingRender />}
        <>
          {shouldRenderCells && (
            <>
              {isVirtualList ? (
                <LibroCellsOutputRender
                  cells={cells}
                  libroView={libroView}
                  addCellButtons={addCellButtons}
                />
              ) : (
                renderNonVirtualListCells(cells)
              )}
            </>
          )}
        </>
      </div>
      {shouldRenderCells && !isVirtualList && addCellButtons}
    </>
  );
});

export const DndList = forwardRef<
  HTMLDivElement,
  { libroView: LibroView; children: ReactNode }
>(function DndList(
  {
    libroView,
    children,
  }: {
    libroView: LibroView;
    children: ReactNode;
  },
  ref,
) {
  const cellService = useInject<CellService>(LibroCellService);
  const [isDraging, setIsDraging] = useState<boolean>(false);
  const [dragOverIndex, setDragOverIndex] = useState<number>();
  const [sourceIndex, setSourceIndex] = useState<number>();
  const followNodeRef = useRef<HTMLDivElement>();
  const editorScrollRef = useRef<HTMLDivElement>();
  const multipleImageRef = useRef<HTMLDivElement>();
  const singleImageRef = useRef<HTMLDivElement>();
  const fragFromRef = useRef<string>('');
  useEffect(() => {
    const multipleDrag = document.getElementById('libro-multiple-drag-container');
    if (multipleDrag) {
      multipleImageRef.current = multipleDrag as HTMLDivElement;
    } else {
      multipleImageRef.current = document.createElement('div');
      multipleImageRef.current.id = 'libro-multiple-drag-container';
      document.body.appendChild(multipleImageRef.current);
    }

    const singleDrag = document.getElementById('libro-single-drag-container');
    if (singleDrag) {
      singleImageRef.current = singleDrag as HTMLDivElement;
    } else {
      singleImageRef.current = document.createElement('div');
      singleImageRef.current.id = 'libro-single-drag-container';
      document.body.appendChild(singleImageRef.current);
    }
  }, []);

  const clearSelects = useCallback(() => {
    if (libroView.model.selections.length > 0) {
      libroView.model.selections = [];
    }
  }, [libroView.model]);

  const exchangeCellIndex = useCallback(
    (sourceCellIndex: number, targetIndex: number) => {
      const sourceCellView = libroView.model.cells[sourceCellIndex];
      if (!sourceCellView) {
        return;
      }
      cellService
        .getOrCreateView(
          {
            ...sourceCellView.model.options,
            modelId: sourceCellView.model.id,
            singleSelectionDragPreview: true,
          },
          sourceCellView.parent.id,
        )
        .then((view: { dispose: () => void }) => {
          view.dispose();
          return;
        })
        .catch(() => {
          //
        });
      if (isCellView(sourceCellView)) {
        const targetCell = libroView.model.cells[targetIndex];
        if (sourceCellIndex < targetIndex) {
          libroView.model.exchangeCell(sourceCellIndex, targetIndex);
          libroView.model.scrollToView(targetCell);
        }
        if (sourceCellIndex > targetIndex) {
          libroView.model.exchangeCell(sourceCellIndex, targetIndex);
          libroView.model.scrollToView(targetCell);
        }
      }
    },
    [cellService, libroView.model],
  );

  const onDragStart = useCallback(
    async (e: React.DragEvent, sourceCellIndex: number) => {
      e.dataTransfer.setData('libro_notebook_drag_text', `${sourceCellIndex}`);
      fragFromRef.current = 'cell';
      e.dataTransfer.effectAllowed = 'move';

      const selectCells: CellView[] = libroView.model.selections;

      const childNode = (e.target as HTMLElement).parentElement?.getElementsByClassName(
        'libro-cell-input-content',
      )[0] as HTMLDivElement;

      // 多选cell拖拽排序
      const sourceCellView = libroView.model.cells[sourceCellIndex];
      if (
        selectCells.length > 0 &&
        selectCells.findIndex((selection) => selection.id === sourceCellView.id) > -1 &&
        multipleImageRef.current
      ) {
        const root = createRoot(multipleImageRef.current);
        root.render(<MultipleImageCompnent selections={selectCells} />);
        // 清除编辑器中无效元素宽度（只针对e2编辑器）
        const editorScrollNodex = childNode?.getElementsByClassName(
          'erd_scroll_detection_container',
        )[0];
        if (editorScrollNodex) {
          editorScrollRef.current = editorScrollNodex as HTMLDivElement;
          (editorScrollNodex as HTMLDivElement).style.display = 'none';
        }
        e.dataTransfer.setDragImage(multipleImageRef.current, 0, 0);
      } else {
        if (!childNode) {
          return;
        }
        // 拖拽单个cell排序
        clearSelects();
        if (childNode.clientHeight > 300) {
          followNodeRef.current = childNode;
          childNode.style.maxHeight = '300px';
          childNode.style.overflow = 'hidden';
        }

        if (singleImageRef.current) {
          const root = createRoot(singleImageRef.current);
          root.render(<CellImageComponent cell={sourceCellView} />);
          e.dataTransfer.setDragImage(singleImageRef.current, 0, 0);
        }
      }
      setSourceIndex(sourceCellIndex);
      setIsDraging(true);
    },
    [clearSelects, libroView.model.cells, libroView.model.selections],
  );

  const onDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    throttle(() => {
      setDragOverIndex(index);
    }, 1000)();
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault();
      const sourceCellIndex = e.dataTransfer.getData('libro_notebook_drag_text');
      setIsDraging(false);
      setDragOverIndex(undefined);
      setSourceIndex(undefined);
      const _sourceIndex = Number(sourceCellIndex || 0);
      if (libroView.model.selections.length > 0) {
        const sourceCellView = libroView.model.cells[_sourceIndex];
        const dropCellView = libroView.model.cells[index];
        const isDragInSelections = libroView.model.selections.some(
          (selection: { id: string }) => selection.id === sourceCellView.id,
        );
        const isDropInSelections = libroView.model.selections.some(
          (selection: { id: string }) => selection.id === dropCellView.id,
        );
        if (isDragInSelections && isDropInSelections) {
          return;
        }
        if (isDragInSelections) {
          libroView.model.exchangeCells(libroView.model.selections, index);
          libroView.model.scrollToView(dropCellView);
        }
        return;
      }
      if (_sourceIndex === index) {
        return;
      }
      exchangeCellIndex(_sourceIndex, index);
    },
    [exchangeCellIndex, libroView.model],
  );

  const onDragEnd = useCallback((e?: React.DragEvent) => {
    e?.dataTransfer.clearData();
    setIsDraging(false);
    setDragOverIndex(undefined);
    setSourceIndex(undefined);
    if (followNodeRef.current) {
      followNodeRef.current.style.maxHeight = 'unset';
      followNodeRef.current.style.overflow = 'unset';
    }
    if (editorScrollRef.current) {
      editorScrollRef.current.style.display = 'unset';
    }

    fragFromRef.current = '';
  }, []);

  const dragContextValue = useMemo(() => {
    return {
      dragOverIndex,
      isDraging,
      sourceIndex,
      onDragStart,
      onDragOver,
      onDrop,
      onDragEnd,
      fragFromRef,
    };
  }, [
    dragOverIndex,
    isDraging,
    onDragEnd,
    onDragOver,
    onDragStart,
    onDrop,
    sourceIndex,
    fragFromRef,
  ]);

  return (
    <div
      className="libro-dnd-list-container"
      onDragOver={(e) => {
        e.preventDefault();
      }}
      onDrop={(e) => {
        if (fragFromRef.current !== 'cell') {
          return;
        }
        const sourceCellIndex = e.dataTransfer.getData('libro_notebook_drag_text');
        const _sourceIndex = Number(sourceCellIndex || 0);

        const lastCell =
          libroView.model.getCells()[libroView.model.getCells().length - 1];
        const lastCellOffsetY = lastCell.container?.current?.getBoundingClientRect().y;
        if (lastCellOffsetY && e.clientY >= lastCellOffsetY) {
          e.preventDefault();
          if (_sourceIndex === undefined) {
            return;
          }
          if (libroView.model.selections.length > 0) {
            const isDragInSelections =
              libroView.model.selections.findIndex(
                (selection) =>
                  selection.id === libroView.model.getCells()[_sourceIndex].id,
              ) > -1
                ? true
                : false;
            if (isDragInSelections) {
              libroView.model.exchangeCells(
                libroView.model.selections,
                libroView.model.cells.length,
              );
              return;
            }
          }
          exchangeCellIndex(_sourceIndex, libroView.model.cells.length - 1);
        }
      }}
    >
      <DragContext.Provider value={dragContextValue}>
        <DndCellsRender libroView={libroView} addCellButtons={children} />
      </DragContext.Provider>
    </div>
  );
});
