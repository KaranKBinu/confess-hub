# Confess-Hub

An anonymous community for funny confessions and everyday stories in English, Malayalam, and Hindi. Built with Next.js 14, React, Tailwind CSS, PostgreSQL, and Prisma.

## Requirements

- Node.js 20
- npm
- PostgreSQL 14+

## Local development

1. Install dependencies with `npm ci`.
2. Copy `.env.example` to `.env` and set `DATABASE_URL` to your PostgreSQL database. Keep `ANONYMOUS_COOKIE_NAME` and `NEXT_PUBLIC_ANONYMOUS_COOKIE_NAME` identical.
3. Generate a random value of at least 32 characters for `AUTH_SECRET`; never commit `.env` or use a `NEXT_PUBLIC_` prefix for it. Signups always receive the regular user role. After verifying an account holder's identity out of band, promote their existing account from a trusted local shell with `npm run admin:promote -- moderator@example.com`.
4. Configure `MODERATION_KEYWORDS` as a comma-separated list. Matching is case-insensitive and sends submissions to the moderator queue with a keyword flag. This local keyword filter is intentionally simple and is not a substitute for human review.
5. Apply the committed database migrations with `npm run db:deploy` (or create new local migrations with `npm run db:migrate -- --name <migration-name>`).
6. Start the development server with `npm run dev`.

Open `http://localhost:3000`. Run `npm run seed` for idempotent demo stories in a development database. New submissions remain pending until a moderator approves them at `/admin/moderate`. Login and signup create a signed, HTTP-only, seven-day session cookie. Comments and likes/dislikes require an account; stories can still be submitted anonymously. The feed's Top sort uses a recency-weighted net-vote score. Administrator access is never granted based only on an unverified signup email; promote verified operators explicitly.

## Scripts

- `npm run dev` — local development server
- `npm run lint` — Next.js ESLint checks
- `npx tsc --noEmit` — TypeScript check
- `npm run db:migrate` — create/apply a development migration
- `npm run db:deploy` — apply committed migrations
- `npm run build` — production build
- `npm run vercel-build` — apply migrations, then build for Vercel

## Vercel deployment

Add `DATABASE_URL`, `AUTH_SECRET`, `ANONYMOUS_COOKIE_NAME`, `NEXT_PUBLIC_ANONYMOUS_COOKIE_NAME`, and `MODERATION_KEYWORDS` to Vercel project settings. Configure both production and preview database URLs deliberately: the `vercel-build` script runs `prisma migrate deploy` for every deployment environment. Vercel invokes this script as its build script when present. For teams that require migration approval or deployment locking, run `npm run db:deploy` in a dedicated release job and set Vercel's Build Command to `npm run build` instead. Promote verified admin accounts through a trusted operator environment; never expose that database privilege in a public registration API.

The anonymous ID cookie is a random UUID, lasts one year, and is used to associate submissions and avoid duplicate reports. It does not expose a name or email address. See [the privacy policy](app/legal/privacy/page.tsx) for details.

## Moderation and extension points

All submissions enter `PENDING`; the configurable keyword blacklist marks matching content for review. Reports are deduplicated by post and anonymous ID, and return a published post to the pending queue. Moderator APIs require the server-side admin token. Post status, language, reports, and anonymous identifiers are represented independently in Prisma so future features can add moderation history, scheduled publishing, or media metadata without changing the public post contract.

The application intentionally does not accept uploads yet. If uploads are added, store files in a dedicated object-storage service, validate file type and size, and persist only the resulting storage key/URL in PostgreSQL.

## CI

GitHub Actions starts PostgreSQL, deploys the committed Prisma migrations, and runs lint, type, and production build checks on pushes and pull requests.
