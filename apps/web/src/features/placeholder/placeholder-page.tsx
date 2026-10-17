import { Layout } from '@/features/layout';

type PlaceholderPageProps = {
  title: string;
};

export const PlaceholderPage = ({ title }: PlaceholderPageProps) => (
  <Layout>
    <section className="mx-auto max-w-2xl space-y-4">
      <h1 className="font-mono text-4xl uppercase">{title}</h1>
      <p className="text-ink/60">Скоро.</p>
    </section>
  </Layout>
);
