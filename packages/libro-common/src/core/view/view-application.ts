import { inject, singleton } from '../../ioc/index.js';
import { ApplicationContribution } from '../application/index.js';

import { SlotViewManager } from './slot-view-manager.js';
import { ViewManager } from './view-manager.js';
import type { ViewPreference } from './view-protocol.js';
import { RootViewId } from './view-protocol.js';
import { ViewStorage } from './view-storage.js';

@singleton({ contrib: ApplicationContribution })
export class ViewApplication implements ApplicationContribution {
  protected readonly viewManager: ViewManager;
  protected readonly slotViewManager: SlotViewManager;
  protected readonly viewStorage: ViewStorage;

  constructor(
    @inject(ViewManager) viewManager: ViewManager,
    @inject(SlotViewManager) slotViewManager: SlotViewManager,
    @inject(ViewStorage) viewStorage: ViewStorage,
  ) {
    this.viewManager = viewManager;
    this.slotViewManager = slotViewManager;
    this.viewStorage = viewStorage;
  }

  async onStart() {
    const rootView = await this.viewManager.getOrCreateView(RootViewId);
    this.viewManager.root = rootView;
  }

  async onViewStart() {
    const view = await this.tryRestoreView();
    if (!view || this.viewStorage.onlyRootView) {
      this.initView();
    }
  }

  protected async tryRestoreView(): Promise<boolean> {
    const savedView = await this.viewStorage.getSavedView();
    if (savedView && this.viewStorage.canStoreView) {
      return !!this.viewStorage.restoreView(savedView);
    }
    return false;
  }

  initView() {
    const preferenceMap = this.viewManager.getPreferenceMap();
    for (const factoryId of preferenceMap.keys()) {
      const preference = preferenceMap.get(factoryId);
      if (preference && preference.autoCreate) {
        this.doCreateView(factoryId, preference);
      }
    }
  }

  onWillStop() {
    if (this.viewStorage.canStoreView) {
      this.viewStorage.saveViews();
    }
    return true;
  }

  protected async doCreateView(factoryId: string, preference: ViewPreference) {
    const view = await this.viewManager.getOrCreateView(factoryId, preference.options);
    if (preference.slot) {
      await this.slotViewManager.addView(view, preference.slot, preference.openOptions);
    }
  }
}
