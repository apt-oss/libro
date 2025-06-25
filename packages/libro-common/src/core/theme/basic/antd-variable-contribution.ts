import { singleton } from '../../../ioc/index.js';

import { VariableContribution } from './variable-protocol.js';
import type { VariableRegistry } from './variable-registry.js';

@singleton({ contrib: VariableContribution })
export class AntdVariableContribution implements VariableContribution {
  registerVariables(vars: VariableRegistry): void {
    vars.register(
      ...[
        {
          id: 'ant.font.size',
          defaults: {
            dark: '14px',
            light: '14px',
          },
          description: '',
        },

        {
          id: 'ant.line.width',
          defaults: {
            dark: '1px',
            light: '1px',
          },
          description: '',
        },

        {
          id: 'ant.line.type',
          defaults: {
            dark: 'solid',
            light: 'solid',
          },
          description: '',
        },

        {
          id: 'ant.motion.ease.out.circ',
          defaults: {
            dark: 'cubic-bezier(0.08, 0.82, 0.17, 1)',
            light: 'cubic-bezier(0.08, 0.82, 0.17, 1)',
          },
          description: '',
        },

        {
          id: 'ant.motion.ease.in.out.circ',
          defaults: {
            dark: 'cubic-bezier(0.78, 0.14, 0.15, 0.86)',
            light: 'cubic-bezier(0.78, 0.14, 0.15, 0.86)',
          },
          description: '',
        },

        {
          id: 'ant.motion.ease.out',
          defaults: {
            dark: 'cubic-bezier(0.215, 0.61, 0.355, 1)',
            light: 'cubic-bezier(0.215, 0.61, 0.355, 1)',
          },
          description: '',
        },

        {
          id: 'ant.motion.ease.in.out',
          defaults: {
            dark: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
            light: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
          },
          description: '',
        },

        {
          id: 'ant.motion.ease.out.back',
          defaults: {
            dark: 'cubic-bezier(0.12, 0.4, 0.29, 1.46)',
            light: 'cubic-bezier(0.12, 0.4, 0.29, 1.46)',
          },
          description: '',
        },

        {
          id: 'ant.motion.ease.in.back',
          defaults: {
            dark: 'cubic-bezier(0.71, -0.46, 0.88, 0.6)',
            light: 'cubic-bezier(0.71, -0.46, 0.88, 0.6)',
          },
          description: '',
        },

        {
          id: 'ant.motion.ease.in.quint',
          defaults: {
            dark: 'cubic-bezier(0.755, 0.05, 0.855, 0.06)',
            light: 'cubic-bezier(0.755, 0.05, 0.855, 0.06)',
          },
          description: '',
        },

        {
          id: 'ant.motion.ease.out.quint',
          defaults: {
            dark: 'cubic-bezier(0.23, 1, 0.32, 1)',
            light: 'cubic-bezier(0.23, 1, 0.32, 1)',
          },
          description: '',
        },

        {
          id: 'ant.border.radius',
          defaults: {
            dark: '6px',
            light: '6px',
          },
          description: '',
        },

        {
          id: 'ant.size.popup.arrow',
          defaults: {
            dark: '16px',
            light: '16px',
          },
          description: '',
        },

        {
          id: 'ant.control.height',
          defaults: {
            dark: '32px',
            light: '32px',
          },
          description: '',
        },

        {
          id: 'ant.z.index.base',
          defaults: {
            dark: '0',
            light: '0',
          },
          description: '',
        },

        {
          id: 'ant.z.index.popup.base',
          defaults: {
            dark: '1000',
            light: '1000',
          },
          description: '',
        },

        {
          id: 'ant.opacity.image',
          defaults: {
            dark: '1',
            light: '1',
          },
          description: '',
        },

        {
          id: 'ant.font.size.sm',
          defaults: {
            dark: '12px',
            light: '12px',
          },
          description: '',
        },

        {
          id: 'ant.font.size.lg',
          defaults: {
            dark: '16px',
            light: '16px',
          },
          description: '',
        },

        {
          id: 'ant.font.size.xl',
          defaults: {
            dark: '20px',
            light: '20px',
          },
          description: '',
        },

        {
          id: 'ant.font.size.heading.1',
          defaults: {
            dark: '38px',
            light: '38px',
          },
          description: '',
        },

        {
          id: 'ant.font.size.heading.2',
          defaults: {
            dark: '30px',
            light: '30px',
          },
          description: '',
        },

        {
          id: 'ant.font.size.heading.3',
          defaults: {
            dark: '24px',
            light: '24px',
          },
          description: '',
        },

        {
          id: 'ant.font.size.heading.4',
          defaults: {
            dark: '20px',
            light: '20px',
          },
          description: '',
        },

        {
          id: 'ant.font.size.heading.5',
          defaults: {
            dark: '16px',
            light: '16px',
          },
          description: '',
        },

        {
          id: 'ant.line.height',
          defaults: {
            dark: '1.5714285714285714',
            light: '1.5714285714285714',
          },
          description: '',
        },

        {
          id: 'ant.line.height.lg',
          defaults: {
            dark: '1.5',
            light: '1.5',
          },
          description: '',
        },

        {
          id: 'ant.line.height.sm',
          defaults: {
            dark: '1.6666666666666667',
            light: '1.6666666666666667',
          },
          description: '',
        },

        {
          id: 'ant.font.height',
          defaults: {
            dark: '22px',
            light: '22px',
          },
          description: '',
        },

        {
          id: 'ant.font.height.lg',
          defaults: {
            dark: '24px',
            light: '24px',
          },
          description: '',
        },

        {
          id: 'ant.font.height.sm',
          defaults: {
            dark: '20px',
            light: '20px',
          },
          description: '',
        },

        {
          id: 'ant.line.height.heading.1',
          defaults: {
            dark: '1.2105263157894737',
            light: '1.2105263157894737',
          },
          description: '',
        },

        {
          id: 'ant.line.height.heading.2',
          defaults: {
            dark: '1.2666666666666666',
            light: '1.2666666666666666',
          },
          description: '',
        },

        {
          id: 'ant.line.height.heading.3',
          defaults: {
            dark: '1.3333333333333333',
            light: '1.3333333333333333',
          },
          description: '',
        },

        {
          id: 'ant.line.height.heading.4',
          defaults: {
            dark: '1.4',
            light: '1.4',
          },
          description: '',
        },

        {
          id: 'ant.line.height.heading.5',
          defaults: {
            dark: '1.5',
            light: '1.5',
          },
          description: '',
        },

        {
          id: 'ant.control.height.sm',
          defaults: {
            dark: '24px',
            light: '24px',
          },
          description: '',
        },

        {
          id: 'ant.control.height.xs',
          defaults: {
            dark: '16px',
            light: '16px',
          },
          description: '',
        },

        {
          id: 'ant.control.height.lg',
          defaults: {
            dark: '40px',
            light: '40px',
          },
          description: '',
        },

        {
          id: 'ant.motion.duration.fast',
          defaults: {
            dark: '0.1s',
            light: '0.1s',
          },
          description: '',
        },

        {
          id: 'ant.motion.duration.mid',
          defaults: {
            dark: '0.2s',
            light: '0.2s',
          },
          description: '',
        },

        {
          id: 'ant.motion.duration.slow',
          defaults: {
            dark: '0.3s',
            light: '0.3s',
          },
          description: '',
        },

        {
          id: 'ant.line.width.bold',
          defaults: {
            dark: '2px',
            light: '2px',
          },
          description: '',
        },

        {
          id: 'ant.border.radius.xs',
          defaults: {
            dark: '2px',
            light: '2px',
          },
          description: '',
        },

        {
          id: 'ant.border.radius.sm',
          defaults: {
            dark: '4px',
            light: '4px',
          },
          description: '',
        },

        {
          id: 'ant.border.radius.lg',
          defaults: {
            dark: '8px',
            light: '8px',
          },
          description: '',
        },

        {
          id: 'ant.border.radius.outer',
          defaults: {
            dark: '4px',
            light: '4px',
          },
          description: '',
        },

        {
          id: 'ant.font.size.icon',
          defaults: {
            dark: '12px',
            light: '12px',
          },
          description: '',
        },

        {
          id: 'ant.line.width.focus',
          defaults: {
            dark: '4px',
            light: '4px',
          },
          description: '',
        },

        {
          id: 'ant.control.outline.width',
          defaults: {
            dark: '2px',
            light: '2px',
          },
          description: '',
        },

        {
          id: 'ant.control.interactive.size',
          defaults: {
            dark: '16px',
            light: '16px',
          },
          description: '',
        },

        {
          id: 'ant.font.weight.strong',
          defaults: {
            dark: '600',
            light: '600',
          },
          description: '',
        },

        {
          id: 'ant.opacity.loading',
          defaults: {
            dark: '0.65',
            light: '0.65',
          },
          description: '',
        },

        {
          id: 'ant.link.decoration',
          defaults: {
            dark: 'none',
            light: 'none',
          },
          description: '',
        },

        {
          id: 'ant.link.hover.decoration',
          defaults: {
            dark: 'none',
            light: 'none',
          },
          description: '',
        },

        {
          id: 'ant.link.focus.decoration',
          defaults: {
            dark: 'none',
            light: 'none',
          },
          description: '',
        },

        {
          id: 'ant.control.padding.horizontal',
          defaults: {
            dark: '12px',
            light: '12px',
          },
          description: '',
        },

        {
          id: 'ant.control.padding.horizontal.sm',
          defaults: {
            dark: '8px',
            light: '8px',
          },
          description: '',
        },

        {
          id: 'ant.padding.xxs',
          defaults: {
            dark: '4px',
            light: '4px',
          },
          description: '',
        },

        {
          id: 'ant.padding.xs',
          defaults: {
            dark: '8px',
            light: '8px',
          },
          description: '',
        },

        {
          id: 'ant.padding.sm',
          defaults: {
            dark: '12px',
            light: '12px',
          },
          description: '',
        },

        {
          id: 'ant.padding',
          defaults: {
            dark: '16px',
            light: '16px',
          },
          description: '',
        },

        {
          id: 'ant.padding.md',
          defaults: {
            dark: '20px',
            light: '20px',
          },
          description: '',
        },

        {
          id: 'ant.padding.lg',
          defaults: {
            dark: '24px',
            light: '24px',
          },
          description: '',
        },

        {
          id: 'ant.padding.xl',
          defaults: {
            dark: '32px',
            light: '32px',
          },
          description: '',
        },

        {
          id: 'ant.padding.content.horizontal.lg',
          defaults: {
            dark: '24px',
            light: '24px',
          },
          description: '',
        },

        {
          id: 'ant.padding.content.vertical.lg',
          defaults: {
            dark: '16px',
            light: '16px',
          },
          description: '',
        },

        {
          id: 'ant.padding.content.horizontal',
          defaults: {
            dark: '16px',
            light: '16px',
          },
          description: '',
        },

        {
          id: 'ant.padding.content.vertical',
          defaults: {
            dark: '12px',
            light: '12px',
          },
          description: '',
        },

        {
          id: 'ant.padding.content.horizontal.sm',
          defaults: {
            dark: '16px',
            light: '16px',
          },
          description: '',
        },

        {
          id: 'ant.padding.content.vertical.sm',
          defaults: {
            dark: '8px',
            light: '8px',
          },
          description: '',
        },

        {
          id: 'ant.margin.xxs',
          defaults: {
            dark: '4px',
            light: '4px',
          },
          description: '',
        },

        {
          id: 'ant.margin.xs',
          defaults: {
            dark: '8px',
            light: '8px',
          },
          description: '',
        },

        {
          id: 'ant.margin.sm',
          defaults: {
            dark: '12px',
            light: '12px',
          },
          description: '',
        },

        {
          id: 'ant.margin',
          defaults: {
            dark: '16px',
            light: '16px',
          },
          description: '',
        },

        {
          id: 'ant.margin.md',
          defaults: {
            dark: '20px',
            light: '20px',
          },
          description: '',
        },

        {
          id: 'ant.margin.lg',
          defaults: {
            dark: '24px',
            light: '24px',
          },
          description: '',
        },

        {
          id: 'ant.margin.xl',
          defaults: {
            dark: '32px',
            light: '32px',
          },
          description: '',
        },

        {
          id: 'ant.margin.xxl',
          defaults: {
            dark: '48px',
            light: '48px',
          },
          description: '',
        },

        {
          id: 'ant.box.shadow',
          defaults: {
            dark: '0 6px 16px 0 rgba(0, 0, 0, 0.08),0 3px 6px -4px rgba(0, 0, 0, 0.12),0 9px 28px 8px rgba(0, 0, 0, 0.05)',
            light:
              '0 6px 16px 0 rgba(0, 0, 0, 0.08),0 3px 6px -4px rgba(0, 0, 0, 0.12),0 9px 28px 8px rgba(0, 0, 0, 0.05)',
          },
          description: '',
        },

        {
          id: 'ant.box.shadow.secondary',
          defaults: {
            dark: '0 6px 16px 0 rgba(0, 0, 0, 0.08),0 3px 6px -4px rgba(0, 0, 0, 0.12),0 9px 28px 8px rgba(0, 0, 0, 0.05)',
            light:
              '0 6px 16px 0 rgba(0, 0, 0, 0.08),0 3px 6px -4px rgba(0, 0, 0, 0.12),0 9px 28px 8px rgba(0, 0, 0, 0.05)',
          },
          description: '',
        },

        {
          id: 'ant.box.shadow.tertiary',
          defaults: {
            dark: '0 1px 2px 0 rgba(0, 0, 0, 0.03),0 1px 6px -1px rgba(0, 0, 0, 0.02),0 2px 4px 0 rgba(0, 0, 0, 0.02)',
            light:
              '0 1px 2px 0 rgba(0, 0, 0, 0.03),0 1px 6px -1px rgba(0, 0, 0, 0.02),0 2px 4px 0 rgba(0, 0, 0, 0.02)',
          },
          description: '',
        },

        {
          id: 'ant.box.shadow.popover.arrow',
          defaults: {
            dark: '2px 2px 5px rgba(0, 0, 0, 0.05)',
            light: '2px 2px 5px rgba(0, 0, 0, 0.05)',
          },
          description: '',
        },

        {
          id: 'ant.box.shadow.card',
          defaults: {
            dark: '0 1px 2px -2px rgba(0, 0, 0, 0.16),0 3px 6px 0 rgba(0, 0, 0, 0.12),0 5px 12px 4px rgba(0, 0, 0, 0.09)',
            light:
              '0 1px 2px -2px rgba(0, 0, 0, 0.16),0 3px 6px 0 rgba(0, 0, 0, 0.12),0 5px 12px 4px rgba(0, 0, 0, 0.09)',
          },
          description: '',
        },

        {
          id: 'ant.box.shadow.drawer.right',
          defaults: {
            dark: '-6px 0 16px 0 rgba(0, 0, 0, 0.08),-3px 0 6px -4px rgba(0, 0, 0, 0.12),-9px 0 28px 8px rgba(0, 0, 0, 0.05)',
            light:
              '-6px 0 16px 0 rgba(0, 0, 0, 0.08),-3px 0 6px -4px rgba(0, 0, 0, 0.12),-9px 0 28px 8px rgba(0, 0, 0, 0.05)',
          },
          description: '',
        },

        {
          id: 'ant.box.shadow.drawer.left',
          defaults: {
            dark: '6px 0 16px 0 rgba(0, 0, 0, 0.08),3px 0 6px -4px rgba(0, 0, 0, 0.12),9px 0 28px 8px rgba(0, 0, 0, 0.05)',
            light:
              '6px 0 16px 0 rgba(0, 0, 0, 0.08),3px 0 6px -4px rgba(0, 0, 0, 0.12),9px 0 28px 8px rgba(0, 0, 0, 0.05)',
          },
          description: '',
        },

        {
          id: 'ant.box.shadow.drawer.up',
          defaults: {
            dark: '0 6px 16px 0 rgba(0, 0, 0, 0.08),0 3px 6px -4px rgba(0, 0, 0, 0.12),0 9px 28px 8px rgba(0, 0, 0, 0.05)',
            light:
              '0 6px 16px 0 rgba(0, 0, 0, 0.08),0 3px 6px -4px rgba(0, 0, 0, 0.12),0 9px 28px 8px rgba(0, 0, 0, 0.05)',
          },
          description: '',
        },

        {
          id: 'ant.box.shadow.drawer.down',
          defaults: {
            dark: '0 -6px 16px 0 rgba(0, 0, 0, 0.08),0 -3px 6px -4px rgba(0, 0, 0, 0.12),0 -9px 28px 8px rgba(0, 0, 0, 0.05)',
            light:
              '0 -6px 16px 0 rgba(0, 0, 0, 0.08),0 -3px 6px -4px rgba(0, 0, 0, 0.12),0 -9px 28px 8px rgba(0, 0, 0, 0.05)',
          },
          description: '',
        },

        {
          id: 'ant.box.shadow.tabs.overflow.left',
          defaults: {
            dark: 'inset 10px 0 8px -8px rgba(0, 0, 0, 0.08)',
            light: 'inset 10px 0 8px -8px rgba(0, 0, 0, 0.08)',
          },
          description: '',
        },

        {
          id: 'ant.box.shadow.tabs.overflow.right',
          defaults: {
            dark: 'inset -10px 0 8px -8px rgba(0, 0, 0, 0.08)',
            light: 'inset -10px 0 8px -8px rgba(0, 0, 0, 0.08)',
          },
          description: '',
        },

        {
          id: 'ant.box.shadow.tabs.overflow.top',
          defaults: {
            dark: 'inset 0 10px 8px -8px rgba(0, 0, 0, 0.08)',
            light: 'inset 0 10px 8px -8px rgba(0, 0, 0, 0.08)',
          },
          description: '',
        },

        {
          id: 'ant.box.shadow.tabs.overflow.bottom',
          defaults: {
            dark: 'inset 0 -10px 8px -8px rgba(0, 0, 0, 0.08)',
            light: 'inset 0 -10px 8px -8px rgba(0, 0, 0, 0.08)',
          },
          description: '',
        },
      ],
    );
  }
}
