import type { LanguageBundles } from '../l10n/index.js';

import langENUS from './bundle.l10n.en-US.json' assert { type: 'json' };
import langZHCN from './bundle.l10n.zh-CN.json' assert { type: 'json' };

export const langBundles: LanguageBundles = {
  'zh-CN': langZHCN,
  'en-US': langENUS,
};
