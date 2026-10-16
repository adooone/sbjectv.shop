import { Outlet, createRootRoute } from '@tanstack/react-router';
import { Layout } from '@/features/layout';

export const Root = createRootRoute({
  component: () => (
    <Layout>
      <Outlet />
    </Layout>
  ),
});
