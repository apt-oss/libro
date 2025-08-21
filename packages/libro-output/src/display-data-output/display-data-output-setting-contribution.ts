import { singleton, ConfigurationContribution } from '@difizen/libro-common/app';

import {
  ImageProcessingEnabled,
  ImageProcessingSizeThreshold,
  ImageProcessingRemoveOriginal,
  ImageProcessingSupportedMimeTypes,
} from './display-data-output-setting.js';

@singleton({ contrib: ConfigurationContribution })
export class DisplayDataOutputSettingContribution implements ConfigurationContribution {
  registerConfigurations() {
    return [
      ImageProcessingEnabled,
      ImageProcessingSizeThreshold,
      ImageProcessingRemoveOriginal,
      ImageProcessingSupportedMimeTypes,
    ];
  }
}
