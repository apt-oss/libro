import {
  ApplicationContribution,
  ConfigurationService,
} from '@difizen/libro-common/app';
import { inject, singleton } from '@difizen/libro-common/app';
import { ImageUploadService, ImageProcessingEnabled } from '@difizen/libro-output';

@singleton({ contrib: ApplicationContribution })
export class ImageUploadTestService implements ApplicationContribution {
  @inject(ImageUploadService) imageUploadService: ImageUploadService;
  @inject(ConfigurationService) configurationService: ConfigurationService;

  async onStart() {
    // 测试修改默认配置值
    this.configurationService.set(ImageProcessingEnabled, false); // 禁用图片处理
    // 配置测试用的图片上传函数
    this.imageUploadService.setUploadFunction(
      async (base64Data: string, mimeType: string) => {
        // 模拟上传过程
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // 返回模拟的上传URL
        return 'https://intranetproxy.alipay.com/skylark/lark/0/2025/png/25157115/1755507065413-d584a1f2-dd93-456c-b6be-4c4e7a84a311.png';
      },
    );

    // 配置回调函数
    this.imageUploadService.setCallbacks({
      onUploadSuccess: (originalData: string, uploadedUrl: string) => {
        // 上传成功后的处理
      },
      onUploadError: (error: Error, originalData: string) => {
        // 上传失败后的处理
      },
    });
  }
}
