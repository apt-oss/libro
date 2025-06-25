import assert from 'assert';

import { prop, Notifier, observable } from './index.js';

describe('tracker', () => {
  it('#create tracker', () => {
    class Foo {
      @prop() name?: string;
    }
    class Bar {
      name?: string;
    }
    const fooRaw = new Foo();
    const foo = observable(fooRaw);
    const bar = new Bar();
    Notifier.find(foo, 'name');
    assert(Notifier.find(observable([])));
    assert(!!Notifier.find(foo, 'name'));
    assert(!!Notifier.find(fooRaw, 'name'));
    assert(!!Notifier.find(bar, 'name'));
  });

  it('#trigger', () => {
    class Foo {
      @prop() name?: string;
    }
    const foo = observable(new Foo());
    let changed = false;
    const notifier = Notifier.find(foo, 'name');
    notifier?.onChange(() => {
      changed = true;
    });
    Notifier.trigger(foo, 'name');
    assert(changed);
  });

  it('#trigger', () => {
    class Foo {
      @prop() name?: string;
      get onNameChange() {
        return Notifier.toEvent(this, 'name');
      }
    }
    const foo = observable(new Foo());
    let changed = false;
    foo.onNameChange(() => {
      changed = true;
    });
    Notifier.trigger(foo, 'name');
    assert(changed);
  });

  it('#trigger array', () => {
    class Foo {
      @prop() arr: number[] = [1, 2, 3];
    }
    const foo = observable(new Foo());
    let times = 0;
    const notifier = Notifier.find(foo, 'arr');
    notifier?.onChange(() => {
      times += 1;
    });
    foo.arr.push(1);
    foo.arr.splice(1, 1);
    assert(times === 5);
  });
  it('#dispose tracker', () => {
    class Foo {
      @prop() name?: string;
    }
    const foo = observable(new Foo());
    const tracker = Notifier.find(foo, 'name');
    tracker?.dispose();
    const newTracker = Notifier.find(foo, 'name');
    assert(tracker?.disposed && newTracker !== tracker);
  });
  it('#tracker notify', (done) => {
    class Foo {
      @prop() name?: string;
    }
    const foo = observable(new Foo());
    const tracker = Notifier.find(foo, 'name');
    tracker?.onChange(() => {
      done();
    });
    assert(!!Notifier.find(foo, 'name'));
    tracker?.notify(foo, 'name');
  });
  it('#tracker changed', (done) => {
    class Foo {
      @prop() name?: string;
    }
    const foo = observable(new Foo());
    const tracker = Notifier.find(foo, 'name');
    tracker?.onChange(() => {
      done();
    });
    assert(!!Notifier.find(foo, 'name'));
    tracker?.notify(foo, 'name');
  });
  it('#tracker once', () => {
    class Foo {
      @prop() name?: string;
    }
    const foo = observable(new Foo());
    const tracker = Notifier.find(foo, 'name');
    let times = 0;
    let once = 0;
    tracker?.once(() => {
      once += 1;
    });
    tracker?.onChange(() => {
      times += 1;
    });
    assert(!!Notifier.find(foo, 'name'));
    tracker?.notify(foo, 'name');
    tracker?.notify(foo, 'name');
    assert(times === 2);
    assert(once === 1);
  });

  it('#trigger', () => {
    class Foo {
      @prop() name?: string;
    }
    const raw = new Foo();

    const event0 = Notifier.toEvent(raw, 'name');
    const event1 = Notifier.toEvent(raw, 'name', null);
    const event2 = Notifier.toEvent(raw, 'name', true);
    const foo = observable(raw);

    const notifier = Notifier.getOrCreate(foo, 'name');

    assert(event0 === notifier?.onChangeSync);
    assert(event1 === notifier?.onChange);
    assert(event2 === notifier?.onChangeAsync);
    assert(event0 !== event2);
    assert(event0 === event1);
  });
});
