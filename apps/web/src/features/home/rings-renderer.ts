import { createNoise2D } from 'simplex-noise';
import {
  SECTION_SHAPES,
  type SceneId,
  type SectionScene,
  sampleSegments,
} from './scenes';

export type { SceneId } from './scenes';

/**
 * Hypnotic concentric rings, drawn on a 2D canvas.
 *
 * Geometry comes from the Figma frame "Desktop - 1" (1440 × 1024): its four
 * rounded rectangles with a 30px stroke (the frame's outer oval is dropped;
 * the first rectangle is the window edge). Each ring is sampled into points along
 * its perimeter; every frame each point is pushed along its outward normal by
 * simplex noise that travels along the path, which makes the hand-drawn wobble
 * flow around the ring. Each ring is filled as a band whose width also varies
 * with travelling noise, so the stroke swells and thins like an ink line. A
 * slow per-ring "breathing" scale adds the pulse.
 */

export type Ring = { x: number; y: number; w: number; h: number; r: number };

export const DESIGN = { width: 1440, height: 1024, stroke: 30 } as const;

export const RINGS: readonly Ring[] = [
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
  /**
   * Fill everything outside one ring with ink, so the rings sit in a window
   * and the corners are black.
   */
  window: boolean;
  /** Index of the ring that becomes the window edge; rings outside it are not drawn. */
  windowRing: number;
  /**
   * Ink the gap between the first and second ring inside the window, so the
   * stripes read black / white / black from the edge inward.
   */
  inkStripe: boolean;
  /** How much of the wobble the shirt keeps (1 = as the rings, 0 = still). */
  shirtCalm: number;
  /** Periodic glitch: colour channels split apart and a few bands tear. */
  glitch: boolean;
  /** Seconds between glitches, picked at random in this range. */
  glitchEvery: [number, number];
  /** Seconds one glitch lasts. */
  glitchDuration: number;
  /** Largest colour-channel offset in CSS px. */
  glitchShift: number;
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
  window: true,
  windowRing: 0,
  inkStripe: true,
  shirtCalm: 0.65,
  glitch: true,
  glitchEvery: [6, 14],
  glitchDuration: 0.3,
  glitchShift: 6,
};

export type Point = {
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

/** Resamples a closed outline to `count` points evenly spaced by arc length. */
export const resampleOutline = (
  points: Point[],
  length: number,
  count: number,
): Point[] => {
  const out: Point[] = [];
  let j = 0;
  for (let i = 0; i < count; i++) {
    const target = (i / count) * length;
    while (j + 1 < points.length && points[j + 1].s <= target) j++;
    const a = points[j];
    const b = points[(j + 1) % points.length];
    const bs = j + 1 < points.length ? b.s : length;
    const t = bs > a.s ? (target - a.s) / (bs - a.s) : 0;
    out.push({
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t,
      nx: 0,
      ny: 0,
      s: target,
    });
  }
  return out;
};

/** Recomputes outward normals of a closed clockwise outline from its neighbours. */
const renormalize = (points: Point[]): void => {
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const p = points[(i + n - 1) % n];
    const q = points[(i + 1) % n];
    const dx = q.x - p.x;
    const dy = q.y - p.y;
    const l = Math.hypot(dx, dy) || 1;
    points[i].nx = dy / l;
    points[i].ny = -dx / l;
  }
};

/**
 * From home into a section the morph overlaps two stages, and every point of
 * the outline starts with its own delay: first the rectangle pours onto the
 * section shape's footprint from left to right, then the shape grows out of
 * that box from the top down, settling with a small overshoot. Any other
 * change (back home, or section to section) is one stage, unwinding from the
 * bottom up and from right to left.
 */
const MORPH_SECONDS = 1.0;
const MORPH_SLIDE = { start: 0, end: 0.55, stagger: 0.35 };
const MORPH_SHAPE = { start: 0.32, end: 1, stagger: 0.45 };
const MORPH_DIRECT_SECONDS = 0.75;
const MORPH_DIRECT = { start: 0, end: 1, stagger: 0.45 };
const MORPH_POINTS = 720;
/** Smootherstep: zero velocity and acceleration at both ends, no kinks. */
const easeInOut = (p: number) => p * p * p * (p * (p * 6 - 15) + 10);
/** Eases out with a gentle overshoot, like something settling into place. */
const easeOutBack = (p: number, c1 = 1.1) => {
  const c3 = c1 + 1;
  return 1 + c3 * (p - 1) ** 3 + c1 * (p - 1) ** 2;
};
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** Axis-aligned bounds of a closed outline. */
const bounds = (points: Point[]) => {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
};

