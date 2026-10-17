import { useEffect, useState } from 'react';

/** Which ring the ink window follows on desktop. */
export type WindowEdge = 'oval' | 'rect';

const STORAGE_KEY = 'sbjectv:window-edge';

const read = (): WindowEdge => {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'oval' ? 'oval' : 'rect';
  } catch {
    return 'rect';
  }
};

export const useWindowEdge = () => {
  const [edge, setEdge] = useState<WindowEdge>(read);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, edge);
    } catch {
      // Private mode or blocked storage: the choice just won't persist.
    }
  }, [edge]);
  return [edge, setEdge] as const;
};

type EdgeToggleProps = {
  value: WindowEdge;
  onChange: (edge: WindowEdge) => void;
};

const OPTIONS: { value: WindowEdge; label: string }[] = [
  { value: 'rect', label: 'ПРЯМОКУТНИК' },
  { value: 'oval', label: 'ОВАЛ' },
];

/**
 * Tiny switch at the bottom of the desktop home page. White text blended with
 * `difference` stays readable on both the ink and the paper.
 */
export const EdgeToggle = ({ value, onChange }: EdgeToggleProps) => (
  <fieldset
    className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-3 border-0 p-0 font-display text-paper mix-blend-difference portrait:hidden"
    style={{ fontSize: 'calc(12 * var(--kc))' }}
  >
    <legend className="sr-only">Край віконця</legend>
    {OPTIONS.map((option) => {
      const active = option.value === value;
      return (
        <button
          key={option.value}
          type="button"
          aria-pressed={active}
          onClick={() => onChange(option.value)}
          className={`cursor-pointer px-1 py-1 tracking-wide underline-offset-4 hover:underline ${active ? 'underline' : 'opacity-50'}`}
        >
          {option.label}
        </button>
      );
    })}
  </fieldset>
);
