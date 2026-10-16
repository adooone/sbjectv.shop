import { createApp } from '@/app';
import { createDb } from '@/db/client';
import { env } from '@/env';

const app = createApp({ db: createDb(), corsOrigin: env.CORS_ORIGIN });

console.log(`@sbjectv/core listening on http://localhost:${env.PORT}`);

export default {
  port: env.PORT,
  fetch: app.fetch,
};
