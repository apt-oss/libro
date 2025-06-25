/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Emitter } from '../../../../common/index.js';
import { types } from '../../../../common/index.js';
import { objects } from '../../../../common/index.js';
import type { URI } from '../../../../common/index.js';
import type { Event } from '../../../../common/index.js';
import { getOrSet, ResourceMap, VSDisposable } from '../../../utils/index.js';
import { Registry } from '../platform.js';

import {
  addToValueTree,
  toValuesTree,
  getConfigurationValue,
  getDefaultValues,
  getConfigurationKeys,
  removeFromValueTree,
  toOverrides,
  compare,
} from './configuration';
import type {
  IOverrides,
  IConfigurationModel,
  IConfigurationOverrides,
  IConfigurationData,
  IConfigurationValue,
  ConfigurationTarget,
  IConfigurationChangeEvent,
  IConfigurationChange,
} from './configuration';
import {
  OVERRIDE_PROPERTY_PATTERN,
  ConfigurationScope,
  Extensions,
  overrideIdentifierFromKey,
} from './configurationRegistry';
import type {
  IConfigurationRegistry,
  IConfigurationPropertySchema,
} from './configurationRegistry';
import * as json from './json';

//TODO
interface Workspace {
  getFolder: (_resource: URI) => { uri: URI } | null;
}
export function distinct<T>(array: readonly T[], keyFn?: (_t: T) => string): T[] {
  if (!keyFn) {
    return array.filter((element, position) => {
      return array.indexOf(element) === position;
    });
  }

  const seen: Record<string, boolean> = Object.create(null);
  return array.filter((elem) => {
    const key = keyFn(elem);
    if (seen[key]) {
      return false;
    }

    seen[key] = true;

    return true;
  });
}

export function equals<T>(
  one: readonly T[] | undefined,
  other: readonly T[] | undefined,
  itemEquals: (_a: T, _b: T) => boolean = (a, b) => a === b,
): boolean {
  if (one === other) {
    return true;
  }

  if (!one || !other) {
    return false;
  }

  if (one.length !== other.length) {
    return false;
  }

  for (let i = 0, len = one.length; i < len; i++) {
    if (!itemEquals(one[i], other[i])) {
      return false;
    }
  }

  return true;
}

export class ConfigurationModel implements IConfigurationModel {
  private isFrozen = false;
  private _contents: any = {};
  private _keys: string[] = [];
  private _overrides: IOverrides[] = [];

  constructor(
    _contents: any = {},
    _keys: string[] = [],
    _overrides: IOverrides[] = [],
  ) {
    this._contents = _contents;
    this._keys = _keys;
    this._overrides = _overrides;
  }

  get contents(): any {
    return this.checkAndFreeze(this._contents);
  }

  get overrides(): IOverrides[] {
    return this.checkAndFreeze(this._overrides);
  }

  get keys(): string[] {
    return this.checkAndFreeze(this._keys);
  }

  isEmpty(): boolean {
    return (
      this._keys.length === 0 &&
      Object.keys(this._contents).length === 0 &&
      this._overrides.length === 0
    );
  }

  getValue<V>(section: string | undefined): V {
    return section ? getConfigurationValue<any>(this.contents, section) : this.contents;
  }

  getOverrideValue<V>(
    section: string | undefined,
    overrideIdentifier: string,
  ): V | undefined {
    const overrideContents = this.getContentsForOverrideIdentifer(overrideIdentifier);
    return overrideContents
      ? section
        ? getConfigurationValue<any>(overrideContents, section)
        : overrideContents
      : undefined;
  }

  getKeysForOverrideIdentifier(identifier: string): string[] {
    for (const override of this.overrides) {
      if (override.identifiers.indexOf(identifier) !== -1) {
        return override.keys;
      }
    }
    return [];
  }

