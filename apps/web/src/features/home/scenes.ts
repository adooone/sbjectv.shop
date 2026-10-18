import type { Point } from './rings-renderer';

/**
 * The shapes the window takes per section, in the Figma frame's design px
 * (1440 × 1024). Each is a closed polygon with rounded corners; `ink` lists
 * extra black shapes drawn inside the window (the film's sprocket holes).
 */

export type SceneId = 'home' | 'shirt' | 'manifest' | 'film' | 'about';
export type SectionScene = Exclude<SceneId, 'home'>;

export type Vertex = { x: number; y: number };
/** A straight segment or a quadratic curve to `to`. */
export type Segment = { to: Vertex; c?: Vertex };
export type InkRect = { x: number; y: number; w: number; h: number; r: number };
export type Shape = { start: Vertex; segments: Segment[]; ink: InkRect[] };

/**
 * Rounds every corner of a closed polygon: each vertex becomes a quadratic
 * curve between two points `radius` back along its edges (clamped to half an
 * edge), with the vertex as the control point. Concave corners get their own
 * radius so the inner edge of the ink band never folds over itself.
 */
export const roundedShape = (
  vertices: Vertex[],
  radius: number,
  concaveRadius: number = radius,
): { start: Vertex; segments: Segment[] } => {
  const n = vertices.length;
  const cut = vertices.map((v, i) => {
    const p = vertices[(i + n - 1) % n];
    const q = vertices[(i + 1) % n];
    const lp = Math.hypot(p.x - v.x, p.y - v.y);
    const lq = Math.hypot(q.x - v.x, q.y - v.y);
    // Clockwise in screen space: a left turn (negative cross) is concave.
    const cross = (v.x - p.x) * (q.y - v.y) - (v.y - p.y) * (q.x - v.x);
    const r = cross < 0 ? concaveRadius : radius;
    const d = Math.min(r, lp / 2, lq / 2);
    return {
      v,
      in: { x: v.x + ((p.x - v.x) / lp) * d, y: v.y + ((p.y - v.y) / lp) * d },
      out: { x: v.x + ((q.x - v.x) / lq) * d, y: v.y + ((q.y - v.y) / lq) * d },
    };
  });
  const segments: Segment[] = [];
  for (let i = 1; i <= n; i++) {
    const c = cut[i % n];
    segments.push({ to: c.in });
    segments.push({ c: c.v, to: c.out });
  }
  return { start: cut[0].out, segments };
};

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

const shape = (
  vertices: Vertex[],
  radius: number,
  concaveRadius = radius,
  ink: InkRect[] = [],
): Shape => ({ ...roundedShape(vertices, radius, concaveRadius), ink });

/** Shifts a polygon along x. */
const shiftX = (vertices: Vertex[], dx: number) =>
  vertices.map((v) => ({ x: v.x + dx, y: v.y }));

/**
 * ФУТБОЛКИ: a plain t-shirt right of centre (text goes on the left), clockwise
 * from the left shoulder, which matches the rectangle's top-left corner.
 */
const SHIRT = shape(
  shiftX(
    [
      { x: 430, y: 195 },
      { x: 610, y: 165 },
      { x: 720, y: 238 },
      { x: 830, y: 165 },
      { x: 1010, y: 195 },
      { x: 1120, y: 350 },
      { x: 1035, y: 425 },
      { x: 940, y: 400 },
      { x: 945, y: 860 },
      { x: 495, y: 860 },
      { x: 500, y: 400 },
      { x: 405, y: 425 },
      { x: 320, y: 350 },
    ],
    230,
  ),
  34,
  70,
);

/**
 * МАНІФЕСТ: the window covers the left half and runs off three screen edges,
 * so only its right edge shows: a wavy line splitting white from black.
 */
const MANIFEST = shape(
  [
    { x: -300, y: -300 },
    { x: 720, y: -300 },
    { x: 720, y: 1324 },
    { x: -300, y: 1324 },
  ],
  80,
);

/**
 * ФОТО: a strip of film running through the frame, off both sides, with
 * sprocket holes along the top and bottom.
 */
const FILM_HOLES: InkRect[] = [];
for (let x = -40; x < 1560; x += 92) {
  FILM_HOLES.push({ x, y: 184, w: 46, h: 34, r: 7 });
  FILM_HOLES.push({ x, y: 806, w: 46, h: 34, r: 7 });
}
const FILM = shape(
  [
    { x: -160, y: 140 },
    { x: 1600, y: 140 },
    { x: 1600, y: 884 },
    { x: -160, y: 884 },
  ],
  44,
  44,
  FILM_HOLES,
);

/**
 * ЕБАУТ: a speech bubble, its tail pointing down-left toward the title in the
 * bottom-left corner.
 */
const ABOUT = shape(
  [
    { x: 330, y: 230 },
    { x: 1110, y: 230 },
    { x: 1110, y: 760 },
    { x: 600, y: 760 },
    // A blunt tip: two close vertices keep every corner obtuse, so the band
    // never folds over itself.
    { x: 460, y: 904 },
    { x: 420, y: 898 },
    { x: 480, y: 760 },
    { x: 330, y: 760 },
  ],
  110,
  48,
);

export const SECTION_SHAPES: Record<SectionScene, Shape> = {
  shirt: SHIRT,
  manifest: MANIFEST,
  film: FILM,
  about: ABOUT,
};
