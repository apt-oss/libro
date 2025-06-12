import type { ConfigurationNode } from '@difizen/mana-app';
import { ConfigurationContribution } from '@difizen/mana-app';
import { singleton } from '@difizen/mana-app';
import { l10n } from '@difizen/mana-l10n';

export const TOCVisible: ConfigurationNode<boolean> = {
  id: 'libro.toc.visible',
  description: l10n.t('是否显示侧边的TOC'),
  title: 'TOC',
  type: 'checkbox',
  defaultValue: true,
  schema: {
    type: 'boolean',
  },
};

export const EnableExpandCollapse: ConfigurationNode<boolean> = {
  id: 'libro.toc.expand.collapse',
  description: l10n.t('是否支持展开与收起侧边的TOC'),
  title: 'TOC',
  type: 'checkbox',
  defaultValue: false,
  schema: {
    type: 'boolean',
  },
};

@singleton({ contrib: ConfigurationContribution })
export class TOCSettingContribution implements ConfigurationContribution {
  registerConfigurations() {
    return [TOCVisible, EnableExpandCollapse];
  }
}
