import { roundedPolygonOutline } from './ink-triangle-geometry';

describe('roundedPolygonOutline', () => {
  it('walks a rounded triangle clockwise with unit outward normals', () => {
    const { points, length } = roundedPolygonOutline(
      [
        { x: 50, y: 0 },
        { x: 100, y: 90 },
        { x: 0, y: 90 },
      ],
      8,
      2,
    );
    expect(points.length).toBeGreaterThan(100);
    expect(length).toBeGreaterThan(250);
    expect(length).toBeLessThan(300);
    for (const p of points) {
      expect(Math.hypot(p.nx, p.ny)).toBeCloseTo(1, 5);
      // Outward normals point away from the centroid.
      const toCentre = { x: 50 - p.x, y: 60 - p.y };
      expect(p.nx * toCentre.x + p.ny * toCentre.y).toBeLessThan(0);
    }
    expect(points[0].s).toBe(0);
    expect(points.at(-1)?.s).toBeLessThan(length);
  });
});
