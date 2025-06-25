import * as React from 'react';

import type { Layout } from '../layout.js';

export interface BoxPanelContextProps {
  direction: Layout.direction;
  prefixCls?: string;
}

export const BoxPanelContext = React.createContext<BoxPanelContextProps>({
  direction: 'left-to-right',
});
