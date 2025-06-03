import { concatMultilineString } from '@difizen/libro-common';

import type {
  IRenderHTMLOptions,
  IRenderImageOptions,
  IRenderMarkdownOptions,
  IRenderSVGOptions,
  IRenderTextOptions,
} from './rendermime-protocol.js';
import {
  ansiSpan,
  autolink,
  evalInnerHTMLScriptTags,
  handleDefaults,
  handleUrls,
  splitShallowNode,
} from './rendermime-utils.js';

/**
 * Render text into a host node.
 *
 * @param options - The options for rendering.
 *
 * @returns A promise which resolves when rendering is complete.
 */
export function renderText(options: IRenderTextOptions): Promise<void> {
  // Unpack the options.
  const { host, sanitizer, source, mimeType } = options;
  const data = concatMultilineString(JSON.parse(JSON.stringify(source)));
  // Create the HTML content.
  const content = sanitizer.sanitize(ansiSpan(data), {
    allowedTags: ['span'],
  });

  if (mimeType === 'application/vnd.jupyter.stderr') {
    host.setAttribute('data-mime-type', 'application/vnd.jupyter.stderr');
  }
  const lastPre = host.querySelector('pre');
  if (lastPre !== null) {
    lastPre.remove();
  }

  // Set the sanitized content for the host node.
  const pre = document.createElement('pre');
  pre.innerHTML = content;

  const preTextContent = pre.textContent;

  if (preTextContent) {
    // Note: only text nodes and span elements should be present after sanitization in the `<pre>` element.
    const linkedNodes = autolink(preTextContent);
    let inAnchorElement = false;

    const combinedNodes: (HTMLAnchorElement | Text | HTMLSpanElement)[] = [];
    const preNodes = Array.from(pre.childNodes) as (Text | HTMLSpanElement)[];

    while (preNodes.length && linkedNodes.length) {
      // Use non-null assertions to workaround TypeScript context awareness limitation
      // (if any of the arrays were empty, we would not enter the body of the loop).
      let preNode = preNodes.shift()!;
      let linkNode = linkedNodes.shift()!;

      // This should never happen because we modify the arrays in flight so they should end simultaneously,
      // but this makes the coding assistance happy and might make it easier to conceptualize.
      if (typeof preNode === 'undefined') {
        combinedNodes.push(linkNode);
        break;
      }
      if (typeof linkNode === 'undefined') {
        combinedNodes.push(preNode);
        break;
      }

      const preLen = preNode.textContent?.length;
      const linkLen = linkNode.textContent?.length;
      if (preLen && linkLen) {
        if (preLen > linkLen) {
          // Split pre node and only keep the shorter part
          const { pre: keep, post: postpone } = splitShallowNode(preNode, linkLen);
          preNodes.unshift(postpone);
          preNode = keep;
        } else if (linkLen > preLen) {
          const { pre: keep, post: postpone } = splitShallowNode(linkNode, preLen);
          linkedNodes.unshift(postpone);
          linkNode = keep;
        }
      }

      const lastCombined = combinedNodes[combinedNodes.length - 1];

      // If we are already in an anchor element and the anchor element did not change,
      // we should insert the node from <pre> which is either Text node or coloured span Element
      // into the anchor content as a child
      if (
        inAnchorElement &&
        (linkNode as HTMLAnchorElement).href ===
          (lastCombined as HTMLAnchorElement).href
      ) {
        lastCombined.appendChild(preNode);
      } else {
        // the `linkNode` is either Text or AnchorElement;
        const isAnchor = linkNode.nodeType !== Node.TEXT_NODE;
        // if we are NOT about to start an anchor element, just add the pre Node
        if (!isAnchor) {
          combinedNodes.push(preNode);
          inAnchorElement = false;
        } else {
          // otherwise start a new anchor; the contents of the `linkNode` and `preNode` should be the same,
          // so we just put the neatly formatted `preNode` inside the anchor node (`linkNode`)
          // and append that to combined nodes.
          linkNode.textContent = '';
          linkNode.appendChild(preNode);
          combinedNodes.push(linkNode);
          inAnchorElement = true;
        }
      }
    }
    // TODO: replace with `.replaceChildren()` once the target ES version allows it
    pre.innerHTML = '';
    for (const child of combinedNodes) {
      pre.appendChild(child);
    }
  }

  host.appendChild(pre);
  host.classList.add('libro-text-render');

  // Return the rendered promise.
  return Promise.resolve(undefined);
}

/**
 * Render an image into a host node.
 *
 * @param options - The options for rendering.
 *
 * @returns A promise which resolves when rendering is complete.
 */
