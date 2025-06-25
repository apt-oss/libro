/* eslint-disable @typescript-eslint/no-unused-vars */
import { useMemo, useState, createRef } from 'react';

import { ApplicationState, ApplicationStateService } from '../application/index.js';
import { Application, ApplicationModule } from '../application/index.js';
import type { ManaContext } from '../module/index.js';
import { ManaModule } from '../module/index.js';
import { useMount, useUnmount } from '../utils/hooks.js';
import { createSlotPreference, PortalSlotId, Slot } from '../view/index.js';
import { PortalSlotView } from '../view/portal-slot-view.js';
import { RootComponents } from '../view/root-view.js';

import type { ContextProps } from './context.js';
import { ContextComponent } from './context.js';
import { RootViewRender } from './root-view-render.js';
import './index.less';

const PortalModule = ManaModule.create().register(
  createSlotPreference({ slot: PortalSlotId, view: PortalSlotView }),
);

export interface ApplicationProps extends ContextProps {
  onInitialized?: (ctx: ManaContext, app: Application) => void;
  onWillStart?: (ctx: ManaContext, app: Application) => void;
  onReady?: (ctx: ManaContext, app: Application) => void;
  /**
   * 使用路由模式时需要开启
   */
  renderChildren?: boolean;
  renderAfterReady?: boolean;
}

export const ApplicationComponent = (props: ApplicationProps) => {
  const {
    onReady,
    onInitialized,
    onWillStart,
    modules = [],
    loading,
    renderChildren = false,
    renderAfterReady = false,
  } = props;
  const nextModels = useMemo(() => {
    return [ApplicationModule, PortalModule, ...modules];
  }, [modules]);

  const hostRef = createRef<HTMLDivElement>();
  const [ready, setReady] = useState(false);
  const [appReady, setAppReady] = useState(false);
  const [application, setApplication] = useState<Application | undefined>(undefined);
  const LoadingComponent = () =>
    loading ? <div className="mana-preload">{loading}</div> : null;
  const onModuleReady = (ctx: ManaContext) => {
    const current = hostRef.current;
    setReady(true);
    const app = ctx.container.get(Application);
    setApplication(app);
    const rootComponents = ctx.container.get<RootComponents>(RootComponents);
    if (!rootComponents.Loading) {
      rootComponents.Loading = LoadingComponent;
    }
    const appState = ctx.container.get(ApplicationStateService);
    if (current && app) {
      app.host = current;
    }
    appState
      .reachedState(ApplicationState.Initialized)
      .then(() => {
        if (onInitialized) {
          onInitialized(ctx, app);
        }
        return;
      })
      .catch((_e) => {
        //
      });
    if (onWillStart) {
      onWillStart(ctx, app);
    }
    app.start();
    appState
      .reachedState(ApplicationState.Ready)
      .then(() => {
        if (onReady) {
          setAppReady(true);
          onReady(ctx, app);
        }
        return;
      })
      .catch((_e) => {
        //
      });
  };
  useMount(() => {
    if (hostRef.current && application) {
      application.host = hostRef.current;
      application.mount();
    }
  });
  useUnmount(() => {
    if (application) {
      application.unmount();
    }
  });
  const loadingValue = loading ? <LoadingComponent /> : null;
  const renderContent = () => {
    if (!ready) {
      // 模块加载未完成
      return loadingValue;
    }
    if (!renderChildren) {
      // 基于 rootSlot 渲染
      return (
        <>
          <RootViewRender loading={loadingValue} />
          <Slot name={PortalSlotId} viewProps={{ shadow: true }} />
        </>
      );
    }
    if (appReady || !renderAfterReady) {
      // 模块加载完成 或 renderAfterReady 情况下 app 启动完成
      return (
        <>
          {props.children}
          <Slot name={PortalSlotId} viewProps={{ shadow: true }} />
        </>
      );
    }
    // renderAfterReady 情况下 app 未启动完成
    return loadingValue;
  };
  return (
    <div ref={hostRef} className={`app`} tabIndex={1}>
      <ContextComponent
        {...props}
        loading={loadingValue}
        modules={nextModels}
        onReady={onModuleReady}
      >
        {renderContent()}
      </ContextComponent>
    </div>
  );
};
