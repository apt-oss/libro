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

// module-level state: per-host streaming render state
type HostState = {
  pre: HTMLPreElement;
  prevData: string; // previously rendered raw data (concatMultilineString result)
  pendingFrag: DocumentFragment | null;
  scheduled: boolean;
  rafId: number | null; // 保存 requestAnimationFrame 返回值，便于取消
};

const hostStates = new WeakMap<HTMLElement, HostState>();

// Threshold in px to consider "user at bottom" (自动滚动触发阈值)
const AUTO_SCROLL_THRESHOLD = 50;

// Helper: is the user currently at (or near) the bottom of the pre container?
function isUserAtBottom(pre: HTMLElement, threshold = AUTO_SCROLL_THRESHOLD): boolean {
  if (pre.scrollHeight <= pre.clientHeight) {
    return true;
  }
  return pre.scrollHeight - (pre.scrollTop + pre.clientHeight) <= threshold;
}

// Schedule and perform append in next animation frame (batching multiple appends)
function scheduleAppend(host: HTMLElement) {
  const st = hostStates.get(host);
  if (!st) {
    return;
  }
  if (st.scheduled) {
    return;
  }
  st.scheduled = true;

  // capture whether to auto-scroll at the moment of scheduling
  const pre = st.pre;
  const shouldAutoAtSchedule = isUserAtBottom(pre);

  st.rafId = requestAnimationFrame(() => {
    st.scheduled = false;
    if (!st.pendingFrag) {
      return;
    }

    try {
      pre.appendChild(st.pendingFrag);
      if (shouldAutoAtSchedule) {
        pre.scrollTop = pre.scrollHeight;
      }
    } finally {
      st.pendingFrag = null;
    }
  });
}

// 清理函数：由上层在 host 不再使用时调用
export function disposeHost(host: HTMLElement) {
  const st = hostStates.get(host);
  if (!st) {
    return;
  }
  // 取消未执行的 rAF
  if (st.rafId !== null) {
    cancelAnimationFrame(st.rafId);
    st.rafId = null;
  }
  // 丢弃 pending fragment 引用（允许 GC 回收其内部节点）
  st.pendingFrag = null;
  // 清除其它资源（如果有 event listeners、workers 等也在这里处理）
  // e.g. if (st.worker) st.worker.terminate();
  // 从 WeakMap 删除（可选，WeakMap 的条目在 key 不再可达时会自动回收）
  hostStates.delete(host);
}

/**
 * renderText
 * - 使用 autolinkRanges 得到全局的链接区间信息（start/end/url）。
 * - 在脱离文档的 parsed fragment（template.content）上按子节点边界切片，
 * - 仅创建必要的 Text / shallow-clone element / <a> 节点。
 * - 对跨子节点的链接，使用 pendingAnchor 把分片累计到同一个 <a>，直到 range 结束。
 * - 若检测到本次 data 是对上次 prevData 的 append，则只处理并 append 新增部分（增量路径）；
 * - 否则视为非追加（首次渲染或变更），进行全量重建，并尽量保持用户视口位置；
 * - 使用 rAF 批量追加以合并高频调用，避免频繁重排；
 * - 在追加时只有用户接近底部才自动滚动，否则保持当前位置以便用户查看历史输出。
 */
