import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import type { Db } from '@/db/client';
import { healthRoute } from '@/routes/health';
import { createProductsRoute } from '@/routes/products';

export type AppOptions = {
  db: Db;
  corsOrigin: string[];
};

export const createApp = ({ db, corsOrigin }: AppOptions) =>
  new Hono()
    .use('*', logger())
    .use('/api/*', cors({ origin: corsOrigin }))
    .route('/health', healthRoute)
    .route('/api/products', createProductsRoute(db))
    .notFound((c) => c.json({ error: 'Not found' }, 404));

export type App = ReturnType<typeof createApp>;
