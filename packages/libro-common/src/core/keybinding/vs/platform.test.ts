/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import 'regenerator-runtime/runtime';
import * as assert from 'assert';

import { types } from '../../../common/index.js';

import { Registry } from './platform.js';

describe('Platform / Registry', () => {
  test('registry - api', function () {
    assert.ok(types.isFunction(Registry.add));
    assert.ok(types.isFunction(Registry.as));
    assert.ok(types.isFunction(Registry.knows));
  });

  test('registry - mixin', function () {
    Registry.add('foo', { bar: true });

    assert.ok(Registry.knows('foo'));
    assert.ok(Registry.as<any>('foo').bar);
    assert.equal(Registry.as<any>('foo').bar, true);
  });

  test('registry - knows, as', function () {
    const ext = {};

    Registry.add('knows,as', ext);

    assert.ok(Registry.knows('knows,as'));
    assert.ok(!Registry.knows('knows,as1234'));

    assert.ok(Registry.as('knows,as') === ext);
    assert.ok(Registry.as('knows,as1234') === null);
  });

  test('registry - mixin, fails on duplicate ids', function () {
    Registry.add('foo-dup', { bar: true });

    try {
      Registry.add('foo-dup', { bar: false });
      assert.ok(false);
    } catch (e) {
      assert.ok(true);
    }
  });
});
