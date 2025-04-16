import type { LibroModel } from '@difizen/libro-core';
import {
  KernelCommands,
  LibroCommandRegister,
  LibroService,
  LibroToolbarArea,
  LibroView,
  NotebookCommands,
  ExecutableCellView,
  LibroCellView,
} from '@difizen/libro-core';
import type { CommandRegistry } from '@difizen/libro-common/app';
import {
  CommandContribution,
  inject,
  ModalService,
  singleton,
} from '@difizen/libro-common/app';

import { LibroJupyterModel } from '../libro-jupyter-model.js';
import { ExecutedWithKernelCellModel } from '../libro-jupyter-protocol.js';

@singleton({ contrib: CommandContribution })
export class LibroJupyterCommandContribution implements CommandContribution {
  @inject(ModalService) protected readonly modalService: ModalService;
  @inject(LibroCommandRegister) protected readonly libroCommand: LibroCommandRegister;
  @inject(LibroService) protected readonly libroService: LibroService;

  registerCommands(command: CommandRegistry): void {
    this.libroCommand.registerLibroCommand(
      command,
      KernelCommands['ShowKernelStatusAndSelector'],
      {
        execute: async (cell, libro) => {
          if (!libro || !(libro instanceof LibroView)) {
            return;
          }
        },
        isVisible: (cell, libro, path) => {
          if (!libro || !(libro instanceof LibroView)) {
            return false;
          }
          return (
            (libro?.model as LibroModel).executable &&
            path === LibroToolbarArea.HeaderLeft
          );
        },
        isEnabled: (cell, libro) => {
          if (!libro || !(libro instanceof LibroView)) {
            return false;
          }
          return true;
        },
      },
    );

    this.libroCommand.registerLibroCommand(
      command,
      NotebookCommands['TopToolbarRunSelect'],
      {
        execute: () => {
          //
        },
        isVisible: (cell, libro, path) => {
          if (
            !libro ||
            !(libro instanceof LibroView) ||
            path !== LibroToolbarArea.HeaderCenter
          ) {
            return false;
          }
          return (libro?.model as LibroModel).executable;
        },
        isEnabled: (cell, libro) => {
          if (!libro || !(libro instanceof LibroView)) {
            return false;
          }
          return (
            (libro.model as LibroJupyterModel).kernelConnection !== undefined &&
            (libro.model as LibroJupyterModel).kernelConnecting === false
          );
        },
      },
    );

    this.libroCommand.registerLibroCommand(
      command,
      NotebookCommands['SideToolbarRunSelect'],
      {
        execute: async () => {
          //
        },
        isVisible: (cell, libro, path) => {
          if (
            !cell ||
            !libro ||
            !ExecutableCellView.is(cell) ||
            !(libro instanceof LibroView)
          ) {
            return false;
          }
          return (
            (libro?.model as LibroModel).executable &&
            path === LibroToolbarArea.CellRight
          );
        },
        isEnabled: (cell, libro) => {
          if (!libro || !(libro instanceof LibroView)) {
            return false;
          }
          return (
            (libro.model as LibroJupyterModel).kernelConnection !== undefined &&
            (libro.model as LibroJupyterModel).kernelConnecting === false
          );
        },
      },
    );

    this.libroCommand.registerLibroCommand(
      command,
      NotebookCommands['SelectLastRunCell'],
      {
        execute: async (cell, libro) => {
          if (!libro || !(libro instanceof LibroView)) {
            return;
          }
          if (libro.model instanceof LibroJupyterModel) {
            libro.model.findRunningCell();
          }
        },
        isVisible: (cell, libro, path) => {
          if (!libro || !(libro instanceof LibroView)) {
            return false;
          }
          return (
            (libro?.model as LibroJupyterModel).executable &&
            path === LibroToolbarArea.HeaderCenter
          );
        },
        isEnabled: (cell, libro) => {
          if (
            !libro ||
            !(libro instanceof LibroView) ||
            !(libro?.model as LibroJupyterModel).executable
          ) {
            return false;
          }
          return (
            libro.model
              .getCells()
              .findIndex(
                (item) =>
                  ExecutedWithKernelCellModel.is(item.model) &&
                  item.model.kernelExecuting,
              ) >= 0
          );
        },
      },
    );
  }
}
