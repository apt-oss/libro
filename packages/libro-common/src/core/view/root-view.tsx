import * as React from 'react';

import { timeout } from '../../common/index.js';
import { inject, singleton } from '../../ioc/index.js';
import { prop, useInject } from '../../observable/index.js';
import { ApplicationState, ApplicationStateService } from '../application/index.js';
import { parseCssTime } from '../browser.js';

import { view } from './decorator.js';
import { BaseView } from './default-view.js';
import { Slot } from './slot.js';
import { RootSlotId, RootViewId, ViewInstance } from './view-protocol.js';

export const RootComponents = Symbol('RootViewComponent');
export interface RootComponents {
  Loading?: React.FC;
}

export const RootViewComponent = React.forwardRef(function RootViewComponent(
  _props,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  const appState = useInject(ApplicationStateService);
  const instance = useInject<RootView>(ViewInstance);
  const components = useInject<RootComponents>(RootComponents);
  const { Loading = () => null } = components;
  return (
    <div className={instance.className} ref={ref}>
      {appState.state === ApplicationState.Ready && <Slot name={RootSlotId} />}
      {instance.loading && <Loading />}
    </div>
  );
});

@singleton()
@view(RootViewId)
export class RootView extends BaseView {
  override id: string = RootViewId;

  @prop()
  loading = true;

  protected appState!: ApplicationStateService;
  constructor(@inject(ApplicationStateService) appState: ApplicationStateService) {
    super();
    this.appState = appState;
    this.className = 'mana-root';
  }
  override view = RootViewComponent;
  override onViewMount = () => {
    // Prevent forward/back navigation by scrolling in OS X
    // if (isOSX) {
    //   if (this.container?.current) {
    //     this.container?.current.addEventListener('wheel', preventNavigation, { passive: false });
    //   } else {
    //     document.body.addEventListener('wheel', preventNavigation, { passive: false });
    //   }
    // }
    this.appState
      .reachedState(ApplicationState.Ready)
      .then(() => {
        this.hideLoading();
        return;
      })
      .catch((_e) => {
        //
      });
  };

  /**
   * Return an HTML element that indicates the startup phase, e.g. with an animation or a splash screen.
   */
  protected getStartupIndicator(): HTMLElement | undefined {
    if (this.container?.current) {
      const startupElements =
        this.container.current.getElementsByClassName('mana-preload');
      return startupElements.length === 0
        ? undefined
        : (startupElements[0] as HTMLElement);
    }
    return undefined;
  }
  /**
   * If a startup indicator is present, it is first hidden with the `mana-hidden` CSS class and then
   * removed after a while. The delay until removal is taken from the CSS transition duration.
   */
  protected hideLoading(): Promise<void> {
    return new Promise((resolve) => {
      window.requestAnimationFrame(async () => {
        const startupElem = this.getStartupIndicator();
        if (startupElem) {
          startupElem.classList.add('mana-hidden');
          const preloadStyle = window.getComputedStyle(startupElem);
          const transitionDuration = parseCssTime(preloadStyle.transitionDuration, 0);
          await timeout(transitionDuration);
        }
        this.loading = false;
        resolve();
      });
    });
  }
}
