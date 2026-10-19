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

export type FacePoint = {
  x: number;
  y: number;
  /** Stroke width at this point; the stroke's own width when omitted. */
  w?: number;
  sharp?: boolean;
};

export type FacePart = 'lid' | 'iris' | 'lash' | 'nose' | 'mouth';

export type FaceStroke = {
  group: FaceGroup;
  /** What the stroke draws, for the gestures. */
  part: FacePart;
  /** Full stroke width in frame units. */
  width: number;
  closed?: boolean;
  points: FacePoint[];
};

const p = (x: number, y: number, w?: number, sharp = false): FacePoint => ({
  x,
  y,
  ...(w === undefined ? {} : { w }),
  ...(sharp ? { sharp } : {}),
});

export const FACE_STROKES: readonly FaceStroke[] = [
  // Left eye: the almond, clockwise from the inner (left) tip.
  {
    group: 'leftEye',
    part: 'lid',
    width: 43,
    closed: true,
    points: [
      p(56, 203, 42, true),
      p(57, 184, 36),
      p(68, 169, 36),
      p(81, 156, 36),
      p(96, 144, 37),
      p(111, 133, 37),
      p(127, 123, 38),
      p(144, 115, 40),
      p(162, 109, 41),
      p(180, 104, 44),
      p(199, 103, 48),
      p(217, 97, 52),
      p(235, 94, 52),
      p(254, 96, 52),
      p(273, 98, 54),
      p(292, 98, 58),
      p(307, 109, 58),
      p(324, 116, 58),
      p(342, 120, 54),
      p(359, 128, 54),
      p(375, 137, 53),
      p(391, 147, 53),
      p(407, 157, 53),
      p(413, 174, 40),
      p(413, 192, 40),
      p(408, 208, 40),
      p(394, 215, 40),
      p(380, 221, 41, true),
      p(363, 228, 42),
      p(345, 234, 43),
      p(327, 239, 43),
      p(308, 240, 47),
      p(292, 249, 47),
      p(275, 255, 47),
      p(256, 255, 47),
      p(238, 257, 50),
      p(220, 260, 51),
      p(202, 260, 52),
      p(184, 253, 52),
      p(166, 256, 52),
      p(147, 253, 52),
      p(129, 250, 52),
      p(112, 245, 52),
      p(95, 238, 53),
      p(79, 230, 53),
      p(66, 223, 53),
      p(59, 213, 46),
    ],
  },
  // Its iris: two arcs making a lens, each trailing a little below the lid.
  {
    group: 'leftEye',
    part: 'iris',
    width: 36,
    points: [
      p(208, 116, 36),
      p(188, 148, 36),
      p(182, 185, 36),
      p(185, 215, 36),
      p(188, 245, 36),
      p(208, 270, 36),
      p(206, 297, 34),
      p(190, 301, 32),
    ],
  },
  {
    group: 'leftEye',
    part: 'iris',
    width: 36,
    points: [
      p(276, 116, 36),
      p(311, 144, 36),
      p(310, 185, 36),
      p(305, 215, 36),
      p(301, 244, 36),
      p(283, 266, 36),
      p(277, 292, 34),
      p(268, 301, 32),
    ],
  },
  // Two lashes over the left eye.
  {
    group: 'leftEye',
    part: 'lash',
    width: 22,
    points: [
      p(228, 98, 22),
      p(240, 72, 22),
      p(252, 60, 22),
      p(262, 68, 22),
      p(266, 84, 22),
    ],
  },
  {
    group: 'leftEye',
    part: 'lash',
    width: 22,
    points: [
      p(280, 96, 22),
      p(288, 70, 22),
      p(296, 60, 22),
      p(306, 70, 22),
      p(310, 88, 22),
    ],
  },
  // Right eye: a flatter almond, clockwise from the inner (left) tip.
  {
    group: 'rightEye',
    part: 'lid',
    width: 48,
    closed: true,
    points: [
      p(554, 217, 38, true),
      p(557, 198, 38),
      p(567, 182, 38),
      p(582, 171, 39),
      p(599, 162, 40),
      p(616, 154, 40),
      p(633, 146, 40),
      p(650, 138, 42),
      p(669, 135, 48),
      p(687, 135, 49),
      p(706, 137, 49),
      p(725, 136, 50),
      p(743, 136, 53),
      p(762, 139, 54),
      p(779, 146, 65),
      p(796, 154, 65),
      p(815, 157, 65),
      p(833, 162, 55),
      p(849, 171, 53),
      p(865, 181, 53),
      p(881, 191, 53),
      p(896, 201, 54),
      p(910, 210, 54),
      p(921, 221, 54),
      p(921, 236, 46, true),
      p(911, 251, 42),
      p(894, 259, 42),
      p(877, 266, 42),
      p(860, 273, 42),
      p(842, 278, 42),
      p(824, 280, 48),
      p(807, 289, 48),
      p(790, 295, 48),
      p(771, 295, 48),
      p(752, 297, 48),
      p(733, 298, 48),
      p(715, 298, 49),
      p(696, 296, 50),
      p(677, 293, 51),
      p(660, 284, 53),
      p(642, 279, 53),
      p(626, 270, 54),
      p(610, 259, 54),
      p(594, 250, 54),
      p(579, 242, 54),
      p(566, 235, 54),
      p(558, 226, 48),
    ],
  },
  // Its iris: a bowl, the right side dripping below the lid.
  {
    group: 'rightEye',
    part: 'iris',
    width: 34,
    points: [
      p(690, 138, 34),
      p(692, 171, 34),
      p(676, 203, 34),
      p(667, 236, 34),
      p(662, 265, 34),
      p(664, 292, 34),
    ],
  },
  {
    group: 'rightEye',
    part: 'iris',
    width: 44,
    points: [
      p(712, 136, 44),
      p(757, 137, 46),
      p(799, 161, 46),
      p(807, 204, 46),
      p(816, 239, 44),
      p(819, 273, 44),
      p(796, 296, 44),
      p(795, 322, 42),
      p(785, 344, 40),
    ],
  },
  // Nose: a tall L with a drip off its foot.
  {
    group: 'nose',
    part: 'nose',
    width: 37,
    points: [
      p(484, 291, 38),
      p(480, 309, 38),
      p(481, 328, 38),
      p(482, 347, 38),
      p(482, 366, 38),
      p(480, 384, 38),
      p(480, 403, 36),
      p(478, 421, 36),
      p(476, 440, 35),
      p(472, 458, 34),
      p(468, 476, 34),
      p(464, 494, 34),
      p(465, 513, 37),
      p(453, 523, 49, true),
      p(469, 518, 49),
      p(489, 519, 49),
      p(508, 519, 49),
      p(526, 519, 49),
      p(544, 519, 49),
      p(560, 521, 49),
      p(573, 521, 50),
      p(584, 522, 50, true),
      p(568, 523, 40),
      p(563, 538, 40),
      p(560, 551, 34),
      p(555, 563, 34),
    ],
  },
  // Mouth: three waves, a drop, then a zigzag up to the right.
  {
    group: 'mouth',
    part: 'mouth',
    width: 37,
    points: [
      p(191, 795, 32),
      p(200, 778, 32),
      p(210, 763, 32),
      p(223, 750, 36),
      p(239, 741, 41),
      p(258, 737, 48),
      p(276, 738, 50),
      p(294, 744, 50),
      p(310, 753, 50),
      p(324, 763, 50),
      p(337, 774, 50),
      p(348, 785, 50),
      p(349, 798, 42, true),
      p(359, 782, 37),
      p(375, 772, 35),
      p(387, 758, 35),
      p(400, 745, 35),
      p(415, 734, 38),
      p(432, 725, 41),
      p(450, 720, 47),
      p(468, 720, 50),
      p(485, 727, 50),
      p(499, 739, 50),
      p(511, 753, 50),
      p(520, 768, 50),
      p(529, 781, 48),
      p(526, 795, 44, true),
      p(538, 781, 38),
      p(555, 773, 38),
      p(570, 763, 39),
      p(586, 753, 39),
      p(603, 745, 41),
      p(620, 739, 44),
      p(639, 736, 49),
      p(656, 741, 49),
      p(669, 753, 49),
      p(676, 770, 44),
      p(680, 788, 44),
      p(682, 806, 42),
      p(685, 822, 42),
      p(674, 835, 42, true),
      p(687, 819, 38),
      p(705, 814, 36),
      p(721, 803, 36),
      p(736, 792, 36),
      p(751, 781, 36),
      p(766, 770, 37),
      p(783, 763, 46),
      p(801, 766, 50),
      p(815, 778, 50),
      p(829, 790, 50),
      p(842, 801, 50),
      p(852, 815, 38, true),
      p(862, 800, 34),
      p(876, 788, 34),
      p(889, 775, 34),
      p(902, 762, 34),
      p(915, 749, 34),
      p(928, 736, 34),
      p(940, 724, 34),
      p(951, 711, 34),
    ],
  },
];

