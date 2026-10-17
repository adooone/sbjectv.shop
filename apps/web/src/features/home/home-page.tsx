import { type CSSProperties, useMemo } from 'react';
import zheka from '@/assets/zheka.png';
import { MobileNav, NAV_LINKS } from '@/features/nav';
import { CornerLink } from './corner-link';
import { EdgeToggle, useWindowEdge } from './edge-toggle';
import { HypnoRings } from './hypno-rings';

export const HomePage = () => {
  const [edge, setEdge] = useWindowEdge();
  const options = useMemo(
    () => ({ windowRing: edge === 'oval' ? 0 : 1 }),
    [edge],
  );

  return (
    <main
      className="home relative h-dvh w-full overflow-hidden bg-paper text-ink"
      style={
        {
          // The rectangle window leaves bigger black corners, so the corner
          // links move inward to keep their distance from the edge.
          '--corner-inset': edge === 'rect' ? 'calc(24 * var(--kc))' : '0px',
          // Portrait design scale: the window ring (plus its stroke) spans the width.
          '--k-portrait':
            edge === 'rect' ? 'calc(100vw / 1176)' : 'calc(100vw / 1470)',
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
      <EdgeToggle value={edge} onChange={setEdge} />
      <MobileNav />
    </main>
  );
};
