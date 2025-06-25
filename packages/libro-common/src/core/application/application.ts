import type { MaybePromise } from '../../common/index.js';
import { Disposable } from '../../common/index.js';
import { Emitter, DisposableCollection } from '../../common/index.js';
import { inject, singleton, Syringe, contrib, Utils } from '../../ioc/index.js';
import type { Decorator, Contribution } from '../../ioc/index.js';
import { DebugService } from '../common/debug.js';

import { WindowService } from './application-protocol.js';
import { ApplicationStateService, ApplicationState } from './application-state.js';

export const ApplicationContribution = Syringe.defineToken('ApplicationContribution');
export type ApplicationContribution = {
  /**
   * Called on application startup.
   */
  initialize?: () => void;

  /**
   * Called before the start of the contributions to complete asynchronous initialization.
   */
  onWillStart?: (app: Application) => MaybePromise<void>;

  /**
   * Called when the application is starting.
   */
  onStart?: (app: Application) => MaybePromise<void>;

  /**
   * Called when the application is started and after the root view has been created.
   */
  onViewStart?: (app: Application) => MaybePromise<void>;
  /**
   * Called on `beforeunload` event, return `true` in order to prevent exit.
   */
  onWillStop?: (app: Application) => boolean;

  /**
   * Called when an application is stopped.
   * Note: this is the last tick.
   */
  onStop?: (app: Application) => void;
};

export function application<T = any>(
  option: Syringe.DecoratorOption<T> = {},
): Decorator<T> {
  return singleton({
    ...option,
    contrib: [ApplicationContribution, ...Utils.toArray(option.contrib)],
    lifecycle: Syringe.Lifecycle.singleton,
  });
}

const TIMER_WARNING_THRESHOLD = 100;

@singleton()
export class Application {
  protected _host?: HTMLElement;
  started = false;

  protected onKeyDownEmitter = new Emitter<KeyboardEvent>();
  protected onHostChangedEmitter = new Emitter<HTMLElement | undefined>();

  protected unmountToDispose = new DisposableCollection();

  protected readonly windowsService: WindowService;
  protected readonly contributions: Contribution.Provider<ApplicationContribution>;
  protected readonly stateService: ApplicationStateService;
  protected readonly debugService: DebugService;

  get host(): HTMLElement | undefined {
    return this._host;
  }

  set host(v: HTMLElement | undefined) {
    this._host = v;
    this.onHostChangedEmitter.fire(v);
  }

  get onKeyDown() {
    return this.onKeyDownEmitter.event;
  }
  get onHostChanged() {
    return this.onHostChangedEmitter.event;
  }

  constructor(
    @inject(WindowService)
    windowsService: WindowService,
    @contrib(ApplicationContribution)
    contributions: Contribution.Provider<ApplicationContribution>,
    @inject(ApplicationStateService)
    stateService: ApplicationStateService,
    @inject(DebugService)
    debugService: DebugService,
  ) {
    this.windowsService = windowsService;
    this.contributions = contributions;
    this.stateService = stateService;
    this.debugService = debugService;
  }

  /**
   * Start the frontend application.
   *
   * Start up consists of the following steps:
   * - start frontend contributions
   * - create root view and render it
   * - restore or create other views and render them
   */
  async start(): Promise<void> {
    if (this.started) {
      return;
    }
    this.started = true;
    await this.initialize();
    this.stateService.setState(ApplicationState.Initialized);
    await this.onStart();
    this.stateService.setState(ApplicationState.Started);
    await this.viewStart();
    this.mount();
    this.stateService.setState(ApplicationState.ViewStarted);
    this.stateService.setState(ApplicationState.Ready);
    this.windowsService.onUnload(() => {
      this.stateService.setState(ApplicationState.Closing);
      this.onStop();
    });
  }

  public inComposition = false;

  /**
   * Register composition related event listeners.
   */
  protected registerCompositionEventListeners(): Disposable {
    const compositionStart = () => {
      this.inComposition = true;
    };
    const compositionEnd = () => {
      this.inComposition = false;
    };
    document.addEventListener('compositionstart', compositionStart);
    document.addEventListener('compositionend', compositionEnd);
    return Disposable.create(() => {
      document.removeEventListener('compositionstart', compositionStart);
      document.removeEventListener('compositionend', compositionEnd);
    });
  }

