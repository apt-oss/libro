import {
  DisposableCollection,
  Disposable,
  Emitter,
  objects,
  isPromiseLike,
} from '../../common/index.js';
import { singleton, inject } from '../../ioc/index.js';
import { localStorageService } from '../common/index.js';
import type { StorageService } from '../common/index.js';

import { DefaultVariablePrefix } from './protocol.js';
import type { CssVariable, VariableDefinition } from './protocol.js';
import type { ExtraTokens } from './theme-service.js';
import { ThemeService } from './theme-service.js';

/**
 * It should be implemented by an extension, e.g. by the monaco extension.
 */
@singleton()
export class BaseVariableRegistry {
  @inject(ThemeService)
  protected readonly themeService: ThemeService;
  protected get definitionList(): VariableDefinition[] {
    return [...this.definitionMap.values()];
  }
  protected definitionMap: Map<string, VariableDefinition> = new Map();

  protected storageService: StorageService = localStorageService;

  protected readonly onDidChangeEmitter = new Emitter<void>();

  readonly onDidChange = this.onDidChangeEmitter.event;

  protected fireDidChange(): void {
    this.onDidChangeEmitter.fire(undefined);
  }

  /**
   * @deprecated using getDefinitionIds instead
   *
   */
  getVariables(): IterableIterator<string> {
    return this.getDefinitionIds();
  }

  getDefinitionIds(): IterableIterator<string> {
    return this.definitionMap.keys();
  }

  getCurrentCssVariables(): CssVariable[] {
    const cssVars: CssVariable[] = [];
    for (const id of this.getDefinitionIds()) {
      const variable = this.toCurrentCssVariable(id);
      if (variable) {
        cssVars.push(variable);
      }
    }
    return cssVars;
  }

  toCurrentCssVariable(id: string): CssVariable | undefined {
    const name = this.toCssVariableName(id);
    const maybeValue = this.storageService.getData<string>(name);
    if (!isPromiseLike(maybeValue) && maybeValue) {
      return { name, value: maybeValue };
    }
    const value = this.getCurrentDefinitionValue(id);
    if (!value) {
      return undefined;
    }
    return { name, value };
  }

  toCssVariableName(id: string, prefix?: string): string {
    const def = this.definitionMap.get(id);
    let currentPrefix = prefix;
    if (!currentPrefix) {
      currentPrefix = def?.prefix === undefined ? DefaultVariablePrefix : def?.prefix;
    }
    if (currentPrefix) {
      return `--${currentPrefix}-${id.replace(/\./g, '-')}`;
    }
    return `--${id.replace(/\./g, '-')}`;
  }

  getCurrentDefinitionValue(id: string): string | undefined {
    const theme = this.themeService.getActiveTheme();
    const { type, extraTokens } = theme;
    if (extraTokens && extraTokens.basic && extraTokens.basic[id]) {
      return extraTokens.basic[id];
    }
    const definition = this.definitionMap.get(id);
    if (definition && definition.defaults && definition.defaults[type]) {
      return definition.defaults[type];
    }
    return undefined;
  }

  setCurrentDefinitionValue(
    name: string,
    value: string,
    tokens: ExtraTokens = {},
  ): void {
    objects.mixin(objects.deepClone(name), {
      extraTokens: { ...tokens },
    });
    this.storageService.setData(name, value);
    this.fireDidChange();
  }

  register(...definitions: VariableDefinition[]): Disposable {
    const result = new DisposableCollection(
      ...definitions.map((definition) => this.doRegister(definition)),
    );
    this.fireDidChange();
    return result;
  }

  protected doRegister(definition: VariableDefinition): Disposable {
    this.definitionMap.set(definition.id, {
      id: definition.id,
      prefix: definition.prefix,
      defaults: definition.defaults,
      description: definition.description,
    });
    return Disposable.create(() => {
      this.definitionMap.delete(definition.id);
    });
  }
}
