/* eslint-disable @typescript-eslint/no-invalid-this */
import type { MaybePromise, Event, Newable, Disposable } from '../../common/index.js';
import { DisposableCollection } from '../../common/index.js';
import { Priority, Emitter } from '../../common/index.js';
import type { Contribution } from '../../ioc/index.js';
import { contrib, inject, singleton } from '../../ioc/index.js';
import { prop } from '../../observable/index.js';
import { DebugService } from '../common/debug.js';
import type { ManaContext } from '../module/index.js';

import { ViewMeta } from './view-meta.js';
import type { ViewPreference, View } from './view-protocol.js';
import type { SlotView } from './view-protocol.js';
import { ViewDefineToken } from './view-protocol.js';
import { ViewFactory, ViewPreferenceContribution } from './view-protocol.js';

export interface ViewCreateOptions {
  factoryId: string;
  options?: any;
}

export interface ViewEvent {
  readonly view: View;
  readonly factoryId: string;
}
/**
 * 管理视图
 * 为视图保存创建条件
 */
@singleton()
export class ViewManager implements Disposable {
  @prop()
  root?: View;
  protected factoryMap?: Map<string, ViewFactory> | undefined;
  protected factories: string[] = [];
  protected preferenceMap?: Map<string, ViewPreference> | undefined;
  protected preferences: string[] = [];
  protected readonly viewContextMap = new Map<View, ManaContext>();
  protected readonly viewFactoryMap = new Map<View, string>();

  protected readonly views = new Map<string, View>();
  protected readonly viewPromises = new Map<string, MaybePromise<View>>();
  protected readonly pendingViewPromises = new Map<string, MaybePromise<View>>();
  protected readonly onWillCreateViewEmitter = new Emitter<ViewEvent>();

  readonly onWillCreateView: Event<ViewEvent> = this.onWillCreateViewEmitter.event;

  protected readonly onDidCreateViewEmitter = new Emitter<ViewEvent>();

  readonly onDidCreateView: Event<ViewEvent> = this.onDidCreateViewEmitter.event;

  readonly toDispose = new DisposableCollection();

  protected readonly factoryProvider: Contribution.Provider<ViewFactory>;
  protected readonly debugService: DebugService;
  protected readonly preferenceProvider: Contribution.Provider<ViewPreferenceContribution>;
  disposed?: boolean | undefined;

  constructor(
    @contrib(ViewFactory) factoryProvider: Contribution.Provider<ViewFactory>,
    @inject(DebugService) debugService: DebugService,
    @contrib(ViewPreferenceContribution)
    preferenceProvider: Contribution.Provider<ViewPreferenceContribution>,
  ) {
    this.factoryProvider = factoryProvider;
    this.debugService = debugService;
    this.preferenceProvider = preferenceProvider;
    this.toDispose.push(this.onDidCreateViewEmitter);
    this.toDispose.push(this.onWillCreateViewEmitter);
    this.toDispose.push(
      this.factoryProvider.onChanged(() => {
        this.factoryMap = undefined;
      }),
    );
  }
  dispose() {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    this.viewPromises.clear();
    this.pendingViewPromises.clear();
  }

  getFactoryMap(): Map<string, ViewFactory> {
    if (!this.factoryMap) {
      this.factoryMap = new Map();
      for (const factory of this.factoryProvider.getContributions()) {
        if (factory.id) {
          this.factoryMap.set(factory.id, factory);
        }
      }
      this.factories = [];
      for (const id of this.factoryMap.keys()) {
        this.factories.push(id);
      }
    }
    return this.factoryMap;
  }

  toFactoryId(view: Newable<View> | string): string {
    if (typeof view === 'string') {
      return view;
    }
    const factoryId = Reflect.getMetadata(ViewDefineToken, view);
    return factoryId;
  }

  getPreferenceMap(): Map<string, ViewPreference> {
    if (!this.preferenceMap) {
      this.preferenceMap = new Map();
      for (const viewPreference of this.preferenceProvider.getContributions()) {
        viewPreference.forEach((item) => {
          const { view } = item;
          const factoryId = this.toFactoryId(view);
          const currentPriority = item.priority ?? Priority.IDLE;
          const last = this.preferenceMap?.get(factoryId);
          if (!last || !last.priority || currentPriority > last.priority) {
            this.preferenceMap?.set(factoryId, item);
          }
        });
      }
      this.preferences = [];
      for (const id of this.preferenceMap.keys()) {
        this.preferences.push(id);
      }
    }
    return this.preferenceMap;
  }

