# AGENTS.md — LUCIDKICKOFF (LucidCraft)

Kids' creative-canvas app. Next.js 14 App Router + Supabase, npm-workspaces monorepo, deployed on Netlify.

## Package manager

**Use npm, not pnpm.** The committed lockfile is `package-lock.json`; the `overrides` block in root `package.json` pins React 18.3.1 (Next 14 does not support React 19). Do not run `pnpm up` / `pnpm import` — a mass upgrade was tried and reverted (breaks the overrides contract and Next/React compat).

## Setup

```bash
npm install            # workspace install from repo root
npm run dev            # serves apps/web on localhost:3000
npm run build          # delegates to apps/web (next build)
```

**Install-script gate:** npm 11 blocks postinstall scripts by default. Approved packages live in `package.json → allowScripts` (supabase, esbuild, @tailwindcss/oxide, unrs-resolver, sharp, canvas, @sentry/cli). If you add a native dep, approve via `npm install-scripts approve <pkg>`. `core-js` is intentionally unapproved (funding banner only).

**Env:** `apps/web/.env.local` needs `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` (publishable `sb_publishable_...` key). Root `.env.local` holds `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` for `scripts/seed-demo-users.js`. Both gitignored — get values from the Supabase dashboard (project `gehshupbmmrosylkuqsk`, us-east-1).

## Database

Supabase project `gehshupbmmrosylkuqsk` (us-east-1, Pro). All 27 migrations in `supabase/migrations` apply cleanly via:

```bash
npx supabase db push --db-url "postgresql://postgres.<ref>:<pw>@aws-1-us-east-1.pooler.supabase.com:5432/postgres"
```

`scripts/db-probe.cjs` (run `node scripts/db-probe.cjs` with `DB_URL` env) checks `schema_migrations` + key table presence via the pooler — no psql required.

**Migration quirks (already fixed):** ordering was repaired by renaming `add_rls_and_security` → `20240827224000`; several files used `create policy if not exists` / `add constraint if not exists` (invalid syntax, stripped); pgTAP tests live in `supabase/tests/`, not migrations (pgTAP isn't available on Supabase).

## Netlify

Site `genuine-cheesecake-327d05.netlify.app` (id `e50bd109-fa46-4fce-9042-85e3abb2440e`), auto-deploys on push to `main`. `netlify.toml` builds from root and publishes `apps/web/.next`.

**`[functions] included_files` ships watchpack's deps** (`graceful-fs`, `glob-to-regexp`, `neo-async`) — Next's server handler requires watchpack at cold start and Netlify's bundler drops its transitive deps in the monorepo layout. Removing that block re-breaks the function (`Cannot find module`, 502s). Real fix (trace root cause) is deferred to the modernization spec.

## PWA / offline shell

`public/sw.js` is hand-rolled (no Workbox): versioned caches, network-first API, stale-while-revalidate pages, background-sync queue, canvas postMessage caching. Precache was broken until 24 Nov (missing manifest/icons/offline.html → `cache.addAll` rejected → SW never installed); now repaired — **do not add assets to `ASSETS_TO_CACHE` without verifying they exist in `public/`**.

`missingSuspenseWithCSRBailout: false` in `next.config.js` keeps `useSearchParams` pages CSR-deopting (warnings) instead of failing the build — required since Next 14.2.

## Test baseline (24 Nov 2026)

`npm run test:unit` (vitest): **25/44 tests, 6/15 files pass**. Known failure classes: `localStorage` unavailable in the vitest environment (needs `--localstorage-file` or jsdom wiring) and `cookies()` outside `requestAsyncStorage` in server-component unit tests (needs Next context mocking). `npm run test:e2e` (playwright) not yet exercised. Both `jest.config.js` and `vitest.config.ts` exist — consolidation is a modernization item.

## Known debt (modernization backlog — do NOT fix in baseline)

- `database.types.ts` regenerated 24 Nov against live schema; **109 `tsc --noEmit` errors remain** (top: `lib/stores` 15, `lib/api` 14, `components/parent` 10, plus `__tests__` env issues). Re-enabling `typescript.ignoreBuildErrors` is a modernization work item.
- 3 edge functions (`generate-otp`, `link-child`, `export-artwork`) **deployed** 24 Nov to `gehshupbmmrosylkuqsk` via `supabase functions deploy --project-ref` (scoped access token works without `supabase link`; `link` needs `api_gateway_keys_read` permission)
- CI slimmed 24 Nov: `typecheck`/`lint`/`test`/`lighthouse` run as `continue-on-error` informational gates (they report real debt without blocking); `build` is the required gate; `vercel-preview`/`posthog-schema`/`notify` jobs removed (obsolete). Build needs `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` repo secrets. Flip `continue-on-error` back when the gates are re-tightened.
- `next.config.js` sets `eslint.ignoreDuringBuilds` + `typescript.ignoreBuildErrors` (missing `eslint-plugin-prettier`; stale types). Re-enable both gates.
- `@/components`, `@/lib`, `@/styles` resolve to `apps/web` first, then root shared dirs — mid-migration fallback aliasing, finish the move
- `npm audit` reports ~57 vulns
- Old project `wsooeqdrsjdyepxjcdw` is restored but unreachable (edge DNS never republished) — its user data is stranded, not lost

## Verification

- `npm run build` must pass (46 pages + middleware)
- `curl https://genuine-cheesecake-327d05.netlify.app` → 200 after any deploy
- Most pages are client-deopted; empty HTML shells are expected — data loads in-browser
