import type { Contribution, Syringe } from '../../ioc/index.js';
import { contrib, inject, singleton } from '../../ioc/index.js';
import { ManaContext } from '../module/index.js';

import type { DataContextContriburtionKey } from './data-context-protocol.js';
import {
  DataContextContriburtion,
  DataContextSymbol,
} from './data-context-protocol.js';

@singleton()
export class DataContextManager {
  protected contributionMap?: Map<
    DataContextContriburtionKey,
    DataContextContriburtion
  >;
  protected contruibutions: DataContextContriburtion[] = [];
  protected contextMap: Map<any, ManaContext> = new Map();
  protected readonly provider: Contribution.Provider<DataContextContriburtion>;
  protected readonly context: Syringe.Context;

  constructor(
    @contrib(DataContextContriburtion)
    provider: Contribution.Provider<DataContextContriburtion>,
    @inject(DataContextSymbol) context: Syringe.Context,
  ) {
    this.provider = provider;
    this.context = context;
  }

  getContributionMap(): Map<DataContextContriburtionKey, DataContextContriburtion> {
    if (this.contributionMap) {
      return this.contributionMap;
    }
    this.contributionMap = new Map();
    for (const contribution of this.provider.getContributions()) {
      this.contributionMap.set(contribution.key, contribution);
      this.contruibutions.push(contribution);
    }
    return this.contributionMap;
  }

  create(contributionKey: DataContextContriburtionKey, options?: any): any {
    const contribution = this.getContributionMap().get(contributionKey);
    if (contribution) {
      const child = this.context.container.createChild();
      const ctx = new ManaContext(child);
      child.register({ token: DataContextSymbol, useDynamic: () => ctx });
      child.load(contribution.module);
      if (contribution.onCreate) {
        contribution.onCreate(ctx, options);
      }
      let key: any;
      if (contribution.getKey) {
        key = contribution.getKey(ctx, options);
      } else {
        key = ctx;
      }
      this.contextMap.set(key, ctx);
      return key;
    }
  }

  getContext(key: any) {
    return this.contextMap.get(key);
  }
}
