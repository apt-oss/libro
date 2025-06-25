/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { interfaces } from 'inversify';

import { ContainerAPI } from './container-api.js';
import { Utils, Syringe } from './core.js';
import {
  bindNamed,
  bindGeneralToken,
  bindMonoToken,
  bindLifecycle,
} from './inversify-api/index.js';
import { isInversifyContext } from './inversify-api/index.js';
import type { InversifyContext } from './inversify-api/index.js';
import { OptionSymbol } from './side-option.js';

export class Register<T> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static globalConfig: Syringe.InjectOption<any> = Syringe.DefaultOption;
  /**
   * 注册目标 token，合并 token 配置后基于配置注册
   */
  static resolveTarget<R>(
    ictx: InversifyContext,
    target: Syringe.Token<R>,
    option: Syringe.TargetOption<R> = {},
  ): void {
    try {
      try {
        const sideOption = Reflect.getMetadata(OptionSymbol, target);
        if (sideOption) {
          Register.resolveOption(ictx, sideOption);
        }
      } catch (ex) {
        // noop
      }
      // 当 target 为类时，将其插入 useClass 配置中
      if (Utils.isClass(target)) {
        if (!option.useClass) {
          option.useClass = [target];
        } else {
          const classes = Utils.toArray(option.useClass);
          classes.unshift(target);
          option.useClass = classes;
        }
      }
      let mixedOption;
      try {
        mixedOption = Reflect.getMetadata(Syringe.ClassOptionSymbol, target);
      } catch (ex) {
        // noop
      }
      mixedOption = {
        ...(mixedOption || {}),
        ...option,
      };
      if (!mixedOption.token) {
        mixedOption.token = [target];
      } else {
        const tokens = Utils.toArray(mixedOption.token);
        tokens.unshift(target);
        mixedOption.token = tokens;
      }
      Register.resolveOption(ictx, mixedOption);
    } catch (ex) {
      // noop
    }
  }
  /**
   * 基于配置注册
   */
  static resolveOption<R>(
    ictx: InversifyContext,
    baseOption: Syringe.InjectOption<R>,
  ): void {
    const parsedOption = Utils.toRegistryOption({
      ...Register.globalConfig,
      ...baseOption,
    });
    if (
      parsedOption.useClass.length === 0 &&
      parsedOption.useDynamic.length === 0 &&
      parsedOption.useFactory.length === 0 &&
      !('useValue' in parsedOption)
    ) {
      return;
    }

    parsedOption.token.forEach((token) => {
      const register = new Register(ictx, token, { ...parsedOption });
      register.resolve();
    });
  }

  protected token: Syringe.UnionToken<T>;
  protected rawToken: Syringe.Token<T>;
  protected named?: Syringe.Named | undefined;
  /**
   * 兼容 inversify
   */
  protected generalToken: interfaces.ServiceIdentifier<T>;
  protected option: Syringe.FormattedInjectOption<T>;
  protected ictx: InversifyContext;
  protected mutiple: boolean;
  constructor(
    ictx: InversifyContext,
    token: Syringe.UnionToken<T>,
    option: Syringe.FormattedInjectOption<T>,
  ) {
    this.ictx = ictx;
    this.token = token;
    this.option = option;
    this.rawToken = Utils.isNamedToken(token) ? token.token : token;
    this.named = Utils.isNamedToken(token) ? token.named : undefined;
    this.mutiple = !!this.named || Utils.isMultipleEnabled(this.rawToken);
    this.generalToken = this.rawToken;
  }
  /**
   * multi or mono register
   * priority: useValue > useDynamic > useFactory > useClass
   */
  resolve(): void {
    const { ictx } = this;
    if (!isInversifyContext(ictx)) {
      return;
    }
    if (this.mutiple) {
      this.resolveMutilple(ictx);
    } else {
      this.resolveMono(ictx);
      if (!this.named && this.option.contrib.length > 0) {
        this.option.contrib.forEach((contribution) => {
          if (Utils.isMultipleEnabled(contribution)) {
            bindGeneralToken(contribution, ictx).toService(this.generalToken);
          } else {
            bindMonoToken(contribution, ictx).toService(this.generalToken);
          }
        });
      }
    }
  }
  // eslint-disable-next-line consistent-return
  protected resolveMono(
    ictx: InversifyContext,
  ): interfaces.BindingWhenOnSyntax<T> | undefined {
    if ('useValue' in this.option) {
      return bindMonoToken(this.generalToken, ictx).toConstantValue(
        this.option.useValue!,
      );
    }
    if (this.option.useDynamic.length > 0) {
      const dynamic = this.option.useDynamic[this.option.useDynamic.length - 1];
      return bindLifecycle(
        bindMonoToken(this.generalToken, ictx).toDynamicValue((ctx) => {
          const container = ContainerAPI.getOrCreateContainer(ctx.container)!;
          return dynamic({ container });
        }),
        this.option,
      );
    }
    if (this.option.useFactory.length > 0) {
      const factrory = this.option.useFactory[this.option.useFactory.length - 1];
      return bindMonoToken(this.generalToken, ictx).toFactory((ctx) => {
        const container = ContainerAPI.getOrCreateContainer(ctx.container)!;
        return factrory({ container });
      });
    }
    if (this.option.useClass.length > 0) {
      const newable = this.option.useClass[this.option.useClass.length - 1];
      return bindLifecycle(
        bindMonoToken(this.generalToken, ictx).to(newable),
        this.option,
      );
    }
    return undefined;
  }
  protected resolveMutilple(ictx: InversifyContext): void {
    const classesList = this.option.useClass.map((newable) =>
      bindLifecycle(bindGeneralToken(this.generalToken, ictx).to(newable), this.option),
    );
    const dynamicList = this.option.useDynamic.map((dynamic) =>
      bindLifecycle(
        bindGeneralToken(this.generalToken, ictx).toDynamicValue((ctx) => {
          const container = ContainerAPI.getOrCreateContainer(ctx.container)!;
          return dynamic({ container });
        }),
        this.option,
      ),
    );
    const factoryList = this.option.useFactory.map((factrory) =>
      bindGeneralToken(this.generalToken, ictx).toFactory((ctx) => {
        const container = ContainerAPI.getOrCreateContainer(ctx.container)!;
        return factrory({ container });
      }),
    );
    const valueToBind =
      'useValue' in this.option
        ? bindGeneralToken(this.generalToken, ictx).toConstantValue(
            this.option.useValue!,
          )
        : undefined;
    if (this.named) {
      classesList.forEach((tobind) => this.named && bindNamed(tobind, this.named));
      dynamicList.forEach((tobind) => this.named && bindNamed(tobind, this.named));
      factoryList.forEach((tobind) => this.named && bindNamed(tobind, this.named));
      if (valueToBind) {
        bindNamed(valueToBind, this.named);
      }
    }
  }
}
