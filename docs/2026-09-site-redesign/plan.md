# Plan — nnajiabraham.com redesign

Owner: Abraham Nnaji. Planning agent: Cursor cloud agent (Sept 2026). Implementer: a later agent (see Handover).

## 1. Goals

1. **Make the site do a job.** Today it is a one-page terminal-styled résumé. The redesign turns it into a small personal site with a real blog, a projects page that survives an NDA, and a résumé/contact path that a recruiter can complete in under a minute.
2. **Own the writing.** Move the existing Medium posts home, keep their original dates, and make publishing a new post a five-minute task with a generator and a schema that fails the build when metadata is wrong.
3. **Look like the person.** Warm, light, mostly monochrome, one sharp green-yellow accent, small photos where they mean something, few and delightful micro-interactions. Curious, friendly, a bit private, dry humour allowed.
4. **Modern, boring tooling.** Astro + React islands + Tailwind v4 + TypeScript + pnpm, with CI that lints, typechecks, validates content, and builds. No analytics at launch.

Audience priority (owner's order): recruiters/hiring managers → peers/engineers → clients → friends → social media. Every layout decision defaults to the recruiter reading on a phone between meetings.

## 2. Scope

### In scope

- Six pages: Home, About, Blog (index + post + tag pages), Projects, Resume (PDF link), Contact.
- Blog system on Astro content collections with two templates (`article`, `note`), template versioning, drafts excluded from build, RSS, tag pages, reading time.
- Content migration of 9 Medium posts with original publish dates.
- Basic SEO: per-page title/description/OG, `robots.txt`, `sitemap.xml`, `llms.txt`, RSS, JSON-LD `Person` on About.
- Netlify: production from `master`, branch deploys for `develop` and `staging`, deploy previews on PRs.
- Makefile: `dev`, `build`, `preview`, `new-post TEMPLATE= SLUG=`, `lint`, `check`, `validate-content`, `deploy-status`.
- Two guides written by the implementer: an Astro project-context guide and a pnpm guide.

### Out of scope

- Search, comments, newsletter, analytics, dark theme (light only by decision), CMS, i18n.
- Any phone number anywhere. Contact is email + socials only.
- Naming the employer's internal systems, partners, or customers in any content.

## 3. Phases

Each phase is a mergeable unit. Phases 1–2 replace the current site; 3–6 can ship incrementally behind branch deploys.

### Phase 1 — Tooling

Set up pnpm, Astro, TypeScript strict, Tailwind v4 (`@tailwindcss/vite`), ESLint 9 flat config + Prettier, Makefile, GitHub Actions CI (lint → typecheck → validate-content → build), Netlify config (`pnpm build`, publish `dist/`, Node 22, branch deploys, deploy previews).

**Acceptance**

- `make dev|build|preview|lint|check|validate-content|deploy-status` all exist and are documented in the pnpm guide.
- CI runs on PRs and on `master`, `develop`, `staging`; a failing zod schema fails the build.
- Netlify builds from `master` with the same command CI uses; deploy previews appear on PRs.
- `package.json` has no `npm`-specific scripts left; `pnpm-lock.yaml` is committed, `package-lock.json` deleted.

### Phase 2 — Astro migration (pages + design system)

Port Home, About, Projects, Resume, Contact to Astro pages using the chosen mockup direction. Implement design tokens as CSS variables consumed by Tailwind v4's `@theme`. Self-host the two chosen font families + mono via `@fontsource` or Astro's Fonts API. React islands only where interactivity needs state (there may be none at launch; the micro-interactions are CSS/vanilla JS).

**Acceptance**

- Lighthouse (mobile) ≥ 95 performance, 100 accessibility, 100 best practices, ≥ 95 SEO on Home and a blog post.
- No CDN font requests in production; `font-display: swap` with size-adjusted fallbacks.
- All copy from `src/content/data.ts` that survives (socials, name, role, experience) moves to typed data files; no phone number; email only.
- Spotify embed on Home is lazy (facade image + play → iframe) so it costs nothing until clicked.
- Every interactive element has a visible focus style; `prefers-reduced-motion` disables all non-essential motion.

### Phase 3 — Blog system

Implement `blog-architecture.md`: collection config, two templates, `templateVersion`, generator script, reading time, drafts handling, tag pages, RSS, post layout with code highlighting, callouts, tables, YouTube embed component.

**Acceptance**

- `make new-post TEMPLATE=article SLUG=hello` creates `content/blog/hello/index.md` with valid frontmatter; `make validate-content` passes.
- A post with `status: draft` is absent from `dist/`, the RSS feed, the sitemap, and tag pages.
- A post with an unknown `templateVersion` or missing required field fails `astro build` with a message naming the file.
- `/blog/<slug>`, `/blog/tags/<tag>`, `/rss.xml` render; reading time matches word count / 200 ± 1 min.

### Phase 4 — Content migration

Migrate the 9 Medium posts per `content-migration.md` (original `publishedAt`, `createdAt` = same date, `updatedAt` = migration date, `canonical` left pointing at Medium unless the owner decides otherwise). Write Projects entries and About copy from the NDA-safe extract. Add résumé PDF.

**Acceptance**

- Every inventory row in `content-migration.md` has a matching folder under `content/blog/` with `publishedAt` equal to the Medium date.
- Projects page contains only entries marked low/medium sensitivity, phrased by problem shape; no employer-internal names.
- Resume page links a PDF in `public/` and the PDF contains no phone number.

### Phase 5 — SEO

Per-page `<title>`, description, OG/Twitter tags with a generated default OG image; `robots.txt`; `sitemap.xml` (excluding drafts); `llms.txt`; RSS autodiscovery link; JSON-LD `Person` on About with `sameAs` socials.

**Acceptance**

- `curl` of each page shows unique title + description; OG image resolves.
- `sitemap.xml` has no draft URLs; `robots.txt` references the sitemap; `llms.txt` lists pages and posts.
- Rich-results test passes for `Person` JSON-LD.

### Phase 6 — Polish

Micro-interactions from the design brief, 404 page, print stylesheet for Resume, favicon set, final a11y pass (axe), copy pass for voice.

**Acceptance**

- axe reports zero violations on all pages.
- Motion inventory in `design-brief.md` matches what shipped; nothing moves for users with reduced motion.
- Owner sign-off on copy.

## 4. Decisions & assumptions log

| # | Date | Decision / assumption | Rationale |
| --- | --- | --- | --- |
| D1 | 2026-09 | Astro is the framework; React only as islands. | Content site; islands keep JS near zero. Owner decision. |
| D2 | 2026-09 | **Astro major version is an open question.** Owner specified Astro 6, which pins Vite 7. Astro 7 (stable 2026-06-22) ships Vite 8 (Rolldown), satisfying the owner's "latest Vite" wish, but it makes a Rust Markdown pipeline the default and no longer installs remark/rehype by default. | This plan is written against Astro 6 APIs; the content-layer API (`glob()` loader, `render(entry)`, `astro/zod`) is identical in 7. See Risks R1 and Handover Q1. |
| D3 | 2026-09 | Tailwind v4 via `@tailwindcss/vite`; design tokens as CSS variables in `@theme`. | v4 is CSS-first; tokens stay usable in plain CSS for the blog prose. |
| D4 | 2026-09 | pnpm, Node 22 LTS. | Astro 6/7 require Node 22.12+. |
| D5 | 2026-09 | Light theme only; warm off-white; never pure white or pure black. | Owner decision. Reduces token surface by half. |
| D6 | 2026-09 | Two font families max + one mono, self-hosted. Mockups may use Google Fonts links; production may not. | Owner decision; privacy and performance. |
| D7 | 2026-09 | Blog posts live at `content/blog/<slug>/index.md` (repo root `content/`, not `src/content/`). | Keeps writing separate from code; glob loader supports any base path. |
| D8 | 2026-09 | Two templates at launch: `article`, `note`. Versioned via `templateVersion`. | YAGNI; add types when a real post needs them. |
| D9 | 2026-09 | Medium posts keep original `publishedAt`. `canonical` field left unset (site is canonical) unless the owner prefers Medium to stay canonical. | Owner decision on dates; canonical is Handover Q3. |
| D10 | 2026-09 | No analytics, search, comments, newsletter at launch. | Owner decision. |
| D11 | 2026-09 | Projects section name: **"Cleared for Release"** (options in design brief). | Pilot phrasing, signals "only what I'm allowed to share", dry. |
| D12 | 2026-09 | Contact: `hello@nnajiabraham.com` + GitHub, LinkedIn, Medium, Twitter/X from `src/content/data.ts`. No phone. | Owner decision. |
| D13 | 2026-09 | Netlify: production `master`; branch deploys `develop`, `staging`; deploy previews on PRs. | Owner decision. |
| D14 | 2026-09 | Existing `plan.md` at repo root (2025 Vite/React plan) is historical; leave in place until the Astro migration lands, then move to `docs/2025-xx-vite-react-rebuild/plan.md`. | Don't churn files outside this task's scope. |
| A1 | 2026-09 | Assumed the résumé PDF will be provided by the owner; the plan only links it. | No PDF exists in the repo. |
| A2 | 2026-09 | Assumed the Spotify album and artist embeds are allowed to load third-party iframes after a click (facade pattern). | Zero-JS-until-interaction keeps Lighthouse honest. |
| A3 | 2026-09 | Assumed Medium posts can be re-published here (owner authored them). | Standard Medium terms permit authors to republish. |

## 5. Risks & trade-offs

| # | Risk / trade-off | Mitigation |
| --- | --- | --- |
| R1 | **Astro 6 vs 7.** Staying on 6 means Vite 7 (not latest) and a dependency on a major that is one behind. Moving to 7 means Vite 8/Rolldown (newer, fewer battle-tested plugins) and the Sätteri Markdown pipeline (custom remark plugins for callouts/reading time need checking or replacing). | Implementer spikes a `pnpm create astro` on both majors during Phase 1; picks 7 unless a needed remark plugin is blocked. Record the outcome in this log. |
| R2 | Tailwind v4 + Astro scoped styles + blog prose: utility classes cannot style Markdown output; needs a `.prose` layer. | Write the prose layer in plain CSS using the tokens; do not depend on `@tailwindcss/typography` defaults (they assume pure-white/pure-black). |
| R3 | Neon green-yellow accent fails text contrast on off-white (1.1:1). | Accent is never used as text colour. It is a highlight background under ink text (11.8:1) or a 2–3px underline/rule. Text-coloured accent uses `--color-accent-ink` (5.4:1). |
| R4 | Photos of the owner risk making the site feel like a portfolio of the person rather than the work. | Photos are small (≤ 320px), max one per page, and only on About and the hero (headshot) per the brief. |
| R5 | Migration of Medium posts may lose formatting (code blocks, images). | Migrate by hand from the RSS `content:encoded`; 9 short posts. |
| R6 | pnpm + Netlify: Netlify auto-detects pnpm from `pnpm-lock.yaml` but needs `NODE_VERSION=22`. | Set in `netlify.toml` `[build.environment]`. |
| R7 | Schema strictness makes writing annoying. | The generator writes valid frontmatter; `status: draft` posts skip nothing but publication, so half-written posts still typecheck. |
| R8 | Three mockup directions invite "a bit of each". | The Handover asks for one direction; mixing is allowed only at the token level (palette and type are shared across directions by design). |

## 6. Handover

### Implementer checklist

Read in this order: this file → `design-brief.md` → `blog-architecture.md` → `content-migration.md` → the chosen mockup folder.

- [ ] Resolve Q1 (Astro major) and record it in the decisions log.
- [ ] Phase 1 tooling on a `develop` branch; open a PR against `master` with deploy preview.
- [ ] Write `docs/2026-09-site-redesign/guides/astro-project-guide.md`: project layout, how pages/layouts/components/islands are organised, how tokens flow from CSS variables → Tailwind `@theme` → components, how content collections are wired, how to run and debug the dev server, how the build is verified in CI.
- [ ] Write `docs/2026-09-site-redesign/guides/pnpm-guide.md`: install, lockfile discipline, `pnpm dlx` vs `npx`, workspace-free single package conventions, how the Makefile wraps pnpm, Netlify/CI caveats.
- [ ] Phase 2 pages from the chosen mockup; delete `src/` SPA and its tests once parity is reached; move root `plan.md` per D14.
- [ ] Phase 3 blog system; Phase 4 content migration; Phase 5 SEO; Phase 6 polish. Check acceptance criteria per phase and tick them here.
- [ ] Update `README.md` at repo root for the new stack (keep the section list of scripts, now Makefile targets).
- [ ] Mark this folder's `README.md` status as `shipped` and note what was cut.

### Open questions for the owner

- **Q1** Astro 6 (Vite 7, as specified) or Astro 7 (Vite 8, latest, Rust Markdown pipeline)? Recommendation: 7, verified by a spike.
- **Q2** Which mockup direction? Recommendation in `mockups/README.md` (b-groundcrew), reasons there.
- **Q3** Should migrated posts keep Medium as canonical (`<link rel=canonical>` → Medium) or become canonical here? Recommendation: canonical here; the Medium posts are short and old.
- **Q4** Résumé PDF: provide the file (no phone number) or should the implementer generate one from typed data?
- **Q5** Which of the five role statements (design brief §2) goes in the hero? Recommendation: statement 2.
- **Q6** Twitter/X link: keep, or drop from socials? The current site lists it.

Chosen mockup direction: ___
