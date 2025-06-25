import type { JSONSchemaType } from 'ajv';
import type React from 'react';

import type { Contribution } from '../../ioc/index.js';
import { contrib, singleton, Syringe } from '../../ioc/index.js';
import { ApplicationContribution } from '../application/index.js';

import type { ConfigurationNode } from './configuration-protocol.js';

export function notFalse(x: number | false): x is number {
  return x !== false;
}

export const ConfigurationRenderContribution = Syringe.defineToken(
  'ConfigurationRenderContribution',
);

export interface RenderProps<T = any> {
  label: string | undefined;
  value: T;
  onChange: (value: T) => void;
  schema: JSONSchemaType<T>;
}

export interface ConfigurationRender<T = any> {
  /**
   * false 不处理；
   * number 表示优先级
   */
  canHandle: (configuration: ConfigurationNode<T>) => false | number;
  component: React.ComponentType<RenderProps<T>>;
}

export interface ConfigurationRenderContribution {
  registerConfigurationRenders: () => ConfigurationRender[];
}

@singleton({ contrib: [ApplicationContribution] })
export class ConfigurationRenderRegistry implements ApplicationContribution {
  protected renders: ConfigurationRender[] = [];
  protected providers: Contribution.Provider<ConfigurationRenderContribution>;

  constructor(
    @contrib(ConfigurationRenderContribution)
    providers: Contribution.Provider<ConfigurationRenderContribution>,
  ) {
    this.providers = providers;
  }

  async onStart() {
    await this.setupRenderContribution();
  }

  protected async setupRenderContribution() {
    this.providers.getContributions().forEach((contribution) => {
      if (contribution.registerConfigurationRenders) {
        const renders = contribution.registerConfigurationRenders();
        renders.forEach((render) => {
          this.registerConfigurationRender(render);
        });
      }
    });
  }

  registerConfigurationRender(render: ConfigurationRender) {
    this.renders.push(render);
  }

  getConfigurationRender<T>(
    configuration: ConfigurationNode<T>,
  ): React.ComponentType<RenderProps<T>> | null {
    const validRender = this.renders
      .map((render) => {
        return {
          ...render,
          priority: render.canHandle(configuration as ConfigurationNode<any>),
        };
      })
      .filter((render) => notFalse(render.priority));
    if (validRender.length === 0) {
      console.warn(`found no component for ${configuration.type}`);
      return null;
    }
    // 相比sort性能更高
    let maxPriorityRender = validRender[0];
    for (const render of validRender) {
      if ((render.priority as number) > (maxPriorityRender.priority as number)) {
        maxPriorityRender = render;
      }
    }
    return maxPriorityRender.component;
  }
}
