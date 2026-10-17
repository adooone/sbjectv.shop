import { createRoute } from '@tanstack/react-router';
import { PlaceholderPage } from '@/features/placeholder';
import { Root } from './root';

const page = <const TPath extends string>(path: TPath, title: string) =>
  createRoute({
    getParentRoute: () => Root,
    path,
    component: () => <PlaceholderPage title={title} />,
  });

export const odyahRoute = page('/odyah', 'Одяг');
export const manifestRoute = page('/manifest', 'Маніфест');
export const aboutRoute = page('/about', 'Ебаут');
export const photojournalRoute = page('/photojournal', 'Фотожурнал');
