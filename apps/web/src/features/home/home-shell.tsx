import { Outlet, useRouterState } from '@tanstack/react-router';
import { useCallback, useMemo, useRef } from 'react';
import zheka from '@/assets/zheka.png';
import { MobileNav, NAV_LINKS } from '@/features/nav';
import { type Corner, CornerLink } from './corner-link';
import { HomeToggles, useHomeSettings } from './home-toggles';
import { HypnoRings } from './hypno-rings';
import {
  type SceneId,
  TRANSITION_HOME_SECONDS,
  TRANSITION_OUT_SECONDS,
} from './rings-renderer';

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
  const [settings, update] = useHomeSettings();
  const options = useMemo(
    () => ({ inkStripe: settings.stripe }),
    [settings.stripe],
  );
  const atHome = scene === 'home';
  const current = NAV_LINKS.find((link) => link.to === pathname);
  const homeCorner = OPPOSITE[current?.corner ?? 'tl'];
  const exit = EXIT[current?.corner ?? 'tl'];
  // The face is moved every frame by the renderer's own flight, so it and
  // the rings leave and return as one piece.
  const faceRef = useRef<HTMLImageElement>(null);
  const onShift = useCallback((x: number, y: number, alpha: number) => {
    const face = faceRef.current;
    if (!face) return;
    face.style.translate = `calc(-50% + ${x}px) calc(-50% + ${y}px)`;
    face.style.opacity = String(alpha);
  }, []);
  // Titles and the way home appear only once everything has settled.
  const appearDelay = atHome ? TRANSITION_HOME_SECONDS : TRANSITION_OUT_SECONDS;

  return (
    <main className="home relative h-dvh w-full overflow-hidden bg-paper text-ink">
      <HypnoRings
        className="absolute inset-0 block h-full w-full"
        options={options}
        scene={scene}
        exit={atHome ? undefined : exit}
        onShift={onShift}
      />
      <img
        ref={faceRef}
        src={zheka}
        alt="жека"
        width={3508}
        height={3190}
        className="animate-face absolute top-1/2 left-1/2 h-auto -translate-x-1/2 -translate-y-1/2 select-none"
        style={{
          width: 'var(--face)',
          aspectRatio: '3508 / 3190',
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
          appearDelay={appearDelay}
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
        appearDelay={appearDelay}
        layout={scene === 'film' ? 'row' : 'diagonal'}
        tone={scene === 'manifest' ? 'ink' : 'paper'}
      />
      {atHome && <HomeToggles value={settings} onChange={update} />}
      <MobileNav />
    </main>
  );
};