  override(identifier: string): ConfigurationModel {
    const overrideContents = this.getContentsForOverrideIdentifer(identifier);

    if (
      !overrideContents ||
      typeof overrideContents !== 'object' ||
      !Object.keys(overrideContents).length
    ) {
      // If there are no valid overrides, return self
      return this;
    }

    const contents: any = {};
    for (const key of distinct([
      ...Object.keys(this.contents),
      ...Object.keys(overrideContents),
    ])) {
      let contentsForKey = this.contents[key];
      const overrideContentsForKey = overrideContents[key];

      // If there are override contents for the key, clone and merge otherwise use base contents
      if (overrideContentsForKey) {
        // Clone and merge only if base contents and override contents are of type object otherwise just override
        if (
          typeof contentsForKey === 'object' &&
          typeof overrideContentsForKey === 'object'
        ) {
          contentsForKey = objects.deepClone(contentsForKey);
          this.mergeContents(contentsForKey, overrideContentsForKey);
        } else {
          contentsForKey = overrideContentsForKey;
        }
      }

      contents[key] = contentsForKey;
    }

    return new ConfigurationModel(contents, this.keys, this.overrides);
  }

  merge(...others: ConfigurationModel[]): ConfigurationModel {
    const contents = objects.deepClone(this.contents);
    const overrides = objects.deepClone(this.overrides);
    const keys = [...this.keys];

    for (const other of others) {
      this.mergeContents(contents, other.contents);

      for (const otherOverride of other.overrides) {
        const [override] = overrides.filter((o) =>
          equals(o.identifiers, otherOverride.identifiers),
        );
        if (override) {
          this.mergeContents(override.contents, otherOverride.contents);
        } else {
          overrides.push(objects.deepClone(otherOverride));
        }
      }
      for (const key of other.keys) {
        if (keys.indexOf(key) === -1) {
          keys.push(key);
        }
      }
    }
    return new ConfigurationModel(contents, keys, overrides);
  }

  freeze(): ConfigurationModel {
    this.isFrozen = true;
    return this;
  }

  private mergeContents(source: any, target: any): void {
    for (const key of Object.keys(target)) {
      if (key in source) {
        if (types.isObject(source[key]) && types.isObject(target[key])) {
          this.mergeContents(source[key], target[key]);
          continue;
        }
      }
      source[key] = objects.deepClone(target[key]);
    }
  }

  private checkAndFreeze<T>(data: T): T {
    if (this.isFrozen && !Object.isFrozen(data)) {
      return objects.deepFreeze(data);
    }
    return data;
  }

  private getContentsForOverrideIdentifer(identifier: string): any {
    for (const override of this.overrides) {
      if (override.identifiers.indexOf(identifier) !== -1) {
        return override.contents;
      }
    }
    return null;
  }

  toJSON(): IConfigurationModel {
    return {
      contents: this.contents,
      overrides: this.overrides,
      keys: this.keys,
    };
  }

  // Update methods

  public setValue(key: string, value: any) {
    this.addKey(key);
    addToValueTree(this.contents, key, value, (e) => {
      throw new Error(e);
    });
  }

  public removeValue(key: string): void {
    if (this.removeKey(key)) {
      removeFromValueTree(this.contents, key);
    }
  }

  private addKey(key: string): void {
    let index = this.keys.length;
    for (let i = 0; i < index; i++) {
      if (key.indexOf(this.keys[i]) === 0) {
        index = i;
      }
    }
    this.keys.splice(index, 1, key);
  }

  private removeKey(key: string): boolean {
    const index = this.keys.indexOf(key);
    if (index !== -1) {
      this.keys.splice(index, 1);
      return true;
    }
    return false;
  }
}

export class DefaultConfigurationModel extends ConfigurationModel {
  constructor() {
    const contents = getDefaultValues();
    const keys = getConfigurationKeys();
    const overrides: IOverrides[] = [];
    for (const key of Object.keys(contents)) {
      if (OVERRIDE_PROPERTY_PATTERN.test(key)) {
        overrides.push({
          identifiers: [overrideIdentifierFromKey(key).trim()],
          keys: Object.keys(contents[key]),
          contents: toValuesTree(contents[key], (message) =>
            console.error(`Conflict in default settings file: ${message}`),
          ),
        });
      }
    }
    super(contents, keys, overrides);
  }
}

export class ConfigurationModelParser {
  private _raw: any = null;
  private _configurationModel: ConfigurationModel | null = null;
  private _parseErrors: any[] = [];
  protected readonly _name: string;
  private _scopes?: ConfigurationScope[] | undefined;

