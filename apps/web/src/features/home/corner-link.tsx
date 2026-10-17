import { Link, type LinkProps } from '@tanstack/react-router';
import type { CSSProperties } from 'react';
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

type CornerLinkProps = {
  corner: Corner;
  label: string;
  to: LinkProps['to'];
};

export const CornerLink = ({ corner, label, to }: CornerLinkProps) => {
  const { triangle: tri, label: text } = PLACEMENTS[corner];
  const edge = EDGES[corner];

  const box: CSSProperties = {
    [edge.x]: 0,
    [edge.y]: 0,
    width: px(230),
    height: px(230),
  };
  const shift = (FIGMA_BOX - INK_BOX) / 2;
  const triangleStyle: CSSProperties = {
    [edge.x]: px(tri.x + shift),
    [edge.y]: px(tri.y + shift),
    width: px(INK_BOX),
    height: px(INK_BOX),
    transform: `rotate(${tri.rotate}deg)`,
  };
  // The label is anchored by its centre: shift it back by half its size toward
  // the corner, then rotate it along the diagonal like in the design.
  const labelStyle: CSSProperties = {
    [edge.x]: px(text.x),
    [edge.y]: px(text.y),
    fontSize: px(30),
    transform: `translate(${edge.x === 'left' ? '-50%' : '50%'}, ${edge.y === 'top' ? '-50%' : '50%'}) rotate(${text.rotate}deg)`,
  };

  return (
    <Link
      to={to}
      className="group absolute block overflow-visible outline-none portrait:hidden"
      style={box}
    >
      <span className="absolute block" style={triangleStyle} aria-hidden="true">
        <InkTriangle
          size={INK_BOX}
          color="paper"
          seed={CORNER_SEEDS[corner]}
          className="block h-full w-full"
        />
      </span>
      <span
        className="absolute block whitespace-nowrap font-display text-paper leading-none underline-offset-4 group-hover:underline group-focus-visible:underline"
        style={labelStyle}
      >
        {label}
      </span>
    </Link>
  );
};
