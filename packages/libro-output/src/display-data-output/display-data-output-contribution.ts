import type { IOutput } from '@difizen/libro-common';
import { inject, singleton } from '@difizen/libro-common/app';
import { ViewManager } from '@difizen/libro-common/app';
import type { IOutputOptions } from '@difizen/libro-core';
import { OutputContribution } from '@difizen/libro-core';

import { DisplayDataOutputModel } from './display-data-output-model.js';

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
        toJSON: () => ({
          cellId: output.cell.id,
          type: output.output.output_type,
          keys: Object.keys((output.output as any).data || {}),
        }),
      }),
    );
  }
}
