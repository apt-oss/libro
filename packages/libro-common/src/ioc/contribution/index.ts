import * as Protocol from './contribution-protocol.js';
import { contributionRegister } from './contribution-register.js';

export * from './contribution-protocol.js';
export * from './contribution-provider.js';
export * from './decorator.js';

export namespace Contribution {
  export type Option = Protocol.Option;
  export type Provider<T extends Record<string, any>> = Protocol.Provider<T>;
  export const Provider = Protocol.Provider;
  export const register = contributionRegister;
}
