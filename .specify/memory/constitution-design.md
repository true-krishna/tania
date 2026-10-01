# Tania Design Constitution

**Version**: 1.0.0 | **Ratified**: 2026-09-25 | **Last Amended**: 2026-09-25
**Source of record**: `DESIGN-legion.md` (Legion design system analysis, version alpha)
**Scope**: all Tania user-interface work — dashboards, forms, data tables, admin panels.

## Preamble

Tania's interface is built on **Legion**, Telkom Digital's product-grade design system: a light-canvas, purple-accented UI kit for dense enterprise and B2B surfaces. This constitution turns Legion's documented values and invariants into binding rules. Legion's signature structural pattern is the **state matrix**: every interactive component ships four visual treatments (**solid / soft / outline / transparent**) crossed with interaction states (**default / hover / press / disabled**, plus focus borders where specified), on a consistent **sm / md / lg** size ladder.

## Core Principles

### I. Token-First: every visual value is a named token

No raw hex values or arbitrary pixel values in component code. Every color, type size, spacing, radius, and sizing value MUST resolve to a Legion token:

- **Color**: 11-step ramp per hue (25 → 900) for Primary, Secondary, Tertiary (neutral), Information, Error, Warning, Success. Base: white `#ffffff`, ink `#212121`, transparent `#ffffff00`.
- **Spacing**: 4px-based scale, 0 → 256px (0, 2, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 48, 56, 64, 80 … 256).
- **Sizing**: a distinct token family for control dimensions (0–64, then 144–256).
- **Radius**: `none` 0 · `xs` 2 · `sm` 4 · `base` 6 · `md` 8 · `lg` 10 · `xl` 12 · `xxl` 14 · `xxxl` 16 · `2xl` 24 · `3xl` 32 · `full` **900px**.

### II. One interactive voltage: Legion Purple

`primary-500` `#875bf7` is the **only** default interactive-state color — button fill, link, focus border, checked control, active nav/tab indicator, selected option. No new interactive hues are introduced. The universal state ladder is **500 (default) → 600 (hover) → 700 (press)**, applied to every interactive component before inventing custom values. Error/Warning/Success/Information keep their own 500-step defaults for their semantic components (destructive buttons, alerts, ratings, etc.).

### III. Single family, weight binary

One typeface — **Nunito Sans** — for heading and body. No licensed display cut, no substitution table.

- Headings H1–H6 are always **Bold (700)**: H1 60/72, H2 48/56, H3 36/44, H4 30/40, H5 24/36, H6 20/28 (px/px line-height).
- Body and caption text default to **Regular (400)**: Body Large 18/28, Body Small 16/24, Caption Large 14/20, Caption Small 12/18.
- **Semibold (600) is the "actionable text" weight** — reserved for interactive labels: buttons, badges, chips, form-field *labels*, nav items, table headers.
- No uppercase transforms, no letter-spacing tokens. All tracking is 0.
- Semantic ink hierarchy is contextual per component: `#212121` for most labels/input values; `tertiary-800` `#1d2939` for Modal/Alert titles and input values (Select/Datepicker); `tertiary-700` `#344054` for nav/tab/breadcrumb default labels; `tertiary-500` `#667085` for descriptions, placeholders, hints.

### IV. Flat elevation: border + tint, never shadow

Depth comes from **1px hairline borders** (`tertiary-300` `#d0d5dd`), **dividers** (`tertiary-200` `#eaecf0`), and **background-tint state changes** — a hovered soft button deepens (`primary-50` → `primary-100`), it does not lift.

- **No drop shadows, ever.** The modal overlay `rgba(33,33,33,0.30)` is the system's only translucent depth device.
- Focus indication is a **1–2px tinted border at the active color's 200 step** (e.g. `primary-200` on a focused primary button) — not a shadow ring.

### V. State-matrix completeness

Every new interactive component MUST ship the full matrix before merge:

