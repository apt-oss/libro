import {
  HTMLRender,
  ImageRender,
  LatexRender,
  MarkdownRender,
  SVGRender,
  TextRender,
} from './components/index.js';
import type { IRendererFactory } from './rendermime-protocol.js';

/**
 * A mime renderer factory for raw html.
 */
export const htmlRendererFactory: IRendererFactory = {
  renderType: 'htmlRenderer',
  safe: true,
  mimeTypes: ['text/html'],
  defaultRank: 50,
  render: HTMLRender,
};

/**
 * A mime renderer factory for images.
 */
export const imageRendererFactory: IRendererFactory = {
  renderType: 'imageRenderer',
  safe: true,
  mimeTypes: ['image/bmp', 'image/png', 'image/jpeg', 'image/gif', 'image/webp'],
  defaultRank: 90,
  render: ImageRender,
};

/**
 * A mime renderer factory for LaTeX.
 */
export const latexRendererFactory: IRendererFactory = {
  renderType: 'latexRenderer',
  safe: true,
  mimeTypes: ['text/latex'],
  defaultRank: 70,
  render: LatexRender,
};

/**
 * A mime renderer factory for Markdown.
 */
export const markdownRendererFactory: IRendererFactory = {
  renderType: 'markdownRenderer',
  safe: true,
  mimeTypes: ['text/markdown'],
  defaultRank: 60,
  render: MarkdownRender,
};

/**
 * A mime renderer factory for svg.
 */
export const svgRendererFactory: IRendererFactory = {
  renderType: 'svgRenderer',
  safe: false,
  mimeTypes: ['image/svg+xml'],
  defaultRank: 80,
  render: SVGRender,
};

/**
 * A mime renderer factory for plain and jupyter console text data.
 */
export const textRendererFactory: IRendererFactory = {
  renderType: 'textRenderer',
  safe: true,
  mimeTypes: [
    'text/plain',
    'application/vnd.jupyter.stdout',
    'application/vnd.jupyter.stderr',
  ],
  defaultRank: 120,
  render: TextRender,
};

/**
 * A mime renderer factory for plain and jupyter console text data.
 */
export const largeOutputRendererFactory: IRendererFactory = {
  renderType: 'largeOutputRenderer',
  safe: true,
  mimeTypes: [
    'application/vnd.libro.large.output.stdout',
    'application/vnd.libro.large.output.stderr',
  ],
  defaultRank: 100,
  render: TextRender,
};

/**
 * The standard factories provided by the rendermime package.
 */
export const standardRendererFactories: IRendererFactory[] = [
  htmlRendererFactory,
  markdownRendererFactory,
  latexRendererFactory,
  svgRendererFactory,
  imageRendererFactory,
  // javaScriptRendererFactory,
  textRendererFactory,
  largeOutputRendererFactory,
];
