/**
 * A section drawn on the shared canvas: the frame morphs into the section's
 * shape and the corner label unrolls into the title, so the page itself only
 * carries a heading for assistive tech. Content comes per section later.
 */
export const SectionPage = ({ title }: { title: string }) => (
  <h1 className="sr-only">{title}</h1>
);
