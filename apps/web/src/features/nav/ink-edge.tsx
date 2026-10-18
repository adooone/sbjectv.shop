import { useEffect, useRef } from 'react';
import { createNoise2D } from 'simplex-noise';
import {
  cappedDpr,
  createClock,
  observeVisible,
  prefersReducedMotion,
  subscribeTick,
} from '@/lib/ticker';

/**
 * The torn top edge of the mobile nav: a hand-drawn black line that wobbles
 * like the rings, with white paper below it so the rings behind are covered.
 * Shares the page's animation loop and stops while off screen.
 */

type InkEdgeProps = {
  className?: string;
};

const BAND = 7;
const AMPLITUDE = 5;
const WAVELENGTH = 90;
const FLOW = 18;

export const InkEdge = ({ className }: InkEdgeProps) => {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const noise = createNoise2D();
    const reduced = prefersReducedMotion();
    const clock = createClock(reduced);
    let width = 0;
    let height = 0;

    const edgeAt = (x: number, t: number) => {
      const u = (x - t * FLOW) / WAVELENGTH;
      return (
        height / 2 +
        AMPLITUDE * (0.6 * noise(u, 1.5) + 0.8 * noise(u / 2.7, 8.5))
      );
    };

    const draw = (now: number) => {
      const t = clock.tick(now);
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
      let first = true;
      for (let x = 0; x <= width + step; x += step) {
        const y = edgeAt(x, t);
        const w =
          (BAND / 2) * (1 + 0.35 * noise((x - t * FLOW * 0.4) / 240, 20));
        if (first) ctx.moveTo(x, y - w);
        else ctx.lineTo(x, y - w);
        first = false;
      }
      for (let x = width + step; x >= 0; x -= step) {
        const y = edgeAt(x, t);
        const w =
          (BAND / 2) * (1 + 0.35 * noise((x - t * FLOW * 0.4) / 240, 20));
        ctx.lineTo(x, y + w);
      }
      ctx.closePath();
      ctx.fill();
    };

    const resize = () => {
      const dpr = cappedDpr();
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw(performance.now());
    };

    resize();
    const observer =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(resize);
    observer?.observe(canvas);
    if (!observer) window.addEventListener('resize', resize);

    let unsubscribe: (() => void) | null = null;
    const stopObserving = observeVisible(canvas, (visible) => {
      if (visible && !reduced && !unsubscribe)
        unsubscribe = subscribeTick(draw);
      if (!visible && unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }
    });

    return () => {
      unsubscribe?.();
      stopObserving();
      observer?.disconnect();
      if (!observer) window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={ref} className={className} />;
};
