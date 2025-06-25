/* eslint-disable @typescript-eslint/no-explicit-any */

import 'reflect-metadata';
import assert from 'assert';

import { injectable } from 'inversify';

import { Event } from '../../common/index.js';
import { GlobalContainer } from '../container.js';
import { Syringe } from '../core.js';
import { Register } from '../register.js';

import { bindSingleton, bindTransient, bindLifecycle, isInversifyContext } from '.';

const fakeContainer: Syringe.Container = {
  register: () => {
    //
  },
  remove: () => {
    //
  },
  load: () => ({
    dispose: () => {
      //
    },
  }),
  unload: () => {
    //
  },
  get: () => ({}) as any,
  getNamed: () => ({}) as any,
  getAll: () => [],
  getAllNamed: () => [],
  isBound: () => false,
  isBoundNamed: () => false,
  createChild: () => fakeContainer,
  onModuleChanged: Event.None,
  onRegistered: Event.None,
};
const emptyOptions: Syringe.FormattedInjectOption<any> = {
  token: [],
  useDynamic: [],
  lifecycle: Syringe.Lifecycle.singleton,
  useClass: [],
  contrib: [],
  useFactory: [],
};

describe('inversify', () => {
  it('#global container', () => {
    assert(GlobalContainer);
    assert(isInversifyContext(GlobalContainer));
  });
  it('#bind singleton', () => {
    @injectable()
    class Foo {}
    bindSingleton<Foo>(GlobalContainer.container.bind(Foo).toSelf());
    const foo1 = GlobalContainer.get(Foo);
    const foo2 = GlobalContainer.get(Foo);
    assert(foo1 === foo2);
  });
  it('#bind transient', () => {
    @injectable()
    class Foo {}
    bindTransient<Foo>(GlobalContainer.container.bind(Foo).toSelf());
    const foo1 = GlobalContainer.get(Foo);
    const foo2 = GlobalContainer.get(Foo);
    assert(foo1 !== foo2);
  });
  it('#bind lifecycle', () => {
    @injectable()
    class Foo {}
    bindLifecycle<Foo>(GlobalContainer.container.bind(Foo).to(Foo), {
      ...emptyOptions,
      lifecycle: Syringe.Lifecycle.singleton,
      useClass: [Foo],
      token: [Foo],
    });
    const foo1 = GlobalContainer.get(Foo);
    const foo2 = GlobalContainer.get(Foo);
    assert(foo1 === foo2);
  });
  it('#bind factory', () => {
    const FooFactory = Symbol('FooFactory');
    @injectable()
    class Foo {}
    Register.resolveOption(GlobalContainer, {
      ...emptyOptions,
      token: [FooFactory],
      useFactory: [() => () => new Foo()],
      lifecycle: Syringe.Lifecycle.singleton,
    });
    const fooFactory = GlobalContainer.get<() => Foo>(FooFactory);
    const foo = fooFactory();
    assert(foo instanceof Foo);
  });

  it('#bind value', () => {
    const Foo = Symbol('Foo');
    const Bar = Symbol('Bar');
    const foo = {};
    Register.resolveOption(GlobalContainer, {
      ...emptyOptions,
      token: [Foo],
      useValue: foo,
      lifecycle: Syringe.Lifecycle.singleton,
    });
    Register.resolveOption(GlobalContainer, {
      ...emptyOptions,
      token: [Bar],
      useValue: false,
      lifecycle: Syringe.Lifecycle.singleton,
    });
    const fooValue = GlobalContainer.get<any>(Foo);
    const barValue = GlobalContainer.get<any>(Bar);
    assert(fooValue === foo);
    assert(barValue === false);
  });

  it('#bind named value', () => {
    const Foo = Symbol('Foo');
    const named = 'named';
    const foo = {};
    Register.resolveOption(GlobalContainer, {
      ...emptyOptions,
      token: [{ token: Foo, named }],
      useValue: foo,
      lifecycle: Syringe.Lifecycle.singleton,
    });
    const fooValue = GlobalContainer.getNamed<any>(Foo, named);
    assert(fooValue === foo);
  });

  it('#bind named factory', () => {
    const FooFactory = Symbol('FooFactory');
    const named = 'named';
    @injectable()
    class Foo {}
    Register.resolveOption(GlobalContainer, {
      ...emptyOptions,
      token: [{ token: FooFactory, named }],
      useFactory: [() => () => new Foo()],
      lifecycle: Syringe.Lifecycle.singleton,
    });
    const fooFactory = GlobalContainer.getNamed<() => Foo>(FooFactory, named);
    const foo = fooFactory();
    assert(foo instanceof Foo);
  });
  it('#bind dynamic', () => {
    const FooDynamic = Symbol('FooDynamic');
    @injectable()
    class Foo {}
    Register.resolveOption(GlobalContainer, {
      ...emptyOptions,
      token: [FooDynamic],
      useDynamic: [() => new Foo()],
      lifecycle: Syringe.Lifecycle.singleton,
    });
    const foo = GlobalContainer.get<Foo>(FooDynamic);
    assert(foo instanceof Foo);
  });
  it('#bind named dynamic', () => {
    const FooDynamic = Symbol('FooDynamic');
    const named = 'named';
    @injectable()
    class Foo {}
    Register.resolveOption(GlobalContainer, {
      ...emptyOptions,
      token: [{ token: FooDynamic, named }],
      useDynamic: [() => new Foo()],
      lifecycle: Syringe.Lifecycle.singleton,
    });
    const foo = GlobalContainer.getNamed<Foo>(FooDynamic, named);
    assert(foo instanceof Foo);
  });
  it('#bind named', () => {
    @injectable()
    class Foo {}
    Register.resolveOption<Foo>(GlobalContainer, {
      ...emptyOptions,
      token: [{ token: Foo, named: 'named' }],
      lifecycle: Syringe.Lifecycle.singleton,
      useClass: [Foo],
    });
    const foo1 = GlobalContainer.getNamed(Foo, 'named');
    const foo2 = GlobalContainer.getNamed(Foo, 'named');
    assert(foo1 && foo1 === foo2);
  });
  it('#bind', () => {
    @injectable()
    class Foo {}
    Register.resolveOption<Foo>(GlobalContainer, {
      ...emptyOptions,
      lifecycle: Syringe.Lifecycle.singleton,
      useClass: [Foo],
      token: [Foo],
    });
    const foo1 = GlobalContainer.get(Foo);
    const foo2 = GlobalContainer.get(Foo);
    assert(foo1 === foo2);
  });

  it('#bind with error ', () => {
    @injectable()
    class Foo {}
    try {
      Register.resolveOption<Foo>(fakeContainer as any, {
        ...emptyOptions,
        lifecycle: Syringe.Lifecycle.singleton,
        useClass: [Foo],
        token: [Foo],
      });
      Register.resolveOption<Foo>(fakeContainer as any, {
        ...emptyOptions,
        lifecycle: Syringe.Lifecycle.singleton,
        useClass: [Foo],
        token: [Foo],
      });
      assert(true);
    } catch {
      assert(false);
    }
  });
});
