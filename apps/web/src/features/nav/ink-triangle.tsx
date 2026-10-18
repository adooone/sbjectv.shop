import { useEffect, useRef } from 'react';
import { createNoise2D } from 'simplex-noise';
import { roundedPolygonOutline } from './ink-triangle-geometry';

/**
 * A triangle drawn as a hand-drawn ink stroke: wobbly, with thickness that
 * swells and thins, animated with the same travelling noise as the rings.
 */

type InkTriangleProps = {
  /** Drawing resolution of the square canvas in CSS px (display size comes from the parent). */
  size: number;
  color: 'ink' | 'paper';
  /** Changes the wobble so neighbouring triangles don't move in lockstep. */
  seed?: number;
  /** Fills the inside of the outline (hover state); eases in and out. */
  filled?: boolean;
  className?: string;
};

const TAU = Math.PI * 2;
const FILL_SECONDS = 0.35;

// Deterministic PRNG so each triangle keeps its own character between renders.
const mulberry32 = (seed: number) => {
  let a = seed;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const prefersReducedMotion = () =>
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const InkTriangle = ({
  size,
  color,
  seed = 1,
  filled = false,
  className,
}: InkTriangleProps) => {
  const ref = useRef<HTMLCanvasElement>(null);
  // Read by the draw loop so a hover never restarts the animation.
  const fillTarget = useRef(filled ? 1 : 0);
  const redraw = useRef<() => void>(() => {});
  useEffect(() => {
    fillTarget.current = filled ? 1 : 0;
    redraw.current();
  }, [filled]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const noise = createNoise2D(mulberry32(seed));
    const direction = seed % 2 === 0 ? 1 : -1;
    const reduced = prefersReducedMotion();
    const start = performance.now();
    // Fill level moves linearly toward its target over FILL_SECONDS and is
    // eased when drawn, so hovering reads as a soft pour, not a flash.
    let fillLevel = fillTarget.current;
    let lastTime = start;

    // Same proportions as the Figma triangle (116 × 100.5), inset so the
    // stroke and the tail stay inside the canvas.
    const pad = size * 0.16;
    const w = size - 2 * pad;
    const h = w * (100.5 / 116);
    const top = (size - h) / 2;
    const { points, length } = roundedPolygonOutline(
      [
        { x: size / 2, y: top },
        { x: size - pad, y: top + h },
        { x: pad, y: top + h },
      ],
      size * 0.07,
      Math.max(1, size / 60),
    );

    const half = size * 0.045;
    const amp = size * 0.03;
    const r1 = length / (size * 0.55 * TAU);
    const r2 = r1 / 2.5;
    const r3 = length / (size * 1.6 * TAU);

    const draw = () => {
      const time = reduced ? 0 : (performance.now() - start) / 1000;
      const spin = (direction * time * 0.35) / r1;
      ctx.clearRect(0, 0, size, size);
      ctx.fillStyle = color === 'ink' ? '#000' : '#fff';
      const outer: number[] = [];
      const inner: number[] = [];
      for (const p of points) {
        const theta = (p.s / length) * TAU - spin;
        const d =
          amp *
          (0.6 * noise(r1 * Math.cos(theta), r1 * Math.sin(theta)) +
            0.8 * noise(r2 * Math.cos(theta) + 40, r2 * Math.sin(theta) + 40));
        const bw =
          half *
          (1 +
            0.35 * noise(r3 * Math.cos(theta) + 90, r3 * Math.sin(theta) + 90));
        const px = p.x + p.nx * d;
        const py = p.y + p.ny * d;
        outer.push(px + p.nx * bw, py + p.ny * bw);
        inner.push(px - p.nx * bw, py - p.ny * bw);
      }
      // Repeat the first point so the band also covers the closing segment.
      outer.push(outer[0], outer[1]);
      inner.push(inner[0], inner[1]);
      ctx.beginPath();
      ctx.moveTo(outer[0], outer[1]);
      for (let j = 2; j < outer.length; j += 2)
        ctx.lineTo(outer[j], outer[j + 1]);
      for (let j = inner.length - 2; j >= 0; j -= 2) {
        ctx.lineTo(inner[j], inner[j + 1]);
      }
      ctx.closePath();
      ctx.fill();
      const now = performance.now();
      const dt = Math.min(0.1, (now - lastTime) / 1000);
      lastTime = now;
      const step = reduced ? 1 : dt / FILL_SECONDS;
      fillLevel =
        fillTarget.current > fillLevel
          ? Math.min(fillTarget.current, fillLevel + step)
          : Math.max(fillTarget.current, fillLevel - step);
      if (fillLevel > 0.001) {
        const l = fillLevel;
        ctx.globalAlpha = l * l * l * (l * (l * 6 - 15) + 10);
        ctx.beginPath();
        ctx.moveTo(inner[0], inner[1]);
        for (let j = 2; j < inner.length; j += 2) {
          ctx.lineTo(inner[j], inner[j + 1]);
        }
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    };

    redraw.current = draw;
    draw();
    let frame = 0;
    const loop = () => {
      draw();
      frame = requestAnimationFrame(loop);
    };
    if (!reduced) frame = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(frame);
      redraw.current = () => {};
    };
  }, [size, color, seed]);

  // The canvas fills whatever box it is given; `size` only sets the drawing
  // resolution, so a CSS-scaled wrapper never pushes it out of place.
  return (
    <canvas
      ref={ref}
      className={className}
      style={{ width: '100%', height: '100%' }}
    />
  );
};
