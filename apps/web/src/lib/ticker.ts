/**
 * One requestAnimationFrame loop shared by every animated canvas on the page.
 * It only runs while something is subscribed, so hidden or paused canvases
 * cost nothing and the browser schedules a single callback per frame.
 */

type Tick = (now: number) => void;

const subscribers = new Set<Tick>();
let frame = 0;

const loop = (now: number) => {
  frame = 0;
  for (const tick of subscribers) tick(now);
  if (subscribers.size > 0) frame = requestAnimationFrame(loop);
};

export const subscribeTick = (tick: Tick): (() => void) => {
  subscribers.add(tick);
  if (!frame) frame = requestAnimationFrame(loop);
  return () => {
    subscribers.delete(tick);
    if (subscribers.size === 0 && frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  };
};

/** Device pixel ratio capped so 3× phones don't pay for pixels nobody sees. */
export const cappedDpr = (max = 2): number =>
  Math.min(max, window.devicePixelRatio || 1);

export const prefersReducedMotion = (): boolean =>
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Calls `onChange` when the element enters or leaves the viewport (or is
 * display:none). Without IntersectionObserver it reports visible once.
 */
export const observeVisible = (
  element: Element,
  onChange: (visible: boolean) => void,
): (() => void) => {
  if (typeof IntersectionObserver === 'undefined') {
    onChange(true);
    return () => {};
  }
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) onChange(entry.isIntersecting);
  });
  observer.observe(element);
  return () => observer.disconnect();
};
