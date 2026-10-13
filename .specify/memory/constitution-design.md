# Tania Design Constitution

**Version**: 4.2.0 | **Ratified**: 2026-09-25 | **Last Amended**: 2026-10-14
**Source of record (two layers, one canon)**:
1. **Owner-approved TANIA navy+red brand direction** — brand-role mapping and values are defined in Principle I from the approved TAN-99 exploration. It supersedes the prior Legion Violet brand mapping only; it does not make reconstructed logo artwork an official asset.
2. **The `tania-design-system` package (TANIA Pulse)** — executable structural adaptation: Pulse components, radius scale, shadow, themes, icon set, app shell, and reference pages. Existing non-brand Pulse rules remain in force unless amended below.
**Supersedes**: design constitution 4.1.0 for brand color and logo direction only; non-brand rules remain in force.
**Scope**: all Tania user-interface work — dashboards, forms, data tables, admin panels.

## Preamble

Tania's interface uses **TANIA Pulse**: the product's shipped structure — component classes, 10/14/20/28px + pill radius, one soft card shadow, theme support, outline icon set, and 268px app shell. Brand colors follow the owner-approved navy+red mapping in this constitution; non-brand component and accessibility rules remain unchanged. Values not specified here must not be inferred from the exploratory prototype.

The workflow remains **fully agentic** (Principle X): the constitution, the Legion analysis, and the shipped package are upstream; agents read them and write code directly. Where this document quotes a value, the shipped files are authoritative; where a future edit to the shipped files and this document disagree, this constitution wins and the conflict is flagged to the design/dev sync forum as an amendment proposal.

## Core Principles

### I. tokens.css is the canon — brand roles and values are explicit

`tokens/tokens.css` (`--tp-*` variables) is the single source of truth for color, radius, shadow, motion, and font stacks. Components **MUST NOT introduce new hex values**: consume `var(--tp-*)` (or the Tailwind preset mirror, Principle X). Component-specific values (px sizes, weights) MAY be concrete in place. Canonical values are changed only in `tokens.css` — never inline in components.

- **Brand colors (owner-approved TAN-99 direction)**: Navy `#172B4D` (`--tp-brand-navy`) is the primary action and active-navigation color; deep navy `#0B1F4D` (`--tp-brand-navy-deep`) is its pressed/deep state. Red `#E1231A` (`--tp-brand-red`) is the brand accent, not a general error token; deep red `#B71C14` (`--tp-brand-red-deep`) is its deeper/accent variant. White text on these fills must meet the contrast floor (VI). Propagate to package tokens and Tailwind preset in the same implementation change.
- **Semantic colors remain separate from brand**: success Mint `#168A5B` with text-safe ink `#0F6E48`; error/danger uses a dedicated semantic token and must not alias brand red without explicit token-role approval; warning Sun `#D9822B` with text-safe ink. Preserve existing status tint+ink distinctions and validate all pairings before shipping. Retired Violet/Lilac interactive tokens must not remain as brand-action aliases.
- **Surfaces and typography**: retain existing Pulse light surfaces, neutral text/border tokens, and Nunito Sans stack/weights unless separately amended. Do not infer unspecified values from the mockup.
- **Logo**: use only artwork supplied and approved by the brand owner. The TAN-99 embedded wordmark is exploratory and not confirmed as an official master; do not ship it as official. Use a labeled placeholder until approved artwork and light/dark variants are supplied.
- **A new color is never invented**: use approved tokens above or existing semantic tokens; document and approve additional roles/values before adding to `tokens.css` and mirroring in Tailwind.
- **Radius** (Pulse character, ratified): `--tp-r-sm` 10px (tabs, small buttons) · `--tp-r-md` 14px (groups) · `--tp-r-lg` 20px (cards) · `--tp-r-xl` 28px (large panels) · `--tp-r-pill` 999px (buttons, inputs, chips). Never `50%`. The 999px pill is the practical equivalent of Legion's `rounded.full` 900px token and is ratified as such.
- **Motion**: `--tp-ease` cubic-bezier(.2,.8,.2,1), `--tp-dur` 200ms.

### II. One primary action, one dark card — Navy is the interactive voltage

- **One primary button per area** — the single strongest action; all others default to outline `.tp-btn`. Primary fills `--tp-brand-navy` (`#172B4D`) with white text; hover/press use `--tp-brand-navy-deep` (`#0B1F4D`). Validate small-text contrast at ≥4.5:1. Red is not the primary action default; reserve it for brand accents and explicit destructive/error semantics through distinct semantic tokens.
- **One dark navy card per screen** — reserved for emphasis (e.g. development-action panel); current navigation uses navy but is not an additional card.
- Navy is the primary interactive voltage; red is a separate brand accent and must not encode success, warning, or danger merely by color reuse.

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
- White text is legal only on approved navy/deep navy or other fills whose contrast is validated under VI.
- Action naming is consistent across the flow ("Simpan perubahan" → confirmation "Perubahan disimpan").

