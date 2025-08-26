import { ManaModule } from '@difizen/mana-app';

import { LibroImageUrlMimeTypeContribution } from './image-url/image-url-rendermime-contribution.js';
import { LibroPlotlyMimeTypeContribution } from './ploty/plotly-rendermime-contribution.js';

export const PlotlyModule = ManaModule.create().register(
  LibroPlotlyMimeTypeContribution,
);

export const ImageUrlMimeModule = ManaModule.create().register(
  LibroImageUrlMimeTypeContribution,
);
