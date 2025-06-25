import type { MaybePromise, Event } from '../../common/index.js';
import { Emitter } from '../../common/index.js';

import type { DebugService } from './debug.js';
import { debug } from './debug.js';
import type { LocalStorage, StorageService } from './storage-protocol.js';

export class LocalStorageService implements StorageService {
  public usePathInPrefix = false;
  private storage: LocalStorage = {};
  protected logger: DebugService;

  protected onDiskQuotaExceededEmitter = new Emitter<void>();
  get onDiskQuotaExceeded(): Event<void> {
    return this.onDiskQuotaExceededEmitter.event;
  }

  constructor() {
    this.logger = debug;
    if (typeof window !== 'undefined' && window.localStorage) {
      this.storage = window.localStorage;
      this.testLocalStorage();
    } else {
      this.logger.log("The browser doesn't support localStorage.");
      this.storage = {};
    }
  }

  setData<T>(key: string, data?: T): MaybePromise<void> {
    if (data !== undefined) {
      try {
        const value = JSON.stringify(data);
        this.storage[this.prefix(key)] = value;
      } catch (e) {
        this.onDiskQuotaExceededEmitter.fire();
      }
    } else {
      delete this.storage[this.prefix(key)];
    }
    return;
  }

  getData<T>(key: string, defaultValue?: T): MaybePromise<T> {
    const result = this.storage[this.prefix(key)];
    if (result === undefined) {
      return defaultValue as any;
    }
    try {
      return JSON.parse(result) as any;
    } catch (e) {
      return result;
    }
  }

  protected prefix(key: string): string {
    const pathname = typeof window === 'undefined' ? '' : window.location.pathname;
    const prefix = this.usePathInPrefix ? `mana:${pathname}` : 'mana';
    return `${prefix}:${key}`;
  }

  /**
   * Verify if there is still some spaces left to save another workspace configuration into the local storage of your browser.
   * If we are close to the limit, use a dialog to notify the user.
   */
  private testLocalStorage(): void {
    const keyTest = this.prefix('Test');
    try {
      this.storage[keyTest] = JSON.stringify(new Array(60000));
    } catch (error) {
      this.onDiskQuotaExceededEmitter.fire();
    } finally {
      this.storage.removeItem?.(keyTest);
    }
  }

  clearStorage(): void {
    this.storage.clear?.();
  }
}

export const localStorageService = new LocalStorageService();
