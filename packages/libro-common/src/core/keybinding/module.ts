import {
  BrowserKeyboardLayoutProvider,
  KeyboardLayoutService,
} from '../keyboard/index.js';
import { ManaModule } from '../module/index.js';

import { ContextKeyService } from './context-key-service.js';
import { KeybindingContribution } from './keybinding-proocol.js';
import { KeybindingContext, KeybindingRegistry } from './keybinding.js';
import { ConfigurationService } from './vs/configuration/configurationService.js';
import { VSContextKeyService } from './vs/contextKeyService.js';

export const KeybindModule = ManaModule.create()
  .contribution(KeybindingContribution, KeybindingContext)
  .register(
    VSContextKeyService,
    ContextKeyService,
    KeybindingRegistry,

    // keyboard
    BrowserKeyboardLayoutProvider,
    KeyboardLayoutService,

    // configuration
    ConfigurationService,
  );
