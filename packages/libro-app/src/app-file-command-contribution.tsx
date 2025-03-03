import { l10n } from '@difizen/libro-common/l10n';
import { FileTreeContextMenuGroups, JupyterFileService } from '@difizen/libro-jupyter';
import { message } from 'antd';

import type {
  CommandRegistry,
  MenuRegistry,
  ViewManager,
} from '@difizen/libro-common/app';
import {
  ConfigurationService,
  CommandContribution,
  FileStatNode,
  inject,
  MenuContribution,
  ModalService,
  OpenerService,
  singleton,
} from '@difizen/libro-common/app';

export const AppFileCommands = {
  OPEN_FILE_BY_LIBRO_APP: {
    id: 'fileTree.command.openfilebyapp',
    label: '以报告的形式打开',
  },
};

@singleton({
  contrib: [CommandContribution, MenuContribution],
})
export class AppFileCommandContribution
  implements CommandContribution, MenuContribution
{
  protected viewManager: ViewManager;
  @inject(JupyterFileService) fileService: JupyterFileService;
  @inject(ModalService) modalService: ModalService;
  @inject(OpenerService) protected openService: OpenerService;
  @inject(ConfigurationService) configurationService: ConfigurationService;

  registerMenus(menu: MenuRegistry) {
    menu.registerMenuAction(FileTreeContextMenuGroups['new'], {
      id: AppFileCommands.OPEN_FILE_BY_LIBRO_APP.id,
      command: AppFileCommands.OPEN_FILE_BY_LIBRO_APP.id,
      label: () => <div>{l10n.t(AppFileCommands.OPEN_FILE_BY_LIBRO_APP.label)}</div>,
      order: 'e',
    });
  }
  registerCommands(command: CommandRegistry): void {
    command.registerCommand(AppFileCommands.OPEN_FILE_BY_LIBRO_APP, {
      execute: (node) => {
        try {
          if (node.fileStat.isFile) {
            this.openService
              .getOpener(node.uri, {
                isApp: true,
              })
              .then((opener) => {
                if (opener) {
                  opener.open(node.uri, {
                    viewOptions: {
                      name: node.fileStat.name,
                    },
                  });
                }
                return;
              })
              .catch(() => {
                throw Error();
              });
          }
        } catch {
          message.error(l10n.t('文件打开失败'));
        }
      },
      isVisible: (node) => {
        return FileStatNode.is(node) && node.fileStat.isFile;
      },
    });
  }
}
