import { URI, useInjectable } from '@opensumi/ide-core-browser';
import { renderText } from "@difizen/libro-rendermime"
import { defaultSanitizer } from '@difizen/libro-common';
import React, { useState } from 'react';
import { useEffect, useRef } from 'react';
import { ILibroOpensumiService } from './libro.service';

export const LibroOutputPreview: React.FC = (...params) => {
  const previewRef = useRef<HTMLDivElement>(null);
  const uri = (params[0] as Record<string, any>).resource.uri as URI;
  const libroOpensumiService = useInjectable<ILibroOpensumiService>(
    ILibroOpensumiService,
  );
  const [refresh,setRefresh] = useState(new Date().getTime().toString())
  const initialData = libroOpensumiService.libroOutputMap.get(uri.path.toString())||''
  const [data, setData] = useState<string>(initialData)
  libroOpensumiService.onOpenLibroOutputTab(()=>{
    setRefresh(new Date().getTime().toString())
    setData(libroOpensumiService.libroOutputMap.get(uri.path.toString())||'')
  })

  useEffect(() => {
    renderText({
        host: previewRef.current as HTMLElement,
        source: data,
        sanitizer: defaultSanitizer,
        mimeType: 'application/vnd.jupyter.stdout',
    });
  }, [data]);

  return (
      <div>
        <div ref={previewRef} key={refresh}>
        </div>
      </div>
  );
};
