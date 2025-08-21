import type { JSONObject } from '@difizen/libro-common';
import { useInject } from '@difizen/libro-common/app';
import type { BaseOutputView } from '@difizen/libro-core';
import type { IRenderMimeRegistry } from '@difizen/libro-rendermime';
import { RenderMimeRegistry } from '@difizen/libro-rendermime';
import { useEffect, useRef } from 'react';
import type { FC } from 'react';

export const imageUrlMimeTypes = ['image/vnd.libro.image-url'];

/**
 * 图片 URL 渲染组件
 * 专门处理图片 URL 数据的渲染
 */
export const ImageUrlRender: FC<{ model: BaseOutputView }> = (props: {
  model: BaseOutputView;
}) => {
  const { model } = props;
  const renderImageRef = useRef<HTMLDivElement>(null);
  const defaultRenderMime = useInject<IRenderMimeRegistry>(RenderMimeRegistry);

  // 获取首选的图片 MIME 类型
  const mimeType = defaultRenderMime.preferredMimeType(model);

  useEffect(() => {
    if (mimeType && renderImageRef.current) {
      const imageData = model.data[mimeType];

      if (typeof imageData === 'string') {
        renderImageUrl({
          host: renderImageRef.current,
          source: imageData,
          width: (model.metadata['width'] ||
            (model.metadata[mimeType] as JSONObject)?.['width']) as unknown as
            | number
            | undefined,
          height: (model.metadata['height'] ||
            (model.metadata[mimeType] as JSONObject)?.['height']) as unknown as
            | number
            | undefined,
          needsBackground: model.metadata['needs_background'] as string | undefined,
          unconfined:
            model.metadata && (model.metadata['unconfined'] as boolean | undefined),
          mimeType: mimeType,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="libro-image-url-render-container">
      <div className="libro-image-url-render" ref={renderImageRef} />
    </div>
  );
};

/**
 * 渲染图片 URL 的选项接口
 */
interface IRenderImageUrlOptions {
  host: HTMLElement;
  mimeType: string;
  source: string;
  width?: number;
  height?: number;
  needsBackground?: string;
  unconfined?: boolean;
}

/**
 * 渲染图片 URL 到指定的宿主节点
 * 支持 HTTP/HTTPS URL 和相对路径
 */
function renderImageUrl(options: IRenderImageUrlOptions): Promise<void> {
  const { host, source, width, height, needsBackground, unconfined } = options;

  // 清空宿主节点内容
  host.textContent = '';

  // 创建图片元素
  const img = document.createElement('img');

  // 设置图片源
  // 如果是 URL（以 http 开头），直接使用
  // 否则按照原有逻辑处理（兼容 base64 数据）
  if (
    source.startsWith('http://') ||
    source.startsWith('https://') ||
    (!source.startsWith('data:') && source.includes('/'))
  ) {
    img.src = source;
  } else {
    // 兜底处理，按照原有的 base64 逻辑
    img.src = source.startsWith('data:')
      ? source
      : `data:${options.mimeType};base64,${source}`;
  }

  // 设置图片尺寸
  if (typeof height === 'number') {
    img.height = height;
  }
  if (typeof width === 'number') {
    img.width = width;
  }

  // 设置背景样式
  if (needsBackground === 'light') {
    img.classList.add('jp-needs-light-background');
  } else if (needsBackground === 'dark') {
    img.classList.add('jp-needs-dark-background');
  }

  // 设置无约束样式
  if (unconfined === true) {
    img.classList.add('jp-mod-unconfined');
  }

  // 添加错误处理
  img.onerror = () => {
    // 可以在这里添加占位符或错误提示
    const errorDiv = document.createElement('div');
    errorDiv.className = 'libro-image-url-error';
    errorDiv.textContent = `无法加载图片: ${source}`;
    errorDiv.style.cssText = `
      padding: 10px;
      border: 1px dashed #ccc;
      color: #666;
      text-align: center;
      background-color: #f9f9f9;
    `;
    host.replaceChild(errorDiv, img);
  };

  // 添加加载成功处理
  img.onload = () => {
    // 图片加载成功
  };

  // 将图片添加到宿主节点
  host.appendChild(img);

  return Promise.resolve(undefined);
}
