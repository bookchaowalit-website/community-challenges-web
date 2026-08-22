"use client";

import {
  useSyncExternalStore,
  useState,
  useRef,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

type ChallengeStatus = "Draft" | "Active" | "Done" | "Planned";
type Item = {
  id: string;
  title: string;
  body: string;
  status: ChallengeStatus;
  createdAt: number;
};
type FieldKey = "title" | "body" | "status";
type Draft = Record<FieldKey, string>;

function Shell({
  title,
  subtitle,
  badge = "Book Dev · local workspace",
  children,
}: {
  title: string;
  subtitle: string;
  badge?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950 dark:bg-black dark:text-zinc-100">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
        <header className="mb-10 max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">{badge}</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">{title}</h1>
          <p className="mt-4 text-base leading-7 text-zinc-600 dark:text-zinc-400">{subtitle}</p>
        </header>
        <main aria-labelledby="page-title">{children}</main>
        <footer className="mt-12 border-t border-zinc-200 pt-4 text-xs leading-5 text-zinc-500 dark:border-zinc-800">
          Local-only demo · your queue stays in this browser.
        </footer>
      </div>
    </div>
  );
}

function Button({
  children,
  onClick,
  variant = "primary",
  disabled,
  type = "button",
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  disabled?: boolean;
  type?: "button" | "submit";
  className?: string;
}) {
  const base =
    "inline-flex min-h-11 items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-zinc-100 dark:focus-visible:ring-offset-zinc-950 " +
    className;
  const styles =
    variant === "primary"
      ? "bg-zinc-950 text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-300"
      : variant === "secondary"
        ? "bg-white text-zinc-950 ring-1 ring-zinc-200 hover:bg-zinc-100 dark:bg-zinc-950 dark:text-zinc-100 dark:ring-zinc-700 dark:hover:bg-zinc-900"
        : variant === "danger"
          ? "text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
          : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900";

  return (
    <button type={type} disabled={disabled} onClick={onClick} className={`${base} ${styles}`}>
      {children}
    </button>
  );
}

const inputClass =
  "min-h-11 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-950 outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-300 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-400 dark:focus:ring-zinc-700";

function readStorage<T>(key: string, initial: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw == null ? initial : (JSON.parse(raw) as T);
  } catch {
    return initial;
  }
}

function useLocalStorage<T>(key: string, initial: T): [T, Dispatch<SetStateAction<T>>] {
  const cache = useRef<{ raw: string | null | undefined; value: T }>({ raw: undefined, value: initial });
  const getSnapshot = () => {
    const raw = window.localStorage.getItem(key);
    if (raw === cache.current.raw) return cache.current.value;
    cache.current = { raw, value: readStorage(key, initial) };
    return cache.current.value;
  };
  const getServerSnapshot = () => initial;
  const subscribe = (onStoreChange: () => void) => {
    const eventName = `challenges-storage:${key}`;
    window.addEventListener("storage", onStoreChange);
    window.addEventListener(eventName, onStoreChange);
    return () => {
      window.removeEventListener("storage", onStoreChange);
      window.removeEventListener(eventName, onStoreChange);
    };
  };
  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const setValue: Dispatch<SetStateAction<T>> = (nextValue) => {
    const current = getSnapshot();
    const resolvedValue = typeof nextValue === "function"
      ? (nextValue as (previous: T) => T)(current)
      : nextValue;
    window.localStorage.setItem(key, JSON.stringify(resolvedValue));
    window.dispatchEvent(new Event(`challenges-storage:${key}`));
  };
  return [value, setValue];
}

function uid() {
  return crypto.randomUUID();
}

const SEED_ENTRIES: Array<Pick<Item, "title" | "body" | "status">> = [
  { title: "100 Days of Code", body: "Day 42", status: "Active" },
  { title: "Advent of Code", body: "Prep", status: "Planned" },
];

const SEED: Item[] = SEED_ENTRIES.map((entry, index) => ({
  ...entry,
  id: String(index + 1),
  createdAt: Date.now() - index * 86400000,
}));

const FIELDS: Array<{
  key: FieldKey;
  label: string;
  type: "text" | "textarea" | "select";
  options?: ChallengeStatus[];
}> = [
  { key: "title", label: "Challenge", type: "text" },
  { key: "body", label: "Notes", type: "textarea" },
  { key: "status", label: "Status", type: "select", options: ["Draft", "Active", "Done"] },
];

function emptyDraft(): Draft {
  return { title: "", body: "", status: "Draft" };
}

function statusStyle(status: ChallengeStatus) {
  if (status === "Done") return "bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950";
  if (status === "Active") return "bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100";
  return "bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400";
}

