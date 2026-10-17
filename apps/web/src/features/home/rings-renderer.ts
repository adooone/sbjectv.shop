import { createNoise2D } from 'simplex-noise';

/**
 * Hypnotic concentric rings, drawn on a 2D canvas.
 *
 * Geometry comes from the Figma frame "Desktop - 1" (1440 × 1024): five
 * rounded rectangles with a 30px stroke. Each ring is sampled into points along
 * its perimeter; every frame each point is pushed along its outward normal by
 * simplex noise that travels along the path, which makes the hand-drawn wobble
 * flow around the ring. Each ring is filled as a band whose width also varies
 * with travelling noise, so the stroke swells and thins like an ink line. A
 * slow per-ring "breathing" scale adds the pulse.
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
  /** Stroke thickness variation (0.35 = ±35% around the design stroke). */
  thickness: number;
  /** Wavelength of the thickness variation along the path in design px. */
  thicknessWavelength: number;
  /** Portrait: stroke never gets thinner than this fraction of the viewport width. */
  minStrokeFraction: number;
  /** Portrait: innermost ring as a fraction of the viewport width / height. */
  portraitInner: { x: number; y: number };
  /**
   * Landscape: fill everything outside one ring with ink, so the rings sit in
   * a window and the corners become black.
   */
  window: boolean;
  /** Index of the ring that becomes the window edge; rings outside it are not drawn. */
  windowRing: number;
};

