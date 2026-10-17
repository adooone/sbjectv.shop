/**
 * Geometry for the hand-drawn triangle: a rounded polygon sampled into points
 * with outward normals and arc length, the same shape of data the rings use.
 */

export type Vertex = { x: number; y: number };

export type OutlinePoint = {
  x: number;
  y: number;
  nx: number;
  ny: number;
  s: number;
};

const TAU = Math.PI * 2;

/** Samples a convex polygon with rounded corners, clockwise in screen space. */
export const roundedPolygonOutline = (
  vertices: Vertex[],
  radius: number,
  segment: number,
): { points: OutlinePoint[]; length: number } => {
  const n = vertices.length;
  const points: OutlinePoint[] = [];
  let s = 0;

  // For each vertex: the tangent points where the arc meets the two edges,
  // and the arc centre on the angle bisector.
  const corners = vertices.map((v, i) => {
    const prev = vertices[(i + n - 1) % n];
    const next = vertices[(i + 1) % n];
    const ax = prev.x - v.x;
    const ay = prev.y - v.y;
    const bx = next.x - v.x;
    const by = next.y - v.y;
    const la = Math.hypot(ax, ay);
    const lb = Math.hypot(bx, by);
    const ux = ax / la;
    const uy = ay / la;
    const wx = bx / lb;
    const wy = by / lb;
    const theta = Math.acos(Math.max(-1, Math.min(1, ux * wx + uy * wy)));
    const r = Math.min(radius, (Math.min(la, lb) / 2) * Math.tan(theta / 2));
    const t = r / Math.tan(theta / 2);
    const inX = v.x + t * ux;
    const inY = v.y + t * uy;
    const outX = v.x + t * wx;
    const outY = v.y + t * wy;
    const bisX = ux + wx;
    const bisY = uy + wy;
    const bl = Math.hypot(bisX, bisY);
    const dist = r / Math.sin(theta / 2);
    const cx = v.x + (bisX / bl) * dist;
    const cy = v.y + (bisY / bl) * dist;
    return { inX, inY, outX, outY, cx, cy, r };
  });

  const line = (x0: number, y0: number, x1: number, y1: number): void => {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const len = Math.hypot(dx, dy);
    // Outward normal of a clockwise edge in screen space (y down).
    const nx = dy / len;
    const ny = -dx / len;
    const steps = Math.max(1, Math.round(len / segment));
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      points.push({ x: x0 + dx * t, y: y0 + dy * t, nx, ny, s });
      s += len / steps;
    }
  };

  const arc = (c: (typeof corners)[number]): void => {
    const from = Math.atan2(c.inY - c.cy, c.inX - c.cx);
    const to = Math.atan2(c.outY - c.cy, c.outX - c.cx);
    // A convex corner always turns less than a half circle: take the short way.
    let delta = to - from;
    while (delta <= -Math.PI) delta += TAU;
    while (delta > Math.PI) delta -= TAU;
    const len = Math.abs(delta) * c.r;
    const steps = Math.max(1, Math.round(len / segment));
    for (let i = 0; i < steps; i++) {
      const a = from + (delta * i) / steps;
      const nx = Math.cos(a);
      const ny = Math.sin(a);
      points.push({ x: c.cx + nx * c.r, y: c.cy + ny * c.r, nx, ny, s });
      s += len / steps;
    }
  };

  for (let i = 0; i < n; i++) {
    const c = corners[i];
    const next = corners[(i + 1) % n];
    arc(c);
    line(c.outX, c.outY, next.inX, next.inY);
  }

  return { points, length: s };
};
