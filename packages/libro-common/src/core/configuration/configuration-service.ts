import { Emitter } from '../../common/index.js';
import type { Contribution } from '../../ioc/index.js';
import { contrib, inject, singleton } from '../../ioc/index.js';
import { getOrigin } from '../../observable/index.js';
import { ApplicationContribution } from '../application/index.js';

import { ConfigurationCache } from './configuration-cache.js';
import type { ConfigurationNode } from './configuration-protocol.js';
import { ConfigurationProvider } from './configuration-provider.js';
import { ConfigurationRegistry } from './configuration-registry.js';
import type { ConfigurationStorage } from './configuration-storage.js';
import { SchemaValidator } from './validation.js';

@singleton({ contrib: [ApplicationContribution] })
export class ConfigurationService implements ApplicationContribution {
  @contrib(ConfigurationProvider)
  protected providers: Contribution.Provider<ConfigurationProvider>;

  @inject(ConfigurationRegistry)
  protected readonly configurationRegistry: ConfigurationRegistry;

  @inject(SchemaValidator) protected readonly schemaValidator: SchemaValidator;
  @inject(ConfigurationCache) protected readonly configurationCache: ConfigurationCache;

  protected readonly onConfigurationValueChangeEmitter = new Emitter<{
    key: string;
    value: any;
  }>();
  readonly onConfigurationValueChange = this.onConfigurationValueChangeEmitter.event;

  protected storageMap = new Map<ConfigurationStorage, ConfigurationProvider>();

  async onWillStart() {
    await this.prefetch();
  }

  async prefetch() {
    const storageArray = this.configurationRegistry.getStorages();
    for (const storage of storageArray.sort((a, b) => b.priority - a.priority)) {
      const provider = this.getConfigurationProviderByStorage(storage);
      if (!provider || provider.enableCache !== true || !provider.prefetch) {
        continue;
      }
      const nodes = this.configurationRegistry.getConfigurationsByStorage(storage);

      if (!nodes) {
        continue;
      }

      try {
        const cacheValues = await provider.prefetch(nodes);
        nodes.forEach((item, index) => {
          this.configurationCache.set(provider, item, cacheValues[index]);
        });
      } catch (error) {
        console.error('prefetch config failed', error);
      }
    }
  }

  async has<T>(
    node: ConfigurationNode<T>,
    options?: { useCache?: boolean },
  ): Promise<boolean> {
    const useCache = options?.useCache ?? true;
    const storage = this.configurationRegistry.getStorage(node);
    const provider = this.getConfigurationProviderByStorage(storage);
    if (!provider) {
      return false;
    }

    if (provider.enableCache && useCache) {
      const hasCache = this.configurationCache.has(provider, node);
      if (hasCache) {
        return true;
      }
    }

    const hasValue = await provider.has(node);
    if (hasValue) {
      return true;
    }
    return false;
  }

  async get<T>(
    node: ConfigurationNode<T>,
    defaultValue?: T,
    options?: { useCache?: boolean },
  ): Promise<T> {
    let result: T = defaultValue ?? node.defaultValue;
    const useCache = options?.useCache ?? true;
    const storage = this.configurationRegistry.getStorage(node);
    const provider = this.getConfigurationProviderByStorage(storage);
    if (!provider) {
      return result;
    }

    if (provider.enableCache && useCache) {
      const hasCache = this.configurationCache.has(provider, node);
      if (hasCache) {
        result = this.configurationCache.get(provider, node);
        return result;
      }
    }

    const hasValue = await provider.has(node);

    if (!hasValue) {
      return result;
    }
    const val = await provider.get<T>(node);
    result = val;
    if (provider.enableCache) {
      this.configurationCache.set(provider, node, val);
    }
    return result;
  }

  /**
   *
   * @param node 配置
   * @param value 配置的值
   * @param options
   * @returns
   */
  async set<T>(
    node: ConfigurationNode<T>,
    value: T,
    options?: { useCache?: boolean; validate?: boolean },
  ) {
    if (
      options?.validate !== false &&
      !this.schemaValidator.validateNode(node, value)
    ) {
      return;
    }
    const useCache = options?.useCache ?? true;
    const setStorage = this.configurationRegistry.getStorage(node);
    this.configurationRegistry.addStorage(setStorage);
    const provider = this.getConfigurationProviderByStorage(setStorage);
    if (!provider) {
      return;
    }
    if (provider.enableCache && useCache) {
      this.configurationCache.set(provider, node, value);
    }
    await provider.set(node, value);
    this.onConfigurationValueChangeEmitter.fire({ key: node.id, value });
  }

  async remove<T>(node: ConfigurationNode<T>) {
    const storage = this.configurationRegistry.getStorage(node);
    const provider = this.getConfigurationProviderByStorage(storage);
    if (!provider) {
      return;
    }
    if (!provider.has(node)) {
      return;
    }
    this.configurationCache.remove(provider, node);
    provider.remove(node);
  }

  protected getConfigurationProviderByStorage(
    storage: ConfigurationStorage,
  ): ConfigurationProvider | undefined {
    if (this.storageMap.has(storage)) {
      return this.storageMap.get(storage);
    }

    const contribs = this.providers
      .getContributions()
      .map((item) => ({ ...item, priority: item.canHandle(getOrigin(storage)) }))
      .filter((item) => item.priority !== false);
    if (contribs.length === 0) {
      return undefined;
    }
    // 相比sort性能更高
    let maxPriorityProvider = contribs[0];
    for (const provider of contribs) {
      if ((provider.priority as number) > (maxPriorityProvider.priority as number)) {
        maxPriorityProvider = provider;
      }
    }
    this.storageMap.set(storage, maxPriorityProvider);
    return maxPriorityProvider;
  }
}
