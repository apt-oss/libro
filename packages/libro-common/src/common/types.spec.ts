import assert from 'assert';

import { toArray } from './index.js';

describe('Types util', () => {
  it('#toArray array', async () => {
    const arr = [1];
    assert(toArray(arr) === arr);
  });
  it('#toArray obj', async () => {
    const obj = 1;
    const arr = toArray(obj);
    assert(arr.includes(obj));
    assert(arr.length === 1);
  });
});
