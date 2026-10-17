import { useEffect, useState } from 'react';

/** Which ring the ink window follows on desktop. */
export type WindowEdge = 'oval' | 'rect';

export type HomeSettings = {
  edge: WindowEdge;
  /** Ink the gap between the second and third lines. */
  stripe: boolean;
};

const STORAGE_KEY = 'sbjectv:home';
const DEFAULTS: HomeSettings = { edge: 'rect', stripe: true };

const read = (): HomeSettings => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<HomeSettings>;
    return {
      edge: parsed.edge === 'oval' ? 'oval' : 'rect',
      stripe: parsed.stripe !== false,
    };
  } catch {
    return DEFAULTS;
  }
};

export const useHomeSettings = () => {
  const [settings, setSettings] = useState<HomeSettings>(read);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Private mode or blocked storage: the choice just won't persist.
    }
  }, [settings]);
  const update = (patch: Partial<HomeSettings>) =>
    setSettings((current) => ({ ...current, ...patch }));
  return [settings, update] as const;
};

type HomeTogglesProps = {
  value: HomeSettings;
  onChange: (patch: Partial<HomeSettings>) => void;
};

const EDGES: { value: WindowEdge; label: string }[] = [
  { value: 'rect', label: 'ПРЯМОКУТНИК' },
  { value: 'oval', label: 'ОВАЛ' },
];

const buttonClass = (active: boolean) =>
  `cursor-pointer px-1 py-1 tracking-wide underline-offset-4 hover:underline ${active ? 'underline' : 'opacity-50'}`;

/**
 * Tiny switches at the bottom of the desktop home page. White text blended
 * with `difference` stays readable on both the ink and the paper.
 */
export const HomeToggles = ({ value, onChange }: HomeTogglesProps) => (
  <div
    className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-3 font-display text-paper mix-blend-difference portrait:hidden"
    style={{ fontSize: 'calc(12 * var(--kc))' }}
  >
    <fieldset className="flex gap-3 border-0 p-0">
      <legend className="sr-only">Край віконця</legend>
      {EDGES.map((option) => {
        const active = option.value === value.edge;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange({ edge: option.value })}
            className={buttonClass(active)}
          >
            {option.label}
          </button>
        );
      })}
    </fieldset>
    <span aria-hidden="true" className="opacity-50">
      ·
    </span>
    <button
      type="button"
      aria-pressed={value.stripe}
      onClick={() => onChange({ stripe: !value.stripe })}
      className={buttonClass(value.stripe)}
    >
      СМУГА
    </button>
  </div>
);
