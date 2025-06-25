import type { MaybePromise } from '../../common/index.js';
import { singleton, Syringe } from '../../ioc/index.js';
import { prop } from '../../observable/index.js';

import type { ConfigurationNode } from './configuration-protocol.js';
import type { ConfigurationStorage } from './configuration-storage.js';
import {
  LocalConfigurationStorage,
  DefaultConfigurationStorage,
} from './configuration-storage.js';

export const ConfigurationProvider = Syringe.defineToken('ConfigurationProvider');

export interface ConfigurationProvider {
  canHandle: (storage: ConfigurationStorage) => false | number;

  has: <T>(node: ConfigurationNode<T>) => MaybePromise<boolean>;

  get: <T>(node: ConfigurationNode<T>) => MaybePromise<T>;

  set: <T>(node: ConfigurationNode<T>, value: T) => MaybePromise<void>;

  remove: <T>(node: ConfigurationNode<T>) => MaybePromise<void>;

  /**
   * 开启缓存，默认false
   * 对本地同步调用不用开启
   * 对远端异步调用建议开启，防止请求过多
   */
  enableCache?: boolean;

  /**
   * 提前批量获取配置作为缓存, enableCache打开后会在应用初始化调用
   * @param nodes
   * @returns
   */
  prefetch?: (nodes: ConfigurationNode<any>[]) => MaybePromise<any[]>;
}

@singleton({ contrib: [ConfigurationProvider] })
export class DefaultConfigurationProvider implements ConfigurationProvider {
  @prop()
  protected configStore = new Map<string, any>();

  /**
   * 默认用内存的provider
   * @returns
   */
  canHandle(storage: ConfigurationStorage): false | number {
    if (storage === DefaultConfigurationStorage) {
      return 100;
    }
    return 0;
  }

  has = <T>(node: ConfigurationNode<T>) => {
    return this.configStore.has(node.id);
  };

  get = <T>(node: ConfigurationNode<T>) => {
    return this.configStore.get(node.id);
  };

  set = <T>(node: ConfigurationNode<T>, value: T) => {
    this.configStore.set(node.id, value);
  };

  remove = <T>(node: ConfigurationNode<T>) => {
    this.configStore.delete(node.id);
  };
}

@singleton({ contrib: [ConfigurationProvider] })
export class LocalStorageConfigurationProvider implements ConfigurationProvider {
  protected configStore = localStorage;

  canHandle(storage: ConfigurationStorage): false | number {
    if (storage === LocalConfigurationStorage) {
      return 100;
    }
    return 0;
  }

  has = <T>(node: ConfigurationNode<T>) => {
    return this.configStore.getItem(this.prefix(node.id)) !== null;
  };

  get = <T>(node: ConfigurationNode<T>): T => {
    const result = this.configStore.getItem(this.prefix(node.id));
    return JSON.parse(result ?? '');
  };

  set = <T>(node: ConfigurationNode<T>, value: T) => {
    this.configStore.setItem(this.prefix(node.id), JSON.stringify(value));
  };

  remove = <T>(node: ConfigurationNode<T>) => {
    this.configStore.removeItem(this.prefix(node.id));
  };

  protected prefix(key: string): string {
    const pathname = typeof window === 'undefined' ? '' : window.location.pathname;
    return `mana:configuration:${pathname}:${key}`;
  }
}