  toKey(options: ViewCreateOptions): string {
    return JSON.stringify(options);
  }
  fromKey(key: string): ViewCreateOptions {
    return JSON.parse(key);
  }
  getView<T extends View>(
    factoryOrView: string | Newable<View>,
    options?: any,
  ): MaybePromise<T> | undefined {
    const factoryId = this.toFactoryId(factoryOrView);
    const key = this.toKey({ factoryId, options });
    const pendingView = this.doGetView<T>(key);
    return pendingView;
  }

  getViewByKey(key: string) {
    const pending = this.pendingViewPromises.get(key);
    if (pending) {
      return pending;
    }
    return this.views.get(key);
  }

  async getViews<T extends View>(factoryId: string): Promise<T[]> {
    const views: T[] = [];
    for (const [key] of this.views.entries()) {
      if (this.fromKey(key).factoryId === factoryId) {
        const pendingView = this.doGetView<T>(key);
        const view = pendingView && (await pendingView);
        if (view) {
          views.push(view);
        }
      }
    }
    return views;
  }

  protected doGetView<T extends View>(key: string): MaybePromise<T> | undefined {
    const pendingView = this.viewPromises.get(key) ?? this.pendingViewPromises.get(key);
    if (pendingView) {
      return pendingView as MaybePromise<T>;
    }
    return undefined;
  }

  getFactory(view: Newable<View> | Newable<SlotView>): ViewFactory | undefined {
    const factoryId = this.toFactoryId(view);
    const factories = this.getFactoryMap();
    try {
      return factories.get(factoryId);
    } catch (ex) {
      console.error(ex);
      return;
    }
  }

  getPrefer(factoryId: string): ViewPreference | undefined {
    return this.getPreferenceMap().get(factoryId);
  }

  getFactoryIdByView(view: View): string | undefined {
    return this.viewFactoryMap.get(view);
  }

  getViewOption(view: View) {
    for (const [key, value] of this.views.entries()) {
      if (value === view) {
        return this.fromKey(key).options;
      } else {
        continue;
      }
    }
  }

  setViewContext(view: View, context: ManaContext) {
    return ViewMeta.setViewContext(view, context);
  }

  getViewContext(view: View) {
    return ViewMeta.getViewContext(view) as ManaContext;
  }

  removeViewContext(view: View) {
    return ViewMeta.removeViewContext(view);
  }

  getViewKey(view: View) {
    for (const [key, value] of this.views.entries()) {
      if (value === view) {
        return key;
      }
    }
    return undefined;
  }

  protected mergeViewOption(options?: Record<any, any>, preference?: ViewPreference) {
    if (!options && !preference?.options) {
      return undefined;
    }
    return { ...preference?.options, ...options };
  }

  async getOrCreateView<T extends View, U extends Record<any, any> = any>(
    factoryOrView: string | Newable<T>,
    options?: U,
  ): Promise<T> {
    const factoryId = this.toFactoryId(factoryOrView);
    const key = this.toKey({ factoryId, options });
    const existingView = this.doGetView<T>(key);
    if (existingView) {
      return existingView;
    }
    const factory = this.getFactoryMap().get(factoryId);
    if (!factory) {
      throw Error(`No View factory '${factoryId}' has been registered.`);
    }
    try {
      const preference = this.getPreferenceMap().get(factoryId);
      const viewOption = this.mergeViewOption(options, preference);
      const viewPromise = factory.createView(viewOption);
      this.pendingViewPromises.set(key, viewPromise);
      const view = await viewPromise;
      this.onWillCreateViewEmitter.fire({ factoryId, view });
      this.viewPromises.set(key, viewPromise);
      this.views.set(key, view);
      this.viewFactoryMap.set(view, factoryId);
      view.onDisposed(() => {
        this.views.delete(key);
        this.viewPromises.delete(key);
        this.viewFactoryMap.delete(view);
        this.removeViewContext(view);
      });
      this.onDidCreateViewEmitter.fire({ factoryId, view });
      return view as T;
    } finally {
      this.pendingViewPromises.delete(key);
    }
  }
}
