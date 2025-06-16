import { LibroCommandRegister, LibroToolbarArea, LibroView } from '@difizen/libro-core';
import type { CommandRegistry, ToolbarRegistry } from '@difizen/libro-common/app';
import { ModalContribution } from '@difizen/libro-common/app';
import { ToolbarContribution, CommandContribution } from '@difizen/libro-common/app';
import { inject, singleton } from '@difizen/libro-common/app';
import { l10n } from '@difizen/libro-common/l10n';

import { KeybindInstructionsIcon } from './keybind-instructions-icon.js';
import { KeybindInstrutionModal } from './keybind-instructions-view.js';

const KeybindInstructionsCommand = {
  id: 'notebook:keybind-instructions',
};

@singleton({ contrib: [CommandContribution, ToolbarContribution, ModalContribution] })
export class KeybindInstructionsContribution
  implements CommandContribution, ToolbarContribution, ModalContribution
{
  @inject(LibroCommandRegister) protected readonly libroCommand: LibroCommandRegister;

  registerCommands(command: CommandRegistry) {
    this.libroCommand.registerLibroCommand(command, KeybindInstructionsCommand, {
      execute: async (cell, libro) => {
        if (!libro || !(libro instanceof LibroView)) {
          return;
        }
      },
      isVisible: (cell, libro, path) => {
        return path === LibroToolbarArea.HeaderRight;
      },
    });
  }

  registerToolbarItems(registry: ToolbarRegistry) {
    registry.registerItem({
      id: KeybindInstructionsCommand.id,
      icon: KeybindInstructionsIcon,
      command: KeybindInstructionsCommand.id,
      order: 'l',
      tooltip: () => (
        <div className="libro-tooltip">
          <span className="libro-tooltip-text">{l10n.t('查看快捷键')}</span>
        </div>
      ),
    });
  }

  registerModal() {
    return KeybindInstrutionModal;
  }
}
