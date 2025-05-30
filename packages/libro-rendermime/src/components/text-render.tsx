import type { JSONValue, MultilineString } from '@difizen/libro-common';
import { concatMultilineString } from '@difizen/libro-common';
import { useInject } from '@difizen/libro-common/app';
import type { BaseOutputView } from '@difizen/libro-core';
import { removeOverwrittenChars } from '@difizen/libro-core';
import React, { useEffect, useRef } from 'react';

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

  const mimeType = defaultRenderMime.defaultPreferredMimeType(
    model,
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
          concatMultilineString(JSON.parse(JSON.stringify(dataContent))),
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
  return (
    <div className="libro-text-render-container" ref={renderTextContainerRef}>
      <div className="libro-text-render" ref={renderTextRef} />
    </div>
  );
};

export const TextRender = React.memo(RawTextRender);
