/**
 * The t-shirts section: the frame has morphed into a shirt on the right; the
 * title sits top-left on the ink, the description and order button will join
 * it on the left.
 */
export const ShirtPage = () => (
  <section
    className="absolute flex flex-col gap-2 text-paper portrait:hidden"
    style={{
      left: 'calc(96 * var(--kc))',
      top: 'calc(72 * var(--kc))',
      width: 'calc(520 * var(--k))',
      animation: 'fade-in 0.4s ease-out 0.25s both',
    }}
  >
    <h1
      className="font-display font-semibold leading-none"
      style={{ fontSize: 'calc(36 * var(--k))' }}
    >
      ФУТБОЛКИ
    </h1>
    <p
      className="font-sans text-paper/70"
      style={{ fontSize: 'calc(16 * var(--k))' }}
    >
      Скоро тут будуть дизайни.
    </p>
  </section>
);
