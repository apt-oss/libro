/* eslint-disable @typescript-eslint/unified-signatures */
import * as React from 'react';

import { Disposable, DisposableCollection } from '../../common/index.js';
import { inject, transient } from '../../ioc/index.js';
import {
  equals,
  getOrigin,
  Notifier,
  prop,
  useInject,
} from '../../observable/index.js';

import { view } from './decorator.js';
import { BaseView } from './default-view.js';
import { NavigatableView } from './navigatable-types.js';
import { renderNode } from './utils.js';
import { ViewManager } from './view-manager.js';
import { ViewOption, ViewInstance } from './view-protocol.js';
import type {
  SlotView,
  StatefulView,
  ViewOpenOption,
  ViewComponent,
  SlotViewOption,
  View,
} from './view-protocol.js';
import { ViewRender } from './view-render.js';

export const DefaultSlotViewId = 'default-slot-view';

export const DefaultSlotViewComponent: React.FC = () => {
  const layout = useInject<DefaultSlotView>(ViewInstance);
  const activeView = layout.children.find(
    (item) => layout.active && equals(item, layout.active),
  );
  if (activeView) {
    return <ViewRender view={activeView} />;
  }
  return <></>;
};

type NavigateHistory = {
  uri: string;
  view: NavigatableView;
  openOptions?: ViewOpenOption | undefined;
}[];

@transient()
@view(DefaultSlotViewId)
export class DefaultSlotView extends BaseView implements SlotView, StatefulView {
  protected viewOpenOptions = new Map<View, ViewOpenOption | undefined>();
  protected viewRemoveDispose = new Map<View, Disposable>();

  @prop()
  children: View[] = [];

  @prop()
  active?: View | undefined;

  get onActiveChange() {
    return Notifier.toEvent(this, 'active');
  }

  @prop()
  slots: string[] = [];

  protected navigatable = true;

  protected navigateHistory: NavigateHistory = [];

  protected sort?: boolean | undefined;

  protected option: SlotViewOption | undefined;

  protected viewManager!: ViewManager;

  override label: React.ReactNode | string = null;

  override view: ViewComponent = DefaultSlotViewComponent;

  constructor(
    @inject(ViewOption) option: SlotViewOption | undefined,
    @inject(ViewManager) viewManager: ViewManager,
  ) {
    super();
    this.viewManager = viewManager;
    this.option = option;
    this.id = `slot-${this.id}`;
    this.sort = option?.sort;
    if (option?.className) {
      this.className = option.className;
    }
  }
  storeState(): Record<string, any> | undefined {
    return {
      active: this.active ? this.viewManager.getViewKey(this.active) : undefined,
    };
  }
  restoreState(oldState: Record<string, any>): void {
    const activeKey = oldState['active'];
    if (activeKey) {
      const option = this.viewManager.fromKey(activeKey);
      this.viewManager
        .getOrCreateView(option.factoryId, option.options)
        .then((activeView) => {
          if (activeView) {
            this.active = activeView;
          }
          return;
        })
        .catch((_e) => {
          //
        });
    }
  }

  contains(instanceOrId: View | string) {
    if (typeof instanceOrId === 'string') {
      return !!this.children.find((item) => item.id === instanceOrId);
    }
    return !!this.children.find((item) => equals(item, instanceOrId));
  }

  async addView(viewInstance: View, option?: ViewOpenOption): Promise<Disposable> {
    const toDispose = new DisposableCollection();
    if (!this.contains(viewInstance)) {
      this.children.push(getOrigin(viewInstance));
      this.setViewOption(viewInstance, option);
      if (this.sort) {
        this.children = this.children.sort((a, b) => this.compare(a, b));
      }
      viewInstance.isAttached = true;
      const remove = () => {
        this.doRemoveView(viewInstance);
      };
      const disposable = viewInstance.onDisposed(remove);
      toDispose.push(disposable);
      toDispose.push(Disposable.create(remove));
      this.viewRemoveDispose.set(viewInstance, toDispose);
    }
    this.handleViewOpen(viewInstance, option);
    this.handleNavigatePush(viewInstance, option);
    return toDispose;
  }

  protected compare(a: View, b: View) {
    const aOrder = this.getViewOption(a)?.order || a.id || '';
    const bOrder = this.getViewOption(b)?.order || b.id || '';
    return aOrder.localeCompare(bOrder);
  }

  protected doRemoveView(viewInstance: View): void {
    const currentIndex = this.children.findIndex((item) => equals(item, viewInstance));
    if (currentIndex > -1) {
      this.children.splice(currentIndex, 1);
      this.viewOpenOptions.delete(viewInstance);
      viewInstance.isAttached = false;
      this.handleNavigateRevert(viewInstance);
    }
  }
  removeView(viewInstance: View): void {
    this.viewRemoveDispose.get(viewInstance)?.dispose();
    this.viewRemoveDispose.delete(viewInstance);
  }

  protected handleViewOpen(instance: View, option: ViewOpenOption = { reveal: true }) {
    if (option?.reveal) {
      this.active = instance;
    }
  }

  handleNavigatePush(viewInstance: View, openOptions?: ViewOpenOption) {
    if (this.navigatable && NavigatableView.is(viewInstance)) {
      const uri = viewInstance.getResourceUri()?.toString();
      if (!uri) {
        return;
      }
      const index = this.navigateHistory.findIndex((item) => item.uri === uri);
      const item = { uri, view: viewInstance, openOptions };
      if (index < 0) {
        this.navigateHistory.push(item);
      } else {
        this.navigateHistory.splice(index, 1);
        this.navigateHistory.push(item);
      }
    }
  }

  handleNavigateRevert(viewInstance: View) {
    if (this.navigatable && NavigatableView.is(viewInstance)) {
      const uri = viewInstance.getResourceUri()?.toString();
      if (!uri) {
        return;
      }
      const index = this.navigateHistory.findIndex((item) => item.uri === uri);
      if (index < 0) {
        return;
      }
      this.navigateHistory.splice(index, 1);

      if (this.navigateHistory.length > 0) {
        const last = this.navigateHistory[this.navigateHistory.length - 1];
        // const uri = viewInstance.createMoveToUri(new URI(last));
        this.active = last.view;
      }
    }
  }

  protected setViewOption(instance: View, option?: ViewOpenOption) {
    this.viewOpenOptions.set(instance, option);
  }

  getViewOption(child: View): ViewOpenOption | undefined {
    return this.viewOpenOptions.get(getOrigin(child));
  }

  override dispose() {
    super.dispose();
    this.children.forEach((item) => {
      if (Disposable.is(item)) {
        item.dispose();
      }
    });
  }

  protected renderTitleIcon = renderNode;

  protected renderTitleLabel = renderNode;
}

export const BaseSlotView = DefaultSlotView;
