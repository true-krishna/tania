# Tania Design Constitution

**Version**: 4.5.0 | **Ratified**: 2026-09-25 | **Last Amended**: 2026-10-21
**Source of record (two layers, one canon)**:
1. **Owner-approved TANIA navy+red brand direction** — brand-role mapping and values are defined in Principle I from the approved TAN-99 exploration. It supersedes the prior Legion Violet brand mapping only. Amendment 4.3.0 extends it with the brand owner's **TANIA Brand Color Kit** (Color Guideline v1.2, Logo Guideline v1.1) and the owner's five decisions of 2026-10-13 (informational status, active red accent roles, danger distinctness, official logo assets, kit surfaces). Amendment 4.3.1 closes the deviations reported against that review: the kit's chart series order and the dark-theme active-navigation pair. Amendment 4.5.0 ratifies the tosca/sky/warm-white accent layer from the latest TAN-99 exploration (`tania-login-tosca-v2.html`, 2026-10-21).
2. **The `tania-design-system` package (TANIA Pulse)** — executable structural adaptation: Pulse components, radius scale, shadow, themes, icon set, app shell, and reference pages. Existing non-brand Pulse rules remain in force unless amended below.
**Supersedes**: design constitution 4.2.0 for brand color, logo direction, and neutral-surface values; non-brand rules remain in force.
**Scope**: all Tania user-interface work — dashboards, forms, data tables, admin panels.

## Preamble

Tania's interface uses **TANIA Pulse**: the product's shipped structure — component classes, 10/14/20/28px + pill radius, one soft card shadow, theme support, outline icon set, and 268px app shell. Brand colors follow the owner-approved navy+red mapping plus the ratified tosca/sky/warm-white accent layer in this constitution; non-brand component and accessibility rules remain unchanged. Values not specified here must not be inferred from the exploratory prototype.

The workflow remains **fully agentic** (Principle X): the constitution, the Legion analysis, and the shipped package are upstream; agents read them and write code directly. Where this document quotes a value, the shipped files are authoritative; where a future edit to the shipped files and this document disagree, this constitution wins and the conflict is flagged to the design/dev sync forum as an amendment proposal.

## Core Principles

### I. tokens.css is the canon — brand roles and values are explicit

`tokens/tokens.css` (`--tp-*` variables) is the single source of truth for color, radius, shadow, motion, and font stacks. Components **MUST NOT introduce new hex values**: consume `var(--tp-*)` (or the Tailwind preset mirror, Principle X). Component-specific values (px sizes, weights) MAY be concrete in place. Canonical values are changed only in `tokens.css` — never inline in components.

