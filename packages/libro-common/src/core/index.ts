import { ApplicationModule } from './application/index.js';
import { CommandModule } from './command/index.js';
import { CommonModule } from './common/index.js';
import { ConfigurationModule } from './configuration/index.js';
import { ContextModule } from './context/index.js';
import { KeybindModule } from './keybinding/index.js';
import { CoreMenuModule } from './menu/index.js';
import { ManaModule } from './module/index.js';
import { SelectionModule } from './selection/index.js';
import { ThemeVariableModule } from './theme/index.js';
import { CoreToolbarModule } from './toolbar/index.js';
import { ViewModule } from './view/index.js';

export * from './components/index.js';
export * from './application/index.js';
export * from './browser.js';
export * from './command/index.js';
export * from './menu/index.js';
export * from './common/index.js';
export * from './context/index.js';
export * from './module/index.js';
export * from './view/index.js';
export * from './selection/index.js';
export * from './theme/index.js';
export * from './toolbar/index.js';
export * from './keybinding/index.js';
export * from './keyboard/index.js';
export * from './configuration/index.js';
export * from './utils/index.js';

export const ManaPreset = ManaModule.create().dependOn(
  CommonModule,
  ApplicationModule,
  ContextModule,
  CommandModule,
  CoreMenuModule,
  CoreToolbarModule,
  SelectionModule,
  ThemeVariableModule,
  ViewModule,
  KeybindModule,
  ConfigurationModule,
);

export const ManaModules = {
  Common: CommonModule,
  Application: ApplicationModule,
  Command: CommandModule,
  Menu: CoreMenuModule,
  View: ViewModule,
  Selection: SelectionModule,
  Toolbar: CoreToolbarModule,
  ThemeVariable: ThemeVariableModule,
  Context: ContextModule,
  Keybind: KeybindModule,
  Configuration: ConfigurationModule,
};
