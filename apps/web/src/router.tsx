import { createRouter } from '@tanstack/react-router';
import { indexRoute } from './routes/index';
import { Root } from './routes/root';

const router = createRouter({
  routeTree: Root.addChildren([indexRoute]),
});

export default router;

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
