import { Outlet, useRouterState } from '@tanstack/react-router';
import { useMemo } from 'react';
import zheka from '@/assets/zheka.png';
import { MobileNav, NAV_LINKS } from '@/features/nav';
import { type Corner, CornerLink } from './corner-link';
import { HomeToggles, useHomeSettings } from './home-toggles';
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

/** Inside a section the way home sits on the same side, in the other corner. */
const OPPOSITE: Record<Corner, Corner> = {
  tl: 'bl',
  bl: 'tl',
  tr: 'br',
  br: 'tr',
};

/**
 * The living frame: one canvas under every canvas route, the face, the corner
 * links and the bottom nav. The matched route's content renders on top.
 */
export const HomeShell = () => {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const scene = SCENES[pathname] ?? 'home';
  const [settings, update] = useHomeSettings();
  const options = useMemo(
    () => ({ inkStripe: settings.stripe }),
    [settings.stripe],
  );
  const atHome = scene === 'home';
  const current = NAV_LINKS.find((link) => link.to === pathname);
  const homeCorner = OPPOSITE[current?.corner ?? 'tl'];
  const exit = EXIT[current?.corner ?? 'tl'];

  return (
    <main className="home relative h-dvh w-full overflow-hidden bg-paper text-ink">
      <HypnoRings
        className="absolute inset-0 block h-full w-full"
        options={options}
        scene={scene}
        exit={atHome ? undefined : exit}
      />
      <img
        src={zheka}
        alt="жека"
        width={3508}
        height={3190}
        className="animate-face absolute top-1/2 left-1/2 h-auto select-none"
        style={{
          width: 'var(--face)',
          aspectRatio: '3508 / 3190',
          // Centred at home; in a section it has flown off screen away from
          // the section's corner, and it flies back the same way.
          translate: atHome
            ? '-50% -50%'
            : `calc(-50% + ${exit.x * 70}vw) calc(-50% + ${exit.y * 70}vh)`,
          opacity: atHome ? 1 : 0,
          transition: atHome
            ? 'translate 0.6s cubic-bezier(0.2, 0.8, 0.3, 1), opacity 0.3s ease-out'
            : 'translate 0.55s cubic-bezier(0.6, 0, 0.9, 0.4), opacity 0.35s ease-in 0.2s',
          pointerEvents: atHome ? undefined : 'none',
        }}
        draggable={false}
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
      {/* The way home: on the same side as the section's corner, in the other
          corner, fading in once the morph has settled and out when leaving. */}
      <CornerLink
        corner={homeCorner}
        to="/"
        label="ДОДОМУ"
        mode={atHome ? 'hidden' : 'corner'}
        // Above the film strip there is only a thin black band.
        layout={scene === 'film' ? 'row' : 'diagonal'}
      />
      {atHome && <HomeToggles value={settings} onChange={update} />}
      <MobileNav />
    </main>
  );
};
