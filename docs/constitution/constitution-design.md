# Tania Design Constitution

**Version**: 4.0.0 | **Ratified**: 2026-09-25 | **Last Amended**: 2026-10-07
**Source of record (two layers, one canon)**:
1. **`DESIGN-legion.md`** (Legion Design System analysis) — the source of every visual **value**: the 11-step color ramps (25–900 per hue), the warm off-black ink `#212121`, and the single-family Nunito Sans type system.
2. **The `tania-design-system` package ("TANIA Pulse, Legion-aligned")** — the executable **adaptation**: the Pulse structure (`.tp-*` component classes, radius scale, soft shadow, dark theme, icon set, app shell, reference pages) carrying Legion values. Its `tokens/tokens.css`, `tokens/components.css`, `tokens/tailwind.preset.js`, `icons/`, `reference/*.html`, `ADAPTATION.md` (the value-mapping record), and `AGENTS.md`/`CLAUDE.md` rules are all part of this canon.
**Supersedes**: design constitution 3.0.0 (Pulse Indigo values) per owner instruction of 2026-10-07.
**Scope**: all Tania user-interface work — dashboards, forms, data tables, admin panels.

## Preamble

Tania's interface is built on **TANIA Pulse (Legion-aligned)**: the product's shipped Pulse structure — component classes, 10/14/20/28px + pill radius, one soft card shadow, a full dark theme, the outline icon set, and the 268px app shell — with every color and the typography re-based onto **Legion Design System** values. Legion is not replaced by Pulse; the package is a layer that executes Legion values inside Pulse structure. The package's own `ADAPTATION.md` records the 1:1 mapping from each `--tp-*` variable to its Legion ramp step and is the audit trail for this ratification.

The workflow remains **fully agentic** (Principle X): the constitution, the Legion analysis, and the shipped package are upstream; agents read them and write code directly. Where this document quotes a value, the shipped files are authoritative; where a future edit to the shipped files and this document disagree, this constitution wins and the conflict is flagged to the design/dev sync forum as an amendment proposal.

## Core Principles

### I. tokens.css is the canon — every value is a Legion ramp step

`tokens/tokens.css` (`--tp-*` variables) is the single source of truth for color, radius, shadow, motion, and font stacks. Components **MUST NOT introduce new hex values**: consume `var(--tp-*)` (or the Tailwind preset mirror, Principle X). Component-specific values (px sizes, weights) MAY be concrete in place. Canonical values are changed only in `tokens.css` — never inline in components.

