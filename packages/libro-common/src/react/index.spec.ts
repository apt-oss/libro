import 'react';
import assert from 'assert';

import { Tabs, Dropdown, Menu, Menubar } from './index.js';

describe('react', () => {
  it('#react import', () => {
    assert(Tabs);
    assert(Dropdown);
    assert(Menu);
    assert(Menubar);
  });
});
