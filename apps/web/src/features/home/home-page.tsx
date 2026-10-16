import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export const HomePage = () => {
  const health = useQuery({ queryKey: ['health'], queryFn: api.health });

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-4xl font-bold">Hello, sbjectv.</h1>
      <p className="text-ink/70">
        The storefront is empty. Start by adding products in{' '}
        <code className="font-mono text-sm">apps/core</code> and listing them
        here.
      </p>
      <p className="text-sm" data-testid="api-status">
        API: {health.isPending && <span>checking…</span>}
        {health.isError && <span className="text-accent">offline</span>}
        {health.isSuccess && (
          <span>
            {health.data.name} v{health.data.version} is {health.data.status}
          </span>
        )}
      </p>
    </section>
  );
};
