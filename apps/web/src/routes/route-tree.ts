import { indexRoute } from './index';
import {
  aboutRoute,
  manifestRoute,
  tshirtsRoute,
  photojournalRoute,
} from './pages';
import { Root } from './root';

export const routeTree = Root.addChildren([
  indexRoute,
  tshirtsRoute,
  manifestRoute,
  aboutRoute,
  photojournalRoute,
]);
