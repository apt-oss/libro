import { Disposable } from './disposable.js';
import type { Event } from './event.js';
import { Emitter } from './event.js';

export class DisposableCollection implements Disposable {
  protected readonly disposables: Disposable[];
  protected readonly onDisposeEmitter;

  constructor(...args: Disposable[]) {
    this.disposables = [];
    this.onDisposeEmitter = new Emitter<void>();
    args.forEach((disposable) => this.push(disposable));
  }

  get onDispose(): Event<void> {
    return this.onDisposeEmitter.event;
  }

  protected checkDisposed(): void {
    if (this.disposed && !this.disposingElements) {
      this.onDisposeEmitter.fire(undefined);
      this.onDisposeEmitter.dispose();
    }
  }

  /**
   * Returns true if this collection is empty.
   */
  get disposed(): boolean {
    return this.disposables.length === 0;
  }

  private disposingElements = false;

  dispose(): void {
    if (this.disposed || this.disposingElements) {
      return;
    }
    this.disposingElements = true;
    while (!this.disposed) {
      try {
        const disposable = this.disposables.pop();
        if (disposable) {
          disposable.dispose();
        }
      } catch (e) {
        console.error(e);
      }
    }
    this.disposingElements = false;
    this.checkDisposed();
  }

  protected doPush(disposable: Disposable): Disposable {
    const { disposables } = this;
    disposables.push(disposable);
    const originalDispose = disposable.dispose.bind(disposable);
    const toRemove = Disposable.create(() => {
      const index = disposables.indexOf(disposable);
      if (index !== -1) {
        disposables.splice(index, 1);
      }
      this.checkDisposed();
    });
    disposable.dispose = () => {
      toRemove.dispose();
      originalDispose();
    };
    return toRemove;
  }
  push(disposable: Disposable): Disposable;
  push(...disposables: Disposable[]): Disposable[];
  push(...disposables: Disposable[]): Disposable | Disposable[] {
    if (disposables.length === 1) {
      return this.doPush(disposables[0]);
    } else {
      return disposables.map((toDispose) => this.doPush(toDispose));
    }
  }

  /**
   * @deprecated use push instead
   */
  pushAll(disposables: Disposable[]): Disposable[] {
    return this.push(...disposables);
  }
}
