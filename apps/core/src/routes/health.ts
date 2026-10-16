import type { HealthResponse } from '@sbjectv/types';
import { Hono } from 'hono';
import pkg from '../../package.json' with { type: 'json' };

export const healthRoute = new Hono().get('/', (c) => {
  const body: HealthResponse = {
    name: pkg.name,
    status: 'ok',
    version: pkg.version,
    time: new Date().toISOString(),
  };
  return c.json(body);
});
