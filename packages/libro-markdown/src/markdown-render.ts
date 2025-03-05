import {
  ConfigurationService,
  inject,
  postConstruct,
  singleton,
} from '@difizen/mana-app';
import latexPlugin from '@traptitech/markdown-it-katex';
import MarkdownIt from 'markdown-it';
import sanitizeHtml from 'sanitize-html';

import { libroAnchor, linkInsideHeader, slugify } from './anchor.js';
import { LibroMarkdownConfiguration } from './config.js';
import type { MarkdownRenderOption } from './markdown-protocol.js';
import { MarkdownParser } from './markdown-protocol.js';
import 'katex/dist/katex.min.css';

@singleton({ token: MarkdownParser })
export class MarkdownRender implements MarkdownParser {
  protected mkt: MarkdownIt;
  slugify = slugify;
  enablePermalink = false;
  @inject(ConfigurationService) protected configurationService: ConfigurationService;

  @postConstruct()
  init() {
    this.mkt = new MarkdownIt({
      html: true,
      linkify: true,
    });
    this.mkt.linkify.set({ fuzzyLink: false });
    this.mkt.use(libroAnchor, {
      permalinkOptions: { class: 'libro-InternalAnchorLink', space: false },
      permalink: this.enablePermalink ? linkInsideHeader : false,
      slugify: this.slugify,
    });

    this.mkt.use(latexPlugin);

    this.configurationService
      .get(LibroMarkdownConfiguration.TargetToBlank)
      .then((value) => {
        if (value) {
          this.mkt.use((md) => {
            const defaultRender =
              md.renderer.rules['link_open'] ||
              function (tokens, idx, options, env, self) {
                return self.renderToken(tokens, idx, options);
              };

            md.renderer.rules['link_open'] = function (
              tokens,
              idx,
              options,
              env,
              self,
            ) {
              // 获取当前的token
              const token = tokens[idx];
              // 检查是否已有target属性
              const targetIndex = token.attrIndex('target');

              if (targetIndex < 0) {
                // 如果没有target属性，添加target="_blank"
                token.attrPush(['target', '_blank']);
              } else {
                // 如果已有target属性，修改为target="_blank"
                if (token.attrs !== null) {
                  token.attrs[targetIndex][1] = '_blank';
                }
              }

              // 调用默认的渲染函数
              return defaultRender(tokens, idx, options, env, self);
            };
          });
        }
        return;
      })
      .catch(() => {
        //
      });
  }

  // 使用 sanitize-html 清理 HTML
  private sanitizeHTML(html: string): string {
    return sanitizeHtml(html, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat([
        'a',
        'abbr',
        'acronym',
        'b',
        'blockquote',
        'br',
        'code',
        'col',
        'colgroup',
        'dd',
        'del',
        'div',
        'em',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'hr',
        'i',
        'img',
        'li',
        'ol',
        'p',
        'pre',
        'q',
        's',
        'small',
        'strong',
        'sub',
        'sup',
        'table',
        'tbody',
        'td',
        'th',
        'tr',
        'tt',
        'u',
        'ul',
        'kbd',
        'var',
      ]), // 允许的标签
      allowedAttributes: {
        // 允许的属性
        a: ['href', 'title'],
        img: ['src', 'alt'],
      },
    });
  }

  render(markdownText: string, options?: MarkdownRenderOption): string {
    const unsanitizedRenderedMarkdown = this.mkt.render(markdownText, options);
    return this.sanitizeHTML(unsanitizedRenderedMarkdown);
  }
}
