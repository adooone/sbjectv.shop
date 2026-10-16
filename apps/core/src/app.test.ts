import { describe, expect, it } from 'bun:test';
import { createApp } from '@/app';
import { createDb } from '@/db/client';
import { products } from '@/db/schema';

const makeApp = () => {
  const db = createDb(':memory:');
  return { db, app: createApp({ db, corsOrigin: ['http://localhost:3200'] }) };
};

describe('core app', () => {
  it('reports health', async () => {
    const { app } = makeApp();
    const res = await app.request('/health');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ok');
    expect(body.name).toBe('@sbjectv/core');
  });

  it('lists products from the database', async () => {
    const { app, db } = makeApp();
    db.insert(products)
      .values({ slug: 'plain-tee', name: 'Plain tee', priceCents: 79900 })
      .run();

    const res = await app.request('/api/products');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.items).toHaveLength(1);
    expect(body.items[0].slug).toBe('plain-tee');
  });

  it('returns 404 for an unknown product', async () => {
    const { app } = makeApp();
    const res = await app.request('/api/products/nope');
    expect(res.status).toBe(404);
  });
});
