import type { ISanitizer } from '@difizen/libro-common';
import { URL } from '@difizen/libro-common';
import { URI } from '@difizen/mana-app';
import escape from 'lodash.escape';

import type { ILinkHandler, IResolver, RankMap } from './rendermime-protocol.js';

export interface IRenderOptions {
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
}

const ANSI_COLORS = [
  'ansi-black',
  'ansi-red',
  'ansi-green',
  'ansi-yellow',
  'ansi-blue',
  'ansi-magenta',
  'ansi-cyan',
  'ansi-white',
  'ansi-black-intense',
  'ansi-red-intense',
  'ansi-green-intense',
  'ansi-yellow-intense',
  'ansi-blue-intense',
  'ansi-magenta-intense',
  'ansi-cyan-intense',
  'ansi-white-intense',
];

/**
 * Create HTML tags for a string with given foreground, background etc. and
 * add them to the `out` array.
 */
function pushColoredChunk(
  chunk: string,
  fg: number | number[],
  bg: number | number[],
  bold: boolean,
  underline: boolean,
  inverse: boolean,
  out: string[],
): void {
  let _fg = fg;
  let _bg = bg;
  if (chunk) {
    const classes = [];
    const styles = [];

    if (bold && typeof _fg === 'number' && 0 <= _fg && _fg < 8) {
      _fg += 8; // Bold text uses "intense" colors
    }
    if (inverse) {
      [_fg, _bg] = [_bg, _fg];
    }

    if (typeof _fg === 'number') {
      classes.push(ANSI_COLORS[_fg] + '-fg');
    } else if (_fg.length) {
      styles.push(`color: rgb(${_fg})`);
    } else if (inverse) {
      classes.push('ansi-default-inverse-fg');
    }

    if (typeof _bg === 'number') {
      classes.push(ANSI_COLORS[_bg] + '-bg');
    } else if (_bg.length) {
      styles.push(`background-color: rgb(${_bg})`);
    } else if (inverse) {
      classes.push('ansi-default-inverse-bg');
    }

    if (bold) {
      classes.push('ansi-bold');
    }

    if (underline) {
      classes.push('ansi-underline');
    }

    if (classes.length || styles.length) {
      out.push('<span');
      if (classes.length) {
        out.push(` class="${classes.join(' ')}"`);
      }
      if (styles.length) {
        out.push(` style="${styles.join('; ')}"`);
      }
      out.push('>');
      out.push(chunk);
      out.push('</span>');
    } else {
      out.push(chunk);
    }
  }
}

/**
 * Convert ANSI extended colors to R/G/B triple.
 */
function getExtendedColors(numbers: number[]): number | number[] {
  let r;
  let g;
  let b;
  const n = numbers.shift();
  if (n === 2 && numbers.length >= 3) {
    // 24-bit RGB
    r = numbers.shift()!;
    g = numbers.shift()!;
    b = numbers.shift()!;
    if ([r, g, b].some((c) => c < 0 || 255 < c)) {
      throw new RangeError('Invalid range for RGB colors');
    }
  } else if (n === 5 && numbers.length >= 1) {
    // 256 colors
    const idx = numbers.shift()!;
    if (idx < 0) {
      throw new RangeError('Color index must be >= 0');
    } else if (idx < 16) {
      // 16 default terminal colors
      return idx;
    } else if (idx < 232) {
      // 6x6x6 color cube, see https://stackoverflow.com/a/27165165/500098
      r = Math.floor((idx - 16) / 36);
      r = r > 0 ? 55 + r * 40 : 0;
      g = Math.floor(((idx - 16) % 36) / 6);
      g = g > 0 ? 55 + g * 40 : 0;
      b = (idx - 16) % 6;
      b = b > 0 ? 55 + b * 40 : 0;
    } else if (idx < 256) {
      // grayscale, see https://stackoverflow.com/a/27165165/500098
      r = g = b = (idx - 232) * 10 + 8;
    } else {
      throw new RangeError('Color index must be < 256');
    }
  } else {
    throw new RangeError('Invalid extended color specification');
  }
  return [r, g, b];
}

/**
 * Transform ANSI color escape codes into HTML <span> tags with CSS
 * classes such as "ansi-green-intense-fg".
 * The actual colors used are set in the CSS file.
 * This also removes non-color escape sequences.
 * This is supposed to have the same behavior as nbconvert.filters.ansi2html()
 */
