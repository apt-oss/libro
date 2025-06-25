import assert from 'assert';
import 'reflect-metadata';

import { prop, ObservableProperties, Observability, origin } from './index.js';

describe('decorator', () => {
  it('#prop', () => {
    class Foo {
      @prop()
      name?: string;
    }

    class FooExt extends Foo {
      @prop()
      info?: string;
    }
    class FooExtExt extends FooExt {}
    const foo = new Foo();
    const properties = ObservableProperties.getOwn(Foo);
    assert(properties?.length === 1 && properties.includes('name'));
    const extProperties = ObservableProperties.getOwn(FooExt);
    assert(extProperties?.length === 2 && extProperties.includes('info'));
    const extextProperties = ObservableProperties.get(FooExtExt);
    assert(extextProperties?.length === 2);
    const instanceProperties = ObservableProperties.find(foo);
    assert(instanceProperties?.length === 1 && instanceProperties.includes('name'));
  });
  it('#origin', () => {
    class Foo {
      @origin()
      a?: string;
      b?: string;
    }
    class Bar extends Foo {}

    const foo = new Foo();
    const bar = new Bar();
    assert(Observability.shouldKeepOrigin(foo, 'a'));
    assert(Observability.shouldKeepOrigin(bar, 'a'));
  });
});
