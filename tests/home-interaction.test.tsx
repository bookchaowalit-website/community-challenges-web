// @vitest-environment happy-dom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Home from "@/app/page";
import { SEED, STORAGE_KEY, challengeStore } from "@/lib/challenges";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root;
let host: HTMLDivElement;
const $ = <T extends Element = HTMLElement>(selector: string) => host.querySelector(selector) as T | null;
const button = (text: string, scope: ParentNode = host) => [...scope.querySelectorAll("button")].find((b) => b.textContent?.trim().startsWith(text)) as HTMLButtonElement;
const rows = () => [...host.querySelectorAll(".as-row h3")].map((h) => h.textContent);
const press = (el: Element, detail = 0) => act(() => { el.dispatchEvent(new MouseEvent("click", { bubbles: true, detail })); });
function type(el: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  act(() => {
    Object.getOwnPropertyDescriptor(proto, "value")!.set!.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

beforeEach(() => {
  localStorage.clear();
  challengeStore.set(SEED);
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  act(() => root.render(<Home />));
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  vi.useRealTimers();
});

describe("composer", () => {
  it("opens focused, keeps Add disabled without a title, adds on top and returns focus", () => {
    press(button("New challenge"));
    expect(document.activeElement).toBe($(".as-composer input"));
    expect(button("Add", $(".as-composer")!).disabled).toBe(true);
    type($<HTMLInputElement>(".as-composer input")!, "Project Euler 1-50");
    type($<HTMLTextAreaElement>(".as-composer textarea")!, "math warm-ups");
    press(button("Active", $(".as-composer")!));
    press(button("Add", $(".as-composer")!));
    expect(rows()[0]).toBe("Project Euler 1-50");
    expect(document.activeElement?.textContent).toContain("New challenge");
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)[0]).toMatchObject({ title: "Project Euler 1-50", status: "Active" });
  });

  it("adding from another list switches to the new challenge's list; Cancel adds nothing", () => {
    press(button("Done", $(".as-side")!));
    expect(host.textContent).toContain("Nothing is Done yet");
    press(button("New challenge"));
    type($<HTMLInputElement>(".as-composer input")!, "Bare");
    press(button("Add", $(".as-composer")!));
    expect($("h1")!.textContent).toBe("Draft");
    expect(host.textContent).toContain("No notes yet.");
    press(button("New challenge"));
    type($<HTMLInputElement>(".as-composer input")!, "never");
    press(button("Cancel"));
    expect(rows()).not.toContain("never");
  });

  it("still adds without crypto.randomUUID", () => {
    vi.stubGlobal("crypto", {});
    try {
      press(button("New challenge"));
      type($<HTMLInputElement>(".as-composer input")!, "Plain HTTP");
      press(button("Add", $(".as-composer")!));
      expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)[0].id).toMatch(/^challenge-\d+-[a-z0-9]+$/);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

describe("state, search and empty states", () => {
  it("changes a challenge's state from its row", () => {
    const select = $<HTMLSelectElement>(".cq-state select")!;
    act(() => {
      select.value = "Done";
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)[0].status).toBe("Done");
    expect(host.textContent).toContain("is now Done");
  });

  it("search narrows the list and Clear search brings it back with focus in the field", () => {
    type($<HTMLInputElement>(".as-search input")!, "zzz");
    expect(host.textContent).toContain("Nothing matches");
    press(button("Clear search"));
    expect(document.activeElement).toBe($(".as-search input"));
    expect(rows()).toEqual(["100 Days of Code", "Advent of Code"]);
  });
});

describe("remove and undo", () => {
  it("removes with a toast; Undo puts it back in place and focuses its row", () => {
    press($('[aria-label="Remove 100 Days of Code"]')!);
    expect(rows()).toEqual(["Advent of Code"]);
    expect(document.activeElement).toBe(button("Undo"));
    press(button("Undo"));
    expect(rows()).toEqual(["100 Days of Code", "Advent of Code"]);
    expect(document.activeElement?.getAttribute("aria-label")).toBe("Remove 100 Days of Code");
  });

  it("Escape and the timer close the toast; an empty list says how to start", () => {
    press($('[aria-label="Remove 100 Days of Code"]')!);
    act(() => { $(".as-toast")!.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })); });
    expect(document.activeElement?.getAttribute("aria-label")).toBe("Remove Advent of Code");
    vi.useFakeTimers();
    press($('[aria-label="Remove Advent of Code"]')!, 1);
    act(() => { vi.advanceTimersByTime(6100); });
    expect($(".as-toast")).toBeNull();
    expect(host.textContent).toContain("No challenges yet");
  });
});
