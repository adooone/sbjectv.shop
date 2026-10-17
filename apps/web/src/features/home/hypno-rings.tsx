import { useEffect, useRef } from 'react';
import { createRingsRenderer, type RingsOptions } from './rings-renderer';

type HypnoRingsProps = {
  className?: string;
  options?: Partial<RingsOptions>;
};

const prefersReducedMotion = () =>
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const HypnoRings = ({ className, options }: HypnoRingsProps) => {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const renderer = createRingsRenderer(canvas, options);
    if (!renderer) return;

    const reduced = prefersReducedMotion();
    const start = performance.now();
    const now = () => (reduced ? 0 : (performance.now() - start) / 1000);

    const resize = () => {
      renderer.resize(
        canvas.clientWidth,
        canvas.clientHeight,
        window.devicePixelRatio || 1,
      );
      renderer.draw(now());
    };

    resize();
    const observer =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(resize);
    observer?.observe(canvas);
    if (!observer) window.addEventListener('resize', resize);

    let frame = 0;
    const loop = () => {
      renderer.draw(now());
      frame = requestAnimationFrame(loop);
    };
    if (!reduced) frame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
      if (!observer) window.removeEventListener('resize', resize);
    };
  }, [options]);

  return <canvas ref={ref} className={className} />;
};
