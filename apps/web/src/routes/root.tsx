import { Outlet, createRootRoute } from '@tanstack/react-router';

export const Root = createRootRoute({
  component: () => <Outlet />,
});
