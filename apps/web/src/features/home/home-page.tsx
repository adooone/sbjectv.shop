import { useMemo } from 'react';
import zheka from '@/assets/zheka.png';
import { MobileNav, NAV_LINKS } from '@/features/nav';
import { CornerLink } from './corner-link';
import { HypnoRings } from './hypno-rings';
import { HomeToggles, useHomeSettings } from './home-toggles';

export const HomePage = () => {
  const [settings, update] = useHomeSettings();
  const options = useMemo(
    () => ({ inkStripe: settings.stripe }),
    [settings.stripe],
  );

  return (
    <main className="home relative h-dvh w-full overflow-hidden bg-paper text-ink">
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
