import type { Contribution } from '@difizen/libro-common/app';
import {
  Priority,
  ViewManager,
  contrib,
  inject,
  singleton,
} from '@difizen/libro-common/app';

import { CodeEditorInfoManager } from './code-editor-info-manager.js';
import type { IModel } from './code-editor-model.js';
import { CodeEditorContribution } from './code-editor-protocol.js';
import type { EditorState } from './code-editor-protocol.js';
import { CodeEditorSettings } from './code-editor-settings.js';
import type { CodeEditorViewOptions } from './code-editor-view.js';
import { CodeEditorView } from './code-editor-view.js';

@singleton()
export class CodeEditorManager {
  @contrib(CodeEditorContribution)
  protected readonly codeEditorProvider: Contribution.Provider<CodeEditorContribution>;
  @inject(ViewManager) protected readonly viewManager: ViewManager;
  @inject(CodeEditorInfoManager) protected codeEditorInfoManager: CodeEditorInfoManager;
  @inject(CodeEditorSettings) protected readonly codeEditorSettings: CodeEditorSettings;
  protected stateCache: Map<string, EditorState> = new Map();

  setEditorHostRef(id: string, ref: React.RefObject<HTMLDivElement>) {
    this.codeEditorInfoManager.setEditorHostRef(id, ref);
  }

  protected findCodeEditorProvider(model: IModel) {
    const prioritized = Priority.sortSync(
      this.codeEditorProvider.getContributions(),
      (contribution) => contribution.canHandle(model.mimeType),
    );
    const sorted = prioritized.map((c) => c.value);
    return sorted[0];
  }

  /**
   * 获取默认配置
   * @param model
   * @returns
   */
  getEditorDefaultConfig(model: IModel) {
    return this.findCodeEditorProvider(model)?.defaultConfig;
  }

  /**
   * 用户配置+默认配置（还有一部分配置在cell中指定）
   * @param model
   * @returns
   */
  getUserEditorConfig(model: IModel) {
    return {
      ...this.getEditorDefaultConfig(model),
      ...this.codeEditorSettings.getUserEditorSettings(),
    };
  }

  async getOrCreateEditorView(option: CodeEditorViewOptions): Promise<CodeEditorView> {
    const factory = this.findCodeEditorProvider(option.model)?.factory;
    if (!factory) {
      throw new Error(
        `no code editor factory registered for mimetype: ${option.model.mimeType}`,
      );
    }

    const editorView = await this.viewManager.getOrCreateView<
      CodeEditorView,
      CodeEditorViewOptions
    >(CodeEditorView, {
      factory,
      toJSON: () => {
        return {
          uuid: option.uuid,
          editorHostId: option.editorHostId,
          mimeType: option.model.mimeType,
        };
      },
      ...option,
    });
    return editorView;
  }
}
