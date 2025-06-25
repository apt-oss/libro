import type { Syringe } from './core.js';

export const OptionSymbol = Symbol.for('SyringeSideOption');
export const registerSideOption = <
  T extends Record<any, any> = {
    //
  },
  R = any,
>(
  option: Syringe.InjectOption<R>,
  target: T,
) => {
  Reflect.defineMetadata(OptionSymbol, option, target);
};
