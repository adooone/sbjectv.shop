# Agent instructions for sbjectv.shop

This file is the source of truth for how AI assistants should work in this repository.
Project memory (ideas, plans, decisions) lives in `papercamp/` — read it at the start of
a session and keep it honest as you work (see `.claude/skills/paper-camp/SKILL.md`).

## Codebase map

- `apps/web/` — React 19 storefront (Vite 8, Tailwind 4, TanStack Router + Query).
  `src/router.tsx` is the route table; `src/routes/` holds route definitions;
  `src/features/<name>/` holds pages and their components (`home/` is the
  hypnotic landing page: `rings-renderer.ts` draws the Figma rings on a canvas with
  flowing simplex noise, `corner-link.tsx` the four corner links); `src/lib/api.ts` is the
  typed API client and the shared `queryClient`; `src/styles/index.css` holds the
  Tailwind theme tokens (`@theme`).
- `apps/core/` — Bun + Hono API. `src/app.ts` builds the app from a `Db` (so tests
  can use `:memory:`); `src/routes/` holds Hono sub-apps; `src/db/schema.ts` is the
  Drizzle schema and `drizzle/` the generated migrations; `src/env.ts` validates env.
- `packages/types/` — `@sbjectv/types`, runtime-free types shared by web and core.
  Add the response type here first, then use it on both sides.

## Verify before you finish

`pnpm check-types`, `pnpm lint` (`pnpm lint:write` to auto-fix), `pnpm test`, and
`pnpm build`. All four run on every PR (`.github/workflows/ci.yml`) and the first two
run in the pre-commit hook.

## Conventions

- Files are `kebab-case.ts(x)`: `product-card.tsx`, `use-cart.ts`, `cart-store.ts`.
- Components are named arrow-function exports; no default exports except `router.tsx`.
- `verbatimModuleSyntax` is on: use `import type` for types.
- Schema changes: edit `src/db/schema.ts`, then run
  `pnpm --filter @sbjectv/core db:generate` and commit the new file in `drizzle/`.
- Prices are integers in minor units (`priceCents`); never floats.
- Conventional commits, one commit per plan phase.

## Do one phase at a time

When asked to work on a plan (`papercamp/ideas/<ID>.md`), complete only the phase
asked for, mark it `[x]`, keep `status:` honest, and stop. When every phase is done,
set `status: review`, never `done`.
