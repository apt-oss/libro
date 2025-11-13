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
  autolinkRanges,
  createAnchorForUrl,
  evalInnerHTMLScriptTags,
  handleDefaults,
  handleUrls,
  pieceFromNodeSlice,
} from './rendermime-utils.js';

/**
 * renderText
 * - 使用 autolinkRanges 得到全局的链接区间信息（start/end/url）。
 * - 在脱离文档的 parsed fragment（template.content）上按子节点边界切片，
 *   仅创建必要的 Text / shallow-clone element / <a> 节点。
 * - 对跨子节点的链接，使用 pendingAnchor 把分片累计到同一个 <a>，直到 range 结束。
 * - 最后一次性将构建好的 DocumentFragment 插回 pre 中，减少重排与 GC 压力。
 */
export function renderText(options: IRenderTextOptions): Promise<void> {
  const { host, sanitizer, source, mimeType } = options;
  const data = concatMultilineString(source);

  // 对文本做 ansi -> span 的转换并 sanitize（仅允许 <span>）
  const content = sanitizer.sanitize(ansiSpan(data), {
    allowedTags: ['span'],
  });

  if (mimeType === 'application/vnd.jupyter.stderr') {
    host.setAttribute('data-mime-type', 'application/vnd.jupyter.stderr');
  }

  // 确保存在 <pre>，但不要马上把 innerHTML 写入实际文档（我们将在脱离文档的 fragment 上操作）
  let pre = host.querySelector('pre');
  if (!pre) {
    pre = document.createElement('pre');
    host.appendChild(pre);
  }

  // 使用 template 元素来解析 HTML，但 template.content 尚未插入到文档中 -> 不触发重排
  const tpl = document.createElement('template');
  tpl.innerHTML = content;
  const parsedFrag = tpl.content;

  // 全文文本（用于按字符位置计算 ranges）
  const fullText = parsedFrag.textContent || '';
  if (!fullText) {
    // 若没有文本，清空并返回（保持 class）
    pre.innerHTML = '';
    host.classList.add('libro-text-render');
    return Promise.resolve(undefined);
  }

  // 计算链接 ranges
  const ranges = autolinkRanges(fullText);

  // 准备输出 fragment（最终将一次性 append 到 pre）
  const outFrag = document.createDocumentFragment();

  // pendingAnchor 用于处理链接跨多个原始子节点的情形：
  // 当链接在一个子节点中没有结束时，把该子节点片段 append 到 pendingAnchor，
  // 等到链接结束时再把 pendingAnchor push 到 outFrag。
  let pendingAnchor: HTMLAnchorElement | null = null;
  // 当前处理到的 range 索引
  let rangeIdx = 0;

  // 遍历 parsedFrag 的顶层子节点（这些通常是由 sanitizer/ansiSpan 产生的 span/text 节点）
  let globalOffset = 0;
  const childNodes = Array.from(parsedFrag.childNodes) as Node[];
  for (let ni = 0; ni < childNodes.length; ni++) {
    const node = childNodes[ni];
    const nodeText = node.textContent || '';
    const nodeLen = nodeText.length;
    if (nodeLen === 0) {
      // 空节点直接跳过（同时 pendingAnchor 不受影响）
      continue;
    }

    let localPos = 0; // 当前在该节点内的偏移
    while (localPos < nodeLen) {
      const absPos = globalOffset + localPos;
      // 跳过已经结束在当前位置之前的 ranges（将 rangeIdx 推到第一个可能相关的 range）
      while (rangeIdx < ranges.length && ranges[rangeIdx].end <= absPos) {
        rangeIdx++;
      }
      const curRange = rangeIdx < ranges.length ? ranges[rangeIdx] : null;

      // 如果当前有正在构建的 pendingAnchor（链接已经开始但尚未结束）
      if (pendingAnchor) {
        // 计算本次可以从该节点中“消费”的长度（尽量多取，直到链接结束或节点结束）
        const take = Math.min(
          nodeLen - localPos,
          (curRange ? curRange.end : absPos) - absPos,
        );
        const piece = pieceFromNodeSlice(node, localPos, localPos + take);
        pendingAnchor.appendChild(piece);
        localPos += take;

        // 若到达了当前 range 的结束位置，则关闭 pendingAnchor
        if (curRange && globalOffset + localPos >= curRange.end) {
          outFrag.appendChild(pendingAnchor);
          pendingAnchor = null;
          rangeIdx++; // 当前 range 完成，推进到下一个
        }
        // 继续循环：可能在同一节点内就完成多个 ranges
        continue;
      }

      // 没有 pendingAnchor：决定当前段是普通文本还是链接起点
      if (!curRange || curRange.start >= globalOffset + nodeLen) {
        // 当前剩余的节点内容中，没有链接开始 -> 全部作为普通片段
        const piece = pieceFromNodeSlice(node, localPos, nodeLen);
        outFrag.appendChild(piece);
        localPos = nodeLen;
      } else if (curRange.start > absPos) {
        // 有链接，但还没到链接起点：把从 localPos 到链接起点之前的文本作为普通片段
        const until = Math.min(nodeLen, curRange.start - globalOffset);
        const piece = pieceFromNodeSlice(node, localPos, until);
        outFrag.appendChild(piece);
        localPos = until;
      } else {
        // 当前绝对位置处于链接范围之内（curRange.start <= absPos < curRange.end）
        // 新建一个 anchor 并把该节点中属于该链接的部分 append 到 anchor
        pendingAnchor = createAnchorForUrl(curRange.url);
        const take = Math.min(nodeLen - localPos, curRange.end - absPos);
        const piece = pieceFromNodeSlice(node, localPos, localPos + take);
        pendingAnchor.appendChild(piece);
        localPos += take;

        // 如果这个 range 在当前节点内就结束，则立即关闭 pendingAnchor
        if (globalOffset + localPos >= curRange.end) {
          outFrag.appendChild(pendingAnchor);
          pendingAnchor = null;
          rangeIdx++;
        }
        // 否则 pendingAnchor 会在后续节点继续被填充
      }
    }

    globalOffset += nodeLen;
  }

  // 如果循环结束后仍有 pendingAnchor（理论上不应发生，但以防万一），追加它
  if (pendingAnchor) {
    outFrag.appendChild(pendingAnchor);
    pendingAnchor = null;
  }

  // 一次性替换 pre 的内容：先清空再 append（减少中间重排）
  pre.innerHTML = '';
  pre.appendChild(outFrag);

  host.classList.add('libro-text-render');

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
