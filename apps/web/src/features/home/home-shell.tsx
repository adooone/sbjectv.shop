import { Outlet, useRouterState } from '@tanstack/react-router';
import { MobileHome, MobileNav, NAV_LINKS } from '@/features/nav';
import { type Corner, CornerLink } from './corner-link';
import { HypnoRings } from './hypno-rings';
import type { SceneId } from './rings-renderer';

/** The shape the window takes on each route. */
const SCENES: Record<string, SceneId> = {
  '/': 'home',
  '/tshirts': 'shirt',
  '/manifest': 'manifest',
  '/photojournal': 'film',
  '/about': 'about',
};

/**
 * Where the face flies when a section opens: away from that section's corner
 * (ФУТБОЛКИ points top-left, so the face leaves bottom-right), in viewport
 * units so it clears the screen.
 */
const EXIT: Record<Corner, { x: number; y: number }> = {
  tl: { x: 1, y: 1 },
  tr: { x: -1, y: 1 },
  bl: { x: 1, y: -1 },
  br: { x: -1, y: -1 },
};

/** Inside a section the way home sits in the diagonally opposite corner. */
const OPPOSITE: Record<Corner, Corner> = {
  tl: 'br',
  br: 'tl',
  tr: 'bl',
  bl: 'tr',
};

/**
 * The living frame: one canvas under every canvas route, the face, the corner
 * links and the bottom nav. The matched route's content renders on top.
 */
export const HomeShell = () => {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const scene = SCENES[pathname] ?? 'home';
  const atHome = scene === 'home';
  const current = NAV_LINKS.find((link) => link.to === pathname);
  const homeCorner = OPPOSITE[current?.corner ?? 'tl'];
  const exit = EXIT[current?.corner ?? 'tl'];

  return (
    <main className="home relative h-dvh w-full overflow-hidden bg-paper text-ink">
      <HypnoRings
        className="absolute inset-0 block h-full w-full"
        scene={scene}
        exit={atHome ? undefined : exit}
      />
      <Outlet />
      {NAV_LINKS.map((link) => (
        <CornerLink
          key={link.to}
          corner={link.corner}
          to={link.to}
          label={link.label}
          mode={atHome ? 'corner' : pathname === link.to ? 'title' : 'hidden'}
        />
      ))}
      {/* The way home: in the corner diagonally opposite the section's,
          fading in once the morph has settled and out when leaving. On the
          manifest its corner lands on the white half, so it is drawn in ink;
          above the film strip there is only a thin black band, so it is a row. */}
      <CornerLink
        corner={homeCorner}
        to="/"
        label="ДОДОМУ"
        mode={atHome ? 'hidden' : 'corner'}
        layout={scene === 'film' ? 'row' : 'diagonal'}
        tone={scene === 'manifest' ? 'ink' : 'paper'}
      />
      <MobileHome visible={!atHome} />
      <MobileNav />
    </main>
  );
};
