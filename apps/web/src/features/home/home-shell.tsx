import { Link, Outlet, useRouterState } from '@tanstack/react-router';
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
      {/* The face: centred at home, docked small in the bottom-left corner
          inside a section, where it is the way home. */}
      <Link
        to="/"
        aria-label="Додому"
        aria-hidden={atHome}
        tabIndex={atHome ? -1 : 0}
        data-docked={!atHome}
        className="face-link z-10 block select-none"
        style={{ pointerEvents: atHome ? 'none' : undefined }}
      >
        <img
          src={zheka}
          alt=""
          width={3508}
          height={3190}
          className="animate-face block h-auto w-full"
          style={{ aspectRatio: '3508 / 3190' }}
          draggable={false}
        />
      </Link>
      <Outlet />
      {atHome &&
        NAV_LINKS.map((link) => (
          <CornerLink
            key={link.to}
            corner={link.corner}
            to={link.to}
            label={link.label}
          />
        ))}
      {atHome && <HomeToggles value={settings} onChange={update} />}
      <MobileNav />
    </main>
  );
};
