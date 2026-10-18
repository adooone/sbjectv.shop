import {
  Outlet,
  createRootRoute,
  useRouterState,
} from '@tanstack/react-router';
import { HomeShell, isCanvasRoute } from '@/features/home/home-shell';

const RootComponent = () => {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return isCanvasRoute(pathname) ? <HomeShell /> : <Outlet />;
};

export const Root = createRootRoute({
  component: RootComponent,
});
