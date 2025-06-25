import * as React from 'react';

import type { Event } from '../../common/index.js';
import { DisposableCollection, Emitter } from '../../common/index.js';
import { transient } from '../../ioc/index.js';
import { prop } from '../../observable/index.js';

import { ViewTitle } from './title.js';
import type { View, ViewComponent, ViewSize } from './view-protocol.js';

let viewCount = 0;

export function BaseViewRender() {
  return <></>;
}
@transient()
export class BaseView implements View {
  /**
   * Ref of container dom node owned by the view.
   */
  container?: React.RefObject<HTMLDivElement> | null;
  /**
   * The id of the view.
   */
  id: string;

  onViewResize?(size: ViewSize): void;
  onViewMount?(): void;
  onViewUnmount?(): void;

  @prop()
  label: string | React.ReactNode = (<></>);

  @prop()
  view: ViewComponent = BaseViewRender;

  /**
   * The classname of view container
   */
  @prop()
  className?: string;

  @prop()
  isDisposed = false;

  @prop()
  isAttached = false;

  @prop()
  isVisible = false;

  title: ViewTitle;

  protected toDispose = new DisposableCollection();

  protected disposedEventEmitter: Emitter<void> = new Emitter();

  onDisposed: Event<void> = this.disposedEventEmitter.event;

  constructor() {
    viewCount += 1;
    this.id = `v-${viewCount}`;
    this.title = new ViewTitle(this);
  }

  dispose() {
    this.toDispose.dispose();
    this.isDisposed = true;
    this.disposedEventEmitter.fire();
  }
}
