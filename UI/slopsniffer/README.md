# SlopSniffer design candidates

Open `http://127.0.0.1:8766/UI/slopsniffer/` while serving the repository root. These are three compact popup directions and an interactive on-page sample, not a production extension or comment detector.

- Snout-o: pig snout replaces the o in Slop; compact white popup, lavender action.
- Pocket pig: standalone toolbar mark, lightly tinted header, peach action.
- Underline: mostly typography and underlines, little surface colour.

The user chose the five-colour palette: #F2DFD7 #FEF9FF #D4C1EC #9F9FED #736CED. Dark plum #292338, readable deep purple #554BAF, and supporting neutrals provide text contrast. The old Artificer theme is reduced to colour; there are no game panels or decorative telemetry.

Working local interactions: select a direction, compare reviews, open/close the explanation, Escape, dismiss a highlight, show a representative match, pause a sample popup, and open sample activity. Settings only acknowledge preview changes; they do not change the installed extension or run checks. Every count and review is illustrative. The current backend does not supply comment clusters or exact matching passages.

`snout.svg` is original vector artwork made for this concept. No image generator, character artwork, or game assets are used. Existing project branding and detector code are unchanged until a direction is selected for integration.