export function ansiSpan(str: string): string {
  const ansiRe = /\x1b\[(.*?)([@-~])/g; // eslint-disable-line no-control-regex
  let fg: number | number[] = [];
  let bg: number | number[] = [];
  let bold = false;
  let underline = false;
  let inverse = false;
  let match;
  const out: string[] = [];
  const numbers = [];
  let start = 0;

  let _str = escape(str);

  _str += '\x1b[m'; // Ensure markup for trailing text
  // tslint:disable-next-line
  while ((match = ansiRe.exec(_str))) {
    if (match[2] === 'm') {
      const items = match[1].split(';');
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item === '') {
          numbers.push(0);
        } else if (item.search(/^\d+$/) !== -1) {
          numbers.push(parseInt(item, 10));
        } else {
          // Ignored: Invalid color specification
          numbers.length = 0;
          break;
        }
      }
    } else {
      // Ignored: Not a color code
    }
    const chunk = _str.substring(start, match.index);
    pushColoredChunk(chunk, fg, bg, bold, underline, inverse, out);
    start = ansiRe.lastIndex;

    while (numbers.length) {
      const n = numbers.shift();
      switch (n) {
        case 0:
          fg = bg = [];
          bold = false;
          underline = false;
          inverse = false;
          break;
        case 1:
        case 5:
          bold = true;
          break;
        case 4:
          underline = true;
          break;
        case 7:
          inverse = true;
          break;
        case 21:
        case 22:
          bold = false;
          break;
        case 24:
          underline = false;
          break;
        case 27:
          inverse = false;
          break;
        case 30:
        case 31:
        case 32:
        case 33:
        case 34:
        case 35:
        case 36:
        case 37:
          fg = n - 30;
          break;
        case 38:
          try {
            fg = getExtendedColors(numbers);
          } catch (e) {
            numbers.length = 0;
          }
          break;
        case 39:
          fg = [];
          break;
        case 40:
        case 41:
        case 42:
        case 43:
        case 44:
        case 45:
        case 46:
        case 47:
          bg = n - 40;
          break;
        case 48:
          try {
            bg = getExtendedColors(numbers);
          } catch (e) {
            numbers.length = 0;
          }
          break;
        case 49:
          bg = [];
          break;
        case 90:
        case 91:
        case 92:
        case 93:
        case 94:
        case 95:
        case 96:
        case 97:
          fg = n - 90 + 8;
          break;
        case 100:
        case 101:
        case 102:
        case 103:
        case 104:
        case 105:
        case 106:
        case 107:
          bg = n - 100 + 8;
          break;
        default:
        // Unknown codes are ignored
      }
    }
  }
  return out.join('');
}

export interface LinkRange {
  start: number; // inclusive index in whole content string
  end: number; // exclusive index
  url: string; // raw matched url text (without trailing > or <)
}

/**
 * 根据原始节点、start/end 在该节点的偏移，创建对应的片段节点（不修改原节点）
 * - 若原节点是 Text，则创建 document.createTextNode(substring)
 * - 若原节点是 Element（如 span），则 cloneNode(false) shallow clone 后设 textContent 为 substring（保留属性/类）
 */
export function pieceFromNodeSlice(
  node: Node,
  startInNode: number,
  endInNode: number,
): Node {
  const text = (node.textContent || '').slice(startInNode, endInNode);
  if (node.nodeType === Node.TEXT_NODE) {
    return document.createTextNode(text);
  } else {
    const el = (node as Element).cloneNode(false) as Element;
    el.textContent = text;
    return el;
  }
}

/**
 * 创建 <a> 的 helper（保留 rel/target，并处理 www. 前缀）
 */
export function createAnchorForUrl(urlText: string): HTMLAnchorElement {
  const a = document.createElement('a');
  a.href = urlText.startsWith('www.') ? 'https://' + urlText : urlText;
  a.rel = 'noopener';
  a.target = '_blank';
  return a;
}

/**
 * 在字符串中查找链接范围（不创建 DOM），返回按 start 升序、不重叠的 LinkRange 数组。
 * 该函数仅做正则匹配与位置信息记录，避免任何 DOM 分配以降低开销。
 */