export default function Home() {
  const [items, setItems] = useLocalStorage<Item[]>("challenges-v1", SEED);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<Draft>(emptyDraft);

  const normalizedQuery = query.trim().toLowerCase();
  const filtered = items.filter((item) =>
    `${item.title} ${item.body} ${item.status}`.toLowerCase().includes(normalizedQuery),
  );
  const activeCount = items.filter((item) => item.status === "Active").length;
  const doneCount = items.filter((item) => item.status === "Done").length;

  const add = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = draft.title.trim();
    if (!title) return;
    setItems((previous) => [
      {
        id: uid(),
        title,
        body: draft.body.trim(),
        status: draft.status as ChallengeStatus,
        createdAt: Date.now(),
      },
      ...previous,
    ]);
    setDraft(emptyDraft());
  };

  return (
    <Shell title="Coding Challenges" subtitle="Keep a focused queue of problems to solve, revisit, and finish.">
      <div className="sr-only" id="page-title">Coding Challenges</div>

      <section aria-label="Challenge summary" className="mb-8 grid gap-px overflow-hidden rounded-xl border border-zinc-200 bg-zinc-200 sm:grid-cols-3 dark:border-zinc-800 dark:bg-zinc-800">
        {[
          ["Total", items.length],
          ["Active", activeCount],
          ["Done", doneCount],
        ].map(([label, value]) => (
          <div key={label} className="bg-white px-4 py-4 dark:bg-zinc-950">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">{label}</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
          </div>
        ))}
      </section>

      <section aria-labelledby="queue-heading">
        <div className="mb-4 flex flex-col gap-4 border-b border-zinc-200 pb-4 sm:flex-row sm:items-end sm:justify-between dark:border-zinc-800">
          <div>
            <h2 id="queue-heading" className="text-xl font-semibold tracking-tight">Your queue</h2>
            <p className="mt-1 text-sm text-zinc-500">{filtered.length} of {items.length} challenges shown</p>
          </div>
          <label className="w-full sm:max-w-xs">
            <span className="sr-only">Search challenges</span>
            <input
              className={inputClass}
              aria-label="Search challenges"
              placeholder="Search challenges"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center dark:border-zinc-700 dark:bg-zinc-950">
            <p className="font-medium">No challenges match that search.</p>
            <p className="mt-1 text-sm text-zinc-500">Try another keyword or add a new challenge below.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {filtered.map((item) => (
              <li key={item.id}>
                <article className="rounded-xl border border-zinc-200 bg-white p-5 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-600">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold tracking-tight">{item.title}</h3>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle(item.status)}`}>
                          {item.status}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                        {item.body || "No notes yet."}
                      </p>
                      <time className="mt-3 block text-xs text-zinc-500" dateTime={new Date(item.createdAt).toISOString()}>
                        Added {new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </time>
                    </div>
                    <Button
                      variant="ghost"
                      onClick={() => setItems((previous) => previous.filter((entry) => entry.id !== item.id))}
                    >
                      Delete
                    </Button>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="add-heading" className="mt-10 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mb-5">
          <h2 id="add-heading" className="text-xl font-semibold tracking-tight">Add a challenge</h2>
          <p className="mt-1 text-sm text-zinc-500">Capture the next problem before it gets lost.</p>
        </div>
        <form onSubmit={add} className="grid gap-4 md:grid-cols-2">
          {FIELDS.map((field) => (
            <label key={field.key} className={`block space-y-2 ${field.key === "body" ? "md:col-span-2" : ""}`}>
              <span className="text-sm font-semibold">{field.label}{field.key === "title" ? " *" : ""}</span>
              {field.type === "textarea" ? (
                <textarea
                  className={`${inputClass} min-h-24 resize-y`}
                  value={draft[field.key]}
                  onChange={(event) => setDraft((current) => ({ ...current, [field.key]: event.target.value }))}
                />
              ) : field.type === "select" ? (
                <select
                  className={inputClass}
                  value={draft[field.key]}
                  onChange={(event) => setDraft((current) => ({ ...current, [field.key]: event.target.value }))}
                >
                  {field.options?.map((option) => <option key={option}>{option}</option>)}
                </select>
              ) : (
                <input
                  className={inputClass}
                  required
                  value={draft[field.key]}
                  onChange={(event) => setDraft((current) => ({ ...current, [field.key]: event.target.value }))}
                />
              )}
            </label>
          ))}
          <div className="md:col-span-2">
            <Button type="submit">Add challenge</Button>
          </div>
        </form>
      </section>
    </Shell>
  );
}