  constructor(_name: string, _scopes?: ConfigurationScope[]) {
    this._name = _name;
    this._scopes = _scopes;
  }

  get configurationModel(): ConfigurationModel {
    return this._configurationModel || new ConfigurationModel();
  }

  get errors(): any[] {
    return this._parseErrors;
  }

  public parseContent(content: string | null | undefined): void {
    if (!types.isUndefinedOrNull(content)) {
      const raw = this.doParseContent(content);
      this.parseRaw(raw);
    }
  }

  public parseRaw(raw: any): void {
    this._raw = raw;
    const configurationModel = this.doParseRaw(raw);
    this._configurationModel = new ConfigurationModel(
      configurationModel.contents,
      configurationModel.keys,
      configurationModel.overrides,
    );
  }

  public parse(): void {
    if (this._raw) {
      this.parseRaw(this._raw);
    }
  }

  protected doParseContent(content: string): any {
    let raw: any = {};
    let currentProperty: string | null = null;
    let currentParent: any = [];
    const previousParents: any[] = [];
    const parseErrors: json.ParseError[] = [];

    function onValue(value: any) {
      if (Array.isArray(currentParent)) {
        (<any[]>currentParent).push(value);
      } else if (currentProperty) {
        currentParent[currentProperty] = value;
      }
    }

    const visitor: json.JSONVisitor = {
      onObjectBegin: () => {
        const object = {};
        onValue(object);
        previousParents.push(currentParent);
        currentParent = object;
        currentProperty = null;
      },
      onObjectProperty: (name: string) => {
        currentProperty = name;
      },
      onObjectEnd: () => {
        currentParent = previousParents.pop();
      },
      onArrayBegin: () => {
        const array: any[] = [];
        onValue(array);
        previousParents.push(currentParent);
        currentParent = array;
        currentProperty = null;
      },
      onArrayEnd: () => {
        currentParent = previousParents.pop();
      },
      onLiteralValue: onValue,
      onError: (error: json.ParseErrorCode, offset: number, length: number) => {
        parseErrors.push({ error, offset, length });
      },
    };
    if (content) {
      try {
        json.visit(content, visitor);
        raw = currentParent[0] || {};
      } catch (e) {
        console.error(`Error while parsing settings file ${this._name}: ${e}`);
        this._parseErrors = [e];
      }
    }

    return raw;
  }

  protected doParseRaw(raw: any): IConfigurationModel {
    if (this._scopes) {
      const configurationProperties = Registry.as<IConfigurationRegistry>(
        Extensions.Configuration,
      ).getConfigurationProperties();
      raw = this.filterByScope(raw, configurationProperties, true, this._scopes);
    }
    const contents = toValuesTree(raw, (message) =>
      console.error(`Conflict in settings file ${this._name}: ${message}`),
    );
    const keys = Object.keys(raw);
    const overrides: IOverrides[] = toOverrides(raw, (message) =>
      console.error(`Conflict in settings file ${this._name}: ${message}`),
    );
    return { contents, keys, overrides };
  }

  private filterByScope(
    properties: any,
    configurationProperties: Record<string, IConfigurationPropertySchema>,
    filterOverriddenProperties: boolean,
    scopes: ConfigurationScope[],
  ): any {
    const result: any = {};
    for (const key in properties) {
      if (OVERRIDE_PROPERTY_PATTERN.test(key) && filterOverriddenProperties) {
        result[key] = this.filterByScope(
          properties[key],
          configurationProperties,
          false,
          scopes,
        );
      } else {
        const scope = this.getScope(key, configurationProperties);
        // Load unregistered configurations always.
        if (scope === undefined || scopes.indexOf(scope) !== -1) {
          result[key] = properties[key];
        }
      }
    }
    return result;
  }

  private getScope(
    key: string,
    configurationProperties: Record<string, IConfigurationPropertySchema>,
  ): ConfigurationScope | undefined {
    const propertySchema = configurationProperties[key];
    return propertySchema
      ? typeof propertySchema.scope !== 'undefined'
        ? propertySchema.scope
        : ConfigurationScope.WINDOW
      : undefined;
  }
}

