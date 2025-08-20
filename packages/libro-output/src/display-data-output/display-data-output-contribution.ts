import type { IOutput } from '@difizen/libro-common';
import { getBundleOptions } from '@difizen/libro-common';
import type { IOutputOptions } from '@difizen/libro-core';
import { OutputContribution } from '@difizen/libro-core';
import {
  inject,
  singleton,
  ViewManager,
  ConfigurationService,
} from '@difizen/mana-app';

import { DisplayDataOutputModel } from './display-data-output-model.js';
import {
  ImageProcessingEnabled,
  ImageProcessingRemoveOriginal,
  ImageProcessingSizeThreshold,
  ImageProcessingSupportedMimeTypes,
} from './display-data-output-setting.js';
import { ImageUploadService } from './image-upload-service.js';

interface ImageProcessingConfig {
  enabled: boolean;
  supportedMimeTypes: string[];
  removeOriginal: boolean;
  sizeThreshold: number;
}

const IMAGE_URL_MIME_TYPE = 'image/vnd.libro.image-url';

@singleton({ contrib: OutputContribution })
export class DisplayDataOutputContribution implements OutputContribution {
  @inject(ViewManager) viewManager: ViewManager;
  @inject(ConfigurationService) configurationService: ConfigurationService;
  @inject(ImageUploadService) imageUploadService: ImageUploadService;

  canHandle = (output: IOutput) => {
    if (
      output.output_type === 'display_data' ||
      output.output_type === 'execute_result'
    ) {
      return 100;
    }
    return 1;
  };

  async factory(output: IOutputOptions) {
    // 在构造模型之前预处理图片数据
    const processedOutput = await this.preprocessImageData(output);
    return this.viewManager.getOrCreateView(DisplayDataOutputModel, processedOutput);
  }

  private async preprocessImageData(options: IOutputOptions): Promise<IOutputOptions> {
    // 从配置服务中读取配置值
    const enabled =
      await this.configurationService.get<boolean>(ImageProcessingEnabled);
    const sizeThreshold = await this.configurationService.get<number>(
      ImageProcessingSizeThreshold,
    );
    const removeOriginal = await this.configurationService.get<boolean>(
      ImageProcessingRemoveOriginal,
    );
    const supportedMimeTypes = await this.configurationService.get<string[]>(
      ImageProcessingSupportedMimeTypes,
    );

    // 合并配置
    const imageConfig: ImageProcessingConfig = {
      enabled,
      sizeThreshold,
      removeOriginal,
      supportedMimeTypes,
    };

    // 如果未启用图片处理，直接返回原始选项
    if (!imageConfig.enabled) {
      return options;
    }

    // 检查是否有可用的上传函数
    const hasUploadFunction = this.imageUploadService.hasUploadFunction();

    if (!hasUploadFunction) {
      return options;
    }

    const { data } = getBundleOptions(options.output);

    if (!data || typeof data !== 'object') {
      return options;
    }

    try {
      const processedData = await this.processImageDataInBundle(data, imageConfig);

      // 创建新的输出选项，包含处理后的数据
      const processedOutput = {
        ...options.output,
        data: processedData,
      };

      return {
        ...options,
        output: processedOutput,
      };
    } catch (error) {
      console.warn('图片预处理失败，使用原始数据:', error);
      return options;
    }
  }

  private async processImageDataInBundle(
    data: IOutput,
    config: ImageProcessingConfig,
  ): Promise<IOutput> {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const processedData = { ...data };
    const { supportedMimeTypes, sizeThreshold, removeOriginal } = config;

    // 已经有 IMAGE_URL_MIME_TYPE 无需处理
    if (processedData[IMAGE_URL_MIME_TYPE]) {
      return processedData;
    }

    for (const [mimeType, content] of Object.entries(data)) {
      if (supportedMimeTypes.includes(mimeType) && typeof content === 'string') {
        try {
          // 检查是否超过阈值
          if (content.length > sizeThreshold) {
            const base64Data = content.startsWith('data:')
              ? content.split(',')[1]
              : content;

            // 上传图片并替换为 URL
            const uploadedUrl = await this.imageUploadService.uploadImage(
              base64Data,
              mimeType,
            );

            processedData[IMAGE_URL_MIME_TYPE] = uploadedUrl;

            if (removeOriginal) {
              delete processedData[mimeType];
            }
          }
        } catch (error) {
          console.warn(`上传图片失败 (${mimeType}):`, error);
          // 保持原始数据
        }
      }
    }

    return processedData;
  }
}
