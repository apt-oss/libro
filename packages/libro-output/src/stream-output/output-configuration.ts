import type { ConfigurationNode } from '@difizen/mana-app';
import { ConfigurationContribution } from '@difizen/mana-app';
import { singleton } from '@difizen/mana-app';
import { l10n } from '@difizen/mana-l10n';

export const LargeOutputDisplay: ConfigurationNode<boolean> = {
  id: 'libro.output.large.display',
  description: l10n.t('是否优化长文本 output 显示'),
  title: 'Output',
  type: 'checkbox',
  defaultValue: true,
  schema: {
    type: 'boolean',
  },
};

@singleton({ contrib: ConfigurationContribution })
export class OutputSettingContribution implements ConfigurationContribution {
  registerConfigurations() {
    return [LargeOutputDisplay];
  }
}
