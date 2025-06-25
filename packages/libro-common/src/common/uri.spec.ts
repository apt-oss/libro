import assert from 'assert';

import { VscodeURI } from './vscode-uri/index.js';

import { URI } from './index.js';

describe('URI', () => {
  it('#toSting', async () => {
    assert(new URI('http://a:8080/b/c').toString() === 'http://a:8080/b/c');
    assert(new URI('http://A/B/C').toString() === 'http://a/B/C');
    assert(new URI('http://a.b.c/d/e').toString() === 'http://a.b.c/d/e');
    assert(new URI('http://a@b/c/d').toString() === 'http://a@b/c/d');
    assert(new URI('http://a@b/c@d/e').toString() === 'http://a@b/c@d/e');
    assert(
      new URI('http://a@b/c@d/e', { simpleMode: false }).toString() ===
        'http://a@b/c%40d/e',
    );
    assert(new URI('http://a@b/c@d/e').toString(true) === 'http://a@b/c@d/e');
    assert(
      new URI('wss://a@b/c@d/e', { simpleMode: false }).toString() ===
        'wss://a@b/c%40d/e',
    );
    assert(
      new URI('file:///a%2Fb%2Fc%2Fexample.png?KeyId=asgxdjasbcxjsc').toString() ===
        'file:///a%2Fb%2Fc%2Fexample.png?KeyId=asgxdjasbcxjsc',
    );
    assert(
      new URI('file:///a/b/c/example.png?KeyId=asgxdjasbcxjsc').toString() ===
        'file:///a/b/c/example.png?KeyId=asgxdjasbcxjsc',
    );
    assert(
      new URI('file:///a/b/c/example.png?KeyId=asgxdjasbcxjsc', {
        simpleMode: false,
      }).query === 'KeyId=asgxdjasbcxjsc',
    );
    assert(
      new URI('file:///a/b/c/example.png?KeyId=asgxdjasbcxjsc', {
        simpleMode: false,
      }).getParsedQuery()['KeyId'] === 'asgxdjasbcxjsc',
    );
    assert(
      new URI('file:///a/b/c/example.png?KeyId=asgxdjasbcxjsc').toString() ===
        URI.withQuery(
          new URI('file:///a/b/c/example.png'),
          URI.stringifyQuery({ KeyId: 'asgxdjasbcxjsc' }),
        ).toString(),
    );
    assert(
      VscodeURI.parse('file:///a/b/c/example.png?KeyId=asgxdjasbcxjsc', false, {
        simpleMode: false,
      }).toString() ===
        VscodeURI.parse(
          VscodeURI.parse('file:///a/b/c/example.png?KeyId=asgxdjasbcxjsc', false, {
            simpleMode: false,
          }).toString(),
          false,
          { simpleMode: false },
        ).toString(),
    );
    assert(
      VscodeURI.parse('/a/b/c/example.png?KeyId=asgxdjasbcxjsc', false, {
        simpleMode: false,
      }).toString() ===
        VscodeURI.parse(
          VscodeURI.parse('/a/b/c/example.png?KeyId=asgxdjasbcxjsc', false, {
            simpleMode: false,
          }).toString(),
          false,
          { simpleMode: false },
        ).toString(),
    );
  });
});
