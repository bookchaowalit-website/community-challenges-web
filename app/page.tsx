"use client";

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { AppFoot, AppTop, ListButton, PlusIcon, type Tone } from "@/components/app-shell";
import { EMPTY_DRAFT, STATUSES, challengeStore, createChallenge, filterChallenges, addedIso, formatAdded, restoreChallenge, setStatus, type Challenge, type ChallengeStatus, type Draft, type Filter } from "@/lib/challenges";

// beforeId: the challenge that followed it when it was removed. nextShown / prevShown: the rows shown around it, for focus.
type RemovedEntry = { challenge: Challenge; beforeId: string | null; nextShown?: string; prevShown?: string };
type RemovedBatch = { entries: RemovedEntry[]; viaKeyboard: boolean };
const removedLabel = (entries: RemovedEntry[]) => (entries.length === 1 ? `Removed “${entries[0].challenge.title}”` : `Removed ${entries.length} challenges`);

const TONE: Record<ChallengeStatus, Tone> = { Draft: "grey", Planned: "amber", Active: "green", Done: "grey" };
const FILTERS: Filter[] = ["All", ...STATUSES];

// randomUUID only exists in secure contexts (HTTPS/localhost) and newer browsers.
function createId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `challenge-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

// One line of the notes per row (App shell rule); a longer one gets Show more, so the full text can still be read.
function RowDetail({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const id = useId();
  const [expanded, setExpanded] = useState(false);
  const [clipped, setClipped] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => { if (el.dataset.expanded !== "true") setClipped(el.scrollWidth > el.clientWidth); };
    const observer = typeof ResizeObserver === "function" ? new ResizeObserver(measure) : null;
    observer?.observe(el);
    measure();
    // A web font that loads later can widen the text without resizing the box, so measure again then.
    let live = true;
    const fonts = typeof document !== "undefined" ? document.fonts : undefined;
    const remeasure = () => { if (live) measure(); };
    fonts?.ready?.then(remeasure, () => {});
    fonts?.addEventListener?.("loadingdone", remeasure);
    return () => {
      live = false;
      observer?.disconnect();
      fonts?.removeEventListener?.("loadingdone", remeasure);
    };
  }, [text]);
  const long = expanded || clipped || text.includes("\n");
  return (
    <>
      <p ref={ref} id={id} className="as-row-detail" data-expanded={expanded ? "true" : undefined}>{text}</p>
      {long ? (
        <button type="button" className="as-plain as-row-more" aria-expanded={expanded} aria-controls={id} onClick={() => setExpanded(!expanded)}>
          {expanded ? "Show less" : "Show more"}
        </button>
      ) : null}
    </>
  );
}

export default function Home() {
  const challenges = useSyncExternalStore(challengeStore.subscribe, challengeStore.getSnapshot, challengeStore.getServerSnapshot);
  const setChallenges = challengeStore.set;
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("All");
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  // Every removal still inside the Undo window: one Undo puts them all back where they were.
  const [removed, setRemovedState] = useState<RemovedBatch | null>(null);
  // The latest batch, so two removals before a re-render still both land in it.
  const removedRef = useRef<RemovedBatch | null>(null);
  const setRemoved = (batch: RemovedBatch | null) => { removedRef.current = batch; setRemovedState(batch); };
  const [toastFocused, setToastFocused] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const titleRef = useRef<HTMLInputElement>(null);
  const newRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const undoRef = useRef<HTMLButtonElement>(null);
  const toastRef = useRef<HTMLDivElement>(null);
  const wasComposing = useRef(false);
  const focusNext = useRef<string[] | null>(null);
  const visible = useMemo(() => filterChallenges(challenges, filter, query), [challenges, filter, query]);
  const countOf = (value: Filter) => (value === "All" ? challenges.length : challenges.filter((item) => item.status === value).length);

  // Opening the composer focuses the title; closing it returns focus to New challenge.
  useEffect(() => {
    if (composing) titleRef.current?.focus();
    else if (wasComposing.current) newRef.current?.focus();
    wasComposing.current = composing;
  }, [composing]);
  useEffect(() => { if (removed?.viaKeyboard) undoRef.current?.focus(); }, [removed]);
  // After the toast closes, focus goes to the nearest row still shown, else New challenge.
  useEffect(() => {
    const ids = focusNext.current;
    if (removed || !ids) return;
    focusNext.current = null;
    const rows = [...document.querySelectorAll<HTMLElement>(".as-row[data-challenge]")];
    const row = ids.map((id) => rows.find((r) => r.dataset.challenge === id)).find(Boolean);
    (row?.querySelector<HTMLButtonElement>(".as-danger") ?? newRef.current ?? titleRef.current)?.focus();
  }, [removed, challenges]);
  // Reserve the toast's height at the bottom so a control focused behind it scrolls clear.
  const toastShown = removed !== null;
  useLayoutEffect(() => {
    const toast = toastRef.current;
    if (!toastShown || !toast) return;
    const rootStyle = document.documentElement.style;
    const reserve = () => rootStyle.setProperty("--as-toast-space", `${toast.offsetHeight + 32}px`);
    reserve();
    const observer = typeof ResizeObserver === "function" ? new ResizeObserver(reserve) : null;
    observer?.observe(toast);
    return () => { observer?.disconnect(); rootStyle.removeProperty("--as-toast-space"); };
  }, [toastShown]);
  // The toast closes 6 s after the latest removal (each removal restarts it), but never while it holds focus.
  useEffect(() => {
    if (!removed || toastFocused) return;
    const timer = window.setTimeout(() => { removedRef.current = null; setRemovedState(null); }, 6000);
    return () => window.clearTimeout(timer);
  }, [removed, toastFocused]);

  function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const challenge = createChallenge(draft, createId(), Date.now());
    if (!challenge) return;
    setChallenges((items) => [challenge, ...items]);
    if (filter !== "All" && filter !== challenge.status) setFilter(challenge.status);
    setQuery("");
    setAnnouncement(`Added “${challenge.title}”.`);
    setDraft(EMPTY_DRAFT);
    setComposing(false);
  }
  function changeStatus(challenge: Challenge, status: ChallengeStatus) {
    setChallenges((items) => setStatus(items, challenge.id, status));
    setAnnouncement(`“${challenge.title}” is now ${status}.`);
  }
  function clearSearch() {
    setQuery("");
    searchRef.current?.focus();
  }
  function remove(challenge: Challenge, viaKeyboard: boolean) {
    const index = challenges.findIndex((item) => item.id === challenge.id);
    if (index < 0) return;
    const shownAt = visible.findIndex((item) => item.id === challenge.id);
    setChallenges((items) => items.filter((item) => item.id !== challenge.id));
    const entry: RemovedEntry = { challenge, beforeId: challenges[index + 1]?.id ?? null, nextShown: visible[shownAt + 1]?.id, prevShown: shownAt > 0 ? visible[shownAt - 1].id : undefined };
    const entries = [...(removedRef.current?.entries ?? []), entry];
    setRemoved({ entries, viaKeyboard });
    setAnnouncement(entries.length === 1 ? `Removed “${challenge.title}”. Undo is available for a few seconds.` : `Removed ${entries.length} challenges. Undo is available for a few seconds.`);
  }
  function closeToast(ids?: string[]) {
    const last = removedRef.current?.entries.at(-1);
    // Dismissed: the row after the removed one, else the one before it.
    focusNext.current = ids ?? [last?.nextShown, last?.prevShown].filter((id): id is string => Boolean(id));
    setRemoved(null);
    setToastFocused(false);
  }
  function undo() {
    const entries = removedRef.current?.entries;
    if (!entries?.length) return;
    // Latest removal first: each goes back before the challenge that followed it when it was removed.
    setChallenges((current) => entries.reduceRight((list, { challenge, beforeId }) => restoreChallenge(list, challenge, beforeId), current));
    const latest = entries[entries.length - 1].challenge;
    setAnnouncement(entries.length === 1 ? `Restored “${latest.title}”.` : `Restored ${entries.length} challenges.`);
    // Undone: back to the restored row the user removed last.
    closeToast([latest.id]);
  }

  const title = filter === "All" ? "All challenges" : filter;

  return (
    <div className="as">
      <a className="as-skip" href="#main">Skip to content</a>
      <AppTop name="Challenges" tagline="Coding problems worth returning to" />

      <div className="as-body">
        <aside className="as-side" aria-label="Lists">
          <h2>By state</h2>
          <ul className="as-lists">
            {FILTERS.map((value) => (
              <ListButton key={value} label={value === "All" ? "All challenges" : value} count={countOf(value)} tone={value === "All" ? undefined : TONE[value]} current={filter === value} onSelect={() => setFilter(value)} />
            ))}
          </ul>
        </aside>

        <main id="main" className="as-main">
          <div className="as-head">
            <div>
              <h1>{title}</h1>
              <p aria-live="polite">{visible.length} {visible.length === 1 ? "challenge" : "challenges"}{query.trim() ? ` matching “${query.trim()}”` : ""}</p>
            </div>
            <div className="as-tools">
              <label className="as-search">
                <span className="as-sr">Search challenges</span>
                <input ref={searchRef} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search" />
              </label>
              {composing ? null : <button ref={newRef} type="button" className="as-button" onClick={() => setComposing(true)}><PlusIcon />New challenge</button>}
            </div>
          </div>

          {composing ? (
            <form className="as-composer" onSubmit={add} aria-label="New challenge">
              <label className="as-field">Challenge
                <input ref={titleRef} value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="A problem worth solving" autoComplete="off" required />
              </label>
              <label className="as-field">Notes
                <textarea value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} placeholder="What is the useful edge?" rows={3} />
              </label>
              <div className="as-composer-foot">
                <div className="as-segmented-wrap">
                  <span id="state-label">Start as</span>
                  <div className="as-segmented" role="group" aria-labelledby="state-label">
                    {STATUSES.map((status) => (
                      <button key={status} type="button" aria-pressed={draft.status === status} onClick={() => setDraft({ ...draft, status })}>{status}</button>
                    ))}
                  </div>
                </div>
                <div className="as-composer-actions">
                  <button type="button" className="as-plain" onClick={() => { setComposing(false); setDraft(EMPTY_DRAFT); }}>Cancel</button>
                  <button type="submit" className="as-button" disabled={!draft.title.trim()}>Add</button>
                </div>
              </div>
            </form>
          ) : null}

          {visible.length ? (
            <ul className="as-list" aria-label={title}>
              {visible.map((challenge) => (
                <li className="as-row" key={challenge.id} data-challenge={challenge.id}>
                  <div>
                    <h3>{challenge.title}</h3>
                    <RowDetail text={challenge.notes || "No notes yet."} />
                    <p className="as-row-meta">{addedIso(challenge.createdAt) ? <>Added <time dateTime={addedIso(challenge.createdAt)!}>{formatAdded(challenge.createdAt)}</time></> : "Added date unknown"}</p>
                  </div>
                  <label className="cq-state">
                    <span className="as-sr">State of {challenge.title}</span>
                    <select value={challenge.status} data-tone={TONE[challenge.status]} onChange={(event) => changeStatus(challenge, event.target.value as ChallengeStatus)}>
                      {STATUSES.map((status) => <option key={status}>{status}</option>)}
                    </select>
                  </label>
                  <button type="button" className="as-plain as-danger" aria-label={`Remove ${challenge.title}`} onClick={(event) => remove(challenge, event.detail === 0)}>Remove</button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="as-list as-empty">
              {query.trim() ? (
                <>
                  <strong>Nothing matches</strong>
                  No challenge in {filter === "All" ? "your list" : title} mentions “{query.trim()}”.
                  <div className="as-actions-row cq-center"><button type="button" className="as-plain" onClick={clearSearch}>Clear search</button></div>
                </>
              ) : challenges.length === 0 ? (
                <><strong>No challenges yet</strong>Press New challenge to name the next problem worth solving.</>
              ) : (
                <><strong>Nothing is {title} yet</strong>Change a challenge&apos;s state, or press New challenge and start it as {title}.</>
              )}
            </div>
          )}

          <p className="as-note">Saved in this browser only. No account, no ranking, no competition feed.</p>
        </main>
      </div>

      <p className="as-sr" role="status" aria-live="polite">{announcement}</p>
      {removed ? (
        <div
          ref={toastRef}
          className="as-toast"
          role="group"
          aria-label="Undo remove"
          onFocus={() => setToastFocused(true)}
          onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setToastFocused(false); }}
          onKeyDown={(event) => { if (event.key === "Escape") closeToast(); }}
        >
          <span>{removedLabel(removed.entries)}</span>
          <button ref={undoRef} type="button" className="as-plain" onClick={undo} aria-label={removed.entries.length === 1 ? "Undo remove" : `Undo remove of ${removed.entries.length} challenges`}>Undo</button>
        </div>
      ) : null}

      <AppFoot source="https://github.com/bookchaowalit-website/community-challenges-web" />
    </div>
  );
}
