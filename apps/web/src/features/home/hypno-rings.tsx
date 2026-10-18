import { useEffect, useRef } from 'react';
import {
  cappedDpr,
  createClock,
  prefersReducedMotion,
  subscribeTick,
} from '@/lib/ticker';
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
  /** Screen direction the inside flies off in when a section opens. */
  exit?: { x: number; y: number };
  /** Called after every draw with the inside's offset, for DOM that flies with it. */
  onShift?: (x: number, y: number) => void;
};

/**
 * Frame pacing thresholds for adaptive quality: sustained slow frames lower
 * the detail (fewer points, fewer pixels), sustained fast ones restore it.
 */
const SLOW_FRAME_MS = 22;
const FAST_FRAME_MS = 12;
const SLOW_FRAMES_TO_DROP = 45;
const FAST_FRAMES_TO_RAISE = 240;

export const HypnoRings = ({
  className,
  options,
  scene = 'home',
  exit,
  onShift,
}: HypnoRingsProps) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<RingsRenderer | null>(null);
  const sceneRef = useRef(scene);
  sceneRef.current = scene;
  const exitRef = useRef(exit);
  exitRef.current = exit;
  const onShiftRef = useRef(onShift);
  onShiftRef.current = onShift;
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const renderer = createRingsRenderer(canvas, optionsRef.current);
    if (!renderer) return;
    rendererRef.current = renderer;
    renderer.setScene(sceneRef.current, exitRef.current);

    const reduced = prefersReducedMotion();
    const start = performance.now();
    const clock = createClock(reduced);

    const resize = () => {
      renderer.resize(canvas.clientWidth, canvas.clientHeight, cappedDpr());
      renderer.draw(clock.now());
      const s = renderer.interiorShift();
      onShiftRef.current?.(s.x, s.y);
    };

    resize();
    const observer =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(resize);
    observer?.observe(canvas);
    if (!observer) window.addEventListener('resize', resize);

    // Adaptive quality from the frame interval the browser actually gives us.
    let quality: 0 | 1 | 2 = 0;
    let lastNow = start;
    let slow = 0;
    let fast = 0;
    const tick = (now: number) => {
      const interval = now - lastNow;
      lastNow = now;
      if (interval > SLOW_FRAME_MS) {
        slow++;
        fast = 0;
      } else if (interval < FAST_FRAME_MS) {
        fast++;
        slow = 0;
      } else {
        slow = 0;
        fast = 0;
      }
      if (slow >= SLOW_FRAMES_TO_DROP && quality < 2) {
        quality = quality === 0 ? 1 : 2;
        slow = 0;
        renderer.setQuality(quality);
      } else if (fast >= FAST_FRAMES_TO_RAISE && quality > 0) {
        quality = quality === 2 ? 1 : 0;
        fast = 0;
        renderer.setQuality(quality);
      }
      renderer.draw(clock.tick(now));
      const s = renderer.interiorShift();
      onShiftRef.current?.(s.x, s.y);
    };
    const unsubscribe = reduced ? null : subscribeTick(tick);

    return () => {
      unsubscribe?.();
      observer?.disconnect();
      if (!observer) window.removeEventListener('resize', resize);
      rendererRef.current = null;
    };
  }, []);

  useEffect(() => {
    rendererRef.current?.setScene(scene, exitRef.current);
  }, [scene]);

  // Option changes update the live renderer in place, so
  // the wobble and any running morph are not reset.
  useEffect(() => {
    if (options) rendererRef.current?.setOptions(options);
  }, [options]);

  return <canvas ref={ref} className={className} />;
};