export function autolinkRanges(content: string): LinkRange[] {
  // Taken from Visual Studio Code:
  // https://github.com/microsoft/vscode/blob/9f709d170b06e991502153f281ec3c012add2e42/src/vs/workbench/contrib/debug/browser/linkDetector.ts#L17-L18
  const controlCodes = '\\u0000-\\u0020\\u007f-\\u009f';
  const webLinkRegex = new RegExp(
    '(?:[a-zA-Z][a-zA-Z0-9+.-]{2,}:\\/\\/|data:|www\\.)[^\\s' +
      controlCodes +
      '"]{2,}[^\\s' +
      controlCodes +
      '"\'(){}\\[\\],:;.!?]',
    'ug',
  );

  const ranges: LinkRange[] = [];
  let match: RegExpExecArray | null;
  while ((match = webLinkRegex.exec(content))) {
    const url = match[0];
    // 处理特殊情况：末尾为 '>' 或 '<' 时排除该字符
    const lastChars = url.slice(-1);
    const endsWithGtLt = lastChars === '>' || lastChars === '<';
    const len = endsWithGtLt ? url.length - 1 : url.length;
    const start = match.index;
    const end = match.index + len;
    ranges.push({ start, end, url: url.slice(0, len) });
    // 正则使用全局标志 'g'，exec 会自动推进位置
  }
  return ranges;
}

/**
 * Split a shallow node (node without nested nodes inside) at a given text content position.
 *
 * @param node the shallow node to be split
 * @param at the position in textContent at which the split should occur
 */
export function splitShallowNode<T extends Node>(
  node: T,
  at: number,
): { pre: T; post: T } {
  const pre = node.cloneNode() as T;
  pre.textContent = node.textContent?.substr(0, at) as string;
  const post = node.cloneNode() as T;
  post.textContent = node.textContent?.substr(at) as string;
  return {
    pre: pre,
    post: post,
  };
}

export function sortedTypes(map: RankMap): string[] {
  return Object.keys(map).sort((a, b) => {
    const p1 = map[a];
    const p2 = map[b];
    if (p1.rank !== p2.rank) {
      return p1.rank - p2.rank;
    }
    return p1.id - p2.id;
  });
}

/**
 * Eval the script tags contained in a host populated by `innerHTML`.
 *
 * When script tags are created via `innerHTML`, the browser does not
 * evaluate them when they are added to the page. This function works
 * around that by creating new equivalent script nodes manually, and
 * replacing the originals.
 */
export function evalInnerHTMLScriptTags(host: HTMLElement): void {
  // Create a snapshot of the current script nodes.
  const scripts = Array.from(host.getElementsByTagName('script'));

  // Loop over each script node.
  for (const script of scripts) {
    // Skip any scripts which no longer have a parent.
    if (!script.parentNode) {
      continue;
    }

    // Create a new script node which will be clone.
    const clone = document.createElement('script');

    // Copy the attributes into the clone.
    const attrs = script.attributes;
    for (let i = 0, n = attrs.length; i < n; ++i) {
      const { name, value } = attrs[i];
      clone.setAttribute(name, value);
    }

    // Copy the text content into the clone.
    clone.textContent = script.textContent;

    // Replace the old script in the parent.
    script.parentNode.replaceChild(clone, script);
  }
}

/**
 * Handle the default behavior of nodes.
 */
export function handleDefaults(node: HTMLElement, resolver?: IResolver | null): void {
  // Handle anchor elements.
  const anchors = node.getElementsByTagName('a');
  for (let i = 0; i < anchors.length; i++) {
    const el = anchors[i];
    // skip when processing a elements inside svg
    // which are of type SVGAnimatedString
    if (!(el instanceof HTMLAnchorElement)) {
      continue;
    }
    const path = el.href;
    const isLocal =
      resolver && resolver.isLocal ? resolver.isLocal(path) : URL.isLocal(path);
    // set target attribute if not already present
    if (!el.target) {
      el.target = isLocal ? '_self' : '_blank';
    }
    // set rel as 'noopener' for non-local anchors
    if (!isLocal) {
      el.rel = 'noopener';
    }
  }

  // Handle image elements.
  const imgs = node.getElementsByTagName('img');
  for (let i = 0; i < imgs.length; i++) {
    if (!imgs[i].alt) {
      imgs[i].alt = 'Image';
    }
  }
}

/**
 * Resolve the relative urls in element `src` and `href` attributes.
 *
 * @param node - The head html element.
 *
 * @param resolver - A url resolver.
 *
 * @param linkHandler - An optional link handler for nodes.
 *
 * @returns a promise fulfilled when the relative urls have been resolved.
 */
