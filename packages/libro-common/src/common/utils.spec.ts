import assert from 'assert';

import { isPlainObject, getPropertyDescriptor } from './index.js';

describe('Utils', () => {
  it('#plainObject', async () => {
    assert(isPlainObject({}));
    assert(!isPlainObject(null));
    assert(!isPlainObject(undefined));
    const data = Object.create(null);
    assert(isPlainObject(data));
    const data1 = Object.create(data);
    assert(!isPlainObject(data1));
  });

  it('#descriptor', async () => {
    const obj = Object.freeze({ a: {} });
    const describe = getPropertyDescriptor(obj, 'a');
    assert(describe?.configurable === false);
    assert(describe?.writable === false);
  });
});
