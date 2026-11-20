# Challenges — Product truth

> Inferred from the code and copy (no user interview). Checked against the portfolio card claims review
> (`portfolio-site-web/docs/audits/CARD-CLAIMS-REVIEW-2026-10.md`, row `challenges`) on 2026-10-23.

## What it is

A client-only demo of a personal coding-challenge queue stored in the visitor's browser.

## Who it is for

A portfolio visitor who wants to see a small list UI with search, state filters and a create form.

## What works today

1. Two sample records (100 Days of Code, Advent of Code) until the visitor saves their own list.
2. Add a challenge (title required, notes optional, start state), change a record's state or remove it.
3. Search title, notes or state (case-insensitive) and filter by All / Draft / Active / Done / Planned; counts for
   total, active and done.
4. The list is saved in localStorage (`challenges-v2`); malformed saved data is ignored instead of breaking the page,
   and changes in another tab show up through the `storage` event.
5. `/api/mcp` answers JSON-RPC `initialize` and `tools/list` (no tools: the server has no list) and rejects tool calls.
6. Front-end and server errors go to Sentry (errors only, personal data stripped) when `NEXT_PUBLIC_SENTRY_DSN` is set.

## What does not work (and must not be claimed)

- No categorised problem catalogue, difficulty levels, solution submission with live preview, or community voting
  (claims removed from the portfolio card in the 2026-10 review). No ranking or competition feed.
- No account, server storage or sync. No product analytics.

## Known limits

- Frozen 2026-11-20: later review findings are recorded here, not fixed.
- Undo after another tab removed the next challenge: Undo puts a challenge back before the one that followed it when
  it was removed; if another tab has removed that one too, it goes to the end of the list (A, B, C: remove A here, B
  there, Undo gives C, A). Multi-tab only (Codex report -07412d0f06).
- Undo puts back the challenge as this tab showed it when Remove was pressed: if another tab changed it (e.g. its
  state to Done) and this tab had not yet received the storage event, Undo restores the older copy and that change is
  lost. Multi-tab only (Codex report -11699e8d1b).

## Live URL and deploy state

- Live: https://challenges.bookchaowalit.com (HTTP 200 on 2026-10-23).
- The Vercel project `bookchaowalit-challenges-frontend` is deployed only by CLI (last production 2026-10-23 04:45 UTC,
  the CVE patch build of commit 9077a0c) and its Git link names the old repository
  (`bookchaowalit/bookchaowalit-challenges-frontend`), so a push to `main` does not deploy. The live site lags `main`
  (no Sentry, old template MCP route, unvalidated storage) until the owner reconnects Vercel Git to this repository
  (owner action D9). `NEXT_PUBLIC_SENTRY_DSN` is already set on the Vercel project (Sentry project
  `community-challenges-web`, org `personal-yu0`).

## Boundaries

- Browser-only apart from the stateless `/api/mcp` route.