/** Centre of each eye (frame units): blinks close toward its y, gestures spin about it. */
export const EYE_CENTRES: Record<
  'leftEye' | 'rightEye',
  { x: number; y: number }
> = {
  leftEye: { x: 243, y: 195 },
  rightEye: { x: 743, y: 222 },
};
const MOUTH_CENTRE = { x: 568, y: 778 };
const NOSE_TOP = { x: 470, y: 292 };

/**
 * Gestures the face pulls while the rings collapse on the way to a section.
 * pucker: the mouth draws into a little "o". buzz: a wave runs through the
 * mouth. sniff: the nose sways and stretches. trip: the irises spin, the
 * eyes swell in turn and the lashes flap.
 */
export type Gesture = 'pucker' | 'buzz' | 'sniff' | 'trip';
export const GESTURES: readonly Gesture[] = ['pucker', 'buzz', 'sniff', 'trip'];

export type FacePose = {
  /** 0 = eyes open, 1 = shut. */
  blink: number;
  /** The gesture under way and its progress, 0 → 1. */
  gesture?: { kind: Gesture; t: number };
};

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const rotateAbout = (
  q: FacePoint,
  c: { x: number; y: number },
  angle: number,
  scale = 1,
): FacePoint => {
  const cos = Math.cos(angle) * scale;
  const sin = Math.sin(angle) * scale;
  const dx = q.x - c.x;
  const dy = q.y - c.y;
  return { ...q, x: c.x + dx * cos - dy * sin, y: c.y + dx * sin + dy * cos };
};
const easeOutBack = (x: number, c1 = 1.4) => {
  const u = x - 1;
  return 1 + (c1 + 1) * u * u * u + c1 * u * u;
};

