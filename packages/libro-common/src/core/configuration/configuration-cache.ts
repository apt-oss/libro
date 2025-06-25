import type { Disposable } from '../../common/index.js';
import { singleton } from '../../ioc/index.js';

import type { ConfigurationNode } from './configuration-protocol.js';
import type { ConfigurationProvider } from './configuration-provider.js';

@singleton()
export class ConfigurationCache implements Disposable {
  protected cache = new Map<ConfigurationProvider, Map<string, any>>();

  has<T>(provider: ConfigurationProvider, node: ConfigurationNode<T>) {
    return this.cache.has(provider) && this.cache.get(provider)?.has(node.id);
  }

  set<T>(provider: ConfigurationProvider, node: ConfigurationNode<T>, value: T) {
    const providerCache = this.cache.get(provider) ?? new Map();
    providerCache.set(node.id, value);
    this.cache.set(provider, providerCache);
  }

  get<T>(provider: ConfigurationProvider, node: ConfigurationNode<T>): T {
    return this.cache.get(provider)?.get(node.id);
  }

  remove<T>(provider: ConfigurationProvider, node: ConfigurationNode<T>) {
    this.cache.get(provider)?.delete(node.id);
  }

  clear(provider?: ConfigurationProvider) {
    if (provider) {
      this.cache.get(provider)?.clear();
    } else {
      this.cache.clear();
    }
  }

  protected _disposed = false;

  get disposed() {
    return this._disposed;
  }

  dispose() {
    if (this.disposed) {
      return;
    }
    this._disposed = true;
    this.clear();
  }
}
