import { useCallback, useEffect, useState } from 'react';

import { useInject } from '../../observable/index.js';

import type { ConfigurationNode } from './configuration-protocol.js';
import { ConfigurationService } from './configuration-service.js';

export const useConfigurationValue = <T>(node: ConfigurationNode<T>) => {
  const configurationService = useInject(ConfigurationService);
  const [value, setValue] = useState<T>(node.defaultValue);

  const setConfig = useCallback(
    (updateValue: T) => {
      configurationService.set(node, updateValue);
    },
    [configurationService, node],
  );

  useEffect(() => {
    (async () => {
      const hasValue = await configurationService.has(node);
      if (hasValue) {
        const val = await configurationService.get(node);
        setValue(val);
      }
    })();
  }, [configurationService, node]);

  useEffect(() => {
    const disposable = configurationService.onConfigurationValueChange((event) => {
      if (event.key === node.id) {
        setValue(event.value);
      }
    });

    return () => disposable.dispose();
  }, [configurationService, node.id]);

  return [value, setConfig] as const;
};