- Four treatments: **solid / soft / outline / transparent**, each defining default/hover/press/disabled colors (plus a dedicated focus-border token where applicable).
- Sizing ladder **sm 36 / md 44 / lg 52 px** for button-height controls; icon gap 4–8px; horizontal padding 16/20/24 by size.
- Shared disabled recipe: solid → bg `tertiary-300`, text `tertiary-400`; soft → bg `tertiary-100`, text `tertiary-300`; outline/transparent → transparent bg, text (and border, outline only) `tertiary-300`.
- Radio's disabled-active distinction is preserved: "was checked, now disabled" (`primary-300`) differs from "never checked, disabled".

### VI. Shipped CSS variables are the source of truth

Where the Figma Foundation reference and shipped component CSS variables disagree, **the shipped CSS variables win** (known case: Information-500 is `#0ba5ec`, not the Foundation screenshot's `#2e90fa`). Discrepancies are flagged for design/dev sync — never silently adopted from Foundation screenshots, never silently patched on either side.

### VII. Component invariants are load-bearing

Documented exceptions and directional rules MUST be preserved in implementation:

- **Card body padding is 0px by design** — content inside owns its spacing; do not inherit the 16px header/footer padding.
- **Sidebar** active item = 4px **left** border in `primary-500`; **Navbar** active item = **bottom** border. The two are not interchangeable.
- **Stepper** "active/current step" border deliberately uses `success-500` — not primary — unlike every other active state.
- **`rounded.full` = the 900px token** for every circular/pill shape (avatar, badge, radio, switch, stepper indicator) — never `50%` or `9999px`.
- **Controls scale radius with size variant** (sm < md < lg); containers (Card, Modal) stay fixed at `xxxl` 16px.
- **Text-field family (text-field, select, datepicker, pin-field)**: hover and focus share the same `primary-500` border — do not invent a lighter hover-only border. Error/success borders use `error-500`/`success-500`; caption rows use `tertiary-600` / `error-500` / `success-500`.
- **Breadcrumb**: the *current* crumb is de-emphasized to `tertiary-500` while navigable crumbs stay purple — intentional inverted emphasis.
- **Token naming is not uniform across families**: `Border-N` tokens are index-based (`Border-1` = 2px, `Border-2` = 4px …), unlike Radius/Spacing which are named after their pixel values. Never assume the naming pattern transfers.

## Additional Constraints

- **Light canvas only**: no dark-mode tokens exist; do not invent dark surfaces. Dark mode requires a ratified amendment.
- **Responsive behavior is unresolved** at the token layer (no breakpoints documented). Page/template responsiveness must be decided and documented at plan time; do not assume a grid exists.
- **No icon-scale foundation token** exists; icon sizing follows per-component `{component}-sizing-icon-*` tokens until a scale is ratified.
- **Functional density over editorial air**: tight, consistent padding (fields 16–20px, cards 16px/section, table cells 16px). Legion is for internal tooling, not marketing pages.
- **Alert** keeps its left-stripe signature: 25-step background, 4px left border in the variant's 500 step, icon chip on the 500 step, title `tertiary-800` Bold, description `tertiary-500` Regular, radius 10px.
- **Table**: header bg `tertiary-200` with `#212121` Bold 16px text, body text `tertiary-600` Regular 14px, striped rows `primary-50`, hover row `tertiary-200`, 1px `tertiary-200` borders, 16px cell padding.

## Known Gaps (tracked, unresolved)

1. Grid/container/breakpoint documentation — blocks page-template decisions.
2. Dark mode — not supported.
3. Foundation ↔ shipped-token sync (Information ramp) — flagged to design/dev sync.
4. Components outside the ~33 captured primitives are not yet documented and require analysis before use.
5. Hover tokens absent for Card, Tree, and some Table row states — confirm behavior before relying on hover there.

## Governance

- All UI specs and plans MUST cite the tokens used; review checks against the state matrix (V), the purple state ladder (II), and the ink hierarchy (III).
- Changes to this constitution require: (a) evidence from the Legion source of record, (b) a version bump, (c) an entry in the amendment log.
- Unresolvable conflicts escalate to the design/dev sync forum (per Principle VI), not to local invention.

**Version**: 1.0.0 | **Ratified**: 2026-09-25 | **Last Amended**: 2026-09-25
