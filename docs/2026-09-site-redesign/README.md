# 2026-09 site redesign — nnajiabraham.com

Status: **planning complete, not implemented**. Production is still the Vite + React SPA in `src/`; nothing in this folder is built or deployed.

## Files

| File | What it is |
| --- | --- |
| [`plan.md`](./plan.md) | Goals, scope, phases, acceptance criteria, decisions/assumptions log, risks, and the implementer handover checklist. Start here. |
| [`design-brief.md`](./design-brief.md) | Brand and voice, role-statement and section-name options, palette tokens with WCAG checks, type pairings, spacing/radius scale, motion and micro-interactions, photo usage, page-by-page inventory with wireframe notes. |
| [`blog-architecture.md`](./blog-architecture.md) | Astro content-collections design: folder layout, frontmatter schema per template, template versioning, new-post generator, media/embeds, drafts, RSS/sitemap/llms.txt/robots. |
| [`content-migration.md`](./content-migration.md) | Medium post inventory, NDA-safe project entries for the Projects page, and blog-post ideas. |
| [`mockups/`](./mockups/README.md) | Three static HTML/CSS directions (`a-fieldnotes`, `b-groundcrew`, `c-greenhouse`), each with home, blog post, and about pages, plus `screenshots/` at 1440 and 390 wide. |
| `mockups/assets/` | Owner photos used by the mockups (already ≤1600px wide). |

## How to review

1. Read `plan.md` sections 1–3 (goals, scope, phases) — ten minutes.
2. Open the three mockups (`mockups/README.md` explains how) or flip through `mockups/screenshots/`.
3. Pick a direction and fill in `Chosen mockup direction: ___` at the bottom of `plan.md`.
4. Answer the open questions listed in `plan.md` → Handover.

## Out of scope for this folder

- Implementation of any kind under `src/`, `package.json`, or `netlify.toml`.
- The Astro project guide and pnpm guide — those are implementation deliverables (see `plan.md` → Handover) and will be written by the implementing agent into `docs/2026-09-site-redesign/guides/`.
