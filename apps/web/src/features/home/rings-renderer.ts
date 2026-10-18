import { createNoise2D } from 'simplex-noise';

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
  shirtCalm: 0.4,
  glitch: true,
  glitchEvery: [6, 14],
  glitchDuration: 0.3,
  glitchShift: 6,
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

export type SceneId = 'home' | 'shirt';

type Vertex = { x: number; y: number };
/** A straight segment or a quadratic curve to `to`. */
type Segment = { to: Vertex; c?: Vertex };

/**
 * A plain t-shirt silhouette in the Figma frame, clockwise from the left
 * shoulder (the point that matches the rectangle's top-left corner, so the
 * morph twists as little as possible). The collar is a few points along a
 * curve; every corner is then rounded so the ink band has no sharp joins.
 */
const SHIRT_VERTICES: Vertex[] = [
  { x: 430, y: 195 },
  { x: 610, y: 165 },
  { x: 650, y: 205 },
  { x: 720, y: 222 },
  { x: 790, y: 205 },
  { x: 830, y: 165 },
  { x: 1010, y: 195 },
  { x: 1120, y: 350 },
  { x: 1010, y: 410 },
  { x: 965, y: 395 },
  { x: 945, y: 860 },
  { x: 495, y: 860 },
  { x: 475, y: 395 },
  { x: 430, y: 410 },
  { x: 320, y: 350 },
];
const SHIRT_CORNER = 34;

/**
 * Rounds every corner of a closed polygon: each vertex becomes a quadratic
 * curve between two points `radius` back along its edges (clamped to half an
 * edge), with the vertex as the control point.
 */
export const roundedShape = (
  vertices: Vertex[],
  radius: number,
): { start: Vertex; segments: Segment[] } => {
  const n = vertices.length;
  const cut = vertices.map((v, i) => {
    const p = vertices[(i + n - 1) % n];
    const q = vertices[(i + 1) % n];
    const lp = Math.hypot(p.x - v.x, p.y - v.y);
    const lq = Math.hypot(q.x - v.x, q.y - v.y);
    const d = Math.min(radius, lp / 2, lq / 2);
    return {
      v,
      in: { x: v.x + ((p.x - v.x) / lp) * d, y: v.y + ((p.y - v.y) / lp) * d },
      out: { x: v.x + ((q.x - v.x) / lq) * d, y: v.y + ((q.y - v.y) / lq) * d },
    };
  });
  const segments: Segment[] = [];
  for (let i = 1; i <= n; i++) {
    const k = cut[i % n];
    segments.push({ to: k.in });
    segments.push({ c: k.v, to: k.out });
  }
  return { start: cut[0].out, segments };
};

const SHIRT_SHAPE = roundedShape(SHIRT_VERTICES, SHIRT_CORNER);
export const SHIRT_START: Vertex = SHIRT_SHAPE.start;
export const SHIRT: Segment[] = SHIRT_SHAPE.segments;

/** Samples a closed path of lines and quadratic curves, clockwise. */
export const sampleSegments = (
  start: Vertex,
  segments: Segment[],
  map: (v: Vertex) => Vertex,
  segment: number,
): { points: Point[]; length: number } => {
  const points: Point[] = [];
  let s = 0;
  let from = map(start);
  for (const seg of segments) {
    const to = map(seg.to);
    const ctrl = seg.c ? map(seg.c) : null;
    const at = (t: number): Vertex =>
      ctrl
        ? {
            x: (1 - t) ** 2 * from.x + 2 * (1 - t) * t * ctrl.x + t * t * to.x,
            y: (1 - t) ** 2 * from.y + 2 * (1 - t) * t * ctrl.y + t * t * to.y,
          }
        : { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t };
    const tangent = (t: number): Vertex =>
      ctrl
        ? {
            x: 2 * (1 - t) * (ctrl.x - from.x) + 2 * t * (to.x - ctrl.x),
            y: 2 * (1 - t) * (ctrl.y - from.y) + 2 * t * (to.y - ctrl.y),
          }
        : { x: to.x - from.x, y: to.y - from.y };
    // Approximate length by walking the curve.
    let len = 0;
    let prev = at(0);
    for (let i = 1; i <= 16; i++) {
      const p = at(i / 16);
      len += Math.hypot(p.x - prev.x, p.y - prev.y);
      prev = p;
    }
    const steps = Math.max(1, Math.round(len / segment));
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const p = at(t);
      const d = tangent(t);
      const dl = Math.hypot(d.x, d.y) || 1;
      // Outward normal of a clockwise path in screen space (y down).
      points.push({ x: p.x, y: p.y, nx: d.y / dl, ny: -d.x / dl, s });
      s += len / steps;
    }
    from = to;
  }
  return { points, length: s };
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

const MORPH_SECONDS = 1.1;
const MORPH_POINTS = 720;
const easeInOut = (p: number) =>
  p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2;

