import type { NotebookModel, NotebookOption } from '@difizen/libro-core';
import { ContentContribution } from '@difizen/libro-core';
import { URI } from '@difizen/libro-common/app';
import { singleton } from '@difizen/libro-common/app';

import type { LibroJupyterModel } from '../libro-jupyter-model.js';

@singleton({ contrib: ContentContribution })
export class LibroJupyterContentContribution implements ContentContribution {
  canHandle = () => {
    return 2;
  };
  async loadContent(options: NotebookOption, model: NotebookModel) {
    const jupyterModel = model as LibroJupyterModel;
    const fireUri = new URI(options['resource']);
    const filePath = fireUri.path.toString();

    const currentFileContents = await jupyterModel.fileService.read(filePath);
    if (currentFileContents) {
      model.options['fileSize'] = currentFileContents.size;
      currentFileContents.content.nbformat_minor = 5;
      jupyterModel.currentFileContents = currentFileContents;
      jupyterModel.filePath = currentFileContents.path;
      jupyterModel.lastModified = jupyterModel.currentFileContents.last_modified;

      return jupyterModel.currentFileContents.content;
    }
  }
}
