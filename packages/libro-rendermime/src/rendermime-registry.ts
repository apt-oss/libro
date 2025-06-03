import { defaultSanitizer } from '@difizen/libro-common';
import type { BaseOutputView } from '@difizen/libro-core';
import { MarkdownParser } from '@difizen/libro-markdown';
import type { Contribution } from '@difizen/libro-common/app';
import { contrib, inject, singleton, Priority } from '@difizen/libro-common/app';
import { Emitter } from '@difizen/libro-common/app';

import { largeOutputRendererFactory } from './rendermime-factory.js';
import {
  RenderMimeContribution,
  IRenderMimeRegistryOptions,
} from './rendermime-protocol.js';
import type {
  FactoryMap,
  ILinkHandler,
  IRendererFactory,
  IRenderMimeRegistry,
  IResolver,
  RankMap,
} from './rendermime-protocol.js';
import { sortedTypes } from './rendermime-utils.js';

/**
 * An object which manages mime renderer factories.
 *
 * This object is used to render mime models using registered mime
 * renderers, selecting the preferred mime renderer to render the
 * model into a widget.
 *
 * #### Notes
 * This class is not intended to be subclassed.
 */
@singleton()
export class RenderMimeRegistry implements IRenderMimeRegistry {
  renderMimeEmitter: Emitter<{ renderType: string; mimeType: string }> = new Emitter();
  get onMimeRender() {
    return this.renderMimeEmitter.event;
  }
  /**
   * Construct a new rendermime.
   *
   * @param options - The options for initializing the instance.
   */
  constructor(
    @inject(IRenderMimeRegistryOptions) options: IRenderMimeRegistryOptions,
    @inject(MarkdownParser) markdownParser: MarkdownParser,
  ) {
    // Parse the options.
    // this.translator = options.translator ?? nullTranslator;
    this.resolver = options.resolver ?? null;
    this.linkHandler = options.linkHandler ?? null;
    this.markdownParser = options.markdownParser ?? markdownParser;
    this.sanitizer = options.sanitizer ?? defaultSanitizer;

    // Add the initial factories.
    if (options.initialFactories) {
      for (const factory of options.initialFactories) {
        this.addFactory(factory);
      }
    }
  }

  @contrib(RenderMimeContribution)
  renderMimeProvider: Contribution.Provider<RenderMimeContribution>;

  /**
   * The sanitizer used by the rendermime instance.
   */
  readonly sanitizer = defaultSanitizer;

  /**
   * The object used to resolve relative urls for the rendermime instance.
   */
  readonly resolver: IResolver | null;

  /**
   * The object used to handle path opening links.
   */
  readonly linkHandler: ILinkHandler | null;

  /**
   * The Markdown parser for the rendermime.
   */
  readonly markdownParser: MarkdownParser | null;

  // /**
  //  * The application language translator.
  //  */
  // readonly translator: ITranslator;

  /**
   * The ordered list of mimeTypes.
   */
  get mimeTypes(): readonly string[] {
    return this._types || (this._types = sortedTypes(this._ranks));
  }

  protected getSortedRenderMimes(model: BaseOutputView): RenderMimeContribution[] {
    const prioritized = Priority.sortSync(
      this.renderMimeProvider.getContributions(),
      (contribution) => contribution.canHandle(model),
    );
    const sortedRenderMimes = prioritized.map((c) => c.value);
    return sortedRenderMimes;
  }

  defaultPreferredMimeType(
    model: BaseOutputView,
    mode?: 'ensure' | 'prefer' | 'any' | 'largeOutput',
  ): string | undefined {
    for (const mt of this.mimeTypes) {
      if (mt in model.data) {
        if (
          mode !== 'largeOutput' &&
          largeOutputRendererFactory.mimeTypes.includes(mt)
        ) {
          continue;
        }
        return mt;
      }
    }

    // Otherwise, no matching mime type exists.
    return undefined;
  }

