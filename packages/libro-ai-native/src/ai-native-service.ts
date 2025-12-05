import {
  getOrigin,
  inject,
  prop,
  singleton,
  ViewManager,
} from '@difizen/libro-common/app';
import type { CellView } from '@difizen/libro-jupyter';

import { LibroAINativeForCellView } from './ai-native-for-cell-view.js';
import type { LibroChatView } from './chat-view.js';
import type { LibroAiNativeChatView } from './libro-ai-native-chat-view.js';

@singleton()
export class LibroAINativeService {
  @prop()
  showSideToolbar = false;

  // chatViewMap: Map<string, LibroChatView> = new Map();

  // //用于控制是否显示当前 libro 层级的 chat 面板
  // showChatMap: Map<string, boolean> = new Map();

  // cellAIChatMap: Map<string, boolean> = new Map();
  @inject(ViewManager)
  viewManager: ViewManager;

  libroAINativeForCellViewMap: Map<string, LibroAINativeForCellView> = new Map();

  // libroAINativeChatViewMap: Map<string, LibroAiNativeChatView> = new Map();

  async getOrCreateLibroAINativeForCellView(id: string, cell: CellView) {
    let libroAINativeForCellView = this.libroAINativeForCellViewMap.get(id);
    if (libroAINativeForCellView) {
      return libroAINativeForCellView;
    } else {
      libroAINativeForCellView = await this.viewManager.getOrCreateView(
        LibroAINativeForCellView,
        { id: id, cell: getOrigin(cell), toJSON: () => ({ id, cellId: cell.id }) },
      );
      // this.libroAINativeForCellViewMap.set(cell.id, libroAINativeForCellView);
    }
    return libroAINativeForCellView;
  }
}
