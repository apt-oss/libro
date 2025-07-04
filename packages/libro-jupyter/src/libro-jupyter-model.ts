import type { INotebookContent } from '@difizen/libro-common';
import { getOrigin, ModalService, prop } from '@difizen/libro-common/app';
import { Deferred } from '@difizen/libro-common/app';
import { inject, transient } from '@difizen/libro-common/app';
import { l10n } from '@difizen/libro-common/l10n';
import type { VirtualizedManager } from '@difizen/libro-core';
import { LibroModel, VirtualizedManagerHelper } from '@difizen/libro-core';
import {
  ContentsManager,
  isDisplayDataMsg,
  LibroKernelConnectionManager,
  ServerConnection,
  ServerManager,
} from '@difizen/libro-kernel';
import type { IKernelConnection, ExecutableNotebookModel } from '@difizen/libro-kernel';
import type { IContentsCheckpointModel, IContentsModel } from '@difizen/libro-kernel';

import {
  ExecutedWithKernelCellModel,
  libroArgsMimetype,
  LibroFileService,
} from './libro-jupyter-protocol.js';
import { getDefaultKernel } from './utils/index.js';

type IModel = IContentsModel;
@transient()
export class LibroJupyterModel extends LibroModel implements ExecutableNotebookModel {
  protected libroFileService: LibroFileService;
  protected virtualizedManager: VirtualizedManager;

  get fileService() {
    return this.libroFileService;
  }

  @prop()
  currentFileContents: IModel;
  @prop()
  protected kernelSelect: string;
  @prop()
  protected kernelStatus: string;
  @prop()
  kernelConnection?: IKernelConnection;

  @prop()
  lspEnabled = true;

  protected kernelConnectionManager: LibroKernelConnectionManager;
  protected serverManager: ServerManager;
  protected serverConnection: ServerConnection;
  protected readonly contentsManager: ContentsManager;
  protected readonly modalService: ModalService;

  constructor(
    @inject(LibroFileService) libroFileService: LibroFileService,
    @inject(LibroKernelConnectionManager)
    kernelConnectionManager: LibroKernelConnectionManager,
    @inject(ServerManager) serverManager: ServerManager,
    @inject(ServerConnection) serverConnection: ServerConnection,
    @inject(ContentsManager) contentsManager: ContentsManager,
    @inject(ModalService) modalService: ModalService,
    @inject(VirtualizedManagerHelper)
    virtualizedManagerHelper: VirtualizedManagerHelper,
  ) {
    super();
    this.kernelSelection = getDefaultKernel();
    this.libroFileService = libroFileService;
    this.kernelConnectionManager = kernelConnectionManager;
    this.serverManager = serverManager;
    this.serverConnection = serverConnection;
    this.contentsManager = contentsManager;
    this.modalService = modalService;
    this.dndAreaNullEnable = true;
    this.virtualizedManager = virtualizedManagerHelper.getOrCreate(this);
    this.kcReady
      .then(() => {
        this.kernelConnection?.futureMessage((msg) => {
          if (isDisplayDataMsg(msg) && libroArgsMimetype in msg.content.data) {
            this.metadata = {
              ...this.metadata,
              args: msg.content.data[libroArgsMimetype],
            };
          }
        });
        return;
      })
      .catch(() => {
        return;
      });
  }

  get isKernelIdle() {
    return this.kernelConnection && this.kernelConnection.status === 'idle';
  }

  get kernelSelection() {
    return this.kernelSelect;
  }

  set kernelSelection(value: string) {
    this.kernelSelect = value;
  }

  get currentKernelStatus() {
    return this.kernelStatus;
  }

  set currentKernelStatus(value: string) {
    this.kernelStatus = value;
  }
  protected kcDeferred = new Deferred<IKernelConnection>();
  get kcReady() {
    return this.kcDeferred.promise;
  }

  @prop()
  kernelConnecting: boolean | undefined;

  @prop()
  filePath = '';

  protected last_modified = '';

  get lastModified() {
    return this.last_modified;
  }

  set lastModified(value: string) {
    this.last_modified = value;
  }

  latestCheckPointModel: IContentsCheckpointModel;

  async createCheckpoint() {
    this.latestCheckPointModel = await this.contentsManager.createCheckpoint(
      this.filePath,
    );
  }

  async listCheckpoints() {
    await this.contentsManager.listCheckpoints(this.filePath);
  }

  async restoreCheckpoint(checkpointID: string) {
    await this.contentsManager.restoreCheckpoint(this.filePath, checkpointID);
  }

  async deleteCheckpoint(checkpointID: string) {
    await this.contentsManager.deleteCheckpoint(this.filePath, checkpointID);
  }

  override async loadNotebookContent(): Promise<INotebookContent> {
    const content = await super.loadNotebookContent();
    this.id = this.filePath; // use file path as id, will be passed to editor and lsp
    if (this.executable && !this.kernelConnecting) {
      this.startKernelConnection();
    }
    return content;
  }

  startKernelConnection() {
    this.kernelConnecting = true;
    const fileInfo = this.currentFileContents;
    this.serverManager.ready
      .then(async () => {
        const kernelConnection =
          this.kernelConnectionManager.getKernelConnection(fileInfo);
        if (kernelConnection) {
          this.kernelConnection = kernelConnection;
          this.kcDeferred.resolve(this.kernelConnection);
          this.kernelConnecting = false;
        } else {
          const kc = await this.kernelConnectionManager.startNew(
            this.currentFileContents,
          );
          if (!kc) {
            return;
          }
          this.kernelConnection = kc;
          this.kcDeferred.resolve(kc);
          this.kernelConnecting = false;
        }
        return;
      })
      .catch(console.error);
  }

  override canRun() {
    if (!this.kernelConnection) {
      alert(l10n.t('Kernel Connection 还没有建立'));
      return false;
    }

    if (this.kernelConnection.isDisposed) {
      alert('Kernel Connection disposed');
      return false;
    }

    return true;
  }

  async interrupt() {
    if (!this.kernelConnection) {
      alert(l10n.t('Kernel Connection 还没有建立'));
      return;
    }
    await this.kernelConnection.interrupt();
  }

  async shutdown() {
    if (!this.kernelConnection) {
      alert(l10n.t('Kernel Connection 还没有建立'));
      return;
    }

    await this.kernelConnectionManager.shutdownKC(this.currentFileContents);
    this.kernelConnection = undefined;
  }

  override async restart() {
    if (!this.kernelConnection || this.kernelConnection.isDisposed) {
      this.startKernelConnection();
      getOrigin(this.kcReady)
        .then(() => {
          if (!this.kernelConnection) {
            alert(l10n.t('Kernel Connection 还没有建立'));
            return;
          }
          return;
        })
        .catch(console.error);
      return;
    }

    this.kernelConnection.restart();
    super.restart();
  }

  async reconnect() {
    if (!this.kernelConnection) {
      alert(l10n.t('Kernel Connection 还没有建立'));
      return;
    }
    await this.kernelConnection.reconnect();
  }

  findRunningCell() {
    const runningCellIndex = this.cells.findIndex((item) => {
      if (ExecutedWithKernelCellModel.is(item.model)) {
        return item.model.kernelExecuting === true;
      }
      return false;
    });
    if (runningCellIndex > -1) {
      this.selectCell(this.cells[runningCellIndex]);
      this.scrollToView(this.cells[runningCellIndex]);
    }
  }
}