  /**
   * Find the preferred mime type for a mime bundle.
   *
   * @param bundle - The bundle of mime data.
   *
   * @param safe - How to consider safe/unsafe factories. If 'ensure',
   *   it will only consider safe factories. If 'any', any factory will be
   *   considered. If 'prefer', unsafe factories will be considered, but
   *   only after the safe options have been exhausted.
   *
   * @returns The preferred mime type from the available factories,
   *   or `undefined` if the mime type cannot be rendered.
   */
  preferredMimeType(
    model: BaseOutputView,
    mode?: 'ensure' | 'prefer' | 'any' | 'largeOutput',
  ): string | undefined {
    // // Try to find a safe factory first, if preferred.
    // if (safe === 'ensure' || safe === 'prefer') {
    //   for (const mt of this.mimeTypes) {
    //     if (mt in bundle && this._factories[mt].safe) {
    //       return mt;
    //     }
    //   }
    // }

    // if (safe !== 'ensure') {
    //   // Otherwise, search for the best factory among all factories.
    //   for (const mt of this.mimeTypes) {
    //     if (mt in bundle) {
    //       return mt;
    //     }
    //   }
    // }
    const sortedRenderMimes = this.getSortedRenderMimes(model);

    for (const renderMime of sortedRenderMimes) {
      for (const mt of renderMime.mimeTypes) {
        if (mt in model.data) {
          if (
            mode !== 'largeOutput' &&
            largeOutputRendererFactory.mimeTypes.includes(mt)
          ) {
            continue;
          }
          return mt;
        }
      }
    }

    for (const mt of this.mimeTypes) {
      if (mt in model.data) {
        if (
          mode !== 'largeOutput' &&
          largeOutputRendererFactory.mimeTypes.includes(mt)
        ) {
          continue;
        }
        return mt;
      }
    }

    // Otherwise, no matching mime type exists.
    return undefined;
  }

  /**
   * Create a renderer for a mime type.
   *
   * @param mimeType - The mime type of interest.
   *
   * @returns A new renderer for the given mime type.
   *
   * @throws An error if no factory exists for the mime type.
   */
  createRenderer(
    mimeType: string,
    model: BaseOutputView, // model: BaseOutputModel,
    // host: HTMLElement,
  ): IRendererFactory {
    const renderMimes = this.getSortedRenderMimes(model);
    for (const renderMime of renderMimes) {
      for (const mt of renderMime.mimeTypes) {
        if (mimeType === mt) {
          this.renderMimeEmitter.fire({
            renderType: renderMime.renderType,
            mimeType,
          });
          return renderMime;
        }
      }
    }

    // Throw an error if no factory exists for the mime type.
    if (!(mimeType in this._factories)) {
      throw new Error(`No factory for mime type: '${mimeType}'`);
    }
    const renderMime = this._factories[mimeType];
    this.renderMimeEmitter.fire({
      renderType: this._factories[mimeType].renderType,
      mimeType,
    });
    // Invoke the best factory for the given mime type.
    return renderMime;
  }

  /**
   * Get the renderer factory registered for a mime type.
   *
   * @param mimeType - The mime type of interest.
   *
   * @returns The factory for the mime type, or `undefined`.
   */
  getFactory(mimeType: string): IRendererFactory | undefined {
    return this._factories[mimeType];
  }

  /**
   * Add a renderer factory to the rendermime.
   *
   * @param factory - The renderer factory of interest.
   *
   * @param _rank - The rank of the renderer. A lower rank indicates
   *   a higher priority for rendering. If not given, the rank will
   *   defer to the `defaultRank` of the factory.  If no `defaultRank`
   *   is given, it will default to 100.
   *
   * #### Notes
   * The renderer will replace an existing renderer for the given
   * mimeType.
   */
  addFactory(factory: IRendererFactory, _rank?: number): void {
    let rank = _rank;
    if (rank === undefined) {
      rank = factory.defaultRank;
      if (rank === undefined) {
        rank = 100;
      }
    }
    for (const mt of factory.mimeTypes) {
      this._factories[mt] = factory;
      this._ranks[mt] = { rank, id: this._id++ };
    }
    this._types = null;
  }

  /**
   * Remove a mime type.
   *
   * @param mimeType - The mime type of interest.
   */
  removeMimeType(mimeType: string): void {
    delete this._factories[mimeType];
    delete this._ranks[mimeType];
    this._types = null;
  }

  /**
   * Get the rank for a given mime type.
   *
   * @param mimeType - The mime type of interest.
   *
   * @returns The rank of the mime type or undefined.
   */
  getRank(mimeType: string): number | undefined {
    const rank = this._ranks[mimeType];
    return rank && rank.rank;
  }

  /**
   * Set the rank of a given mime type.
   *
   * @param mimeType - The mime type of interest.
   *
   * @param rank - The new rank to assign.
   *
   * #### Notes
   * This is a no-op if the mime type is not registered.
   */
  setRank(mimeType: string, rank: number): void {
    if (!this._ranks[mimeType]) {
      return;
    }
    const id = this._id++;
    this._ranks[mimeType] = { rank, id };
    this._types = null;
  }

  protected _id = 0;
  protected _ranks: RankMap = {};
  protected _types: string[] | null = null;
  protected _factories: FactoryMap = {};
}
