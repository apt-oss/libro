import type { IOutput } from '@difizen/libro-common';
import { inject, singleton } from '@difizen/libro-common/app';
import { ViewManager } from '@difizen/libro-common/app';
import type { IOutputOptions } from '@difizen/libro-core';
import { OutputContribution } from '@difizen/libro-core';

import { StreamOutputModel } from './stream-output-model.js';

@singleton({ contrib: OutputContribution })
export class StreamOutputContribution implements OutputContribution {
  @inject(ViewManager) viewManager: ViewManager;
  canHandle = (output: IOutput) => {
    if (output.output_type === 'stream') {
      return 100;
    }
    return 1;
  };
  factory(output: IOutputOptions) {
    return this.viewManager.getOrCreateView(
      StreamOutputModel,
      Object.assign(output, {
        toJSON: () => ({
          cellId: output.cell.id,
          type: output.output.output_type,
          name: (output.output as any).name,
          length:
            typeof (output.output as any).text === 'string'
              ? (output.output as any).text.length
              : 0,
        }),
      }),
    );
  }
}
