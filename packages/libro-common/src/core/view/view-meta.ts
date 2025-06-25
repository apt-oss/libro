import { getOrigin } from '../../observable/index.js';
import type { ManaContext } from '../module/index.js';

import type { View } from './view-protocol.js';
import { ViewContextMetaKey } from './view-protocol.js';

/**
 * View metadata
 * 提供静态方法，用于获取和设置视图的上下文
 */
export class ViewMeta {
  static setViewContext(view: View, context: ManaContext) {
    Reflect.defineMetadata(ViewContextMetaKey, getOrigin(context), getOrigin(view));
  }

  static getViewContext(view: View) {
    return Reflect.getMetadata(ViewContextMetaKey, getOrigin(view)) as ManaContext;
  }

  static removeViewContext(view: View) {
    Reflect.deleteMetadata(ViewContextMetaKey, getOrigin(view));
  }
}
