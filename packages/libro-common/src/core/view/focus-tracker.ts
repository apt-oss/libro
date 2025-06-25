import type { Disposable, Event as EmitterEvent } from '../../common/index.js';
import { Iterable } from '../../common/index.js';
import { Emitter } from '../../common/index.js';
import { singleton } from '../../ioc/index.js';

import type { View } from './view-protocol.js';

/**
 * A class which tracks focus among a set of views.
 *
 * This class is useful when code needs to keep track of the most
 * recently focused view(s) among a set of related views.
 */
@singleton()
export class FocusTracker<T extends View> implements Disposable {
  protected counter = 0;
  protected _views: T[] = [];
  protected _activeView: T | null = null;
  protected _currentView: T | null = null;
  protected numbers = new Map<T, number>();
  protected nodes = new Map<HTMLElement, T>();
  protected activeChangedEmitter = new Emitter<FocusTracker.IChangedArgs<T>>();
  protected currentChangedEmitter = new Emitter<FocusTracker.IChangedArgs<T>>();

  /**
   * A signal emitted when the current view has changed.
   */
  get currentChanged(): EmitterEvent<FocusTracker.IChangedArgs<T>> {
    return this.currentChangedEmitter.event;
  }

  /**
   * A signal emitted when the active view has changed.
   */
  get activeChanged(): EmitterEvent<FocusTracker.IChangedArgs<T>> {
    return this.activeChangedEmitter.event;
  }

  /**
   * A flag indicating whether the tracker is disposed.
   */
  get isDisposed(): boolean {
    return this.counter < 0;
  }

  /**
   * The current view in the tracker.
   *
   * #### Notes
   * The current view is the view among the tracked views which
   * has the *descendant node* which has most recently been focused.
   *
   * The current view will not be updated if the node loses focus. It
   * will only be updated when a different tracked view gains focus.
   *
   * If the current view is removed from the tracker, the previous
   * current view will be restored.
   *
   * This behavior is intended to follow a user's conceptual model of
   * a semantically "current" view, where the "last thing of type X"
   * to be interacted with is the "current instance of X", regardless
   * of whether that instance still has focus.
   */
  get currentView(): T | null {
    return this._currentView;
  }

  /**
   * The active view in the tracker.
   *
   * #### Notes
   * The active view is the view among the tracked views which
   * has the *descendant node* which is currently focused.
   */
  get activeView(): T | null {
    return this._activeView;
  }

  /**
   * A read only array of the views being tracked.
   */
  get views(): readonly T[] {
    return this._views;
  }

  /**
   * Dispose of the resources held by the tracker.
   */
  dispose(): void {
    // Do nothing if the tracker is already disposed.
    if (this.counter < 0) {
      return;
    }

    // Mark the tracker as disposed.
    this.counter = -1;

    // Clear the listeners for the tracker.
    this.activeChangedEmitter.dispose();
    this.currentChangedEmitter.dispose();

    // Remove all event listeners.
    this._views.forEach((view) => {
      view.container?.current?.removeEventListener('focus', this, true);
      view.container?.current?.removeEventListener('blur', this, true);
    });

    // Clear the internal data structures.
    this._activeView = null;
    this._currentView = null;
    this.nodes.clear();
    this.numbers.clear();
    this._views.length = 0;
  }

  /**
   * Get the focus number for a particular view in the tracker.
   *
   * @param view - The view of interest.
   *
   * @returns The focus number for the given view, or `-1` if the
   *   view has not had focus since being added to the tracker, or
   *   is not contained by the tracker.
   *
   * #### Notes
   * The focus number indicates the relative order in which the views
   * have gained focus. A view with a larger number has gained focus
   * more recently than a view with a smaller number.
   *
   * The `currentView` will always have the largest focus number.
   *
   * All views start with a focus number of `-1`, which indicates that
   * the view has not been focused since being added to the tracker.
   */
  focusNumber(view: T): number {
    const n = this.numbers.get(view);
    return n === undefined ? -1 : n;
  }

  /**
   * Test whether the focus tracker contains a given view.
   *
   * @param view - The view of interest.
   *
   * @returns `true` if the view is tracked, `false` otherwise.
   */
  has(view: T): boolean {
    return this.numbers.has(view);
  }

  /**
   * Add a view to the focus tracker.
   *
   * @param view - The view of interest.
   *
   * #### Notes
   * A view will be automatically removed from the tracker if it
   * is disposed after being added.
   *
   * If the view is already tracked, this is a no-op.
   */
  add(view: T): void {
    // Do nothing if the view is already tracked.
    if (this.numbers.has(view)) {
      return;
    }

    // Test whether the view has focus.
    const focused = view.container?.current?.contains(document.activeElement);

    // Set up the initial focus number.
    const n = focused ? this.counter++ : -1;

    // Add the view to the internal data structures.
    this._views.push(view);
    this.numbers.set(view, n);
    if (view.container?.current) {
      this.nodes.set(view.container?.current, view);
    }

    // Set up the event listeners. The capturing phase must be used
    // since the 'focus' and 'blur' events don't bubble and Firefox
    // doesn't support the 'focusin' or 'focusout' events.
    view.container?.current?.addEventListener('focus', this, true);
    view.container?.current?.addEventListener('blur', this, true);

    // Connect the disposed signal handler.
    view.onDisposed(() => this.onViewDisposed);

    // Set the current and active views if needed.
    if (focused) {
      this.setViews(view, view);
    }
  }

