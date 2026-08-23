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
