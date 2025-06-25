import assert from 'assert';

import { Container, singleton } from '../../ioc/index.js';

import { ManaContext } from './mana-module-context.js';
import { ManaModule } from './mana-module.js';

describe('mana module', () => {
  it('name', async () => {
    @singleton()
    class M {}
    const moduleA = ManaModule.create('a').register(M);

    assert(moduleA.name === 'a');

    const context = new ManaContext(new Container());
    await context.load(moduleA);

    assert(context.container.get(M) instanceof M);
  });

  it('load', async () => {
    @singleton()
    class M {}
    const moduleA = ManaModule.create('a').register(M);

    const context = new ManaContext(new Container());
    await context.load(moduleA);

    return expect(moduleA.load).resolves.toEqual(undefined);
  });

  it('load false', async () => {
    @singleton()
    class M {}
    const moduleA = ManaModule.create('a')
      .register(M)
      .canload(async () => false);

    const context = new ManaContext(new Container());
    await context.load(moduleA);

    return expect(moduleA.load).rejects.toEqual(
      'Load ManaModule "a" failed: canload return false',
    );
  });

  it('canload: false', async () => {
    @singleton()
    class M {}

    const moduleA = ManaModule.create('a')
      .register(M)
      .canload(async () => false);

    const context = new ManaContext(new Container());

    await context.load(moduleA);

    expect(() => context.container.get(M)).toThrow(
      'No matching bindings found for serviceIdentifier: M',
    );
  });

  it('canload: true', async () => {
    @singleton()
    class P {}

    const moduleB = ManaModule.create('a')
      .register(P)
      .canload(async () => true);

    const context = new ManaContext(new Container());

    await context.load(moduleB);

    assert(context.container.get(P) instanceof P);
  });

  it('canload: param', async () => {
    const canload = ['a'];

    @singleton()
    class P {}

    let param: P | undefined = undefined;

    const moduleB = ManaModule.create('a')
      .register(P)
      .canload(async (mod) => {
        param = mod;
        return mod.name ? canload.includes(mod.name) : true;
      });

    const context = new ManaContext(new Container());

    await context.load(moduleB);

    assert(context.container.get(P) instanceof P);
    expect(param).toEqual(moduleB);
  });

  it('preload', async () => {
    const mockFn = jest.fn();

    @singleton()
    class P {}

    const moduleB = ManaModule.create('a')
      .register(P)
      .canload(async () => true)
      .preload(mockFn);

    const context = new ManaContext(new Container());

    await context.load(moduleB);

    assert(context.container.get(P) instanceof P);
    expect(mockFn.mock.calls).toHaveLength(1);
  });

  it('deps', async () => {
    @singleton()
    class P {}

    const moduleA = ManaModule.create('a')
      .register(P)
      .canload(async () => true);

    const moduleB = ManaModule.create('b')
      .canload(async () => true)
      .dependOn(moduleA);

    const context = new ManaContext(new Container());

    await context.load(moduleB);

    assert(context.container.get(P) instanceof P);
  });

  it('canload false block deps', async () => {
    @singleton()
    class P {}

    const moduleA = ManaModule.create('a')
      .register(P)
      .canload(async () => true);

    const moduleB = ManaModule.create('b')
      .canload(async () => false)
      .dependOn(moduleA);

    const context = new ManaContext(new Container());

    await context.load(moduleB);

    expect(() => context.container.get(P)).toThrow(
      'No matching bindings found for serviceIdentifier: P',
    );
  });
});
