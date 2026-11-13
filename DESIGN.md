# Design direction

## Product world

Challenges is a cloud quarry: coding problems are cut into temporary architectural blocks, then moved through draft, active, planned, and done states. The interface uses the quarry as a working metaphor for reducing a hard problem to a visible next cut.

## Visual system

- Palette: quarry stone `#20282a`, mineral paper `#f2f0e8`, weathered sky `#d9e4e2`, safety orange `#c44f2d`, and survey yellow `#e3b84f`.
- Type: `Archivo Black` for cut marks and display headlines; `DM Mono` for coordinates, states, and field labels.
- Composition: an architectural quarry hero, block readout, ruled challenge faces, and a material intake form.
- Motion: only small block lift and focus transitions; reduced-motion mode removes nonessential movement.

## Interaction and boundary

Challenges can be searched, filtered, added, moved between states, and removed. Records persist in `localStorage` on the current browser. There is no ranking, contest feed, account, or remote challenge service.

## Responsive behavior

The quarry becomes a vertical cut on small screens. Challenge faces preserve their number, title, state, and action controls without horizontal scrolling.


---

## Storybook

Storybook 10 (`@storybook/nextjs-vite`) shows this design system with the app's real CSS, tokens and fonts.

```bash
npm run storybook        # http://localhost:6006
npm run build-storybook  # static build in storybook-static/ (CI: .github/workflows/storybook.yml)
```

- **Foundations/Tokens** reads every CSS custom property the app defines at runtime, so it never drifts from the code.
- **Design/DESIGN.md** renders this file.
- **Components/**, **Sections/** and **Pages/** show the UI with mock data only (no network, analytics off).
- Toolbar: locale, theme (light / dark, when the app has a dark theme), viewports 320 / 375 / 768 / 1440. The a11y panel runs axe (WCAG 2.2 AA).
- Rule: a new shared component or page section ships with a story in `stories/`.
