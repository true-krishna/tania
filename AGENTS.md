<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Branch Naming

When creating a new branch, the name MUST match the feature or code change it contains, following the Conventional Commits guideline. Use this format:

```
<type>/<short-kebab-case-description>
```

Allowed types:

- `feat` — a new feature
- `fix` — a bug fix
- `refactor` — code change that neither fixes a bug nor adds a feature
- `perf` — performance improvement
- `docs` — documentation only
- `test` — adding or updating tests
- `build` — build system or dependencies
- `ci` — CI configuration
- `chore` — other changes that don't modify src or test files
- `style` — formatting only, no code behavior change

Rules:

- Use lowercase, hyphen-separated words (`feat/talent-report-chart`).
- Keep the description short but specific to the change.
- Optionally reference the ticket: `feat/PCR-123-talent-report-chart`.
- Never reuse a generic name like `feat/update` or `fix/bugs` — it must describe the actual change.
- If the branch grows beyond its name, rename it or split the work so the name stays accurate.

Examples:

```
feat/talent-report-range-filter
fix/sidebar-active-nav-state
refactor/reports-data-fetching
docs/agents-branch-naming
chore/bump-next-version
```

# Code Comments

Do not add JSDoc/@param/@returns blocks by default. They are unnecessary noise on components, hooks, and obvious functions.

Only keep JSDoc on custom utility functions where the input/output is not self-evident (e.g. `toDate`), and remove it everywhere else — especially in `.jsx` / `.tsx` component files.

- Remove JSDoc from React components, props, and inline handlers.
- Remove JSDoc that just restates the function name or its types.
- Keep or add JSDoc only for non-obvious utilities (edge-case handling, unit/format assumptions, side effects).

Regular comments follow the same policy — `.jsx` / `.tsx` files carry minimal comments, ideally zero:

- Do not narrate what the code does, restate names, or leave section banners, TODO breadcrumbs, or commented-out code.
- Allow a plain comment only for a non-obvious constraint the code cannot express (e.g. an `!important` needed because a token class is unlayered) — and keep it to the point.
- The rationale belongs in the commit message or the issue, not the component file.
