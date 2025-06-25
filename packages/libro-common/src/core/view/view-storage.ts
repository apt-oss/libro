/* eslint-disable @typescript-eslint/no-explicit-any */
import { inject, singleton } from '../../ioc/index.js';
import { prop } from '../../observable/index.js';
import { DebugService, StorageService } from '../common';

import { SlotViewManager } from './slot-view-manager.js';
import { ViewManager } from './view-manager.js';
import type { View, ViewOpenOption } from './view-protocol.js';
import { RootViewId } from './view-protocol.js';
import { SlotView } from './view-protocol.js';
import { StatefulView } from './view-protocol.js';

interface SavedView {
  factoryId: string;
  // viewType: 'slotView' | 'view.js';
  option: any;
  slot?: string | undefined;
  children?: SavedView[] | undefined;
  slots?: SavedView[] | undefined;
  state?: any | undefined;
  openOption?: ViewOpenOption | undefined;
}
export namespace SavedView {
  export function is(data?: Record<string, any>): data is SavedView {
    return !!data && typeof data === 'object' && 'factoryId' in data;
  }
}

const ShouldPreventStoreViewKey = 'mana-should-prevent-store-view.js';

@singleton()
export class ViewStorage {
  protected storageKey = 'mana-view-info.js';
  protected restoreCount = 0;
  protected readonly viewManager: ViewManager;
  protected readonly slotViewManager: SlotViewManager;
  protected readonly debugService: DebugService;
  protected readonly storageService: StorageService;

  @prop()
  protected shouldStoreViews = false;

  get canStoreView(): boolean {
    return this.shouldStoreViews;
  }
  get onlyRootView(): boolean {
    return this.restoreCount < 2;
  }

  constructor(
    @inject(ViewManager) viewManager: ViewManager,
    @inject(SlotViewManager) slotViewManager: SlotViewManager,
    @inject(DebugService) debugService: DebugService,
    @inject(StorageService) storageService: StorageService,
  ) {
    this.viewManager = viewManager;
    this.slotViewManager = slotViewManager;
    this.debugService = debugService;
    this.storageService = storageService;

    if (localStorage.getItem(ShouldPreventStoreViewKey) === 'once') {
      localStorage.removeItem(ShouldPreventStoreViewKey);
    }

    if (localStorage.getItem(ShouldPreventStoreViewKey) === 'false') {
      this.shouldStoreViews = true;
    }
  }

  disableStoreView() {
    this.shouldStoreViews = false;
    this.storageService.setData(this.storageKey, undefined);
    localStorage.setItem(ShouldPreventStoreViewKey, 'true');
  }

  enableStoreView() {
    this.shouldStoreViews = true;
    localStorage.setItem(ShouldPreventStoreViewKey, 'false');
  }

  resetViews() {
    this.shouldStoreViews = false;
    this.storageService.setData(this.storageKey, undefined);
    localStorage.removeItem(ShouldPreventStoreViewKey);
    window.location.reload();
  }

  async saveViews(): Promise<void> {
    const rootView = await this.viewManager.getView(RootViewId);
    let viewInfo: SavedView | undefined;
    if (rootView) {
      viewInfo = this.getViewInfo(rootView);
    }
    this.storageService.setData(this.storageKey, viewInfo);
  }

  protected getViewInfo(
    view: View,
    slot?: string,
    openOption?: ViewOpenOption,
  ): SavedView | undefined {
    const baseInfo = this.getViewBaseInfo(view, slot);
    if (!baseInfo) {
      return;
    }
    this.debugService(
      'store view >>>>>>>>>>>>>>>',
      baseInfo.factoryId,
      baseInfo.option,
      baseInfo.slot,
    );
    return {
      ...baseInfo,
      slots: this.getViewSlotsInfo(view),
      children: this.getViewChildrenInfo(view),
      openOption: openOption,
    };
  }

  protected getViewBaseInfo(view: View, slot?: string): SavedView | undefined {
    const factoryId = this.viewManager.getFactoryIdByView(view);
    if (!factoryId) {
      return;
    }
    const option = this.viewManager.getViewOption(view);
    return {
      factoryId,
      slot,
      option,
      state: StatefulView.is(view) ? view.storeState() : undefined,
    };
  }
  protected getViewSlotsInfo(parentView: View): SavedView[] | undefined {
    const slotNames = this.slotViewManager.getSlotChildren(parentView);
    if (!slotNames) {
      return undefined;
    }
    const slots = slotNames
      .map((slot) => {
        const slotView = this.slotViewManager.getSlotView(slot);
        if (slotView) {
          return this.getViewInfo(slotView, slot);
        }
        return undefined;
      })
      .filter(SavedView.is);
    if (slots.length > 0) {
      return slots;
    }
    return undefined;
  }
  protected getViewChildrenInfo(view: View): SavedView[] | undefined {
    if (!SlotView.is(view)) {
      return undefined;
    }
    const children = view.children
      .map((item) => {
        const openOption = view.getViewOption(item);
        delete openOption?.reveal;
        return this.getViewInfo(item, undefined, openOption);
      })
      .filter(SavedView.is);
    if (children.length > 0) {
      return children;
    }
    return undefined;
  }

  async getSavedView(): Promise<SavedView | undefined> {
    const viewInfo = await this.storageService.getData<SavedView>(this.storageKey);
    return viewInfo;
  }

  async restoreView(savedView: SavedView): Promise<View | undefined> {
    const { factoryId, option, state } = savedView;
    try {
      this.debugService(
        'restore view >>>>>>>>>>>>>>>',
        factoryId,
        option,
        savedView.slot,
      );
      const view = await this.viewManager.getOrCreateView(factoryId, option);
      if (savedView.slot) {
        this.slotViewManager.setSlotView(savedView.slot, view);
      }
      if (savedView.slots) {
        await Promise.all(
          savedView.slots.map(async (item) => await this.restoreView(item)),
        );
      }
      if (savedView.children) {
        await Promise.all(
          savedView.children.map(async (item) => {
            const child = await this.restoreView(item);
            if (child && SlotView.is(view) && savedView.slot) {
              await this.slotViewManager.addView(
                child,
                savedView.slot,
                item.openOption,
              );
            }
          }),
        );
      }
      if (StatefulView.is(view)) {
        view.restoreState(state);
      }
      if (!SlotView.is(view)) {
        this.restoreCount += 1;
      }
      return view;
    } catch (error) {
      return undefined;
    }
  }
}
