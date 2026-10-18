import { RINGS, roundedRectOutline } from './rings-renderer';

describe('roundedRectOutline', () => {
  it('samples a closed path roughly every `segment` px', () => {
    const ring = { x: 0, y: 0, w: 400, h: 200, r: 50 };
    const points = roundedRectOutline(ring, 4);
    const perimeter = 2 * (400 - 100) + 2 * (200 - 100) + 2 * Math.PI * 50;
    expect(points.length).toBeGreaterThan(perimeter / 5);
    expect(points.length).toBeLessThan(perimeter / 3);
    expect(points.at(-1)?.s).toBeLessThan(perimeter);
    for (const p of points) {
      expect(Math.hypot(p.nx, p.ny)).toBeCloseTo(1, 5);
    }
  });

  it('keeps the Figma rings nested around the frame centre', () => {
    for (const ring of RINGS) {
      expect(ring.x + ring.w / 2).toBeCloseTo(720, -1);
      expect(ring.y + ring.h / 2).toBeCloseTo(512, -1);
    }
  });
});
