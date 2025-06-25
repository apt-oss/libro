import type { Event } from '../../common/index.js';
import { Emitter } from '../../common/index.js';
import { singleton } from '../../ioc/index.js';

import { WindowService } from './application-protocol.js';
import { ApplicationContribution } from './application.js';
import type { Application } from './application.js';

@singleton({
  contrib: [WindowService, ApplicationContribution],
})
export class DefaultWindowService implements WindowService, ApplicationContribution {
  protected frontendApplication?: Application;

  protected onUnloadEmitter = new Emitter<void>();
  get onUnload(): Event<void> {
    return this.onUnloadEmitter.event;
  }

  onStart(app: Application): void {
    this.frontendApplication = app;
    this.registerUnloadListeners();
  }

  canUnload(): boolean {
    // eslint-disable-next-line prefer-const
    let confirmExit = 'never';
    // TODO: core preferrence application.confirmExit

    let preventUnload = this.frontendApplication?.onWillStop();
    preventUnload = confirmExit === 'always' || preventUnload;
    return confirmExit === 'never' || !preventUnload;
  }

  /**
   * Implement the mechanism to detect unloading of the page.
   */
  protected registerUnloadListeners(): void {
    window.addEventListener('beforeunload', (event) => {
      if (!this.canUnload()) {
        return this.preventUnload(event);
      }
      return undefined;
    });
    // In a browser, `unload` is correctly fired when the page unloads, unlike Electron.
    // If `beforeunload` is cancelled, the user will be prompted to leave or stay.
    // If the user stays, the page won't be unloaded, so `unload` is not fired.
    // If the user leaves, the page will be unloaded, so `unload` is fired.
    window.addEventListener('unload', () => this.onUnloadEmitter.fire());
  }

  /**
   * Notify the browser that we do not want to unload.
   *
   * Notes:
   *  - Shows a confirmation popup in browsers.
   *  - Prevents the window from closing without confirmation in electron.
   *
   * @param event The beforeunload event
   */
  protected preventUnload(event: BeforeUnloadEvent): string | void {
    event.returnValue = '';
    event.preventDefault();
    return '';
  }
}