export type RingsRenderer = {
  resize: (width: number, height: number, dpr: number) => void;
  draw: (time: number) => void;
  /** Switches the scene; the window edge morphs and the inside fades. */
  setScene: (scene: SceneId) => void;
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
  /** The shirt outline and the two resampled outlines the morph tweens. */
  let shirt: { points: Point[]; length: number } = { points: [], length: 0 };
  let homeR: Point[] = [];
  let shirtR: Point[] = [];
  let scene: SceneId = 'home';
  let pendingScene: SceneId = 'home';
  let morphStart = -1;
  let morphTo: SceneId = 'home';

  const resize = (w: number, h: number, dpr: number) => {
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
    const fitRing =
      RINGS[Math.max(0, Math.min(opts.windowRing, RINGS.length - 1))];
    const sy = portrait
      ? height / (fitRing.h + DESIGN.stroke)
      : height / DESIGN.height;
    const offsetY = portrait ? (height - DESIGN.height * sy) / 2 : 0;
    k = Math.min(sx, sy);
    half = (DESIGN.stroke * k) / 2;
    u = k;

    const scaled = RINGS.map((ring) => ({
      x: ring.x * sx,
      y: ring.y * sy + offsetY,
      w: ring.w * sx,
      h: ring.h * sy,
      r: ring.r * k,
    }));
    outlines = scaled.map((ring) =>
      roundedRectOutline(ring, Math.max(2, opts.segment * u)),
    );
    lengths = scaled.map(perimeter);

    const windowRing = Math.max(0, Math.min(opts.windowRing, RINGS.length - 1));
    shirt = sampleSegments(
      SHIRT_START,
      SHIRT,
      (v) => ({ x: v.x * sx, y: v.y * sy + offsetY }),
      Math.max(2, opts.segment * u),
    );
    homeR = resampleOutline(
      outlines[windowRing],
      lengths[windowRing],
      MORPH_POINTS,
    );
    shirtR = resampleOutline(shirt.points, shirt.length, MORPH_POINTS);
  };

  /** 0 = home rectangle, 1 = shirt, in between while morphing. */
  const shirtness = (time: number): number => {
    const p =
      morphStart < 0 ? 1 : Math.min(1, (time - morphStart) / MORPH_SECONDS);
    const e = easeInOut(p);
    return morphTo === 'shirt' ? e : 1 - e;
  };

  /** The window outline for this frame: home, shirt, or a tween of both. */
  const windowPath = (
    time: number,
    windowRing: number,
  ): { points: Point[]; length: number } => {
    const t = shirtness(time);
    if (t <= 0)
      return { points: outlines[windowRing], length: lengths[windowRing] };
    if (t >= 1) return shirt;
    const length =
      lengths[windowRing] + (shirt.length - lengths[windowRing]) * t;
    const points = homeR.map((a, j) => {
      const b = shirtR[j];
      return {
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t,
        nx: 0,
        ny: 0,
        s: (j / MORPH_POINTS) * length,
      };
    });
    renormalize(points);
    return { points, length };
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
    // The window edge wobbles less the more it is a shirt.
    const windowAmp = amp * (1 - (1 - opts.shirtCalm) * shirtness(time));

    const windowRing = opts.window ? opts.windowRing : -1;
    // Outer and inner edges per ring, kept for the stripe fill below.
    const edges: { outer: number[]; inner: number[] }[] = [];
    // Everything inside the window fades out as the shirt takes over.
    const fade = 1 - shirtness(time);
    const win = windowPath(time, Math.max(0, windowRing));
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
      edges[i] = { outer, inner };
      if (i === windowRing) {
        // This ring becomes the window: ink from the screen edge down to the
        // ring's wobbling inner edge (even-odd fill of edge minus hole).
        target.beginPath();
        target.rect(0, 0, width, height);
        target.moveTo(inner[0], inner[1]);
        for (let j = 2; j < inner.length; j += 2) {
          target.lineTo(inner[j], inner[j + 1]);
        }
        target.closePath();
        target.fill('evenodd');
        return;
      }
      target.beginPath();
      target.moveTo(outer[0], outer[1]);
      for (let j = 2; j < outer.length; j += 2) {
        target.lineTo(outer[j], outer[j + 1]);
      }
      for (let j = inner.length - 2; j >= 0; j -= 2) {
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
      for (let j = 2; j < a.outer.length; j += 2) {
        target.lineTo(a.outer[j], a.outer[j + 1]);
      }
      target.closePath();
      target.moveTo(b.inner[0], b.inner[1]);
      for (let j = 2; j < b.inner.length; j += 2) {
        target.lineTo(b.inner[j], b.inner[j + 1]);
      }
      target.closePath();
      target.fill('evenodd');
      target.globalAlpha = 1;
    }
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

  const draw = (time: number) => {
    if (pendingScene !== scene) {
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

  return { resize, draw, setScene };
};
