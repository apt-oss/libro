import { singleton } from '@difizen/libro-common/app';
import type { BaseOutputView } from '@difizen/libro-core';
import { RenderMimeContribution } from '@difizen/libro-rendermime';

import { ImageUrlRender, imageUrlMimeTypes } from './image-url-render.js';
import './index.less';

/**
 * 自定义图片 URL MIME 渲染器贡献类
 * 优先级高于默认图片渲染器，专门处理图片 URL 数据
 */
@singleton({ contrib: RenderMimeContribution })
export class LibroImageUrlMimeTypeContribution implements RenderMimeContribution {
  private imageUrlMimeTypes = imageUrlMimeTypes;

  /**
   * 判断是否能处理该模型数据
   * 返回值越高，优先级越高
   * 只有当数据是图片 URL 时才返回高优先级
   */
  canHandle = (model: BaseOutputView): number => {
    // 检查是否包含图片 MIME 类型
    for (const mimeType of this.imageUrlMimeTypes) {
      if (mimeType in model.data) {
        const data = model.data[mimeType];
        // 检查数据是否为字符串且看起来像 URL
        if (typeof data === 'string' && this.isImageUrl(data)) {
          return 200; // 高优先级，超过默认图片渲染器的 90
        }
      }
    }

    return 0; // 不处理非 URL 图片数据
  };

  /**
   * 检查字符串是否为图片 URL
   */
  private isImageUrl(data: string): boolean {
    // 检查是否以 http:// 或 https:// 开头
    if (data.startsWith('http://') || data.startsWith('https://')) {
      return true;
    }

    return false;
  }

  renderType = 'imageUrlRender';
  safe = true;
  mimeTypes = this.imageUrlMimeTypes;
  render = ImageUrlRender;
}