export function renderImage(options: IRenderImageOptions): Promise<void> {
  // Unpack the options.
  const { host, mimeType, source, width, height, needsBackground, unconfined } =
    options;

  // Clear the content in the host.
  host.textContent = '';

  // Create the image element.
  const img = document.createElement('img');

  // Set the source of the image.
  img.src = `data:${mimeType};base64,${source}`;

  // Set the size of the image if provided.
  if (typeof height === 'number') {
    img.height = height;
  }
  if (typeof width === 'number') {
    img.width = width;
  }

  if (needsBackground === 'light') {
    img.classList.add('jp-needs-light-background');
  } else if (needsBackground === 'dark') {
    img.classList.add('jp-needs-dark-background');
  }

  if (unconfined === true) {
    img.classList.add('jp-mod-unconfined');
  }

  // Add the image to the host.
  host.appendChild(img);

  // Return the rendered promise.
  return Promise.resolve(undefined);
}

/**
 * Render HTML into a host node.
 *
 * @param options - The options for rendering.
 *
 * @returns A promise which resolves when rendering is complete.
 */
export function renderHTML(options: IRenderHTMLOptions): Promise<void> {
  // Unpack the options.
  const {
    host,
    trusted,
    sanitizer,
    resolver,
    linkHandler,
    // translator,
  } = options;
  let source = options.source;

  // translator = translator || nullTranslator;
  // const trans = translator?.load('jupyterlab');
  let originalSource = source;

  // Bail early if the source is empty.
  if (!source) {
    host.textContent = '';
    return Promise.resolve(undefined);
  }

  // Sanitize the source if it is not trusted. This removes all
  // `<script>` tags as well as other potentially harmful HTML.
  if (!trusted) {
    originalSource = `${source}`;
    source = sanitizer.sanitize(source);
  }

  // Set the inner HTML of the host.
  host.innerHTML = source;

  if (host.getElementsByTagName('script').length > 0) {
    // If output it trusted, eval any script tags contained in the HTML.
    // This is not done automatically by the browser when script tags are
    // created by setting `innerHTML`.
    if (trusted) {
      evalInnerHTMLScriptTags(host);
    } else {
      const container = document.createElement('div');
      const warning = document.createElement('pre');
      warning.textContent =
        'This HTML output contains inline scripts. Are you sure that you want to run arbitrary Javascript within your JupyterLab session?';
      const runButton = document.createElement('button');
      runButton.textContent = 'Run';
      runButton.onclick = () => {
        host.innerHTML = originalSource;
        evalInnerHTMLScriptTags(host);
        if (host.firstChild) {
          host.removeChild(host.firstChild);
        }
      };
      container.appendChild(warning);
      container.appendChild(runButton);
      host.insertBefore(container, host.firstChild);
    }
  }

  // Handle default behavior of nodes.
  handleDefaults(host, resolver);

  // Patch the urls if a resolver is available.
  let promise: Promise<void>;
  if (resolver) {
    promise = handleUrls(host, resolver, linkHandler);
  } else {
    promise = Promise.resolve(undefined);
  }

  // Return the final rendered promise.
  return promise;
}

/**
 * Render SVG into a host node.
 *
 * @param options - The options for rendering.
 *
 * @returns A promise which resolves when rendering is complete.
 */
export function renderSVG(options: IRenderSVGOptions): Promise<void> {
  // Unpack the options.
  const { host, unconfined } = options;
  let source = options.source;
  // Clear the content if there is no source.
  if (!source) {
    host.textContent = '';
    return Promise.resolve(undefined);
  }

  // // Display a message if the source is not trusted.
  // if (!trusted) {
  //   host.textContent = 'Cannot display an untrusted SVG. Maybe you need to run the cell?';
  //   return Promise.resolve(undefined);
  // }

  // Add missing SVG namespace (if actually missing)
  const patt = '<svg[^>]+xmlns=[^>]+svg';
  if (source.search(patt) < 0) {
    source = source.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
  }

  // Render in img so that user can save it easily
  const img = new Image();
  img.src = `data:image/svg+xml,${encodeURIComponent(source)}`;
  host.appendChild(img);

  if (unconfined === true) {
    host.classList.add('jp-mod-unconfined');
  }
  return Promise.resolve();
}

/**
 * Render Markdown into a host node.
 *
 * @param options - The options for rendering.
 *
 * @returns A promise which resolves when rendering is complete.
 */
export async function renderMarkdown(options: IRenderMarkdownOptions): Promise<void> {
  // Unpack the options.
  const { host, source, ...others } = options;

  // Clear the content if there is no source.
  if (!source) {
    host.textContent = '';
    return;
  }

  let html = '';

  // Fallback if the application does not have any markdown parser.
  html = `<pre>${source}</pre>`;

  // Render HTML.
  await renderHTML({
    host,
    source: html,
    shouldTypeset: false,
    ...others,
  });

  // Apply ids to the header nodes.
  // headerAnchors(host);
}
