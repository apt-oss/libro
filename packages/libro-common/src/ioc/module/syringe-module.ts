/* eslint-disable @typescript-eslint/no-invalid-this */
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { interfaces } from 'inversify';
import { ContainerModule } from 'inversify';

import { contributionInjectOption } from '../contribution/contribution-register.js';
import type { Syringe } from '../core.js';
import { Utils } from '../core.js';
import type { InversifyRegister } from '../inversify-api/index.js';
import { Register } from '../register.js';

type TokenOrOption<T> = Syringe.Token<T> | Syringe.InjectOption<T>;

export class SyringeModule<T = Syringe.Module> implements Syringe.Module {
  protected dependencies: T[] = [];
  /**
   * @readonly
   * module unique id
   */
  readonly id: number;
  protected moduleName?: string | undefined;
  readonly inversifyModule: ContainerModule;

  protected optionCollection?: (Syringe.Token<any> | Syringe.InjectOption<any>)[];

  get name() {
    return this.moduleName;
  }
  constructor(name?: string) {
    this.moduleName = name;
    this.inversifyModule = new ContainerModule(this.inversifyRegister);
    this.id = this.inversifyModule.id;
  }
  protected inversifyRegister = (
    bind: interfaces.Bind,
    unbind: interfaces.Unbind,
    isBound: interfaces.IsBound,
    rebind: interfaces.Rebind,
  ) => {
    const inversifyRegister: InversifyRegister = {
      bind,
      unbind,
      isBound,
      rebind,
    };
    const register = <T = any>(
      token: Syringe.Token<T> | Syringe.InjectOption<T>,
      options: Syringe.InjectOption<T> = {},
    ): void => {
      if (Utils.isInjectOption(token)) {
        Register.resolveOption({ container: inversifyRegister }, token);
      } else {
        Register.resolveTarget({ container: inversifyRegister }, token, options);
      }
    };
    if (this.optionCollection) {
      this.optionCollection.forEach((option) => register(option));
    }
  };

  protected get options() {
    if (!this.optionCollection) {
      this.optionCollection = [];
    }
    return this.optionCollection;
  }
  register(...options: TokenOrOption<any>[]) {
    options.forEach((option) => this.options.push(option));
    return this;
  }

  contribution(...tokens: Syringe.DefinedToken[]) {
    tokens.forEach((token) => this.options.push(contributionInjectOption(token)));
    return this;
  }

  dependOn(...modules: T[]) {
    this.dependencies.push(...modules);
    return this;
  }

  toLoader(): SyringeModuleLoader<T> {
    return {
      dependencies: this.dependencies.length > 0 ? this.dependencies : undefined,
    };
  }
}

export interface SyringeModuleLoader<T = Syringe.Module> {
  dependencies?: T[];
}

export function isSyringeModule(data: Syringe.Module): data is SyringeModule {
  return data && 'inversifyModule' in data;
}
