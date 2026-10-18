import { Outlet, useRouterState } from '@tanstack/react-router';
import { useMemo } from 'react';
import zheka from '@/assets/zheka.png';
import { MobileNav, NAV_LINKS } from '@/features/nav';
import { CornerLink } from './corner-link';
import { HomeToggles, useHomeSettings } from './home-toggles';
import { HypnoRings } from './hypno-rings';
import type { SceneId } from './rings-renderer';

/** Routes drawn on the shared canvas, and the shape the window takes there. */
const SCENES: Record<string, SceneId> = {
  '/': 'home',
  '/tshirts': 'shirt',
};

export const isCanvasRoute = (pathname: string) => pathname in SCENES;

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

  return (
    <main className="home relative h-dvh w-full overflow-hidden bg-paper text-ink">
      <HypnoRings
        className="absolute inset-0 block h-full w-full"
        options={options}
        scene={scene}
      />
      <img
        src={zheka}
        alt="жека"
        width={3508}
        height={3190}
        className="animate-face absolute top-1/2 left-1/2 h-auto -translate-x-1/2 -translate-y-1/2 select-none transition-opacity duration-500"
        style={{
          width: 'var(--face)',
          aspectRatio: '3508 / 3190',
          opacity: atHome ? 1 : 0,
          pointerEvents: atHome ? undefined : 'none',
        }}
        draggable={false}
      />
      <Outlet />
      {atHome ? (
        NAV_LINKS.map((link) => (
          <CornerLink
            key={link.to}
            corner={link.corner}
            to={link.to}
            label={link.label}
          />
        ))
      ) : (
        // Inside a section only the way home stays, in the top-left corner.
        <CornerLink corner="tl" to="/" label="ДОДОМУ" />
      )}
      {atHome && <HomeToggles value={settings} onChange={update} />}
      <MobileNav />
    </main>
  );
};
