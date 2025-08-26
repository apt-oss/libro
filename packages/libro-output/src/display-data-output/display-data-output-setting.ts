import type { ConfigurationNode } from '@difizen/mana-app';
import { l10n } from '@difizen/mana-l10n';

// 图片处理配置项
export const ImageProcessingEnabled: ConfigurationNode<boolean> = {
  id: 'libro.output.imageProcessing.enabled',
  description: l10n.t('是否启用图片处理功能'),
  title: l10n.t('启用图片处理'),
  type: 'checkbox',
  defaultValue: true,
  schema: {
    type: 'boolean',
  },
};

export const ImageProcessingSizeThreshold: ConfigurationNode<number> = {
  id: 'libro.output.imageProcessing.sizeThreshold',
  description: l10n.t('图片处理的大小阈值（字符数）'),
  title: l10n.t('图片大小阈值'),
  type: 'inputnumber',
  defaultValue: 1000,
  schema: {
    type: 'number',
    minimum: 0,
  },
};

export const ImageProcessingRemoveOriginal: ConfigurationNode<boolean> = {
  id: 'libro.output.imageProcessing.removeOriginal',
  description: l10n.t('上传图片后是否移除原始base64数据'),
  title: l10n.t('移除原始数据'),
  type: 'checkbox',
  defaultValue: true,
  schema: {
    type: 'boolean',
  },
};

export const ImageProcessingSupportedMimeTypes: ConfigurationNode<string[]> = {
  id: 'libro.output.imageProcessing.supportedMimeTypes',
  description: l10n.t('支持处理的图片MIME类型'),
  title: l10n.t('支持的图片类型'),
  type: 'select',
  defaultValue: ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml'],
  schema: {
    type: 'array',
    items: {
      type: 'string',
    },
  },
};
