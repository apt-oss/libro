import assert from 'assert';

import { GlobalContainer } from '../container.js';
import { inject, singleton } from '../decorator.js';

import type { ToAutoFactory } from './auto-factory.js';
import { autoFactory, AutoFactoryOption, toAutoFactory } from './auto-factory.js';

describe('auto factory', () => {
  it('#decorator', async () => {
    @autoFactory()
    class DataModel {
      data: number;
      constructor(@inject(AutoFactoryOption) option: { data: number }) {
        this.data = option.data;
      }
    }

    GlobalContainer.register(DataModel);
    const factoryToken = toAutoFactory(DataModel);
    const factory = GlobalContainer.get(factoryToken);
    const model = factory({ data: 1 });
    assert(model.data === 1);
  });

  it('#decorator extend', async () => {
    @autoFactory()
    class DataModelBase {
      data: number;
      constructor(@inject(AutoFactoryOption) option: { data: number }) {
        this.data = option.data;
      }
    }

    @autoFactory()
    class DataModel extends DataModelBase {
      count: number;
      constructor(@inject(AutoFactoryOption) option: { data: number; count: number }) {
        super(option);
        this.count = option.count;
      }
    }
    GlobalContainer.register(DataModelBase);
    const factoryTokenBase = toAutoFactory(DataModelBase);
    const factoryBase = GlobalContainer.get(factoryTokenBase);
    const modelBase = factoryBase({ data: 1 });
    assert(modelBase instanceof DataModelBase);
    assert(modelBase.data === 1);

    GlobalContainer.register(DataModel);
    const factoryToken = toAutoFactory(DataModel);
    const factory = GlobalContainer.get(factoryToken);
    const model = factory({ data: 1, count: 2 });
    assert(model instanceof DataModel);
    assert(model instanceof DataModelBase);
    assert(model.data === 1);
    assert(model.count === 2);
  });

  it('#use factory', async () => {
    @autoFactory()
    class DataModel {
      data: number;
      constructor(@inject(AutoFactoryOption) option: { data: number }) {
        this.data = option.data;
      }
    }

    toAutoFactory<typeof DataModel>(DataModel);

    @singleton()
    class DataModelManager {
      @inject(toAutoFactory(DataModel))
      dataModelFactory: ToAutoFactory<typeof DataModel>;
      // Factory<DataModel>
      create(option: { data: number }) {
        const data = this.dataModelFactory(option);
        return data;
      }
    }

    GlobalContainer.register(DataModel);
    GlobalContainer.register(DataModelManager);

    const dataManager = GlobalContainer.get(DataModelManager);
    const data = dataManager.create({ data: 1 });
    assert(data instanceof DataModel);
    assert(data.data === 1);
  });
});
