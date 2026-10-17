# sbjectv.shop

Monorepo for the sbjectv t-shirt shop: a React storefront, a Bun API, and shared types.

## Apps

| App | Package | Port | Description |
|-----|---------|------|-------------|
| `apps/web` | `@sbjectv/web` | 3200 | React 19 + Vite 8 storefront, Tailwind 4 |
| `apps/core` | `@sbjectv/core` | 3201 | Bun + Hono API, Drizzle ORM on SQLite |
| `packages/types` | `@sbjectv/types` | — | Types shared by web and core |

## Stack

- **Frontend** — React 19, Vite 8, TanStack Router + Query, Tailwind CSS 4, Zustand, Zod 4
- **Backend** — Bun 1.4, Hono 4, Zod 4, Drizzle ORM (`bun:sqlite`)
- **Monorepo** — pnpm 12 workspaces, Turborepo 2
- **Tooling** — TypeScript 7, Biome 2 (lint + format), Vitest 5 / `bun test`, Husky + Commitlint
- **Project memory** — [Paper Camp](https://github.com/adooone/paper-camp) (`papercamp/`)

Node 24 is pinned through Volta (`volta.node`), Bun and pnpm through `package.json`
(`devDependencies.bun`, `packageManager`). pnpm 10+ switches to the pinned pnpm on its own.

## Getting started

```bash
pnpm install

# Run everything in parallel
pnpm dev

# Or one app at a time
pnpm web:dev    # storefront on http://localhost:3200
pnpm core:dev   # API        on http://localhost:3201
```

Copy `apps/web/.env.example` and `apps/core/.env.example` to `.env` in the same folders
if you need to change ports or origins. The SQLite file lives in `apps/core/data/`
(gitignored) and migrations from `apps/core/drizzle/` are applied on startup.

### Other commands

```bash
pnpm check-types   # TypeScript across all workspaces
pnpm lint          # Biome lint across all workspaces
pnpm lint:write    # Biome lint with auto-fix
pnpm format        # Biome format the whole repo
pnpm test          # Vitest (web) + bun test (core)
pnpm build         # Production build (web)
pnpm verify        # check-types + lint + test + build, same as CI

pnpm --filter @sbjectv/core db:generate   # new Drizzle migration from schema changes
pnpm --filter @sbjectv/core db:studio     # Drizzle Studio

pnpm camp          # Paper Camp dashboard for this project
```

## Structure

```
sbjectv.shop/
├── apps/
│   ├── web/                    # React storefront
│   │   └── src/
│   │       ├── features/       # Route-level feature modules (home/, layout.tsx)
│   │       ├── routes/         # TanStack Router route definitions
│   │       ├── lib/            # API client, query client
│   │       ├── styles/         # Tailwind entry + theme tokens
│   │       └── tests/          # Vitest setup
│   └── core/                   # Bun + Hono API
│       ├── drizzle/            # Generated SQL migrations (committed)
│       └── src/
│           ├── db/             # Drizzle schema, client, migrate script
│           ├── routes/         # Hono sub-apps (health, products)
│           ├── app.ts          # App factory (used by tests)
│           ├── env.ts          # Zod-validated environment
│           └── index.ts        # Bun entry point
├── packages/
│   └── types/                  # @sbjectv/types — shared TS types
├── papercamp/                  # Paper Camp corpus: ideas, plans, config
├── .github/workflows/ci.yml    # Types, lint, test, build on push and PRs
└── turbo.json, biome.json, tsconfig.base.json, pnpm-workspace.yaml
```

## Conventions

- Files are `kebab-case`; components are named arrow-function exports.
- Features live under `src/features/<name>/` with a barrel `index.ts`.
- Conventional commits (`feat:`, `fix:`, `chore:` …) — enforced by Commitlint on commit.
- The pre-commit hook runs `pnpm check-types` and `pnpm lint`.

## Deployment

`apps/web` deploys to Vercel as a static Vite app from the `sbjectv-shop` project on the
Adoo team (`croco-dendy-projects`), linked to this GitHub repo with root directory `apps/web`:

- Production: https://sbjectv.how (every push to `main`). `www.sbjectv.how` redirects to it;
  `sbjectv-shop.vercel.app` is the default Vercel alias for the same deployment.
- Previews: one per branch and PR, e.g. `sbjectv-shop-git-<branch>-croco-dendy-projects.vercel.app`

`apps/web/vercel.json` rewrites all routes to `/` for client-side routing. Set `VITE_API_URL`
in the Vercel project (Settings → Environment Variables) once the API has a public URL.
`apps/core` runs anywhere Bun runs (`pnpm --filter @sbjectv/core start`).
