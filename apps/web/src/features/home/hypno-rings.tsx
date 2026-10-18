import { useEffect, useRef } from 'react';
import {
  type RingsOptions,
  type RingsRenderer,
  type SceneId,
  createRingsRenderer,
} from './rings-renderer';

type HypnoRingsProps = {
  className?: string;
  options?: Partial<RingsOptions>;
  /** Which shape the window takes; changes animate. */
  scene?: SceneId;
};

const prefersReducedMotion = () =>
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const HypnoRings = ({
  className,
  options,
  scene = 'home',
}: HypnoRingsProps) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<RingsRenderer | null>(null);
  const sceneRef = useRef(scene);
  sceneRef.current = scene;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const renderer = createRingsRenderer(canvas, options);
    if (!renderer) return;
    rendererRef.current = renderer;
    renderer.setScene(sceneRef.current);

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
      rendererRef.current = null;
    };
  }, [options]);

  useEffect(() => {
    rendererRef.current?.setScene(scene);
  }, [scene]);

  return <canvas ref={ref} className={className} />;
};
