import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";

describe("home page", () => {
  it("renders the sample challenges, the counts and the browser-only notice", () => {
    const html = renderToString(<Home />);
    expect(html).toContain("Cut the hard problem into shape.");
    expect(html).toContain("100 Days of Code");
    expect(html).toContain("Advent of Code");
    expect(html).toContain("browser-only records, no ranking system, no fake competition feed");
    expect(html).toMatch(/2<!-- --> \/ <!-- -->2<!-- --> visible/);
    expect(html).toContain("browser storage only");
  });
});
