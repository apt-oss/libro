import 'react';
import assert from 'assert';

import { Container } from '../../ioc/index.js';
import { ApplicationModule } from '../index.js';

import { ThemeModule, ThemeService } from './index.js';

describe('theme', () => {
  it('#theme module load', () => {
    const container = new Container();
    container.load(ApplicationModule);
    container.load(ThemeModule);
    assert(container.get(ThemeService));
  });
});