type Outline = { points: Point[]; length: number };
/** Everything precomputed per scene for drawing and morphing. */
type SceneGeometry = {
  outline: Outline;
  /** The outline resampled to MORPH_POINTS. */
  R: Point[];
  /** The window rectangle sized to this shape's footprint, resampled. */
  box: Outline & { R: Point[] };
  /** Per-point start delays (0..1) for the shape stage (top first). */
  growKey: number[];
  /** Per-point start delays for letting go (bottom and right first). */
  releaseKey: number[];
  /** Extra ink inside the window, in logical px. */
  ink: Ring[];
};

export type RingsRenderer = {
  resize: (width: number, height: number, dpr: number) => void;
  draw: (time: number) => void;
  /** Switches the scene; the window edge morphs and the inside fades. */
  setScene: (scene: SceneId) => void;
  /** Updates options in place, keeping the running animation. */
  setOptions: (options: Partial<RingsOptions>) => void;
  /** 0 = full detail, 1 and 2 trade points and pixels for frame rate. */
  setQuality: (level: 0 | 1 | 2) => void;
};

export const createRingsRenderer = (
  canvas: HTMLCanvasElement,
  options: Partial<RingsOptions> = {},
): RingsRenderer | null => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const opts = { ...DEFAULT_OPTIONS, ...options };
  const noise = createNoise2D();

  /** Logical (landscape) size the rings are laid out in. */
  let width = 0;
  let height = 0;
  /** Actual canvas size in CSS px. */
  let viewW = 0;
  let viewH = 0;
  let dprScale = 1;
  let k = 1;
  let portrait = false;
  /** Scale of everything derived from the stroke (wobble, wavelengths). */
  let u = 1;
  let half = DESIGN.stroke / 2;
  let outlines: Point[][] = [];
  let lengths: number[] = [];
  let geometry: Partial<Record<SceneId, SceneGeometry>> = {};
  /** Last known size, so options and quality changes can rebuild geometry. */
  let lastW = 0;
  let lastH = 0;
  let lastDpr = 1;
  /** Adaptive quality: fewer points along the outlines and fewer pixels. */
  let qualitySegment = 1;
  let qualityPixels = 1;
  /** Reused per-ring scratch buffers, so a frame allocates nothing. */
  type RingBuffers = {
    outer: Float64Array;
    inner: Float64Array;
    ds: Float64Array;
    ws: Float64Array;
  };
  const buffers: RingBuffers[] = [];
  const buffersFor = (i: number, n: number): RingBuffers => {
    const have = buffers[i];
    if (have && have.ds.length >= n) return have;
    const made = {
      outer: new Float64Array(2 * n + 2),
      inner: new Float64Array(2 * n + 2),
      ds: new Float64Array(n),
      ws: new Float64Array(n),
    };
    buffers[i] = made;
    return made;
  };
  /** Per-point start delays for the slide stage (left first), on the home outline. */
  let slideKey: number[] = [];
  let scene: SceneId = 'home';
  let pendingScene: SceneId = 'home';
  let morphStart = -1;
  let morphFrom: SceneId = 'home';
  let morphTo: SceneId = 'home';

  const resize = (w: number, h: number, dpr: number) => {
    lastW = w;
    lastH = h;
    lastDpr = dpr;
    layout();
  };

  const layout = () => {
    const w = lastW;
    const h = lastH;
    const dpr = lastDpr * qualityPixels;
    viewW = w;
    viewH = h;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    dprScale = dpr;

    // Portrait turns the whole composition 90°: the frame's long side runs
    // down the phone, so the geometry is laid out in a landscape space of
    // (h × w) and rotated when drawn. Insets stay as in the Figma frame.
    portrait = h > w;
    width = portrait ? h : w;
    height = portrait ? w : h;
    const sx = width / DESIGN.width;
    // Across the phone (the frame's short side) the window ring's outer edge
    // runs along the screen edges instead of keeping the frame's margin, so
    // the side borders stay thin; what lies outside is cut off.
    const windowRing = Math.max(0, Math.min(opts.windowRing, RINGS.length - 1));
    const fitRing = RINGS[windowRing];
    const sy = portrait
      ? height / (fitRing.h + DESIGN.stroke)
      : height / DESIGN.height;
    const offsetY = portrait ? (height - DESIGN.height * sy) / 2 : 0;
    k = Math.min(sx, sy);
    half = (DESIGN.stroke * k) / 2;
    u = k;
    const segment = Math.max(2, opts.segment * u * qualitySegment);

    const scaled = RINGS.map((ring) => ({
      x: ring.x * sx,
      y: ring.y * sy + offsetY,
      w: ring.w * sx,
      h: ring.h * sy,
      r: ring.r * k,
    }));
    outlines = scaled.map((ring) => roundedRectOutline(ring, segment));
    lengths = scaled.map(perimeter);

    const map = (v: { x: number; y: number }) => ({
      x: v.x * sx,
      y: v.y * sy + offsetY,
    });
    const geometryOf = (outline: Outline, ink: Ring[]): SceneGeometry => {
      const R = resampleOutline(outline.points, outline.length, MORPH_POINTS);
      const b = bounds(outline.points);
      const boxRing = { ...b, r: fitRing.r * k };
      const boxOutline = roundedRectOutline(boxRing, segment);
      const boxLength = perimeter(boxRing);
      return {
        outline,
        R,
        box: {
          points: boxOutline,
          length: boxLength,
          R: resampleOutline(boxOutline, boxLength, MORPH_POINTS),
        },
        growKey: R.map((p) => (p.y - b.y) / (b.h || 1)),
        releaseKey: R.map(
          (p) =>
            0.6 * (1 - (p.y - b.y) / (b.h || 1)) +
            0.4 * (1 - (p.x - b.x) / (b.w || 1)),
        ),
        ink,
      };
    };

    geometry = {
      home: geometryOf(
        { points: outlines[windowRing], length: lengths[windowRing] },
        [],
      ),
    };
    for (const id of Object.keys(SECTION_SHAPES) as SectionScene[]) {
      const full = SECTION_SHAPES[id];
      // Shapes that must stay upright carry their own portrait variant.
      const shape = portrait && full.portrait ? full.portrait : full;
      geometry[id] = geometryOf(
        sampleSegments(shape.start, shape.segments, map, segment),
        shape.ink.map((hole) => ({
          x: hole.x * sx,
          y: hole.y * sy + offsetY,
          w: hole.w * sx,
          h: hole.h * sy,
          r: hole.r * k,
        })),
      );
    }
    const home = geometry.home as SceneGeometry;
    const hb = bounds(home.R);
    slideKey = home.R.map((p) => (p.x - hb.x) / (hb.w || 1));
  };

  /** How long the current morph takes: two stages from home, one otherwise. */
  const morphSeconds = () =>
    morphFrom === 'home' && morphTo !== 'home'
      ? MORPH_SECONDS
      : MORPH_DIRECT_SECONDS;

  /** Overall progress of the current morph, eased, 1 when idle. */
  const morphProgress = (time: number) =>
    morphStart < 0
      ? 1
      : easeInOut(clamp01((time - morphStart) / morphSeconds()));

  /** 0 at home, 1 in a section, in between while morphing. */
  const sectionness = (time: number): number => {
    const from = morphFrom === 'home' ? 0 : 1;
    const to = (morphStart < 0 ? scene : morphTo) === 'home' ? 0 : 1;
    return from + (to - from) * morphProgress(time);
  };

  /** Progress of one stage for a point with the given start key. */
  const stageProgress = (
    elapsed: number,
    stage: { start: number; end: number; stagger: number },
    key: number,
    total: number,
  ): number => {
    const duration = (stage.end - stage.start) * total;
    const start = stage.start * total + key * stage.stagger * duration;
    return clamp01((elapsed - start) / ((1 - stage.stagger) * duration));
  };

  /** The window outline for this frame: the scene's shape, or a tween. */
  const windowPath = (time: number): Outline => {
    const current = geometry[scene] as SceneGeometry;
    const elapsed =
      morphStart < 0 ? Number.POSITIVE_INFINITY : time - morphStart;
    if (elapsed >= morphSeconds()) return current.outline;

    const a = geometry[morphFrom] as SceneGeometry;
    const b = geometry[morphTo] as SceneGeometry;
    const overall = morphProgress(time);
    const length =
      a.outline.length + (b.outline.length - a.outline.length) * overall;
    const twoStage = morphFrom === 'home' && morphTo !== 'home';
    const points = a.R.map((p, j) => {
      const q = b.R[j];
      let x: number;
      let y: number;
      if (twoStage) {
        const m = b.box.R[j];
        const e1 = easeInOut(
          stageProgress(elapsed, MORPH_SLIDE, slideKey[j], MORPH_SECONDS),
        );
        const e2 = easeOutBack(
          stageProgress(elapsed, MORPH_SHAPE, b.growKey[j], MORPH_SECONDS),
        );
        x = p.x + (m.x - p.x) * e1 + (q.x - m.x) * e2;
        y = p.y + (m.y - p.y) * e1 + (q.y - m.y) * e2;
      } else {
        const t = easeOutBack(
          stageProgress(
            elapsed,
            MORPH_DIRECT,
            a.releaseKey[j],
            MORPH_DIRECT_SECONDS,
          ),
          0.5,
        );
        x = p.x + (q.x - p.x) * t;
        y = p.y + (q.y - p.y) * t;
      }
      return { x, y, nx: 0, ny: 0, s: (j / MORPH_POINTS) * length };
    });
    renormalize(points);
    return { points, length };
  };

  /** Draws rounded ink rectangles (the film's sprocket holes). */
  const drawInk = (
    target: CanvasRenderingContext2D,
    ink: Ring[],
    alpha: number,
  ) => {
    if (alpha <= 0 || ink.length === 0) return;
    target.globalAlpha = alpha;
    target.beginPath();
    if (typeof target.roundRect === 'function') {
      for (const r of ink) target.roundRect(r.x, r.y, r.w, r.h, r.r);
    } else {
      // Older Safari: trace the rounded rectangle by hand.
      for (const r of ink) {
        const rr = Math.min(r.r, r.w / 2, r.h / 2);
        target.moveTo(r.x + rr, r.y);
        target.arcTo(r.x + r.w, r.y, r.x + r.w, r.y + r.h, rr);
        target.arcTo(r.x + r.w, r.y + r.h, r.x, r.y + r.h, rr);
        target.arcTo(r.x, r.y + r.h, r.x, r.y, rr);
        target.arcTo(r.x, r.y, r.x + r.w, r.y, rr);
        target.closePath();
      }
    }
    target.fill();
    target.globalAlpha = 1;
  };

  /** Draws the ink (rings and window mask) into one context. */
  const drawScene = (target: CanvasRenderingContext2D, time: number) => {
    target.setTransform(dprScale, 0, 0, dprScale, 0, 0);
    target.clearRect(0, 0, viewW, viewH);
    if (portrait) {
      // Logical (x, y) → screen (viewW − y, x): a quarter turn clockwise.
      target.translate(viewW, 0);
      target.rotate(Math.PI / 2);
    }
    target.fillStyle = '#000';

    const cx = width / 2;
    const cy = height / 2;
    const amp = opts.amplitude * u;
    // The window edge wobbles less in a section; while it reshapes the ink
    // gets excited, then calms down.
    const morphing =
      morphStart >= 0 && time - morphStart < morphSeconds()
        ? (time - morphStart) / morphSeconds()
        : 0;
    const section = sectionness(time);
    const windowAmp =
      amp *
      (1 - (1 - opts.shirtCalm) * section) *
      (1 + 0.8 * Math.sin(Math.PI * morphing));

    const windowRing = opts.window ? opts.windowRing : -1;
    // Outer and inner edges per ring, kept for the stripe fill below.
    const edges: { outer: Float64Array; inner: Float64Array; count: number }[] =
      [];
    // Everything inside the window fades out as a section takes over.
    const fade = 1 - section;
    const win = windowPath(time);
    const rings = outlines.map((points, i) =>
      i === windowRing ? win : { points, length: lengths[i] },
    );

    rings.forEach(({ points, length }, i) => {
      // Rings outside the window edge would be ink on ink.
      if (i < windowRing) return;
      if (i > windowRing && fade <= 0) return;
      target.globalAlpha = i === windowRing ? 1 : fade;
      // Neighbouring rings flow in opposite directions: even ones clockwise,
      // odd ones counter-clockwise.
      const direction = i % 2 === 0 ? 1 : -1;
      const breath =
        1 + opts.breath * Math.sin(time * opts.breathSpeed + i * 0.8);
      // The noise is sampled along circles in noise space, so it is periodic in
      // the arc length and the band closes without a seam. Circle radius sets
      // the wavelength; rotating the circle over time makes the wobble travel.
      const r1 = length / (opts.wavelength * u * TAU);
      const r2 = r1 / 3.1;
      const r3 = length / (opts.thicknessWavelength * u * TAU);
      const spin = (direction * time * opts.flow) / r1;
      const ox = i * 7.3 + time * opts.drift;
      const oy = i * 3.7;
      // Outer and inner edges of the band; the band is filled as one polygon
      // (outer edge forward, inner edge backward). Buffers are reused.
      const n = points.length;
      const { outer, inner, ds, ws } = buffersFor(i, n);
      const count = 2 * n + 2;
      // First pass: displacement and band width per point, plus the mean
      // displacement. On short rings the slow octave covers the whole path
      // with nearly one value, which would shove the ring sideways as a
      // whole; subtracting the mean keeps every ring centred on the face.
      let meanX = 0;
      let meanY = 0;
      for (let j = 0; j < n; j++) {
        const p = points[j];
        const theta = (p.s / length) * TAU - spin;
        const cos = Math.cos(theta);
        const sin = Math.sin(theta);
        // Two octaves: a fine ripple plus a slower, larger swell for a hand-drawn feel.
        const d =
          (i === windowRing ? windowAmp : amp) *
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
      meanX /= n;
      meanY /= n;
      for (let j = 0; j < n; j++) {
        const p = points[j];
        const d = ds[j];
        const w = ws[j];
        const px = p.x + p.nx * d - meanX;
        const py = p.y + p.ny * d - meanY;
        outer[2 * j] = cx + (px + p.nx * w - cx) * breath;
        outer[2 * j + 1] = cy + (py + p.ny * w - cy) * breath;
        inner[2 * j] = cx + (px - p.nx * w - cx) * breath;
        inner[2 * j + 1] = cy + (py - p.ny * w - cy) * breath;
      }
      // Repeat the first point so the band also covers the closing segment.
      outer[2 * n] = outer[0];
      outer[2 * n + 1] = outer[1];
      inner[2 * n] = inner[0];
      inner[2 * n + 1] = inner[1];
      edges[i] = { outer, inner, count };
      if (i === windowRing) {
        // This ring becomes the window: ink from the screen edge down to the
        // ring's wobbling inner edge (even-odd fill of edge minus hole).
        target.beginPath();
        target.rect(0, 0, width, height);
        target.moveTo(inner[0], inner[1]);
        for (let j = 2; j < count; j += 2) {
          target.lineTo(inner[j], inner[j + 1]);
        }
        target.closePath();
        target.fill('evenodd');
        return;
      }
      target.beginPath();
      target.moveTo(outer[0], outer[1]);
      for (let j = 2; j < count; j += 2) {
        target.lineTo(outer[j], outer[j + 1]);
      }
      for (let j = count - 2; j >= 0; j -= 2) {
        target.lineTo(inner[j], inner[j + 1]);
      }
      target.closePath();
      target.fill();
    });

    target.globalAlpha = 1;
    // Black stripe: from the outer edge of the first ring inside the window
    // to the inner edge of the next one (even-odd fill of the two outlines).
    const a = edges[windowRing + 1];
    const b = edges[windowRing + 2];
    if (opts.inkStripe && a && b && fade > 0) {
      target.globalAlpha = fade;
      target.beginPath();
      target.moveTo(a.outer[0], a.outer[1]);
      for (let j = 2; j < a.count; j += 2) {
        target.lineTo(a.outer[j], a.outer[j + 1]);
      }
      target.closePath();
      target.moveTo(b.inner[0], b.inner[1]);
      for (let j = 2; j < b.count; j += 2) {
        target.lineTo(b.inner[j], b.inner[j + 1]);
      }
      target.closePath();
      target.fill('evenodd');
      target.globalAlpha = 1;
    }

    // Scene extras (sprocket holes) cross-fade with the morph.
    const progress = morphProgress(time);
    const from = geometry[morphFrom];
    const to = geometry[morphStart < 0 ? scene : morphTo];
    if (progress < 1 && from) drawInk(target, from.ink, 1 - progress);
    if (to) drawInk(target, to.ink, progress);
  };

  // Glitch schedule and scratch canvases (created on first use).
  let glitchAt = 7 + Math.random() * 6;
  let glitchUntil = -1;
  let sceneCanvas: HTMLCanvasElement | null = null;
  let tint: HTMLCanvasElement | null = null;

  const scratch = (): [HTMLCanvasElement, HTMLCanvasElement] => {
    sceneCanvas ??= document.createElement('canvas');
    tint ??= document.createElement('canvas');
    for (const el of [sceneCanvas, tint]) {
      if (el.width !== canvas.width || el.height !== canvas.height) {
        el.width = canvas.width;
        el.height = canvas.height;
      }
    }
    return [sceneCanvas, tint];
  };

  // Deterministic jitter per 50 ms step so a burst flickers instead of smearing.
  const jitter = (step: number, n: number) => {
    const x = Math.sin(step * 127.1 + n * 311.7) * 43758.5453;
    return x - Math.floor(x);
  };

  const setScene = (next: SceneId) => {
    pendingScene = next;
  };

  const setOptions = (next: Partial<RingsOptions>) => {
    Object.assign(opts, next);
    if (lastW > 0 && lastH > 0) layout();
  };

  const QUALITY_SEGMENT = [1, 1.6, 2.4] as const;
  const QUALITY_PIXELS = [1, 0.8, 0.65] as const;
  const setQuality = (level: 0 | 1 | 2) => {
    if (
      qualitySegment === QUALITY_SEGMENT[level] &&
      qualityPixels === QUALITY_PIXELS[level]
    )
      return;
    qualitySegment = QUALITY_SEGMENT[level];
    qualityPixels = QUALITY_PIXELS[level];
    if (lastW > 0 && lastH > 0) layout();
  };

  const draw = (time: number) => {
    if (pendingScene !== scene) {
      morphFrom = scene;
      scene = pendingScene;
      morphTo = scene;
      morphStart = time;
      // A glitch burst hides the seams of the morph.
      if (opts.glitch) {
        glitchUntil = time + opts.glitchDuration;
        glitchAt =
          glitchUntil +
          opts.glitchEvery[0] +
          Math.random() * (opts.glitchEvery[1] - opts.glitchEvery[0]);
      }
    }
    if (opts.glitch && glitchUntil < 0 && time >= glitchAt) {
      glitchUntil = time + opts.glitchDuration;
      const [min, max] = opts.glitchEvery;
      glitchAt = glitchUntil + min + Math.random() * (max - min);
    }
    if (glitchUntil < 0 || time > glitchUntil) {
      glitchUntil = -1;
      drawScene(ctx, time);
      return;
    }

    // Chromatic aberration: the ink is rendered once, then multiplied onto
    // white as cyan, magenta and yellow copies with different offsets. Where
    // all three overlap the ink stays black; the edges fringe with colour.
    const [sceneEl, tintEl] = scratch();
    const sctx = sceneEl.getContext('2d');
    const tctx = tintEl.getContext('2d');
    if (!sctx || !tctx) {
      drawScene(ctx, time);
      return;
    }
    drawScene(sctx, time);

    const W = canvas.width;
    const H = canvas.height;
    const step = Math.floor(
      (time - (glitchUntil - opts.glitchDuration)) / 0.05,
    );
    const shift = opts.glitchShift * dprScale * (0.4 + jitter(step, 1) * 0.6);
    const layers: [string, number][] = [
      ['#00ffff', -shift],
      ['#ff00ff', shift * (jitter(step, 2) - 0.5)],
      ['#ffff00', shift],
    ];

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, W, H);
    for (const [color, dx] of layers) {
      tctx.setTransform(1, 0, 0, 1, 0, 0);
      tctx.globalCompositeOperation = 'source-over';
      tctx.clearRect(0, 0, W, H);
      tctx.drawImage(sceneEl, 0, 0);
      tctx.globalCompositeOperation = 'source-in';
      tctx.fillStyle = color;
      tctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'multiply';
      ctx.drawImage(tintEl, dx, 0);
    }

    // A few horizontal bands tear sideways.
    ctx.globalCompositeOperation = 'source-over';
    const bands = 2 + Math.floor(jitter(step, 3) * 3);
    for (let i = 0; i < bands; i++) {
      const y = Math.floor(jitter(step, 10 + i) * H);
      const h = Math.max(
        2,
        Math.floor((6 + jitter(step, 20 + i) * 40) * dprScale),
      );
      const dx = Math.round((jitter(step, 30 + i) - 0.5) * 40 * dprScale);
      ctx.drawImage(canvas, 0, y, W, h, dx, y, W, h);
    }
    ctx.setTransform(dprScale, 0, 0, dprScale, 0, 0);
  };

  return { resize, draw, setScene, setOptions, setQuality };
};
