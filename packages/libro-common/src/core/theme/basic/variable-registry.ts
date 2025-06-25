import type { Disposable } from '../../../common/index.js';
import { singleton } from '../../../ioc/index.js';
import { BaseVariableRegistry } from '../base-variable-registry.js';
import type { VariableDefinition } from '../protocol.js';

/**
 * It should be implemented by an extension, e.g. by the monaco extension.
 */
@singleton()
export class VariableRegistry extends BaseVariableRegistry {
  protected override get definitionList(): VariableDefinition<string>[] {
    return [...this.definitionMap.values()];
  }
  protected override definitionMap: Map<string, VariableDefinition<string>> = new Map();

  override register(...definitions: VariableDefinition<string>[]): Disposable {
    return super.register(...definitions);
  }

  protected override doRegister(definition: VariableDefinition<string>): Disposable {
    return super.doRegister(definition);
  }
}
