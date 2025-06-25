import type { JSONSchemaType } from 'ajv';

import type { ConfigurationStorage } from './configuration-storage.js';

export interface ConfigurationNode<T> {
  /**
   * 唯一id
   */
  id: string;

  /**
   * 位置顺序
   */
  order?: number;

  /**
   * 类型
   * string、number、select、boolean
   *
   * link to schema
   */
  type?: string;

  /**
   * 展示名称
   */
  title?: string;

  /**
   * 描述
   */
  description?: string;

  /**
   * 默认值
   */
  defaultValue: T;

  /**
   * 存储后端，默认内存，可选localstorage
   * 配合provider使用
   */
  storage?: ConfigurationStorage;

  /**
   * 当前配置是否能被覆盖，当为false时不可以重新注册具有相同id的配置
   *
   */
  overridable?: boolean;

  /**
   * 符合json schema规范的json配置，用来校验配置的值
   */
  schema: JSONSchemaType<T>;
}