export class UserSettings extends VSDisposable {
  private readonly parser: ConfigurationModelParser;
  protected readonly _onDidChange: Emitter<void> = this._register(new Emitter<void>());
  readonly onDidChange: Event<void> = this._onDidChange.event;
  private readonly scopes: ConfigurationScope[] | undefined;

  constructor(scopes: ConfigurationScope[] | undefined) {
    super();
    this.scopes = scopes;
    this.parser = new ConfigurationModelParser('UserSettings', this.scopes);
  }

  async loadConfiguration(): Promise<ConfigurationModel> {
    try {
      this.parser.parseContent('{}');
      return this.parser.configurationModel;
    } catch (e) {
      return new ConfigurationModel();
    }
  }

  reprocess(): ConfigurationModel {
    this.parser.parse();
    return this.parser.configurationModel;
  }
}

export class Configuration {
  private _workspaceConsolidatedConfiguration: ConfigurationModel | null = null;
  private _foldersConsolidatedConfigurations: ResourceMap<ConfigurationModel> =
    new ResourceMap<ConfigurationModel>();

  private _defaultConfiguration: ConfigurationModel;
  private _localUserConfiguration: ConfigurationModel;
  private _remoteUserConfiguration: ConfigurationModel = new ConfigurationModel();
  private _workspaceConfiguration: ConfigurationModel = new ConfigurationModel();
  private _memoryConfiguration: ConfigurationModel = new ConfigurationModel();
  private _memoryConfigurationByResource: ResourceMap<ConfigurationModel> =
    new ResourceMap<ConfigurationModel>();
  private _freeze = true;

  constructor(
    _defaultConfiguration: ConfigurationModel,
    _localUserConfiguration: ConfigurationModel,
    _remoteUserConfiguration: ConfigurationModel = new ConfigurationModel(),
    _workspaceConfiguration: ConfigurationModel = new ConfigurationModel(),
    _memoryConfiguration: ConfigurationModel = new ConfigurationModel(),
    _memoryConfigurationByResource: ResourceMap<ConfigurationModel> = new ResourceMap<ConfigurationModel>(),
    _freeze = true,
  ) {
    this._memoryConfigurationByResource;

    this._defaultConfiguration = _defaultConfiguration;
    this._localUserConfiguration = _localUserConfiguration;
    this._remoteUserConfiguration = _remoteUserConfiguration;
    this._workspaceConfiguration = _workspaceConfiguration;
    this._memoryConfiguration = _memoryConfiguration;
    this._memoryConfigurationByResource = _memoryConfigurationByResource;
    this._freeze = _freeze;
  }

  getValue(
    section: string | undefined,
    overrides: IConfigurationOverrides,
    workspace: Workspace | undefined,
  ): any {
    const consolidateConfigurationModel = this.getConsolidateConfigurationModel(
      overrides,
      workspace,
    );
    return consolidateConfigurationModel.getValue(section);
  }

  updateValue(
    _key: string,
    _value: any,
    _overrides: IConfigurationOverrides = {},
  ): void {
    //
  }

  inspect<C>(
    key: string,
    overrides: IConfigurationOverrides,
    _workspace: Workspace | undefined,
  ): IConfigurationValue<C> {
    const defaultValue = overrides.overrideIdentifier
      ? this._defaultConfiguration
          .freeze()
          .override(overrides.overrideIdentifier)
          .getValue<C>(key)
      : this._defaultConfiguration.freeze().getValue<C>(key);

    return {
      defaultValue,
      default:
        defaultValue !== undefined
          ? {
              value: this._defaultConfiguration.freeze().getValue(key),
              override: overrides.overrideIdentifier
                ? this._defaultConfiguration
                    .freeze()
                    .getOverrideValue(key, overrides.overrideIdentifier)
                : undefined,
            }
          : undefined,
    };
  }

  keys(_workspace: Workspace | undefined): {
    default: string[];
    user: string[];
    workspace: string[];
    workspaceFolder: string[];
  } {
    return {
      default: this._defaultConfiguration.freeze().keys,
      user: this._defaultConfiguration.freeze().keys,
      workspace: this._defaultConfiguration.freeze().keys,
      workspaceFolder: this._defaultConfiguration.freeze().keys,
    };
  }