- **Every shipped color maps to a documented Legion ramp step** (recorded in the package `ADAPTATION.md`). Brand core: Violet `#875bf7` = primary-500 (`--tp-primary`), Violet deep `#7839ee` = primary-600 (`--tp-primary-deep`), Lilac `#c3b5fd` = primary-300 (`--tp-lilac`), dark card `#491c96` = primary-900 (`--tp-nav`). Ink `#212121` = Legion base-black (`--tp-midnight`/`--tp-text`) — warm off-black, never pure black.
- **Semantic colors**: Mint `#12b76a` = success-500 (`--tp-mint`) with text-safe ink `#027a48` = success-700 (`--tp-mint-ink`); Peach `#f97066` = error-400 with ink `#b32318` = error-700; Sun `#fec84b` = warning-300 with ink `#b54708` = warning-700; violet ink `#6927da` = primary-700 (`--tp-ink-violet`).
- **Surfaces**: page bg Mist `#f2f4f7` = tertiary-100, surface `#FFFFFF`, line `#d0d5dd` = tertiary-300 (Legion's hairline border), muted/neutral `#667085` = tertiary-500.
- **A new color is never invented**: pick the step from the Legion ramps in `DESIGN-legion.md`, add it to `tokens.css` with its ramp label, mirror it in the Tailwind preset.
- **Radius** (Pulse character, ratified): `--tp-r-sm` 10px (tabs, small buttons) · `--tp-r-md` 14px (groups) · `--tp-r-lg` 20px (cards) · `--tp-r-xl` 28px (large panels) · `--tp-r-pill` 999px (buttons, inputs, chips). Never `50%`. The 999px pill is the practical equivalent of Legion's `rounded.full` 900px token and is ratified as such.
- **Motion**: `--tp-ease` cubic-bezier(.2,.8,.2,1), `--tp-dur` 200ms.

### II. One primary action, one dark card — Legion Purple as the sole voltage

- **One primary (Legion Purple, `--tp-primary` = primary-500) button per area** — the single strongest action. All other buttons default to the outline `.tp-btn`. Primary hover **and** press use `--tp-primary-deep` (primary-600), mirroring Legion's 500→600 hover ladder.
- **One dark violet card (`--tp-nav` = primary-900) per screen** — reserved for emphasis (e.g. development-action panel, active menu item). Not a general-purpose surface.
- **No interactive color proliferation**: interactive voltage is Legion Purple only — it appears wherever an element is interactive (primary fill, active nav, checked controls). Semantics are carried by the tint+ink pairs (IX) and Mint.

### III. One family, binary weights — Nunito Sans

**Nunito Sans** is the only font family (Legion's single-face rule); the Pulse Sora + Inter pairing is retired. Hierarchy comes from weight, not typeface switching:

| Role | Weight | Size / line-height |
|---|---|---|
| Page title | Bold 700 | clamp(30px, 5vw, 40px) / 1.1 |
| Section title | Bold 700 | 22px / 1.25 |
| Card title | Bold 700 | 17px / 1.3 |
| Big number (KPI) | Bold 700 | 36px / 1 |
| Body | Regular 400 | 16px / 1.6 |
| Label & metadata | Regular 400 | 13–14px / 1.5 |
| Action text (buttons, chips, tabs, nav items, form labels, table headers) | Semibold 600 | 14px / 1 |

- **Weight binary**: headings and big numbers are always Bold 700; body/caption defaults to Regular 400; Semibold 600 is reserved for action text and emphasis leads (`.tp-empty strong`). No weight 800 anywhere.
- **No letter-spacing tricks, no uppercase** — tracking is 0 everywhere (the Pulse negative-tracking quirks were removed in the adaptation). **Sentence case everywhere**; title-case is a defect.
- Text on light surfaces is ink `#212121`; secondary/muted text uses `--tp-muted` (tertiary-500). White text is legal only on Violet or primary-900 (IX).
- Action naming is consistent across the flow ("Simpan perubahan" → confirmation "Perubahan disimpan").

### IV. Elevation: Legion flatness plus one ratified soft shadow; no gradients — ever

- Default depth is **Legion-flat**: hairline `--tp-line` (`#d0d5dd`) borders, soft tint backgrounds, and color-state changes. Hovering doesn't lift — it deepens (next ramp step, e.g. primary-500 → primary-600 on the primary button).
- **Ratified Pulse exception**: cards carry the single soft shadow `--tp-shadow` (`0 1px 2px rgba(16,24,40,.06), 0 6px 20px rgba(16,24,40,.06)` — a Legion tertiary-900-based shadow), as shipped on `.tp-card`. This explicitly supersedes Legion's "no drop-shadow tokens" doctrine as a ratified Pulse character trait. No other shadows anywhere; a second shadow requires an amendment. The active-tab ring (`0 0 0 1px var(--tp-line)`) is a border device, not a shadow.
- **No gradients in the interface.** Layered/moodboard gradient effects are translated into flat tiered shapes (single hue at stepped opacities). Profile headers are plain Mist; progress uses `--tp-neutral`.

### V. Shipped component classes define the state model

`tokens/components.css` (`.tp-*`) is the reference implementation. Interactive components MUST preserve these behaviors:

- **Button** (`.tp-btn`): Nunito Sans 600 14px, min-height 40px, padding 0 18px, pill, 1.5px ink (`--tp-text`) border, transparent bg; **hover** = bg `--tp-bg`. **Primary** (`.tp-btn--primary`): Violet fill, white text; **hover/press** = `--tp-primary-deep`. Inline-flex, 8px icon gap.
- **Input** (`.tp-input`): min-height 44px, padding 0 16px, 1px `--tp-line`, pill, surface bg, 400 14px.
- **Chip** (`.tp-chip`): 12.5px weight 600, padding 4px 12px, pill; color = tint bg + matching ink text (peach/mint/sun/violet pairs).
- **Tabs** (`.tp-tabs`/`.tp-tab`): container = `--tp-bg` bg, 1px line border, r-md, 4px padding/gap, horizontally scrollable; tab = 600 14px, r-sm, muted text; **active** (`aria-selected="true"`) = surface bg, ink text, `0 0 0 1px` line ring.
- **Nav item** (`.tp-nav-item`): 12px radius (component-specific concrete value), gap 12px, padding 10px 14px, weight 600; hover = `--tp-bg`; **current** (`aria-current="page"`) = primary-900 bg, white text, with in-context accent overrides `--tp-primary: #c3b5fd` (primary-300) and `--tp-mint-ink: #6ce9a6` (success-300) — implemented by the shipped overrides; do not hardcode them.
- **AI insight** (`.tp-ai`): 1.5px `--tp-neutral` border, r-lg, violet-tint bg — AI content appears **only on user request**, never auto-injected.
- **Empty state** (`.tp-empty`): muted 14px with bold ink lead line. Empty values are written **"—" with the reason stated** (what is missing, who can fill it). Read-only modes are labeled **"Hanya baca"** with no edit affordances.
- **Card** (`.tp-card`): surface bg, 1px line border, r-lg 20px, 20px padding, `--tp-shadow`.

Accessibility floor (VI) applies to all of the above. For **new interactive components the shipped classes do not cover**, apply Legion's state-matrix discipline — four treatments (solid / soft / outline / transparent) × default / hover / press / disabled — taking values from ramp steps: hover = one step deeper (500→600), press = 600→700, disabled = muted label (tertiary-400) on tertiary-100/tint bg. Mark derived specs "non-canonical (general reference)" until promoted (Known Gaps).

### VI. Accessibility floor

- Contrast: body text ≥ **4.5:1**, icons and UI elements ≥ **3:1**. Shipped anchors (Legion values): ink on Mist 14.6:1; white on Violet primary-500 **4.3:1**; white on primary-900 ≈11:1; muted on Mist ≈4.5:1 (on white 5.0:1); mint-ink on white 5.4:1; ink-violet on violet tint ≈6.1:1.
- **Known shortfall with a ratified mitigation**: white on primary-500 is 4.3:1 — below the 4.5:1 floor for small text. This is a characteristic of Legion's own ramp, ratified with the values. Where strict AA is required (small text, dense labels), use `--tp-primary-deep` (primary-600, ≈5.8:1) as the fill; large text and UI elements may keep primary-500.
- **Keyboard focus is always visible**: `outline: 2px solid var(--tp-mint-ink); outline-offset: 2px` (success-700 in light, success-300 in dark) on interactive elements. Removing the outline is a defect.
- **Honor `prefers-reduced-motion`**: the shipped global kill (`transition/animation: none`) must survive refactors. The **only** autonomous animation in the product is the signal ripple in the profile header (5s ease-in-out loop).
- Semantic state is expressed through ARIA (`aria-selected`, `aria-current`), not styling alone; standalone icons get a `title`.

### VII. Icons: the Pulse outline set on Legion accents

- **17 named glyphs** shipped in `icons/` (sprite `tania-icons.svg` and React `TaniaIcon`): beranda, dashboard, profil, chapter, timesheet, workload, feasibility, budget, assignment, idp, evaluasi, profil-cv, master-data, jejak-audit, ask-tania, sinyal, notifikasi. The sprite and React component are the authoritative inventory.
- Style: **outline 2px, round caps/joins, 24px grid** (20px for dense menus), main strokes in `currentColor`, **exactly one colored detail per icon** — Violet (`--tania-primary` = primary-500) for actions/markers, Mint (success-700 ink; success-300 in dark) for data/info.
- On active primary-900 menu items the detail auto-switches (Lilac primary-300 / light Mint success-300) via the shipped `--tp-*` overrides — do not hardcode it.
- Consumed via `<use href="#tania-*">` or `<TaniaIcon name size title>`. **Never introduce icons in another style**; new glyphs extend the sprite with the same recipe.

### VIII. Layout: 268px app shell, ≤860px collapse

Derived from the shipped reference pages (contoh-profil-talent, contoh-idp-evaluasi) — re-verified unchanged in the Legion-aligned package:

- **App shell**: sticky sidebar **268px** (surface bg, 1px right border, padding 22px 16px, vertical gap 22px, nav gap 4px) + fluid main. Topbar: padding 16px 28px, 1px bottom border, surface bg.
- **Collapse breakpoint: ≤860px** — sidebar becomes a static horizontal strip (padding 14px 16px, bottom border, nav row horizontally scrollable); topbar tightens to 12px 16px; main padding 16px. This is the shipped ladder; other breakpoints follow general reference.
- **Content widths**: main max-width 1160px (padding 24px 28px); standard content 860–900px; narrow/forms/search 560px.
- **Grids**: card grids use `auto-fit` + `minmax(150–300px, 1fr)`; wide tables scroll horizontally (min-width ≈560–620px) inside an overflow wrapper instead of compressing.
- Density evidence (bindings, not a scale): card padding 20px, topbar 16/28, AI block 16/18. No formal spacing scale is defined — do not invent one; reuse shipped paddings, and any new spacing value sits on Legion's 4px grid.

### IX. Color semantics and usage discipline

- **Proportion ≈ 60 / 30 / 10**: ~60% Mist + white surfaces, ~30% ink/Violet/primary-900, ~10% accents (mint, peach, sun).
- **White text only on Violet (primary-500/600) or primary-900.** On mint, sun, or peach fills use ink text. **Lilac and raw Mint are never text colors** — text-safe variants are the ink tokens (`--tp-ink-*`).
- **Status mapping** (chips and accents): Violet = in-progress/grouping · Mint = done/positive info · Peach = needs attention · Sun = achievement/celebration. Neutral (`--tp-neutral` = tertiary-500) = progress meters, AI-block borders, empty values.
- **RBAC**: Admin, Operation, Chapter, Talent — display adapts per role, **brand colors are identical** for all roles.
- **Logos**: Telkom Indonesia logo and TANIA wordmark come from official assets, never recreated as text.

### X. Full-agentic design-to-code: constitution + adapted package are the canon

Tania's FE workflow is **fully agentic** — no human transcribes designs into code, and **no Figma→token sync pipeline is built**.

- **Constitution, Legion analysis, and package are upstream.** Agents read this constitution and the `tania-design-system` package and write code directly; `ADAPTATION.md` documents the value mapping; the reference pages (`brand-guideline`, `developer-reference`, `contoh-*`) are visual verification references.
- **The package lives in the codebase**: as `design/` in a Tania repo, or its own repo registered as a Multica project resource. `AGENTS.md`/`CLAUDE.md` inside it carry the mandatory short rules and are part of this canon.
- **Tailwind mirror**: `tokens/tailwind.preset.js` maps the same values (colors, Nunito Sans display/sans, borderRadius sm–xl, boxShadow card). When `tokens.css` changes, the preset changes in the same commit — they are one canon in two syntaxes, not two sources.
- **Change flow**: a design change lands as (1) a `tokens.css` edit (+ `components.css` if structural, + the Tailwind mirror), then (2) agent propagation to components — with a constitution amendment when a principle (not just a value) changes.
- **Revisit trigger** (unchanged): build automated design→code token sync only if a separate design source (e.g. Figma) is again actively maintained AND human developers write FE code in parallel with agents.

## Additional Constraints

- **Dark theme ships and is ratified.** `tokens.css` carries a full dark token set activated via `prefers-color-scheme` (opt-out with `data-theme="light"`) or explicit `data-theme="dark"` — and every dark value is also a Legion ramp step: bg tertiary-900 `#101828`, surface tertiary-800 `#1d2939`, line tertiary-700 `#344054`, nav primary-800 `#5720b7`, text tertiary-25 `#fcfcfd`, muted tertiary-400 `#98a2b3`, tints at the 900-steps (`#7a271a`/`#054f31`/`#792e0d`/`#491c96`), inks at the 300-steps, shadow tightened to `0 1px 2px rgba(0,0,0,.4)`. Because tokens are variables, components get dark mode for free **only if they never hardcode light values** (Principle I). (First superseded the 2026-09-30 "light mode only" decision in v3.0.0; re-confirmed here with Legion-derived values.)
- **Data-viz patterns** (from brand guideline): heatmaps = single Violet at stepped opacities; gauges = half-circle, `--tp-line` track + Violet arc with dasharray; KPI numbers = Nunito Sans 700 36px. No multi-hue charts.
- **Illustration**: flat geometric blocks (squares, triangles, quarter circles, tiered circles) on Mist, single-hue tiered opacity instead of gradients, no faces — used for empty states and module headers. Current set is a sketch; production polish by an illustrator is pending.
- **Functional density over editorial air** (Legion's enterprise doctrine, carried): tight consistent paddings, tables and forms built for internal B2B tooling.
- **Official logos** (package rule 8): Telkom Indonesia logo and TANIA wordmark from original assets, never text stand-ins.

## Known Gaps

The package does not define; until it does, derive by analogy from shipped values + general industry reference, mark **"non-canonical (general reference)"** in the spec, and promote recurring choices by amendment:

1. **Disabled/pressed/loading states** beyond primary press (`--tp-primary-deep`) — e.g. disabled button/input recipes (V sketches the derivation: tertiary-400 labels on tertiary-100/tint bg).
2. **Overlay & feedback components**: modal, dropdown/select, tooltip, toast/snackbar, pagination.
3. **Form controls**: checkbox, radio, switch, textarea, validation/error borders (no error/success border tokens exist).
4. **Table component spec** — reference pages show usage, not a tokenized component.
5. **Formal spacing scale and z-index system** — reuse shipped paddings on the 4px grid; no invented scale.
6. **Icon coverage** beyond the 17 glyphs (same recipe extends the set).

Resolved by this amendment: the value-source question is closed by construction — every shipped color is a Legion ramp step (`ADAPTATION.md` mapping), so the historical Information-500 discrepancy has no counterpart in the canon (no Information ramp ships; info semantics ride Mint/Violet per IX). The 2026-09-30 decisions are folded in or superseded as noted in the log.

## Governance

- All UI specs and plans MUST cite shipped values from the package and, for values outside the shipped set, ramp steps from `DESIGN-legion.md`; review checks against the canon rule (I), single-action/dark-card rule (II), type roles (III), elevation rule (IV), state model (V), accessibility floor (VI), icon rules (VII), layout (VIII), color discipline (IX), and the agentic workflow (X).
- Changes to this constitution require: (a) evidence from the shipped package, the Legion analysis, or an explicit owner decision, (b) a version bump, (c) an entry in the amendment log.
- Conflicts between a future edit to the shipped files and this document: **the constitution wins**; record an amendment proposal and escalate unresolvable conflicts to the design/dev sync forum, not to local invention.

## Amendment Log

| Version | Date | Change |
|---|---|---|
| 4.0.0 | 2026-10-07 | Owner instruction: re-ground the canon on **`DESIGN-legion.md` (values) + the re-based package "TANIA Pulse, Legion-aligned" (structure)**. Every `--tp-*` color re-based onto Legion ramps: Legion Purple `#875bf7`/primary-600 `#7839ee`/primary-900 `#491c96`, ink `#212121`, success/error/warning ramps (I, II, IX); Nunito Sans binary weights (700/400/600) replace Sora + Inter; weight 800 and negative tracking retired (III); Legion-flat depth restored with the card soft shadow and pill radius ratified as Pulse character exceptions (IV); component state model re-valued, Legion state-matrix discipline retained as the derivation rule for new components (V); contrast shortfall on primary-500 documented with the primary-600 mitigation (VI); icon accents re-based on Legion tokens (VII); layout shell re-verified unchanged (VIII); dark theme values re-based on Legion ramps and ratified (Additional Constraints). Pulse Indigo values (#6246EA, Sora/Inter, #101A47) retired with their source. |
| 3.0.0 | 2026-10-06 | Source of record replaced per requester handoff (`tania-design-system.zip`): TANIA Pulse Indigo canon — tokens.css as executable source of truth with no-new-hex rule (I); Violet #6246EA single interactive voltage, one primary button / one dark card per screen (II); Sora + Inter type roles replace Nunito Sans binary (III); border + soft shadow elevation, gradients banned (IV); shipped .tp-* classes as state model replace Legion state matrix (V); accessibility floor codified (VI); Pulse icon set closes the icon gap (VII); 268px shell + ≤860px collapse layout (VIII); 60/30/10 usage and tint+ink semantics (IX); canon-package workflow (X). Dark theme supersedes the 2026-09-30 "light mode only" decision (flagged). |
| 2.1.0 | 2026-09-30 | Principle X ratified: full-agentic design-to-code, single canon file, no Figma→token pipeline (revisit trigger recorded). |
| 2.0.0 | 2026-09-30 | Owner decisions: visual values over tokens; 24px gutter + general-reference grid/breakpoints; light mode only; general references for non-Legion gaps. |
| 1.0.0 | 2026-09-25 | Initial ratification from `DESIGN-legion.md`. |

**Version**: 4.0.0 | **Ratified**: 2026-09-25 | **Last Amended**: 2026-10-07
