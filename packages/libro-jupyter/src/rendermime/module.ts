import { ManaModule } from '@difizen/libro-common/app';

import { LibroImageUrlMimeTypeContribution } from './image-url/image-url-rendermime-contribution.js';
import { LibroPlotlyMimeTypeContribution } from './ploty/plotly-rendermime-contribution.js';

export const CustomRenderMimeModule = ManaModule.create().register(
  LibroPlotlyMimeTypeContribution,
  LibroImageUrlMimeTypeContribution,
);
