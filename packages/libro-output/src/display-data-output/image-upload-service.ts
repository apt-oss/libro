import { singleton } from '@difizen/libro-common/app';

export interface ImageUploadFunction {
  (base64Data: string, mimeType: string): Promise<string>;
}

export interface ImageUploadCallbacks {
  onUploadSuccess?: (originalBase64: string, uploadedUrl: string) => void;
  onUploadError?: (error: Error, base64Data: string) => void;
}

@singleton()
export class ImageUploadService {
  private uploadFunction?: ImageUploadFunction;
  private callbacks: ImageUploadCallbacks = {};

  /**
   * 设置图片上传函数
   */
  setUploadFunction(uploadFunction: ImageUploadFunction): void {
    this.uploadFunction = uploadFunction;
  }

  /**
   * 设置上传回调函数
   */
  setCallbacks(callbacks: ImageUploadCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * 获取图片上传函数
   */
  getUploadFunction(): ImageUploadFunction | undefined {
    return this.uploadFunction;
  }

  /**
   * 获取上传回调函数
   */
  getCallbacks(): ImageUploadCallbacks {
    return this.callbacks;
  }

  /**
   * 上传图片
   */
  async uploadImage(base64Data: string, mimeType: string): Promise<string> {
    if (!this.uploadFunction) {
      throw new Error('Upload function not configured');
    }

    try {
      const uploadedUrl = await this.uploadFunction(base64Data, mimeType);
      this.callbacks.onUploadSuccess?.(base64Data, uploadedUrl);
      return uploadedUrl;
    } catch (error) {
      this.callbacks.onUploadError?.(error as Error, base64Data);
      throw error;
    }
  }

  /**
   * 检查是否已配置上传函数
   */
  hasUploadFunction(): boolean {
    return !!this.uploadFunction;
  }
}
