import { describe, expect, it, vi } from "vitest";
import {
  EMPTY_DRAFT, SEED, STORAGE_KEY, countChallenges, createChallenge, createChallengeStore, filterChallenges, parseChallenges,
  removeChallenge, setStatus, type Challenge,
} from "@/lib/challenges";

const item = (id: string, status: Challenge["status"], title = id, notes = ""): Challenge => ({ id, title, notes, status, createdAt: 0 });

function fakeStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v), data } as unknown as Storage & { data: Map<string, string> };
}

describe("filterChallenges", () => {
  const list = [item("a", "Active", "Graph search", "BFS"), item("b", "Done", "Dynamic programming"), item("c", "Planned", "Advent", "graph puzzles")];

  it("returns everything for All and an empty query", () => {
    expect(filterChallenges(list, "All", "  ")).toEqual(list);
  });

  it("matches title, notes or state ignoring case, within the chosen state", () => {
    expect(filterChallenges(list, "All", "GRAPH").map((c) => c.id)).toEqual(["a", "c"]);
    expect(filterChallenges(list, "Planned", "graph").map((c) => c.id)).toEqual(["c"]);
    expect(filterChallenges(list, "All", "done").map((c) => c.id)).toEqual(["b"]);
    expect(filterChallenges(list, "Draft", "")).toEqual([]);
  });
});

describe("list changes", () => {
  it("counts total, active and done", () => {
    expect(countChallenges(SEED)).toEqual({ total: 2, active: 1, done: 0 });
  });

  it("creates a trimmed challenge and refuses a blank title", () => {
    expect(createChallenge({ title: "  Two sum ", notes: " warm-up ", status: "Active" }, "x", 9)).toEqual({ id: "x", title: "Two sum", notes: "warm-up", status: "Active", createdAt: 9 });
    expect(createChallenge({ ...EMPTY_DRAFT, title: "   " }, "x", 9)).toBeNull();
  });

  it("changes one state and removes one record without touching the rest", () => {
    const list = [item("a", "Draft"), item("b", "Draft")];
    expect(setStatus(list, "b", "Done").map((c) => c.status)).toEqual(["Draft", "Done"]);
    expect(removeChallenge(list, "a").map((c) => c.id)).toEqual(["b"]);
    expect(list.map((c) => c.status)).toEqual(["Draft", "Draft"]);
  });
});

describe("parseChallenges", () => {
  it("shows the sample list until something is saved, and keeps an emptied list empty", () => {
    expect(parseChallenges(null)).toBe(SEED);
    expect(parseChallenges("[]")).toEqual([]);
    expect(parseChallenges("{oops")).toBe(SEED);
  });

  it("ignores saved values that are not a list of challenges, so the page never breaks", () => {
    expect(parseChallenges('{"title":"x"}')).toBe(SEED);
    expect(parseChallenges("null")).toBe(SEED);
    const mixed = parseChallenges(JSON.stringify([item("a", "Active"), { id: "b", title: "No state", notes: "", createdAt: 0 }, { ...item("c", "Done"), status: "Won" }, null]));
    expect(mixed).toEqual([item("a", "Active")]);
    expect(() => filterChallenges(parseChallenges('"text"'), "All", "x")).not.toThrow();
  });
});

describe("createChallengeStore", () => {
  it("returns a stable snapshot and the sample list on the server", () => {
    const store = createChallengeStore(() => fakeStorage({ [STORAGE_KEY]: JSON.stringify([item("a", "Done")]) }));
    expect(store.getSnapshot()).toEqual([item("a", "Done")]);
    expect(store.getSnapshot()).toBe(store.getSnapshot());
    expect(store.getServerSnapshot()).toBe(SEED);
  });

  it("writes through, notifies subscribers and stops after unsubscribe", () => {
    const storage = fakeStorage();
    const store = createChallengeStore(() => storage);
    const listener = vi.fn();
    const off = store.subscribe(listener);
    store.set((current) => removeChallenge(current, "advent"));
    expect(JSON.parse(storage.data.get(STORAGE_KEY) ?? "[]").map((c: Challenge) => c.id)).toEqual(["100-days"]);
    expect(listener).toHaveBeenCalledTimes(1);
    off();
    store.set([]);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.getSnapshot()).toEqual([]);
  });

  it("keeps changes in memory when storage is blocked", () => {
    const store = createChallengeStore(() => { throw new Error("blocked"); });
    expect(store.getSnapshot()).toBe(SEED);
    store.set([item("z", "Draft")]);
    expect(store.getSnapshot()).toEqual([item("z", "Draft")]);
  });
});
