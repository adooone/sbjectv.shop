/**
 * Жека, the face in the middle of the rings, as ink strokes instead of a
 * bitmap: each feature is a centreline with a width, drawn as a wobbling
 * band like the rings and the triangles, so the face can breathe, blink and
 * be pulled about by the same animation loop.
 *
 * Strokes are authored in a 1000 × 909 frame (the bitmap's proportions),
 * traced from the drawing's centrelines; `sharp` points keep their corner.
 */

export const FACE_FRAME = { width: 1000, height: 909 } as const;

export type FaceGroup = 'leftEye' | 'rightEye' | 'nose' | 'mouth';

export type FacePoint = { x: number; y: number; sharp?: boolean };

export type FaceStroke = {
  group: FaceGroup;
  /** Full stroke width in frame units. */
  width: number;
  closed?: boolean;
  points: FacePoint[];
};

const p = (x: number, y: number, sharp = false): FacePoint =>
  sharp ? { x, y, sharp } : { x, y };

export const FACE_STROKES: readonly FaceStroke[] = [
  // Left eye: the almond, clockwise from the inner (left) tip.
  {
    group: 'leftEye',
    width: 36,
    closed: true,
    points: [
      p(50, 205, true),
      p(70, 170),
      p(105, 140),
      p(150, 118),
      p(200, 105),
      p(250, 100),
      p(300, 104),
      p(350, 118),
      p(395, 140),
      p(425, 168),
      p(437, 200, true),
      p(428, 225),
      p(400, 240),
      p(350, 262),
      p(300, 275),
      p(250, 282),
      p(200, 280),
      p(150, 272),
      p(105, 255),
      p(70, 235),
    ],
  },
  // Its iris: two arcs making a lens, each trailing a little below the lid.
  {
    group: 'leftEye',
    width: 30,
    points: [
      p(205, 118),
      p(182, 160),
      p(172, 205),
      p(178, 250),
      p(190, 282),
      p(195, 315),
    ],
  },
  {
    group: 'leftEye',
    width: 30,
    points: [
      p(275, 118),
      p(300, 160),
      p(310, 205),
      p(303, 250),
      p(288, 282),
      p(270, 318),
    ],
  },
  // Two lashes over the left eye.
  {
    group: 'leftEye',
    width: 22,
    points: [p(226, 100), p(238, 72), p(254, 54), p(266, 66), p(268, 86)],
  },
  {
    group: 'leftEye',
    width: 22,
    points: [p(278, 96), p(284, 70), p(296, 54), p(308, 68), p(310, 88)],
  },

  // Right eye: a flatter almond, clockwise from the inner (left) tip.
  {
    group: 'rightEye',
    width: 36,
    closed: true,
    points: [
      p(542, 228, true),
      p(565, 198),
      p(605, 165),
      p(652, 132, true),
      p(700, 122),
      p(750, 119),
      p(802, 124, true),
      p(852, 158),
      p(902, 205),
      p(945, 245, true),
      p(925, 275),
      p(880, 300),
      p(820, 318),
      p(760, 322),
      p(700, 317),
      p(650, 300),
      p(600, 272),
      p(565, 248),
    ],
  },
  // Its iris: a bowl, the right side dripping below the lid.
  {
    group: 'rightEye',
    width: 30,
    points: [p(668, 140), p(655, 185), p(650, 230), p(655, 275), p(665, 305)],
  },
  {
    group: 'rightEye',
    width: 30,
    points: [
      p(712, 140),
      p(752, 160),
      p(782, 195),
      p(797, 235),
      p(800, 275),
      p(795, 310),
      p(778, 345),
      p(765, 358),
    ],
  },

  // Nose: a tall L with a drip off its foot.
  {
    group: 'nose',
    width: 44,
    points: [
      p(470, 292),
      p(466, 340),
      p(461, 400),
      p(455, 455),
      p(446, 500),
      p(440, 523, true),
      p(480, 523),
      p(540, 523),
      p(598, 523, true),
      p(592, 540),
      p(572, 565),
      p(552, 588),
    ],
  },

  // Mouth: three waves, a drop, then a zigzag up to the right.
  {
    group: 'mouth',
    width: 46,
    points: [
      p(185, 800),
      p(198, 768),
      p(225, 742),
      p(258, 735),
      p(292, 752),
      p(322, 785),
      p(350, 808, true),
      p(378, 790),
      p(410, 752),
      p(448, 727),
      p(482, 738),
      p(505, 790),
      p(518, 810, true),
      p(548, 790),
      p(585, 752),
      p(628, 730),
      p(658, 745),
      p(668, 800),
      p(670, 840, true),
      p(700, 822),
      p(745, 788),
      p(798, 756),
      p(825, 790),
      p(852, 815, true),
      p(885, 790),
      p(918, 752),
      p(950, 720),
    ],
  },
];

