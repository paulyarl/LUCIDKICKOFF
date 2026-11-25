# Getting Started — LucidCraft (LUCIDKICKOFF)

Onboarding guide for a new engineer. Read this end-to-end before touching code — several things about this repo are non-obvious and will bite you if you assume defaults.

Companion docs:

- `AGENTS.md` (repo root) — authoritative project notes, known debt, verification commands. **Treat this as the source of truth; update it when you learn something new.**
- `docs/spec/` — functional/technical specs, gap analyses, and modernization plans (the product is mid-revamp toward "2.1").
- `docs/TEST_ACCOUNTS.md` — demo account seeding.
- `docs/ANALYTICS.md` — PostHog/Sentry setup.

---

## 1. What this is

A kids' creative-canvas app ("LucidCraft"): children draw on a Konva canvas, parents manage profiles/learners, content is organized into packs/lessons. Guest-first — users can create before signing up.

- **Frontend:** Next.js 14 App Router + TypeScript + Tailwind + shadcn/ui + react-konva
- **Backend:** Supabase (Postgres + Auth + Storage + Edge Functions)
- **Monorepo:** npm workspaces. The real app is `apps/web`; there is also a shared root `app/`, `components/`, `lib/`, `features/`, `types/` tree that `apps/web` falls back to via tsconfig path aliases (`@/components`, `@/lib`, `@/styles` resolve to `apps/web` first, then root). Mid-migration — prefer adding new code under `apps/web/`.
- **Deploy:** Netlify, auto-deploys `main` → `genuine-cheesecake-327d05.netlify.app`
- **Observability:** PostHog (analytics) + Sentry (errors)

## 2. Prerequisites / CLI tools

| Tool | Version | Notes |
|---|---|---|
| Node.js | 20.x (Netlify pins `NODE_VERSION=20`; use 20 locally to match) | No `.nvmrc` — use `nvm use 20` or equivalent |
| npm | 10/11 | **Use npm, NOT pnpm.** See §3. |
| Git | any recent | |
| Supabase CLI | optional | Only needed for local stack / edge-function dev. Deploys work via `npx supabase functions deploy` with a scoped access token — `supabase link` fails without `api_gateway_keys_read` |
| Netlify CLI | optional | `netlify dev` / `netlify functions:*` debugging; site already auto-deploys |
| Playwright browsers | optional | `npx playwright install` for e2e |

Install-script gate: npm 11 blocks dependency postinstall scripts by default. Approved packages live in root `package.json → allowScripts` (supabase, esbuild, @tailwindcss/oxide, unrs-resolver, sharp, canvas, @sentry/cli). If you add a native dep and its postinstall doesn't run, approve it with `npm install-scripts approve <pkg>`.

## 3. Install & run

```bash
git clone <repo> && cd LUCIDKICKOFF
npm install          # workspace install from ROOT — never cd into apps/web and install
npm run dev          # next dev on http://localhost:3000
```

**Do not use pnpm.** A mass pnpm upgrade was tried and reverted: it broke the `overrides` contract in root `package.json` (which pins React 18.3.1 — Next 14 does not support React 19). The committed lockfile is `package-lock.json`. Do not run `pnpm up` / `pnpm import`.

Root scripts (all delegate to the `web` workspace where relevant):

| Command | What it does |
|---|---|
| `npm run dev` | `next dev` → localhost:3000 |
| `npm run build` | `next build` — **must pass**; this is the Netlify gate |
| `npm run test:unit` | vitest — currently ~25/44 tests pass (see §8, known debt) |
| `npm run test:e2e` | playwright — not yet exercised in CI |
| `npm run test:tsc` | typecheck test files via `tsconfig.test.json` |
| `npm run seed:demo` | seed admin/parent/child users (needs service role, §6) |
| `npm run seed:lessons` | seed lesson content |
| `npm run art:generate` / `art:check` / `art:export` | art-asset pipeline |
| `npm run review:pr` | PR review helper |

## 4. Environment variables

Two `.env.local` files, both gitignored:

**`apps/web/.env.local`** (browser + server for the Next app):

```env
NEXT_PUBLIC_SUPABASE_URL=https://gehshupbmmrosylkuqsk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...   # publishable key, not the legacy anon JWT
# Optional:
NEXT_PUBLIC_POSTHOG_KEY=...
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
NEXT_PUBLIC_SENTRY_DSN=...
SENTRY_AUTH_TOKEN=...
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_ERROR_TRACKING=true
```