  updateDefaultConfiguration(defaultConfiguration: ConfigurationModel): void {
    this._defaultConfiguration = defaultConfiguration;
    this._workspaceConsolidatedConfiguration = null;
    this._foldersConsolidatedConfigurations.clear();
  }

  updateLocalUserConfiguration(localUserConfiguration: ConfigurationModel): void {
    this._localUserConfiguration = localUserConfiguration;
    this._userConfiguration = null;
    this._workspaceConsolidatedConfiguration = null;
    this._foldersConsolidatedConfigurations.clear();
  }

  updateRemoteUserConfiguration(remoteUserConfiguration: ConfigurationModel): void {
    this._remoteUserConfiguration = remoteUserConfiguration;
    this._userConfiguration = null;
    this._workspaceConsolidatedConfiguration = null;
    this._foldersConsolidatedConfigurations.clear();
  }

  updateWorkspaceConfiguration(workspaceConfiguration: ConfigurationModel): void {
    this._workspaceConfiguration = workspaceConfiguration;
    this._workspaceConsolidatedConfiguration = null;
    this._foldersConsolidatedConfigurations.clear();
  }

  compareAndUpdateDefaultConfiguration(
    defaults: ConfigurationModel,
    keys: string[],
  ): IConfigurationChange {
    const overrides: [string, string[]][] = keys
      .filter((key) => OVERRIDE_PROPERTY_PATTERN.test(key))
      .map((key) => {
        const overrideIdentifier = overrideIdentifierFromKey(key);
        const fromKeys =
          this._defaultConfiguration.getKeysForOverrideIdentifier(overrideIdentifier);
        const toKeys = defaults.getKeysForOverrideIdentifier(overrideIdentifier);
        const keys = [
          ...toKeys.filter((key) => fromKeys.indexOf(key) === -1),
          ...fromKeys.filter((key) => toKeys.indexOf(key) === -1),
          ...fromKeys.filter(
            (key) =>
              !objects.objectEquals(
                this._defaultConfiguration.override(overrideIdentifier).getValue(key),
                defaults.override(overrideIdentifier).getValue(key),
              ),
          ),
        ];
        return [overrideIdentifier, keys];
      });
    this.updateDefaultConfiguration(defaults);
    return { keys, overrides };
  }

  compareAndUpdateLocalUserConfiguration(
    user: ConfigurationModel,
  ): IConfigurationChange {
    const { added, updated, removed, overrides } = compare(
      this.localUserConfiguration,
      user,
    );
    const keys = [...added, ...updated, ...removed];
    if (keys.length) {
      this.updateLocalUserConfiguration(user);
    }
    return { keys, overrides };
  }

  compareAndUpdateRemoteUserConfiguration(
    user: ConfigurationModel,
  ): IConfigurationChange {
    const { added, updated, removed, overrides } = compare(
      this.remoteUserConfiguration,
      user,
    );
    const keys = [...added, ...updated, ...removed];
    if (keys.length) {
      this.updateRemoteUserConfiguration(user);
    }
    return { keys, overrides };
  }

  compareAndUpdateWorkspaceConfiguration(
    workspaceConfiguration: ConfigurationModel,
  ): IConfigurationChange {
    const { added, updated, removed, overrides } = compare(
      this.workspaceConfiguration,
      workspaceConfiguration,
    );
    const keys = [...added, ...updated, ...removed];
    if (keys.length) {
      this.updateWorkspaceConfiguration(workspaceConfiguration);
    }
    return { keys, overrides };
  }

  compareAndUpdateFolderConfiguration(
    _resource: URI,
    _folderConfiguration: ConfigurationModel,
  ): IConfigurationChange {
    return { keys: [], overrides: [] };
  }

  compareAndDeleteFolderConfiguration(_folder: URI): IConfigurationChange {
    return { keys: [], overrides: [] };
  }

  get defaults(): ConfigurationModel {
    return this._defaultConfiguration;
  }

