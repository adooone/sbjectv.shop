// Shared types between @sbjectv/web and @sbjectv/core.
// Keep this package runtime-free: types and constants only.

export type HealthResponse = {
  name: string;
  status: 'ok';
  version: string;
  time: string;
};

export type Product = {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  /** Price in minor units (e.g. cents). */
  priceCents: number;
  currency: string;
  createdAt: string;
};

export type ProductListResponse = {
  items: Product[];
};