export const DEFAULT_OPTIONS: RingsOptions = {
  amplitude: 9,
  wavelength: 70,
  flow: 0.45,
  drift: 0.12,
  breath: 0.015,
  breathSpeed: 0.7,
  segment: 4,
  thickness: 0.35,
  thicknessWavelength: 260,
  minStrokeFraction: 0.032,
  portraitInner: { x: 0.4, y: 0.2 },
  window: true,
  windowRing: 1,
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

/** Perimeter of a rounded rectangle. */
export const perimeter = (ring: Ring): number => {
  const r = Math.max(0, Math.min(ring.r, ring.w / 2, ring.h / 2));
  return 2 * (ring.w - 2 * r) + 2 * (ring.h - 2 * r) + TAU * r;
};

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
  let portrait = false;
  /** Scale of everything derived from the stroke (wobble, wavelengths). */
  let u = 1;
  let half = DESIGN.stroke / 2;
  let outlines: Point[][] = [];
  let lengths: number[] = [];

  const resize = (w: number, h: number, dpr: number) => {
    width = w;
    height = h;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const sx = w / DESIGN.width;
    const sy = h / DESIGN.height;
    k = Math.min(sx, sy);
    portrait = h > w;
    // On phones the design scale makes the stroke hair-thin, so in portrait
    // the stroke has a floor relative to the width; the wobble follows the stroke.
    const stroke = portrait
      ? Math.max(DESIGN.stroke * k, opts.minStrokeFraction * w)
      : DESIGN.stroke * k;
    half = stroke / 2;
    u = stroke / DESIGN.stroke;

    const scaled = RINGS.map((ring, i) => {
      if (!portrait) {
        return {
          x: ring.x * sx,
          y: ring.y * sy,
          w: ring.w * sx,
          h: ring.h * sy,
          r: ring.r * k,
        };
      }
      // Portrait: the Figma insets would squeeze the inner rings to a sliver,
      // so rings are spaced evenly from the edge down to a roomy inner ring.
      const t = i / (RINGS.length - 1);
      const insetX = (t * (1 - opts.portraitInner.x) * w) / 2;
      const insetY = (t * (1 - opts.portraitInner.y) * h) / 2;
      return {
        x: insetX,
        y: insetY,
        w: w - 2 * insetX,
        h: h - 2 * insetY,
        r: ring.r * k,
      };
    });
    outlines = scaled.map((ring) =>
      roundedRectOutline(ring, Math.max(2, opts.segment * u)),
    );
    lengths = scaled.map(perimeter);
  };

  const draw = (time: number) => {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#000';

    const cx = width / 2;
    const cy = height / 2;
    const amp = opts.amplitude * u;

    const windowRing = opts.window && !portrait ? opts.windowRing : -1;

    outlines.forEach((points, i) => {
      // Rings outside the window edge would be ink on ink.
      if (i < windowRing) return;
      // Neighbouring rings flow in opposite directions: even ones clockwise,
      // odd ones counter-clockwise.
      const direction = i % 2 === 0 ? 1 : -1;
      const breath =
        1 + opts.breath * Math.sin(time * opts.breathSpeed + i * 0.8);
      // The noise is sampled along circles in noise space, so it is periodic in
      // the arc length and the band closes without a seam. Circle radius sets
      // the wavelength; rotating the circle over time makes the wobble travel.
      const length = lengths[i];
      const r1 = length / (opts.wavelength * u * TAU);
      const r2 = r1 / 3.1;
      const r3 = length / (opts.thicknessWavelength * u * TAU);
      const spin = (direction * time * opts.flow) / r1;
      const ox = i * 7.3 + time * opts.drift;
      const oy = i * 3.7;
      // Outer and inner edges of the band; the band is filled as one polygon
      // (outer edge forward, inner edge backward).
      const outer: number[] = [];
      const inner: number[] = [];
      // First pass: displacement and band width per point, plus the mean
      // displacement. On short rings the slow octave covers the whole path
      // with nearly one value, which would shove the ring sideways as a
      // whole; subtracting the mean keeps every ring centred on the face.
      const ds = new Float64Array(points.length);
      const ws = new Float64Array(points.length);
      let meanX = 0;
      let meanY = 0;
      for (let j = 0; j < points.length; j++) {
        const p = points[j];
        const theta = (p.s / length) * TAU - spin;
        const cos = Math.cos(theta);
        const sin = Math.sin(theta);
        // Two octaves: a fine ripple plus a slower, larger swell for a hand-drawn feel.
        const d =
          amp *
          (0.55 * noise(r1 * cos + ox, r1 * sin + oy) +
            0.75 * noise(r2 * cos + ox + 40, r2 * sin + oy + 40));
        // Thickness swells slowly along the path and travels with the flow.
        const theta3 = (p.s / length) * TAU - spin * 0.3;
        ws[j] =
          half *
          (1 +
            opts.thickness *
              noise(
                r3 * Math.cos(theta3) + ox + 90,
                r3 * Math.sin(theta3) + 90,
              ));
        ds[j] = d;
        meanX += p.nx * d;
        meanY += p.ny * d;
      }
      meanX /= points.length;
      meanY /= points.length;
      for (let j = 0; j < points.length; j++) {
        const p = points[j];
        const d = ds[j];
        const w = ws[j];
        const px = p.x + p.nx * d - meanX;
        const py = p.y + p.ny * d - meanY;
        outer.push(
          cx + (px + p.nx * w - cx) * breath,
          cy + (py + p.ny * w - cy) * breath,
        );
        inner.push(
          cx + (px - p.nx * w - cx) * breath,
          cy + (py - p.ny * w - cy) * breath,
        );
      }
      // Repeat the first point so the band also covers the closing segment.
      outer.push(outer[0], outer[1]);
      inner.push(inner[0], inner[1]);
      if (i === windowRing) {
        // This ring becomes the window: ink from the screen edge down to the
        // ring's wobbling inner edge (even-odd fill of edge minus hole).
        ctx.beginPath();
        ctx.rect(0, 0, width, height);
        ctx.moveTo(inner[0], inner[1]);
        for (let j = 2; j < inner.length; j += 2) {
          ctx.lineTo(inner[j], inner[j + 1]);
        }
        ctx.closePath();
        ctx.fill('evenodd');
        return;
      }
      ctx.beginPath();
      ctx.moveTo(outer[0], outer[1]);
      for (let j = 2; j < outer.length; j += 2) {
        ctx.lineTo(outer[j], outer[j + 1]);
      }
      for (let j = inner.length - 2; j >= 0; j -= 2) {
        ctx.lineTo(inner[j], inner[j + 1]);
      }
      ctx.closePath();
      ctx.fill();
    });
  };

  return { resize, draw };
};
