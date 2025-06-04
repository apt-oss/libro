import type { Container } from '@difizen/mana-app';
import { ThemeService } from '@difizen/mana-app';
import { Autowired } from '@opensumi/di';
import type {
  CommandRegistry,
  IOpenerService,
} from '@opensumi/ide-core-browser';
import {
  CommandContribution,
  Domain,
  OpenerContribution,
  Schemes,
  StorageProvider,
  URI,
} from '@opensumi/ide-core-browser';
import { ClientAppContribution } from '@opensumi/ide-core-browser/lib/common';
import type { IEditorDocumentModelContentRegistry } from '@opensumi/ide-editor/lib/browser/doc-model/types';
import type {
  EditorComponentRegistry,
  IResource,
  ResourceService,
} from '@opensumi/ide-editor/lib/browser/types';
import {
  BrowserEditorContribution,
  WorkbenchEditorService,
} from '@opensumi/ide-editor/lib/browser/types';
import { IconService } from '@opensumi/ide-theme/lib/browser';
import { IconType, IThemeService } from '@opensumi/ide-theme/lib/common';
import { IWorkspaceService } from '@opensumi/ide-workspace/lib/common';
import { LibroOutputPreview } from './libro-output-preview';

import { ManaContainer } from '../common';

import { LibroOpener } from './libro-opener';
import {
  LIBRO_COMPONENTS_ID,
  LIBRO_COMPONENTS_SCHEME_ID,
  LIBRO_OUTPUT_PREVIEW_COMPONENTS_ID,
  LIBRO_OUTPUT_PREVIEW_SCHEME_ID
} from './libro.protocol';
import { OpensumiLibroView } from './libro.view';
import { NotebookDocumentContentProvider } from './notebook-document-content-provider';

const LIBRO_COMPONENTS_VIEW_COMMAND = {
  id: 'opensumi-libro',
};

@Domain(
  BrowserEditorContribution,
  ClientAppContribution,
  CommandContribution,
  OpenerContribution,
)
export class LibroContribution
  implements
    ClientAppContribution,
    BrowserEditorContribution,
    CommandContribution,
    OpenerContribution
{
  @Autowired(IWorkspaceService)
  protected readonly workspaceService: IWorkspaceService;

  @Autowired(ManaContainer)
  private readonly manaContainer: Container;

  @Autowired(IconService)
  protected readonly iconService: IconService;

  @Autowired(StorageProvider)
  protected readonly getStorage: StorageProvider;

  @Autowired(WorkbenchEditorService)
  protected readonly editorService: WorkbenchEditorService;

  @Autowired(IThemeService)
  protected readonly themeService: IThemeService;

  @Autowired(NotebookDocumentContentProvider)
  protected readonly notebookDocumentContentProvider: NotebookDocumentContentProvider;
  @Autowired(LibroOpener)
  protected readonly libroOpener: LibroOpener;

  registerOpener(registry: IOpenerService): void {
    throw registry.registerOpener(this.libroOpener);
  }

  registerCommands(registry: CommandRegistry) {
    registry.registerCommand(LIBRO_COMPONENTS_VIEW_COMMAND, {
      execute: () => {
        this.editorService.open(new URI(`${LIBRO_COMPONENTS_SCHEME_ID}://`), {
          preview: false,
        });
      },
    });
  }

  registerEditorComponent(registry: EditorComponentRegistry) {
    registry.registerEditorComponent({
      uid: LIBRO_COMPONENTS_ID,
      scheme: LIBRO_COMPONENTS_SCHEME_ID,
      component: OpensumiLibroView,
      // renderMode: EditorComponentRenderMode.ONE_PER_WORKBENCH,
    });

    registry.registerEditorComponentResolver(
      Schemes.file,
      (resource, results) => {
        if (resource.uri.path.ext === `.${LIBRO_COMPONENTS_SCHEME_ID}`) {
          results.push({
            type: 'component',
            componentId: LIBRO_COMPONENTS_ID,
          });
        }
      },
    );
    registry.registerEditorComponent({
      uid: LIBRO_OUTPUT_PREVIEW_COMPONENTS_ID,
      scheme: LIBRO_OUTPUT_PREVIEW_SCHEME_ID,
      component: LibroOutputPreview,
    });

    registry.registerEditorComponentResolver(
      LIBRO_OUTPUT_PREVIEW_SCHEME_ID,
      (resource, results) => {
        results.push({
          type: 'component',
          componentId: LIBRO_OUTPUT_PREVIEW_COMPONENTS_ID,
        });
      },
    );
  }

  registerResource(service: ResourceService) {
    service.registerResourceProvider({
      scheme: LIBRO_COMPONENTS_SCHEME_ID,
      provideResource: async (uri: URI): Promise<IResource<any>> => {
        const iconClass = this.iconService.fromIcon(
          '',
          'https://mdn.alipayobjects.com/huamei_xt20ge/afts/img/A*LDFvSptm_zgAAAAAAAAAAAAADiuUAQ/original',
          IconType.Background,
        );
        return {
          uri,
          name: 'notebook',
          icon: iconClass!,
        };
      },
    });
    service.registerResourceProvider({
      scheme: LIBRO_OUTPUT_PREVIEW_SCHEME_ID,
      provideResource: async (uri: URI): Promise<IResource<any>> => {
        const iconClass = this.iconService.fromIcon(
          '',
          'https://mdn.alipayobjects.com/huamei_xt20ge/afts/img/A*LDFvSptm_zgAAAAAAAAAAAAADiuUAQ/original',
          IconType.Background,
        );
        return {
          uri,
          name: uri.path.name + '_preview',
          icon: iconClass + ' libro-output-preview-icon',
        };
      },
    })
  }

  registerEditorDocumentModelContentProvider(
    registry: IEditorDocumentModelContentRegistry,
  ) {
    registry.registerEditorDocumentModelContentProvider(
      this.notebookDocumentContentProvider,
    );
  }

  async onDidStart() {
    const manaThemeService = this.manaContainer.get(ThemeService);
    const curTheme = await this.themeService.getCurrentTheme();
    manaThemeService.setCurrentTheme(curTheme.type);
    this.themeService.onThemeChange((theme) => {
      manaThemeService.setCurrentTheme(theme.type);
    });
  }
}
