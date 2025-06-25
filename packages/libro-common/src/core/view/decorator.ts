import type { Newable } from '../../common/index.js';
import type { Syringe } from '../../ioc/index.js';
import { registerSideOption } from '../../ioc/index.js';
import type { ManaModule } from '../module/index.js';
import { ManaContext } from '../module/index.js';

import { isWrapperViewComponent, ViewWrapper } from './view-container.js';
import { ViewManager } from './view-manager.js';
import type { SlotPreference, ViewPreference } from './view-protocol.js';
import type { View } from './view-protocol.js';
import { OriginViewComponent, ViewComponent } from './view-protocol.js';
import { SlotPreferenceContribution } from './view-protocol.js';
import {
  ViewDefineToken,
  ViewInstance,
  ViewOption,
  ViewFactory,
  ViewPreferenceContribution,
} from './view-protocol.js';

export const createViewPreference = (...preferences: ViewPreference[]) => {
  return { token: ViewPreferenceContribution, useValue: preferences };
};

export const createSlotPreference = (...preferences: SlotPreference[]) => {
  return { token: SlotPreferenceContribution, useValue: preferences };
};

export interface ViewDecoratorOption {
  asChild?: boolean;
  registry?: Syringe.Registry;
}

export function view<T extends View>(factoryId: string, viewModule?: ManaModule) {
  return (target: Newable<T>): void => {
    Reflect.defineMetadata(ViewDefineToken, factoryId, target);
    registerSideOption(
      {
        token: ViewFactory,
        useDynamic: (ctx: Syringe.Context) => ({
          id: factoryId,
          createView: async (viewOption: any, specModule?: ManaModule) => {
            const module = specModule || viewModule;
            let { container } = ctx;
            container = ctx.container.createChild();
            const context = new ManaContext(container);
            if (module) {
              await context.load(module);
            }
            container.register({ token: ViewOption, useValue: viewOption });
            const current = container.get<View>(target);
            container.register({ token: ViewInstance, useValue: current });
            container.register({
              token: OriginViewComponent,
              useDynamic: () => {
                const component = current.view as any;
                if (isWrapperViewComponent(component)) {
                  return component[OriginViewComponent];
                } else {
                  return component;
                }
              },
            });
            const viewComponent = ViewWrapper(current.view, container);
            container.register({
              token: ViewComponent,
              useDynamic: () => {
                const component = current.view as any;
                if (isWrapperViewComponent(component)) {
                  return component;
                } else {
                  return ViewWrapper(current.view, container);
                }
              },
            });
            current.view = viewComponent;
            const manager = container.get(ViewManager);
            manager.setViewContext(current, context);
            return current;
          },
        }),
      },
      target,
    );
  };
}
