import assert from 'assert';

import { register, GlobalContainer } from './container.js';
import { singleton } from './decorator.js';
import { registerSideOption } from './side-option.js';

describe('side option', () => {
  it('#side register', () => {
    const side = (target: any) => {
      registerSideOption({ token: 'side', useValue: true }, target);
    };
    @side
    @singleton()
    class Foo {}
    register(Foo);
    const foo = GlobalContainer.get(Foo);
    const sideValue = GlobalContainer.get<boolean>('side');
    assert(foo instanceof Foo && sideValue === true);
  });

  it('#class extend side option', () => {
    const side = (name: string) => {
      return (target: any) => {
        Reflect.defineMetadata('name', name, target);
      };
    };
    @side('Foo')
    @singleton()
    class Foo {}
    register(Foo);

    @side('FooBar')
    @singleton()
    class FooBar extends Foo {}
    register(FooBar);

    assert(Reflect.getMetadata('name', FooBar) === 'FooBar');
  });
});