export function handleUrls(
  node: HTMLElement,
  resolver: IResolver,
  linkHandler: ILinkHandler | null,
): Promise<void> {
  // Set up an array to collect promises.
  const promises: Promise<void>[] = [];

  // Handle HTML Elements with src attributes.
  const nodes = node.querySelectorAll('*[src]');
  for (let i = 0; i < nodes.length; i++) {
    promises.push(handleAttr(nodes[i] as HTMLElement, 'src', resolver));
  }

  // Handle anchor elements.
  const anchors = node.getElementsByTagName('a');
  for (let i = 0; i < anchors.length; i++) {
    promises.push(handleAnchor(anchors[i], resolver, linkHandler));
  }

  // Handle link elements.
  const links = node.getElementsByTagName('link');
  for (let i = 0; i < links.length; i++) {
    promises.push(handleAttr(links[i], 'href', resolver));
  }

  // Wait on all promises.
  return Promise.all(promises).then(() => undefined);
}

/**
 * Handle a node with a `src` or `href` attribute.
 */
async function handleAttr(
  node: HTMLElement,
  name: 'src' | 'href',
  resolver: IResolver,
): Promise<void> {
  const source = node.getAttribute(name) || '';
  const isLocal = resolver.isLocal ? resolver.isLocal(source) : URL.isLocal(source);
  if (!source || !isLocal) {
    return;
  }
  try {
    const urlPath = await resolver.resolveUrl(source);
    let url = await resolver.getDownloadUrl(urlPath);
    if (new URI(url).scheme !== 'data:') {
      // Bust caching for local src attrs.
      // https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/Using_XMLHttpRequest#Bypassing_the_cache
      url += (/\?/.test(url) ? '&' : '?') + new Date().getTime();
    }
    node.setAttribute(name, url);
  } catch (err) {
    // If there was an error getting the url,
    // just make it an empty link and report the error.
    node.setAttribute(name, '');
    throw err;
  }
}

/**
 * Handle an anchor node.
 */
function handleAnchor(
  anchor: HTMLAnchorElement,
  resolver: IResolver,
  linkHandler: ILinkHandler | null,
): Promise<void> {
  // Get the link path without the location prepended.
  // (e.g. "./foo.md#Header 1" vs "http://localhost:8888/foo.md#Header 1")
  let href = anchor.getAttribute('href') || '';
  const isLocal = resolver.isLocal ? resolver.isLocal(href) : URL.isLocal(href);
  // Bail if it is not a file-like url.
  if (!href || !isLocal) {
    return Promise.resolve(undefined);
  }
  // Remove the hash until we can handle it.
  const hash = anchor.hash;
  if (hash) {
    // Handle internal link in the file.
    if (hash === href) {
      anchor.target = '_self';
      return Promise.resolve(undefined);
    }
    // For external links, remove the hash until we have hash handling.
    href = href.replace(hash, '');
  }
  // Get the appropriate file path.
  return resolver
    .resolveUrl(href)
    .then((urlPath) => {
      // decode encoded url from url to api path
      const path = decodeURIComponent(urlPath);
      // Handle the click override.
      if (linkHandler) {
        linkHandler.handleLink(anchor, path, hash);
      }
      // Get the appropriate file download path.
      return resolver.getDownloadUrl(urlPath);
    })
    .then((url) => {
      // Set the visible anchor.
      anchor.href = url + hash;
      return;
    })
    .catch(() => {
      // If there was an error getting the url,
      // just make it an empty link.
      anchor.href = '';
    });
}

/**
 * Create a normalized id for a header element.
 *
 * @param header Header element
 * @returns Normalized id
 */
export function createHeaderId(header: Element): string {
  return (header.textContent ?? '').replace(/ /g, '-');
}

/**
 * Apply ids to headers.
 */
// export function headerAnchors(node: HTMLElement): void {
//   const headerNames = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
//   for (const headerType of headerNames) {
//     const headers = node.getElementsByTagName(headerType);
//     for (let i = 0; i < headers.length; i++) {
//       const header = headers[i];
//       header.id = createHeaderId(header);
//       const anchor = document.createElement('a');
//       anchor.target = '_self';
//       anchor.textContent = '¶';
//       anchor.href = '#' + header.id;
//       anchor.classList.add('libro-InternalAnchorLink');
//       header.appendChild(anchor);
//     }
//   }
// }
// export function sessionConnection(
//   s: Session.ISessionConnection | ISessionContext,
// ): Session.ISessionConnection | null {
//   return (s as any).sessionChanged
//     ? (s as ISessionContext).session
//     : (s as Session.ISessionConnection);
// }
