import { Link, useRouterState } from '@tanstack/react-router';
import { Fragment } from 'react';
import { InkEdge } from './ink-edge';
import { InkTriangle } from './ink-triangle';
import { NAV_LINKS } from './links';

// Each word leans a little, alternating, like the hand-placed corner labels.
const TILTS = [-3, 2, -2, 3];

/** Bottom navigation for portrait screens; the desktop uses the corner links. */
export const MobileNav = () => {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav
      aria-label="Розділи"
      className="fixed inset-x-0 bottom-0 z-10 hidden portrait:block"
    >
      <InkEdge className="block h-7 w-full" />
      <div
        className="flex items-center justify-center gap-2 bg-paper px-3 pt-1 font-display font-semibold text-ink"
        style={{
          paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
          fontSize: 'clamp(11px, 3.4vw, 14px)',
        }}
      >
        {NAV_LINKS.map((link, i) => (
          <Fragment key={link.to}>
            {i > 0 && (
              <span aria-hidden="true" className="block h-[18px] w-[18px]">
                <InkTriangle size={18} color="ink" seed={10 + i} filled />
              </span>
            )}
            <Link
              to={pathname === link.to ? '/' : link.to}
              className="relative block whitespace-nowrap py-3"
              style={{ transform: `rotate(${TILTS[i % TILTS.length]}deg)` }}
            >
              {link.label}
              {/* "You are here": a filled ink triangle pointing up at the
                  open section's word. Always mounted so it can pour in. */}
              <span
                aria-hidden="true"
                className="absolute bottom-0 left-1/2 block h-[12px] w-[12px] -translate-x-1/2 transition-opacity duration-300"
                style={{ opacity: pathname === link.to ? 1 : 0 }}
              >
                <InkTriangle
                  size={12}
                  color="ink"
                  seed={20 + i}
                  filled={pathname === link.to}
                  paused={pathname !== link.to}
                />
              </span>
            </Link>
          </Fragment>
        ))}
      </div>
    </nav>
  );
};