  /**
   * Remove a view from the focus tracker.
   *
   * #### Notes
   * If the view is the `currentView`, the previous current view
   * will become the new `currentView`.
   *
   * A view will be automatically removed from the tracker if it
   * is disposed after being added.
   *
   * If the view is not tracked, this is a no-op.
   */
  remove(view: T): void {
    // Bail early if the view is not tracked.
    if (!this.numbers.has(view)) {
      return;
    }

    // Disconnect the disposed signal handler.
    // view.disposed.disconnect(this.onViewDisposed, this);

    // Remove the event listeners.
    view.container?.current?.removeEventListener('focus', this, true);
    view.container?.current?.removeEventListener('blur', this, true);

    // Remove the view from the internal data structures.
    this._views.splice(this._views.indexOf(view), 1);

    if (view.container?.current) {
      this.nodes.delete(view.container?.current);
    }
    this.numbers.delete(view);

    // Bail early if the view is not the current view.
    if (this._currentView !== view) {
      return;
    }

    // Filter the views for those which have had focus.
    const valid = this._views.filter((w) => this.numbers.get(w) !== -1);

    // Get the valid view with the max focus number.
    const previous =
      Iterable.max(valid, (first, second) => {
        const a = this.numbers.get(first)!;
        const b = this.numbers.get(second)!;
        return a - b;
      }) || null;

    // Set the current and active views.
    this.setViews(previous, null);
  }

  /**
   * Handle the DOM events for the focus tracker.
   *
   * @param event - The DOM event sent to the panel.
   *
   * #### Notes
   * This method implements the DOM `EventListener` interface and is
   * called in response to events on the tracked nodes. It should
   * not be called directly by user code.
   */
  handleEvent(event: Event): void {
    switch (event.type) {
      case 'focus':
        this.handleFocusEvent(event as FocusEvent);
        break;
      case 'blur':
        this.handleBlurEvent(event as FocusEvent);
        break;
    }
  }

  /**
   * Set the current and active views for the tracker.
   */
  protected setViews(current: T | null, active: T | null): void {
    // Swap the current view.
    const oldCurrent = this._currentView;
    this._currentView = current;

    // Swap the active view.
    const oldActive = this._activeView;
    this._activeView = active;

    // Emit the `currentChanged` signal if needed.
    if (oldCurrent !== current) {
      this.currentChangedEmitter.fire({ oldValue: oldCurrent, newValue: current });
    }

    // Emit the `activeChanged` signal if needed.
    if (oldActive !== active) {
      this.activeChangedEmitter.fire({ oldValue: oldActive, newValue: active });
    }
  }

  /**
   * Handle the `'focus'` event for a tracked view.
   */
  protected handleFocusEvent(event: FocusEvent): void {
    // Find the view which gained focus, which is known to exist.
    const view = this.nodes.get(event.currentTarget as HTMLElement)!;

    // Update the focus number if necessary.
    if (view !== this._currentView) {
      this.numbers.set(view, this.counter++);
    }

    // Set the current and active views.
    this.setViews(view, view);
  }

  /**
   * Handle the `'blur'` event for a tracked view.
   */
  protected handleBlurEvent(event: FocusEvent): void {
    // Find the view which lost focus, which is known to exist.
    const view = this.nodes.get(event.currentTarget as HTMLElement)!;

    // Get the node which being focused after this blur.
    const focusTarget = event.relatedTarget as HTMLElement;

    // If no other node is being focused, clear the active view.
    if (!focusTarget) {
      this.setViews(this._currentView, null);
      return;
    }

    // Bail if the focus view is not changing.
    if (view.container?.current?.contains(focusTarget)) {
      return;
    }

    // If no tracked view is being focused, clear the active view.
    if (!this._views.find((v) => v.container?.current?.contains(focusTarget))) {
      this.setViews(this._currentView, null);
      return;
    }
  }

  /**
   * Handle the `disposed` signal for a tracked view.
   */
  protected onViewDisposed(sender: T): void {
    this.remove(sender);
  }
}

/**
 * The namespace for the `FocusTracker` class statics.
 */
export namespace FocusTracker {
  /**
   * An arguments object for the changed signals.
   */
  export interface IChangedArgs<T extends View> {
    /**
     * The old value for the view.
     */
    oldValue: T | null;

    /**
     * The new value for the view.
     */
    newValue: T | null;
  }
}