**Root `.env.local`** (server-only, for scripts):

```env
SUPABASE_URL=https://gehshupbmmrosylkuqsk.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...   # NEVER expose to the client or commit
```

Get values from the Supabase dashboard → project `gehshupbmmrosylkuqsk` (us-east-1, Pro plan). Ask a teammate for the service role key — it is not in the repo.

## 5. Repo layout

```
apps/web/                  # the Next.js app (app router lives here)
  app/                     # routes: canvas, parent, child, learn, packs,
                           # community, admin, auth, api/, ... (~46 pages)
  app/api/                 # route handlers: admin, auth, child(ren),
                           # family, learners, lessons, media, packs, profile
  components/              # ui/ (shadcn), canvas/, parent/, child/,
                           # learning/, packs/, pwa/, sync/, i18n/, ...
  features/                # learn, tutorials
  lib/                     # supabase/, api/, stores/, hooks/, auth/,
                           # database/ (+ database.types.ts), db/, i18n/,
                           # learning/, analytics/, sw/, adapters/, ...
  middleware.ts            # auth/role middleware + security headers
public/                    # static assets incl. hand-rolled sw.js (PWA)
supabase/
  migrations/              # ~42 SQL migrations — source of truth for schema
  functions/               # edge functions: generate-otp, link-child,
                           # export-artwork (+ _shared/)
  tests/                   # pgTAP tests live here, NOT in migrations
scripts/                   # seed-*, db-probe, art-*, i18n scaffold,
                           # posthog dashboards, pr-review
docs/spec/                 # product specs & modernization plans
tests/, playwright/        # e2e tests
netlify.toml               # build config (see §9)
```

Root-level `app/`, `components/`, `lib/`, `features/`, `types/`, `middleware.ts`, `next.config.js` are the **legacy/shared tree** still partially in use via alias fallback. When in doubt, check whether `apps/web` has its own version of the file first — that's the one that wins.

## 6. Database (Supabase)

Project `gehshupbmmrosylkuqsk`, region us-east-1. Postgres + Auth + Storage + RLS everywhere.

- **Schema changes** go in `supabase/migrations/` as timestamped SQL files. They apply to the remote DB via:

  ```bash
  npx supabase db push --db-url "postgresql://postgres.<ref>:<pw>@aws-1-us-east-1.pooler.supabase.com:5432/postgres"
  ```

  Pooler URL format; get the DB password from the dashboard. All migrations currently apply cleanly.

- **Verify migrations landed** without psql:

  ```bash
  DB_URL="postgresql://..." node scripts/db-probe.cjs
  ```

  checks `schema_migrations` + key table presence.

