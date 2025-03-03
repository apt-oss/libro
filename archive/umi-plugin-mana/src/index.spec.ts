import assert from 'assert';

import { pageContent } from './mana-runtime';

describe('umi-plugin-mana', () => {
  it('#page content', async () => {
    assert(
      pageContent('my-slot') ===
        `(async () => {
const { Slot } = await import('@difizen/libro-common/app');
const { Outlet } = await import('umi');

const Page = ({ children, ...props }) => {
  return (
  <Slot name="my-slot" viewProps={props}>
    <Outlet />
  </Slot>
  );
};

return Page
})()
`,
    );
  });
});
