import { ManaModule } from '../module/index.js';

import { CommandRegistry, CommandContribution } from './command-registry.js';

export * from './command-registry.js';
export * from './command-protocol.js';

export const CommandModule = ManaModule.create()
  .contribution(CommandContribution)
  .register(CommandRegistry);
