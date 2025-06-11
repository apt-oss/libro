/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import { ArrowDown, ArrowRight } from '@difizen/libro-core';
import type { DisplayView, LibroView } from '@difizen/libro-core';
import { ConfigurationService } from '@difizen/libro-common/app';
import { getOrigin, prop, useInject } from '@difizen/libro-common/app';
import { BaseView, view, ViewInstance } from '@difizen/libro-common/app';
import { inject, transient } from '@difizen/libro-common/app';
import { l10n } from '@difizen/libro-common/l10n';
import React, { useRef } from 'react';

import { EnableExpandCollapse, TOCVisible } from './toc-configuration.js';
import { LibroTOCManager } from './toc-manager.js';
import type { IHeading } from './toc-protocol.js';
import type { LibroTOCProvider } from './toc-provider.js';
import './index.less';

interface DisplayHeading extends IHeading {
  hasChild: boolean;
  visible: boolean;
}

interface TocItemProps {
  heading: DisplayHeading;
  active: boolean;
  onClick: (heading: DisplayHeading) => void;
  onToggle: () => void;
  headingCollapsed: boolean;
}

const TocItem: React.FC<TocItemProps> = ({
  heading,
  onClick,
  active,
  headingCollapsed,
  onToggle,
}) => {
  const instance = useInject<TOCView>(ViewInstance);
  const { id, text, level, hasChild, visible } = heading;
  if (!visible) {
    return null;
  }
  const handleClick = () => {
    if (!id) {
      return;
    }

    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView();
    }
    onClick(heading);
  };
  return (
    <>
      <div
        className={`markdown-toc-container-anchor ${active ? 'active' : ''}`}
        style={{
          paddingLeft: instance.getHeadingIndentSize(level) + (hasChild ? 0 : 20),
        }}
        onClick={handleClick}
      >
        {hasChild && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className="libro-toc-collapsed"
          >
            {headingCollapsed ? <ArrowRight /> : <ArrowDown />}
          </span>
        )}

        {text}
      </div>
      <div className={`markdown-toc-container-anchor-shot ${active ? 'active' : ''}`} />
    </>
  );
};

export const TocRender = () => {
  const instance = useInject<TOCView>(ViewInstance);
  const containRef = useRef<HTMLDivElement>(null);
  const handleClick = (heading: IHeading) => {
    instance.activeHeading = heading;
    instance.tocProvider?.selectCellByHeading(heading);
  };

  return (
    <div
      className={`markdown-toc-container ${instance.isExpand ? 'expand' : 'collapse'}`}
      ref={containRef}
    >
      <div className="markdown-toc-container-header">
        <span>{instance.tocTitle}</span>
        {instance.supportExpand && (
          <div
            className="markdown-toc-expand-action"
            onClick={() => {
              instance.isExpand = !instance.isExpand;
            }}
          >
            {instance.isExpand ? <EyeInvisibleOutlined /> : <EyeOutlined />}
          </div>
        )}
      </div>
      {instance.isExpand &&
        instance.getDisplayHeadings().map((heading) => {
          const collapsed = instance.isHeadingCollapsed(heading);
          return (
            <TocItem
              active={instance.activeHeading?.id === heading.id}
              heading={heading}
              key={heading.id}
              onClick={handleClick}
              headingCollapsed={collapsed}
              onToggle={() => {
                if (heading.id) {
                  instance.headingCollapseState.set(heading.id, !collapsed);
                }
              }}
            />
          );
        })}
    </div>
  );
};

@transient()
@view('libro-toc-view')
export class TOCView extends BaseView implements DisplayView {
  parent: LibroView | undefined = undefined;
  protected configurationService: ConfigurationService;

  override view = TocRender;

  @prop()
  isDisplay: boolean;

  @prop()
  isExpand = true;

  @prop()
  supportExpand: boolean;

  @prop()
  tocProvider?: LibroTOCProvider;

  @prop()
  activeHeading: IHeading | undefined;

  protected libroTOCManager: LibroTOCManager;

  @prop()
  tocTitle: string = l10n.t('大纲');

  @prop()
  headingCollapseState = new Map<string, boolean>();

  constructor(
    @inject(LibroTOCManager) libroTOCManager: LibroTOCManager,
    @inject(ConfigurationService) configurationService: ConfigurationService,
  ) {
    super();
    this.libroTOCManager = libroTOCManager;
    this.configurationService = configurationService;
    this.configurationService
      .get(TOCVisible)
      .then((value) => {
        this.isDisplay = value;
        return;
      })
      .catch(() => {
        //
      });
    this.configurationService
      .get(EnableExpandCollapse)
      .then((value) => {
        this.supportExpand = value;
        return;
      })
      .catch(() => {
        //
      });
  }

  getHeadingIndentSize(level: number): number {
    return level * 12;
  }

  override onViewMount() {
    if (!this.tocProvider && this.parent) {
      getOrigin(this.parent.initialized)
        .then(() => {
          this.tocProvider = this.libroTOCManager.getTOCProvider(this.parent!);
          this.tocProvider.activeCellChange((header) => {
            this.activeHeading = header;
          });
          return;
        })
        .catch(() => {
          //
        });
    }
  }

  getDisplayHeadings(): DisplayHeading[] {
    const headings = this.tocProvider?.headings ?? [];

    return headings.map((item, index) => {
      return {
        ...item,
        visible: this.isHeadingVisible(item, index, headings),
        hasChild: this.hasChildren(item, index, headings),
      };
    });
  }

  protected isHeadingVisible(heading: IHeading, index: number, list: IHeading[]) {
    if (index === 0) {
      return true;
    }
    let headingCollapsed = false;
    let parent = heading;
    for (let i = index - 1; i >= 0; i--) {
      const current = list[i];
      if (current.level < parent.level) {
        parent = current;
        if (this.isHeadingCollapsed(parent)) {
          headingCollapsed = true;
          break;
        }
      }
    }

    return !headingCollapsed;
  }

  isHeadingCollapsed(heading: IHeading) {
    return heading.id ? (this.headingCollapseState.get(heading.id) ?? false) : false;
  }

  protected hasChildren(current: IHeading, index: number, list: IHeading[]) {
    if (index === list.length - 1) {
      return false;
    }
    if (current.level < list[index + 1].level) {
      return true;
    }
    return false;
  }

  override dispose() {
    this.tocProvider?.dispose();
  }
}
