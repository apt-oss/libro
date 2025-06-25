import 'react';
import assert from 'assert';

import {
  CardTabView,
  SideTabView,
  FileTreeView,
  ToolbarRender,
  MenuRender,
} from './index.js';

describe('app', () => {
  it('#app import', () => {
    assert(CardTabView);
    assert(SideTabView);
    assert(FileTreeView);
    assert(ToolbarRender);
    assert(MenuRender);
  });
});
