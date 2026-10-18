/**
 * The t-shirts section: the frame has morphed into a shirt on the right;
 * the title and, later, the description and order button sit on the left.
 */
export const ShirtPage = () => (
  <section
    className="absolute flex flex-col gap-4 text-ink portrait:hidden"
    style={{
      left: 'calc(190 * var(--k))',
      top: 'calc(190 * var(--k))',
      width: 'calc(420 * var(--k))',
      animation: 'fade-in 0.4s ease-out 0.3s both',
    }}
  >
    <h1
      className="font-display font-semibold leading-none"
      style={{ fontSize: 'calc(72 * var(--k))' }}
    >
      ФУТБОЛКИ
    </h1>
    <p
      className="font-sans text-ink/70"
      style={{ fontSize: 'calc(20 * var(--k))' }}
    >
      Скоро тут будуть дизайни.
    </p>
  </section>
);
