import 'react';
import assert from 'assert';

import { Container } from '../../../ioc/index.js';
import { ThemeService } from '../theme-service.js';

import { AntdColorContribution } from './antd-color-contribution.js';
import { ColorRegistry } from './color-registry.js';
import { DefaultColorContribution } from './default-color-contribution.js';

describe('theme color', () => {
  it('#antd color', () => {
    const ctrb = new AntdColorContribution();
    const registry = new ColorRegistry();
    ctrb.registerColors(registry);
    const ids = [...registry.getDefinitionIds()];
    const filtered = ids.filter((item) => item.startsWith('ant'));
    assert(filtered.length > 100);
  });

  it('#get color', () => {
    const container = new Container();
    container.register(DefaultColorContribution);
    container.register(ColorRegistry);
    container.register(ThemeService);
    const ctrb = container.get(DefaultColorContribution);
    const registry = container.get(ColorRegistry);
    ctrb.registerColors(registry);
    const color = registry.getCurrentColor('color.bg.container');
    assert(color === '#ffffff');
  });
});
