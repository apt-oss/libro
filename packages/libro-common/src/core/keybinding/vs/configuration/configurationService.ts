/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Emitter } from '../../../../common/index.js';
import type { Event } from '../../../../common/index.js';
import { singleton } from '../../../../ioc/index.js';
import type { IDisposable } from '../../../utils/lifecycle.js';
import { VSDisposable } from '../../../utils/lifecycle.js';
import { Registry } from '../platform.js';

import {
  ConfigurationTarget,
  isConfigurationOverrides,
  IConfigurationService,
} from './configuration.js';
import type {
  IConfigurationChangeEvent,
  IConfigurationOverrides,
  IConfigurationData,
  IConfigurationValue,
  IConfigurationChange,
} from './configuration.js';
import {
  DefaultConfigurationModel,
  Configuration,
  ConfigurationModel,
  ConfigurationChangeEvent,
  UserSettings,
} from './configurationModels.js';
import { Extensions } from './configurationRegistry.js';
import type { IConfigurationRegistry } from './configurationRegistry.js';

@singleton({ contrib: IConfigurationService })
export class ConfigurationService
  extends VSDisposable
  implements IConfigurationService, IDisposable
{
  readonly _serviceBrand: undefined;

  private configuration: Configuration;
  private userConfiguration: UserSettings;

  private readonly _onDidChangeConfiguration: Emitter<IConfigurationChangeEvent> =
    this._register(new Emitter<IConfigurationChangeEvent>());
  readonly onDidChangeConfiguration: Event<IConfigurationChangeEvent> =
    this._onDidChangeConfiguration.event;

  constructor() {
    super();
    this.userConfiguration = this._register(new UserSettings(undefined));
    this.configuration = new Configuration(
      new DefaultConfigurationModel(),
      new ConfigurationModel(),
    );

    this._register(
      Registry.as<IConfigurationRegistry>(
        Extensions.Configuration,
      ).onDidUpdateConfiguration((configurationProperties) =>
        this.onDidDefaultConfigurationChange(configurationProperties),
      ),
    );
  }

  async initialize(): Promise<void> {
    const userConfiguration = await this.userConfiguration.loadConfiguration();
    this.configuration = new Configuration(
      new DefaultConfigurationModel(),
      userConfiguration,
    );
  }

  getConfigurationData(): IConfigurationData {
    return this.configuration.toData();
  }

  getValue<T>(): T;
  getValue<T>(section: string): T;
  getValue<T>(overrides: IConfigurationOverrides): T;
  getValue<T>(section: string, overrides: IConfigurationOverrides): T;
  getValue(arg1?: any, arg2?: any): any {
    const section = typeof arg1 === 'string' ? arg1 : undefined;
    const overrides = isConfigurationOverrides(arg1)
      ? arg1
      : isConfigurationOverrides(arg2)
        ? arg2
        : {};
    return this.configuration.getValue(section, overrides, undefined);
  }

  updateValue(key: string, value: any): Promise<void>;
  updateValue(
    key: string,
    value: any,
    overrides: IConfigurationOverrides,
  ): Promise<void>;
  updateValue(key: string, value: any, target: ConfigurationTarget): Promise<void>;
  updateValue(
    key: string,
    value: any,
    overrides: IConfigurationOverrides,
    target: ConfigurationTarget,
  ): Promise<void>;
  updateValue(_key: string, _value: any, _arg3?: any, _arg4?: any): Promise<void> {
    return Promise.reject(new Error('not supported'));
  }

  inspect<T>(key: string): IConfigurationValue<T> {
    return this.configuration.inspect<T>(key, {}, undefined);
  }

  keys(): {
    default: string[];
    user: string[];
    workspace: string[];
    workspaceFolder: string[];
  } {
    return this.configuration.keys(undefined);
  }

  async reloadConfiguration(): Promise<void> {
    const configurationModel = await this.userConfiguration.loadConfiguration();
    this.onDidChangeUserConfiguration(configurationModel);
  }

  private onDidChangeUserConfiguration(
    userConfigurationModel: ConfigurationModel,
  ): void {
    const previous = this.configuration.toData();
    const change =
      this.configuration.compareAndUpdateLocalUserConfiguration(userConfigurationModel);
    this.trigger(change, previous, ConfigurationTarget.USER);
  }

  private onDidDefaultConfigurationChange(keys: string[]): void {
    const previous = this.configuration.toData();
    const change = this.configuration.compareAndUpdateDefaultConfiguration(
      new DefaultConfigurationModel(),
      keys,
    );
    this.trigger(change, previous, ConfigurationTarget.DEFAULT);
  }

  private trigger(
    configurationChange: IConfigurationChange,
    previous: IConfigurationData,
    source: ConfigurationTarget,
  ): void {
    const event = new ConfigurationChangeEvent(
      configurationChange,
      { data: previous },
      this.configuration,
    );
    event.source = source;
    event.sourceConfig = this.getTargetConfiguration(source);
    this._onDidChangeConfiguration.fire(event);
  }

  private getTargetConfiguration(target: ConfigurationTarget): any {
    // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
    switch (target) {
      case ConfigurationTarget.DEFAULT:
        return this.configuration.defaults.contents;
      case ConfigurationTarget.USER:
        return this.configuration.localUserConfiguration.contents;
    }
    return {};
  }
}