### IV. Elevation: Legion flatness plus one ratified soft shadow; no gradients — ever

- Hovering doesn't lift — it deepens using the defined state colors.
- **Ratified Pulse exception**: cards carry the single soft shadow `--tp-shadow` (`0 1px 2px rgba(16,24,40,.06), 0 6px 20px rgba(16,24,40,.06)` — a Legion tertiary-900-based shadow), as shipped on `.tp-card`. This explicitly supersedes Legion's "no drop-shadow tokens" doctrine as a ratified Pulse character trait. No other shadows anywhere; a second shadow requires an amendment. The active-tab ring (`0 0 0 1px var(--tp-line)`) is a border device, not a shadow.
- **No gradients in the interface.** Layered/moodboard gradient effects are translated into flat tiered shapes (single hue at stepped opacities). Profile headers are plain Mist; progress uses `--tp-neutral`.

### V. Shipped component classes define the state model

`tokens/components.css` (`.tp-*`) is the reference implementation. Interactive components MUST preserve these behaviors:

- **Button** (`.tp-btn`): Nunito Sans 600 14px, min-height 40px, padding 0 18px, pill, 1.5px ink (`--tp-text`) border, transparent bg; hover = `--tp-bg`. **Primary** (`.tp-btn--primary`): `--tp-brand-navy` fill, white text; hover/press = `--tp-brand-navy-deep`. Validate contrast (VI). Icon accents inside yield to white only if contrast passes. Inline-flex, 8px icon gap.
- **Input** (`.tp-input`): min-height 44px, padding 0 16px, 1px `--tp-line`, pill, surface bg, 400 14px.
- **Chip** (`.tp-chip`): 12.5px weight 600, padding 4px 12px, pill; color = semantic tint bg + matching semantic ink.
- **Tabs** (`.tp-tabs`/`.tp-tab`): container = `--tp-bg` bg, 1px line border, r-md, 4px padding/gap, horizontally scrollable; tab = 600 14px, r-sm, muted text; **active** (`aria-selected="true"`) = surface bg, ink text, `0 0 0 1px` line ring.
- **Nav item** (`.tp-nav-item`): 12px radius, gap 12px, padding 10px 14px, weight 600; hover = `--tp-bg`; current (`aria-current="page"`) = approved navy bg, white text, with contrast-validated icon accents; do not hardcode them.
- **AI insight** (`.tp-ai`): 1.5px `--tp-neutral` border, r-lg, approved neutral/semantic tint bg — AI content appears **only on user request**, never auto-injected.
- **Empty state** (`.tp-empty`): muted 14px with bold ink lead line. Empty values are written **"—" with the reason stated** (what is missing, who can fill it). Read-only modes are labeled **"Hanya baca"** with no edit affordances.
- **Card** (`.tp-card`): surface bg, 1px line border, r-lg 20px, 20px padding, `--tp-shadow`.

Accessibility floor (VI) applies to all of the above. For **new interactive components the shipped classes do not cover**, apply Legion's state-matrix discipline — four treatments (solid / soft / outline / transparent) × default / hover / press / disabled — taking values from ramp steps: hover = one step deeper (500→600), press = 600→700, disabled = muted label (tertiary-400) on tertiary-100/tint bg. Mark derived specs "non-canonical (general reference)" until promoted (Known Gaps).

### VI. Accessibility floor

- Contrast: body text ≥ **4.5:1**, icons and UI elements ≥ **3:1**. Validate navy, deep navy, red, semantic inks, and focus ring on actual surfaces before release; this constitution assumes no unverified ratios.
- The 2026-10-09 primary-Violet mitigation is superseded by v4.2.0; see amendment log for historical rationale.
- Keyboard focus is always visible: use 2px outline with 2px offset and a contrast-validated focus token. The previous mint focus value is not automatically replaced by brand red; select and validate the focus token during package propagation. Removing the outline is a defect.
- **Honor `prefers-reduced-motion`**: the shipped global kill (`transition/animation: none`) must survive refactors. The **only** autonomous animation in the product is the signal ripple in the profile header (5s ease-in-out loop).
- Semantic state is expressed through ARIA (`aria-selected`, `aria-current`), not styling alone; standalone icons get a `title`.

### VII. Icons: the Pulse outline set on Legion accents

