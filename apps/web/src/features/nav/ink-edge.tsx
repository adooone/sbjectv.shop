import { useEffect, useRef } from 'react';
import { createNoise2D } from 'simplex-noise';

/**
 * The torn top edge of the mobile nav: a hand-drawn black line that wobbles
 * like the rings, with white paper below it so the rings behind are covered.
 */

type InkEdgeProps = {
  className?: string;
};

const BAND = 7;
const AMPLITUDE = 5;
const WAVELENGTH = 90;
const FLOW = 18;

const prefersReducedMotion = () =>
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const InkEdge = ({ className }: InkEdgeProps) => {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const noise = createNoise2D();
    const reduced = prefersReducedMotion();
    const start = performance.now();
    let width = 0;
    let height = 0;

    const edgeAt = (x: number, t: number) => {
      const u = (x - t * FLOW) / WAVELENGTH;
      return (
        height / 2 +
        AMPLITUDE * (0.6 * noise(u, 1.5) + 0.8 * noise(u / 2.7, 8.5))
      );
    };

    const draw = () => {
      const t = reduced ? 0 : (performance.now() - start) / 1000;
      ctx.clearRect(0, 0, width, height);
      const step = 3;
      // Paper below the edge.
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.moveTo(0, height);
      for (let x = 0; x <= width + step; x += step) {
        ctx.lineTo(x, edgeAt(x, t));
      }
      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fill();
      // Ink line with slightly varying thickness.
      ctx.fillStyle = '#000';
      ctx.beginPath();
      const top: number[] = [];
      const bottom: number[] = [];
      for (let x = 0; x <= width + step; x += step) {
        const y = edgeAt(x, t);
        const w =
          (BAND / 2) * (1 + 0.35 * noise((x - t * FLOW * 0.4) / 240, 20));
        top.push(x, y - w);
        bottom.push(x, y + w);
      }
      ctx.moveTo(top[0], top[1]);
      for (let i = 2; i < top.length; i += 2) ctx.lineTo(top[i], top[i + 1]);
      for (let i = bottom.length - 2; i >= 0; i -= 2) {
        ctx.lineTo(bottom[i], bottom[i + 1]);
      }
      ctx.closePath();
      ctx.fill();
    };

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    };

    resize();
    const observer =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(resize);
    observer?.observe(canvas);
    if (!observer) window.addEventListener('resize', resize);

    let frame = 0;
    const loop = () => {
      draw();
      frame = requestAnimationFrame(loop);
    };
    if (!reduced) frame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
      if (!observer) window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={ref} className={className} />;
};
