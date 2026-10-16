import { zValidator } from '@hono/zod-validator';
import type { Product, ProductListResponse } from '@sbjectv/types';
import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { z } from 'zod';
import type { Db } from '@/db/client';
import { type ProductRow, products } from '@/db/schema';

const toProduct = (row: ProductRow): Product => ({
  id: row.id,
  slug: row.slug,
  name: row.name,
  description: row.description,
  priceCents: row.priceCents,
  currency: row.currency,
  createdAt: row.createdAt,
});

const slugParam = z.object({ slug: z.string().min(1) });

export const createProductsRoute = (db: Db) =>
  new Hono()
    .get('/', (c) => {
      const rows = db.select().from(products).all();
      const body: ProductListResponse = { items: rows.map(toProduct) };
      return c.json(body);
    })
    .get('/:slug', zValidator('param', slugParam), (c) => {
      const { slug } = c.req.valid('param');
      const row = db
        .select()
        .from(products)
        .where(eq(products.slug, slug))
        .get();
      if (!row) return c.json({ error: 'Product not found' }, 404);
      return c.json(toProduct(row));
    });
