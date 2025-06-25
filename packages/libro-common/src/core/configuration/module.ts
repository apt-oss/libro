import { ManaModule } from '../module/index.js';

import { ConfigurationCache } from './configuration-cache.js';
import {
  ConfigurationProvider,
  DefaultConfigurationProvider,
  LocalStorageConfigurationProvider,
} from './configuration-provider.js';
import {
  ConfigurationContribution,
  ConfigurationRegistry,
} from './configuration-registry.js';
import {
  ConfigurationRenderContribution,
  ConfigurationRenderRegistry,
} from './configuration-render-registry.js';
import { ConfigurationService } from './configuration-service.js';
import { SchemaValidator } from './validation.js';

export const ConfigurationModule = ManaModule.create()
  .contribution(
    ConfigurationProvider,
    ConfigurationContribution,
    ConfigurationRenderContribution,
  )
  .register(
    ConfigurationService,
    DefaultConfigurationProvider,
    LocalStorageConfigurationProvider,
    ConfigurationRegistry,
    ConfigurationRenderRegistry,
    SchemaValidator,
    ConfigurationCache,
  );