  protected registerKeyDownListener(): Disposable {
    const fireKeyDown = (e: KeyboardEvent) => {
      this.onKeyDownEmitter.fire(e);
    };
    document.addEventListener('keydown', fireKeyDown);
    return Disposable.create(() => {
      document.removeEventListener('keydown', fireKeyDown);
    });
  }

  mount() {
    this.unmountToDispose.push(this.registerCompositionEventListeners());
    this.unmountToDispose.push(this.registerKeyDownListener());
  }

  unmount() {
    this.unmountToDispose.dispose();
  }

  /**
   * Initialize and start the frontend application contributions.
   */
  protected async initialize(): Promise<void> {
    for (const contribution of this.contributions.getContributions()) {
      if (contribution.initialize) {
        try {
          await this.measure(`${contribution.constructor.name}.initialize`, () => {
            if (contribution.initialize) {
              contribution.initialize();
            }
          });
        } catch (error) {
          console.error('contribution initialize', error);
        }
      }
    }
  }

  /**
   * Initialize and start the frontend application contributions.
   */
  protected async onStart(): Promise<void> {
    for (const contribution of this.contributions.getContributions()) {
      if (contribution.onWillStart) {
        try {
          await this.measure(`${contribution.constructor.name}.onWillStart`, () => {
            if (contribution.onWillStart) {
              return contribution.onWillStart(this);
            }
          });
        } catch (error) {
          console.error('contribution onWillStart', error);
        }
      }
    }

    for (const contribution of this.contributions.getContributions()) {
      if (contribution.onStart) {
        try {
          await this.measure(`${contribution.constructor.name}.onStart`, () => {
            if (contribution.onStart) {
              return contribution.onStart!(this);
            }
          });
        } catch (error) {
          console.error('contribution onStart', error);
        }
      }
    }
  }

  protected async viewStart(): Promise<void> {
    for (const contribution of this.contributions.getContributions()) {
      if (contribution.onViewStart) {
        try {
          await this.measure(
            `${contribution.constructor.name}.initializeLayout`,
            () => {
              if (contribution.onViewStart) {
                return contribution.onViewStart(this);
              }
            },
          );
        } catch (error) {
          console.error('contribution initializeLayout', error);
        }
      }
    }
  }

  onWillStop(): boolean {
    let shouldConfirm = false;
    for (const contribution of this.contributions.getContributions()) {
      if (contribution.onWillStop) {
        try {
          if (contribution.onWillStop) {
            if (contribution.onWillStop(this)) {
              shouldConfirm = true;
            }
          }
        } catch (error) {
          console.error('contribution onWillStop', error);
        }
      }
    }
    return shouldConfirm;
  }

  /**
   * Stop the frontend application contributions. This is called when the window is unloaded.
   */
  protected onStop(): void {
    this.debugService('>>> Stopping contributions...');
    for (const contribution of this.contributions.getContributions()) {
      if (contribution.onStop) {
        try {
          contribution.onStop(this);
        } catch (error) {
          console.error('contribution onStop', error);
        }
      }
    }
    this.debugService('<<< All contributions have been stopped.');
  }

  protected async measure<T>(name: string, fn: () => MaybePromise<T>): Promise<T> {
    const startMark = `${name}-start`;
    const endMark = `${name}-end`;
    performance.mark(startMark);
    const result = await fn();
    performance.mark(endMark);
    performance.measure(name, startMark, endMark);
    for (const item of performance.getEntriesByName(name)) {
      const contribution = `${item.name}`;
      if (item.duration > TIMER_WARNING_THRESHOLD) {
        console.warn(`${contribution} is slow, took: ${item.duration.toFixed(1)} ms`);
      } else {
        this.debugService(`${contribution} took: ${item.duration.toFixed(1)} ms`);
      }
    }
    performance.clearMeasures(name);
    return result;
  }
}
