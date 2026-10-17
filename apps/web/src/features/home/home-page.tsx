import zheka from '@/assets/zheka.png';
import { CornerLink } from './corner-link';
import { HypnoRings } from './hypno-rings';

export const HomePage = () => (
  <main className="home relative h-dvh w-full overflow-hidden bg-paper text-ink">
    <h1 className="sr-only">sbjectv</h1>
    <HypnoRings className="absolute inset-0 block h-full w-full" />
    <img
      src={zheka}
      alt="жека"
      className="animate-face absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 select-none"
      style={{ width: 'calc(139px * var(--k))' }}
      draggable={false}
    />
    <CornerLink corner="tl" to="/odyah" label="ОДЯГ" />
    <CornerLink corner="tr" to="/manifest" label="МАНІФЕСТ" />
    <CornerLink corner="bl" to="/about" label="ЕБАУТ" />
    <CornerLink corner="br" to="/photojournal" label="ФОТОЖУРНАЛ" />
  </main>
);