/** Where each eye closes to when it blinks (frame units). */
export const EYE_CENTRES: Record<'leftEye' | 'rightEye', { y: number }> = {
  leftEye: { y: 195 },
  rightEye: { y: 222 },
};

export type FacePose = {
  /** 0 = eyes open, 1 = shut. */
  blink: number;
};

type Noise2D = (x: number, y: number) => number;

/** A filled band around one stroke, plus round caps for open strokes. */
export type FaceBand = {
  /** Outer edge forward then inner edge backward, as x,y pairs. */
  polygon: Float64Array;
  caps: { x: number; y: number; r: number }[];
};

const TAU = Math.PI * 2;
const WOBBLE = 6;
const WOBBLE_WAVELENGTH = 170;
const THICKNESS = 0.22;
const THICKNESS_WAVELENGTH = 420;
const FLOW = 0.35;

/**
 * A cardinal (Catmull-Rom) spline through the points, `steps` pieces per
 * span. A sharp point gets a zero tangent, so the curve passes through it
 * with a corner instead of rounding it off.
 */
const smooth = (points: FacePoint[], closed: boolean, steps: number) => {
  const n = points.length;
  const spans = closed ? n : n - 1;
  const tangent = (i: number) => {
    const q = points[i];
    if (q.sharp) return { x: 0, y: 0 };
    const before = points[closed ? (i - 1 + n) % n : Math.max(0, i - 1)];
    const after = points[closed ? (i + 1) % n : Math.min(n - 1, i + 1)];
    const scale = closed || (i > 0 && i < n - 1) ? 0.5 : 1;
    return { x: (after.x - before.x) * scale, y: (after.y - before.y) * scale };
  };
  const out: FacePoint[] = [];
  for (let i = 0; i < spans; i++) {
    const a = points[i];
    const b = points[(i + 1) % n];
    const ma = tangent(i);
    const mb = tangent((i + 1) % n);
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      const t2 = t * t;
      const t3 = t2 * t;
      const h00 = 2 * t3 - 3 * t2 + 1;
      const h10 = t3 - 2 * t2 + t;
      const h01 = -2 * t3 + 3 * t2;
      const h11 = t3 - t2;
      out.push({
        x: h00 * a.x + h10 * ma.x + h01 * b.x + h11 * mb.x,
        y: h00 * a.y + h10 * ma.y + h01 * b.y + h11 * mb.y,
      });
    }
  }
  if (!closed) out.push(points[n - 1]);
  return dedupe(out);
};

const dedupe = (points: FacePoint[]) =>
  points.filter(
    (q, i) =>
      i === 0 ||
      Math.abs(q.x - points[i - 1].x) > 1e-6 ||
      Math.abs(q.y - points[i - 1].y) > 1e-6,
  );

type Sample = { x: number; y: number; nx: number; ny: number; s: number };

/** Walks the smoothed polyline at a fixed step, with unit normals. */
const sample = (
  points: FacePoint[],
  closed: boolean,
  step: number,
): { samples: Sample[]; length: number } => {
  const n = points.length;
  const segs = closed ? n : n - 1;
  const samples: Sample[] = [];
  let carried = 0;
  let s = 0;
  for (let i = 0; i < segs; i++) {
    const a = points[i];
    const b = points[(i + 1) % n];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy);
    if (len < 1e-6) continue;
    const nx = dy / len;
    const ny = -dx / len;
    let t = carried;
    while (t < len) {
      samples.push({
        x: a.x + (dx * t) / len,
        y: a.y + (dy * t) / len,
        nx,
        ny,
        s: s + t,
      });
      t += step;
    }
    carried = t - len;
    s += len;
  }
  if (!closed) {
    const end = points[n - 1];
    const prev = samples[samples.length - 1];
    samples.push({ x: end.x, y: end.y, nx: prev.nx, ny: prev.ny, s });
  }
  // Average neighbouring normals so the band bends smoothly at corners.
  const m = samples.length;
  const out = samples.map((q, i) => {
    const before = samples[closed ? (i - 1 + m) % m : Math.max(0, i - 1)];
    const after = samples[closed ? (i + 1) % m : Math.min(m - 1, i + 1)];
    let nx = before.nx + q.nx + after.nx;
    let ny = before.ny + q.ny + after.ny;
    const l = Math.hypot(nx, ny) || 1;
    nx /= l;
    ny /= l;
    return { ...q, nx, ny };
  });
  return { samples: out, length: s };
};

