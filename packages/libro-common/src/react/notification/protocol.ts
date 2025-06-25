import { defaultPrefixCls } from '../constant.js';

export type NotificationPlacement =
  | 'top'
  | 'topLeft'
  | 'topRight'
  | 'bottom'
  | 'bottomLeft'
  | 'bottomRight';

export type IconType = 'success' | 'info' | 'error' | 'warning';
export type BaseClosableType = { closeIcon?: React.ReactNode } & React.AriaAttributes;
export type ClosableType = boolean | BaseClosableType;

export interface NotificationArgsProps {
  message: React.ReactNode;
  description?: React.ReactNode;
  btn?: React.ReactNode;
  key?: React.Key;
  onClose?: () => void;
  duration?: number | null;
  showProgress?: boolean;
  pauseOnHover?: boolean;
  icon?: React.ReactNode;
  placement?: NotificationPlacement;
  style?: React.CSSProperties;
  className?: string;
  readonly type?: IconType;
  onClick?: () => void;
  closeIcon?: React.ReactNode;
  closable?: ClosableType;
  props?: React.HTMLProps<HTMLDivElement>;
  role?: 'alert' | 'status';
}

type StaticFn = (args: NotificationArgsProps) => void;

export interface NotificationInstance {
  success: StaticFn;
  error: StaticFn;
  info: StaticFn;
  warning: StaticFn;
  open: StaticFn;
  destroy(key?: React.Key): void;
}

export interface GlobalConfigProps {
  top?: number;
  bottom?: number;
  duration?: number;
  showProgress?: boolean;
  pauseOnHover?: boolean;
  prefixCls?: string;
  getContainer?: () => HTMLElement | ShadowRoot;
  placement?: NotificationPlacement;
  closeIcon?: React.ReactNode;
  closable?: ClosableType;
  rtl?: boolean;
  maxCount?: number;
  props?: React.HTMLProps<HTMLDivElement>;
}
export interface NotificationConfig {
  top?: number;
  bottom?: number;
  prefixCls?: string;
  getContainer?: () => HTMLElement | ShadowRoot;
  placement?: NotificationPlacement;
  maxCount?: number;
  rtl?: boolean;
  stack?: boolean | { threshold?: number };
  duration?: number;
  showProgress?: boolean;
  pauseOnHover?: boolean;
}

export const DEFAULT_TOP = 24;
export const DEFAULT_BOTTOM = 24;
export const DEFAULT_OFFSET = 24;
export const DEFAULT_DURATION = 4.5;
export const DEFAULT_PLACEMENT: NotificationPlacement = 'bottomRight';
export const NOTIFICATION_PREFIX_CLS = `${defaultPrefixCls}-notification`;

export function getPlacementStyle(
  placement: NotificationPlacement,
  top: number = DEFAULT_TOP,
  bottom: number = DEFAULT_BOTTOM,
) {
  let style;
  switch (placement) {
    case 'top':
      style = {
        left: '50%',
        transform: 'translateX(-50%)',
        right: 'auto',
        top,
        bottom: 'auto',
      };
      break;
    case 'topLeft':
      style = {
        left: 0,
        top,
        bottom: 'auto',
      };
      break;
    case 'topRight':
      style = {
        right: 0,
        top,
        bottom: 'auto',
      };
      break;
    case 'bottom':
      style = {
        left: '50%',
        transform: 'translateX(-50%)',
        right: 'auto',
        top: 'auto',
        bottom,
      };
      break;
    case 'bottomLeft':
      style = {
        left: 0,
        top: 'auto',
        bottom,
      };
      break;
    default:
      style = {
        right: 0,
        top: 'auto',
        bottom,
      };
      break;
  }
  return style;
}
