/* eslint-disable @typescript-eslint/no-explicit-any */

import assert from 'assert';

import React, { useEffect } from 'react';
import renderer, { act } from 'react-test-renderer';

import { prop, useObserve, observable, useObservableState } from './index.js';

describe('use', () => {
  it('#useObserve basic ', (done) => {
    class Foo {
      @prop() info = 0;
    }
    const SINGLETON_FOO = new Foo();
    const FooRender = () => {
      const foo = useObserve(SINGLETON_FOO);
      return <div>{foo && foo.info}</div>;
    };
    let component: renderer.ReactTestRenderer;
    act(() => {
      component = renderer.create(
        <>
          <FooRender />
        </>,
      );

      const json = component.toJSON();
      assert(json === null);
    });
    act(() => {
      SINGLETON_FOO.info = 1;
    });
    act(() => {
      const json = component.toJSON();
      assert(
        !(json instanceof Array) &&
          json &&
          json.children instanceof Array &&
          json.children?.find((item) => item === '1'),
      );
      done();
    });
  });

  it('#useObserve effects ', (done) => {
    class Foo {
      @prop() info = 0;
    }
    const SINGLETON_FOO = new Foo();
    let times = 0;
    let infoTimes = 0;
    const FooRender = () => {
      const foo = useObserve(SINGLETON_FOO);
      React.useEffect(() => {
        times += 1;
      }, [foo]);
      React.useEffect(() => {
        infoTimes += 1;
      }, [foo.info]);
      return <div>{foo && foo.info}</div>;
    };
    let component: renderer.ReactTestRenderer;
    act(() => {
      component = renderer.create(
        <>
          <FooRender />
        </>,
      );

      const json = component.toJSON();
      assert(json === null);
    });
    act(() => {
      SINGLETON_FOO.info = 1;
    });
    act(() => {
      const json = component.toJSON();
      assert(
        !(json instanceof Array) &&
          json &&
          json.children instanceof Array &&
          json.children?.find((item) => item === '1'),
      );
      assert(times === 1);
      assert(infoTimes === 2);
      done();
    });
  });
  it('#useObserve array', (done) => {
    class Foo {
      @prop() list: number[] = [1, 2, 3];
    }
    const foo = new Foo();
    let renderTimes = 0;
    const FooRender = () => {
      const f = useObserve(foo);
      renderTimes += 1;
      return <div>{f.list.length}</div>;
    };
    let component: renderer.ReactTestRenderer;
    act(() => {
      component = renderer.create(
        <>
          <FooRender />
        </>,
      );
      const json = component.toJSON();
      assert(json === null);
    });
    act(() => {
      foo.list.push(1);
      foo.list.splice(1, 1);
    });
    act(() => {
      assert(renderTimes === 2);
      done();
    });
  });
  it('#useObserve deep array ', (done) => {
    class Foo {
      @prop() info = '';
    }
    class Bar {
      @prop() list: Foo[] = [];
    }
    const SINGLETON_BAR = new Bar();
    const foo = new Foo();
    SINGLETON_BAR.list.push(foo);
    const FooRender = () => {
      const bar = useObserve(SINGLETON_BAR);
      return <div>{bar.list.filter((item) => item.info.length > 0).length}</div>;
    };
    let component: renderer.ReactTestRenderer;
    act(() => {
      component = renderer.create(
        <>
          <FooRender />
        </>,
      );

      const json = component.toJSON();
      assert(json === null);
    });
    act(() => {
      foo.info = 'a';
    });
    act(() => {
      const json = component.toJSON();
      assert(
        !(json instanceof Array) &&
          json &&
          json.children instanceof Array &&
          json.children?.find((item) => item === '1'),
      );
      done();
    });
  });

  it('#useObserve reactable array', (done) => {
    const ARR: any[] = observable([]);
    const Render = () => {
      const arr = useObserve(ARR);
      const arr1 = useObservableState<string[]>([]);
      useEffect(() => {
        arr.push('effect');
        arr1.push('effect1');
      }, [arr, arr1]);
      return (
        <div>
          {JSON.stringify(arr)}
          {arr1[0]}
          {arr.length}
        </div>
      );
    };
    let component: renderer.ReactTestRenderer;
    act(() => {
      component = renderer.create(
        <>
          <Render />
        </>,
      );
      const json = component.toJSON();
      assert(json === null);
    });
    act(() => {
      ARR.push('a');
    });
    act(() => {
      const json = component.toJSON();
      assert(
        !(json instanceof Array) &&
          json &&
          json.children instanceof Array &&
          json.children?.includes('2') &&
          json.children?.includes('effect1'),
      );
      done();
    });
  });

  it('#useObserve deep arr', (done) => {
    class Bar {
      @prop() name = '';
    }
    class Foo {
      @prop() arr: Bar[] = [];
    }
    const foo = new Foo();
    const Render = () => {
      const trackableFoo = useObserve(foo);
      useEffect(() => {
        trackableFoo.arr.push(new Bar());
        trackableFoo.arr.push(new Bar());
      }, [trackableFoo]);

      return <div>{trackableFoo.arr.map((item) => item.name)}</div>;
    };
    let component: renderer.ReactTestRenderer;
    act(() => {
      component = renderer.create(
        <>
          <Render />
        </>,
      );
      const json = component.toJSON();
      assert(json === null);
    });
    act(() => {
      foo.arr[0] && (foo.arr[0].name = 'a');
    });
    act(() => {
      const json = component.toJSON();
      assert(
        !(json instanceof Array) &&
          json &&
          json.children instanceof Array &&
          json.children?.includes('a'),
      );
      done();
    });
  });
});
