# Vocamdy

## About

Vocamdy is a personal vocabulary app for learning the Academic Word List. It works on phone and desktop and installs as a PWA.

It is built for consistency: short, scheduled sessions lower the friction that leads to procrastination and skipped study days.

A typical day starts with a review block, then moves through new-word batches, a quiz, and a short mini session. The learning model gives each word four touches: the first encounter, followed by reviews at 1, 3, and 7 days.

Built with Next.js, TypeScript, Tailwind, Supabase, and Vitest.

## Run locally

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Add the Supabase URL and publishable key, plus `SITE_URL`, to `.env.local`:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
   SITE_URL=
   ```

   `SITE_URL` is the server-side public origin used for Google OAuth redirects. Leave it empty in development to use `http://localhost:3000`; production requires a valid absolute URL.

3. Start the app:

   ```bash
   pnpm dev
   ```

The deck content is imported automatically before development and production builds.

## Commands

- `pnpm dev` — start the development server
- `pnpm lint` — run ESLint
- `pnpm test` — run the unit tests
- `pnpm build` — create a production build
- `pnpm start` — serve the production build
