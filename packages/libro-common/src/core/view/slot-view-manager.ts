import type { Newable } from '../../common/index.js';
import { Emitter } from '../../common/index.js';
import { Deferred } from '../../common/index.js';
import { Disposable, Priority } from '../../common/index.js';
import { contrib, inject, singleton } from '../../ioc/index.js';
import type { Contribution } from '../../ioc/index.js';
import { prop } from '../../observable/index.js';
import { DebugService } from '../common/debug.js';

import { DefaultSlotView } from './default-slot-view.js';
import { ViewManager } from './view-manager.js';
import type { View } from './view-protocol.js';
import type { SlotPreference, ViewOpenOption } from './view-protocol.js';
import { SlotPreferenceContribution, SlotView } from './view-protocol.js';

interface ViewAddArgs {
  view?: View;
  slot: string;
  option?: ViewOpenOption;
}

interface SlotSetArgs {
  view?: View;
  slot: string;
}

@singleton()
export class SlotViewManager {
  protected preferences: Map<string, SlotPreference> = new Map();
  protected componentPreferences: Map<string, SlotPreference> = new Map();
  protected slotRenderingDeferred: Map<string, Deferred<void>> = new Map();

  protected onViewAddedEmitter: Emitter<ViewAddArgs> = new Emitter<ViewAddArgs>();
  protected onSlotChangedEmitter: Emitter<SlotSetArgs> = new Emitter<SlotSetArgs>();

  get onViewAdded() {
    return this.onViewAddedEmitter.event;
  }

  get onSlotChanged() {
    return this.onSlotChangedEmitter.event;
  }

  /**
   * slot -> slotview
   */
  @prop()
  slotViewMap: Map<string, View> = new Map<string, View>();

  /**
   * view -> child slotview
   */
  @prop()
  slotChildrenMap: Map<View, string[]> = new Map<View, string[]>();

  protected readonly preferenceProvider: Contribution.Provider<SlotPreferenceContribution>;
  protected readonly debugService: DebugService;
  protected readonly viewManager: ViewManager;

  constructor(
    @contrib(SlotPreferenceContribution)
    preferenceProvider: Contribution.Provider<SlotPreferenceContribution>,
    @inject(DebugService) debugService: DebugService,
    @inject(ViewManager) viewManager: ViewManager,
  ) {
    this.preferenceProvider = preferenceProvider;
    this.debugService = debugService;
    this.viewManager = viewManager;
    this.setPreferencesFromContribution();
  }

  protected setPreferencesFromContribution(): void {
    for (const preference of this.preferenceProvider.getContributions()) {
      preference.forEach((item) => {
        const { slot } = item;
        this.setSlotPreference(slot, item);
      });
    }
  }

  protected getPreferences(): Map<string, SlotPreference> {
    return this.preferences;
  }

  setSlotPreference(slot: string, preference: SlotPreference): void {
    const last = this.preferences.get(slot);
    const currentPriority = preference.priority ?? Priority.IDLE;
    if (!last || !last.priority || currentPriority > last.priority) {
      this.preferences.set(slot, preference);
    }
  }

  setComponentSlotPreference(slot: string, preference: SlotPreference): void {
    const last = this.componentPreferences.get(slot);
    const currentPriority = preference.priority ?? Priority.IDLE;
    if (!last || !last.priority || currentPriority > last.priority) {
      this.componentPreferences.set(slot, preference);
    }
  }

  protected waitSlotRendering(slot: string): Promise<void> {
    let deferred = this.slotRenderingDeferred.get(slot);
    if (!deferred) {
      deferred = new Deferred<void>();
      this.slotRenderingDeferred.set(slot, deferred);
    }
    return deferred.promise;
  }

  slotRendering(slot: string): void {
    let deferred = this.slotRenderingDeferred.get(slot);
    if (!deferred) {
      deferred = new Deferred<void>();
      this.slotRenderingDeferred.set(slot, deferred);
    }
    deferred.resolve();
  }

  async getOrCreateSlotView(
    slot: string,
    defaultSlotView: Newable<View> = DefaultSlotView,
  ): Promise<SlotView | View> {
    const existSlotView = this.slotViewMap.get(slot);
    if (existSlotView) {
      return existSlotView;
    }
    let preference = this.preferences.get(slot);
    if (!preference) {
      await this.waitSlotRendering(slot);
      preference = this.componentPreferences.get(slot);
    }
    const defaultSlotViewFactory = this.viewManager.getFactory(DefaultSlotView)!;
    const toFactory = preference?.view ?? defaultSlotView ?? DefaultSlotView;
    const slotViewFactory =
      this.viewManager.getFactory(toFactory) ?? defaultSlotViewFactory;
    const slotOption = { ...preference?.options, area: slot };
    const slotView = await this.viewManager.getOrCreateView(
      slotViewFactory.id,
      slotOption,
    );
    slotView.onDisposed(this.setSlotView(slot, slotView).dispose);
    this.debugService('slot view set', slot, slotView);
    return slotView as SlotView;
  }

  getSlotView(slot: string): View | undefined {
    return this.slotViewMap.get(slot);
  }

  setSlotView(slot: string, view: View): Disposable {
    this.slotViewMap.set(slot, view);
    this.onSlotChangedEmitter.fire({ view, slot });
    return Disposable.create(() => {
      if (this.slotViewMap.get(slot) === view) {
        this.slotViewMap.delete(slot);
        this.onSlotChangedEmitter.fire({ view: undefined, slot });
      }
    });
  }

  async addView(view: View, slot: string, option?: ViewOpenOption): Promise<void> {
    const slotView = await this.getOrCreateSlotView(slot);
    if (SlotView.is(slotView)) {
      await slotView.addView(view, option);
      this.onViewAddedEmitter.fire({ view, slot, option });
    }
  }

  async removeView(view: View, slot: string): Promise<void> {
    const slotView = await this.getOrCreateSlotView(slot);
    if (SlotView.is(slotView)) {
      await slotView.removeView(view);
    }
  }

  hasSlot(slot: string): boolean {
    return this.slotViewMap.has(slot);
  }

  getSlotChildren(view: View): string[] | undefined {
    return this.slotChildrenMap.get(view);
  }
  addSlotToView(slot: string, slotView: SlotView): void {
    this.slotChildrenMap.set(slotView, [
      ...(this.slotChildrenMap.get(slotView) ?? []),
      slot,
    ]);
  }
  removeSlotFromView(slot: string, slotView: SlotView): void {
    const children = this.slotChildrenMap.get(slotView);
    if (children) {
      this.slotChildrenMap.set(
        slotView,
        children.filter((child) => child !== slot),
      );
    }
  }
}
