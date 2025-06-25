/* eslint-disable @typescript-eslint/no-explicit-any */
import type React from 'react';

import type { MaybePromise, Event, Disposable, Newable } from '../../common/index.js';
import { Syringe } from '../../ioc/index.js';
import type { ManaModule } from '../module/index.js';

export enum ViewPriority {
  PRIOR = 1000,
  DEFAULT = 100,
  IDLE = -1,
}
export interface ViewSize {
  width?: number;
  height?: number;
}

export const OriginViewComponent = Symbol('OriginViewComponent');
export const ViewComponent = Symbol('ViewComponent');
export type ViewComponent<P = any> = React.FC<P> | React.ForwardRefExoticComponent<P>;

export interface Title<T> {
  /**
   * The object which owns the title.
   */
  owner: T;
  /**
   * The label for the title.
   */
  label?: React.ReactNode | React.FC;
  /**
   * The icon class name for the title.
   */
  icon?: React.ReactNode | React.FC;
  /**
   * The caption for the title.
   */
  caption?: string;
  /**
   * The extra class name for the title.
   */
  className?: string;
  /**
   * The closable state for the title.
   */
  closable?: boolean;
}

export interface View extends Disposable {
  /**
   * Ref of container dom node owned by the view.
   */
  container?: React.RefObject<HTMLDivElement> | null | undefined;
  /**
   * Whether the view has been disposed.
   */
  isDisposed?: boolean | undefined;
  /**
   * Whether the view is added to the slot/view.
   */
  isAttached?: boolean | undefined;
  /**
   * Whether the view is visible.
   */
  isVisible?: boolean | undefined;
  /**
   * The id of the view.
   */
  id: string;
  /**
   * The title of the view.
   */
  title: Title<View>;
  /**
   * The tilabeltle of the view.
   * @deprecated
   */
  label?: React.ReactNode;
  /**
   * The React Render of the view.
   */
  view: ViewComponent;
  /**
   * Event fire when the view is disposed.
   */
  onDisposed: Event<void>;

  /**
   * The classname of view container
   */
  className?: string;

  onViewResize?: undefined | ((size: ViewSize) => void);
  onViewMount?: undefined | (() => void);
  onViewUnmount?: undefined | (() => void);
}

export namespace View {
  export function is(data?: Record<string, any>): data is View {
    return (
      !!data &&
      typeof data === 'object' &&
      'id' in data &&
      'view' in data &&
      typeof data['view'] === 'function'
    );
  }
}

export const RootViewId = '__ROOT_VIEW__';

export const ViewFactory = Syringe.defineToken('ViewFactory');
export const ViewOption = Symbol('ViewOption');
export const ViewInstance = Symbol('ViewInstance');

export const ViewDefineToken = Symbol('ViewDefineToken');

export interface ViewFactory {
  /**
   * The factory id.
   */
  readonly id: string;

  /**
   * Creates a view using the given options.
   * @param options factory specific information as serializable JSON data.
   * @returns the newly created view or a promise of the view
   */
  createView: (options?: any, module?: ManaModule) => MaybePromise<View>;
}

/**
 *  The default behavior configuration of the view
 */
export interface ViewPreference<T = Record<any, any>> {
  /**
   * To create view on application start
   */
  view: Newable<View>;
  autoCreate?: boolean;
  slot?: string;
  priority?: number;
  options?: T;
  openOptions?: ViewOpenOption;
}

export type ViewPreferenceContribution = ViewPreference[];
export const ViewPreferenceContribution = Syringe.defineToken(
  'ViewPreferenceContribution',
);

export interface StatefulView {
  storeState: () => Record<string, any> | undefined;
  restoreState: (oldState: Record<string, any>) => void;
}

export namespace StatefulView {
  export function is(arg: any): arg is StatefulView {
    return (
      arg !== undefined &&
      typeof arg.storeState === 'function' &&
      typeof arg.restoreState === 'function'
    );
  }
}

export interface SlotViewOption {
  className?: string;
  area: string;
  sort?: boolean;
}
export namespace SlotViewOption {
  export function is(data?: Record<string, any>): data is SlotViewOption {
    return !!data && typeof data === 'object' && 'area' in data;
  }
}

export interface ViewOpenOption {
  order?: string;
  reveal?: boolean;
}

export const RootSlotId = '__mana_root_slot__';
export const PortalSlotId = '__mana_portal_slot__';

export interface SlotView extends View {
  getViewOption: (child: View) => ViewOpenOption | undefined;
  addView: (view: View, option?: ViewOpenOption) => Promise<Disposable>;
  removeView: (view: View) => void;
  contains: (instanceOrId: View | string) => boolean;
  children: View[];
}

export namespace SlotView {
  export function is(data?: Record<string, any>): data is SlotView {
    return !!data && typeof data === 'object' && 'addView' in data;
  }
}

/**
 *  The default behavior configuration of the view
 */
export interface SlotPreference<Options = Record<string, any>> {
  /**
   * The default view for the slot
   */
  slot: string;
  view: Newable<View>;
  priority?: number;
  options?: Options;
}

export type SlotPreferenceContribution = SlotPreference[];
export const SlotPreferenceContribution = Syringe.defineToken(
  'SlotPreferenceContribution',
);

export const ViewContextMetaKey = Symbol('ViewContextMetaKey');
