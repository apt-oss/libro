import React, { forwardRef, useEffect } from 'react';

import { defaultPrefixCls } from '../constant.js';

import type {
  NotificationArgsProps,
  GlobalConfigProps,
  NotificationInstance,
} from './protocol.js';
import PurePanel from './pure-panel.js';
import { render } from './render.js';
import { useInternalNotification } from './use-notification.js';
import './style/index.js';

export type { NotificationArgsProps } from './protocol.js';

let globalNotification: GlobalNotification | null = null;

const act: (callback: VoidFunction) => Promise<void> | void = (
  callback: VoidFunction,
) => callback();

interface GlobalNotification {
  fragment: DocumentFragment;
  instance?: NotificationInstance | null;
  sync?: VoidFunction;
}

type Task =
  | {
      type: 'open';
      config: NotificationArgsProps;
    }
  | {
      type: 'destroy';
      key?: React.Key;
    };

let taskQueue: Task[] = [];

interface GlobalHolderRef {
  instance: NotificationInstance;
  sync: () => void;
}

const prefixCls = `${defaultPrefixCls}-notification`;

const GlobalHolder = React.forwardRef<
  GlobalHolderRef,
  { notificationConfig: GlobalConfigProps; sync: () => void }
>(function GlobalHolder(props, ref) {
  const { notificationConfig, sync } = props;

  const [api, holder] = useInternalNotification({
    ...notificationConfig,
    prefixCls,
  });

  useEffect(sync, [sync]);

  React.useImperativeHandle(ref, () => {
    const instance: NotificationInstance = { ...api };

    Object.keys(instance).forEach((method) => {
      instance[method as keyof NotificationInstance] = (...args: any[]) => {
        sync();
        return (api as any)[method](...args);
      };
    });

    return {
      instance,
      sync,
    };
  });

  return holder;
});

const GlobalHolderWrapper = forwardRef<GlobalHolderRef, unknown>(
  function GlobalHolderWrapper(_, ref) {
    const sync = () => {
      //
    };

    React.useEffect(sync, []);

    const dom = <GlobalHolder ref={ref} sync={sync} notificationConfig={{}} />;
    return dom;
  },
);

function flushNotice() {
  if (!globalNotification) {
    const holderFragment = document.createDocumentFragment();

    const newNotification: GlobalNotification = {
      fragment: holderFragment,
    };

    globalNotification = newNotification;

    // Delay render to avoid sync issue
    act(() => {
      render(
        <GlobalHolderWrapper
          ref={(node) => {
            const { instance, sync } = node || {};
            Promise.resolve()
              .then(() => {
                if (!newNotification.instance && instance) {
                  newNotification.instance = instance;
                  newNotification.sync = sync;
                  flushNotice();
                }
                return;
              })
              .catch(console.error);
          }}
        />,
        holderFragment,
      );
    });

    return;
  }

  // Notification not ready
  if (!globalNotification.instance) {
    return;
  }

  // >>> Execute task
  taskQueue.forEach((task) => {
    // eslint-disable-next-line default-case
    switch (task.type) {
      case 'open': {
        act(() => {
          globalNotification!.instance!.open({
            ...task.config,
          });
        });
        break;
      }

      case 'destroy':
        act(() => {
          globalNotification?.instance!.destroy(task.key);
        });
        break;
    }
  });

  // Clean up
  taskQueue = [];
}

// ==============================================================================
// ==                                  Export                                  ==
// ==============================================================================

function open(config: NotificationArgsProps) {
  taskQueue.push({
    type: 'open',
    config,
  });
  flushNotice();
}

const destroy: BaseMethods['destroy'] = (key) => {
  taskQueue.push({
    type: 'destroy',
    key,
  });
  flushNotice();
};

interface BaseMethods {
  open: (config: NotificationArgsProps) => void;
  destroy: (key?: React.Key) => void;
  /** @private Internal Component. Do not use in your production. */
  _InternalPanelDoNotUseOrYouWillBeFired: typeof PurePanel;
}

type StaticFn = (config: NotificationArgsProps) => void;

interface NoticeMethods {
  success: StaticFn;
  info: StaticFn;
  warning: StaticFn;
  error: StaticFn;
}

const methods: (keyof NoticeMethods)[] = ['success', 'info', 'warning', 'error'];

const baseStaticMethods: BaseMethods = {
  open,
  destroy,
  _InternalPanelDoNotUseOrYouWillBeFired: PurePanel,
};

const staticMethods = baseStaticMethods as NoticeMethods & BaseMethods;

methods.forEach((type: keyof NoticeMethods) => {
  staticMethods[type] = (config) => open({ ...config, type });
});

export const notification = staticMethods;
