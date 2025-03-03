import type { LibroView } from '@difizen/libro-jupyter';
import {
  ExecutableCellView,
  LibroService,
  CellCollapsible,
  ArrowDown,
  ArrowRight,
  PlusOutlined,
} from '@difizen/libro-jupyter';
import {
  BaseView,
  inject,
  prop,
  transient,
  useInject,
  view,
  ViewInstance,
  ViewOption,
  ViewRender,
} from '@difizen/libro-common/app';
import { l10n } from '@difizen/libro-common/l10n';
import type { RadioChangeEvent } from 'antd';
import { Radio, Button } from 'antd';
import type { ReactElement } from 'react';
import { forwardRef } from 'react';
import './index.less';

export const AppViewComponent = forwardRef(function LibroAppComponent() {
  const instance = useInject<LibroAppView>(ViewInstance);

  if (!instance.libroView || !instance.libroView.view) {
    return null;
  }

  const handleSizeChange = (e: RadioChangeEvent) => {
    instance.mode = e.target.value;
  };
  let children: ReactElement | null = null;
  if (instance.mode === 'notebook') {
    children = instance.libroView ? (
      <ViewRender view={instance.libroView}></ViewRender>
    ) : null;
  } else {
    children = (
      <div className="libro-app-cell-list">
        {instance.libroView?.model.cells.map((cell) => {
          if (cell.collapsedHidden) {
            return null;
          }
          if (ExecutableCellView.is(cell)) {
            return <ViewRender view={cell.outputArea} key={cell.id}></ViewRender>;
          } else {
            const isCollapsible = CellCollapsible.is(cell);
            return (
              <>
                {instance.libroView?.collapserVisible && isCollapsible && (
                  <div className="libro-app-cell-container">
                    <div
                      className="libro-markdown-collapser"
                      onClick={() => {
                        instance.libroView?.collapseCell(cell, !cell.headingCollapsed);
                      }}
                    >
                      {cell.headingCollapsed ? <ArrowRight /> : <ArrowDown />}
                    </div>
                    <ViewRender view={cell}></ViewRender>
                    {isCollapsible &&
                      cell.headingCollapsed &&
                      cell.collapsibleChildNumber > 0 && (
                        <div className="libro-cell-collapsed-expander">
                          <Button
                            className="libro-cell-expand-button"
                            onClick={() =>
                              instance.libroView?.collapseCell(cell, false)
                            }
                            icon={<PlusOutlined className="" />}
                            type="default"
                          >
                            {cell.collapsibleChildNumber} cell hidden
                          </Button>
                        </div>
                      )}
                  </div>
                )}
              </>
            );
          }
        })}
      </div>
    );
  }
  return (
    <div className="libro-app-container">
      <div className="libro-app-container-header">
        <Radio.Group value={instance.mode} onChange={handleSizeChange}>
          <Radio.Button value="app">{l10n.t('报告预览')}</Radio.Button>
          <Radio.Button value="notebook">notebook</Radio.Button>
        </Radio.Group>
      </div>
      <div className="libro-app-container-content">{children}</div>
    </div>
  );
});

@transient()
@view('libro-app')
export class LibroAppView extends BaseView {
  @inject(LibroService) protected libroService: LibroService;
  override view = AppViewComponent;

  @prop() libroView?: LibroView;
  path: string;

  @prop()
  mode = 'app';

  constructor(@inject(ViewOption) options: { path: string }) {
    super();
    this.path = options.path;
  }

  override onViewMount(): void {
    this.getOrCreateLibroView();
  }

  protected async getOrCreateLibroView() {
    const libroView = await this.libroService.getOrCreateView({
      id: this.path,
      resource: this.path,
    });
    if (!libroView) {
      return;
    }
    libroView.model.cellsEditable = false;
    libroView.model.runnable = false;
    libroView.model.inputEditable = false;
    libroView.model.outputEditable = false;
    libroView.model.savable = false;
    this.libroView = libroView;
    await this.libroView.initialized;
  }
}
