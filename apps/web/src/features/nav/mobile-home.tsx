import { Link } from '@tanstack/react-router';
import { InkTriangle } from './ink-triangle';

type MobileHomeProps = {
  /** Shown inside a section; hidden (but mounted) on the welcome screen. */
  visible: boolean;
};

/**
 * The way home on portrait phones: top centre, an ink triangle pointing up
 * over the word. Drawn in paper with difference blending so it reads on the
 * black margins and on the white window alike (the film runs under it).
 */
export const MobileHome = ({ visible }: MobileHomeProps) => (
  <Link
    to="/"
    aria-hidden={!visible}
    tabIndex={visible ? 0 : -1}
    className="fixed left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center font-display font-semibold text-paper mix-blend-difference transition-opacity duration-300 portrait:flex"
    style={{
      top: 'max(14px, env(safe-area-inset-top))',
      fontSize: 'clamp(13px, 4vw, 16px)',
      opacity: visible ? 1 : 0,
      pointerEvents: visible ? undefined : 'none',
      transitionDelay: visible ? '0.6s' : '0s',
    }}
  >
    <span aria-hidden="true" className="block h-[14px] w-[14px]">
      <InkTriangle size={14} color="paper" seed={30} paused={!visible} />
    </span>
    <span className="block py-1" style={{ transform: 'rotate(-2deg)' }}>
      ДОДОМУ
    </span>
  </Link>
);
