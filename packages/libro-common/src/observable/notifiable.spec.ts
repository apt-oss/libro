/* eslint-disable @typescript-eslint/no-explicit-any */
import assert from 'assert';

import { isPlainObject } from '../common/index.js';

import { Notifiable, Notifier, Observability } from './index.js';

describe('reactivity', () => {
  it('#can be reactable', () => {
    class Foo {}
    const a = new Foo();
    assert(!Notifiable.canBeNotifiable(a));
    assert(!Notifiable.canBeNotifiable(null));
    assert(!Notifiable.canBeNotifiable(undefined));
    assert(Notifiable.canBeNotifiable([]));
    assert(Notifiable.canBeNotifiable({}));
    assert(Notifiable.canBeNotifiable(new Map()));
    const arrValue = Notifiable.transform([]);
    assert(Notifiable.canBeNotifiable(arrValue));
  });
  it('#transform base', () => {
    const tValue = Notifiable.transform(undefined);
    assert(tValue === undefined);
    if (tValue) {
      assert(Notifiable.getNotifier(tValue) === undefined);
    }
    const arr = ['a'];
    const arrValue = Notifiable.transform(arr);
    const arrNotifier = Notifiable.tryGetNotifier(arrValue);
    const arrValue1 = Notifiable.transform(arr);
    const arrNotifier1 = Notifiable.tryGetNotifier(arrValue1);
    assert(Notifiable.canBeNotifiable(arr));
    assert(Notifiable.is(arrValue));

    assert(!!arrNotifier);
    assert(arrValue !== arr);
    assert(arrValue1 === arrValue);
    assert(arrNotifier1 === arrNotifier);
    const arrValue2 = Notifiable.transform(arrValue);
    const arrNotifier2 = Notifiable.tryGetNotifier(arrValue2);

    assert(arrNotifier === arrNotifier2);
    assert(arrValue === arrValue2);
    class A {}
    const a = new A();
    const objValue = Notifiable.transform(a);
    const objNotifier = Notifiable.tryGetNotifier(objValue);
    assert(!objNotifier);
    assert(a === objValue);
  });

  it('#do not transform frozen', () => {
    const fObj = Object.freeze({});
    const fArr = Object.freeze([fObj]);
    const obj = {
      a: fArr,
      o: fObj,
    };
    const arr = [fArr, fObj];
    const tValue = Notifiable.transform(obj);
    const tArr = Notifiable.transform(arr);
    const tFArr = Notifiable.transform(fArr);
    assert(tValue.a === fArr);
    assert(tValue.o === fObj);
    assert(tArr[0] === fArr);
    assert(tArr[1] === fObj);
    assert(tFArr[0] === fObj);
  });

  it('#runtime frozen', () => {
    const obj = {};
    const arr = [obj];
    const foo = {
      a: arr,
      o: obj,
    };
    Object.freeze(obj);
    Object.freeze(arr);
    const tValue = Notifiable.transform(foo);
    const tArr = Notifiable.transform(arr);
    assert(tValue.a === arr);
    assert(tValue.o === obj);
    assert(tArr[0] === obj);
  });

  it('#transform array', () => {
    const v: any[] = [];
    const tValue = Notifiable.transform(v);
    assert(tValue instanceof Array);
    assert(Notifiable.is(tValue));
    assert(Observability.getOrigin(tValue) === v);
  });
  it('#transform array nested', () => {
    const v: any[] = [[]];
    const tValue = Notifiable.transform(v);
    assert(tValue[0] instanceof Array);
    assert(Notifiable.is(tValue[0]));
  });

  it('#transform map', () => {
    const v: Map<string, string> = new Map();
    const tValue = Notifiable.transform(v);
    assert(tValue instanceof Map);
    assert(Notifiable.is(tValue));
    assert(Observability.getOrigin(tValue) === v);
  });
  it('#transform map nested', () => {
    const v: Map<string, any> = new Map();
    v.set('a', {});
    const tValue = Notifiable.transform(v);
    assert(tValue instanceof Map);
    assert(Notifiable.is(tValue.get('a')));
  });

  it('#transform plain object', () => {
    const v = {};
    const tValue = Notifiable.transform(v);
    assert(isPlainObject(tValue));
    assert(Notifiable.is(tValue));
    assert(Observability.getOrigin(tValue) === v);
  });
  it('#transform plain object nested', () => {
    const v = { a: {} };
    const tValue = Notifiable.transform(v);
    assert(isPlainObject(tValue.a));
    assert(Notifiable.is(tValue.a));
  });

  it('#array notifier', () => {
    const v: any[] = [];
    const tValue = Notifiable.transform(v);
    const notifier = Notifiable.tryGetNotifier(tValue);
    let changedTimes = 0;
    if (notifier) {
      notifier.onChange(() => {
        changedTimes += 1;
      });
    }
    // Pushing brings changes, one is the set value and the other is the set length
    tValue.push('a');
    tValue.pop();
    assert(tValue.length === 0);
    assert(changedTimes === 3);
  });
  it('#map notifier', () => {
    const v: Map<string, string> = new Map();
    const tValue = Notifiable.transform(v);
    const notifier = Notifiable.tryGetNotifier(tValue);
    let changedTimes = 0;
    if (notifier) {
      notifier.onChange(() => {
        changedTimes += 1;
      });
    }
    tValue.set('a', 'a');
    const aValue = tValue.get('a');
    assert(aValue === 'a');
    assert(tValue.size === 1);
    tValue.set('b', 'b');
    tValue.delete('a');
    tValue.clear();
    assert(changedTimes === 4);
  });

  it('#plainObject notifier', () => {
    const v: Record<any, any> = { a: '', b: { c: '' }, d: '' };
    const tValue = Notifiable.transform(v);
    const notifier = Notifiable.tryGetNotifier(tValue);
    const tValue1 = Notifiable.transform(v['b']);
    const notifier1 = Notifiable.tryGetNotifier(tValue1);
    let changedTimes = 0;
    if (notifier) {
      notifier.onChange(() => {
        changedTimes += 1;
      });
    }
    if (notifier1) {
      notifier1.onChange(() => {
        changedTimes += 1;
      });
    }
    tValue['a'] = 'a';
    assert(tValue['a'] === 'a');
    tValue['b'].c = 'c';
    assert(tValue['b'].c === 'c');
    delete tValue['d'];
    assert(changedTimes === 3);
  });

  it('#get notifier', () => {
    const foo = {
      a: {
        b: {
          c: 1,
        },
      },
    };
    const f = Notifiable.transform(foo);
    assert(Notifiable.is(f.a.b));
    const notifier = Notifiable.getNotifier(f.a.b);
    const originalB = Observability.getOrigin(f.a.b);
    const maybeNewNotifier = Notifier.getOrCreate(originalB);
    assert(notifier === maybeNewNotifier);
  });
});
