import type { LinkProps } from '@tanstack/react-router';
import type { Corner } from '@/features/home/corner-link';

export type NavLink = {
  to: LinkProps['to'];
  label: string;
  /** Where the link sits on the desktop home page. */
  corner: Corner;
};

export const NAV_LINKS: readonly NavLink[] = [
  { to: '/odyah', label: 'ОДЯГ', corner: 'tl' },
  { to: '/manifest', label: 'МАНІФЕСТ', corner: 'tr' },
  { to: '/about', label: 'ЕБАУТ', corner: 'bl' },
  { to: '/photojournal', label: 'ФОТО', corner: 'br' },
];
