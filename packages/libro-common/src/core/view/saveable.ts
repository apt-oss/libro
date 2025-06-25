import type { Event, MaybePromise } from '../../common/index.js';
import type { View } from '../index.js';

export interface Saveable {
  readonly dirty: boolean;
  readonly onDirtyChanged: Event<void>;
  readonly autoSave: 'on' | 'off';
  /**
   * Saves dirty changes.
   */
  save: () => MaybePromise<void>;
  /**
   * Reverts dirty changes.
   */
  restore?: () => MaybePromise<void>;
}

export interface SaveableSource {
  readonly saveable: Saveable;
}

export namespace Saveable {
  export function isSource(arg: any): arg is SaveableSource {
    return !!arg && 'saveable' in arg && is(arg.saveable);
  }
  export function is(arg: any): arg is Saveable {
    return !!arg && 'dirty' in arg && 'onDirtyChanged' in arg;
  }
  export function get(arg: any): Saveable | undefined {
    if (is(arg)) {
      return arg;
    }
    if (isSource(arg)) {
      return arg.saveable;
    }
    return undefined;
  }
  export function getDirty(arg: any): Saveable | undefined {
    const saveable = get(arg);
    if (saveable && saveable.dirty) {
      return saveable;
    }
    return undefined;
  }
  export function isDirty(arg: any): boolean {
    return !!getDirty(arg);
  }
  export async function save(arg: any): Promise<void> {
    const saveable = get(arg);
    if (saveable) {
      await saveable.save();
    }
  }
  // export function apply(widget: View): SaveableView | undefined {
  //   // eslint-disable-next-line @typescript-eslint/no-use-before-define
  //   if (SaveableView.is(widget)) {
  //     return widget;
  //   }
  //   const saveable = Saveable.get(widget);
  //   if (!saveable) {
  //     return undefined;
  //   }
  //   setDirty(widget, saveable.dirty);
  //   saveable.onDirtyChanged(() => setDirty(widget, saveable.dirty));
  //   const closeWidget = widget.close.bind(widget);
  //   const closeWithoutSaving: SaveableWidget['closeWithoutSaving'] = async () => {
  //     if (saveable.dirty && saveable.revert) {
  //       await saveable.revert();
  //     }
  //     closeWidget();
  //     return waitForClosed(widget);
  //   };
  //   let closing = false;
  //   const closeWithSaving: SaveableWidget['closeWithSaving'] = async options => {
  //     if (closing) {
  //       return;
  //     }
  //     closing = true;
  //     try {
  //       const result = await shouldSave(saveable, () => {
  //         if (options && options.shouldSave) {
  //           return options.shouldSave();
  //         }
  //         return new ShouldSaveDialog(widget).open();
  //       });
  //       if (typeof result === 'boolean') {
  //         if (result) {
  //           await Saveable.save(widget);
  //         }
  //         await closeWithoutSaving();
  //       }
  //     } finally {
  //       closing = false;
  //     }
  //   };
  //   return Object.assign(widget, {
  //     closeWithoutSaving,
  //     closeWithSaving,
  //     close: () => closeWithSaving(),
  //   });
  // }
  export async function shouldSave(
    saveable: Saveable,
    cb: () => MaybePromise<boolean | undefined>,
  ): Promise<boolean | undefined> {
    if (!saveable.dirty) {
      return false;
    }

    if (saveable.autoSave === 'on') {
      return true;
    }

    return cb();
  }
}

export interface SaveableView extends View {
  closeWithoutSaving: () => Promise<void>;
  closeWithSaving: (options?: SaveableView.CloseOptions) => Promise<void>;
}

export namespace SaveableView {
  export function is(view: View | undefined): view is SaveableView {
    return !!view && 'closeWithoutSaving' in view;
  }
  export function getDirty<T extends View>(
    views: Iterable<T>,
  ): IterableIterator<SaveableView & T> {
    return get(views, Saveable.isDirty);
  }
  export function* get<T extends View>(
    views: Iterable<T>,
    filter: (view: T) => boolean = () => true,
  ): IterableIterator<SaveableView & T> {
    for (const view of views) {
      if (SaveableView.is(view) && filter(view)) {
        yield view;
      }
    }
  }
  export interface CloseOptions {
    shouldSave?: () => MaybePromise<boolean | undefined>;
  }
}
