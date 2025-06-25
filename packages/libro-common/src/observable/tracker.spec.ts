/* eslint-disable @typescript-eslint/no-explicit-any */
import assert from 'assert';

import { noop } from '../common/index.js';

import {
  prop,
  origin,
  Trackable,
  Tracker,
  Observability,
  Notifier,
  tryInvokeGetter,
} from './index.js';

describe('Tracker', () => {
  it('#trackable', () => {
    const originList: string[] = [];
    const originMap = new Map();
    const originObj = {};
    const originWeakMap = new WeakMap();
    const originPromise = Promise.resolve();
    class Foo {
      @prop()
      list = originList;
      @prop()
      map = originMap;
      @prop()
      obj = originObj;

      @prop()
      weakMap = originWeakMap;

      @prop()
      promise = originPromise;
    }
    const foo = new Foo();
    const callback = () => {
      //
    };
    const f = Tracker.track(foo, callback);
    const f1 = Tracker.track(foo, callback);
    assert(f === f1);
    assert(Trackable.is(f));
    assert(Observability.getOrigin(f) === foo);
    assert(Observability.getOrigin(f.list) === originList);
    assert(Observability.getOrigin(f.map) === originMap);
    assert(Observability.getOrigin(f.obj) === originObj);
    assert(f.weakMap === originWeakMap);
    assert(f.promise === originPromise);
    assert(Trackable.tryGetOrigin(f) === foo);
    assert(null === Trackable.tryGetOrigin(null));
  });
  it('#track basic', () => {
    class Foo {
      @prop() info = '';
    }
    const foo = new Foo();
    let changeTimes = 0;
    const reaction = () => {
      changeTimes += 1;
    };
    const f = Tracker.track(foo, reaction);
    f.info;
    f.info = 'foo';
    assert(f !== foo);
    assert(Trackable.tryGetOrigin(f) === foo);
    assert(
      Tracker.track(null as any, () => {
        //
      }) === null,
    );
    const empty = {};
    assert(
      Tracker.track(empty, () => {
        //
      }) !== empty,
    );
    const f1 = Tracker.track(f, reaction);
    f1.info;
    f1.info = 'foo1';
    assert(changeTimes === 2);
  });

  it('#track observable deep', () => {
    class Foo {
      @prop() info = '';
    }
    class Bar {
      foo = new Foo();
    }
    const bar = new Bar();
    let changeTimes = 0;
    const reaction = () => {
      changeTimes += 1;
    };
    const b = Tracker.track(bar, reaction);
    b.foo.info;
    // bar.foo.info = 'foo';
    b.foo.info = 'foo';
    assert(changeTimes === 1);
  });

  it('#track by function', () => {
    class Foo {
      @prop() info = '';
      @prop() info1 = '';
      get infoLength() {
        return this.info.length;
      }
      getInfoLength() {
        return this.info1.length;
      }
    }
    const foo = new Foo();
    let changeTimes = 0;
    const reaction = () => {
      changeTimes += 1;
    };
    const f = Tracker.track(foo, reaction);
    f.infoLength;
    f.info = 'foo';
    f.getInfoLength();
    f.info1 = 'foo1';
    assert(changeTimes === 2);
  });

  it('#track reactable array', () => {
    class Foo {
      @prop() info = '';
    }
    class Bar {
      @prop() list: Foo[] = [];
    }
    const bar = new Bar();
    const foo = new Foo();
    bar.list.push(foo);
    bar.list.push(new Foo());
    let changeTimes = 0;
    const reaction = () => {
      changeTimes += 1;
    };
    const b = Tracker.track(bar, reaction);
    b.list.filter((item) => item.info.length > 0);
    foo.info = 'foo';
    assert(b.list === b.list);
    assert(changeTimes === 1);
  });

  it('#track reactable map', () => {
    class Foo {
      @prop() info = '';
    }
    class Bar {
      @prop() map = new Map<string, Foo | undefined>();
    }
    const bar = new Bar();
    const foo = new Foo();
    bar.map.set('foo', foo);
    bar.map.set('empty', undefined);
    let changeTimes = 0;
    const reaction = () => {
      changeTimes += 1;
    };
    const b = Tracker.track(bar, reaction);
    for (const key of b.map.keys()) {
      b.map.get(key)?.info;
    }
    foo.info = 'foo';
    assert(b.map === b.map);
    assert(changeTimes === 1);
  });

  it('#track reactable object', () => {
    class Foo {
      @prop() info = '';
    }
    class Bar {
      @prop() obj: { foo: Foo | undefined; bar: Foo | undefined } = {
        foo: undefined,
        bar: undefined,
      };
    }
    const bar = new Bar();
    const foo = new Foo();
    let changeTimes = 0;
    const reaction = () => {
      changeTimes += 1;
    };
    const b = Tracker.track(bar, reaction);
    b.obj.bar?.info;
    bar.obj.foo = foo;
    b.obj.foo && b.obj.foo.info;
    foo.info = 'foo';
    assert(b.obj === b.obj);
    assert(changeTimes === 2);
  });

  it('#track deep', () => {
    class Foo {
      @prop() info = '';
    }
    class Bar {
      foo = new Foo();
    }
    const info = { bar: new Bar() };
    let changeTimes = 0;
    const reaction = () => {
      changeTimes += 1;
    };
    const i = Tracker.track(info, reaction);
    i.bar.foo.info;
    i.bar.foo.info = 'foo';
    assert(changeTimes === 1);
  });

  it('#tracker transform', () => {
    assert(
      Tracker.tramsform(null as any, () => {
        //
      }) === null,
    );
  });

  it('#track plain object', () => {
    const info = { name: 'info', age: 18 };
    let changeTimes = 0;
    const reaction = () => {
      changeTimes += 1;
    };
    const i = Tracker.track(info, reaction);
    i.name = 'foo';
    assert(changeTimes === 1);
  });
  it('#track array', () => {
    const arr: any[] = ['track array'];
    let changeTimes = 0;
    const reaction = () => {
      Tracker.track(arr, reaction);
      changeTimes += 1;
    };
    const a = Tracker.track(arr, reaction);
    const a1 = Tracker.track(arr, reaction);
    assert(a === a1);
    a.push('a');
    a1.push('a1');
    const a2 = Tracker.track(arr, reaction);
    a2.push('a2');
    assert(changeTimes === 6);
  });

  it('#track map', () => {
    const map = new Map<string, string>();
    let changeTimes = 0;
    const reaction = () => {
      Tracker.track(map, reaction);
      changeTimes += 1;
    };
    const a = Tracker.track(map, reaction);
    const a1 = Tracker.track(map, reaction);
    assert(a === a1);
    a1.set('a', 'a');
    a1.set('a1', 'a1');
    assert(changeTimes === 2);
  });

  it('#track plainObject', () => {
    const obj: Record<string, any> = {};
    let changeTimes = 0;
    const reaction = () => {
      Tracker.track(obj, reaction);
      changeTimes += 1;
    };
    const a = Tracker.track(obj, reaction);
    const a1 = Tracker.track(obj, reaction);
    assert(a === a1);
    a['a'] = 'a';
    a1['a1'] = 'a1';
    assert(changeTimes === 2);
  });

  it('#track plainObject deep', () => {
    const obj: Record<string, any> = {};
    obj['info'] = { a: { b: { c: {} } } };
    obj['arr'] = [];
    let changeTimes = 0;
    const reaction = () => {
      Tracker.track(obj, reaction);
      changeTimes += 1;
    };
    const a = Tracker.track(obj, reaction);
    const a1 = Tracker.track(obj, reaction);
    assert(a === a1);
    a['a'] = 'a';
    a1['info'].a1 = 'a1';
    a1['info'].a.b.c = 'c';
    a1['arr'].push('a');
    assert(changeTimes === 4);
  });
  it('#track plainObject deep with class instance', () => {
    class Foo {
      @prop() info = '';
      @prop() info1 = '';
    }
    const obj: Record<string, any> = {};
    obj['foo'] = new Foo();
    let changeTimes = 0;
    const reaction = () => {
      const object = Tracker.track(obj, reaction);
      object['foo'].info;
      changeTimes += 1;
    };
    const a = Tracker.track(obj, reaction);
    const a1 = Tracker.track(obj, reaction);
    a1['foo'].info;
    assert(a === a1);
    a1['foo'].info = 'a';
    a1['foo'].info1 = 'a1';
    assert(changeTimes === 1);
  });

  it('#track class instance deep with arr', () => {
    class Bar {
      @prop() name = '';
    }
    class Foo {
      @prop() arr: Bar[] = [];
    }
    const foo = new Foo();
    let changeTimes = 0;
    const reaction = () => {
      const trackable = Tracker.track(foo, reaction);
      trackable.arr.forEach((item) => item.name);
      changeTimes += 1;
    };
    const a = Tracker.track(foo, reaction);
    const a1 = Tracker.track(foo, reaction);
    assert(a === a1);
    a.arr.forEach((item) => item.name);
    a.arr.push(new Bar()); // 2
    a1.arr.push(new Bar()); // 4
    a.arr[0].name = 'a'; // 5
    assert(changeTimes === 5);
  });

  it('#track class instance with normal arr', () => {
    class Foo {
      arr: string[] = [];
    }
    const foo = new Foo();
    let changeTimes = 0;
    const reaction = () => {
      const trackable = Tracker.track(foo, reaction);
      trackable.arr;
      changeTimes += 1;
    };
    const a = Tracker.track(foo, reaction);
    const a1 = Tracker.track(foo, reaction);
    assert(a === a1);
    a.arr.push('a'); // 0
    a1.arr.push('b'); // 0
    assert(changeTimes === 0);
  });

  it('#track unobservable array property', () => {
    class Foo {
      map = new Map<string, string>();
      getArr() {
        return this.map;
      }
    }
    const foo = new Foo();
    let changeTimes = 0;
    const reaction = () => {
      const trackable = Tracker.track(foo, reaction);
      trackable.getArr();
      changeTimes += 1;
    };
    const a = Tracker.track(foo, reaction);
    const a1 = Tracker.track(foo, reaction);
    assert(a === a1);
    a.getArr().set('a', 'a');
    a1.getArr().set('a1', 'a1');
    const valueA = a1.getArr().get('a');
    assert(changeTimes === 0);
    assert(valueA === 'a');
  });

  it('#track observable array property', () => {
    class Bar {
      @prop() count = 0;
    }
    class Foo {
      @prop() arr: Bar[] = [];
    }
    const foo = new Foo();
    let changeCount = 0;
    const reaction = () => {
      const trackable = Tracker.track(foo, reaction);
      trackable.arr;
      changeCount += 1;
    };
    reaction(); // 1
    foo.arr.push(new Bar()); // 3
    foo.arr.push(new Bar()); // 5
    foo.arr.push(new Bar()); // 7
    assert(changeCount === 7);
  });

  it('#deep track observable array property', () => {
    class Bar {
      @prop() count = 0;
    }
    class Foo {
      @prop() arr: Bar[] = [];
    }
    const foo = new Foo();
    let changeCount = 0;
    const reaction = () => {
      const trackable = Tracker.track(foo, reaction);
      for (let i = 0; i < trackable.arr.length; i++) {
        trackable.arr[i]?.count;
      }
      changeCount += 1;
    };
    reaction(); // 1
    foo.arr.push(new Bar()); // 3
    foo.arr.push(new Bar()); // 5
    foo.arr.push(new Bar()); // 7
    const obj = foo.arr[0];
    if (obj) {
      obj.count = 1; // 8
    }
    assert(changeCount === 8);
  });
  it('#track observable map property', () => {
    class Foo {
      @prop() objMap = new Map<string, { count: number }>();
    }
    const foo = new Foo();
    let changeCount = 0;
    const reaction = () => {
      const trackable = Tracker.track(foo, reaction);
      trackable.objMap;
      changeCount += 1;
    };
    reaction(); // 1
    foo.objMap.set('a', { count: 1 }); // 2
    foo.objMap.set('b', { count: 2 }); // 3
    foo.objMap.set('c', { count: 3 }); // 4
    assert(changeCount === 4);
  });
  it('#deep track observable map property', () => {
    class Foo {
      @prop() objMap = new Map<string, { count: number }>();
    }
    const foo = new Foo();
    let changeCount = 0;
    const reaction = () => {
      const trackable = Tracker.track(foo, reaction);
      const keys = trackable.objMap.keys();
      for (const key of keys) {
        const obj = trackable.objMap.get(key);
        obj?.count;
      }
      changeCount += 1;
    };
    reaction(); // 1
    foo.objMap.set('a', { count: 1 }); // 2
    foo.objMap.set('b', { count: 2 }); // 3
    foo.objMap.set('c', { count: 3 }); // 4
    const obj = foo.objMap.get('a');
    if (obj) {
      obj.count = 0; // 5
    }
    assert(changeCount === 5);
  });

  it('#track observable plainObject property', () => {
    class Foo {
      @prop() obj = { a: 'a', b: { c: 'c', d: {} } };
    }
    const foo = new Foo();
    let changeCount = 0;
    const reaction = () => {
      const trackable = Tracker.track(foo, reaction);
      trackable.obj.a;
      trackable.obj.b.c;
      changeCount += 1;
    };
    reaction(); // 1
    foo.obj.a = 'aa'; // 2
    foo.obj.b.c = 'cc'; // 3
    assert(changeCount === 3);
  });
  it('#deep track observable plainObject property', () => {
    class Bar {
      @prop() count = 0;
    }
    class Foo {
      @prop() obj = { a: 'a', b: new Bar() };
    }
    const foo = new Foo();
    let changeCount = 0;
    const reaction = () => {
      const trackable = Tracker.track(foo, reaction);
      trackable.obj.a;
      trackable.obj.b.count;
      changeCount += 1;
    };
    reaction(); // 1
    foo.obj.a = 'aa'; // 2
    foo.obj.b.count = 1; // 3
    assert(changeCount === 3);
  });
  it('#renders', () => {
    class Model {
      @prop() enabled = false;
    }
    const model = new Model();
    let changeTimes = 0;
    let changeTimes1 = 0;
    const render = () => {
      const trackable = Tracker.track(model, render);
      trackable.enabled;
      changeTimes += 1;
    };
    const render1 = () => {
      const trackable = Tracker.track(model, render1);
      trackable.enabled;
      changeTimes1 += 1;
    };
    render(); // 1
    render1(); // 1
    model.enabled = true; // 2
    assert(changeTimes === 2);
    assert(changeTimes1 === 2);
  });
  it('#track skip Date object', () => {
    const now = new Date();
    const obj = { arr: [0, 1, 2], key: 'obj', now };
    const tracked = Tracker.track(obj, noop);
    const objStr = JSON.stringify(tracked);
    assert(objStr);
  });
  it('#track skip Set object', () => {
    const set = new Set();
    const obj = { arr: [0, 1, 2], key: 'obj', set };
    const tracked = Tracker.track(obj, noop);
    const objStr = JSON.stringify(tracked);
    assert(tracked.set.add(1));
    assert(objStr);
  });

  it('#track skip RegExp object', () => {
    const reg = new RegExp('[\\w]*');
    const obj = { arr: [0, 1, 2], key: 'obj', reg };
    const tracked = Tracker.track(obj, noop);
    const objStr = JSON.stringify(tracked);
    assert(tracked.reg.test('test'));
    assert(objStr);
  });

  it('#find same notifer after track', () => {
    class Foo {
      @prop() name?: string;
    }
    const raw = new Foo();
    const tracked = Tracker.track(raw, noop);

    const event0 = Notifier.toEvent(raw, 'name');
    const event1 = Notifier.toEvent(tracked, 'name');

    assert(event0 === event1);
  });

  it('#invoke getter origin', () => {
    let baz: any = undefined;
    class Foo {
      bar() {
        if (this !== baz) {
          throw new TypeError('Illegal invocation');
        }
        return true;
      }
    }
    baz = new Foo();

    const proxyBaz = new Proxy(baz, {});
    try {
      proxyBaz.bar();
      assert(false);
    } catch (e) {
      assert(e instanceof TypeError);
      assert(e.message === 'Illegal invocation');
    }

    assert(!!tryInvokeGetter(proxyBaz.bar, proxyBaz, baz));
  });

  it('#get readonly & non-configurable property', () => {
    class Foo {}

    class Bar {
      name = 'Bar';
    }
    const foo = new Foo();
    const bar = new Bar();

    Object.defineProperty(foo, 'prop', {
      value: bar,
      writable: false,
      configurable: false,
    });

    try {
      let changeCount = 0;
      const reaction = () => {
        const trackable = Tracker.track(foo, reaction);
        if ('prop' in trackable) {
          const b = trackable['prop'] as Bar;
          b.name;
        }
        changeCount += 1;
      };
      reaction(); // 1
      assert(changeCount === 1);
    } catch (e) {
      assert(!e);
    }
  });

  it('#target frozen', () => {
    const t = {};
    const arr = [0, t];
    const map = new Map();
    const obj = { arr: [] };
    map.set('obj', t);
    class Foo {
      @prop()
      obj = obj;
      @prop()
      arr = arr;
      @prop()
      map = map;
    }

    const foo = new Foo();

    let changeCount = 0;
    let trackable: any;
    const reaction = () => {
      trackable = Tracker.track(foo, reaction);
      Object.freeze(obj);
      Object.freeze(arr);
      Object.freeze(map);
      changeCount += 1;
    };
    reaction(); // 1
    trackable.obj;
    const arr1 = trackable.obj.arr;
    const obj1 = trackable.map.get('obj');
    const t1 = trackable.arr[1];

    assert(changeCount === 1);
    assert(arr1 === obj.arr);
    assert(Observability.getOrigin(obj1) === map.get('obj'));
    assert(t1 === arr[1]);
  });

  it('#origin property', () => {
    const t = {};
    const arr = [0, t];
    const map = new Map();
    const obj = { arr: [] };
    map.set('obj', t);
    class Foo {
      @origin()
      obj = obj;
      @origin()
      arr = arr;
      @prop()
      map = map;
    }
    const foo = new Foo();

    let trackable: Foo;
    const reaction = () => {
      trackable = Tracker.track(foo, reaction);
    };
    reaction(); // 1

    assert(trackable!.arr === arr);
    assert(trackable!.map !== map);
    assert(trackable!.obj === obj);
  });
});
