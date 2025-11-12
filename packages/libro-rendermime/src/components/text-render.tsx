import type { JSONValue, MultilineString } from '@difizen/libro-common';
import { concatMultilineString } from '@difizen/libro-common';
import { useInject } from '@difizen/libro-common/app';
import type { BaseOutputView } from '@difizen/libro-core';
import { removeOverwrittenChars } from '@difizen/libro-core';
import React, { useEffect, useRef, useState } from 'react';
import './index.less';

import { renderText } from '../renderers.js';
import type { IRenderMimeRegistry } from '../rendermime-protocol.js';
import { RenderMimeRegistry } from '../rendermime-registry.js';

function getLastThreeAfterFirstTwo(arr: string[]): string[] {
  const startIndex = Math.max(2, arr.length - 3);
  return arr.slice(startIndex);
}

export const RawTextRender: React.FC<{ model: BaseOutputView }> = (props: {
  model: BaseOutputView;
}) => {
  const { model } = props;
  const renderTextRef = useRef<HTMLDivElement>(null);
  const renderTextContainerRef = useRef<HTMLDivElement>(null);
  const defaultRenderMime = useInject<IRenderMimeRegistry>(RenderMimeRegistry);
  const [isLargeOutputDisplay, setIsLargeOutputDisplay] = useState(
    model.cell.isLargeOutputDisplay,
  );

  const mimeType = defaultRenderMime.defaultPreferredMimeType(
    model,
    isLargeOutputDisplay ? 'largeOutput' : undefined,
    // model.trusted ? 'any' : 'ensure'
  );
  let dataContent: JSONValue | MultilineString | null = null;
  if (mimeType) {
    dataContent = model.data[mimeType];
  }

  useEffect(() => {
    if (dataContent && mimeType) {
      let displaySource: string;
      if (
        (mimeType === 'application/vnd.libro.large.output.stdout' ||
          mimeType === 'application/vnd.libro.large.output.stderr') &&
        Array.isArray(dataContent) &&
        dataContent.length > 1
      ) {
        displaySource = removeOverwrittenChars(
          concatMultilineString([
            ...(dataContent as string[]).slice(0, 2),
            ...getLastThreeAfterFirstTwo(dataContent as string[]),
          ]),
        );
      } else {
        displaySource = removeOverwrittenChars(
          concatMultilineString(dataContent as MultilineString),
        );
      }

      renderText({
        host: renderTextRef.current as HTMLElement,
        source: displaySource,
        sanitizer: defaultRenderMime.sanitizer,
        mimeType: mimeType,
      });
      if (
        mimeType === 'application/vnd.jupyter.stderr' ||
        mimeType === 'application/vnd.libro.large.output.stderr'
      ) {
        renderTextContainerRef.current?.setAttribute(
          'data-mime-type',
          'application/vnd.jupyter.stderr',
        );
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mimeType, dataContent]);

  let content = null;

  if (isLargeOutputDisplay) {
    content = (
      <>
        <div
          className="libro-text-render"
          ref={renderTextRef}
          style={{
            overflowY: 'auto',
            maxHeight: 'unset',
          }}
        />
        {model.raw['display_text'] && (
          <div className="libro-text-display-action-container">
            <span>输出已被截断，点击可在滚动容器内</span>
            <a
              onClick={() => {
                model.cell.isLargeOutputDisplay = !model.cell.isLargeOutputDisplay;
                setIsLargeOutputDisplay(!isLargeOutputDisplay);
              }}
              className="libro-text-display-action"
            >
              滚动查看
            </a>
            <span>
              ，或在
              <a
                className="libro-text-display-action"
                onClick={() => {
                  const mimeType = defaultRenderMime.defaultPreferredMimeType(
                    model,
                    undefined,
                  );
                  let dataContent: JSONValue | MultilineString | null = null;
                  if (mimeType) {
                    dataContent = model.data[mimeType];
                    if (dataContent !== null) {
                      model.cell.parent.outputRenderTabEmitter.fire({
                        mimeType,
                        data: (dataContent as MultilineString | null) || '',
                      });
                    }
                  }
                }}
              >
                文本编辑器
              </a>
              中打开
            </span>
          </div>
        )}
      </>
    );
  } else {
    content = (
      <>
        <div
          className="libro-text-render"
          ref={renderTextRef}
          style={{
            overflowY: 'auto',
            maxHeight: '420px',
          }}
        />
        {model.raw['display_text'] && (
          <div className="libro-text-display-action-container">
            <span>当前处于滚动查看，点击可</span>
            <a
              onClick={() => {
                model.cell.isLargeOutputDisplay = !model.cell.isLargeOutputDisplay;
                setIsLargeOutputDisplay(!isLargeOutputDisplay);
              }}
              className="libro-text-display-action"
            >
              截断查看
            </a>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="libro-text-render-container" ref={renderTextContainerRef}>
      {content}
    </div>
  );
};

export const TextRender = React.memo(RawTextRender);
