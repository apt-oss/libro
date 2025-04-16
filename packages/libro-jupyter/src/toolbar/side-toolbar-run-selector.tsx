import { PlayCircleOutlined } from '@ant-design/icons';
import type {
  LibroSideToolbarMenuItemType,
  LibroToolbarArags,
  LibroView,
} from '@difizen/libro-core';
import { NotebookCommands, LibroSideToolbarMenu } from '@difizen/libro-core';
import { ServerManager } from '@difizen/libro-kernel';
import type { Toolbar } from '@difizen/libro-common/app';
import {
  ConfigurationService,
  useInject,
  ViewInstance,
  CommandRegistry,
  ToolbarInstance,
  getOrigin,
} from '@difizen/libro-common/app';
import { l10n } from '@difizen/libro-common/l10n';
import { Popover, Tooltip } from 'antd';
import { useEffect, useState } from 'react';

import { LibroJupyterConfiguration } from '../config/index.js';
import type { LibroJupyterModel } from '../libro-jupyter-model.js';
import { kernelPrepared } from '../utils/index.js';

export const SideToolbarRunSelector: React.FC = () => {
  const libroView = useInject<LibroView>(ViewInstance);
  const libroServerManager = useInject(ServerManager);
  const configService = useInject<ConfigurationService>(ConfigurationService);
  const libroModel = libroView ? libroView.model : undefined;
  const command = useInject(CommandRegistry);
  const toolbar = useInject<Toolbar>(ToolbarInstance);
  const data = toolbar.currentArgs as LibroToolbarArags;
  const args = getOrigin(data) || [];
  const items: LibroSideToolbarMenuItemType[] = [
    {
      id: NotebookCommands['RunCell'].id,
      label: (
        <>
          <span className="libro-menu-item-label">{l10n.t('运行 Cell')}</span>
          <span className="libro-menu-item-keybind">Cmd + Enter</span>
        </>
      ),

      group: 'runCell1',
    },
    {
      id: NotebookCommands['RunAllAbove'].id,
      label: (
        <>
          <span className="libro-menu-item-label">{l10n.t('运行之前所有 Cell')}</span>
          <span className="libro-menu-item-keybind">Cmd + F8</span>
        </>
      ),

      group: 'runCell2',
    },
    {
      id: NotebookCommands['RunAllBelow'].id,
      label: (
        <>
          <span className="libro-menu-item-label">{l10n.t('运行当前及之后 Cell')}</span>
          <span className="libro-menu-item-keybind">Cmd + F10</span>
        </>
      ),

      group: 'runCell2',
    },
  ];
  const isKernelPrepared = kernelPrepared(
    libroServerManager,
    libroModel as LibroJupyterModel,
  );

  const [kernelUnreadyBtnText, setKernelUnreadyBtnText] = useState<string>(
    l10n.t('kernel准备中，无法运行'),
  );

  useEffect(() => {
    configService
      .get(LibroJupyterConfiguration['KernelUnreadyBtnText'])
      .then((value) => {
        setKernelUnreadyBtnText(value);
        return;
      })
      .catch(() => {
        //
      });
  });

  if (isKernelPrepared) {
    return (
      <Popover
        placement="leftTop"
        content={<LibroSideToolbarMenu items={items} />}
        trigger="hover"
        overlayClassName="libro-popover-side-toolbar-menu libro-side-toolbar-run-select-menu"
      >
        <PlayCircleOutlined
          onClick={() => {
            command.executeCommand(NotebookCommands['RunCell'].id, ...args);
          }}
        />
      </Popover>
    );
  }

  return (
    <Tooltip
      overlayClassName="libro-tooltip-placement-right"
      placement="right"
      title={l10n.t(kernelUnreadyBtnText)}
    >
      <PlayCircleOutlined />
    </Tooltip>
  );
};
