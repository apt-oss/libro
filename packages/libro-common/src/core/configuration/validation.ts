import Ajv from 'ajv';

import { singleton } from '../../ioc/index.js';
import { getOrigin } from '../../observable/index.js';

import type { ConfigurationNode } from './configuration-protocol.js';

@singleton()
export class SchemaValidator {
  protected ajvInstance = new Ajv();

  /**
   * https://ajv.js.org/guide/managing-schemas.html#using-ajv-instance-cache
   */
  addSchema<T>(node: ConfigurationNode<T>) {
    getOrigin(this.ajvInstance).addSchema(node.schema, node.id);
  }

  getSchema<T>(node: ConfigurationNode<T>) {
    return getOrigin(this.ajvInstance).getSchema<T>(node.id);
  }

  validateNode<T = any>(node: ConfigurationNode<T>, value: T): boolean {
    const validate = this.getSchema(node);
    if (validate === undefined) {
      return false;
    }
    const valid = validate(value) as boolean;
    if (!valid) {
      console.warn(validate.errors);
    }
    return valid;
  }
}
