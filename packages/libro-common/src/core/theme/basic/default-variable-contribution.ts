import { singleton } from '../../../ioc/index.js';

import { VariableContribution } from './variable-protocol.js';
import type { VariableRegistry } from './variable-registry.js';

@singleton({ contrib: VariableContribution })
export class DefaultVariableContribution implements VariableContribution {
  registerVariables(vars: VariableRegistry): void {
    vars.register(
      {
        id: 'border.width',
        defaults: { dark: '1px', light: '1px' },
        description: '',
      },
      {
        id: 'border.radius',
        defaults: { dark: '4px', light: '4px' },
        description: '',
      },
      {
        id: 'border.radius.lg',
        defaults: { dark: '8px', light: '8px' },
        description: '',
      },
      {
        id: 'panel.border.width',
        defaults: { dark: '2px', light: '2px' },
        description: '',
      },
      {
        id: 'ui.font.scale.factor',
        defaults: { dark: '1.2', light: '1.2' },
        description: '',
      },
      {
        id: 'ui.font.size0',
        defaults: {
          dark: 'calc(var(--mana-ui-font-size1) / var(--mana-ui-font-scale-factor))',
          light: 'calc(var(--mana-ui-font-size1) / var(--mana-ui-font-scale-factor))',
        },
        description: '',
      },
      {
        id: 'ui.font.size1',
        defaults: { dark: '13px', light: '13px' },
        description: '',
      },
      {
        id: 'ui.font.size2',
        defaults: {
          dark: 'calc(var(--mana-ui-font-size1) * var(--mana-ui-font-scale-factor))',
          light: 'calc(var(--mana-ui-font-size1) * var(--mana-ui-font-scale-factor))',
        },
        description: '',
      },
      {
        id: 'ui.font.size3',
        defaults: {
          dark: 'calc(var(--mana-ui-font-size2) * var(--mana-ui-font-scale-factor))',
          light: 'calc(var(--mana-ui-font-size2) * var(--mana-ui-font-scale-factor))',
        },
        description: '',
      },
      {
        id: 'ui.icon.font.size',
        defaults: { dark: '14px', light: '14px' },
        description: '',
      },
      {
        id: 'ui-font-family',
        defaults: {
          dark: '"Helvetica Neue", helvetica, arial, sans-serif',
          light: '"Helvetica Neue", helvetica, arial, sans-serif',
        },
        description: '',
      },
      {
        id: 'content.font.size',
        defaults: { dark: '13px', light: '13px' },
        description: '',
      },
      {
        id: 'content.line.height',
        defaults: { dark: '22px', light: '22px' },
        description: '',
      },
      {
        id: 'code.font.size',
        defaults: { dark: '13px', light: '13px' },
        description: '',
      },
      {
        id: 'code.line.height',
        defaults: { dark: '17px', light: '17px' },
        description: '',
      },
      {
        id: 'code.padding',
        defaults: { dark: '5px', light: '5px' },
        description: '',
      },
      {
        id: 'code.font.family',
        defaults: {
          dark: 'menlo, monaco, consolas, "Droid Sans Mono", "Courier New", monospace, "Droid Sans Fallback"',
          light:
            'menlo, monaco, consolas, "Droid Sans Mono", "Courier New", monospace, "Droid Sans Fallback"',
        },
        description: '',
      },
      {
        id: 'monospace.font.family',
        defaults: { dark: 'monospace', light: 'monospace' },
        description: '',
      },
      {
        id: 'ui.padding',
        defaults: { dark: '6px', light: '6px' },
        description: '',
      },
      {
        id: 'icon.size',
        defaults: { dark: '16px', light: '16px' },
        description: '',
      },
      {
        id: 'scrollbar.width',
        defaults: { dark: '10px', light: '10px' },
        description: '',
      },
      {
        id: 'scrollbar.rail.width',
        defaults: { dark: '10px', light: '10px' },
        description: '',
      },
      {
        id: 'statusBar.font.size',
        defaults: { dark: '12px', light: '12px' },
        description: '',
      },
      {
        id: 'mod.disabled.opacity',
        defaults: { dark: '0.4', light: '0.4' },
        description: '',
      },
      {
        id: 'sidebar.scrollbar.rail.width',
        defaults: { dark: '7px', light: '7px' },
        description: '',
      },
      {
        id: 'sidebar.scrollbar.width',
        defaults: { dark: '5px', light: '5px' },
        description: '',
      },
      {
        id: 'sidebar.icon.size',
        defaults: { dark: '28px', light: '28px' },
        description: '',
      },
    );
  }
}
