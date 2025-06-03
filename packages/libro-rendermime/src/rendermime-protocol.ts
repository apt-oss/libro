import type { ISanitizer } from '@difizen/libro-common';
import type { BaseOutputView } from '@difizen/libro-core';
import type { MarkdownParser } from '@difizen/libro-markdown';
import { Syringe } from '@difizen/libro-common/app';

export const DefaultRenderMimeRegistry = Symbol('RenderMimeRegistry');
export const IRenderMimeRegistryOptions = Symbol('IRenderMimeRegistryOptions');
export const RenderMimeContribution = Syringe.defineToken('RenderMimeTypeContribution');
export interface RenderMimeContribution extends IRendererFactory {
  canHandle: (model: BaseOutputView) => number;
  safe: boolean;
  renderType: string;
  mimeTypes: string[];
  render: React.FC<{ model: BaseOutputView; options?: Record<string, any> }>;
}
/**
 * The interface for a renderer factory.
 */
export interface IRendererFactory {
  allowClear?: boolean;
  /**
   * Whether the factory is a "safe" factory.
   *
   * #### Notes
   * A "safe" factory produces renderer widgets which can render
   * untrusted model data in a usable way. *All* renderers must
   * handle untrusted data safely, but some may simply failover
   * with a "Run cell to view output" message. A "safe" renderer
   * is an indication that its sanitized output will be useful.
   */
  readonly safe: boolean;

  readonly renderType: string;

  /**
   * The mime types handled by this factory.
   */
  readonly mimeTypes: readonly string[];

  /**
   * The default rank of the factory.  If not given, defaults to 100.
   */
  readonly defaultRank?: number;

  /**
   * Create a renderer which displays the mime data.
   *
   * @param options - The options used to render the data.
   */
  render: React.FC<{ model: BaseOutputView; props?: Record<string, any> }>;
}

/**
 * An object that resolves relative URLs.
 */
export interface IResolver {
  /**
   * Resolve a relative url to an absolute url path.
   */
  resolveUrl: (url: string) => Promise<string>;

  /**
   * Get the download url for a given absolute url path.
   *
   * #### Notes
   * This URL may include a query parameter.
   */
  getDownloadUrl: (url: string) => Promise<string>;

  /**
   * Whether the URL should be handled by the resolver
   * or not.
   *
   * #### Notes
   * This is similar to the `isLocal` check in `URL`,
   * but can also perform additional checks on whether the
   * resolver should handle a given URL.
   */
  isLocal?: (url: string) => boolean;
}
/**
 * An object that handles links on a node.
 */
export interface ILinkHandler {
  /**
   * Add the link handler to the node.
   *
   * @param node: the anchor node for which to handle the link.
   *
   * @param path: the path to open when the link is clicked.
   *
   * @param id: an optional element id to scroll to when the path is opened.
   */
  handleLink: (node: HTMLElement, path: string, id?: string) => void;
}

/**
 * Interface for generic renderer.
 */
export interface IRenderer {
  readonly render: (container: HTMLElement, options?: any) => void;
  readonly unrender?: (container: HTMLElement, options?: any) => void;
}

/**
 * The options used to clone a rendermime instance.
 */
export interface ICloneOptions {
  /**
   * The new sanitizer used to sanitize untrusted html inputs.
   */
  sanitizer?: ISanitizer;

  /**
   * The new resolver object.
   */
  resolver?: IResolver;

  /**
   * The new path handler.
   */
  linkHandler?: ILinkHandler;

  /**
   * The new Markdown parser.
   */
  markdownParser?: MarkdownParser;

  // /**
  //  * The application language translator.
  //  */
  // translator?: ITranslator;
}

export interface IRenderMimeRegistry {
  /**
   * The sanitizer used by the rendermime instance.
   */
  readonly sanitizer: ISanitizer;

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

  /**
   * The ordered list of mimeTypes.
   */
  readonly mimeTypes: readonly string[];

  /**
   * Find the preferred mime type for a mime bundle.
   *
   * @param bundle - The bundle of mime data.
   *
   * @param mode - How to consider safe/unsafe factories. If 'ensure',
   *   it will only consider safe factories. If 'any', any factory will be
   *   considered. If 'prefer', unsafe factories will be considered, but
   *   only after the safe options have been exhausted.
   *
   * @returns The preferred mime type from the available factories,
   *   or `undefined` if the mime type cannot be rendered.
   */
  preferredMimeType: (
    model: BaseOutputView,
    mode?: 'ensure' | 'prefer' | 'any' | 'largeOutput',
  ) => string | undefined;

  defaultPreferredMimeType: (
    model: BaseOutputView,
    mode?: 'ensure' | 'prefer' | 'any' | 'largeOutput',
  ) => string | undefined;
  // preferredMimeType: (
  //   bundle: ReadonlyPartialJSONObject,
  //   safe?: 'ensure' | 'prefer' | 'any',
  // ) => Promise<string | undefined>;

  /**
   * Create a renderer for a mime type.
   *
   * @param mimeType - The mime type of interest.
   *
   * @returns A new renderer for the given mime type.
   *
   * @throws An error if no factory exists for the mime type.
   */
  // createRenderer: (mimeType: string, model: BaseOutputModel, host: HTMLElement) => Promise<void>;
  createRenderer: (
    mimeType: string,
    model: BaseOutputView, // model: BaseOutputModel,
    // host: HTMLElement,
  ) => IRendererFactory;
  // /**
  //  * Create a new mime model.  This is a convenience method.
  //  *
  //  * @options - The options used to create the model.
  //  *
  //  * @returns A new mime model.
  //  */
  // createModel: (options?: MimeModel.IOptions) => MimeModel;