- **Migration quirks (already fixed — don't reintroduce):** files used `create policy if not exists` / `add constraint if not exists` which are invalid Postgres — stripped. Ordering was repaired once by renaming a file to `20240827224000`. Keep timestamp prefixes monotonic.

- **pgTAP tests** are in `supabase/tests/` (not migrations — pgTAP isn't available on hosted Supabase).

- **Regenerate types** after schema changes: `apps/web/lib/database.types.ts` is generated against the live schema (regenerated 24 Nov 2026). Find the generation command in repo history/scripts if needed; it's currently committed and drift is tracked as tech debt.

- **RLS:** every table has row-level security. When writing queries, remember the client runs as the anon/authenticated role — admin/service operations must go through API routes or edge functions with the service role.

- **Demo users:** `npm run seed:demo` (see `docs/TEST_ACCOUNTS.md`) creates admin/parent/child users idempotently via the Admin API. Dev-only impersonation UI at `/dev/impersonate` (NODE_ENV=development only).

## 7. Edge functions

`supabase/functions/`: `generate-otp`, `link-child`, `export-artwork` (+ `_shared/`). Deployed to the project already. Redeploy after changes:

```bash
npx supabase functions deploy <name> --project-ref gehshupbmmrosylkuqsk
```

Scoped access token works without `supabase link` (link needs a permission we don't have).

## 8. Testing & known debt

- **Vitest baseline (24 Nov 2026): 25/44 tests, 6/15 files pass.** Known failure classes: `localStorage` unavailable in the vitest env (needs `--localstorage-file` or jsdom wiring) and `next/headers` `cookies()` called outside `requestAsyncStorage` in server-component tests. Both `jest.config.js` and `vitest.config.ts` exist — consolidation is a backlog item.
- **Playwright e2e** exists (`npm run test:e2e`, `--ui`, `--headed`) but hasn't been exercised yet.
- **`tsc --noEmit`: 109 errors remain.** Top offenders: `lib/stores` (15), `lib/api` (14), `components/parent` (10), plus `__tests__` env issues. `next.config.js` sets `typescript.ignoreBuildErrors` + `eslint.ignoreDuringBuilds` — CI typecheck/lint/test/lighthouse jobs are `continue-on-error` informational gates; `build` is the only required gate. **Re-enabling those gates is a modernization work item — don't "fix" the config, fix the code or pick up the backlog item.**
- `npm audit` reports ~57 vulnerabilities — known, not triaged.
- Full debt list lives in `AGENTS.md` → "Known debt" and `docs/spec/` modernization docs.

## 9. Build & deploy

- `npm run build` → `next build` for `apps/web`. **This must pass** — it's the Netlify required gate. Empty HTML shells for most pages are expected (client-deopted via `missingSuspenseWithCSRBailout: false` in `next.config.js`; data loads in-browser).
- Netlify site `genuine-cheesecake-327d05.netlify.app` auto-deploys on push to `main`. `netlify.toml` builds from root, publishes `apps/web/.next`.
- **Do not remove the `[functions] included_files` block** in `netlify.toml` — it ships watchpack's transitive deps (`graceful-fs`, `glob-to-regexp`, `neo-async`) that Next's server handler needs at cold start. Removing it re-breaks the function with `Cannot find module` / 502s.
- Build needs repo secrets `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` (already configured).
- Post-deploy smoke check: `curl -I https://genuine-cheesecake-327d05.netlify.app` → 200.
- Preview deploys: every PR gets a Netlify preview (branch deploys enabled by default).

## 10. PWA / offline

`public/sw.js` is hand-rolled (no Workbox): versioned caches, network-first API, stale-while-revalidate pages, background-sync queue, canvas postMessage caching.

- **Do not add assets to `ASSETS_TO_CACHE` without verifying the file exists in `public/`** — a missing manifest/icon/offline.html once made `cache.addAll` reject and the SW never installed (fixed 24 Nov).
- Bump the SW cache version when precache contents change or clients won't pick up new assets.

## 11. Architecture pointers for common tasks

| Task | Where to look |
|---|---|
| Auth/session/roles | `apps/web/lib/supabase/`, `lib/auth/`, `middleware.ts`, `app/api/auth/` |
| Canvas drawing | `components/canvas/` (Konva), `components/AspectFrame.tsx`, `lib/art.ts` |
| Data fetching | `lib/api/`, `lib/hooks/`, `@tanstack/react-query` providers in root layout |
| Client state | `lib/stores/` (zustand-style stores — currently top tsc offender) |
| DB types | `apps/web/lib/database.types.ts` (generated) |
| Lessons/learning | `app/learn/`, `features/learn/`, `lib/learning/`, `app/api/lessons/` |
| Packs/content | `app/packs/`, `components/packs/`, `app/api/packs/` |
| i18n | `lib/i18n/`, `components/i18n/`, `npm run i18n:scaffold:fr` |
| Offline/PWA | `lib/sw/`, `components/pwa/`, `components/sync/`, `public/sw.js` |
| Parent dashboard | `app/parent/`, `components/parent/`, `app/api/children|family|learners/` |
| Admin | `app/admin/`, `app/api/admin/`, `components/admin/` |
| Analytics events | `lib/analytics/`, `docs/ANALYTICS.md` |
| Error tracking | `@sentry/nextjs` config in `next.config.js` + `instrumentation.ts` |

## 12. First-week checklist

1. `npm install` from root, `npm run dev`, open localhost:3000 — try drawing on `/canvas` as a guest.
2. Get `.env.local` files set up (§4); sign up a real account, then run `npm run seed:demo` for role accounts.
3. `npm run build` once to confirm the baseline is green.
4. `npm run test:unit` — note the 25/44 baseline so you can tell your changes didn't regress it.
5. Read `AGENTS.md` fully, then skim `docs/spec/LucidCraft_2_1_Expanded_Functional_Specification.md` for where the product is heading.
6. Pick a small, well-scoped issue. Good first tasks: fixing a vitest env failure, a `lib/stores` tsc error, or a docs gap.
7. Before opening a PR: `npm run build` must pass; don't add Netlify `included_files` removals or pnpm files.
