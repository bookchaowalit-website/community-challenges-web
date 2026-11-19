import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import Home from "@/app/page";
import RootLayout, { metadata } from "@/app/layout";

vi.mock("next/font/google", () => ({ Geist: () => ({ variable: "font-geist" }) }));

describe("home page", () => {
  it("renders the sample challenges, the state lists and the browser-only notice on the App shell", () => {
    const html = renderToString(<Home />);
    expect(html).toContain("<h1>All challenges</h1>");
    expect(html).toContain("100 Days of Code");
    expect(html).toContain("Advent of Code");
    expect(html).toMatch(/All challenges<\/span><span class="as-count">2</);
    expect(html).toContain("2<!-- --> <!-- -->challenges");
    expect(html).toContain("no ranking, no competition feed");
    expect(html).toContain('href="https://bookchaowalit.com/"');
  });

  it("puts the font variable on <html> and the site's own domain in metadata", () => {
    const html = renderToString(<RootLayout><p>child</p></RootLayout>);
    expect(html).toContain('<html lang="en" class="font-geist"');
    expect(String(metadata.metadataBase)).toBe("https://challenges.bookchaowalit.com/");
  });
});
