import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3201),
  DATABASE_URL: z.string().default('./data/shop.db'),
  CORS_ORIGIN: z
    .string()
    .default('http://localhost:3200')
    .transform((value) => value.split(',').map((origin) => origin.trim())),
});

export const env = envSchema.parse(process.env);
