import { singleton } from '../../../ioc/index.js';

import { ColorContribution } from './color-protocol.js';
import type { ColorRegistry } from './color-registry.js';
import { Color } from './color-registry.js';

@singleton({ contrib: ColorContribution })
export class DefaultColorContribution implements ColorContribution {
  registerColors(colors: ColorRegistry): void {
    colors.register(
      // #region antd variable
      {
        id: 'text.color',
        defaults: {
          dark: Color.rgba(255, 255, 255, 0.85),
          light: Color.rgba(0, 0, 0, 0.88),
        },
        description: '',
      },
      // {
      //   id: 'color.text.disabled',
      //   defaults: {
      //     dark: Color.rgba(255, 255, 255, 0.85),
      //     light: Color.rgba(0, 0, 0, 0.25),
      //   },
      //   description: '',
      // },
      // {
      //   id: 'color.bg.container.disabled',
      //   defaults: {
      //     dark: Color.rgba(255, 255, 255, 0.85),
      //     light: Color.rgba(0, 0, 0, 0.25),
      //   },
      //   description: '',
      // },

      {
        id: 'text.secondary',
        defaults: {
          dark: Color.rgba(255, 255, 255, 0.65),
          light: Color.rgba(0, 0, 0, 0.65),
        },
        description: '',
      },
      {
        id: 'text.tertiary',
        defaults: {
          dark: Color.rgba(255, 255, 255, 0.45),
          light: Color.rgba(0, 0, 0, 0.45),
        },
        description: '',
      },
      {
        id: 'text.quaternary',
        defaults: {
          dark: Color.rgba(255, 255, 255, 0.25),
          light: Color.rgba(0, 0, 0, 0.25),
        },
        description: '',
      },
      {
        id: 'menu.active.background',
        defaults: {
          dark: Color.transparent('primary.color.hover', 0.5),
          light: Color.transparent('primary.color.hover', 0.7),
        },
        description:
          'Inactive tab foreground color in an active group. Tabs are the containers for editors in the editor area. Multiple tabs can be opened in one editor group. There can be multiple editor groups.',
      },
      {
        id: 'color.border',
        defaults: { dark: '#424242', light: '#d9d9d9' },
        description: '',
      },
      {
        id: 'color.border.secondary',
        defaults: { dark: '#303030', light: '#f0f0f0' },
        description: '',
      },
      {
        id: 'color.fill',
        defaults: {
          dark: Color.rgba(255, 255, 255, 0.18),
          light: Color.rgba(0, 0, 0, 0.15),
        },
        description: '',
      },
      {
        id: 'color.fill.secondary',
        defaults: {
          dark: Color.rgba(255, 255, 255, 0.12),
          light: Color.rgba(0, 0, 0, 0.06),
        },
        description: '',
      },
      {
        id: 'color.fill.tertiary',
        defaults: {
          dark: Color.rgba(255, 255, 255, 0.08),
          light: Color.rgba(0, 0, 0, 0.04),
        },
        description: '',
      },
      {
        id: 'color.fill.quaternary',
        defaults: {
          dark: Color.rgba(255, 255, 255, 0.04),
          light: Color.rgba(0, 0, 0, 0.02),
        },
        description: '',
      },
      {
        id: 'color.bg.container',
        defaults: { dark: '#141414', light: '#ffffff' },
        description: '',
      },
      {
        id: 'color.bg.elevated',
        defaults: { dark: '#1f1f1f', light: '#ffffff' },
        description: '',
      },
      {
        id: 'color.bg.layout',
        defaults: { dark: '#000000', light: '#f5f5f5' },
        description: '',
      },
      {
        id: 'color.bg.spotlight',
        defaults: { dark: '#424242', light: Color.rgba(0, 0, 0, 0.85) },
        description: '',
      },
      {
        id: 'color.bg.spotlight',
        defaults: { dark: Color.rgba(0, 0, 0, 0.45), light: Color.rgba(0, 0, 0, 0.45) },
        description: '',
      },
      {
        id: 'primary.color',
        defaults: { dark: '#177ddc', light: '#1890ff' },
        description: '',
      },
      {
        id: 'primary.color.hover',
        defaults: { dark: '#3c9be8', light: '#40a9ff' },
        description: '',
      },
      {
        id: 'primary.color.active',
        defaults: { dark: '#095cb5', light: '#096dd9' },
        description: '',
      },
      {
        id: 'primary.color.outline',
        defaults: {
          dark: Color.rgba(23, 125, 220, 0.2),
          light: Color.rgba(24, 144, 255, 0.2),
        },
        description: '',
      },
      {
        id: 'primary.1',
        defaults: { dark: '#e6f7ff', light: '#e6f7ff' },
        description: '',
      },
      {
        id: 'primary.2',
        defaults: { dark: '#bde8ff', light: '#bae7ff' },
        description: '',
      },
      {
        id: 'primary.3',
        defaults: { dark: '#94d6ff', light: '#91d5ff' },
        description: '',
      },
      {
        id: 'primary.4',
        defaults: { dark: '#67baf5', light: '#69c0ff' },
        description: '',
      },
      {
        id: 'primary.5',
        defaults: { dark: '#3c9be8', light: '#40a9ff' },
        description: '',
      },
      {
        id: 'primary.6',
        defaults: { dark: '#177ddc', light: '#1890ff' },
        description: '',
      },
      {
        id: 'primary.7',
        defaults: { dark: '#095cb5', light: '#096dd9' },
        description: '',
      },
      {
        id: 'success.color',
        defaults: { dark: '#49aa19', light: '#52c41a' },
        description: '',
      },
      {
        id: 'success.color.hover',
        defaults: { dark: '#67b839', light: '#73d13d' },
        description: '',
      },
      {
        id: 'success.color.active',
        defaults: { dark: '#31850d', light: '#389e0d' },
        description: '',
      },
      {
        id: 'success.color.outline',
        defaults: {
          dark: Color.rgba(73, 170, 25, 0.2),
          light: Color.rgba(82, 196, 26, 0.2),
        },
        description: '',
      },
      {
        id: 'error.color',
        defaults: { dark: '#a61d24', light: '#ff4d4f' },
        description: '',
      },
      {
        id: 'error.color.hover',
        defaults: { dark: '#b33b3d', light: '#ff7875' },
        description: '',
      },
      {
        id: 'error.color.active',
        defaults: { dark: '#800f19', light: '#d9363e' },
        description: '',
      },
      {
        id: 'error.color.outline',
        defaults: {
          dark: Color.rgba(166, 29, 36, 0.2),
          light: Color.rgba(255, 77, 79, 0.2),
        },
        description: '',
      },
      {
        id: 'warning.color',
        defaults: { dark: '#d89614', light: '#faad14' },
        description: '',
      },
      {
        id: 'warning.color.hover',
        defaults: { dark: '#e6b239', light: '#ffc53d' },
        description: '',
      },
      {
        id: 'warning.color.active',
        defaults: { dark: '#b37407', light: '#d48806' },
        description: '',
      },
      {
        id: 'warning.color.outline',
        defaults: {
          dark: Color.rgba(216, 150, 20, 0.2),
          light: Color.rgba(250, 173, 20, 0.2),
        },
        description: '',
      },
      {
        id: 'info.color',
        defaults: { dark: '#177ddc', light: '#1890ff' },
        description: '',
      },
      // #endregion

      // #region basic tag
      {
        id: 'textLink.foreground',
        defaults: { dark: 'primary.color', light: 'primary.color' },
        description: 'foreground color of tag a.',
      },
      {
        id: 'textLink.activeForeground',
        defaults: { dark: 'primary.color.hover', light: 'primary.color.hover' },
        description: 'A foreground when hovering over items using the mouse.',
      },
      {
        id: 'selection.background',
        defaults: { dark: 'primary.color', light: 'primary.color' },
        description:
          'Overall border color for focused elements. This color is only used if not overridden by a component.',
      },
      // #endregion

      // #region tabs
      {
        id: 'activityBar.background',
        defaults: {
          dark: '#35393d',
          light: '#ececec',
        },
        description:
          'Activity bar background color. The activity bar is showing on the far left or right and allows to switch between views of the side bar.',
      },
      {
        id: 'activityBar.foreground',
        defaults: {
          dark: Color.rgba(255, 255, 255, 0.65),
          light: Color.rgba(0, 0, 0, 0.65),
        },
        description:
          'Activity bar item foreground color when it is active. The activity bar is showing on the far left or right and allows to switch between views of the side bar.',
      },
      {
        id: 'activityBar.border',
        defaults: {
          dark: '#252729',
          light: '#e0e0e0',
        },
        description:
          'Activity bar border color separating to the side bar. The activity bar is showing on the far left or right and allows to switch between views of the side bar.',
      },
      {
        id: 'activityBar.inactiveForeground',
        defaults: {
          dark: Color.rgba(255, 255, 255, 0.4),
          light: Color.rgba(0, 0, 0, 0.4),
        },
        description:
          'Activity bar item foreground color when it is inactive. The activity bar is showing on the far left or right and allows to switch between views of the side bar.',
      },
      {
        id: 'sideBar.background',
        defaults: {
          dark: '#252526',
          light: '#f3f3f3',
        },
        description:
          'Side bar background color. The side bar is the container for views like explorer and search.',
      },
      {
        id: 'tab.activeBackground',
        defaults: {
          dark: 'editor.background',
          light: 'editor.background',
          hc: 'editor.background',
        },
        description:
          'Active tab background color. Tabs are the containers for editors in the editor area. Multiple tabs can be opened in one editor group. There can be multiple editor groups.',
      },
      {
        id: 'tab.inactiveBackground',
        defaults: {
          dark: '#2D2D2D',
          light: '#ECECEC',
        },
        description:
          'Inactive tab background color. Tabs are the containers for editors in the editor area. Multiple tabs can be opened in one editor group. There can be multiple editor groups.',
      },
      {
        id: 'tab.inactive.background',
        defaults: {
          dark: '#2D2D2D',
          light: '#ECECEC',
        },
        description:
          'Inactive tab background color. Tabs are the containers for editors in the editor area. Multiple tabs can be opened in one editor group. There can be multiple editor groups.',
      },
      {
        id: 'tab.activeForeground',
        defaults: {
          dark: Color.white,
          light: '#333333',
        },
        description:
          'Active tab foreground color in an active group. Tabs are the containers for editors in the editor area. Multiple tabs can be opened in one editor group. There can be multiple editor groups.',
      },
      {
        id: 'tab.active.foreground',
        defaults: {
          dark: Color.white,
          light: '#333333',
        },
        description:
          'Active tab foreground color in an active group. Tabs are the containers for editors in the editor area. Multiple tabs can be opened in one editor group. There can be multiple editor groups.',
      },
      {
        id: 'tab.inactiveForeground',
        defaults: {
          dark: Color.transparent('tab.activeForeground', 0.5),
          light: Color.transparent('tab.activeForeground', 0.7),
        },
        description:
          'Inactive tab foreground color in an active group. Tabs are the containers for editors in the editor area. Multiple tabs can be opened in one editor group. There can be multiple editor groups.',
      },
      {
        id: 'tab.border',
        defaults: {
          dark: '#252526',
          light: '#F3F3F3',
        },
        description:
          'Border to separate tabs from each other. Tabs are the containers for editors in the editor area. Multiple tabs can be opened in one editor group. There can be multiple editor groups.',
      },
      {
        id: 'tab.activeBorder',
        defaults: {
          dark: '#007fd4',
          light: Color.rgba(0, 144, 241, 0.7),
        },
        description:
          'Border to separate tabs from each other. Tabs are the containers for editors in the editor area. Multiple tabs can be opened in one editor group. There can be multiple editor groups.',
      },
      // #endregion

      // #region list/tree
      {
        id: 'foreground',
        defaults: {
          dark: Color.rgba(255, 255, 255, 0.85),
          light: Color.rgba(0, 0, 0, 0.85),
        },
        description: 'foreground color of body.',
      },
      {
        id: 'list.hoverForeground',
        description: 'List/Tree foreground when hovering over items using the mouse.',
      },
      {
        id: 'list.hoverBackground',
        defaults: { dark: Color.rgba(255, 255, 255, 0.08), light: '#f5f5f5' },
        description: 'List/Tree background when hovering over items using the mouse.',
      },
      {
        id: 'list.hover.background',
        defaults: { dark: Color.rgba(255, 255, 255, 0.08), light: '#f5f5f5' },
        description: 'List/Tree background when hovering over items using the mouse.',
      },
      {
        id: 'list.activeSelectionForeground',
        defaults: { dark: '#FFF', light: '#FFF' },
        description:
          'List/Tree foreground color for the selected item when the list/tree is active. An active list/tree has keyboard focus, an inactive does not.',
      },
      {
        id: 'list.active.selection.foreground',
        defaults: { dark: '#fff', light: '#FFF' },
        description:
          'List/Tree foreground color for the selected item when the list/tree is active. An active list/tree has keyboard focus, an inactive does not.',
      },
      {
        id: 'list.activeSelectionBackground',
        defaults: { dark: 'primary.color', light: 'primary.color' },
        description:
          'List/Tree background color for the selected item when the list/tree is active. An active list/tree has keyboard focus, an inactive does not.',
      },
      {
        id: 'list.inactiveSelectionForeground',
        description:
          'List/Tree foreground color for the selected item when the list/tree is inactive. An active list/tree has keyboard focus, an inactive does not.',
      },
      {
        id: 'list.inactiveSelectionBackground',
        defaults: { dark: '#37373D', light: '#E4E6F1' },
        description:
          'List/Tree background color for the selected item when the list/tree is inactive. An active list/tree has keyboard focus, an inactive does not.',
      },
      {
        id: 'tree.indentGuidesStroke',
        defaults: { dark: '#585858', light: '#a9a9a9' },
        description: 'Tree stroke color for the indentation guides.',
      },
      {
        id: 'tree.inactiveIndentGuidesStroke',
        defaults: {
          dark: Color.transparent('tree.indentGuidesStroke', 0.4),
          light: Color.transparent('tree.indentGuidesStroke', 0.4),
          hc: Color.transparent('tree.indentGuidesStroke', 0.4),
        },
        description: 'Tree stroke color for the inactive indentation guides.',
      },
      // #endregion

      // #region editor
      {
        id: 'editor.background',
        defaults: { dark: '#000', light: '#FFF' },
        description: 'background color of body.',
      },
      // #endregion

      // #region menu
      {
        id: 'menubar.background',
        defaults: { dark: '#3c3c3c', light: '#dddddd' },
        description: 'background color of side.',
      },
      {
        id: 'menubar.border',
        defaults: { dark: 'activityBar.border', light: 'activityBar.border' },
        description:
          'Activity bar border color separating to the side bar. The activity bar is showing on the far left or right and allows to switch between views of the side bar.',
      },
      // #endregion
    );
  }
}