- **17 named glyphs** shipped in `icons/` (sprite `tania-icons.svg` and React `TaniaIcon`): beranda, dashboard, profil, chapter, timesheet, workload, feasibility, budget, assignment, idp, evaluasi, profil-cv, master-data, jejak-audit, ask-tania, sinyal, notifikasi. The sprite and React component are the authoritative inventory.
- Style: **outline 2px, round caps/joins, 24px grid** (20px dense menus), main strokes in `currentColor`, exactly one colored detail per icon — brand navy (`--tania-primary`) for action markers, semantic Mint (`--tania-mint`) for data/info.
- On active navy menu items, detail uses a contrast-validated contextual token; do not hardcode it.
- Accent bridge variables map to brand navy and semantic Mint; primary-fill accents yield to white only when that fill passes contrast. Never hardcode accent colors in consuming components.

### VIII. Layout: 268px app shell, ≤860px collapse

Derived from the shipped reference pages (contoh-profil-talent, contoh-idp-evaluasi) — re-verified unchanged in the Legion-aligned package:

- **App shell**: sticky sidebar **268px** (surface bg, 1px right border, padding 22px 16px, vertical gap 22px, nav gap 4px) + fluid main. Topbar: padding 16px 28px, 1px bottom border, surface bg.
- **Collapse breakpoint: ≤860px** — sidebar becomes a static horizontal strip (padding 14px 16px, bottom border, nav row horizontally scrollable); topbar tightens to 12px 16px; main padding 16px. This is the shipped ladder; other breakpoints follow general reference.
- **Content widths**: main max-width 1160px (padding 24px 28px); standard content 860–900px; narrow/forms/search 560px.
- **Grids**: card grids use `auto-fit` + `minmax(150–300px, 1fr)`; wide tables scroll horizontally (min-width ≈560–620px) inside an overflow wrapper instead of compressing.
- Density evidence (bindings, not a scale): card padding 20px, topbar 16/28, AI block 16/18. No formal spacing scale is defined — do not invent one; reuse shipped paddings, and any new spacing value sits on Legion's 4px grid.

### IX. Color semantics and usage discipline

- **Proportion ≈60/30/10**: ~60% neutral surfaces, ~30% ink/navy, ~10% accents (brand red, mint, sun), adjusted for hierarchy and contrast.
- White text only on contrast-validated navy/deep navy or other approved fills. Keep brand red distinct from danger/error tokens even if values are later aligned by explicit approval.
- Status: Mint = positive, Sun = warning/achievement, dedicated error/danger token = destructive/attention, legacy Violet tint may remain only as a non-brand semantic category pending migration. Navy = primary action/current navigation; red = brand accent. Neutral = meters, AI borders, empty values.
- **RBAC**: Admin, Operation, Chapter, Talent — display adapts per role, **brand colors are identical** for all roles.
- **Logos**: Telkom Indonesia logo and TANIA wordmark come from official assets, never recreated as text.

### X. Full-agentic design-to-code: constitution + adapted package are the canon

Tania's FE workflow is **fully agentic** — no human transcribes designs into code, and **no Figma→token sync pipeline is built**.

- **Constitution and package are upstream.** Agents read this constitution and TANIA Pulse and write code directly; update any package value mapping with approved brand tokens during propagation, and use reference pages for visual verification.
- **The package lives in the codebase**: as `design/` in a Tania repo, or its own repo registered as a Multica project resource. `AGENTS.md`/`CLAUDE.md` inside it carry the mandatory short rules and are part of this canon.
- **Tailwind mirror**: `tokens/tailwind.preset.js` maps the same values (colors, Nunito Sans display/sans, borderRadius sm–xl, boxShadow card). When `tokens.css` changes, the preset changes in the same commit — they are one canon in two syntaxes, not two sources.
- **Change flow**: a design change lands as (1) a `tokens.css` edit (+ `components.css` if structural, + the Tailwind mirror), then (2) agent propagation to components — with a constitution amendment when a principle (not just a value) changes.
- **Revisit trigger** (unchanged): build automated design→code token sync only if a separate design source (e.g. Figma) is again actively maintained AND human developers write FE code in parallel with agents.

## Additional Constraints