  private _userConfiguration: ConfigurationModel | null = null;
  get userConfiguration(): ConfigurationModel {
    if (!this._userConfiguration) {
      this._userConfiguration = this._remoteUserConfiguration.isEmpty()
        ? this._localUserConfiguration
        : this._localUserConfiguration.merge(this._remoteUserConfiguration);
      if (this._freeze) {
        this._userConfiguration.freeze();
      }
    }
    return this._userConfiguration;
  }

  get localUserConfiguration(): ConfigurationModel {
    return this._localUserConfiguration;
  }

  get remoteUserConfiguration(): ConfigurationModel {
    return this._remoteUserConfiguration;
  }

  get workspaceConfiguration(): ConfigurationModel {
    return this._workspaceConfiguration;
  }

  private getConsolidateConfigurationModel(
    overrides: IConfigurationOverrides,
    workspace: Workspace | undefined,
  ): ConfigurationModel {
    const configurationModel = this.getConsolidatedConfigurationModelForResource(
      overrides,
      workspace,
    );
    return overrides.overrideIdentifier
      ? configurationModel.override(overrides.overrideIdentifier)
      : configurationModel;
  }

  private getConsolidatedConfigurationModelForResource(
    { resource: _resource }: IConfigurationOverrides,
    _workspace: Workspace | undefined,
  ): ConfigurationModel {
    const consolidateConfiguration = this.getWorkspaceConsolidatedConfiguration();

    return consolidateConfiguration;
  }

  private getWorkspaceConsolidatedConfiguration(): ConfigurationModel {
    if (!this._workspaceConsolidatedConfiguration) {
      this._workspaceConsolidatedConfiguration = this._defaultConfiguration.merge(
        this.userConfiguration,
        this._workspaceConfiguration,
        this._memoryConfiguration,
      );
      if (this._freeze) {
        this._workspaceConfiguration = this._workspaceConfiguration.freeze();
      }
    }
    return this._workspaceConsolidatedConfiguration;
  }

  toData(): IConfigurationData {
    return {
      defaults: {
        contents: this._defaultConfiguration.contents,
        overrides: this._defaultConfiguration.overrides,
        keys: this._defaultConfiguration.keys,
      },
      user: {
        contents: this.userConfiguration.contents,
        overrides: this.userConfiguration.overrides,
        keys: this.userConfiguration.keys,
      },
      workspace: {
        contents: this._workspaceConfiguration.contents,
        overrides: this._workspaceConfiguration.overrides,
        keys: this._workspaceConfiguration.keys,
      },
    };
  }

  allKeys(): string[] {
    const keys: Set<string> = new Set<string>();
    this._defaultConfiguration.freeze().keys.forEach((key) => keys.add(key));
    this.userConfiguration.freeze().keys.forEach((key) => keys.add(key));
    this._workspaceConfiguration.freeze().keys.forEach((key) => keys.add(key));
    return [...keys.values()];
  }

  protected getAllKeysForOverrideIdentifier(overrideIdentifier: string): string[] {
    const keys: Set<string> = new Set<string>();
    this._defaultConfiguration
      .getKeysForOverrideIdentifier(overrideIdentifier)
      .forEach((key) => keys.add(key));
    this.userConfiguration
      .getKeysForOverrideIdentifier(overrideIdentifier)
      .forEach((key) => keys.add(key));
    this._workspaceConfiguration
      .getKeysForOverrideIdentifier(overrideIdentifier)
      .forEach((key) => keys.add(key));
    return [...keys.values()];
  }

  static parse(data: IConfigurationData): Configuration {
    const defaultConfiguration = this.parseConfigurationModel(data.defaults);
    const userConfiguration = this.parseConfigurationModel(data.user);
    const workspaceConfiguration = this.parseConfigurationModel(data.workspace);
    return new Configuration(
      defaultConfiguration,
      userConfiguration,
      new ConfigurationModel(),
      workspaceConfiguration,
      new ConfigurationModel(),
      new ResourceMap<ConfigurationModel>(),
      false,
    );
  }

  private static parseConfigurationModel(
    model: IConfigurationModel,
  ): ConfigurationModel {
    return new ConfigurationModel(model.contents, model.keys, model.overrides).freeze();
  }
}

