import type { CellView, LibroView } from '@difizen/libro-jupyter';
import {
  CellUri,
  LanguageSpecRegistry,
  LibroService,
} from '@difizen/libro-jupyter';
import type { Container } from '@difizen/mana-app';
import { getOrigin, URI as ManaURI } from '@difizen/mana-app';
import { Autowired, Injectable } from '@opensumi/di';
import type { URI } from '@opensumi/ide-core-browser';
import { Emitter, Event, path, WithEventBus } from '@opensumi/ide-core-browser';
import {
  ResourceDecorationNeedChangeEvent,
  WorkbenchEditorService,
} from '@opensumi/ide-editor';
import { makeObservable } from 'mobx';

import { ContentLoaderType, ManaContainer } from '../common';

import type { LibroTracker } from './libro.view.tracker';

export const ILibroOpensumiService = Symbol('ILibroOpensumiService');

// eslint-disable-next-line @typescript-eslint/no-redeclare
export interface ILibroOpensumiService {
  // manaContainer: Container;
  libroTrackerMap: Map<string, LibroTracker>;
  libroOutputMap: Map<string, string>
  onOpenLibroOutputTab: Event<void>;
  _onOpenLibroOutputTab: Emitter<void>;
  // editorService: WorkbenchEditorService;
  getOrCreatLibroView: (uri: URI) => Promise<LibroView>;
  updateDirtyStatus: (uri: URI, dirty: boolean) => void;
  getCellViewByUri: (uri: URI) => Promise<CellView | undefined>;
  getCellLangauge: (cell: CellView) => string | undefined;
}

@Injectable()
export class LibroOpensumiService
  extends WithEventBus
  implements ILibroOpensumiService
{
  @Autowired(ManaContainer)
  private readonly manaContainer: Container;

  @Autowired(WorkbenchEditorService)
  protected readonly editorService: WorkbenchEditorService;

  constructor() {
    super();
    makeObservable(this);
  }

  get libroService() {
    const libroService = this.manaContainer.get(LibroService);
    return libroService;
  }

  getOrCreatLibroView = async (uri: URI) => {
    const libroOption = {
      modelId: uri.toString(),
      resource: uri.toString(),
      loadType: ContentLoaderType,
    };
    const libroView = await this.libroService.getOrCreateView(libroOption);
    return libroView;
  };

  getCellViewByUri = async (uri: URI) => {
    const parsed = CellUri.parse(
      new ManaURI(uri.toString(), { simpleMode: false }),
    );
    if (!parsed) {
      return;
    }
    const { notebookId, cellId } = parsed;
    // const notebookUri = URI.file(notebookId);
    /**
     * 这里需要兼容各种不同的 content contribution 加载数据的方式，采取匹配model id的方式来找到libroview， 因为model id是会被编码进uri的
     */
    const libroView = Array.from(
      this.libroService.getViewCache().values(),
    ).find((item) => path.join('/', String(item.model.id)) === notebookId);
    const cell = libroView?.model.cells.find(
      (cell) => cell.model.id === cellId,
    );
    return cell;
  };

  getCellLangauge = (cell: CellView) => {
    const languageSpecRegistry = this.manaContainer.get(LanguageSpecRegistry);
    return getOrigin(languageSpecRegistry.languageSpecs).find(
      (item) => item.mime === cell.model.mimeType,
    )?.language;
  };

  updateDirtyStatus(uri: URI, dirty: boolean) {
    this.eventBus.fire(
      new ResourceDecorationNeedChangeEvent({
        uri,
        decoration: {
          dirty,
        },
      }),
    );
  }

  libroTrackerMap: Map<string, LibroTracker> = new Map();
  libroOutputMap: Map<string, string> = new Map();

  _onOpenLibroOutputTab = new Emitter<void>();
  onOpenLibroOutputTab: Event<void> = this._onOpenLibroOutputTab.event;
}
