import { singleton } from '../../../ioc/index.js';

import { ColorContribution } from './color-protocol.js';
import type { ColorRegistry } from './color-registry.js';
import { Color } from './color-registry.js';

@singleton({ contrib: ColorContribution })
export class AntdColorContribution implements ColorContribution {
  registerColors(colors: ColorRegistry): void {
    colors.register(
      ...[
        {
          id: 'ant.blue',
          defaults: {
            dark: '#1677FF',
            light: '#1677FF',
          },
          description: '',
        },

        {
          id: 'ant.color.primary',
          defaults: {
            dark: '#1668dc',
            light: '#1677ff',
          },
          description: '',
        },

        {
          id: 'ant.color.success',
          defaults: {
            dark: '#49aa19',
            light: '#52c41a',
          },
          description: '',
        },

        {
          id: 'ant.color.warning',
          defaults: {
            dark: '#d89614',
            light: '#faad14',
          },
          description: '',
        },

        {
          id: 'ant.color.error',
          defaults: {
            dark: '#dc4446',
            light: '#ff4d4f',
          },
          description: '',
        },

        {
          id: 'ant.color.info',
          defaults: {
            dark: '#1668dc',
            light: '#1677ff',
          },
          description: '',
        },

        {
          id: 'ant.color.link',
          defaults: {
            dark: '#1668dc',
            light: '#1677ff',
          },
          description: '',
        },

        {
          id: 'ant.color.text.base',
          defaults: {
            dark: '#fff',
            light: '#000',
          },
          description: '',
        },

        {
          id: 'ant.color.bg.base',
          defaults: {
            dark: '#000',
            light: '#fff',
          },
          description: '',
        },

        {
          id: 'ant.blue.1',
          defaults: {
            dark: '#111a2c',
            light: '#e6f4ff',
          },
          description: '',
        },

        {
          id: 'ant.blue.2',
          defaults: {
            dark: '#112545',
            light: '#bae0ff',
          },
          description: '',
        },

        {
          id: 'ant.blue.3',
          defaults: {
            dark: '#15325b',
            light: '#91caff',
          },
          description: '',
        },

        {
          id: 'ant.blue.4',
          defaults: {
            dark: '#15417e',
            light: '#69b1ff',
          },
          description: '',
        },

        {
          id: 'ant.blue.5',
          defaults: {
            dark: '#1554ad',
            light: '#4096ff',
          },
          description: '',
        },

        {
          id: 'ant.blue.6',
          defaults: {
            dark: '#1668dc',
            light: '#1677ff',
          },
          description: '',
        },

        {
          id: 'ant.blue.7',
          defaults: {
            dark: '#3c89e8',
            light: '#0958d9',
          },
          description: '',
        },

        {
          id: 'ant.blue.8',
          defaults: {
            dark: '#65a9f3',
            light: '#003eb3',
          },
          description: '',
        },

        {
          id: 'ant.blue.9',
          defaults: {
            dark: '#8dc5f8',
            light: '#002c8c',
          },
          description: '',
        },

        {
          id: 'ant.blue.10',
          defaults: {
            dark: '#b7dcfa',
            light: '#001d66',
          },
          description: '',
        },

        {
          id: 'ant.color.text',
          defaults: {
            dark: Color.rgba(255, 255, 255, 0.85),
            light: Color.rgba(0, 0, 0, 0.88),
          },
          description: '',
        },

        {
          id: 'ant.color.text.secondary',
          defaults: {
            dark: Color.rgba(255, 255, 255, 0.65),
            light: Color.rgba(0, 0, 0, 0.65),
          },
          description: '',
        },

        {
          id: 'ant.color.text.tertiary',
          defaults: {
            dark: Color.rgba(255, 255, 255, 0.45),
            light: Color.rgba(0, 0, 0, 0.45),
          },
          description: '',
        },

        {
          id: 'ant.color.text.quaternary',
          defaults: {
            dark: Color.rgba(255, 255, 255, 0.25),
            light: Color.rgba(0, 0, 0, 0.25),
          },
          description: '',
        },

        {
          id: 'ant.color.fill',
          defaults: {
            dark: Color.rgba(255, 255, 255, 0.18),
            light: Color.rgba(0, 0, 0, 0.15),
          },
          description: '',
        },

        {
          id: 'ant.color.fill.secondary',
          defaults: {
            dark: Color.rgba(255, 255, 255, 0.12),
            light: Color.rgba(0, 0, 0, 0.06),
          },
          description: '',
        },

        {
          id: 'ant.color.fill.tertiary',
          defaults: {
            dark: Color.rgba(255, 255, 255, 0.08),
            light: Color.rgba(0, 0, 0, 0.04),
          },
          description: '',
        },

        {
          id: 'ant.color.fill.quaternary',
          defaults: {
            dark: Color.rgba(255, 255, 255, 0.04),
            light: Color.rgba(0, 0, 0, 0.02),
          },
          description: '',
        },

        {
          id: 'ant.color.bg.layout',
          defaults: {
            dark: '#000000',
            light: '#f5f5f5',
          },
          description: '',
        },
        {
          id: 'ant.color.bg.blur',
          defaults: {
            dark: Color.rgba(255, 255, 255, 0.04),
            light: 'transparent',
          },
          description: '',
        },

        {
          id: 'ant.color.bg.container',
          defaults: {
            dark: '#141414',
            light: '#ffffff',
          },
          description: '',
        },

        {
          id: 'ant.color.bg.elevated',
          defaults: {
            dark: '#1f1f1f',
            light: '#ffffff',
          },
          description: '',
        },

        {
          id: 'ant.color.bg.spotlight',
          defaults: {
            dark: '#424242',
            light: Color.rgba(0, 0, 0, 0.85),
          },
          description: '',
        },

        {
          id: 'ant.color.border',
          defaults: {
            dark: '#424242',
            light: '#d9d9d9',
          },
          description: '',
        },

        {
          id: 'ant.color.border.secondary',
          defaults: {
            dark: '#303030',
            light: '#f0f0f0',
          },
          description: '',
        },

        {
          id: 'ant.color.primary.bg',
          defaults: {
            dark: '#111a2c',
            light: '#e6f4ff',
          },
          description: '',
        },

        {
          id: 'ant.color.primary.bg.hover',
          defaults: {
            dark: '#112545',
            light: '#bae0ff',
          },
          description: '',
        },

        {
          id: 'ant.color.primary.border',
          defaults: {
            dark: '#15325b',
            light: '#91caff',
          },
          description: '',
        },

        {
          id: 'ant.color.primary.border.hover',
          defaults: {
            dark: '#15417e',
            light: '#69b1ff',
          },
          description: '',
        },

        {
          id: 'ant.color.primary.hover',
          defaults: {
            dark: '#3c89e8',
            light: '#4096ff',
          },
          description: '',
        },

        {
          id: 'ant.color.primary.active',
          defaults: {
            dark: '#1554ad',
            light: '#0958d9',
          },
          description: '',
        },

        {
          id: 'ant.color.primary.text.hover',
          defaults: {
            dark: '#3c89e8',
            light: '#4096ff',
          },
          description: '',
        },

        {
          id: 'ant.color.primary.text',
          defaults: {
            dark: '#1668dc',
            light: '#1677ff',
          },
          description: '',
        },

        {
          id: 'ant.color.primary.text.active',
          defaults: {
            dark: '#1554ad',
            light: '#0958d9',
          },
          description: '',
        },

        {
          id: 'ant.color.success.bg',
          defaults: {
            dark: '#162312',
            light: '#f6ffed',
          },
          description: '',
        },

        {
          id: 'ant.color.success.bg.hover',
          defaults: {
            dark: '#1d3712',
            light: '#d9f7be',
          },
          description: '',
        },

        {
          id: 'ant.color.success.border',
          defaults: {
            dark: '#274916',
            light: '#b7eb8f',
          },
          description: '',
        },

        {
          id: 'ant.color.success.border.hover',
          defaults: {
            dark: '#306317',
            light: '#95de64',
          },
          description: '',
        },

        {
          id: 'ant.color.success.hover',
          defaults: {
            dark: '#306317',
            light: '#95de64',
          },
          description: '',
        },

        {
          id: 'ant.color.success.active',
          defaults: {
            dark: '#3c8618',
            light: '#389e0d',
          },
          description: '',
        },

        {
          id: 'ant.color.success.text.hover',
          defaults: {
            dark: '#6abe39',
            light: '#73d13d',
          },
          description: '',
        },

        {
          id: 'ant.color.success.text',
          defaults: {
            dark: '#49aa19',
            light: '#52c41a',
          },
          description: '',
        },

        {
          id: 'ant.color.success.text.active',
          defaults: {
            dark: '#3c8618',
            light: '#389e0d',
          },
          description: '',
        },

        {
          id: 'ant.color.error.bg',
          defaults: {
            dark: '#2c1618',
            light: '#fff2f0',
          },
          description: '',
        },

        {
          id: 'ant.color.error.bg.hover',
          defaults: {
            dark: '#451d1f',
            light: '#fff1f0',
          },
          description: '',
        },

        {
          id: 'ant.color.error.bg.active',
          defaults: {
            dark: '#5b2526',
            light: '#ffccc7',
          },
          description: '',
        },

        {
          id: 'ant.color.error.border',
          defaults: {
            dark: '#5b2526',
            light: '#ffccc7',
          },
          description: '',
        },

        {
          id: 'ant.color.error.border.hover',
          defaults: {
            dark: '#7e2e2f',
            light: '#ffa39e',
          },
          description: '',
        },

        {
          id: 'ant.color.error.hover',
          defaults: {
            dark: '#e86e6b',
            light: '#ff7875',
          },
          description: '',
        },

        {
          id: 'ant.color.error.active',
          defaults: {
            dark: '#ad393a',
            light: '#d9363e',
          },
          description: '',
        },

        {
          id: 'ant.color.error.text.hover',
          defaults: {
            dark: '#e86e6b',
            light: '#ff7875',
          },
          description: '',
        },

        {
          id: 'ant.color.error.text',
          defaults: {
            dark: '#dc4446',
            light: '#ff4d4f',
          },
          description: '',
        },

        {
          id: 'ant.color.error.text.active',
          defaults: {
            dark: '#ad393a',
            light: '#d9363e',
          },
          description: '',
        },

        {
          id: 'ant.color.warning.bg',
          defaults: {
            dark: '#2b2111',
            light: '#fffbe6',
          },
          description: '',
        },

        {
          id: 'ant.color.warning.bg.hover',
          defaults: {
            dark: '#443111',
            light: '#fff1b8',
          },
          description: '',
        },

        {
          id: 'ant.color.warning.border',
          defaults: {
            dark: '#594214',
            light: '#ffe58f',
          },
          description: '',
        },

        {
          id: 'ant.color.warning.border.hover',
          defaults: {
            dark: '#7c5914',
            light: '#ffd666',
          },
          description: '',
        },

        {
          id: 'ant.color.warning.hover',
          defaults: {
            dark: '#7c5914',
            light: '#ffd666',
          },
          description: '',
        },

        {
          id: 'ant.color.warning.active',
          defaults: {
            dark: '#aa7714',
            light: '#d48806',
          },
          description: '',
        },

        {
          id: 'ant.color.warning.text.hover',
          defaults: {
            dark: '#e8b339',
            light: '#ffc53d',
          },
          description: '',
        },

        {
          id: 'ant.color.warning.text',
          defaults: {
            dark: '#d89614',
            light: '#faad14',
          },
          description: '',
        },

        {
          id: 'ant.color.warning.text.active',
          defaults: {
            dark: '#aa7714',
            light: '#d48806',
          },
          description: '',
        },

        {
          id: 'ant.color.info.bg',
          defaults: {
            dark: '#111a2c',
            light: '#e6f4ff',
          },
          description: '',
        },

        {
          id: 'ant.color.info.bg.hover',
          defaults: {
            dark: '#112545',
            light: '#bae0ff',
          },
          description: '',
        },

        {
          id: 'ant.color.info.border',
          defaults: {
            dark: '#15325b',
            light: '#91caff',
          },
          description: '',
        },

        {
          id: 'ant.color.info.border.hover',
          defaults: {
            dark: '#15417e',
            light: '#69b1ff',
          },
          description: '',
        },

        {
          id: 'ant.color.info.hover',
          defaults: {
            dark: '#15417e',
            light: '#69b1ff',
          },
          description: '',
        },

        {
          id: 'ant.color.info.active',
          defaults: {
            dark: '#1554ad',
            light: '#0958d9',
          },
          description: '',
        },

        {
          id: 'ant.color.info.text.hover',
          defaults: {
            dark: '#3c89e8',
            light: '#4096ff',
          },
          description: '',
        },

        {
          id: 'ant.color.info.text',
          defaults: {
            dark: '#1668dc',
            light: '#1677ff',
          },
          description: '',
        },

        {
          id: 'ant.color.info.text.active',
          defaults: {
            dark: '#1554ad',
            light: '#0958d9',
          },
          description: '',
        },

        {
          id: 'ant.color.link.hover',
          defaults: {
            dark: '#15417e',
            light: '#69b1ff',
          },
          description: '',
        },

        {
          id: 'ant.color.link.active',
          defaults: {
            dark: '#1554ad',
            light: '#0958d9',
          },
          description: '',
        },

        {
          id: 'ant.color.bg.mask',
          defaults: {
            dark: Color.rgba(0, 0, 0, 0.45),
            light: Color.rgba(0, 0, 0, 0.45),
          },
          description: '',
        },

        {
          id: 'ant.color.white',
          defaults: {
            dark: '#fff',
            light: '#fff',
          },
          description: '',
        },

        {
          id: 'ant.color.fill.content',
          defaults: {
            dark: Color.rgba(255, 255, 255, 0.12),
            light: Color.rgba(0, 0, 0, 0.06),
          },
          description: '',
        },

        {
          id: 'ant.color.fill.content.hover',
          defaults: {
            dark: Color.rgba(255, 255, 255, 0.18),
            light: Color.rgba(0, 0, 0, 0.15),
          },
          description: '',
        },

        {
          id: 'ant.color.fill.alter',
          defaults: {
            dark: Color.rgba(255, 255, 255, 0.04),
            light: Color.rgba(0, 0, 0, 0.02),
          },
          description: '',
        },

        {
          id: 'ant.color.bg.container.disabled',
          defaults: {
            dark: Color.rgba(255, 255, 255, 0.08),
            light: Color.rgba(0, 0, 0, 0.04),
          },
          description: '',
        },

        {
          id: 'ant.color.border.bg',
          defaults: {
            dark: '#141414',
            light: '#ffffff',
          },
          description: '',
        },

        {
          id: 'ant.color.split',
          defaults: {
            dark: Color.rgba(253, 253, 253, 0.12),
            light: Color.rgba(5, 5, 5, 0.06),
          },
          description: '',
        },

        {
          id: 'ant.color.text.placeholder',
          defaults: {
            dark: Color.rgba(255, 255, 255, 0.25),
            light: Color.rgba(0, 0, 0, 0.25),
          },
          description: '',
        },

        {
          id: 'ant.color.text.disabled',
          defaults: {
            dark: Color.rgba(255, 255, 255, 0.25),
            light: Color.rgba(0, 0, 0, 0.25),
          },
          description: '',
        },

        {
          id: 'ant.color.text.heading',
          defaults: {
            dark: Color.rgba(255, 255, 255, 0.85),
            light: Color.rgba(0, 0, 0, 0.88),
          },
          description: '',
        },

        {
          id: 'ant.color.text.label',
          defaults: {
            dark: Color.rgba(255, 255, 255, 0.65),
            light: Color.rgba(0, 0, 0, 0.65),
          },
          description: '',
        },

        {
          id: 'ant.color.text.description',
          defaults: {
            dark: Color.rgba(255, 255, 255, 0.45),
            light: Color.rgba(0, 0, 0, 0.45),
          },
          description: '',
        },

        {
          id: 'ant.color.text.light.solid',
          defaults: {
            dark: '#fff',
            light: '#fff',
          },
          description: '',
        },

        {
          id: 'ant.color.highlight',
          defaults: {
            dark: '#dc4446',
            light: '#ff4d4f',
          },
          description: '',
        },

        {
          id: 'ant.color.bg.text.hover',
          defaults: {
            dark: Color.rgba(255, 255, 255, 0.12),
            light: Color.rgba(0, 0, 0, 0.06),
          },
          description: '',
        },

        {
          id: 'ant.color.bg.text.active',
          defaults: {
            dark: Color.rgba(255, 255, 255, 0.18),
            light: Color.rgba(0, 0, 0, 0.15),
          },
          description: '',
        },

        {
          id: 'ant.color.icon',
          defaults: {
            dark: Color.rgba(255, 255, 255, 0.45),
            light: Color.rgba(0, 0, 0, 0.45),
          },
          description: '',
        },

        {
          id: 'ant.color.icon.hover',
          defaults: {
            dark: Color.rgba(255, 255, 255, 0.85),
            light: Color.rgba(0, 0, 0, 0.88),
          },
          description: '',
        },

        {
          id: 'ant.color.error.outline',
          defaults: {
            dark: Color.rgba(238, 38, 56, 0.11),
            light: Color.rgba(255, 38, 5, 0.06),
          },
          description: '',
        },

        {
          id: 'ant.color.warning.outline',
          defaults: {
            dark: Color.rgba(173, 107, 0, 0.15),
            light: Color.rgba(255, 215, 5, 0.1),
          },
          description: '',
        },

        {
          id: 'ant.control.item.bg.hover',
          defaults: {
            dark: Color.rgba(255, 255, 255, 0.08),
            light: Color.rgba(0, 0, 0, 0.04),
          },
          description: '',
        },

        {
          id: 'ant.control.item.bg.active',
          defaults: {
            dark: '#111a2c',
            light: '#e6f4ff',
          },
          description: '',
        },

        {
          id: 'ant.control.item.bg.active.hover',
          defaults: {
            dark: '#112545',
            light: '#bae0ff',
          },
          description: '',
        },

        {
          id: 'ant.control.item.bg.active.disabled',
          defaults: {
            dark: Color.rgba(255, 255, 255, 0.18),
            light: Color.rgba(0, 0, 0, 0.15),
          },
          description: '',
        },

        {
          id: 'ant.control.tmp.outline',
          defaults: {
            dark: Color.rgba(255, 255, 255, 0.04),
            light: Color.rgba(0, 0, 0, 0.02),
          },
          description: '',
        },

        {
          id: 'ant.control.outline',
          defaults: {
            dark: Color.rgba(0, 60, 180, 0.15),
            light: Color.rgba(5, 145, 255, 0.1),
          },
          description: '',
        },
      ],
    );
  }
}
