import type * as React from 'react';

import { transient } from '../../ioc/index.js';
import { prop } from '../../observable/index.js';

import type { View } from './view-protocol.js';
import type { Title } from './view-protocol.js';

@transient()
export class ViewTitle implements Title<View> {
  owner: View;
  @prop()
  label?: React.ReactNode | React.FC;
  @prop()
  icon?: React.ReactNode | React.FC;
  @prop()
  caption?: string;
  @prop()
  className?: string;
  @prop()
  closable?: boolean = true;
  constructor(owner: View) {
    this.owner = owner;
  }
}
