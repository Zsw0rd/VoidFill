# Living Atlas design QA

final result: passed

Reviewed 5 November 2026 against the user's selected option 2. No actionable P0/P1/P2 findings remain in the tested views.

## Visual evidence and comparison conditions

- Source visual truth: `C:/Users/Alok/.codex/generated_images/01a1964c-e99d-75a0-8c24-da660d577322/exec-f9f02b10-0148-44a9-85fa-4387403c079d.png` (1487 × 1058).
- Implementation: `http://localhost:3000/roadmap`, Chrome, actual disposable Frontend Developer workspace; Web Fundamentals selected and expanded, three visible resources, remaining resources available in a sheet.
- Evidence directory: `C:/Users/Alok/.codex/visualizations/2026/11/01/01a1964c-e99d-75a0-8c24-da660d577322/`.
- Latest desktop screenshot: `atlas-desktop-final.png` (1487 × 1048). Observed CSS client viewport: 1487 × 1058; the capture excludes 10 pixels at the bottom. Compared at native pixel width without stretching. The bottom action dock and all map controls are visible.
- Full-view combined input: `atlas-comparison-final.jpg`; both source and implementation were opened together. Focused combined inputs: `atlas-comparison-type.jpg` and `atlas-comparison-dock.jpg` (native, separately labelled crops, no distortion).
- Responsive evidence: `atlas-tablet.png` at CSS 836 × 931; `atlas-mobile-dock.png` at CSS 390 × 845; `atlas-mobile-resources.png` at CSS 404 × 845 while the modal removes the page scrollbar. CSS scroll width equals client width in the tested tablet and phone states.
- Expanded canvas evidence: `atlas-expanded.png`. Browser viewport overrides were reset after testing.

The mock contains illustrative scores and short sample lessons. Production uses the real curriculum and assessment records: Git scored 40% in the disposable browser test, Web and DSA are unassessed, and resources total 4/4/3. These values were not changed to imitate the mock. Compare composition and controls, not those sample numbers or lesson names. The demo notice adds 31 pixels; the established application sidebar is retained. The dock stays inside the workspace instead of covering navigation. The mobile adaptation has no separate source mock.

## Findings and resolved iterations

1. **P2 — typography was too condensed and secondary controls too small.** The first valid desktop comparison used Instrument Serif for node labels and smaller dock text. Switched skill and goal names to Georgia, enlarged dock text and legend, and increased the minimap. The focused type and dock comparisons show readable wrapping, consistent serif hierarchy and visible actions after the fix. The page headline retains the established Instrument Serif brand font; Manrope remains the UI font.
2. **P2 — browser fullscreen was unreliable during testing.** Replaced it with a portalled expanded canvas, independent of browser fullscreen permission and scaling. It refits after resizing, contains keyboard focus, exits with Escape and closes before assessments open. `atlas-expanded.png` and the tested assessment transition confirm the fix.
3. **P2 — mobile controls needed larger targets.** Map controls now measure 40 × 44 CSS pixels with spacing; sheet actions and dock actions have a minimum height of 44 pixels. The minimap hides on the narrowest breakpoint to preserve control spacing. Updated mobile screenshots show accessible actions without page overflow.
4. **P1 — resources failed to reload after successful generation.** The temporary query adapter replaced numeric sort order zero with an empty string, causing mixed-type sorting errors. Preserve zero. Python regression tests and the HTTP learner test now cover ordered course queries. The atlas correctly renders all 11 generated resources.

Earlier `atlas-desktop-first.png` and `atlas-desktop-qa1/qa2.png` captures were rejected: full-page capture altered the effective viewport and clipped controls. They are not acceptance evidence. Viewport-only captures with observed dimensions replaced them.

## Required fidelity surfaces

- **Fonts/typography:** Georgia skill and goal labels retain the reference's readable editorial serif character; Instrument Serif headline and Manrope UI integrate with the existing app. Real long titles clamp to two lines on map cards, retain full accessible labels/tooltips, and wrap fully in the resource sheet.
- **Spacing/layout:** goal-centered radial branches, independent resource cards, overview and fit/zoom tools, and contextual bottom actions preserve the selected concept. Dynamic bounds include expanded resources and the “View all” control. Tablet reflows the dock; phone starts at a readable selected branch with an explicit skill selector and full resource sheet. Offscreen graph content can be explored; it does not create page overflow.
- **Colors/tokens:** warm ivory, forest green, sage, and rust match the reference direction. State has text and icon cues in addition to color. No progress arc is drawn for an unassessed skill; the rust outline in keyboard captures is the visible focus indicator.
- **Image quality:** `public/assets/learning-atlas-ground.webp` is an 18.6 KB generated terrain asset in the reference's cream/sage art direction. It stays subtle behind labels. Existing brand assets are retained, and standard Lucide icons match the app. SVG lines, rings and minimap show actual graph/progress data rather than substituting for illustration assets.
- **Copy/content:** measured score, resource completion and recommendation are distinguished. Opening a resource never marks it complete. Completion still requires the server-graded 65% threshold. Empty, loading and retry states use explicit next actions. Ornamental compass letters were omitted because the map has no geographic meaning.

## Browser and functional verification

- Generated resources; switched skills; selected course cards; expanded/collapsed branches; opened the full resource sheet; opened the real external source in a new tab.
- Zoomed, fitted and panned using the keyboard; tested expanded map, Escape exit and assessment entry from that mode. Pointer/touch handlers are implemented; physical-device pinch/drag was not separately tested.
- Switched Map/List, reloaded and verified the preference persisted.
- Completed a ten-question skill assessment: grading returned 40%, review appeared and the measured map ring updated. Opened a twelve-question course assessment from the mobile sheet. Cancelled during loading and confirmed no late dialog reappeared.
- A clean page reload after hot edits produced no new console warnings or errors. Earlier Fast Refresh dependency-array messages occurred while editing hook signatures; they did not recur on clean load. The Next smooth-scroll notice was addressed in the root HTML element.
- TypeScript and lint passed. All 31 Node tests and 37 Python tests passed. The HTTP learner integration passed all nine pages, PDF ingestion, profile apply, recommendations, course completion, daily/practice grading, replay, isolation, deletion and lease expiry. Production build passed; a hook cleanup lint warning was subsequently corrected and lint rerun cleanly.

## Follow-up polish and limits

- P3: ornamental compass details and the mock's scalloped badge are simplified into functional graph controls and a rounded goal hub. The generated terrain is intentionally quieter behind real, longer lesson names.
- No claim of exhaustive accessibility or physical-device testing. Keyboard paths, labels, visible focus, responsive geometry and reduced-motion support were checked within the available desktop Chrome environment.

## Implementation checklist

- [x] Selected design implemented with real data and generated terrain asset.
- [x] Full and focused visual comparisons reviewed after fixes.
- [x] Desktop, tablet, mobile and expanded views checked.
- [x] Core learning and assessment interactions checked.
- [x] Blocking findings resolved; test suites pass.
