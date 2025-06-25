import { ManaModule } from '../module/index.js';

import { AntdVariableContribution } from './basic/antd-variable-contribution.js';
import { DefaultVariableContribution } from './basic/default-variable-contribution.js';
import { VariableContribution } from './basic/variable-protocol.js';
import { VariableRegistry } from './basic/variable-registry.js';
import { AntdColorContribution } from './color/antd-color-contribution.js';
import { ColorContribution } from './color/color-protocol.js';
import { ColorRegistry } from './color/color-registry.js';
import { DefaultColorContribution } from './color/default-color-contribution.js';
import { ThemeApplication } from './theme-app.js';
import { ThemeService } from './theme-service.js';

export * from './basic/index.js';
export * from './color/index.js';
export * from './theme-service.js';
export * from './protocol.js';

export const ThemeModule = ManaModule.create().register({
  token: ThemeService,
  useDynamic: () => {
    return ThemeService.get();
  },
});

export const ThemeVariableModule = ManaModule.create()
  .contribution(VariableContribution, ColorContribution)
  .register(
    VariableRegistry,
    ColorRegistry,
    DefaultColorContribution,
    ThemeApplication,
    DefaultVariableContribution,
    AntdColorContribution,
    AntdVariableContribution,
  )
  .dependOn(ThemeModule);