/**
 * Builds the bands for every stroke at the given time, in frame units.
 * `step` is the sampling distance in frame units; a few units is plenty.
 */
export const faceBands = (
  time: number,
  noise: Noise2D,
  pose: FacePose,
  step: number,
): FaceBand[] =>
  FACE_STROKES.map((stroke, index) => {
    const closed = stroke.closed === true;
    // A blink squashes the eye toward its centre line.
    const squash =
      stroke.group === 'leftEye' || stroke.group === 'rightEye'
        ? { cy: EYE_CENTRES[stroke.group].y, k: 1 - 0.92 * pose.blink }
        : null;
    const posed = squash
      ? stroke.points.map((q) => ({
          ...q,
          y: squash.cy + (q.y - squash.cy) * squash.k,
        }))
      : stroke.points;
    const { samples, length } = sample(smooth(posed, closed, 12), closed, step);
    const n = samples.length;
    const half = stroke.width / 2;
    const r1 = length / (WOBBLE_WAVELENGTH * TAU);
    const r3 = length / (THICKNESS_WAVELENGTH * TAU);
    const direction = index % 2 === 0 ? 1 : -1;
    const spin = (direction * time * FLOW) / r1;
    const ox = index * 11.3;
    const oy = index * 5.1;
    const polygon = new Float64Array(n * 4);
    let first = { x: 0, y: 0, r: half };
    let last = { x: 0, y: 0, r: half };
    for (let j = 0; j < n; j++) {
      const q = samples[j];
      const theta = (q.s / length) * TAU - spin;
      const cos = Math.cos(theta);
      const sin = Math.sin(theta);
      // Open strokes fade the wobble out at their ends so the caps sit true.
      const edge = closed
        ? 1
        : Math.min(1, Math.min(q.s, length - q.s) / (half * 1.5));
      const d = WOBBLE * edge * noise(r1 * cos + ox, r1 * sin + oy);
      const w =
        half * (1 + THICKNESS * noise(r3 * cos + ox + 70, r3 * sin + oy + 70));
      const x = q.x + q.nx * d;
      const y = q.y + q.ny * d;
      polygon[2 * j] = x + q.nx * w;
      polygon[2 * j + 1] = y + q.ny * w;
      const k = 4 * n - 2 - 2 * j;
      polygon[k] = x - q.nx * w;
      polygon[k + 1] = y - q.ny * w;
      if (j === 0) first = { x, y, r: w };
      if (j === n - 1) last = { x, y, r: w };
    }
    // Round caps close the ends and fill the nick a sharp corner leaves.
    const caps = closed ? [] : [first, last];
    for (const q of posed) if (q.sharp) caps.push({ x: q.x, y: q.y, r: half });
    return { polygon, caps };
  });

/** Blink timing: a quick shut and a slower open, every few seconds. */
const BLINK_SHUT = 0.09;
const BLINK_OPEN = 0.16;

/**
 * Eyes-shut amount at `time`, given blink moments spaced by a pseudo-random
 * gap, so it needs no state and survives the clock being paused.
 */
export const blinkAt = (time: number): number => {
  // Deterministic schedule: blink k happens at T(k) = sum of gaps.
  let t = 2.5;
  let k = 0;
  while (t + BLINK_SHUT + BLINK_OPEN < time) {
    k++;
    t += 3.5 + 4 * fract(Math.sin(k * 12.9898) * 43758.5453);
  }
  const dt = time - t;
  if (dt < 0) return 0;
  if (dt < BLINK_SHUT) return smoothstep(dt / BLINK_SHUT);
  if (dt < BLINK_SHUT + BLINK_OPEN)
    return 1 - smoothstep((dt - BLINK_SHUT) / BLINK_OPEN);
  return 0;
};

const smoothstep = (x: number) => x * x * (3 - 2 * x);
const fract = (x: number) => x - Math.floor(x);
