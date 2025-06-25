import assert from 'assert';

import { Path } from './index.js';

describe('Path util', () => {
  it('#normalizeDrive', async () => {
    assert(Path.normalizeDrive('/C:x') === '/c:x');
    assert(Path.normalizeDrive('/c:x') === '/c:x');
    assert(Path.normalizeDrive('C:x') === '/c:x');
    assert(Path.normalizeDrive('c:x') === '/c:x');
    assert(Path.normalizeDrive('/a/b/c') === '/a/b/c');
    assert(Path.normalizeDrive('a/b/c') === 'a/b/c');
  });

  it('#normalizePathSeparator', async () => {
    assert(Path.normalizePathSeparator('/c:xx\\xx') === '/c:xx/xx');
    assert(Path.normalizePathSeparator('/c:xx\\xx\\xx') === '/c:xx/xx/xx');
  });

  it('#toRoot', async () => {
    assert(Path.toRoot(new Path('a/b/c')) === undefined);
    assert(Path.toRoot(new Path('/c:/xx\\xx'))?.toString() === '/c:');
    assert(Path.toRoot(new Path('/c:/'))?.toString() === '/c:');
    assert(Path.toRoot(new Path('/a/b/c'))?.toString() === '/');
    assert(Path.toRoot(new Path('/c:/a/b/c'))?.toString() === '/c:');
  });

  it('#name base ext', async () => {
    assert(new Path('/c:xx\\xx.a').ext === '.a');
    assert(new Path('/c:xx\\xx.a').name === 'xx');
    assert(new Path('/c:xx\\xx.a').base === 'xx.a');
  });
});
