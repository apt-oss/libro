import type { Event } from '../../common/index.js';
import { isPromiseLike } from '../../common/index.js';
import { Emitter, Disposable, objects } from '../../common/index.js';
import { singleton } from '../../ioc/index.js';
import { prop } from '../../observable/index.js';
import { localStorageService } from '../common/index.js';
import type { StorageService } from '../common/index.js';

import './style/theme-base.less';

export const ThemeServiceSymbol = Symbol('ThemeService');

export type ThemeType = 'light' | 'dark' | 'hc';

export type TokenValue = string | undefined;
export interface ExtraTokens {
  basic?: Record<string, TokenValue>;
  color?: Record<string, TokenValue>;
  [key: string]: Record<string, TokenValue> | undefined;
}
export interface Theme {
  readonly id: string;
  readonly type: ThemeType;
  readonly label: string;
  readonly description?: string;
  readonly extraTokens?: ExtraTokens;
}
export interface ThemeChangeEvent {
  readonly newTheme: Theme;
  readonly oldTheme?: Theme | undefined;
}
export class BuiltinThemeProvider {
  static readonly darkTheme: Theme = {
    id: 'dark',
    type: 'dark',
    label: 'Dark (mana)',
  };

  static readonly lightTheme: Theme = {
    id: 'light',
    type: 'light',
    label: 'Light (mana)',
  };

  static readonly hcTheme: Theme = {
    id: 'hc-mana',
    type: 'hc',
    label: 'High Contrast (mana)',
  };

  static readonly themes = [
    BuiltinThemeProvider.darkTheme,
    BuiltinThemeProvider.lightTheme,
    BuiltinThemeProvider.hcTheme,
  ];
}

@singleton()
export class ThemeService {
  protected themes: Record<string, Theme> = {};
  @prop()
  protected activeTheme: Theme | undefined;
  protected storageService: StorageService = localStorageService;
  protected readonly themeChange = new Emitter<ThemeChangeEvent>();

  readonly onDidColorThemeChange: Event<ThemeChangeEvent> = this.themeChange.event;

  get themeClassName(): string {
    return `mana-${this.getCurrentTheme().type}`;
  }

  constructor() {
    if (typeof window !== undefined) {
      window.addEventListener('mana-theme-change', (event) => {
        // this.setCurrentTheme(event.);
      });
    }
  }

  static get(): ThemeService {
    const global = window as any; // eslint-disable-line @typescript-eslint/no-explicit-any
    if (!global[ThemeServiceSymbol]) {
      const themeService = new ThemeService();
      themeService.register(...BuiltinThemeProvider.themes);
      themeService.startupTheme();
      global[ThemeServiceSymbol] = themeService;
    }
    return global[ThemeServiceSymbol];
  }

  startupTheme() {
    this.activeTheme = this.getCurrentTheme();
  }

  register(...themes: Theme[]): Disposable {
    for (const theme of themes) {
      this.themes[theme.id] = theme;
    }
    this.validateActiveTheme();
    return Disposable.create(() => {
      for (const theme of themes) {
        delete this.themes[theme.id];
      }
    });
  }

  protected validateActiveTheme(): void {
    if (!this.activeTheme) {
      return;
    }
    const themeId = this.getCurrentTheme().id;
    if (themeId !== this.activeTheme.id) {
      this.setCurrentTheme(themeId);
    }
  }

  getThemes(): Theme[] {
    const result = [];
    for (const o in this.themes) {
      if (Object.prototype.hasOwnProperty.call(this.themes, o)) {
        result.push(this.themes[o]);
      }
    }
    return result;
  }

  getTheme(themeId: string): Theme {
    return this.themes[themeId] || this.defaultTheme;
  }

  setCurrentTheme(themeId: string, tokens: ExtraTokens = {}): void {
    const newTheme = this.getTheme(themeId);
    const oldTheme = this.activeTheme;
    if (oldTheme) {
      if (oldTheme.id === newTheme.id && !tokens) {
        return;
      }
    }
    this.activeTheme = objects.mixin(objects.deepClone(newTheme), {
      extraTokens: { ...tokens },
    });
    this.storageService.setData('theme', themeId);
    this.themeChange.fire({
      newTheme,
      oldTheme,
    });
  }

  getCurrentTheme(): Theme {
    const maybeThemeId = this.storageService.getData<string>('theme');
    let themeId = this.defaultTheme.id;
    if (!isPromiseLike(maybeThemeId) && maybeThemeId) {
      themeId = maybeThemeId;
    }
    return this.getTheme(themeId);
  }

  getActiveTheme(): Theme {
    return this.activeTheme || this.getCurrentTheme();
  }

  get defaultTheme(): Theme {
    return BuiltinThemeProvider.lightTheme;
  }

  reset(): void {
    this.setCurrentTheme(this.defaultTheme.id);
  }
}
