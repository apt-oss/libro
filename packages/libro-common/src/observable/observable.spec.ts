import 'react';
import assert from 'assert';

import {
  prop,
  Notifiable,
  Notifier,
  observable,
  Observability,
  ObservableProperties,
} from './index.js';

describe('observable', () => {
  it('#observable properties', () => {
    class Foo {
      @prop() name = '';
    }
    const foo = observable(new Foo());
    const instanceBasic = observable(foo);
    const nullInstance = observable(null as any);
    assert(!Observability.marked(nullInstance));
    assert(Observability.marked(instanceBasic));
    assert(Observability.marked(instanceBasic, 'name'));
    assert(ObservableProperties.get(instanceBasic)?.includes('name'));
  });
  it('#extends properties', () => {
    class ClassBasic {
      @prop() name = '';
      name1 = '';
      name2 = '';
    }
    class ClassBasic1 extends ClassBasic {
      @prop() override name1 = '';
    }
    class ClassBasic2 extends ClassBasic1 {
      override name1 = '';
      @prop() override name2 = '';
    }
    const instanceBasic = observable(new ClassBasic());
    const instanceBasic1 = observable(new ClassBasic1());
    const instanceBasic2 = observable(new ClassBasic2());
    assert(ObservableProperties.get(instanceBasic)?.includes('name'));
    assert(ObservableProperties.get(instanceBasic)?.length === 1);
    assert(ObservableProperties.get(instanceBasic1)?.includes('name'));
    assert(ObservableProperties.get(instanceBasic1)?.includes('name1'));
    assert(ObservableProperties.get(instanceBasic1)?.length === 2);
    assert(ObservableProperties.get(instanceBasic2)?.includes('name'));
    assert(ObservableProperties.get(instanceBasic2)?.includes('name1'));
    assert(ObservableProperties.get(instanceBasic2)?.includes('name2'));
    assert(ObservableProperties.get(instanceBasic2)?.length === 3);
  });
  it('#basic usage', () => {
    class ClassBasic {
      @prop() name = '';
    }
    const instanceBasic = observable(new ClassBasic());
    let changed = false;
    const tracker = Notifier.find(instanceBasic, 'name');
    tracker?.onChange(() => {
      changed = true;
    });
    instanceBasic.name = 'a';
    instanceBasic.name = 'b';
    assert(instanceBasic.name === 'b');
    assert(changed);
  });
  it('#array usage', () => {
    class ClassArray {
      @prop() list: string[] = [];
    }
    const instanceArray = observable(new ClassArray());
    instanceArray.list = [];
    let changed = false;
    if (Notifiable.is(instanceArray.list)) {
      const notifier = Notifiable.getNotifier(instanceArray.list);
      notifier.onChange(() => {
        changed = true;
      });
    }
    const tracker = Notifier.find(instanceArray, 'list');
    tracker?.onChange(() => {
      changed = true;
    });
    instanceArray.list.push('');
    assert(changed);
    instanceArray.list = [];
    assert(instanceArray.list.length === 0);
  });

  it('#property usage', () => {
    class ClassArray {
      @prop() enable = false;
    }
    const instance = observable(new ClassArray());
    assert(Observability.marked(instance, 'enable'));
    // instanceArray.enable = true;
    let changeTimes = 0;
    const notifier = Notifier.getOrCreate(instance, 'enable');
    notifier.onChange(() => {
      changeTimes += 1;
    });
    instance.enable = true;
    assert(changeTimes === 1);
  });

  it('#child class', (done) => {
    class Foo {
      @prop() fooName = 'foo';
    }
    class Bar extends Foo {
      @prop() barName?: string;
      @prop() barInfo?: string;
    }
    const bar = observable(new Bar());
    let changed = false;
    const tracker = Notifier.find(bar, 'fooName');
    tracker?.onChange(() => {
      changed = true;
      assert(changed);
      done();
    });
    bar.fooName = 'foo name';
  });

  it('#shared properties', () => {
    class Foo {
      @prop() list: string[] = [];
    }
    class Bar {
      @prop() list: string[] = [];
    }
    const foo = observable(new Foo());
    const bar = observable(new Bar());
    foo.list = bar.list;
    let changed = false;
    const notifier = Notifier.find(bar, 'list');
    notifier?.onChange(() => {
      changed = true;
    });
    foo.list.push('');
    assert(changed);
  });
  it('#observable notifiable', () => {
    const v: any[] = [];
    class Foo {}
    const foo = new Foo();
    const notifiable = observable(v);
    const notifiable1 = observable(v);
    const notifiable2 = observable(notifiable);
    assert(notifiable1 === notifiable2);
    assert(notifiable === notifiable1);
    const observableFoo = observable(foo);
    assert(Notifiable.is(notifiable));
    assert(Observability.marked(v));
    assert(observableFoo === foo);
    let changed = false;
    const notifier = Notifier.find(notifiable);
    notifier?.onChange(() => {
      changed = true;
    });
    notifiable1.push('');
    assert(changed);
  });
  it('#get notifier', () => {
    const foo = {
      a: {
        b: {
          c: 1,
        },
      },
    };
    const f = observable(foo);
    assert(Notifiable.is(f.a.b));
    const notifier = Notifiable.getNotifier(f.a.b);
    const originalB = Observability.getOrigin(f.a.b);
    const maybeNewNotifier = Notifier.getOrCreate(originalB);
    assert(notifier === maybeNewNotifier);
  });

  it('#observable nested', () => {
    class Foo {
      @prop() info = '';
    }
    class Bar {
      @prop() obj: { foo: Foo | undefined } = {
        foo: undefined,
      };
    }
    const bar = new Bar();
    const foo = new Foo();
    let bChangeTimes = 0;
    const b = observable(bar);
    const bNotifier = Notifier.find(b, 'obj');
    bNotifier?.onChange(() => {
      bChangeTimes += 1;
    });

    let objChangeTimes = 0;

    assert(Notifiable.is(b.obj));
    const objNotifier = Notifiable.getNotifier(b.obj);
    objNotifier?.onChange(() => {
      objChangeTimes += 1;
    });

    bar.obj.foo = foo;
    const f = observable(foo);
    let fooChangeTimes = 0;
    const fooNotifier = Notifier.find(f, 'info');
    fooNotifier?.onChange(() => {
      fooChangeTimes += 1;
    });
    foo.info = 'foo';
    assert(b.obj === b.obj);
    assert(bChangeTimes === 1);
    assert(objChangeTimes === 1);
    assert(fooChangeTimes === 1);
  });

  it('#observable nested obj', () => {
    const foo = {
      a: {
        b: {
          c: 1,
        },
      },
    };
    const f = observable(foo);
    assert(Notifiable.is(f));
    const fNotifier = Notifiable.getNotifier(f);
    let fChangeTimes = 0;
    fNotifier?.onChange(() => {
      fChangeTimes += 1;
    });

    assert(Notifiable.is(f.a.b));
    const bNotifier = Notifiable.getNotifier(f.a.b);
    let bChangeTimes = 0;
    bNotifier?.onChange(() => {
      bChangeTimes += 1;
    });

    f.a.b.c = 2;
    assert(fChangeTimes === 0);
    assert(bChangeTimes === 1);
  });
  it('#observable property set', () => {
    const arr: string[] = [];
    class ClassBasic {
      @prop() arr = arr;
    }
    const instance = observable(new ClassBasic());
    let times = 0;
    const notifier = Notifier.find(instance, 'arr');
    notifier?.onChange(() => {
      times += 1;
    });
    const observavleArr = observable(arr);
    observavleArr.push(''); // 2
    assert(times === 2);
    instance.arr = []; //3
    observavleArr.push('');
    assert((times as number) === 3);
  });
});
