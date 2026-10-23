// The local challenge queue: records, filters, counts and the localStorage-backed store the page reads with
// useSyncExternalStore. There is no server, ranking or community feed.

export type ChallengeStatus = "Draft" | "Active" | "Done" | "Planned";
export type Challenge = { id: string; title: string; notes: string; status: ChallengeStatus; createdAt: number };
export type Draft = Pick<Challenge, "title" | "notes" | "status">;
export type Filter = ChallengeStatus | "All";

export const STATUSES: ChallengeStatus[] = ["Draft", "Active", "Done", "Planned"];
export const STORAGE_KEY = "challenges-v2";
export const EMPTY_DRAFT: Draft = { title: "", notes: "", status: "Draft" };

/** Two sample records shown until the visitor saves their own list. */
export const SEED: Challenge[] = [
  { id: "100-days", title: "100 Days of Code", notes: "Day 42 · build the habit before chasing the leaderboard.", status: "Active", createdAt: 1710000000000 },
  { id: "advent", title: "Advent of Code", notes: "Prep · return to the puzzles when the bench is clear.", status: "Planned", createdAt: 1709000000000 },
];

/** Challenges in `filter` ("All" for every state) whose title, notes or state contains `query`, ignoring case. */
export function filterChallenges(challenges: Challenge[], filter: Filter, query: string): Challenge[] {
  const needle = query.trim().toLowerCase();
  return challenges.filter(
    (challenge) =>
      (filter === "All" || challenge.status === filter) &&
      (!needle || `${challenge.title} ${challenge.notes} ${challenge.status}`.toLowerCase().includes(needle)),
  );
}

export function countChallenges(challenges: Challenge[]) {
  return {
    total: challenges.length,
    active: challenges.filter((item) => item.status === "Active").length,
    done: challenges.filter((item) => item.status === "Done").length,
  };
}

/** A new challenge from the form, or null when the title is blank. */
export function createChallenge(draft: Draft, id: string, now: number): Challenge | null {
  const title = draft.title.trim();
  if (!title) return null;
  return { id, title, notes: draft.notes.trim(), status: draft.status, createdAt: now };
}

export function setStatus(challenges: Challenge[], id: string, status: ChallengeStatus): Challenge[] {
  return challenges.map((item) => (item.id === id ? { ...item, status } : item));
}

export function removeChallenge(challenges: Challenge[], id: string): Challenge[] {
  return challenges.filter((item) => item.id !== id);
}

function isChallenge(value: unknown): value is Challenge {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    typeof record.title === "string" &&
    typeof record.notes === "string" &&
    STATUSES.includes(record.status as ChallengeStatus) &&
    typeof record.createdAt === "number" && Number.isFinite(record.createdAt)
  );
}

/**
 * The saved list (malformed records dropped); the sample list when nothing is saved or the saved value is not a
 * readable list.
 */
export function parseChallenges(raw: string | null): Challenge[] {
  if (!raw) return SEED;
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isChallenge) : SEED;
  } catch {
    return SEED;
  }
}

type Listener = () => void;

/** A tiny external store over one localStorage key. Falls back to memory when storage is unavailable. */
export function createChallengeStore(getStorage: () => Storage | null, key = STORAGE_KEY) {
  const listeners = new Set<Listener>();
  let memoryRaw: string | null = null;
  let useMemory = false;
  let cachedRaw: string | null | undefined;
  let cached: Challenge[] = SEED;

  const readRaw = (): string | null => {
    if (useMemory) return memoryRaw;
    try {
      return getStorage()?.getItem(key) ?? null;
    } catch {
      return null;
    }
  };

  const getSnapshot = (): Challenge[] => {
    const raw = readRaw();
    if (raw !== cachedRaw) {
      cachedRaw = raw;
      cached = parseChallenges(raw);
    }
    return cached;
  };

  return {
    getSnapshot,
    getServerSnapshot: (): Challenge[] => SEED,
    subscribe(listener: Listener) {
      listeners.add(listener);
      const onStorage = (event: StorageEvent) => {
        if (event.key === key || event.key === null) listener();
      };
      if (typeof window !== "undefined") window.addEventListener("storage", onStorage);
      return () => {
        listeners.delete(listener);
        if (typeof window !== "undefined") window.removeEventListener("storage", onStorage);
      };
    },
    set(next: Challenge[] | ((current: Challenge[]) => Challenge[])) {
      const value = typeof next === "function" ? next(getSnapshot()) : next;
      const raw = JSON.stringify(value);
      try {
        const storage = getStorage();
        if (!storage) throw new Error("no storage");
        storage.setItem(key, raw);
      } catch {
        useMemory = true;
        memoryRaw = raw;
      }
      listeners.forEach((listener) => listener());
    },
  };
}

export const challengeStore = createChallengeStore(() => (typeof window === "undefined" ? null : window.localStorage));