- **Light/dark themes**: TAN-99 is light-only and does not define dark-theme brand values. Preserve existing theme behavior, but do not infer or ship navy/red dark values until specified and contrast-validated. This is an implementation dependency, not permission to fall back to Violet.
- **Data-viz patterns**: preserve information hierarchy and semantic roles; replace brand Violet with approved navy/red mapping only after chart contrast and meaning are validated. No multi-hue charts without a semantic need.
- **Illustration**: flat geometric blocks (squares, triangles, quarter circles, tiered circles) on Mist, single-hue tiered opacity instead of gradients, no faces — used for empty states and module headers. Current set is a sketch; production polish by an illustrator is pending.
- **Functional density over editorial air** (Legion's enterprise doctrine, carried): tight consistent paddings, tables and forms built for internal B2B tooling.
- **Official logos** (package rule 8): Telkom Indonesia logo and TANIA wordmark from original assets, never text stand-ins.

## Known Gaps

The package does not define; until it does, derive by analogy from shipped values + general industry reference, mark **"non-canonical (general reference)"** in the spec, and promote recurring choices by amendment:

1. **Disabled/pressed/loading states** — primary navy/deep-navy states are defined in II and V; recipes for other components remain undefined. Disabled button/input recipes remain undefined.
2. **Overlay & feedback components**: modal, dropdown/select, tooltip, toast/snackbar, pagination.
3. **Form controls**: checkbox, radio, switch, textarea, validation/error borders (no error/success border tokens exist).
4. **Table component spec** — reference pages show usage, not a tokenized component.
5. **Formal spacing scale and z-index system** — reuse shipped paddings on the 4px grid; no invented scale.
6. **Icon coverage** beyond the 17 glyphs (same recipe extends the set).

Navy+red brand roles are owner-approved. Dark-theme values, final semantic palettes, focus token, and official logo masters remain implementation dependencies. Historical Legion value-source notes apply only to superseded revisions.

## Governance

- All UI specs and plans MUST cite approved tokens from the package and this constitution; review against Principles I–X.
- Changes to this constitution require: (a) evidence from the shipped package, the Legion analysis, or an explicit owner decision, (b) a version bump, (c) an entry in the amendment log.
- Conflicts between a future edit to the shipped files and this document: **the constitution wins**; record an amendment proposal and escalate unresolvable conflicts to the design/dev sync forum, not to local invention.

## Amendment Log

| Version | Date | Change |
|---|---|---|
| 4.2.0 | 2026-10-14 | Owner-approved TAN-99 direction: replace Violet brand/interactive voltage with navy `#172B4D` / deep navy `#0B1F4D`; establish red `#E1231A` / deep red `#B71C14` as separate brand accents, not implicit error tokens. Update primary/nav/button, icons and color semantics; retain non-brand Pulse rules. Require contrast validation and explicit focus-token selection. TAN-99 wordmark remains exploratory; official artwork must be supplied and approved. Dark-theme navy/red values remain unspecified pending validated mapping. Constitution amendment only; package/token propagation remains follow-up work. |
| 4.1.0 | 2026-10-09 | Reconciled with TAN-99 hi-fi profile prototype and owner's product-wide contrast decision: primary button fill = primary-600, hover/press = primary-700; primary-500 retired from small-text fills; icon accent bridge and derived profile patterns codified. Superseded for brand colors by 4.2.0. |
| 4.0.0 | 2026-10-07 | Owner instruction: re-ground the canon on **`DESIGN-legion.md` (values) + the re-based package "TANIA Pulse, Legion-aligned" (structure)**. Every `--tp-*` color re-based onto Legion ramps: Legion Purple `#875bf7`/primary-600 `#7839ee`/primary-900 `#491c96`, ink `#212121`, success/error/warning ramps (I, II, IX); Nunito Sans binary weights (700/400/600) replace Sora + Inter; weight 800 and negative tracking retired (III); Legion-flat depth restored with the card soft shadow and pill radius ratified as Pulse character exceptions (IV); component state model re-valued, Legion state-matrix discipline retained as the derivation rule for new components (V); contrast shortfall on primary-500 documented with the primary-600 mitigation (VI); icon accents re-based on Legion tokens (VII); layout shell re-verified unchanged (VIII); dark theme values re-based on Legion ramps and ratified (Additional Constraints). Pulse Indigo values (#6246EA, Sora/Inter, #101A47) retired with their source. |
| 3.0.0 | 2026-10-06 | Source of record replaced per requester handoff (`tania-design-system.zip`): TANIA Pulse Indigo canon — tokens.css as executable source of truth with no-new-hex rule (I); Violet #6246EA single interactive voltage, one primary button / one dark card per screen (II); Sora + Inter type roles replace Nunito Sans binary (III); border + soft shadow elevation, gradients banned (IV); shipped .tp-* classes as state model replace Legion state matrix (V); accessibility floor codified (VI); Pulse icon set closes the icon gap (VII); 268px shell + ≤860px collapse layout (VIII); 60/30/10 usage and tint+ink semantics (IX); canon-package workflow (X). Dark theme supersedes the 2026-09-30 "light mode only" decision (flagged). |
| 2.1.0 | 2026-09-30 | Principle X ratified: full-agentic design-to-code, single canon file, no Figma→token pipeline (revisit trigger recorded). |
| 2.0.0 | 2026-09-30 | Owner decisions: visual values over tokens; 24px gutter + general-reference grid/breakpoints; light mode only; general references for non-Legion gaps. |
| 1.0.0 | 2026-09-25 | Initial ratification from `DESIGN-legion.md`. |

**Version**: 4.2.0 | **Ratified**: 2026-09-25 | **Last Amended**: 2026-10-14
