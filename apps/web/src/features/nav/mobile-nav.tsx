import { Link } from '@tanstack/react-router';
import { Fragment } from 'react';
import triangle from '@/assets/corner-triangle.svg';
import { InkEdge } from './ink-edge';
import { NAV_LINKS } from './links';

// Each word leans a little, alternating, like the hand-placed corner labels.
const TILTS = [-3, 2, -2, 3];

/** Bottom navigation for portrait screens; the desktop uses the corner links. */
export const MobileNav = () => (
  <nav
    aria-label="Розділи"
    className="fixed inset-x-0 bottom-0 z-10 hidden portrait:block"
  >
    <InkEdge className="block h-7 w-full" />
    <div
      className="flex items-center justify-center gap-2 bg-paper px-3 pt-1 font-mono text-ink"
      style={{
        paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
        fontSize: 'clamp(11px, 3.4vw, 14px)',
      }}
    >
      {NAV_LINKS.map((link, i) => (
        <Fragment key={link.to}>
          {i > 0 && (
            <img
              src={triangle}
              alt=""
              aria-hidden="true"
              className="block h-[9px] w-[10px]"
            />
          )}
          <Link
            to={link.to}
            className="block whitespace-nowrap py-3 underline-offset-4 hover:underline focus-visible:underline"
            activeProps={{ className: 'underline' }}
            style={{ transform: `rotate(${TILTS[i % TILTS.length]}deg)` }}
          >
            {link.label}
          </Link>
        </Fragment>
      ))}
    </div>
  </nav>
);
