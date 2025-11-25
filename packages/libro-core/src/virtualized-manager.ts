import { transient, prop, inject } from '@difizen/libro-common/app';
import { ConfigurationService } from '@difizen/libro-common/app';

import type { NotebookModel } from './libro-protocol.js';
import { VirtualizedManagerOption } from './libro-protocol.js';
import {
  VirtualizationEnabled,
  VirtualizationThresholdFileSize,
  VirtualizationThresholdCellCount,
} from './libro-setting.js';

export interface IVirtualizedManager {
  openVirtualized: (length: number, size?: number, path?: string) => Promise<boolean>;
  isVirtualized: boolean;
}

@transient()
export class VirtualizedManager implements IVirtualizedManager {
  /**
   * 因为进行isVirtualized判断过后才会渲染list
   * 所以它用于滚动到某个cell的判断依据是没有问题的。
   */
  @prop()
  isVirtualized = false;

  libroModel: NotebookModel;
  protected configurationService: ConfigurationService;

  constructor(
    @inject(VirtualizedManagerOption)
    virtualizedManagerOption: VirtualizedManagerOption,
    @inject(ConfigurationService) configurationService: ConfigurationService,
  ) {
    this.libroModel = virtualizedManagerOption.libroModel;
    this.configurationService = configurationService;
  }

  /**
   *
   * @param length cell个数
   * @param size undefined 或者 number，单位为 byte
   * @returns 是否使用虚拟滚动
   */
  openVirtualized = async (length: number, size?: number, path?: string) => {
    // 获取配置项
    const virtualizationEnabled =
      await this.configurationService.get(VirtualizationEnabled);
    const virtualizationThresholdFileSize = await this.configurationService.get(
      VirtualizationThresholdFileSize,
    );
    const virtualizationThresholdCellCount = await this.configurationService.get(
      VirtualizationThresholdCellCount,
    );

    if (!virtualizationEnabled) {
      this.isVirtualized = false;
      return false;
    }

    // 如果启用虚拟化，根据阈值判断是否使用虚拟滚动
    if (
      length >= virtualizationThresholdCellCount ||
      (size && size >= virtualizationThresholdFileSize)
    ) {
      this.isVirtualized = true;
      return true;
    }

    this.isVirtualized = false;
    return false;
  };
}