- **Brand colors (owner-approved TAN-99 direction, extended in 4.3.0)**: Navy `#172B4D` (`--tp-brand-navy`) is the primary action color; deep navy `#0B1F4D` (`--tp-brand-navy-deep`) is its pressed/deep state. Red `#E1231A` (`--tp-brand-red`) is the brand accent, not a general error token, with **explicit activated roles**: active navigation, links, the keyboard-focus ring, AI actions, and the logo plus mark. Its supporting values are deep red `#B71C14` (`--tp-brand-red-deep`, for small text on tint), tint `#FCE9E8` (`--tp-brand-red-tint`), tint line `#F5B8B5`, on-red white (`--tp-brand-on-red`), and text-on-tint `--tp-brand-red-ink` (`#B71C14` light, `#FF8A82` dark — the only brand pair with ratified dark values, see Additional Constraints). **Data-visualisation series** follow the kit order: `--tp-chart-1` `#E1231A`, `--tp-chart-2` `#2684FF`, `--tp-chart-3` `#168A5B`, `--tp-chart-4` `#D9822B`, with the bar track on canvas `#F5F7FA`. White text on these fills must meet the contrast floor (VI). Propagate to package tokens and Tailwind preset in the same implementation change.
- **Accent and canvas palette (owner-approved 2026-10-21, from the TAN-99 `tania-login-tosca-v2.html` exploration)**: Tosca `#00A99D` (`--tp-tosca`) is the decorative/content accent — kicker chips, headline swoosh, orbit dots, sparks, wave fills. Its tint is `--tp-tosca-soft` `#D9F5F0`, and small text on that tint is `--tp-tosca-ink` `#066B66` (5.5:1, measured in the mockup; the exploration's `#087F79` is a deep decorative variant, not a small-text token). Sky `#DFF2FF` (`--tp-sky`) / sky-strong `#A9DCFF` (`--tp-sky-strong`) / sky-pale `#F5F9FD` (`--tp-sky-pale`) are canvas and flat decorative fills — sky-pale is the ratified canvas for auth/hero pages (the app shell keeps Mist `--tp-bg`). Warm-white `#FDFCFB` (`--tp-warm-white`) is the hero/illustration panel surface. Tosca is **never** the interactive voltage (navy), never a status semantic (Mint/Sun/danger), never the focus ring, and never a primary-button fill; sky and warm-white never carry text. Small text on any tint uses its validated ink pair (VI).
- **Semantic colors remain separate from brand**: success Mint `#168A5B` with text-safe ink `#0F6E48`; informational/in-progress is Info blue `#2684FF` (`--tp-info`, tint `#E9F2FF`, ink `#0B5FD6`, 5.1:1 on tint) — the legacy Violet tint/ink pair is **retired entirely**, not kept as a category; warning Sun `#D9822B` with text-safe ink `#B54708`. Error/danger keeps its own dedicated token family (`--tp-peach` `#F97066`, tint `#FEE4E2`, ink `#B32318`) and **MUST stay distinguishable from brand red**: the kit's `danger = brand red` proposal is declined for exactly that reason, and every danger surface must additionally carry an icon and a text label, so state is never conveyed by colour alone (owner decision 2026-10-13). Preserve status tint+ink distinctions and validate all pairings before shipping. Retired Violet/Lilac interactive tokens must not remain as brand-action aliases.
- **Surfaces and typography**: neutral surfaces are aligned to the brand kit palette — canvas `#F5F7FA` (`--tp-bg`), line `#DFE1E6` (`--tp-line`), mute `#6B778C` (`--tp-neutral`), and text-safe muted `#5E6C84` (`--tp-muted`, because `#6B778C` only reaches 4.2:1 on the canvas, where our secondary text also sits). Nunito Sans stack/weights are unchanged. Do not infer any other unspecified value from the mockup.
- **Logo**: use only artwork supplied by the brand owner. That artwork now exists: the **TANIA Brand Color Kit** (2026-10-13) supplies the wordmark (navy and white variants) and the "T" icon, which are the official assets and ship from `public/brand/` in the dashboard repo. Never recreate the wordmark as text or hand-drawn SVG. The kit files are screenshot crops rather than a production vector master — request that master before print, or before any display larger than the 141px native wordmark width.
- **A new color is never invented**: use approved tokens above or existing semantic tokens; document and approve additional roles/values before adding to `tokens.css` and mirroring in Tailwind. Exploration files may show legacy aliases (`--tp-primary`, `--tp-lilac`, `--tp-peach`, the `--tania-*` bridge) resolving to these values; during propagation map them to the canonical `--tp-brand-*` / `--tp-tosca-*` / `--tp-sky-*` / `--tp-warm-white` names and delete misleading aliases — a legacy name must never hide a brand value.
- **Radius** (Pulse character, ratified): `--tp-r-sm` 10px (tabs, small buttons) · `--tp-r-md` 14px (groups) · `--tp-r-lg` 20px (cards) · `--tp-r-xl` 28px (large panels) · `--tp-r-pill` 999px (buttons, inputs, chips). Never `50%`. The 999px pill is the practical equivalent of Legion's `rounded.full` 900px token and is ratified as such.
- **Motion**: `--tp-ease` cubic-bezier(.2,.8,.2,1), `--tp-dur` 200ms.

### II. One primary action, one dark card — navy is the action voltage, red the brand accent

- **One primary button per area** — the single strongest action; all others default to outline `.tp-btn`. Primary fills `--tp-brand-navy` (`#172B4D`) with white text; hover/press use `--tp-brand-navy-deep` (`#0B1F4D`). Validate small-text contrast at ≥4.5:1. Red is not the primary action default: it is the brand accent — active navigation, links, keyboard focus, AI actions, and the logo plus mark — and it is **never** the danger token (IX).
- **One dark navy card per screen at most** — reserved for emphasis (e.g. development-action panel) and it stays navy. The active navigation item is not an additional dark card: it uses the brand red tint (V). The dark card is a maximum, not a requirement: the ratified auth/hero pattern (TAN-99 `tania-login-tosca-v2.html`) uses the light illustration panel (warm-white + wash + flat waves, Additional Constraints) with **zero** dark cards.
- Navy carries primary actions; red carries brand accent. Neither may encode success, warning, or danger merely by colour reuse (IX).

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
- **Nav item** (`.tp-nav-item`): 12px radius, gap 12px, padding 10px 14px, weight 600; hover = `--tp-bg`; current (`aria-current="page"`) = the brand kit's **"Cockpit" recipe**: `--tp-brand-red-tint` background (`#FCE9E8`; `#3A1715` in dark), `--tp-brand-red-ink` text (`#B71C14`, 5.6:1; `#FF8A82` on the dark tint, 7.0:1) and `--tp-brand-red` icon accents; do not hardcode them.
- **AI insight** (`.tp-ai`): 1.5px `--tp-neutral` border, r-lg, `--tp-brand-red-tint` background (red is the AI/brand accent, kit v1.2) — AI content appears **only on user request**, never auto-injected.
- **Empty state** (`.tp-empty`): muted 14px with bold ink lead line. Empty values are written **"—" with the reason stated** (what is missing, who can fill it). Read-only modes are labeled **"Hanya baca"** with no edit affordances.
- **Card** (`.tp-card`): surface bg, 1px line border, r-lg 20px, 20px padding, `--tp-shadow`.

Accessibility floor (VI) applies to all of the above. For **new interactive components the shipped classes do not cover**, apply Legion's state-matrix discipline — four treatments (solid / soft / outline / transparent) × default / hover / press / disabled — taking values from ramp steps: hover = one step deeper (500→600), press = 600→700, disabled = muted label (tertiary-400) on tertiary-100/tint bg. Mark derived specs "non-canonical (general reference)" until promoted (Known Gaps).

### VI. Accessibility floor

- Contrast: body text ≥ **4.5:1**, icons and UI elements ≥ **3:1**. Validate navy, deep navy, red, semantic inks, and focus ring on actual surfaces before release; this constitution assumes no unverified ratios.
- The 2026-10-09 primary-Violet mitigation is superseded by v4.2.0; see amendment log for historical rationale.
- Keyboard focus is always visible: 2px outline, 2px offset, one contrast-validated focus token. That token is now **selected: `--tp-brand-red` `#E1231A`** (4.3:1 on the `#F5F7FA` canvas — above the 3:1 UI floor; inside red-tint surfaces the contextual `--tp-brand-red-deep` token is used so text and icon detail stay ≥4.5:1). Removing the outline is a defect.
- **Honor `prefers-reduced-motion`**: the shipped global kill (`transition/animation: none`) must survive refactors. The **only** autonomous animation in the product is the signal ripple in the profile header (5s ease-in-out loop).
- Semantic state is expressed through ARIA (`aria-selected`, `aria-current`), not styling alone; standalone icons get a `title`.

### VII. Icons: the Pulse outline set on Legion accents

- **17 named glyphs** shipped in `icons/` (sprite `tania-icons.svg` and React `TaniaIcon`): beranda, dashboard, profil, chapter, timesheet, workload, feasibility, budget, assignment, idp, evaluasi, profil-cv, master-data, jejak-audit, ask-tania, sinyal, notifikasi. The sprite and React component are the authoritative inventory.
- Style: **outline 2px, round caps/joins, 24px grid** (20px dense menus), main strokes in `currentColor`, exactly one colored detail per icon — brand navy (`--tania-primary`) for action markers, semantic Mint (`--tania-mint`) for data/info.
- On active menu items (`--tp-brand-red-tint` background) the coloured detail uses the contextual brand-red tokens, exactly as `.tp-nav-item[aria-current="page"]` does; everywhere else the detail stays brand navy / semantic Mint. Do not hardcode it.
- Accent bridge variables map to brand navy and semantic Mint; primary-fill accents yield to white only when that fill passes contrast. Never hardcode accent colors in consuming components.

### VIII. Layout: 268px app shell, ≤860px collapse

Derived from the shipped reference pages (contoh-profil-talent, contoh-idp-evaluasi) — re-verified unchanged in the Legion-aligned package:

- **App shell**: sticky sidebar **268px** (surface bg, 1px right border, padding 22px 16px, vertical gap 22px, nav gap 4px) + fluid main. Topbar: padding 16px 24px, 1px bottom border, surface bg.
- **Collapse breakpoint: ≤860px** — sidebar becomes a static horizontal strip (padding 14px 16px, bottom border, nav row horizontally scrollable); topbar tightens to 12px 16px; main padding 16px. This is the shipped ladder; other breakpoints follow general reference.
- **Content widths**: main is fluid — it fills the viewport minus the 268px sidebar with 24px side gutters and no max-width cap, so content adapts to large viewports (owner decision TAN-170: no centered 1160px container). Pages self-constrain when the design calls for it: standard content 860–900px; narrow/forms/search 560px.
- **Grids**: card grids use `auto-fit` + `minmax(150–300px, 1fr)`; wide tables scroll horizontally (min-width ≈560–620px) inside an overflow wrapper instead of compressing.
- Density evidence (bindings, not a scale): card padding 20px, topbar 16/28, AI block 16/18. No formal spacing scale is defined — do not invent one; reuse shipped paddings, and any new spacing value sits on Legion's 4px grid.

### IX. Color semantics and usage discipline

- **Proportion ≈60/30/10**: ~60% neutral surfaces, ~30% ink/navy, ~10% accents (brand red, tosca, mint, sun), adjusted for hierarchy and contrast.
- White text only on contrast-validated navy/deep navy or other approved fills. Brand red stays a separate token family from danger/error: danger is never expressed by red alone, always with an icon and a text label.
- Status: Mint = positive, Sun = warning/achievement, **Info blue = informational / in-progress**, dedicated error/danger token (always with icon + text) = destructive/attention. Navy = primary action; red = brand accent (active navigation, links, focus ring, AI actions, logo plus mark); tosca = decorative/content accent only, never a status or action role. Neutral = meters, AI borders, empty values.
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

- **Light/dark themes**: TAN-99 is light-only and does not define dark-theme brand solids. Preserve existing theme behavior and do not infer navy/red dark values — with one ratified exception: the **active-navigation pair** (`--tp-brand-red-tint` `#3A1715`, `--tp-brand-red-ink` `#FF8A82`) is taken verbatim from the TAN-99 dark mockup (`tania-profil-navy.html`), not inferred. Dark values for the tosca/sky/warm-white accent layer remain unspecified and must not be inferred either. This is an implementation dependency, not permission to fall back to Violet.
- **Data-viz patterns**: preserve information hierarchy and semantic roles. The kit's series order (chart-1 red, chart-2 blue, chart-3 green, chart-4 orange) is adopted as the **palette**, mapped onto our semantic roles so meaning is preserved — chart-1 = churn/decline, chart-2 = distribution (report hue, replacing navy which is now reserved for primary action), chart-3 = new talent, chart-4 = reserved for a future warning series (its `#D9822B` is 2.9:1 on white, so a fill must carry a label or a darker variant); "not filled" stays `--tp-neutral`. Bar tracks use canvas. Do not re-order series in a way that inverts an existing meaning.
- **Illustration**: flat geometric blocks (squares, triangles, quarter circles, tiered circles) on Mist, single-hue tiered opacity instead of gradients, no faces — used for empty states and module headers. Current set is a sketch; production polish by an illustrator is pending. **Ratified hero/illustration panel recipe (auth pages, 2026-10-21)**: warm-white `--tp-warm-white` panel + pink wash (flat `--tp-brand-red-tint` circle; the exploration's `#FDEAE9` maps to that token) + flat bottom waves filled tosca/navy/red/sky-strong — flat fills only, no gradients or gradient clip-paths. Decorative motifs (blob, orbit, spark, wash, waves) are always `aria-hidden`, `pointer-events: none`, and behind content (z-index 0); orbit/spark appear only ≥1280px; the wash stays clear of the wordmark/chip area at every width; wave height is capped (≤220px) so banner states never push decoration into the copy.
- **Functional density over editorial air** (Legion's enterprise doctrine, carried): tight consistent paddings, tables and forms built for internal B2B tooling.
- **Official logos** (package rule 8): the TANIA wordmark and "T" icon ship from the brand-owner kit (`public/brand/` in the dashboard repo), never as text stand-ins; the Telkom Indonesia logo still has no supplied asset.

## Known Gaps

The package does not define; until it does, derive by analogy from shipped values + general industry reference, mark **"non-canonical (general reference)"** in the spec, and promote recurring choices by amendment:

1. **Disabled/pressed/loading states** — primary navy/deep-navy states are defined in II and V; recipes for other components remain undefined. Disabled button/input recipes remain undefined.
2. **Overlay & feedback components**: modal, dropdown/select, tooltip, toast/snackbar, pagination.
3. **Form controls**: checkbox, radio, switch, textarea, validation/error borders (no error/success border tokens exist).
4. **Table component spec** — reference pages show usage, not a tokenized component.
5. **Formal spacing scale and z-index system** — reuse shipped paddings on the 4px grid; no invented scale.
6. **Icon coverage** beyond the 17 glyphs (same recipe extends the set).

Navy+red brand roles and the tosca/sky/warm-white accent layer are owner-approved (4.5.0), the focus token is selected (VI), the informational status role is closed (Info blue), official logo artwork has been supplied, and the chart palette plus the dark active-navigation pair are ratified (4.3.1). Remaining implementation dependencies: the production vector logo master, and dark values for the brand navy/red solids. Historical Legion value-source notes apply only to superseded revisions.

## Governance

- All UI specs and plans MUST cite approved tokens from the package and this constitution; review against Principles I–X.
- Changes to this constitution require: (a) evidence from the shipped package, the Legion analysis, or an explicit owner decision, (b) a version bump, (c) an entry in the amendment log.
- Conflicts between a future edit to the shipped files and this document: **the constitution wins**; record an amendment proposal and escalate unresolvable conflicts to the design/dev sync forum, not to local invention.

## Amendment Log

| Version | Date | Change |
|---|---|---|
| 4.5.0 | 2026-10-21 | Ratified the latest TAN-99 mockup (`tania-login-tosca-v2.html`, 2026-10-20) as the accent layer: tosca `#00A99D` / soft `#D9F5F0` / ink `#066B66` (5.5:1) as decorative/content accent, sky `#DFF2FF`/`#A9DCFF`/`#F5F9FD` and warm-white `#FDFCFB` as canvas/panel surfaces (I); hero/illustration panels may use the light warm-white + red-tint wash + flat wave recipe and the dark card becomes max-one (II, Additional Constraints); tosca added to the accent share and excluded from status/interaction roles (IX); legacy alias cleanup during propagation made explicit (I). Non-brand rules and the navy+red mapping are unchanged — primary buttons stay navy, the focus ring stays the ratified 2px `--tp-brand-red` + 2px offset. Package propagation of the new accent tokens (tokens.css + Tailwind mirror) and dark-theme pairs remain follow-up work. (Renumbered from the colliding 4.3.0 of the TAN-63 delivery, following the 2026-10-14 governance-repair precedent.) |
| 4.4.0 | 2026-10-13 | Owner decision (TAN-170): §VIII content widths — the 1160px centered content container is retired; main is fluid with 24px side gutters and fills the viewport minus the 268px sidebar so content adapts to large viewports. Topbar horizontal padding 28px → 24px to stay aligned with the content gutter. Pages keep self-constrained widths (standard 860–900px, narrow/forms 560px). (Renumbered from a colliding 4.3.0 to 4.4.0 during the 2026-10-14 governance repair, owner-approved.) |
| 4.3.1 | 2026-10-13 | Owner decisions closing the five deviations reported after 4.3.0 shipped. (a) Chart series adopt the kit palette `--tp-chart-1..4` (`#E1231A`/`#2684FF`/`#168A5B`/`#D9822B`), mapped to our semantic roles (churn / distribution / new talent, chart-4 reserved) so no existing series meaning is inverted; bar tracks use canvas. (b) The active-navigation pair gains ratified **dark** values taken verbatim from the TAN-99 dark mockup: `--tp-brand-red-tint` `#3A1715` + new `--tp-brand-red-ink` `#FF8A82` (7.0:1), superseding 4.3.0's "no dark brand values" for this pair only; this also fixes the `.tp-ai` block on dark surfaces. (c) Link colour confirmed as `--tp-brand-red-deep` (`#B71C14`), `#E1231A` reserved for non-text use. (d) `--tp-text` stays `#212121`. (e) Logo assets confirmed as the attached kit files. Amendment only; package/token propagation is the follow-up implementation change. |
| 4.3.0 | 2026-10-13 | Owner decisions closing the TAN-165 gap audit. (a) The legacy Violet tint/ink category becomes **Info blue** `#2684FF` / tint `#E9F2FF` / ink `#0B5FD6`, and the Violet pair is retired. (b) Red `#E1231A` gets **activated brand-accent roles** — active navigation (kit "Cockpit" recipe: `--tp-brand-red-tint` bg, `--tp-brand-red-deep` text/icon), links, keyboard-focus ring, AI actions — superseding 4.2.0's "navy is the active-navigation color" in §I/II/V/VI/IX. (c) Error/danger **must stay distinguishable** from brand red (kit's `danger = red` declined); danger keeps its own token family and must always carry icon + text. (d) Official logo artwork supplied in the brand kit now ships (`public/brand/`); placeholder retired. (e) Neutral surfaces align to the kit: canvas `#F5F7FA`, line `#DFE1E6`, mute `#6B778C`, muted `#5E6C84`. Non-brand Pulse rules unchanged. Amendment only; package/token propagation is the follow-up implementation change. |
| 4.2.0 | 2026-10-13 | Owner-approved TAN-99 direction: replace Violet brand/interactive voltage with navy `#172B4D` / deep navy `#0B1F4D`; establish red `#E1231A` / deep red `#B71C14` as separate brand accents, not implicit error tokens. Update primary/nav/button, icons and color semantics; retain non-brand Pulse rules. Require contrast validation and explicit focus-token selection. TAN-99 wordmark remains exploratory; official artwork must be supplied and approved. Dark-theme navy/red values remain unspecified pending validated mapping. Constitution amendment only; package/token propagation remains follow-up work. |
| 4.1.0 | 2026-10-09 | Reconciled with TAN-99 hi-fi profile prototype and owner's product-wide contrast decision: primary button fill = primary-600, hover/press = primary-700; primary-500 retired from small-text fills; icon accent bridge and derived profile patterns codified. Superseded for brand colors by 4.2.0. |
| 4.0.0 | 2026-10-07 | Owner instruction: re-ground the canon on **`DESIGN-legion.md` (values) + the re-based package "TANIA Pulse, Legion-aligned" (structure)**. Every `--tp-*` color re-based onto Legion ramps: Legion Purple `#875bf7`/primary-600 `#7839ee`/primary-900 `#491c96`, ink `#212121`, success/error/warning ramps (I, II, IX); Nunito Sans binary weights (700/400/600) replace Sora + Inter; weight 800 and negative tracking retired (III); Legion-flat depth restored with the card soft shadow and pill radius ratified as Pulse character exceptions (IV); component state model re-valued, Legion state-matrix discipline retained as the derivation rule for new components (V); contrast shortfall on primary-500 documented with the primary-600 mitigation (VI); icon accents re-based on Legion tokens (VII); layout shell re-verified unchanged (VIII); dark theme values re-based on Legion ramps and ratified (Additional Constraints). Pulse Indigo values (#6246EA, Sora/Inter, #101A47) retired with their source. |
| 3.0.0 | 2026-10-06 | Source of record replaced per requester handoff (`tania-design-system.zip`): TANIA Pulse Indigo canon — tokens.css as executable source of truth with no-new-hex rule (I); Violet #6246EA single interactive voltage, one primary button / one dark card per screen (II); Sora + Inter type roles replace Nunito Sans binary (III); border + soft shadow elevation, gradients banned (IV); shipped .tp-* classes as state model replace Legion state matrix (V); accessibility floor codified (VI); Pulse icon set closes the icon gap (VII); 268px shell + ≤860px collapse layout (VIII); 60/30/10 usage and tint+ink semantics (IX); canon-package workflow (X). Dark theme supersedes the 2026-09-30 "light mode only" decision (flagged). |
| 2.1.0 | 2026-09-30 | Principle X ratified: full-agentic design-to-code, single canon file, no Figma→token pipeline (revisit trigger recorded). |
| 2.0.0 | 2026-09-30 | Owner decisions: visual values over tokens; 24px gutter + general-reference grid/breakpoints; light mode only; general references for non-Legion gaps. |
| 1.0.0 | 2026-09-25 | Initial ratification from `DESIGN-legion.md`. |

**Version**: 4.5.0 | **Ratified**: 2026-09-25 | **Last Amended**: 2026-10-21
