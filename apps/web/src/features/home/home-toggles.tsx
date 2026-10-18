import { useEffect, useState } from 'react';

export type HomeSettings = {
  /** Ink the gap between the second and third lines. */
  stripe: boolean;
};

const STORAGE_KEY = 'sbjectv:home';
const DEFAULTS: HomeSettings = { stripe: true };

const read = (): HomeSettings => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<HomeSettings>;
    return { stripe: parsed.stripe !== false };
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

/**
 * Tiny switch at the bottom of the desktop home page. White text blended with
 * `difference` stays readable on both the ink and the paper.
 */
export const HomeToggles = ({ value, onChange }: HomeTogglesProps) => (
  <div
    className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-3 font-display text-paper mix-blend-difference portrait:hidden"
    style={{ fontSize: 'calc(12 * var(--kc))' }}
  >
    <button
      type="button"
      aria-pressed={value.stripe}
      onClick={() => onChange({ stripe: !value.stripe })}
      className={`cursor-pointer px-1 py-1 tracking-wide underline-offset-4 hover:underline ${value.stripe ? 'underline' : 'opacity-50'}`}
    >
      СМУГА
    </button>
  </div>
);
