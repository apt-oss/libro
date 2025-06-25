import assert from 'assert';

import { Syringe } from './core.js';
import { singleton, transient, injectable } from './decorator.js';

describe('decorator', () => {
  it('#injectable without option', () => {
    @injectable()
    class Foo {}
    const option = Reflect.getMetadata(Syringe.ClassOptionSymbol, Foo);
    assert(option.target === Foo);
  });
  it('#injectable with option', () => {
    const FooSymbol = Symbol('FooSymbol');
    @injectable({ token: FooSymbol, lifecycle: Syringe.Lifecycle.singleton })
    class Foo {}
    const option: Syringe.DecoratorOption<Foo> = Reflect.getMetadata(
      Syringe.ClassOptionSymbol,
      Foo,
    );
    assert(option.token === FooSymbol);
  });
  it('#singleton', () => {
    const FooSymbol = Symbol('FooSymbol');
    @singleton({ token: FooSymbol })
    class Foo {}
    const option: Syringe.InjectOption<Foo> = Reflect.getMetadata(
      Syringe.ClassOptionSymbol,
      Foo,
    );
    assert(option.lifecycle === Syringe.Lifecycle.singleton);
  });
  it('#transient', () => {
    const FooSymbol = Symbol('FooSymbol');
    @transient({ token: FooSymbol })
    class Foo {}
    const option: Syringe.InjectOption<Foo> = Reflect.getMetadata(
      Syringe.ClassOptionSymbol,
      Foo,
    );
    assert(option.lifecycle === Syringe.Lifecycle.transient);
  });
});
