# docs/ — how this folder works

`docs/` holds planning and design material for this repository. Nothing in here is part of the Vite build (`index.html` → `src/`), so changes under `docs/` never affect the deployed site.

## Rules

1. **Every plan is a folder**: `docs/<yyyy-mm>-<kebab-name>/`. The date prefix is the month the plan was started, so folders sort chronologically.
2. **No dangling files at the root of `docs/`** except this `agents.md`. If a note does not belong to a plan, it belongs in a plan's folder or it does not belong in `docs/`.
3. **Plans are append-mostly.** When a decision changes, add a dated entry to the plan's decisions log rather than rewriting history. Mockups and screenshots are snapshots; replace them only when the direction changes.
4. **NDA hygiene.** Never name an employer's internal systems, customers, partners, or confidential figures in this folder. Describe work by problem shape and outcome only.
5. **Docs that describe how to work in the codebase** (tooling guides, architecture guides) live in the plan folder that introduced them until the implementation lands, then move to `docs/<yyyy-mm>-<name>/guides/` or the plan's README points at their final home.

## What a plan folder contains

| File | Purpose |
| --- | --- |
| `README.md` | Index of the folder: what each file is, current status, who owns it. |
| `plan.md` | Goals, scope, phases, acceptance criteria, decisions & assumptions log, risks, handover checklist. |
| `design-brief.md` (optional) | Brand/voice, palette tokens, typography, spacing, motion, page inventory. Only for UI-facing plans. |
| `*-architecture.md` (optional) | Technical design for a subsystem introduced by the plan. |
| `content-*.md` (optional) | Content inventories and migration notes. |
| `mockups/` (optional) | Static HTML/CSS explorations, one subfolder per direction, plus `screenshots/`. Mockups may use CDN fonts; the real build must not. |
| `guides/` (optional) | Living guides produced by the implementation (added when the plan ships). |

## How to add a plan

1. `mkdir docs/<yyyy-mm>-<kebab-name>` and create `README.md` and `plan.md` from the table above.
2. Put every supporting file inside that folder. Do not add files to `docs/` root.
3. Link the new folder from nothing else — `docs/` is discovered by listing it. Keep the folder name stable once referenced from commits or PRs.
4. When the plan is implemented, update `plan.md` → Handover with what shipped and what was cut, and mark the README status `shipped`.

## Current plans

- `2026-09-site-redesign/` — redesign of nnajiabraham.com (Astro + blog system + new visual direction). Status: planning complete, awaiting implementation.
