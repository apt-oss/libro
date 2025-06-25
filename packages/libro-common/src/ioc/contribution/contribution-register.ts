import { Syringe } from '../core.js';

import * as Contribution from './contribution-protocol.js';
import type { Provider, Option } from './contribution-protocol.js';
import { DefaultContributionProvider } from './contribution-provider.js';

export function contributionInjectOption(
  token: Syringe.DefinedToken,
  option?: Option,
): Syringe.InjectOption<Provider<Syringe.DefinedToken>> {
  return {
    token: { token: Contribution.Provider, named: token },
    useDynamic: (ctx) => {
      return new DefaultContributionProvider(token, ctx.container, option);
    },
    lifecycle: Syringe.Lifecycle.singleton,
  };
}

export function contributionRegister(
  registerMethod: Syringe.Register,
  identifier: Syringe.DefinedToken,
  option?: Option,
): void {
  registerMethod({
    token: { token: Contribution.Provider, named: identifier },
    useDynamic: (ctx) => {
      return new DefaultContributionProvider(identifier, ctx.container, option);
    },
    lifecycle: Syringe.Lifecycle.singleton,
  });
}
