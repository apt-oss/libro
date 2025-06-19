import { singleton, ConfigurationContribution } from '@difizen/libro-common/app';

import {
  AutoInsertWhenNoCell,
  CellSideToolbarVisible,
  CellTopToolbarSetting,
  CollapserClickActive,
  EnterEditModeWhenAddCell,
  HeaderToolbarVisible,
  LargeOutputDisplay,
  MultiSelectionWhenShiftClick,
  RightContentFixed,
} from './libro-setting.js';

@singleton({ contrib: ConfigurationContribution })
export class LibroSettingContribution implements ConfigurationContribution {
  registerConfigurations() {
    return [
      HeaderToolbarVisible,
      CellTopToolbarSetting,
      CellSideToolbarVisible,
      AutoInsertWhenNoCell,
      EnterEditModeWhenAddCell,
      CollapserClickActive,
      MultiSelectionWhenShiftClick,
      RightContentFixed,
      LargeOutputDisplay,
    ];
  }
}
