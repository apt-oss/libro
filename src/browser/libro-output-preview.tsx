import { concatMultilineString, defaultSanitizer } from '@difizen/libro-common';
import { renderText } from '@difizen/libro-rendermime';
import { URI, useInjectable } from '@opensumi/ide-core-browser';
import React, { useEffect, useRef, useState } from 'react';
import styles from './libro.module.less';
import { ILibroOpensumiService } from './libro.service';

export const LibroOutputPreview: React.FC = (...params) => {
  const previewRef = useRef<HTMLDivElement>(null);
  const uri = (params[0] as Record<string, any>).resource.uri as URI;
  const libroOpensumiService = useInjectable<ILibroOpensumiService>(
    ILibroOpensumiService,
  );
  const [refresh, setRefresh] = useState(new Date().getTime().toString());
  const initialData = concatMultilineString(
    libroOpensumiService.libroOutputMap.get(uri.path.toString())?.data || '',
  );
  const [data, setData] = useState<string>(initialData);
  const [mimeType, setMimeType] = useState<string>(
    libroOpensumiService.libroOutputMap.get(uri.path.toString())?.mimeType ||
      'application/vnd.jupyter.stdout',
  );
  libroOpensumiService.onOpenLibroOutputTab(() => {
    setRefresh(new Date().getTime().toString());
    setData(
      concatMultilineString(
        libroOpensumiService.libroOutputMap.get(uri.path.toString())?.data ||
          '',
      ),
    );
    setMimeType(
      libroOpensumiService.libroOutputMap.get(uri.path.toString())?.mimeType ||
        'application/vnd.jupyter.stdout',
    );
  });

  useEffect(() => {
    renderText({
      host: previewRef.current as HTMLElement,
      source: data,
      sanitizer: defaultSanitizer,
      mimeType: mimeType,
    });
  }, [data]);

  return (
    <div className={styles.libroOutputPreview}>
      <div ref={previewRef} key={refresh}></div>
    </div>
  );
};
