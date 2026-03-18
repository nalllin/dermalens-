# DermaLens

DermaLens is a clean MVP web app for AI-assisted dermatology analysis and weekly progress tracking. Users can upload a skin or scalp photo, complete a short intake, receive a concise result card, save the case, and compare future uploads against prior entries.

## Stack

- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- shadcn-style UI components
- Supabase for auth, DB, and storage when configured
- OpenAI for image + text analysis when configured
- Resend-compatible reminder email flow when configured
- Demo mode with local JSON persistence and mock AI fallback when keys are missing

## Pages

- `/` landing page
- `/sign-in`
- `/sign-up`
- `/dashboard`
- `/analysis/new`
- `/cases/[caseId]/results/[entryId]`
- `/cases/[caseId]/timeline`
- `/reminders`

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Copy env values:

```bash
cp .env.example .env.local
```

3. For demo mode, keep `NEXT_PUBLIC_DEMO_MODE=true` and leave external keys empty.

4. Optional: reset seeded demo data:

```bash
npm run seed:demo
```

5. Start the app:

```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000).

## Temporary public demo hosting

For a public demo on Vercel, do not rely on local demo persistence. Use Supabase-backed mode instead.

Quick path:

```bash
npm run secret:cron
npm run check:hosted
```

Then follow the full runbook in [`DEPLOY_VERCEL_SUPABASE.md`](/Users/nalinadityachaganti/AI Dermatologist/DEPLOY_VERCEL_SUPABASE.md).

Helpful commands:

```bash
DERMALENS_URL=https://<your-project>.vercel.app CRON_SECRET=<your-secret> npm run smoke:hosted
```

## Demo mode

When Supabase or OpenAI keys are not configured, the app still works end to end:

- Auth uses a demo cookie session
- Cases persist to `data/demo-db.json`
- Uploads save under `public/demo-uploads`
- AI responses are generated from deterministic mock logic
- Reminder sends are logged through the mock email path

This mode is intended for local development, not a reliable public deployment target.

## Supabase setup

1. Create a Supabase project.
2. Run [`supabase/schema.sql`](/Users/nalinadityachaganti/AI Dermatologist/supabase/schema.sql) in the SQL editor.
3. Create `.env.local` values for:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_STORAGE_BUCKET`
4. Ensure the `case-images` storage bucket is public or update the code to use signed URLs.

## OpenAI setup

Set:

- `OPENAI_API_KEY`
- `OPENAI_MODEL` (defaults to `gpt-4.1-mini`)

The app validates all AI outputs with Zod schemas in [`lib/ai/schemas.ts`](/Users/nalinadityachaganti/AI Dermatologist/lib/ai/schemas.ts).

## Reminder flow

- Case creation automatically attaches a weekly reminder
- Reminder settings are editable on `/reminders`
- The cron endpoint is [`/api/cron/reminders`](/Users/nalinadityachaganti/AI Dermatologist/app/api/cron/reminders/route.ts)
- Protect the endpoint with `CRON_SECRET` and call it on a 7-day schedule

Example local trigger:

```bash
curl -H "Authorization: Bearer YOUR_SECRET" http://localhost:3000/api/cron/reminders
```

## Seeded assets and data

- Demo dataset: [`data/demo-db.json`](/Users/nalinadityachaganti/AI Dermatologist/data/demo-db.json)
- Reset template: [`data/demo-template.json`](/Users/nalinadityachaganti/AI Dermatologist/data/demo-template.json)
- Demo images: [`public/demo-samples`](/Users/nalinadityachaganti/AI Dermatologist/public/demo-samples)

## Notes

- The result screen is intentionally short and card-based.
- Weekly comparison is a first-class flow, not an add-on.
- Live integrations degrade cleanly to demo mode without blocking local development.