export function mergeChanges(...changes: IConfigurationChange[]): IConfigurationChange {
  if (changes.length === 0) {
    return { keys: [], overrides: [] };
  }
  if (changes.length === 1) {
    return changes[0];
  }
  const keysSet = new Set<string>();
  const overridesMap = new Map<string, Set<string>>();
  for (const change of changes) {
    change.keys.forEach((key) => keysSet.add(key));
    change.overrides.forEach(([identifier, keys]) => {
      const result = getOrSet(overridesMap, identifier, new Set<string>());
      keys.forEach((key) => result.add(key));
    });
  }
  const overrides: [string, string[]][] = [];
  overridesMap.forEach((keys, identifier) =>
    overrides.push([identifier, [...keys.values()]]),
  );
  return { keys: [...keysSet.values()], overrides };
}

export class ConfigurationChangeEvent implements IConfigurationChangeEvent {
  private readonly affectedKeysTree: any;
  readonly affectedKeys: string[];
  source!: ConfigurationTarget;
  sourceConfig: any;

  readonly change: IConfigurationChange;
  private readonly previous:
    | { workspace?: Workspace; data: IConfigurationData }
    | undefined;
  private readonly currentConfiguraiton: Configuration;
  private readonly currentWorkspace?: Workspace | undefined;

  constructor(
    change: IConfigurationChange,
    previous: { workspace?: Workspace; data: IConfigurationData } | undefined,
    currentConfiguraiton: Configuration,
    currentWorkspace?: Workspace,
  ) {
    this.change = change;
    this.previous = previous;
    this.currentConfiguraiton = currentConfiguraiton;
    this.currentWorkspace = currentWorkspace;

    const keysSet = new Set<string>();
    change.keys.forEach((key) => keysSet.add(key));
    change.overrides.forEach(([, keys]) => keys.forEach((key) => keysSet.add(key)));
    this.affectedKeys = [...keysSet.values()];

    const configurationModel = new ConfigurationModel();
    this.affectedKeys.forEach((key) => configurationModel.setValue(key, {}));
    this.affectedKeysTree = configurationModel.contents;
  }

  private _previousConfiguration: Configuration | undefined = undefined;
  get previousConfiguration(): Configuration | undefined {
    if (!this._previousConfiguration && this.previous) {
      this._previousConfiguration = Configuration.parse(this.previous.data);
    }
    return this._previousConfiguration;
  }

  affectsConfiguration(section: string, overrides?: IConfigurationOverrides): boolean {
    if (this.doesAffectedKeysTreeContains(this.affectedKeysTree, section)) {
      if (overrides) {
        const value1 = this.previousConfiguration
          ? this.previousConfiguration.getValue(
              section,
              overrides,
              this.previous?.workspace,
            )
          : undefined;
        const value2 = this.currentConfiguraiton.getValue(
          section,
          overrides,
          this.currentWorkspace,
        );
        return !objects.objectEquals(value1, value2);
      }
      return true;
    }
    return false;
  }

  private doesAffectedKeysTreeContains(
    affectedKeysTree: any,
    section: string,
  ): boolean {
    let requestedTree = toValuesTree({ [section]: true }, () => {
      //
    });

    let key;
    while (typeof requestedTree === 'object' && (key = Object.keys(requestedTree)[0])) {
      // Only one key should present, since we added only one property
      affectedKeysTree = affectedKeysTree[key];
      if (!affectedKeysTree) {
        return false; // Requested tree is not found
      }
      requestedTree = requestedTree[key];
    }
    return true;
  }
}

export class AllKeysConfigurationChangeEvent extends ConfigurationChangeEvent {
  public override source: ConfigurationTarget;
  public override sourceConfig: any;
  constructor(
    configuration: Configuration,
    workspace: Workspace,
    source: ConfigurationTarget,
    sourceConfig: any,
  ) {
    super(
      { keys: configuration.allKeys(), overrides: [] },
      undefined,
      configuration,
      workspace,
    );
    this.source = source;
    this.sourceConfig = sourceConfig;
  }
}
