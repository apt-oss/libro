/* eslint-disable @typescript-eslint/unified-signatures */
import * as React from 'react';

import { Disposable, DisposableCollection } from '../../common/index.js';
import { inject, transient } from '../../ioc/index.js';
import { equals, getOrigin, prop, useInject } from '../../observable/index.js';

import { view } from './decorator.js';
import { BaseView } from './default-view.js';
import type {
  SlotView,
  ViewOpenOption,
  ViewComponent,
  SlotViewOption,
  View,
} from './view-protocol.js';
import { ViewOption, ViewInstance } from './view-protocol.js';
import { ViewRender } from './view-render.js';

export const PortalViewComponent: React.FC = React.forwardRef(
  function PortalViewComponent() {
    const instance = useInject<PortalSlotView>(ViewInstance);
    return (
      <>
        {instance.children.map((viewItem) => (
          <ViewRender view={viewItem} key={viewItem.id} />
        ))}
      </>
    );
  },
);

@transient()
@view('portal-slot-view')
export class PortalSlotView extends BaseView implements SlotView {
  protected viewOpenOptions = new Map<View, ViewOpenOption | undefined>();
  protected viewRemoveDispose = new Map<View, Disposable>();

  @prop()
  children: View[] = [];

  protected option: SlotViewOption | undefined;

  override view: ViewComponent = PortalViewComponent;

  constructor(@inject(ViewOption) option: SlotViewOption | undefined) {
    super();
    this.option = option;
    this.id = `portal-slot-${this.id}`;
    if (option?.className) {
      this.className = option.className;
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
      viewInstance.isAttached = true;
      const remove = () => {
        this.doRemoveView(viewInstance);
      };
      const disposable = viewInstance.onDisposed(remove);
      toDispose.push(disposable);
      toDispose.push(Disposable.create(remove));
      this.viewRemoveDispose.set(viewInstance, toDispose);
    }
    return toDispose;
  }

  protected doRemoveView(viewInstance: View): void {
    const currentIndex = this.children.findIndex((item) => equals(item, viewInstance));
    if (currentIndex > -1) {
      this.children.splice(currentIndex, 1);
      this.viewOpenOptions.delete(viewInstance);
      viewInstance.isAttached = false;
    }
  }
  removeView(viewInstance: View): void {
    this.viewRemoveDispose.get(viewInstance)?.dispose();
    this.viewRemoveDispose.delete(viewInstance);
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
}
