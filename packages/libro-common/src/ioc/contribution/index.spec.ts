/* eslint-disable @typescript-eslint/no-explicit-any */

import 'reflect-metadata';
import assert from 'assert';

import { GlobalContainer } from '../container.js';
import { register } from '../container.js';
import { Syringe } from '../core.js';
import { inject, singleton } from '../decorator.js';
import { Module } from '../module/index.js';

import { DefaultContributionProvider } from './contribution-provider.js';

import { ContributionOptionConfig } from './index.js';
import { Contribution, contrib } from './index.js';

describe('contribution', () => {
  it('#register contribution', () => {
    const FooContribution = Syringe.defineToken('FooContribution');
    Contribution.register(register, FooContribution);
    const provider = GlobalContainer.getNamed(Contribution.Provider, FooContribution);
    assert(provider instanceof DefaultContributionProvider);
    assert(GlobalContainer.isBoundNamed(Contribution.Provider, FooContribution));
  });
  it('#contrib decorator', () => {
    const FooContribution = Syringe.defineToken('FooContribution');
    const BarContribution = Syringe.defineToken('BarContribution');
    Contribution.register(register, FooContribution);
    @singleton({ contrib: FooContribution })
    class Foo {}
    @singleton({ contrib: [FooContribution, BarContribution] })
    class Foo1 {}
    register(Foo);
    register(Foo1);
    @singleton()
    class Bar {
      public contribs: Contribution.Provider<any>;
      public bar: Contribution.Provider<any>;

      constructor(
        @contrib(FooContribution) contribs: Contribution.Provider<any>,
        @inject(BarContribution) bar: Contribution.Provider<any>,
      ) {
        this.contribs = contribs;
        this.bar = bar;
      }
    }
    register(Bar);

    const bar = GlobalContainer.get(Bar);
    const list = bar.contribs.getContributions();
    assert(bar.bar instanceof Foo1);
    assert(list.length === 2);
    assert(list.find((item) => item instanceof Foo));
  });
  it('#contribution option', () => {
    const FooContribution = Syringe.defineToken('FooContribution');
    @singleton({ contrib: FooContribution })
    class Foo {}
    register(Foo);
    const childContainer = GlobalContainer.createChild();
    Contribution.register(
      childContainer.register.bind(childContainer),
      FooContribution,
      {
        cache: true,
      },
    );
    @singleton()
    class Bar {
      public pr: Contribution.Provider<any>;
      constructor(@contrib(FooContribution) pr: Contribution.Provider<any>) {
        this.pr = pr;
      }
    }
    childContainer.register(Bar);
    @singleton({ contrib: FooContribution })
    class Foo1 {}
    childContainer.register(Foo1);

    const bar = childContainer.get(Bar);
    const list = bar.pr.getContributions();

    assert(list.length === 1);
    assert(list.find((item) => item instanceof Foo1));
    const cachelist = bar.pr.getContributions();
    assert(list === cachelist);
    const newlist = bar.pr.getContributions({ cache: false });
    assert(list !== newlist && newlist.length === 1);
    assert(newlist.find((item) => item instanceof Foo1));
    const all = bar.pr.getContributions({ recursive: true, cache: false });
    assert(all !== newlist && all.length === 2);
    assert(all.find((item) => item instanceof Foo));
    assert(all.find((item) => item instanceof Foo1));
  });

  it('#contribution event', () => {
    const FooContribution = Syringe.defineToken('FooContribution');
    @singleton({ contrib: FooContribution })
    class Foo {}
    register(Foo);
    const childContainer = GlobalContainer.createChild();
    Contribution.register(
      childContainer.register.bind(childContainer),
      FooContribution,
      {
        cache: true,
      },
    );
    @singleton()
    class Bar {
      contributionChanged = false;
      public pr: Contribution.Provider<any>;
      constructor(@contrib(FooContribution) pr: Contribution.Provider<any>) {
        this.pr = pr;
        this.pr.onChanged(() => {
          this.contributionChanged = true;
        });
      }
    }
    childContainer.register(Bar);
    const bar = childContainer.get(Bar);

    @singleton({ contrib: FooContribution })
    class Foo1 {}
    childContainer.register(Foo1);

    assert(bar.contributionChanged);
  });

  it('#contirbution config', () => {
    ContributionOptionConfig.recursive = true;
    const p = GlobalContainer.createChild();
    const fooContainer = p.createChild();
    const barContainer = p.createChild();
    const DemoContribution = Syringe.defineToken('FooContribution');
    interface DemoContribution {
      name: string;
    }
    @singleton({ contrib: DemoContribution })
    class Foo implements DemoContribution {
      name = 'foo';
    }

    @singleton({ contrib: DemoContribution })
    class Bar implements DemoContribution {
      name = 'bar';
    }

    @singleton({ contrib: DemoContribution })
    class Baz implements DemoContribution {
      name = 'baz';
    }
    const BazModule = Module().register(Baz);
    const FooModule = Module().register(Foo).contribution(DemoContribution);
    const BarModule = Module().register(Bar).contribution(DemoContribution);
    p.load(BazModule);
    fooContainer.load(FooModule);
    barContainer.load(BarModule);
    const fooProvider = fooContainer.getNamed<Contribution.Provider<DemoContribution>>(
      Contribution.Provider,
      DemoContribution,
    );
    const barProvider = barContainer.getNamed<Contribution.Provider<DemoContribution>>(
      Contribution.Provider,
      DemoContribution,
    );
    const foos = fooProvider.getContributions();
    assert(foos.length === 2);
    assert(foos.find((item) => item.name === 'foo'));
    assert(foos.find((item) => item.name === 'baz'));
    assert(barProvider.getContributions().length === 2);
  });
});
