import { Link, type LinkProps, useRouterState } from '@tanstack/react-router';
import { type CSSProperties, useState } from 'react';
import { InkTriangle } from '@/features/nav/ink-triangle';

export type Corner = 'tl' | 'tr' | 'bl' | 'br';

type Placement = {
  /** Offsets of the 134px rotated triangle box from the two corner edges, design px. */
  triangle: { x: number; y: number; rotate: number };
  /** Offsets of the label's centre from the two corner edges, design px. */
  label: { x: number; y: number; rotate: number };
};

// Measured from the Figma frame "Desktop - 1" (1440 × 1024), groups "колекції".
const PLACEMENTS: Record<Corner, Placement> = {
  tl: {
    triangle: { x: -10, y: -20, rotate: -51.1 },
    label: { x: 98, y: 83, rotate: -51.37 },
  },
  tr: {
    triangle: { x: -21, y: -14, rotate: 40.03 },
    label: { x: 88, y: 104, rotate: 39.75 },
  },
  // Bottom labels are turned 180° from the Figma frame so they read upright.
  bl: {
    triangle: { x: -10, y: -9, rotate: -137.87 },
    label: { x: 105, y: 106, rotate: 41.85 },
  },
  br: {
    triangle: { x: -9, y: -20, rotate: 129.18 },
    label: { x: 112, y: 94, rotate: -51.1 },
  },
};

const EDGES: Record<Corner, { x: 'left' | 'right'; y: 'top' | 'bottom' }> = {
  tl: { x: 'left', y: 'top' },
  tr: { x: 'right', y: 'top' },
  bl: { x: 'left', y: 'bottom' },
  br: { x: 'right', y: 'bottom' },
};

// --kc is one design pixel for the corners (a length), so multiply by a plain number.
const px = (value: number) => `calc(${value} * var(--kc))`;

// The Figma triangle box is 134 design px; the ink one is drawn smaller and
// keeps the same centre.
const FIGMA_BOX = 134;
const INK_BOX = 96;

const CORNER_SEEDS: Record<Corner, number> = { tl: 1, tr: 2, bl: 3, br: 4 };

/**
 * corner: as on the welcome screen. title: the label unrolls into the
 * section title (top-left, upright, larger) and the triangle fades.
 * hidden: fades out but stays mounted so it can come back.
 */
export type CornerMode = 'corner' | 'title' | 'hidden';
/** diagonal: tilted along the corner, as in Figma. row: upright text with the
 * triangle pointing right after it, for corners that sit on a thin black band. */
export type CornerLayout = 'diagonal' | 'row';

// Where the section title sits, relative to the corner box (design px).
const TITLE = { x: 72, y: 48, size: 46 };

type CornerLinkProps = {
  corner: Corner;
  label: string;
  to: LinkProps['to'];
  mode?: CornerMode;
  layout?: CornerLayout;
};

export const CornerLink = ({
  corner,
  label,
  to,
  mode = 'corner',
  layout = 'diagonal',
}: CornerLinkProps) => {
  const { triangle: tri, label: text } = PLACEMENTS[corner];
  const edge = EDGES[corner];
  // The corner of the section you are in leads back home.
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const active = pathname === to;
  // Hover or keyboard focus fills the triangle instead of underlining.
  const [hot, setHot] = useState(false);

  // --corner-inset (index.css) pushes the whole corner group inward.
  const box: CSSProperties = {
    [edge.x]: 'var(--corner-inset, 0px)',
    [edge.y]: 'var(--corner-inset, 0px)',
    width: px(230),
    height: px(230),
    opacity: mode === 'hidden' ? 0 : 1,
    pointerEvents: mode === 'corner' ? undefined : 'none',
    // Appearing waits for the morph to settle a little; hiding is immediate.
    transition: `opacity 0.35s ease-in-out ${mode === 'corner' ? '0.25s' : '0s'}`,
  };
  const shift = (FIGMA_BOX - INK_BOX) / 2;
  const row = layout === 'row';
  // Row: a smaller triangle, apex to the right, after the upright label.
  const triangleStyle: CSSProperties = row
    ? {
        [edge.x]: px(28),
        [edge.y]: px(40),
        width: px(52),
        height: px(52),
        transform: 'rotate(90deg)',
        opacity: mode === 'title' ? 0 : 1,
        transition: 'opacity 0.2s ease-in-out',
      }
    : {
        [edge.x]: px(tri.x + shift),
        [edge.y]: px(tri.y + shift),
        width: px(INK_BOX),
        height: px(INK_BOX),
        transform: `rotate(${tri.rotate}deg)`,
        opacity: mode === 'title' ? 0 : 1,
        transition: 'opacity 0.2s ease-in-out',
      };
  // The label is anchored by its centre: shift it back by half its size toward
  // the corner, then rotate it along the diagonal like in the design.
  const labelStyle: CSSProperties =
    mode === 'title'
      ? {
          [edge.x]: px(TITLE.x),
          [edge.y]: px(TITLE.y),
          fontSize: `calc(${TITLE.size} * var(--k))`,
          transform: 'translate(0, 0) rotate(0deg)',
        }
      : row
        ? {
            [edge.x]: px(92),
            [edge.y]: px(52),
            fontSize: px(30),
            transform: 'translate(0, 0) rotate(0deg)',
          }
        : {
            [edge.x]: px(text.x),
            [edge.y]: px(text.y),
            fontSize: px(30),
            transform: `translate(${edge.x === 'left' ? '-50%' : '50%'}, ${edge.y === 'top' ? '-50%' : '50%'}) rotate(${text.rotate}deg)`,
          };
  // The label glides between its corner pose and the title pose.
  labelStyle.transition =
    'left 0.3s ease-in-out, top 0.3s ease-in-out, right 0.3s ease-in-out, bottom 0.3s ease-in-out, transform 0.3s ease-in-out, font-size 0.3s ease-in-out';

  return (
    <Link
      to={active ? '/' : to}
      aria-current={active ? 'page' : undefined}
      aria-hidden={mode !== 'corner'}
      tabIndex={mode === 'corner' ? 0 : -1}
      className="group absolute block overflow-visible outline-none portrait:hidden"
      style={box}
      onMouseEnter={() => setHot(true)}
      onMouseLeave={() => setHot(false)}
      onFocus={() => setHot(true)}
      onBlur={() => setHot(false)}
    >
      <span className="absolute block" style={triangleStyle} aria-hidden="true">
        <InkTriangle
          size={INK_BOX}
          color="paper"
          seed={CORNER_SEEDS[corner]}
          filled={hot && mode === 'corner'}
          paused={mode === 'hidden'}
          className="block h-full w-full"
        />
      </span>
      <span
        className="absolute block whitespace-nowrap font-display font-semibold text-paper leading-none"
        style={labelStyle}
      >
        {label}
      </span>
    </Link>
  );
};
