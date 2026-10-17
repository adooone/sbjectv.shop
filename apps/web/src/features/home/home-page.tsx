import { type CSSProperties, useMemo } from 'react';
import zheka from '@/assets/zheka.png';
import { MobileNav, NAV_LINKS } from '@/features/nav';
import { CornerLink } from './corner-link';
import { HomeToggles, useHomeSettings } from './edge-toggle';
import { HypnoRings } from './hypno-rings';

export const HomePage = () => {
  const [settings, update] = useHomeSettings();
  const { edge, stripe } = settings;
  const options = useMemo(
    () => ({ windowRing: edge === 'oval' ? 0 : 1, inkStripe: stripe }),
    [edge, stripe],
  );

  return (
    <main
      className="home relative h-dvh w-full overflow-hidden bg-paper text-ink"
      style={
        {
          // The rectangle window leaves bigger black corners, so the corner
          // links move inward to keep their distance from the edge.
          '--corner-inset': edge === 'rect' ? 'calc(24 * var(--kc))' : '0px',
          // Portrait design scale: the frame's long side spans the height and
          // the window ring (815 or 1024 px plus the 30 px stroke) the width.
          '--k-portrait':
            edge === 'rect'
              ? 'min(100vh / 1440, 100vw / 845)'
              : 'min(100vh / 1440, 100vw / 1054)',
        } as CSSProperties
      }
    >
      <h1 className="sr-only">sbjectv</h1>
      <HypnoRings
        className="absolute inset-0 block h-full w-full"
        options={options}
      />
      <img
        src={zheka}
        alt="жека"
        width={3508}
        height={3190}
        className="animate-face absolute top-1/2 left-1/2 h-auto -translate-x-1/2 -translate-y-1/2 select-none"
        style={{ width: 'var(--face)', aspectRatio: '3508 / 3190' }}
        draggable={false}
      />
      {NAV_LINKS.map((link) => (
        <CornerLink
          key={link.to}
          corner={link.corner}
          to={link.to}
          label={link.label}
        />
      ))}
      <HomeToggles value={settings} onChange={update} />
      <MobileNav />
    </main>
  );
};
