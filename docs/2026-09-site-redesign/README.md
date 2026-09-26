# 2026-09 site redesign: nnajiabraham.com

Status: **planning complete, owner decisions recorded (2026-09-24), not implemented**. Target stack is TanStack Start (React, fully prerendered at launch, server functions possible later) on Netlify. Chosen direction: B (groundcrew) plus C's dark album tile. Production is still the Vite + React SPA in `src/`; nothing in this folder is built or deployed.

## Files

| File | What it is |
| --- | --- |
| [`plan.md`](./plan.md) | Goals, scope, phases, acceptance criteria, decisions/assumptions log, risks, the self-contained implementer handover (§6), and the design-iteration rules (§7). Start here. |
| [`design-brief.md`](./design-brief.md) | Brand and voice, role-statement and section-name options, palette tokens with WCAG checks, type pairings, spacing/radius scale, motion and micro-interactions, photo usage, page-by-page inventory with wireframe notes. |
| [`blog-architecture.md`](./blog-architecture.md) | TanStack Start blog design: MDX via `@mdx-js/rollup` plus an in-repo content-index Vite plugin (comparison against Velite, content-collections, and a unified script), folder layout, frontmatter schema per template, template versioning, new-post generator, media/embeds, drafts, RSS/sitemap/llms.txt/robots as prerendered server routes. |
| [`content-migration.md`](./content-migration.md) | Medium post inventory, NDA-safe project entries for the Projects page, and blog-post ideas. |
| [`mockups/`](./mockups/README.md) | Three static HTML/CSS directions (`a-fieldnotes`, `b-groundcrew`, `c-greenhouse`), each with home, blog post, and about pages, plus `screenshots/` at 1440 and 390 wide. Chosen: `b-groundcrew` plus the `.tile--music` album tile from `c-greenhouse`. Design variants built during implementation go in `mockups/variants/<name>/`. |
| `mockups/assets/` | Owner photos used by the mockups (already ≤1600px wide). |

## How to review

1. Read `plan.md` sections 1–3 (goals, scope, phases): ten minutes.
2. Open the three mockups (`mockups/README.md` explains how) or flip through `mockups/screenshots/`.
3. Direction and open questions are already settled in `plan.md` §4 (decisions log) and §6 (Handover). Implementers start at §6.

## Out of scope for this folder

- Implementation of any kind under `src/`, `package.json`, or `netlify.toml`.
- The TanStack Start project guide and pnpm guide: those are implementation deliverables (see `plan.md` §6 Handover) and will be written by the implementing agent into `docs/2026-09-site-redesign/guides/`.
