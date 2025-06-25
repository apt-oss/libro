import assert from 'assert';

import { Disposable } from '../common/index.js';

import {
  equals,
  ObservableSymbol,
  ObservableProperties,
  Observability,
  InstanceValue,
} from './index.js';

describe('utils', () => {
  it('#Observability', () => {
    class Foo {
      info = '';
      element = (<div></div>);
    }
    const foo = new Foo();
    const meta = 'meta';
    Observability.setDisposable(meta, Disposable.NONE, foo);
    Observability.setDisposable(meta, Disposable.NONE, foo, 'info');
    const toDispose = Observability.getDisposable(meta, foo);
    const toDispose1 = Observability.getDisposable(meta, foo, 'info');
    const fooProxy = new Proxy(foo, {
      get: (target, propertyKey) => {
        if (propertyKey === ObservableSymbol.Self) {
          return target;
        }
        return (target as any)[propertyKey];
      },
    });

    assert(toDispose === Disposable.NONE);
    assert(toDispose1 === Disposable.NONE);
    assert(Observability.getOrigin(fooProxy) === foo);
    assert(equals(fooProxy, foo));
    assert(Observability.getOrigin(null) === null);
    assert(!Observability.canBeObservable(null));
    assert(!Observability.marked(null, 'name'));
    assert(Observability.canBeObservable({}));
    assert(!Observability.canBeObservable(new WeakMap()));
    assert(!Observability.canBeObservable(Promise.resolve()));
    assert(!Observability.canBeObservable(foo.element));

    const arr: any[] = [];
    const frozen = Object.freeze([]);
    assert(Observability.canBeObservable(arr));
    assert(!Observability.canBeObservable(frozen));

    Observability.mark(foo, 'info');
    Observability.mark(foo);
    assert(Observability.marked(foo, 'info'));
    assert(Observability.marked(foo));
    assert(Observability.canBeObservable(foo));
  });
  it('#ObservableProperties', () => {
    class ClassBasic {
      name = '';
    }
    class ClassBasic1 extends ClassBasic {
      name1 = '';
    }
    const instanceBasic = new ClassBasic();
    let properties = ObservableProperties.get(instanceBasic);
    assert(!properties);
    ObservableProperties.add(ClassBasic, 'name');
    properties = ObservableProperties.get(ClassBasic);
    assert(properties?.length === 1);
    assert(properties.includes('name'));
    ObservableProperties.add(ClassBasic1, 'name1');
    properties = ObservableProperties.get(ClassBasic1);
    assert(properties?.length === 2);
    assert(properties.includes('name1'));
    properties = ObservableProperties.get(instanceBasic);
    assert(!properties);
    assert(!ObservableProperties.find({}));
    assert(!ObservableProperties.find(null as any));
    const instanceProperties = ObservableProperties.find(instanceBasic) || [];
    assert(instanceProperties.includes('name'));
    instanceProperties.forEach((property) => {
      ObservableProperties.add(instanceBasic, property);
    });
    properties = ObservableProperties.getOwn(instanceBasic);
    assert(properties?.length === 1);
  });

  it('#InstanceValue', () => {
    const foo = {};
    InstanceValue.set(foo, 'name', 'foo');
    assert(InstanceValue.get(foo, 'name') === 'foo');
  });
});
