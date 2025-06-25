import type { interfaces } from 'inversify';
import { Container } from 'inversify';

import { Syringe, Utils } from '../core.js';

import type { InversifyContext } from './inversify-protocol.js';

export function bindSingleton<T>(
  toBind: interfaces.BindingInSyntax<T>,
): interfaces.BindingWhenOnSyntax<T> {
  return toBind.inSingletonScope();
}

export function bindTransient<T>(
  toBind: interfaces.BindingInSyntax<T>,
): interfaces.BindingWhenOnSyntax<T> {
  return toBind.inTransientScope();
}
export function bindLifecycle<T>(
  toBind: interfaces.BindingInSyntax<T>,
  option: Syringe.FormattedInjectOption<T>,
): interfaces.BindingWhenOnSyntax<T> {
  if (option.lifecycle === Syringe.Lifecycle.singleton) {
    return bindSingleton(toBind);
  }
  return bindTransient(toBind);
}

export function bindNamed<T>(
  toBind: interfaces.BindingWhenOnSyntax<T>,
  named: Syringe.Named,
): void {
  toBind.whenTargetNamed(namedToIdentifier(named));
}

export function bindGeneralToken<T>(
  token: interfaces.ServiceIdentifier<T>,
  ictx: InversifyContext,
): interfaces.BindingToSyntax<T> {
  return ictx.container.bind(tokenToIdentifier(token));
}
export function bindMonoToken<T>(
  token: interfaces.ServiceIdentifier<T>,
  ictx: InversifyContext,
): interfaces.BindingToSyntax<T> {
  if (ictx.container.isBound(tokenToIdentifier(token))) {
    try {
      return ictx.container.rebind(tokenToIdentifier(token));
    } catch (ex) {
      // not bind in crrent container
      return ictx.container.bind(tokenToIdentifier(token));
    }
  }
  return ictx.container.bind(tokenToIdentifier(token));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function namedToIdentifier(named: Syringe.Named): string | symbol {
  if (Utils.isDefinedToken(named)) {
    return named.symbol;
  }
  return named;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function tokenToIdentifier<T = any>(
  token: Syringe.Token<T>,
): interfaces.ServiceIdentifier<T> {
  if (Utils.isDefinedToken(token)) {
    return token.symbol;
  }
  return token;
}

export const GlobalContainer = new Container();

export * from './inversify-protocol';
