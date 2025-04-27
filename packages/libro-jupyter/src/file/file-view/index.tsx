import { ExclamationCircleFilled, FolderFilled } from '@ant-design/icons';
import { ContentsManager } from '@difizen/libro-kernel';
import type { IContentsModel } from '@difizen/libro-kernel';
import type { TreeNode, ViewOpenHandler } from '@difizen/libro-common/app';
import { FileTreeViewFactory } from '@difizen/libro-common/app';
import {
  FileStatNode,
  FileTree,
  FileTreeModel,
  FileTreeView,
  isOSX,
  LabelProvider,
  TreeDecoratorService,
  TreeProps,
  TreeViewDecorator,
  TreeViewModule,
  CommandRegistry,
  ManaModule,
  OpenerService,
  SelectionService,
  view,
  inject,
  singleton,
} from '@difizen/libro-common/app';
import { l10n } from '@difizen/libro-common/l10n';
import { Modal } from 'antd';
import React from 'react';

import type { LibroNavigatableView } from '../navigatable-view.js';

import './index.less';

const FileTreeModule = ManaModule.create()
  .register(FileTree, FileTreeModel)
  .dependOn(TreeViewModule);

const { confirm } = Modal;

const noVerifyFileType = ['.ipynb', '.py'];

@singleton()
@view(FileTreeViewFactory, FileTreeModule)
export class FileView extends FileTreeView {
  @inject(OpenerService) protected openService: OpenerService;
  @inject(ContentsManager) protected contentsManager: ContentsManager;
  @inject(CommandRegistry) protected command: CommandRegistry;
  uploadInput?: HTMLInputElement;
  override id = FileTreeViewFactory;
  override className = 'libro-jupyter-file-tree';

  constructor(
    @inject(TreeProps) props: TreeProps,
    @inject(FileTreeModel) model: FileTreeModel,
    @inject(TreeViewDecorator) treeViewDecorator: TreeViewDecorator,
    @inject(SelectionService) selectionService: SelectionService,
    @inject(LabelProvider) labelProvider: LabelProvider,
    @inject(TreeDecoratorService) decoratorService: TreeDecoratorService,
  ) {
    super(
      props,
      model,
      treeViewDecorator,
      selectionService,
      labelProvider,
      decoratorService,
    );
    this.title.label = () => <div>{l10n.t('文件导航')}</div>;
    this.title.icon = <FolderFilled />;
    this.toDispose.push(this.model.onOpenNode(this.openNode));
  }

  override onViewMount(): void {
    super.onViewMount?.();
    if (!this.container?.current) {
      return;
    }
    const container = this.container.current;
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.onclick = this.onInputClicked;
    input.onchange = this.onInputChanged;
    input.style.display = 'none';
    container.appendChild(input);
    this.uploadInput = input;
  }

  uploadSubmit = (basePath?: string) => {
    if (this.uploadInput) {
      this.uploadInput.setAttribute('data-path', basePath || '');
      this.uploadInput.click();
    }
  };
  /**
   * Perform the actual upload.
   */
  protected async doUpload(file: File, basePath: string): Promise<IContentsModel> {
    // Gather the file model parameters.
    let path = basePath;
    path = path ? path + '/' + file.name : file.name;
    const name = file.name;
    const type = 'file';
    const format = 'base64';

    const uploadInner = async (blob: Blob, chunk?: number): Promise<IContentsModel> => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      await new Promise((resolve, reject) => {
        reader.onload = resolve;
        reader.onerror = (event) => reject(`Failed to upload "${file.name}":` + event);
      });

      // remove header https://stackoverflow.com/a/24289420/907060
      const content = (reader.result as string).split(',')[1];

      const model: Partial<IContentsModel> = {
        type,
        format,
        name,
        chunk,
        content,
      };
      return await this.contentsManager.save(path, model);
    };

    return await uploadInner(file);
  }

  onInputChanged = () => {
    if (!this.uploadInput) {
      return;
    }
    let path = this.uploadInput.getAttribute('data-path') || '';
    if (!path) {
      path = this.model.location?.path.toString() || '';
    }
    if (!path) {
      return;
    }
    const files = Array.prototype.slice.call(this.uploadInput.files) as File[];
    const pending = files.map((file) => this.doUpload(file, path));
    Promise.all(pending)
      .then(() => {
        this.model.refresh();
        return;
      })
      .catch((error) => {
        console.error('Upload Error:', error);
      });
  };

  onInputClicked = () => {
    if (this.uploadInput) {
      this.uploadInput.value = '';
    }
  };

  openNode = async (treeNode: TreeNode) => {
    if (FileStatNode.is(treeNode) && !treeNode.fileStat.isDirectory) {
      if (
        (treeNode.fileStat.size || 0) / (1024 * 1024) < 10 ||
        noVerifyFileType.includes(treeNode.fileStat.resource.path.ext)
      ) {
        const opener = (await this.openService.getOpener(
          treeNode.uri,
        )) as ViewOpenHandler<LibroNavigatableView>;
        if (opener) {
          opener.open(treeNode.uri, {
            viewOptions: {
              name: treeNode.fileStat.name,
              fileSize: treeNode.fileStat.size,
            },
          });
        }
      } else {
        confirm({
          title: l10n.t('文件大小警告'),
          icon: <ExclamationCircleFilled />,
          content: l10n.t(
            '您正尝试打开大于 10 MB 的文件，这可能会影响当前页面/服务的性能。',
          ),
          onOk: async () => {
            const opener = (await this.openService.getOpener(
              treeNode.uri,
            )) as ViewOpenHandler<LibroNavigatableView>;
            if (opener) {
              opener.open(treeNode.uri, {
                viewOptions: { name: treeNode.fileStat.name },
              });
            }
          },
        });
      }
    }
  };

  override handleClickEvent(
    node: TreeNode | undefined,
    event: React.MouseEvent<HTMLElement>,
  ): void {
    const modifierKeyCombined: boolean = isOSX
      ? event.shiftKey || event.metaKey
      : event.shiftKey || event.ctrlKey;
    if (!modifierKeyCombined && node) {
      if (
        FileStatNode.is(node) &&
        !node.fileStat.isDirectory &&
        !node.fileStat.isSymbolicLink
      ) {
        this.model.openNode(node);
      }
    }
    super.handleClickEvent(node, event);
  }
}
