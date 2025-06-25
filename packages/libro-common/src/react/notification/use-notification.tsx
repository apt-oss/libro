import { CloseOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import type { CSSMotionProps } from 'rc-motion';
import { useNotification as useRcNotification } from 'rc-notification';
import type {
  NotificationAPI,
  NotificationConfig as RcNotificationConfig,
} from 'rc-notification';
import type { ReactNode } from 'react';
import { useImperativeHandle } from 'react';
import { forwardRef } from 'react';
import { useMemo, useRef } from 'react';

import type {
  NotificationArgsProps,
  NotificationConfig,
  NotificationInstance,
  NotificationPlacement,
} from './protocol.js';
import { DEFAULT_DURATION } from './protocol.js';
import { getPlacementStyle } from './protocol.js';
import { DEFAULT_OFFSET } from './protocol.js';
import { NOTIFICATION_PREFIX_CLS } from './protocol.js';
import { DEFAULT_PLACEMENT } from './protocol.js';
import { PureContent } from './pure-panel.js';

export function getCloseIcon(prefixCls: string, closeIcon?: ReactNode): ReactNode {
  if (closeIcon === null || closeIcon === false) {
    return null;
  }
  return closeIcon || <CloseOutlined className={`${prefixCls}-close-icon`} />;
}
type HolderProps = NotificationConfig & {
  onAllRemoved?: VoidFunction;
};

interface HolderRef extends NotificationAPI {
  prefixCls: string;
  notification?: RcNotificationConfig;
}

const Holder = forwardRef<HolderRef, HolderProps>(function Holder(props, ref) {
  const {
    top,
    bottom,
    getContainer: staticGetContainer,
    maxCount,
    onAllRemoved,
    stack,
    duration,
    pauseOnHover = true,
    showProgress,
  } = props;

  const prefixCls = NOTIFICATION_PREFIX_CLS;

  // =============================== Style ===============================
  const getStyle = (placement: NotificationPlacement): React.CSSProperties =>
    getPlacementStyle(placement, top ?? DEFAULT_OFFSET, bottom ?? DEFAULT_OFFSET);

  function getMotion(prefixCls: string): CSSMotionProps {
    return {
      motionName: `${prefixCls}-fade`,
    };
  }

  // ============================== Motion ===============================
  const getNotificationMotion = () => getMotion(prefixCls);

  // ============================== Origin ===============================
  const [api, holder] = useRcNotification({
    prefixCls,
    style: getStyle,
    motion: getNotificationMotion,
    closable: true,
    closeIcon: getCloseIcon(prefixCls),
    duration: duration ?? DEFAULT_DURATION,
    getContainer: () => staticGetContainer?.() || document.body,
    maxCount,
    pauseOnHover,
    showProgress,
    onAllRemoved,
  });

  // ================================ Ref ================================
  useImperativeHandle(ref, () => ({ ...api, prefixCls }));

  return holder;
});

export function useInternalNotification(
  notificationConfig?: HolderProps,
): readonly [NotificationInstance, React.ReactElement] {
  const holderRef = useRef<HolderRef>(null);

  // ================================ API ================================
  const wrapAPI = useMemo<NotificationInstance>(() => {
    // Wrap with notification content

    // >>> Open
    const open = (config: NotificationArgsProps) => {
      if (!holderRef.current) {
        return;
      }

      const { open: originOpen, prefixCls, notification } = holderRef.current;

      const noticePrefixCls = `${prefixCls}-notice`;

      const {
        message,
        description,
        icon,
        type,
        btn,
        className,
        style,
        role = 'alert',
        closeIcon,
        closable,
        ...restConfig
      } = config;

      const realCloseIcon = getCloseIcon(
        noticePrefixCls,
        typeof closeIcon !== 'undefined' ? closeIcon : notification?.closeIcon,
      );

      return originOpen({
        // use placement from props instead of hard-coding "topRight"
        placement: notificationConfig?.placement ?? DEFAULT_PLACEMENT,
        ...restConfig,
        content: (
          <PureContent
            prefixCls={noticePrefixCls}
            icon={icon}
            type={type}
            message={message}
            description={description}
            btn={btn}
            role={role}
          />
        ),
        className: classNames(
          type && `${noticePrefixCls}-${type}`,
          className,
          notification?.className,
        ),
        style: { ...notification?.style, ...style },
        closeIcon: realCloseIcon,
        closable: closable ?? !!realCloseIcon,
      });
    };

    // >>> destroy
    const destroy = (key?: React.Key) => {
      if (key !== undefined) {
        holderRef.current?.close(key);
      } else {
        holderRef.current?.destroy();
      }
    };

    const clone = {
      open,
      destroy,
    } as NotificationInstance;

    const keys = ['success', 'info', 'warning', 'error'] as const;
    keys.forEach((type) => {
      clone[type] = (config) =>
        open({
          ...config,
          type,
        });
    });

    return clone;
  }, [notificationConfig?.placement]);

  // ============================== Return ===============================
  return [
    wrapAPI,
    <Holder key="notification-holder" {...notificationConfig} ref={holderRef} />,
  ] as const;
}
