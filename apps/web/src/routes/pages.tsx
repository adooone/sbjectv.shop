import { createRoute } from '@tanstack/react-router';
import { PlaceholderPage } from '@/features/placeholder';
import { ShirtPage } from '@/features/shirt';
import { Root } from './root';

const page = <const TPath extends string>(path: TPath, title: string) =>
  createRoute({
    getParentRoute: () => Root,
    path,
    component: () => <PlaceholderPage title={title} />,
  });

export const tshirtsRoute = createRoute({
  getParentRoute: () => Root,
  path: '/tshirts',
  component: ShirtPage,
});
export const manifestRoute = page('/manifest', 'Маніфест');
export const aboutRoute = page('/about', 'Ебаут');
export const photojournalRoute = page('/photojournal', 'Фото');
