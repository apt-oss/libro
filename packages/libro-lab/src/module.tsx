// import { LibroAINativeModule } from '@difizen/libro-ai-native';
import { LibroAppModule } from '@difizen/libro-app';
import {
  ManaModule,
  createSlotPreference,
  RootSlotId,
  createViewPreference,
  HeaderArea,
} from '@difizen/libro-common/app';
import { l10n } from '@difizen/libro-common/l10n';
import { FileView, LibroJupyterModule } from '@difizen/libro-jupyter';
import { langBundles } from '@difizen/libro-l10n';
import { LibroPromptCellModule } from '@difizen/libro-prompt-cell';
import { LibroSqlCellModule } from '@difizen/libro-sql-cell';
import { TerminalModule } from '@difizen/libro-terminal';
import { CommonWidgetsModule } from '@difizen/libro-widget';

import { LibroLabHeaderMenuModule } from './command/module.js';
import { LabConfigAppContribution } from './config/config-contribution.js';
import { CodeEditorViewerModule } from './editor-viewer/index.js';
import { GithubLinkView } from './github-link/index.js';
import { LibroGuidebookContentContribution } from './guide/content-contribution.js';
import { GuideView } from './guide/guide-view.js';
import { ImageViewerModule } from './image-viewer/index.js';
// import { KernelManagerView } from './kernel-manager/index.js';
import { LibroKernelAndTerminalPanelModule } from './kernel-and-terminal-panel/module.js';
import { LibroLabApp } from './lab-app.js';
import { LabColorContribution } from './lab-color-registry.js';
import { LangSwitcherView } from './lang-switcher/index.js';
import { ContentBottomTabView } from './layout/content-bottom-tab-view.js';
import {
  LibroLabLayoutModule,
  LibroLabLayoutSlots,
  LibroLabLayoutView,
} from './layout/index.js';
import { SaveableTabView } from './layout/saveable-tab-view.js';
import './index.less';
import { LibroLabSideTabView } from './layout/side-tab-view.js';
import { LibroLabView } from './libro-lab-view.js';
import { LibroLabTocModule } from './toc/module.js';
import { EntryPointView } from './welcome/entry-point-view.js';
import { WelcomeView } from './welcome/index.js';

export const LibroLabModule = ManaModule.create()
  .preload(() => {
    l10n.loadLangBundles(langBundles);

    return Promise.resolve();
  })
  .register(
    LibroLabApp,
    LibroLabLayoutView,
    GithubLinkView,
    LibroLabView,
    LabConfigAppContribution,
    LibroLabSideTabView,
    LabColorContribution,
    LangSwitcherView,
    createViewPreference({
      view: GithubLinkView,
      slot: HeaderArea.right,
      openOptions: {
        order: 'github',
      },
      autoCreate: true,
    }),
    createViewPreference({
      view: LangSwitcherView,
      slot: HeaderArea.right,
      openOptions: {
        order: 'lang',
      },
      autoCreate: true,
    }),
    // KernelManagerView,
    // createViewPreference({
    //   view: KernelManagerView,
    //   slot: LibroLabLayoutSlots.navigator,
    //   openOptions: {
    //     reveal: false,
    //     order: 'kernel-manager',
    //   },
    //   autoCreate: true,
    // }),
    createSlotPreference({
      view: LibroLabLayoutView,
      slot: RootSlotId,
    }),
    createSlotPreference({
      view: SaveableTabView,
      slot: LibroLabLayoutSlots.content,
    }),
    createSlotPreference({
      view: ContentBottomTabView,
      slot: LibroLabLayoutSlots.contentBottom,
    }),
    createSlotPreference({
      view: LibroLabSideTabView,
      slot: LibroLabLayoutSlots.navigator,
      options: {
        sort: true,
        contentToggable: true,
      },
    }),
    createViewPreference({
      view: FileView,
      slot: LibroLabLayoutSlots.navigator,
      autoCreate: true,
      openOptions: {
        reveal: true,
        order: 'file-tree',
      },
    }),
    WelcomeView,
    createViewPreference({
      view: WelcomeView,
      slot: LibroLabLayoutSlots.content,
      autoCreate: true,
      openOptions: {
        reveal: true,
        order: 'welcome',
      },
    }),
    LibroGuidebookContentContribution,
    GuideView,
    EntryPointView,
  )
  .dependOn(
    LibroJupyterModule,
    CommonWidgetsModule,
    LibroLabLayoutModule,
    LibroLabHeaderMenuModule,
    LibroLabTocModule,
    LibroKernelAndTerminalPanelModule,
    LibroPromptCellModule,
    LibroSqlCellModule,
    TerminalModule,
    ImageViewerModule,
    CodeEditorViewerModule,
    // LibroAINativeModule,
    LibroAppModule,
  );
