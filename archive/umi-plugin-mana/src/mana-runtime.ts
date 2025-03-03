import type { IApi } from 'umi';

export const DIR_NAME_IN_TMP = 'plugin-mana';
interface UmiRoute {
  name: string;
  path: string;
  slot: string;
  parentId?: string;
  id: string;
  absPath: string;
  file?: string;
}

type Routemap = Record<string, UmiRoute>;

export const providerContent = `import React from 'react';
import { ManaAppPreset, ManaComponents } from '@difizen/libro-common/app';
import RootModule from '@/modules/app.module';

export default ({ children }: { children: React.ReactNode }) => {
  return (
    <ManaComponents.Application modules={[ManaAppPreset, RootModule]} renderChildren={true}>
      {children}
    </ManaComponents.Application>
  );
};
`;

const runtimeContent = `import React from 'react';
import Provider from './Provider';

export function dataflowProvider(container: React.ReactNode) {
  return React.createElement(
    Provider,
    null,
    container,
  );
}
`;

export const pageContent = (slot: string) => `(async () => {
const { Slot } = await import('@difizen/libro-common/app');
const { Outlet } = await import('umi');

const Page = ({ children, ...props }) => {
  return (
  <Slot name="${slot}" viewProps={props}>
    <Outlet />
  </Slot>
  );
};

return Page
})()
`;

const getRoutePagePath = (route: UmiRoute) => ({
  writePath: `pages/${route.slot}.tsx`,
  routePath: `@@/${DIR_NAME_IN_TMP}/pages/${route.slot}`,
});

const writeRoutePage = (api: IApi, route: UmiRoute): void => {
  if (route.slot) {
    api.writeTmpFile({
      path: getRoutePagePath(route).writePath,
      content: pageContent(route.slot),
    });
  }
};

/**
 * slot router config
 */
export default (api: IApi) => {
  let cacheRouteMap: Routemap = {};
  // Add provider wrapper with rootContainer
  api.addRuntimePlugin(() => '../plugin-mana/runtime');
  api.addRuntimePluginKey(() => ['mana']);

  api.onGenerateFiles(async () => {
    try {
      api.writeTmpFile({
        path: '/Provider.tsx',
        content: providerContent,
      });

      api.writeTmpFile({
        path: '/runtime.tsx',
        content: runtimeContent,
      });

      const keys = Object.keys(cacheRouteMap);
      keys.forEach((key) => writeRoutePage(api, cacheRouteMap[key]));
    } catch (e) {
      console.error(e);
    }
  });

  api.modifyRoutes((routeMap: any) => {
    cacheRouteMap = routeMap;

    Object.keys(routeMap).forEach((id) => {
      const route = routeMap[id];
      if (route.slot !== undefined) {
        route.file = pageContent(route.slot);
      }
    });
    return routeMap;
  });
};
