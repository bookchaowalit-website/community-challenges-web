import type { Metadata } from "next";
import { Archivo_Black, DM_Mono } from "next/font/google";
import "./globals.css";

const display = Archivo_Black({ variable: "--font-display", subsets: ["latin"], weight: "400" });
const mono = DM_Mono({ variable: "--font-mono", subsets: ["latin"], weight: ["400", "500"] });

export const metadata: Metadata = { title: "Challenges — Bookchaowalit", description: "A local quarry for coding challenges worth returning to.", metadataBase: new URL("https://challenges.bookchaowalit.com"), openGraph: { title: "Challenges — Bookchaowalit", description: "A local quarry for coding challenges worth returning to.", type: "website" } };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body className={`${display.variable} ${mono.variable}`}>{/* THESIS: coding problems become quarry blocks, refusing the default task table. OWN-WORLD: stone, weathered sky, orange cuts, yellow survey marks, and architectural typography. STORY: name a problem, move it through the cut, and leave a useful face behind. FIRST VIEWPORT: a giant quarry block readout sits beside the oversized thesis; the queue follows below. FORM: assigned cloud quarry direction, candidate 4 of 7, seed 694f64f5. FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance */}{children}</body></html>; }
