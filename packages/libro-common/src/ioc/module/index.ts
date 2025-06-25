import { SyringeModule } from './syringe-module.js';

export * from './syringe-module.js';

export function Module(name?: string): SyringeModule {
  return new SyringeModule(name);
}
