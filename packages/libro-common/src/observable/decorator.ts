import { Observability, ObservableProperties } from './utils.js';

/**
 * Define observable property
 */
export function prop() {
  return (target: Record<any, any>, propertyKey: string) => {
    ObservableProperties.add(target.constructor, propertyKey);
  };
}

/**
 * Define property that should not be observable
 */
export function origin() {
  return (target: Record<any, any>, propertyKey: string) => {
    Observability.defineOrigin(target.constructor, propertyKey);
  };
}
