import type { IOutput } from '@difizen/libro-common';
import { inject, singleton } from '@difizen/libro-common/app';
import { ViewManager } from '@difizen/libro-common/app';
import type { IOutputOptions } from '@difizen/libro-core';
import { OutputContribution } from '@difizen/libro-core';
import { v4 } from 'uuid';

import { DisplayDataOutputModel } from './display-data-output-model.js';

const outputIdMap = new WeakMap<IOutput, string>();

@singleton({ contrib: OutputContribution })
export class DisplayDataOutputContribution implements OutputContribution {
  @inject(ViewManager) viewManager: ViewManager;
  canHandle = (output: IOutput) => {
    if (
      output.output_type === 'display_data' ||
      output.output_type === 'execute_result'
    ) {
      return 100;
    }
    return 1;
  };

  async factory(output: IOutputOptions) {
    return this.viewManager.getOrCreateView(
      DisplayDataOutputModel,
      Object.assign(output, {
        toJSON: () => {
          // 在 Jupyter 协议中，transient.display_id 用于标识可更新的显示数据
          // 但是大多数输出（如静态图表、文本）没有 transient 字段。
          const displayId = (output.output['transient'] as any)?.display_id;
          let uniqueId = outputIdMap.get(output.output);

          if (!displayId && !uniqueId) {
            uniqueId = v4();
            outputIdMap.set(output.output, uniqueId as string);
          }

          return {
            _id: displayId || uniqueId,
            cellId: output.cell.id,
            type: output.output.output_type,
          };
        },
      }),
    );
  }
}
