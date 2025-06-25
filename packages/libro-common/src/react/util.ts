import { defaultPrefixCls } from './constant.js';

export const getPrefixCls = (suffixCls?: string) => {
  return suffixCls ? `${defaultPrefixCls}-${suffixCls}` : defaultPrefixCls;
};
