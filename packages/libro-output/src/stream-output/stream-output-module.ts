import { OutputModule } from '@difizen/libro-core';
import { LibroRenderMimeModule } from '@difizen/libro-rendermime';
import { ManaModule } from '@difizen/libro-common/app';

import { StreamOutputContribution } from './stream-output-contribution.js';
import { StreamOutputModel } from './stream-output-model.js';

export const StreamOutputModule = ManaModule.create()
  .register(StreamOutputModel, StreamOutputContribution)
  .dependOn(OutputModule, LibroRenderMimeModule);