  // /**
  //  * Create a clone of this rendermime instance.
  //  *
  //  * @param options - The options for configuring the clone.
  //  *
  //  * @returns A new independent clone of the rendermime.
  //  */
  // clone: (options?: ICloneOptions) => IRenderMimeRegistry;

  /**
   * Get the renderer factory registered for a mime type.
   *
   * @param mimeType - The mime type of interest.
   *
   * @returns The factory for the mime type, or `undefined`.
   */
  getFactory: (mimeType: string) => IRendererFactory | undefined;

  /**
   * Add a renderer factory to the rendermime.
   *
   * @param factory - The renderer factory of interest.
   *
   * @param rank - The rank of the renderer. A lower rank indicates
   *   a higher priority for rendering. If not given, the rank will
   *   defer to the `defaultRank` of the factory.  If no `defaultRank`
   *   is given, it will default to 100.
   *
   * #### Notes
   * The renderer will replace an existing renderer for the given
   * mimeType.
   */
  addFactory: (factory: IRendererFactory, rank?: number) => void;

  /**
   * Remove a mime type.
   *
   * @param mimeType - The mime type of interest.
   */
  removeMimeType: (mimeType: string) => void;

  /**
   * Get the rank for a given mime type.
   *
   * @param mimeType - The mime type of interest.
   *
   * @returns The rank of the mime type or undefined.
   */
  getRank: (mimeType: string) => number | undefined;

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
  setRank: (mimeType: string, rank: number) => void;
}
/**
 * The options for the `renderText` function.
 */
export interface IRenderTextOptions {
  /**
   * The host node for the text content.
   */
  host: HTMLElement;

  /**
   * The html sanitizer for untrusted source.
   */
  sanitizer: ISanitizer;

  /**
   * The source text to render.
   */
  source: string;
  mimeType: string;
  /**
   * The application language translator.
   */
  // translator?: ITranslator;
}
/**
 * The options for the `renderImage` function.
 */
export interface IRenderImageOptions {
  /**
   * The image node to update with the content.
   */
  host: HTMLElement;

  /**
   * The mime type for the image.
   */
  mimeType: string;

  /**
   * The base64 encoded source for the image.
   */
  source: string;

  /**
   * The optional width for the image.
   */
  width?: number;

  /**
   * The optional height for the image.
   */
  height?: number;

  /**
   * Whether an image requires a background for legibility.
   */
  needsBackground?: string;

  /**
   * Whether the image should be unconfined.
   */
  unconfined?: boolean;
}

/**
 * The options for the `renderHTML` function.
 */
export interface IRenderHTMLOptions {
  /**
   * The host node for the rendered HTML.
   */
  host: HTMLElement;

  /**
   * The HTML source to render.
   */
  source: string;

  /**
   * Whether the source is trusted.
   */
  trusted: boolean;

  /**
   * The html sanitizer for untrusted source.
   */
  sanitizer: ISanitizer;

  /**
   * An optional url resolver.
   */
  resolver: IResolver | null;

  /**
   * An optional link handler.
   */
  linkHandler: ILinkHandler | null;

  /**
   * Whether the node should be typeset.
   */
  shouldTypeset: boolean;

  // /**
  //  * The application language translator.
  //  */
  // translator?: ITranslator;
}

/**
 * The options for the `renderMarkdown` function.
 */
export interface IRenderMarkdownOptions {
  /**
   * The host node for the rendered Markdown.
   */
  host: HTMLElement;

  /**
   * The Markdown source to render.
   */
  source: string;

  /**
   * Whether the source is trusted.
   */
  trusted: boolean;

  /**
   * The html sanitizer for untrusted source.
   */
  sanitizer: ISanitizer;

  /**
   * An optional url resolver.
   */
  resolver: IResolver | null;

  /**
   * An optional link handler.
   */
  linkHandler: ILinkHandler | null;

  /**
   * Whether the node should be typeset.
   */
  // shouldTypeset: boolean;

  /**
   * The Markdown parser.
   */
  markdownParser: MarkdownParser | null;

  // /**
  //  * The application language translator.
  //  */
  // translator?: ITranslator;

  cellId?: string;
}

/**
 * The options for the `renderSVG` function.
 */
export interface IRenderSVGOptions {
  /**
   * The host node for the rendered SVG.
   */
  host: HTMLElement;

  /**
   * The SVG source.
   */
  source: string;

  /**
   * Whether the source is trusted.
   */
  trusted: boolean;

  /**
   * Whether the svg should be unconfined.
   */
  unconfined?: boolean;

  // /**
  //  * The application language translator.
  //  */
  // translator: ITranslator;
}

/**
 * The options used to initialize a rendermime instance.
 */
export interface IRenderMimeRegistryOptions {
  /**
   * Initial factories to add to the rendermime instance.
   */
  initialFactories?: readonly IRendererFactory[];

  /**
   * The sanitizer used to sanitize untrusted html inputs.
   *
   * If not given, a default sanitizer will be used.
   */
  sanitizer?: ISanitizer;

  /**
   * The initial resolver object.
   *
   * The default is `null`.
   */
  resolver?: IResolver;

  /**
   * An optional path handler.
   */
  linkHandler?: ILinkHandler;

  /**
   * An optional Markdown parser.
   */
  markdownParser?: MarkdownParser;

  // /**
  //  * The application language translator.
  //  */
  // translator?: ITranslator;
}

/**
 * A type alias for a mime rank and tie-breaking id.
 */
export type RankPair = { readonly id: number; readonly rank: number };

/**
 * A type alias for a mapping of mime type -> rank pair.
 */
export type RankMap = Record<string, RankPair>;

/**
 * A type alias for a mapping of mime type -> ordered factories.
 */
export type FactoryMap = Record<string, IRendererFactory>;
