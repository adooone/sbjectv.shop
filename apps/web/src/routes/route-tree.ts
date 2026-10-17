import { indexRoute } from './index';
import {
  aboutRoute,
  manifestRoute,
  odyahRoute,
  photojournalRoute,
} from './pages';
import { Root } from './root';

export const routeTree = Root.addChildren([
  indexRoute,
  odyahRoute,
  manifestRoute,
  aboutRoute,
  photojournalRoute,
]);
