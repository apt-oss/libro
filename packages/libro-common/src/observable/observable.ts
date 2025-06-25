/* eslint-disable @typescript-eslint/no-explicit-any */
import { ObservableConfig } from './config.js';
import { Notifiable } from './notifiable.js';
import { Notifier } from './notifier.js';
import { InstanceValue, ObservableProperties, Observability } from './utils.js';

const propertyRelatedNotifier = Symbol('propertyRelatedNotifier');

// redefine observable properties
export function defineProperty(target: any, property: string, defaultValue?: any) {
  const notifier = Notifier.getOrCreate(target, property);
  /**
   * notify notifier when property changed
   */
  const onChange = () => {
    if (ObservableConfig.paused) {
      return;
    }
    Notifier.trigger(target, property);
  };
  /**
   * set observable property value and register onChange listener
   * @param value
   * @param notifier
   */
  const handleValue = (value: any) => {
    InstanceValue.set(target, property, value);
    if (notifier) {
      const last = Observability.getDisposable(propertyRelatedNotifier, notifier);
      if (last) {
        last.dispose();
      }
    }
    if (Notifiable.is(value)) {
      const valueNotifier = Notifiable.getNotifier(value);
      if (notifier && valueNotifier) {
        const toDispose = valueNotifier.onChangeSync(onChange);
        Observability.setDisposable(propertyRelatedNotifier, toDispose, notifier);
      }
    }
  };
  const initialValue = target[property] === undefined ? defaultValue : target[property];
  handleValue(Notifiable.transform(initialValue));
  // property getter
  const getter = function getter(this: any): void {
    const value = Reflect.getMetadata(property, target);
    return value;
  };
  // property setter
  const setter = function setter(this: any, value: any): void {
    const notifiableValue = Notifiable.transform(value);
    const oldValue = InstanceValue.get(target, property);
    if (notifiableValue !== oldValue) {
      handleValue(notifiableValue);
      onChange();
    }
  };
  // define property
  if (Reflect.deleteProperty(target, property)) {
    Reflect.defineProperty(target, property, {
      configurable: true,
      enumerable: true,
      get: getter,
      set: setter,
    });
  }
  // mark observable property
  ObservableProperties.add(target, property);
  Observability.mark(target, property);
}

export function observable<T extends Record<any, any>>(target: T): T {
  if (!Observability.canBeObservable(target)) {
    return target;
  }
  const origin = Observability.getOrigin(target);
  const properties = ObservableProperties.find(origin);
  if (!properties) {
    const notifiableValue = Notifiable.transform(origin);
    if (Notifiable.is(notifiableValue)) {
      Observability.mark(origin);
    }
    return notifiableValue;
  }
  properties.forEach((property) => defineProperty(origin, property));
  return origin;
}
