import type { HealthResponse, ProductListResponse } from '@sbjectv/types';
import { QueryClient } from '@tanstack/react-query';

export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3201';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
});

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${path}`);
  return (await res.json()) as T;
};

export const api = {
  health: () => request<HealthResponse>('/health'),
  products: {
    list: () => request<ProductListResponse>('/api/products'),
  },
};
