# Design

Since 2026-11-19 the challenge queue uses the shared **App shell** (see `APP-SHELL.md`; `app/app-shell.css` and `components/app-shell.tsx` are copied byte for byte
from the reference site). It replaced the earlier one-off look, whose small uppercase labels, unloaded or
render-blocking fonts and low-contrast text failed the design floor (review 2026-11-11).

- Sidebar of states (All / Draft / Active / Done / Planned with counts; a pill row on phones), head with
  h1, count, search and **New challenge**, the composer in place (title, notes, Start as).
- Rows: title, one line of notes, date added, a state picker that reads like a status pill (text + tint,
  a real 44px select) and Remove. Removing is undoable for a few seconds; no confirm dialog.
- Plain words only: "challenges" and their state, no quarry or cut metaphors.
- Empty states differ for no challenges, an empty state list and a search with no match (Clear search).
- Site additions (the row state picker) sit at the end of `app/globals.css`.

Floor: Geist via `next/font` (variable on `<html>`), text ≥ 12px, controls ≥ 44px, 4.5:1 text contrast in
light and dark, 3px focus ring, forced-colors support, no horizontal scroll at 320px. `/more-projects`
redirects (308) to https://bookchaowalit.com/ and the footer links there.
