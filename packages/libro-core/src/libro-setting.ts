import type { ConfigurationNode } from '@difizen/mana-app';
import { l10n } from '@difizen/mana-l10n';

export const HeaderToolbarVisible: ConfigurationNode<boolean> = {
  id: 'libro.header.toolbar',
  description: l10n.t('是否显示libro顶部工具栏'),
  title: l10n.t('顶部工具栏'),
  type: 'checkbox',
  defaultValue: true,
  schema: {
    type: 'boolean',
  },
};

export const CellTopToolbarSetting: ConfigurationNode<boolean> = {
  id: 'libro.cell.toptoolbar',
  description: l10n.t('是否显示cell顶部工具栏'),
  title: l10n.t('cell顶部工具栏'),
  type: 'checkbox',
  defaultValue: true,
  schema: {
    type: 'boolean',
  },
};

export const CellSideToolbarVisible: ConfigurationNode<boolean> = {
  id: 'libro.cell.sidetoolbar',
  description: l10n.t('是否显示cell侧边工具栏'),
  title: l10n.t('cell侧边工具栏'),
  type: 'checkbox',
  defaultValue: true,
  schema: {
    type: 'boolean',
  },
};

export const AutoInsertWhenNoCell: ConfigurationNode<boolean> = {
  id: 'libro.command.insertcellbelow',
  description: l10n.t('没有cell时是否默认创建cell'),
  title: l10n.t('默认创建cell'),
  type: 'checkbox',
  defaultValue: true,
  schema: {
    type: 'boolean',
  },
};

export const EnterEditModeWhenAddCell: ConfigurationNode<boolean> = {
  id: 'libro.command.entereditmodewhenaddcell',
  description: l10n.t('增加cell操作默认进入编辑态'),
  title: l10n.t('默认进入编辑态'),
  type: 'checkbox',
  defaultValue: true,
  schema: {
    type: 'boolean',
  },
};
export const CollapserClickActive: ConfigurationNode<boolean> = {
  id: 'libro.command.collapserclickactive',
  description: l10n.t('点击左侧长条是否可以隐藏与显示cell'),
  title: l10n.t('默认点击长条可以隐藏与显示cell'),
  type: 'checkbox',
  defaultValue: true,
  schema: {
    type: 'boolean',
  },
};
export const MultiSelectionWhenShiftClick: ConfigurationNode<boolean> = {
  id: 'libro.command.multiselectionwhenshiftclick',
  description: l10n.t('按住shift键并点击拖拽区域可以进行多选'),
  title: l10n.t('默认按住shift键并点击拖拽区域可以进行多选'),
  type: 'checkbox',
  defaultValue: true,
  schema: {
    type: 'boolean',
  },
};

export const RightContentFixed: ConfigurationNode<boolean> = {
  id: 'libro.right.content.fixed',
  description: l10n.t('libroview的右边栏是否相对固定'),
  title: l10n.t('右侧内容是否相对固定'),
  type: 'checkbox',
  defaultValue: true,
  schema: {
    type: 'boolean',
  },
};

export const OutputScrollBtnVisiable: ConfigurationNode<boolean> = {
  id: 'libro.cell.output.scroll.button.visiable',
  description: l10n.t('Cell 输出区域高度固定按钮是否显示'),
  title: l10n.t('Cell 输出区域高度固定按钮是否显示'),
  type: 'checkbox',
  defaultValue: true,
  schema: {
    type: 'boolean',
  },
};

export const SupportCodeFormat: ConfigurationNode<boolean> = {
  id: 'libro.language.codeformat',
  description: l10n.t('是否支持代码格式化'),
  title: l10n.t('是否支持代码格式化'),
  type: 'checkbox',
  defaultValue: false,
  schema: {
    type: 'boolean',
  },
};

export const SpmReporter: ConfigurationNode<boolean> = {
  id: 'libro.spm.reporter',
  description: l10n.t('是否支持数据日志'),
  title: l10n.t('是否支持数据日志'),
  type: 'checkbox',
  defaultValue: false,
  schema: {
    type: 'boolean',
  },
};

export const LargeOutputDisplay: ConfigurationNode<boolean> = {
  id: 'libro.output.large.display',
  description: l10n.t('是否优化长文本 output 显示'),
  title: 'Output',
  type: 'checkbox',
  defaultValue: true,
  schema: {
    type: 'boolean',
  },
};

export const VirtualizationEnabled: ConfigurationNode<boolean> = {
  id: 'libro.virtualization.enabled',
  description: l10n.t('是否启用虚拟滚动功能'),
  title: l10n.t('虚拟滚动'),
  type: 'checkbox',
  defaultValue: false,
  schema: {
    type: 'boolean',
  },
};

export const VirtualizationThresholdCellCount: ConfigurationNode<number> = {
  id: 'libro.virtualization.threshold.cellcount',
  description: l10n.t('启用虚拟滚动所需的cell数量阈值'),
  title: l10n.t('虚拟滚动 cell 数量阈值'),
  type: 'input',
  defaultValue: 50,
  schema: {
    type: 'number',
    minimum: 1,
    maximum: 1000,
  },
};

export const VirtualizationThresholdFileSize: ConfigurationNode<number> = {
  id: 'libro.virtualization.threshold.filesize',
  description: l10n.t('启用虚拟滚动所需的文件大小阈值，单位 byte'),
  title: l10n.t('虚拟滚动文件大小阈值'),
  type: 'input',
  defaultValue: 100 * 1024, // 100KB
  schema: {
    type: 'number',
    minimum: 1,
    maximum: 1024 * 1024 * 1024, // 1GB
  },
};
