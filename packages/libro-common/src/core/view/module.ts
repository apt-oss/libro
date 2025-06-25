import { ManaModule } from '../module/index.js';

import { DefaultSlotView } from './default-slot-view.js';
import { DefaultOpenerService, OpenHandler } from './open-handler.js';
import { RootComponents, RootView } from './root-view.js';
import { SlotViewManager } from './slot-view-manager.js';
import { ViewApplication } from './view-application.js';
import { ViewManager } from './view-manager.js';
import { ViewOpenHandler } from './view-open-handler.js';
import { ViewInstance, ViewPreferenceContribution } from './view-protocol.js';
import { ViewFactory } from './view-protocol.js';
import { SlotPreferenceContribution } from './view-protocol.js';
import { ViewStorage } from './view-storage.js';

export const ViewModule = ManaModule.create()
  .contribution(
    ViewFactory,
    ViewPreferenceContribution,
    SlotPreferenceContribution,
    OpenHandler,
  )
  .register(
    RootView,
    DefaultSlotView,
    ViewStorage,
    ViewApplication,
    SlotViewManager,
    ViewManager,
    DefaultOpenerService,
    ViewOpenHandler,
  )
  // register top level ViewInstance
  // TODO: remove this when we have a better way to register top level ViewInstance
  .register({
    token: ViewInstance,
    useValue: {},
  })
  .register({
    token: RootComponents,
    useValue: {},
  });