export function renderText(options: IRenderTextOptions): Promise<void> {
  const { host, sanitizer, source, mimeType } = options;
  const data = concatMultilineString(source);

  if (mimeType === 'application/vnd.jupyter.stderr') {
    host.setAttribute('data-mime-type', 'application/vnd.jupyter.stderr');
  }

  // 确保存在 <pre> 且为 host 的子元素（只在首次创建时 append）
  let pre = host.querySelector('pre');
  if (!pre) {
    pre = document.createElement('pre');
    host.appendChild(pre);
  } else if (pre.parentElement !== host) {
    // 如果 pre 被移动过，确保再次挂回 host（避免每次 render 都移动）
    host.appendChild(pre);
  }

  // 获取或初始化该 host 的状态
  let st = hostStates.get(host);

  if (!st) {
    st = {
      pre,
      prevData: '',
      pendingFrag: null,
      scheduled: false,
      rafId: null,
    };
    hostStates.set(host, st);
  } else {
    st.pre = pre;
  }

  // 若 data 为空，则立即清空并返回
  if (!data) {
    st.prevData = '';
    st.pendingFrag = null;
    st.scheduled = false;
    pre.innerHTML = '';
    host.classList.add('libro-text-render');
    return Promise.resolve(undefined);
  }

  // 判定是否为“追加”场景（本次 data 以 prevData 为前缀）
  const prevData = st.prevData || '';
  const isAppend = prevData.length > 0 && data.startsWith(prevData);

  if (isAppend) {
    const appendedData = data.slice(prevData.length);
    if (appendedData.length === 0) {
      // 无新增内容
      return Promise.resolve(undefined);
    }

    // 对新增内容做 ansi->span 转换并 sanitize（仅允许 span）
    const appendedContent = sanitizer.sanitize(ansiSpan(appendedData), {
      allowedTags: ['span'],
    });

    // 解析为脱离文档的 fragment（不会触发回流）
    const tpl = document.createElement('template');
    tpl.innerHTML = appendedContent;
    const appendedFrag = tpl.content;

    // 对 appendedFrag 的文本执行链接检测（基于 autolinkRanges）
    // 注意：此处使用 appendedFrag.textContent（仅针对新增片段）
    const appendedText = appendedFrag.textContent || '';
    const ranges = appendedText ? autolinkRanges(appendedText) : [];

    // 根据 ranges 构造要追加到 DOM 的 outFrag（可包含文本/浅 cloned spans/anchor）
    const outFrag = document.createDocumentFragment();
    let pendingAnchor: HTMLAnchorElement | null = null;
    let rangeIdx = 0;
    let globalOffset = 0;
    const childNodes = Array.from(appendedFrag.childNodes) as Node[];

    for (let ni = 0; ni < childNodes.length; ni++) {
      const node = childNodes[ni];
      const nodeText = node.textContent || '';
      const nodeLen = nodeText.length;
      if (nodeLen === 0) {
        continue;
      }

      let localPos = 0;
      while (localPos < nodeLen) {
        const absPos = globalOffset + localPos;
        // 将 rangeIdx 推到第一个可能与当前绝对位置相关的 range 上
        while (rangeIdx < ranges.length && ranges[rangeIdx].end <= absPos) {
          rangeIdx++;
        }
        const curRange = rangeIdx < ranges.length ? ranges[rangeIdx] : null;

        if (pendingAnchor) {
          // 当前有未完成的 anchor（链接跨节点）：尽量消费本节点的部分
          const take = Math.min(
            nodeLen - localPos,
            (curRange ? curRange.end : absPos) - absPos,
          );
          const piece = pieceFromNodeSlice(node, localPos, localPos + take);
          pendingAnchor.appendChild(piece);
          localPos += take;

          // 若到达当前 range 的结尾，则把 pendingAnchor 闭合并追加
          if (curRange && globalOffset + localPos >= curRange.end) {
            outFrag.appendChild(pendingAnchor);
            pendingAnchor = null;
            rangeIdx++;
          }
          continue;
        }

        // 若没有 pendingAnchor，判断当前片段是否是普通文本或链接起始处
        if (!curRange || curRange.start >= globalOffset + nodeLen) {
          // 本节点剩余部分没有链接，全部作为普通片段
          const piece = pieceFromNodeSlice(node, localPos, nodeLen);
          outFrag.appendChild(piece);
          localPos = nodeLen;
        } else if (curRange.start > absPos) {
          // 链接在当前节点后面一段位置开始：先把中间普通文本片段追加
          const until = Math.min(nodeLen, curRange.start - globalOffset);
          const piece = pieceFromNodeSlice(node, localPos, until);
          outFrag.appendChild(piece);
          localPos = until;
        } else {
          // 当前绝对位置位于链接范围内：创建 anchor 并消费该链接在当前节点的部分
          pendingAnchor = createAnchorForUrl(curRange.url);
          const take = Math.min(nodeLen - localPos, curRange.end - absPos);
          const piece = pieceFromNodeSlice(node, localPos, localPos + take);
          pendingAnchor.appendChild(piece);
          localPos += take;

          // 若链接在此节点内结束，立即关闭并追加
          if (globalOffset + localPos >= curRange.end) {
            outFrag.appendChild(pendingAnchor);
            pendingAnchor = null;
            rangeIdx++;
          }
        }
      } // end while localPos

      globalOffset += nodeLen;
    } // end for nodes

    if (pendingAnchor) {
      outFrag.appendChild(pendingAnchor);
      pendingAnchor = null;
    }

    // 将 outFrag 合并到 host 状态的 pendingFrag 中，以便批量追加
    if (!st.pendingFrag) {
      st.pendingFrag = document.createDocumentFragment();
    }
    Array.from(outFrag.childNodes).forEach((n) => st!.pendingFrag!.appendChild(n));

    // 更新 prevData 为最新的整个 data（提交此次 append）
    st.prevData = data;

    // 安排 rAF 批量追加（若已安排则无副作用）
    scheduleAppend(host);

    host.classList.add('libro-text-render');
    return Promise.resolve(undefined);
  }

  // ---------- 非追加（首次渲染或全量替换）路径 ----------
  // 记录替换前的滚动信息，以便替换后尽量保持视图位置
  const prevScrollTop = pre.scrollTop;
  const prevScrollHeight = pre.scrollHeight;

  // 对整个 data 做 ansi->span 转换并 sanitize（脱离文档）
  const content = sanitizer.sanitize(ansiSpan(data), {
    allowedTags: ['span'],
  });
  const tplFull = document.createElement('template');
  tplFull.innerHTML = content;
  const parsedFrag = tplFull.content;

  // 基于全文进行链接检测并构造 outFrag（逻辑与增量路径一致）
  const fullText = parsedFrag.textContent || '';
  const ranges = fullText ? autolinkRanges(fullText) : [];

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

  // 在下一帧中执行 DOM 替换以避免同步布局抖动
  requestAnimationFrame(() => {
    pre.innerHTML = '';
    pre.appendChild(outFrag);

    // 若用户在底部则滚到底，否则按高度差修正 scrollTop 保持视图不变
    if (isUserAtBottom(pre)) {
      pre.scrollTop = pre.scrollHeight;
    } else {
      const newScrollHeight = pre.scrollHeight;
      pre.scrollTop = Math.max(0, prevScrollTop + (newScrollHeight - prevScrollHeight));
    }
  });

  // 更新 prevData（记录当前已渲染的原始字符串）
  st.prevData = data;

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
