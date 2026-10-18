import { createRoute } from '@tanstack/react-router';
import { SectionPage } from '@/features/sections/section-page';
import { Root } from './root';

const section = <const TPath extends string>(path: TPath, title: string) =>
  createRoute({
    getParentRoute: () => Root,
    path,
    component: () => <SectionPage title={title} />,
  });

export const tshirtsRoute = section('/tshirts', 'Футболки');
export const manifestRoute = section('/manifest', 'Маніфест');
export const aboutRoute = section('/about', 'Ебаут');
export const photojournalRoute = section('/photojournal', 'Фото');
