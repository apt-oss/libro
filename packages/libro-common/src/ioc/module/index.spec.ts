import assert from 'assert';

import {
  injectable,
  Module,
  GlobalContainer,
  Syringe,
  singleton,
  contrib,
} from '../index.js';
import type { Contribution } from '../index.js';

describe('module', () => {
  it('#load module', () => {
    @injectable()
    class Foo {}
    class Bar {}
    const module = Module().register(Foo, Bar);
    GlobalContainer.load(module);
    const foo = GlobalContainer.get(Foo);
    assert(foo instanceof Foo);
  });

  it('#check module', () => {
    @injectable()
    class Foo {}
    class Bar {}
    const module = Module().register(Foo, Bar);

    assert(Syringe.isModule(module));
    assert(!Syringe.isModule({}));
  });

  it('#load module once', () => {
    @injectable()
    class Foo {}
    const module = Module().register(Foo);
    GlobalContainer.load(module);
    GlobalContainer.load(module);
    const foo = GlobalContainer.get(Foo);
    assert(foo instanceof Foo);
  });

  it('#force load module twice', () => {
    @injectable()
    class Foo {}
    const module = Module().register(Foo);
    GlobalContainer.load(module);
    GlobalContainer.load(module, true);
    try {
      GlobalContainer.get(Foo);
    } catch (ex) {
      assert(ex);
    }
  });

  it('#register contribution in module', () => {
    const FooContribution = Syringe.defineToken('FooContribution');
    @singleton({ contrib: FooContribution })
    class Foo {}
    @singleton()
    class Bar {
      public provider: Contribution.Provider<any>;
      constructor(@contrib(FooContribution) provider: Contribution.Provider<any>) {
        this.provider = provider;
      }
    }
    const module = Module().contribution(FooContribution).register(Foo, Bar);
    GlobalContainer.load(module);
    const bar = GlobalContainer.get(Bar);
    const list = bar.provider.getContributions();
    assert(list.length === 1);
    assert(list.find((item) => item instanceof Foo));
  });
});
