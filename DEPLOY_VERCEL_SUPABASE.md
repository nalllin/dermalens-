# Temporary Public Demo Deployment

This repo is set up to deploy DermaLens as a temporary public demo using:

- Vercel
- Supabase
- Mock AI by default if `OPENAI_API_KEY` is empty
- Mock email by default if `RESEND_API_KEY` is empty

## Why this path

Do not host the public demo with local demo persistence enabled.

Demo mode writes data to:

- [`lib/data/demo-store.ts`](/Users/nalinadityachaganti/AI Dermatologist/lib/data/demo-store.ts)
- [`lib/storage.ts`](/Users/nalinadityachaganti/AI Dermatologist/lib/storage.ts)

That is fine locally, but not reliable on Vercel. For public hosting, set:

```bash
NEXT_PUBLIC_DEMO_MODE=false
```

and provide the Supabase variables from [`.env.example`](/Users/nalinadityachaganti/AI Dermatologist/.env.example).

## Repo-side prep

```bash
npm install
npm run lint
npm run build
npm run secret:cron
```

Copy the generated secret into `CRON_SECRET`.

Before deploying, validate your env:

```bash
npm run check:hosted
```

## Supabase setup

1. Create a new Supabase project.
2. Run [`supabase/schema.sql`](/Users/nalinadityachaganti/AI Dermatologist/supabase/schema.sql).
3. Confirm the `case-images` storage bucket exists and is public.
4. In Auth settings:
   - Enable Email/Password auth
   - Disable email confirmation temporarily for the demo
   - Set Site URL to your Vercel URL
   - Add redirect URLs:
     - `http://localhost:3000/**`
     - `https://<your-project>.vercel.app/**`

## Vercel setup

1. Push the repo to GitHub.
2. Import the repo into Vercel.
3. Use default Next.js settings.
4. Set environment variables in Production and Preview:

```bash
NEXT_PUBLIC_APP_URL=https://<your-project>.vercel.app
NEXT_PUBLIC_DEMO_MODE=false

NEXT_PUBLIC_SUPABASE_URL=<supabase-url>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<supabase-publishable-key>
SUPABASE_SERVICE_ROLE_KEY=<supabase-service-role-key>
SUPABASE_STORAGE_BUCKET=case-images

OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini

RESEND_API_KEY=
REMINDER_FROM_EMAIL=DermaLens <reminders@example.com>

CRON_SECRET=<generated-secret>
```

`vercel.json` is already included and sets `X-Robots-Tag: noindex, nofollow` for the temporary demo.

## First deploy

1. Deploy from `main`.
2. Open the live URL.
3. If the final URL changed, update:
   - `NEXT_PUBLIC_APP_URL` in Vercel
   - Supabase Site URL
   - Supabase redirect URLs
4. Redeploy once.

## Smoke test

After deployment:

```bash
DERMALENS_URL=https://<your-project>.vercel.app CRON_SECRET=<generated-secret> npm run smoke:hosted
```

That checks:

- `/`
- `/sign-in`
- `/sign-up`
- cron unauthorized behavior
- cron authorized behavior

Then do the manual browser test:

1. Sign up
2. Upload first image
3. Confirm result card
4. Upload second image to same case
5. Confirm progress comparison
6. Toggle reminder settings and refresh

## Manual reminder demo

The reminder endpoint is:

- [`/api/cron/reminders`](/Users/nalinadityachaganti/AI Dermatologist/app/api/cron/reminders/route.ts)

Manual trigger:

```bash
curl -H "Authorization: Bearer <CRON_SECRET>" https://<your-project>.vercel.app/api/cron/reminders
```

If `RESEND_API_KEY` is not set, the route still works and uses mock email behavior.
