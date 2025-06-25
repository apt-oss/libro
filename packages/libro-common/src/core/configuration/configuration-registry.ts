import type { MaybePromise } from '../../common/index.js';
import { DisposableCollection } from '../../common/index.js';
import type { Contribution } from '../../ioc/index.js';
import { contrib, inject, singleton, Syringe } from '../../ioc/index.js';
import { ApplicationContribution } from '../application/index.js';

import type { ConfigurationNode } from './configuration-protocol.js';
import type { ConfigurationStorage } from './configuration-storage.js';
import { DefaultConfigurationStorage } from './configuration-storage.js';
import { SchemaValidator } from './validation.js';

export const ConfigurationContribution = Syringe.defineToken(
  'ConfigurationContribution',
);
export interface ConfigurationContribution {
  registerConfiguration?: () => MaybePromise<ConfigurationNode<any>>;
  registerConfigurations?: () => MaybePromise<ConfigurationNode<any>[]>;
  deregisterConfigurations?: () => MaybePromise<ConfigurationNode<any>[]>;
}

@singleton({ contrib: [ApplicationContribution] })
export class ConfigurationRegistry implements ApplicationContribution {
  protected readonly schemaValidator: SchemaValidator;

  protected providers: Contribution.Provider<ConfigurationContribution>;

  protected toDispose = new DisposableCollection();

  protected defaultStorage = DefaultConfigurationStorage;

  protected configurationNodes: ConfigurationNode<unknown>[] = [];

  protected scopes = new Map<ConfigurationStorage['id'], ConfigurationStorage>();

  constructor(
    @inject(SchemaValidator) schemaValidator: SchemaValidator,
    @contrib(ConfigurationContribution)
    providers: Contribution.Provider<ConfigurationContribution>,
  ) {
    this.schemaValidator = schemaValidator;
    this.providers = providers;
  }

  async onStart() {
    await this.setupConfiguration();
  }

  protected async setupConfiguration() {
    const contribs = this.providers.getContributions();
    for (const configurationContrib of contribs) {
      if (configurationContrib.registerConfiguration) {
        const node = await configurationContrib.registerConfiguration();
        this.registerConfiguration(node);
      }
      if (configurationContrib.registerConfigurations) {
        const nodes = await configurationContrib.registerConfigurations();
        this.registerConfigurations(nodes);
      }
    }

    for (const configurationContrib of contribs) {
      if (configurationContrib.deregisterConfigurations) {
        const nodes = await configurationContrib.deregisterConfigurations();
        this.deregisterConfigurations(nodes);
      }
    }
  }

  getStorage(configuration: ConfigurationNode<any>) {
    return configuration.storage ?? this.defaultStorage;
  }

  hasConfiguration(configuration: ConfigurationNode<any>): boolean {
    let has = false;
    for (const node of this.configurationNodes) {
      if (node.id === configuration.id) {
        has = true;
        break;
      }
    }
    return has;
  }

  findConfiguration<T>(id: string): ConfigurationNode<T> | undefined {
    let result: ConfigurationNode<T> | undefined;
    for (const node of this.configurationNodes) {
      if (node.id === id) {
        result = node as ConfigurationNode<T>;
        break;
      }
    }
    return result;
  }

  /**
   * Register a configuration to the registry.
   */
  registerConfiguration(configuration: ConfigurationNode<any>) {
    const config = this.findConfiguration(configuration.id);

    if (config && config.overridable === false) {
      console.warn(`cannot override configuration: ${config.id}`);
      return;
    }

    this.schemaValidator.addSchema(configuration);
    this.deregisterConfiguration(configuration);
    this.configurationNodes.push(configuration as ConfigurationNode<unknown>);
    const scope = this.getStorage(configuration);
    this.addStorage(scope);
  }

  /**
   * Register multiple configurations to the registry.
   */
  registerConfigurations(configurations: ConfigurationNode<any>[]) {
    configurations.forEach((config) => {
      this.registerConfiguration(config);
    });
  }

  /**
   * Deregister multiple configurations from the registry.
   */
  deregisterConfigurations(configurations: ConfigurationNode<any>[]) {
    configurations.forEach((config) => {
      this.deregisterConfiguration(config);
    });
  }

  deregisterConfiguration(configuration: ConfigurationNode<any>) {
    const currentConfig = this.findConfiguration(configuration.id);
    if (!currentConfig) {
      return;
    }
    const index = this.configurationNodes.findIndex(
      (item) => item.id === configuration.id,
    );
    if (index >= 0) {
      this.configurationNodes.splice(index, 1);
    }
  }

  getConfigurationsByScope(
    storage: ConfigurationStorage,
  ): ConfigurationNode<unknown>[] | undefined {
    return this.configurationNodes.filter((node) => {
      const nodeStorage = node.storage ?? DefaultConfigurationStorage;
      return nodeStorage === storage;
    });
  }

  getConfigurationsByStorage(
    storage: ConfigurationStorage,
  ): ConfigurationNode<unknown>[] | undefined {
    return this.configurationNodes.filter((node) => {
      return this.getStorage(node) === storage;
    });
  }

  getStorages() {
    return Array.from(this.scopes.values());
  }

  /**
   *  添加scope，已包含错误处理
   */
  addStorage(scope: ConfigurationStorage) {
    if (
      this.scopes.get(scope.id) &&
      this.scopes.get(scope.id)?.priority !== scope.priority
    ) {
      console.warn('添加scope时,scopeId相同,priority不一致');
      return;
    }
    if (!this.scopes.has(scope.id)) {
      this.scopes.set(scope.id, scope);
    }
  }

  getConfigurationByNamespace(
    namespace: string[],
    isFullMatch = true,
  ): ConfigurationNode<unknown>[] {
    const nodes = [];
    for (const node of this.configurationNodes) {
      const nodeNamespace = this.getNamespace(node);
      if (isFullMatch) {
        if (nodeNamespace.join('.') === namespace.join('.')) {
          nodes.push(node);
        }
      } else {
        if (nodeNamespace.join('.').startsWith(namespace.join('.'))) {
          nodes.push(node);
        }
      }
    }
    return nodes;
  }

  getNamespace(node: ConfigurationNode<any>): string[] {
    const segments = node.id.split('.').filter((item) => item.trim() !== '');
    if (segments.length <= 1) {
      throw new Error('invalid configuration! id must have dot, eg. editor.fontsize');
    }
    return segments.slice(0, segments.length - 1);
  }

  getRootNamespaces(): string[] {
    const ids = this.configurationNodes
      .map((item) => item.id.split('.').at(0))
      .filter((item) => item !== undefined) as string[];
    return Array.from(new Set(ids));
  }

  getChildNamespaces(namespace: string[]): string[][] {
    if (namespace.length === 0) {
      console.warn('invalid namespace');
      return [];
    }
    return this.configurationNodes
      .map((item) => {
        const nodeNamespace = this.getNamespace(item);

        if (
          namespace.length < nodeNamespace.length &&
          nodeNamespace.join('.').startsWith(namespace.join('.'))
        ) {
          return nodeNamespace.slice(0, namespace.length + 1);
        }

        return [];
      })
      .filter((item) => item.length > 0);
  }
}
