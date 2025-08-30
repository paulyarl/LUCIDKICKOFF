# Test/Demo Accounts Setup

This document explains how to create and use demo accounts (admin, parent, child) for local testing.

## 1) Seed users with Supabase Service Role (server-side only)

Use the provided script: `scripts/seed-demo-users.js`.

Required environment variables (do NOT prefix with NEXT_PUBLIC):
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DEMO_ADMIN_EMAIL`, `DEMO_ADMIN_PASSWORD`
- `DEMO_PARENT_EMAIL`, `DEMO_PARENT_PASSWORD`
- `DEMO_CHILD_EMAIL`, `DEMO_CHILD_PASSWORD`

Example usage:
```bash
SUPABASE_URL=... \
SUPABASE_SERVICE_ROLE_KEY=... \
DEMO_ADMIN_EMAIL=admin@example.com DEMO_ADMIN_PASSWORD=changeme \
DEMO_PARENT_EMAIL=parent@example.com DEMO_PARENT_PASSWORD=changeme \
DEMO_CHILD_EMAIL=child@example.com DEMO_CHILD_PASSWORD=changeme \
node scripts/seed-demo-users.js
```

Notes:
- The script calls Supabase Admin API and sets `user_metadata.role` to `admin` | `parent` | `child`.
- It is idempotent; existing users are skipped.
- Never expose the service role key to the browser.

## 2) Optional: Dev-only impersonation page

A dev-only page is available at `/dev/impersonate` (Next.js `app/` router).
- It reads optional public env vars to prefill inputs:
  - `NEXT_PUBLIC_DEMO_ADMIN_EMAIL`, `NEXT_PUBLIC_DEMO_ADMIN_PASSWORD`
  - `NEXT_PUBLIC_DEMO_PARENT_EMAIL`, `NEXT_PUBLIC_DEMO_PARENT_PASSWORD`
  - `NEXT_PUBLIC_DEMO_CHILD_EMAIL`, `NEXT_PUBLIC_DEMO_CHILD_PASSWORD`
- Only available in `NODE_ENV=development`. In production it renders a disabled message.

## 3) Environment variables

- Put server-only secrets (service role + demo passwords for seeding) in your local shell or `.env.local` at the repo root (never commit).
- Put optional public demo variables (for pre-filling the dev page) in `apps/web/.env.local`.

## 4) Roles and authorization

- The seeding script sets `user_metadata.role` on each user. Ensure your app checks role from `user_metadata` or a profile table.
- If you use RLS policies, confirm they account for these roles.

## 5) Troubleshooting

- If login fails on the dev page, verify the user exists in Supabase Auth and the password is correct.
- Confirm `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set for the web app.
- For seeding errors, ensure `SUPABASE_SERVICE_ROLE_KEY` is valid and has admin access.
