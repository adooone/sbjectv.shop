import { createNoise2D } from 'simplex-noise';

/**
 * Hypnotic concentric rings, drawn on a 2D canvas.
 *
 * Geometry comes from the Figma frame "Desktop - 1" (1440 × 1024): five
 * rounded rectangles with a 30px stroke. Each ring is sampled into points along
 * its perimeter; every frame each point is pushed along its outward normal by
 * simplex noise that travels along the path, which makes the hand-drawn wobble
 * flow around the ring. A slow per-ring "breathing" scale adds the pulse.
 */

export type Ring = { x: number; y: number; w: number; h: number; r: number };

export const DESIGN = { width: 1440, height: 1024, stroke: 30 } as const;

export const RINGS: readonly Ring[] = [
  { x: 0, y: 0, w: 1440, h: 1024, r: 512 },
  { x: 146, y: 103, w: 1146, h: 815, r: 90 },
  { x: 298, y: 212, w: 841, h: 598, r: 89 },
  { x: 460, y: 327, w: 518, h: 368, r: 103 },
  { x: 562, y: 407, w: 313, h: 207, r: 103 },
];

export type RingsOptions = {
  /** Wobble amplitude in design px (scaled with the viewport). */
  amplitude: number;
  /** Wobble wavelength along the path in design px. */
  wavelength: number;
  /** How fast the wobble travels along the ring, in noise units per second. */
  flow: number;
  /** How fast the wobble shape itself changes, in noise units per second. */
  drift: number;
  /** Breathing scale amplitude (0.02 = ±2%). */
  breath: number;
  /** Breathing speed in radians per second. */
  breathSpeed: number;
  /** Distance between sampled points in design px. */
  segment: number;
};

export const DEFAULT_OPTIONS: RingsOptions = {
  amplitude: 9,
  wavelength: 70,
  flow: 0.45,
  drift: 0.12,
  breath: 0.015,
  breathSpeed: 0.7,
  segment: 4,
};

type Point = {
  x: number;
  y: number;
  /** Outward unit normal. */
  nx: number;
  ny: number;
  /** Arc length from the start of the path. */
  s: number;
};

const TAU = Math.PI * 2;

/** Samples the outline of a rounded rectangle, clockwise from the top-left arc end. */
export const roundedRectOutline = (ring: Ring, segment: number): Point[] => {
  const r = Math.max(0, Math.min(ring.r, ring.w / 2, ring.h / 2));
  const { x, y, w, h } = ring;
  const points: Point[] = [];
  let s = 0;

  const line = (
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    nx: number,
    ny: number,
  ) => {
    const len = Math.hypot(x1 - x0, y1 - y0);
    const steps = Math.max(1, Math.round(len / segment));
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      points.push({ x: x0 + (x1 - x0) * t, y: y0 + (y1 - y0) * t, nx, ny, s });
      s += len / steps;
    }
  };

  const arc = (cx: number, cy: number, from: number, to: number) => {
    const len = Math.abs(to - from) * r;
    const steps = Math.max(1, Math.round(len / segment));
    for (let i = 0; i < steps; i++) {
      const a = from + ((to - from) * i) / steps;
      const nx = Math.cos(a);
      const ny = Math.sin(a);
      points.push({ x: cx + nx * r, y: cy + ny * r, nx, ny, s });
      s += len / steps;
    }
  };

  line(x + r, y, x + w - r, y, 0, -1);
  arc(x + w - r, y + r, -TAU / 4, 0);
  line(x + w, y + r, x + w, y + h - r, 1, 0);
  arc(x + w - r, y + h - r, 0, TAU / 4);
  line(x + w - r, y + h, x + r, y + h, 0, 1);
  arc(x + r, y + h - r, TAU / 4, TAU / 2);
  line(x, y + h - r, x, y + r, -1, 0);
  arc(x + r, y + r, TAU / 2, (TAU * 3) / 4);

  return points;
};

export type RingsRenderer = {
  resize: (width: number, height: number, dpr: number) => void;
  draw: (time: number) => void;
};

export const createRingsRenderer = (
  canvas: HTMLCanvasElement,
  options: Partial<RingsOptions> = {},
): RingsRenderer | null => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const opts = { ...DEFAULT_OPTIONS, ...options };
  const noise = createNoise2D();

  let width = 0;
  let height = 0;
  let k = 1;
  let outlines: Point[][] = [];

  const resize = (w: number, h: number, dpr: number) => {
    width = w;
    height = h;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const sx = w / DESIGN.width;
    const sy = h / DESIGN.height;
    k = Math.min(sx, sy);
    outlines = RINGS.map((ring) =>
      roundedRectOutline(
        {
          x: ring.x * sx,
          y: ring.y * sy,
          w: ring.w * sx,
          h: ring.h * sy,
          r: ring.r * k,
        },
        Math.max(2, opts.segment * k),
      ),
    );
  };

  const draw = (time: number) => {
    ctx.clearRect(0, 0, width, height);
    ctx.lineWidth = Math.max(4, DESIGN.stroke * k);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000';

    const cx = width / 2;
    const cy = height / 2;
    const amp = opts.amplitude * k;
    const freq = 1 / (opts.wavelength * k);

    outlines.forEach((points, i) => {
      const breath =
        1 + opts.breath * Math.sin(time * opts.breathSpeed + i * 0.8);
      ctx.beginPath();
      for (let j = 0; j < points.length; j++) {
        const p = points[j];
        // Two octaves: a fine ripple plus a slower, larger swell for a hand-drawn feel.
        const u = p.s * freq - time * opts.flow;
        const v = i * 7.3 + time * opts.drift;
        const d = amp * (0.55 * noise(u, v) + 0.75 * noise(u / 3.1, v + 40));
        const x = cx + (p.x + p.nx * d - cx) * breath;
        const y = cy + (p.y + p.ny * d - cy) * breath;
        if (j === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    });
  };

  return { resize, draw };
};
