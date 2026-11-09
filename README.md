# Vocamdy

Vocamdy is a personal vocabulary app for learning the Academic Word List with short daily review and new-word sessions. It works on phone and desktop and installs as a PWA.

## Run locally

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Add the Supabase URL and publishable key to `.env.local`:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
   ```

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

## Docs

Product requirements and implementation tasks live in `docs/`.
