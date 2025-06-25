import { Disposable, DisposableCollection } from '../../common/index.js';
import type { Contribution } from '../../ioc/index.js';
import { contrib, inject, singleton } from '../../ioc/index.js';
import type { Application } from '../application/index.js';
import { ApplicationContribution } from '../application/index.js';

import { VariableContribution } from './basic/variable-protocol.js';
import { VariableRegistry } from './basic/variable-registry.js';
import { ColorContribution } from './color/color-protocol.js';
import { ColorRegistry } from './color/color-registry.js';
import type { CssVariable } from './protocol.js';
import { ThemeService } from './theme-service.js';

@singleton({ contrib: ApplicationContribution })
export class ThemeApplication implements ApplicationContribution {
  protected toUpdate = new DisposableCollection(); // dispose action when update
  @inject(ThemeService) protected readonly themeService: ThemeService;
  @inject(VariableRegistry) protected readonly variables: VariableRegistry;
  @contrib(VariableContribution)
  protected readonly variableContributions: Contribution.Provider<VariableContribution>;
  @inject(ColorRegistry) protected readonly colors: ColorRegistry;

  @contrib(ColorContribution)
  protected readonly colorContributions: Contribution.Provider<ColorContribution>;

  protected application: Application;

  onStart(application: Application): void {
    this.application = application;
    this.application.onHostChanged(() => this.update());
    for (const contribution of this.variableContributions.getContributions()) {
      contribution.registerVariables(this.variables);
    }
    for (const contribution of this.colorContributions.getContributions()) {
      contribution.registerColors(this.colors);
    }
    this.themeService.onDidColorThemeChange(() => this.update());
    this.variables.onDidChange(() => this.update());
    this.themeService.onDidColorThemeChange(() => this.update());
    this.colors.onDidChange(() => this.update());
    this.update();
  }

  protected setCssVariable(cv: CssVariable) {
    const host = this.application.host;
    if (document) {
      document.body.style.setProperty(cv.name, cv.value);
    }
    if (host) {
      host.style.setProperty(cv.name, cv.value);
    }
  }

  protected setThemeClassName() {
    const themeClass = this.themeService.themeClassName;
    if (document) {
      document.body.classList.add(themeClass);
      this.toUpdate.push(
        Disposable.create(() => document.body.classList.remove(themeClass)),
      );
    }
    const host = this.application.host;
    if (host) {
      host.classList.add(themeClass);
      this.toUpdate.push(Disposable.create(() => host.classList.remove(themeClass)));
    }
  }
  protected update = (): void => {
    this.toUpdate.dispose();
    this.toUpdate = new DisposableCollection();
    this.setThemeClassName();
    for (const cv of [
      ...this.colors.getCurrentCssVariables(),
      ...this.variables.getCurrentCssVariables(),
    ]) {
      this.setCssVariable(cv);
    }
  };
}
