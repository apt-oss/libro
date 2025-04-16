import type { CellOptions } from '@difizen/libro-core';
import type { CommandRegistry } from '@difizen/mana-app';
import { CommandContribution, singleton } from '@difizen/mana-app';
import { v4 } from 'uuid';

export const LibroAddBetweenCellCommand = {
  AddBetweenCell: {
    id: 'notebook:libro-add-between-cell',
  },
  AddBetweenCellWithContext: {
    id: 'notebook:libro-add-between-cell-with-context',
  },
};

@singleton({ contrib: CommandContribution })
export class LibroAddBetweenCellCommandContribution implements CommandContribution {
  registerCommands(command: CommandRegistry): void {
    command.registerCommand(LibroAddBetweenCellCommand.AddBetweenCell, {
      execute: async (
        type: string,
        addCell: (option: CellOptions, position?: number | undefined) => Promise<void>,
        index: number,
      ) => {
        if (!type || typeof addCell !== 'function') {
          return;
        }
        const cellOptions = {
          id: v4(),
          cell: {
            cell_type: type,
            metadata: {},
            source: '',
          },
        };
        await addCell(cellOptions, index);
      },
    });

    command.registerCommand(LibroAddBetweenCellCommand.AddBetweenCellWithContext, {
      execute: async (
        type: string,
        addCell: (option: CellOptions, position?: number | undefined) => Promise<void>,
        index: number,
        context: Record<string, any>,
      ) => {
        if (!type || typeof addCell !== 'function') {
          return;
        }
        await addCell(
          {
            cell: {
              cell_type: type,
              metadata: {},
              source: '',
            },
            context: context,
          },
          index,
        );
      },
    });
  }
}
