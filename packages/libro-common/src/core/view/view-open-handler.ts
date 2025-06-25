import type { Event, MaybePromise, URI } from '../../common/index.js';
import { Emitter } from '../../common/index.js';
import { inject, postConstruct, singleton } from '../../ioc/index.js';

import type { BaseView } from './default-view.js';
import type { OpenHandler } from './open-handler.js';
import { SlotViewManager } from './slot-view-manager.js';
import { ViewManager } from './view-manager.js';
import type { ViewOpenOption } from './view-protocol.js';
import { RootSlotId } from './view-protocol.js';

export interface ViewOpenHandlerOptions extends ViewOpenOption {
  slot?: string;
  viewOptions?: any;
}

/**
 * Generic base class for {@link OpenHandler}s that are opening a View for a given {@link URI}.
 */
@singleton()
export abstract class ViewOpenHandler<W extends BaseView> implements OpenHandler {
  protected readonly viewManager!: ViewManager;

  protected readonly slotViewManager!: SlotViewManager;

  constructor(
    @inject(ViewManager) viewManager: ViewManager,
    @inject(SlotViewManager) slotViewManager: SlotViewManager,
  ) {
    this.viewManager = viewManager;
    this.slotViewManager = slotViewManager;
  }

  protected readonly onCreatedEmitter = new Emitter<W>();
  /**
   * Emit when a new View is created.
   */
  readonly onCreated: Event<W> = this.onCreatedEmitter.event;

  @postConstruct()
  protected init(): void {
    this.viewManager.onDidCreateView(({ factoryId, view }) => {
      if (factoryId === this.id) {
        this.onCreatedEmitter.fire(view as W);
      }
    });
  }

  /**
   * The view open handler id.
   *
   * #### Implementation
   * - A view factory for this id should be registered.
   */
  abstract readonly id: string;
  abstract canHandle(uri: URI, options?: ViewOpenHandlerOptions): MaybePromise<number>;

  /**
   * Open a View for the given uri and options.
   * Reject if the given options are not View options or a View cannot be opened.
   * @param uri the uri of the resource that should be opened.
   * @param options the View opener options.
   *
   * @returns promise of the View that resolves when the View has been opened.
   */
  async open(uri: URI, options?: ViewOpenHandlerOptions): Promise<W> {
    const view = await this.getOrCreateView(uri, options);
    await this.doOpen(view, options || {});
    return view;
  }
  protected async doOpen(view: W, options: ViewOpenHandlerOptions): Promise<void> {
    // if (!view.isAttached) {
    const { slot = RootSlotId, ...openOption } = options;
    this.slotViewManager.addView(view, slot, openOption);
    // }
  }

  /**
   * Tries to get an existing View for the given uri.
   * @param uri the uri of the View.
   *
   * @returns a promise that resolves to the existing View or `undefined` if no View for the given uri exists.
   */
  getByUri(uri: URI): Promise<W | undefined> {
    return this.getView(uri);
  }

  /**
   * Return an existing View for the given uri or creates a new one.
   *
   * It does not open a View, use {@link ViewOpenHandler#open} instead.
   * @param uri uri of the View.
   *
   * @returns a promise of the existing or newly created View.
   */
  getOrCreateByUri(uri: URI): Promise<W> {
    return this.getOrCreateView(uri);
  }

  /**
   * Retrieves all open Views that have been opened by this handler.
   *
   * @returns all open Views for this open handler.
   */
  get all(): Promise<W[]> {
    return (async () => {
      return (await this.viewManager.getViews(this.id)) as W[];
    })();
  }

  protected async getView(
    uri: URI,
    options?: ViewOpenHandlerOptions,
  ): Promise<W | undefined> {
    const ViewOptions = this.createViewOptions(uri, options);
    return this.viewManager.getView<W>(this.id, ViewOptions);
  }

  protected getOrCreateView(uri: URI, options?: ViewOpenHandlerOptions): Promise<W> {
    const ViewOptions = this.createViewOptions(uri, options);
    return this.viewManager.getOrCreateView<W>(this.id, ViewOptions);
  }

  protected abstract createViewOptions(
    uri: URI,
    options?: ViewOpenHandlerOptions,
  ): Record<any, any>;

  /**
   * Closes all Views that have been opened by this open handler.
   * @param options the close options that should be applied to all Views.
   *
   * @returns a promise of all closed Views that resolves after they have been closed.
   */
  async closeAll(slot: string): Promise<void[]> {
    const all = await this.all;
    return Promise.all(all.map((view) => this.slotViewManager.removeView(view, slot)));
  }
}
