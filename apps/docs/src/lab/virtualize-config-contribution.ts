import {
  ApplicationContribution,
  ConfigurationService,
} from '@difizen/libro-common/app';
import { inject, singleton } from '@difizen/libro-common/app';
import {
  VirtualizationEnabled,
  VirtualizationThresholdCellCount,
  VirtualizationThresholdFileSize,
} from '@difizen/libro-core';
import { LibroViewTracker } from '@difizen/libro-core';

@singleton({ contrib: ApplicationContribution })
export class VirtualizationConfigContribution implements ApplicationContribution {
  @inject(ConfigurationService) configurationService: ConfigurationService;
  @inject(LibroViewTracker) protected libroViewTracker: LibroViewTracker;

  async onStart() {
    this.configurationService.set(VirtualizationEnabled, false);
    this.configurationService.set(VirtualizationThresholdCellCount, 50);
    this.configurationService.set(VirtualizationThresholdFileSize, 100 * 1024);
  }
}
