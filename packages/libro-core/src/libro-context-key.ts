import type { Disposable } from '@difizen/mana-app';
import type { IContextKey } from '@difizen/mana-app';
import { ContextKeyService } from '@difizen/mana-app';
import { inject, singleton } from '@difizen/mana-app';

import { LibroContextKeys } from './libro-protocol.js';
import { LibroService } from './libro-service.js';

@singleton()
export class LibroContextKey {
  protected readonly contextKeyService: ContextKeyService;
  protected readonly libroService: LibroService;
  protected toDisposeOnActiveChanged?: Disposable;
  commandModeEnabled = true;
  protected isCommandMode = false;
  active: IContextKey<boolean>;
  focus: IContextKey<boolean>;
  commandMode: IContextKey<boolean>;

  constructor(
    @inject(ContextKeyService) contextKeyService: ContextKeyService,
    @inject(LibroService) libroService: LibroService,
  ) {
    this.contextKeyService = contextKeyService;
    this.libroService = libroService;
    this.setupActive();
    this.setupFocus();
    this.setupCommandMode();
  }

  disableCommandMode = () => {
    this.commandModeEnabled = false;
    this.commandMode.set(false);
  };

  enableCommandMode = () => {
    this.commandModeEnabled = true;
    this.commandMode.set(this.isCommandMode && !!this.libroService.focus);
  };

  protected setupActive() {
    this.libroService.onActiveChanged(() => {
      if (this.toDisposeOnActiveChanged) {
        this.toDisposeOnActiveChanged.dispose();
      }
      this.active.set(!!this.libroService.active);
      this.listenToActive();
    });
    this.active = this.contextKeyService.createKey<boolean>(
      LibroContextKeys.active,
      !!this.libroService.active,
    );
  }
  protected setupFocus() {
    this.libroService.onFocusChanged(() => {
      this.focus.set(!!this.libroService.focus);
      this.commandMode.set(
        this.isCommandMode && this.commandModeEnabled && !!this.libroService.focus,
      );
    });
    this.focus = this.contextKeyService.createKey<boolean>(
      LibroContextKeys.focus,
      !!this.libroService.focus,
    );
  }

  protected setupCommandMode() {
    this.commandMode = this.contextKeyService.createKey<boolean>(
      LibroContextKeys.commandMode,
      !!this.libroService.active?.model.commandMode && !!this.libroService.focus,
    );
    this.listenToActive();
  }
  protected listenToActive = () => {
    const active = this.libroService.active;
    if (active) {
      this.isCommandMode = !!active.model.commandMode;
      this.commandMode.set(
        this.isCommandMode && this.commandModeEnabled && !!this.libroService.focus,
      );
      this.toDisposeOnActiveChanged = active.model.onCommandModeChanged(() => {
        this.isCommandMode = !!active.model.commandMode;
        this.commandMode.set(
          this.isCommandMode && this.commandModeEnabled && !!this.libroService.focus,
        );
      });
    }
  };
}
/**
 * @deprecated use LibroContextKey instead.
 */
export const LirboContextKey = LibroContextKey;