/** The stroke's points under the pose's gesture (blink is applied after). */
const gesturePoints = (stroke: FaceStroke, pose: FacePose): FacePoint[] => {
  const g = pose.gesture;
  if (!g || g.t <= 0) return stroke.points;
  const t = Math.min(1, g.t);
  const pts = stroke.points;
  const n = pts.length;
  // Everything settles in quickly, so it reads before the face flies off.
  const rise = smoothstep(Math.min(1, t / 0.18));
  switch (g.kind) {
    case 'pucker': {
      if (stroke.part !== 'mouth') return pts;
      const k = easeOutBack(Math.min(1, t / 0.5));
      return pts.map((q, i) => {
        // Points wind onto a small loop, nearly closed, starting at the top.
        const a = -Math.PI / 2 + (i / (n - 1)) * Math.PI * 2 * 0.94;
        const tx = MOUTH_CENTRE.x + Math.cos(a) * 92;
        const ty = MOUTH_CENTRE.y - 12 + Math.sin(a) * 78;
        return { ...q, x: lerp(q.x, tx, k), y: lerp(q.y, ty, k) };
      });
    }
    case 'buzz': {
      if (stroke.part !== 'mouth') return pts;
      return pts.map((q, i) => {
        const u = i / (n - 1);
        const wave = Math.sin(Math.PI * 2 * (u * 2.5 - t * 4));
        return {
          ...q,
          x: q.x + 10 * rise * Math.sin(Math.PI * 2 * (u * 2.5 - t * 4) + 1.2),
          y: q.y + 38 * rise * wave,
        };
      });
    }
    case 'sniff': {
      if (stroke.part !== 'nose') return pts;
      const sway = Math.sin(Math.PI * 2 * t * 2.5) * rise;
      const stretch = 1 + 0.3 * Math.sin(Math.PI * Math.min(1, t));
      return pts.map((q) => {
        const d = Math.max(0, (q.y - NOSE_TOP.y) / 300);
        return {
          ...q,
          x: q.x + 80 * d * sway,
          y: NOSE_TOP.y + (q.y - NOSE_TOP.y) * stretch,
        };
      });
    }
    case 'trip': {
      if (stroke.group !== 'leftEye' && stroke.group !== 'rightEye') return pts;
      const c = EYE_CENTRES[stroke.group];
      const side = stroke.group === 'leftEye' ? 1 : -1;
      if (stroke.part === 'iris') {
        // One full spin, with a swell on the way.
        const spin = Math.PI * 2 * smoothstep(t) * side;
        const swell = 1 + 0.12 * Math.sin(Math.PI * t);
        return pts.map((q) => rotateAbout(q, c, spin, swell));
      }
      if (stroke.part === 'lid') {
        // The eyes swell in turn and tilt a little against each other.
        const swell = 1 + 0.16 * Math.sin(Math.PI * 2 * t * 1.5) * side * rise;
        const tilt = 0.08 * Math.sin(Math.PI * 2 * t * 1.5) * side * rise;
        return pts.map((q) => rotateAbout(q, c, tilt, swell));
      }
      // Lashes flap about their root.
      const root = pts[0];
      const flap = 0.7 * Math.sin(Math.PI * 2 * t * 6) * rise;
      return pts.map((q) => rotateAbout(q, root, flap));
    }
    default:
      return pts;
  }
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
export const smooth = (points: FacePoint[], closed: boolean, steps: number) => {
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
      const wa = a.w;
      const wb = b.w;
      out.push({
        x: h00 * a.x + h10 * ma.x + h01 * b.x + h11 * mb.x,
        y: h00 * a.y + h10 * ma.y + h01 * b.y + h11 * mb.y,
        ...(wa !== undefined && wb !== undefined
          ? { w: wa + (wb - wa) * t }
          : {}),
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

type Sample = {
  x: number;
  y: number;
  nx: number;
  ny: number;
  s: number;
  w?: number;
};

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
      const wa = a.w;
      const wb = b.w;
      samples.push({
        x: a.x + (dx * t) / len,
        y: a.y + (dy * t) / len,
        nx,
        ny,
        s: s + t,
        ...(wa !== undefined && wb !== undefined
          ? { w: wa + ((wb - wa) * t) / len }
          : {}),
      });
      t += step;
    }
    carried = t - len;
    s += len;
  }
  if (!closed) {
    const end = points[n - 1];
    const prev = samples[samples.length - 1];
    samples.push({ x: end.x, y: end.y, nx: prev.nx, ny: prev.ny, s, w: end.w });
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
    // The gesture first, then a blink squashes the eye toward its centre line.
    const gestured = gesturePoints(stroke, pose);
    const squash =
      stroke.group === 'leftEye' || stroke.group === 'rightEye'
        ? { cy: EYE_CENTRES[stroke.group].y, k: 1 - 0.92 * pose.blink }
        : null;
    const posed = squash
      ? gestured.map((q) => ({
          ...q,
          y: squash.cy + (q.y - squash.cy) * squash.k,
        }))
      : gestured;
    const { samples, length } = sample(smooth(posed, closed, 12), closed, step);
    const n = samples.length;
    const base = stroke.width / 2;
    const r1 = length / (WOBBLE_WAVELENGTH * TAU);
    const r3 = length / (THICKNESS_WAVELENGTH * TAU);
    const direction = index % 2 === 0 ? 1 : -1;
    const spin = (direction * time * FLOW) / r1;
    const ox = index * 11.3;
    const oy = index * 5.1;
    const polygon = new Float64Array(n * 4);
    let first = { x: 0, y: 0, r: base };
    let last = { x: 0, y: 0, r: base };
    for (let j = 0; j < n; j++) {
      const q = samples[j];
      const half = q.w === undefined ? base : q.w / 2;
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
    for (const q of posed)
      if (q.sharp) caps.push({ x: q.x, y: q.y, r: (q.w ?? stroke.width) / 2 });
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
