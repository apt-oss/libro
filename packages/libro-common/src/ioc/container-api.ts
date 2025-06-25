import type { interfaces } from 'inversify';

import type { Syringe } from './core.js';

export const ContainerCacheToken = Symbol('ContainerCacheToken');
export class ContainerAPI {
  static toContainer?: (ctn: interfaces.Container) => Syringe.Container;
  static setCache(ctn: interfaces.Container, value: Syringe.Container) {
    Reflect.defineMetadata(ContainerCacheToken, value, ctn);
  }
  static getOrCreateContainer(ctn: interfaces.Container) {
    const exist = Reflect.getMetadata(ContainerCacheToken, ctn);
    if (!exist) {
      if (this.toContainer) {
        const container = this.toContainer(ctn);
        this.setCache(ctn, container);
        return container;
      }
    }
    return exist;
  }
}
