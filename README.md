# Challenges

A local queue of coding challenges: add a challenge with notes and a state (Draft, Active, Done, Planned), search it,
filter by state, change its state or remove it. The list is saved in this browser's localStorage only and starts
with two sample records.

Live: https://challenges.bookchaowalit.com (deployed by Vercel CLI; it can lag `main`, see `PRODUCT.md`).

## What it does not do

- No problem catalogue, difficulty levels, solution submission, live preview, ranking or community voting. No account,
  no sync between devices.

## Run

```bash
npm ci
npm run dev
```

## Checks

```bash
npm test           # Vitest: list logic and storage, MCP route, home page render, Sentry scrubbing
npm run lint
npm run typecheck
npm run build
```

CI (`.github/workflows/ci.yml`) runs the shared Node workflow (with a line-coverage gate) and the shared security
scan on every push and PR to `main`.

## Code map

- `lib/challenges.ts`: sample records, `filterChallenges`, `countChallenges`, `createChallenge`, `setStatus`,
  `removeChallenge`, `parseChallenges` (drops malformed saved records) and `challengeStore`, a small
  localStorage-backed store the page reads with `useSyncExternalStore` (falls back to memory when storage is blocked).
- `app/api/mcp/route.ts`: stateless JSON-RPC endpoint. The list exists only in the browser, so it lists no tools and
  rejects tool calls.
- `lib/sentry.ts` + `instrumentation*.ts`: error reporting to Sentry, errors only, personal data stripped; off when
  `NEXT_PUBLIC_SENTRY_DSN` is unset.
- `app/more-projects/page.tsx`: shared portfolio link page (copied per repository, not a package).
