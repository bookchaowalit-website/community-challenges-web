"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import { EMPTY_DRAFT, STATUSES, challengeStore, countChallenges, createChallenge, filterChallenges, removeChallenge, setStatus, type ChallengeStatus, type Draft, type Filter } from "@/lib/challenges";

export default function Home() {
  const challenges = useSyncExternalStore(challengeStore.subscribe, challengeStore.getSnapshot, challengeStore.getServerSnapshot);
  const setChallenges = challengeStore.set;
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("All");
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [notice, setNotice] = useState("The quarry is open.");
  const filtered = useMemo(() => filterChallenges(challenges, filter, query), [challenges, filter, query]);
  const counts = countChallenges(challenges);
  function updateStatus(id: string, status: ChallengeStatus) { setChallenges((items) => setStatus(items, id, status)); setNotice(`State marked ${status.toLowerCase()}.`); }
  function addChallenge(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const challenge = createChallenge(draft, crypto.randomUUID(), Date.now());
    if (!challenge) return;
    setChallenges((items) => [challenge, ...items]);
    setDraft(EMPTY_DRAFT); setNotice("New cut added to the quarry.");
  }
  return (
    <main className="cq-page">
      <nav className="cq-nav" aria-label="Primary"><Link href="/" className="cq-mark">BOOK / DEV</Link><span>FIELD NOTE 01 · CHALLENGES</span><span className="cq-nav-status"><i aria-hidden="true" /> LOCAL WORKSPACE</span></nav>
      <section className="cq-hero" aria-labelledby="page-title"><div><p className="cq-kicker">OPERATING BENCH / CUT 04</p><h1 id="page-title">Cut the hard problem into shape.</h1><p className="cq-dek">A local queue for coding problems worth returning to. Each challenge is a block on the bench: name it, leave a note, and move it through the cut.</p><p className="cq-proof"><span>01</span> The archive stays honest: browser-only records, no ranking system, no fake competition feed.</p></div><div className="cq-quarry" aria-hidden="true"><div className="cq-quarry-sky" /><div className="cq-quarry-block cq-quarry-block--one"><span>ACTIVE</span><b>{String(counts.active).padStart(2, "0")}</b></div><div className="cq-quarry-block cq-quarry-block--two"><span>DONE</span><b>{String(counts.done).padStart(2, "0")}</b></div><div className="cq-quarry-line" /><span className="cq-quarry-label">TEMPORARY ARCHITECTURE</span></div></section>
      <section className="cq-readout" aria-label="Challenge readout"><div><span>TOTAL BLOCKS</span><strong>{counts.total}</strong></div><div><span>ACTIVE CUTS</span><strong>{counts.active}</strong></div><div><span>FINISHED FACES</span><strong>{counts.done}</strong></div><p role="status">{notice}</p></section>
      <section className="cq-queue" aria-labelledby="queue-title"><div className="cq-section-head"><div><p className="cq-label">02 / THE BENCH</p><h2 id="queue-title">Challenge quarry</h2></div><p>{filtered.length} / {challenges.length} visible</p></div><div className="cq-tools"><label className="cq-search"><span>SEARCH THE CUT</span><input aria-label="Search challenges" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, note, state" /></label><div className="cq-filters" role="group" aria-label="Filter challenges by state">{["All", ...STATUSES].map((option) => <button type="button" key={option} className={filter === option ? "is-active" : ""} onClick={() => setFilter(option as Filter)} aria-pressed={filter === option}>{option}</button>)}</div></div>{filtered.length ? <ul className="cq-list">{filtered.map((challenge, index) => <li key={challenge.id}><article className={`cq-card cq-card--${challenge.status.toLowerCase()}`}><div className="cq-card-number">{String(index + 1).padStart(2, "0")}</div><div className="cq-card-copy"><p className="cq-card-meta">CUT / {challenge.status.toUpperCase()}</p><h3>{challenge.title}</h3><p>{challenge.notes || "No notes on this face yet."}</p><time dateTime={new Date(challenge.createdAt).toISOString()}>Added {new Date(challenge.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</time></div><div className="cq-card-actions"><label><span>STATE</span><select aria-label={`State for ${challenge.title}`} value={challenge.status} onChange={(event) => updateStatus(challenge.id, event.target.value as ChallengeStatus)}>{STATUSES.map((status) => <option key={status}>{status}</option>)}</select></label><button type="button" className="cq-delete" onClick={() => { setChallenges((items) => removeChallenge(items, challenge.id)); setNotice("Block removed from this browser."); }}>REMOVE</button></div></article></li>)}</ul> : <div className="cq-empty"><strong>No faces match this cut.</strong><span>Clear the filter or add a new challenge below.</span></div>}</section>
      <section className="cq-new" aria-labelledby="new-title"><div><p className="cq-label">03 / NEW MATERIAL</p><h2 id="new-title">Open a fresh cut.</h2><p>Name the question before the next interesting problem disappears into the noise.</p></div><form onSubmit={addChallenge}><label><span>CHALLENGE *</span><input aria-label="Challenge title" required value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="A problem worth solving" /></label><label><span>NOTES</span><textarea aria-label="Challenge notes" value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} placeholder="What is the useful edge?" /></label><label><span>START STATE</span><select aria-label="Challenge state" value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as ChallengeStatus })}>{STATUSES.map((status) => <option key={status}>{status}</option>)}</select></label><button type="submit" className="cq-submit">ADD TO BENCH <span aria-hidden="true">↗</span></button></form></section>
      <footer className="cq-footer"><strong>CHALLENGES / LOCAL QUARRY</strong><span>Bookchaowalit · browser storage only · {new Date().getFullYear()}</span></footer>
    </main>
  );
}
