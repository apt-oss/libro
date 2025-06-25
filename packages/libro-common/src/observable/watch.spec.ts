import assert from 'assert';

import { Disposable } from '../common/index.js';

import { watch, prop } from './index.js';

console.warn = () => {
  //
};

describe('watch', () => {
  it('#watch prop', (done) => {
    class Foo {
      @prop() name?: string;
      @prop() name1?: string;
    }
    const newName = 'new name';
    let watchLatest: string | undefined;
    const foo = new Foo();
    watchLatest = foo.name;
    watch(foo, 'name', () => {
      watchLatest = foo.name;
      assert(watchLatest === newName);
      done();
    });
    foo.name = newName;
  });

  it('#watch arr prop', (done) => {
    class Foo {
      @prop() arr: number[] = [];
    }
    let count = 0;
    const foo = new Foo();
    watch(foo, 'arr', () => {
      count += 1;
    });
    foo.arr.push(foo.arr.length);
    assert(count === 2);
    done();
  });
  it('#watch object', () => {
    class Foo {
      @prop() name?: string;
      @prop() info?: string;
    }
    let changed = 0;
    const newName = 'new name';
    let watchLatest: string | undefined;
    const foo = new Foo();
    watchLatest = foo.name;
    watch(foo, () => {
      //
    });
    watch(foo, () => {
      changed += 1;
      watchLatest = foo.name;
      assert(watchLatest === newName);
    });
    foo.name = newName;
    foo.info = 'foo';
    assert(changed === 2);
  });
  it('#watch unobservable prop', () => {
    class Foo {
      @prop() name?: string;
      info?: string;
    }
    class Bar {
      info?: string = '';
    }
    const newName = 'new name';
    const foo = new Foo();
    const bar = new Bar();
    let fooNameChanged = false;
    let fooInfoChanged = false;
    let barChanged = false;
    watch(bar, () => {
      barChanged = true;
    });
    bar.info = 'bar';
    assert(!barChanged);
    watch(foo, 'info', () => {
      fooInfoChanged = true;
    });
    foo.info = newName;
    assert(!fooInfoChanged);
    watch(foo, 'name', () => {
      fooNameChanged = true;
    });
    foo.name = newName;
    assert(fooNameChanged);
  });

  it('#invalid watch', () => {
    class Foo {
      @prop() name?: string;
    }
    const foo = new Foo();
    const p = Promise.resolve();
    const toDispose0 = (watch as any)(foo, 'name');
    const toDispose1 = watch(p, 'then', () => {
      //
    });
    const toDispose2 = watch(null, () => {
      //
    });
    assert(toDispose0 === Disposable.NONE);
    assert(toDispose1 === Disposable.NONE);
    assert(toDispose2 === Disposable.NONE);
  });
});
