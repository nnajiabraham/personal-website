# Plan: nnajiabraham.com redesign

Owner: Abraham Nnaji. Planning agent: Cursor cloud agent (Sept 2026). Implementer: a later agent (see §6 Handover, which is written to be read without any chat context).

## 1. Goals

1. **Make the site do a job.** Today it is a one-page terminal-styled résumé. The redesign turns it into a small personal site with a real blog, a projects page that survives an NDA, and a résumé/contact path a recruiter can complete in under a minute.
2. **Own the writing.** Move the existing Medium posts home, keep their original dates, and make publishing a new post a five-minute task with a generator and a schema that fails the build when metadata is wrong.
3. **Look like the person.** Warm, light, mostly monochrome, one sharp green-yellow accent, small photos where they mean something, few and delightful micro-interactions. Curious, friendly, a bit private, dry humour allowed.
4. **Modern, boring tooling.** Astro 7 + React islands + Tailwind v4 + TypeScript + pnpm, with CI that lints, typechecks, validates content, and builds. No analytics at launch.

Audience priority (owner's order): recruiters/hiring managers, then peers/engineers, then clients, then friends, then social media. Every layout decision defaults to the recruiter reading on a phone between meetings.

## 2. Scope

### In scope

- Six pages: Home, About, Blog (index + post + tag pages), Projects, Resume (PDF link), Contact.
- Blog system on Astro content collections with two templates (`article`, `note`), template versioning, drafts excluded from build, RSS, tag pages, reading time.
- Content migration of 9 Medium posts with original publish dates, canonical on nnajiabraham.com.
- Basic SEO: per-page title/description/OG, `robots.txt`, `sitemap.xml`, `llms.txt`, RSS, JSON-LD `Person` on About.
- Netlify: production from `master`, branch deploys for `develop` and `staging`, deploy previews on PRs.
- Makefile: `dev`, `build`, `preview`, `new-post TEMPLATE= SLUG=`, `lint`, `check`, `validate-content`, `deploy-status`.
- Two guides written by the implementer into `docs/2026-09-site-redesign/guides/`: an Astro-in-this-project guide and a pnpm guide.

### Out of scope

- Search, comments, newsletter, analytics, dark theme (light only by decision), CMS, i18n.
- Any phone number anywhere. Contact is email + socials only.
- Naming the employer's internal systems, partners, or customers in any content.
- Generating the résumé from typed data. The owner supplies the PDF.

## 3. Phases

Each phase is a mergeable unit. Phases 1 and 2 replace the current site; 3 to 6 can ship incrementally behind branch deploys.

### Phase 1: Tooling

Set up pnpm, Astro 7 (`pnpm create astro@latest`), TypeScript strict, Tailwind v4 (`@tailwindcss/vite`), ESLint 9 flat config + Prettier, Makefile, GitHub Actions CI (lint, typecheck, validate-content, build), Netlify config (`pnpm build`, publish `dist/`, Node 22, branch deploys, deploy previews).

**Acceptance**

- `make dev|build|preview|lint|check|validate-content|deploy-status` all exist and are documented in the pnpm guide.
- CI runs on PRs and on `master`, `develop`, `staging`; a failing zod schema fails the build.
- Netlify builds from `master` with the same command CI uses; deploy previews appear on PRs.
- `package.json` has no npm-specific scripts left; `pnpm-lock.yaml` is committed, `package-lock.json` deleted.
- Astro is `^7.3`, Vite resolves to 8.x in the lockfile, Node is 22.12+ in `netlify.toml` and CI.
- The Markdown pipeline checks in `blog-architecture.md` §9 pass on a throwaway post: directives render, Shiki highlights, heading IDs exist, `entry.body` is available for reading time.

### Phase 2: Astro migration (pages + design system)

Port Home, About, Projects, Resume, Contact to Astro pages using direction B (groundcrew) with C's dark album tile (see §7). Implement design tokens as CSS variables consumed by Tailwind v4's `@theme`. Self-host Red Hat Display, Red Hat Text, and Red Hat Mono via Astro's Fonts API or `@fontsource`. React islands only where interactivity needs state (there may be none at launch; the micro-interactions are CSS/vanilla JS).

**Acceptance**

- Lighthouse (mobile) at least 95 performance, 100 accessibility, 100 best practices, at least 95 SEO on Home and a blog post.
- No CDN font requests in production; `font-display: swap` with size-adjusted fallbacks.
- All copy from `src/content/data.ts` that survives (socials, name, role, experience) moves to typed data files; no phone number; email only.
- Spotify embed on Home is lazy (facade image, then iframe on click) so it costs nothing until clicked.
- Every interactive element has a visible focus style; `prefers-reduced-motion` disables all non-essential motion.
- Rust compiler strictness: every `.astro` template closes its tags; `compressHTML: 'jsx'` whitespace is checked visually on inline-element runs (nav, tags, status line).
- No em dash (U+2014) in any rendered copy (a grep for the character across `src/` and `content/` returns nothing).

### Phase 3: Blog system

Implement `blog-architecture.md`: collection config, two templates, `templateVersion`, generator script, reading time, drafts handling, tag pages, RSS, post layout with code highlighting, callouts, tables, YouTube embed component.

**Acceptance**

- `make new-post TEMPLATE=article SLUG=hello` creates `content/blog/hello/index.md` with valid frontmatter; `make validate-content` passes.
- A post with `status: draft` is absent from `dist/`, the RSS feed, the sitemap, and tag pages.
- A post with an unknown `templateVersion` or missing required field fails `astro build` with a message naming the file.
- `/blog/<slug>`, `/blog/tags/<tag>`, `/rss.xml` render; reading time matches word count / 200, rounded up.
- `:::note`, `:::tip`, `:::warn`, `::youtube{id=…}` and `::figure` render through the Sätteri directive plugin; an unknown directive name fails the build.

### Phase 4: Content migration

Migrate the 9 Medium posts per `content-migration.md` (original `publishedAt`, `createdAt` = same date, `updatedAt` = migration date, no `canonical` field so the page is self-canonical). Write Projects entries and About copy from the NDA-safe extract. Add the owner-supplied résumé PDF to `public/`.

**Acceptance**

- Every inventory row in `content-migration.md` has a matching folder under `content/blog/` with `publishedAt` equal to the Medium date.
- Projects page contains only entries marked low/medium sensitivity, phrased by problem shape; no employer-internal names.
- Resume page links the owner's PDF in `public/` and the PDF contains no phone number.

### Phase 5: SEO

Per-page `<title>`, description, OG/Twitter tags with a generated default OG image; `robots.txt`; `sitemap.xml` (excluding drafts); `llms.txt`; RSS autodiscovery link; JSON-LD `Person` on About with `sameAs` socials.

**Acceptance**

- `curl` of each page shows a unique title + description; OG image resolves.
- `sitemap.xml` has no draft URLs; `robots.txt` references the sitemap; `llms.txt` lists pages and posts.
- Rich-results test passes for `Person` JSON-LD.
- Migrated posts emit `<link rel="canonical" href="https://nnajiabraham.com/blog/<slug>">`.

### Phase 6: Polish

Micro-interactions from the design brief, 404 page, print stylesheet for Resume, favicon set, final a11y pass (axe), copy pass for voice and the no-em-dash rule.

**Acceptance**

- axe reports zero violations on all pages.
- Motion inventory in `design-brief.md` matches what shipped; nothing moves for users with reduced motion.
- Owner sign-off on copy.

## 4. Decisions & assumptions log

| # | Date | Decision / assumption | Rationale |
| --- | --- | --- | --- |
| D1 | 2026-09 | Astro is the framework; React only as islands. | Content site; islands keep JS near zero. Owner decision. |
| D2 | 2026-09-24 | **Astro 7 (currently 7.3.5), not 6.** Vite 8 with Rolldown; Rust `.astro` compiler; Sätteri Markdown pipeline by default; Node 22.12+. | Owner decision after the planning report. Satisfies the "latest Vite" wish; 7.0 has been stable since 2026-06-22 with three minor releases since. Supersedes the earlier "written against Astro 6" note. |
| D2a | 2026-09-24 | **Markdown processor: Sätteri (Astro 7 default) with `features: { directive: true }` and a small in-repo MDAST plugin for callouts and embeds.** Not `unified()`. | Sätteri parses remark-directive syntax natively, so `.md` posts keep the `:::note` / `::youtube{}` authoring format without pulling `@astrojs/markdown-remark` back in. The plugin API is typed (`defineMdastPlugin`), and the plugin we need is about 60 lines. Trade-off: existing remark/rehype plugins cannot be reused; anything we want must be written as a Sätteri MDAST/HAST plugin or done outside the pipeline. The `unified()` fallback remains one config line away and is documented in `blog-architecture.md` §9. |
| D2b | 2026-09-24 | Reading time is computed from `entry.body` in `src/lib/content.ts`, not by a Markdown plugin. | Pipeline-independent; works identically under Sätteri or unified; trivially testable. |
| D2c | 2026-09-24 | Heading IDs come from Astro's own `render(entry)` `headings` output; no autolink-headings plugin. TOC links to those IDs. | One fewer plugin. Anchor icons on hover were a nicety, not a requirement. |
| D2d | 2026-09-24 | MDX (`@astrojs/mdx` 8.x) is installed but posts are `.md` by default. MDX is the escape hatch for a post that needs a bespoke component. | Keeps the plain-Markdown portability argument while giving an alternative that does not depend on remark/rehype. |
| D3 | 2026-09 | Tailwind v4 via `@tailwindcss/vite`; design tokens as CSS variables in `@theme`. | v4 is CSS-first; tokens stay usable in plain CSS for the blog prose. |
| D4 | 2026-09 | pnpm, Node 22 LTS (22.12+). | Astro 7 requires Node 22.12+. |
| D5 | 2026-09 | Light theme only; warm off-white; never pure white or pure black. | Owner decision. Reduces token surface by half. |
| D6 | 2026-09 | Two font families max + one mono, self-hosted. Mockups may use Google Fonts links; production may not. | Owner decision; privacy and performance. |
| D6a | 2026-09-24 | **Type: Red Hat Display (headings/UI), Red Hat Text (body), Red Hat Mono (code).** | Follows from choosing direction B. One superfamily; all on Fontsource. |
| D7 | 2026-09 | Blog posts live at `content/blog/<slug>/index.md` (repo root `content/`, not `src/content/`). | Keeps writing separate from code; glob loader supports any base path. |
| D8 | 2026-09 | Two templates at launch: `article`, `note`. Versioned via `templateVersion`. | YAGNI; add types when a real post needs them. |
| D9 | 2026-09-24 | **Migrated Medium posts are canonical on nnajiabraham.com.** No `canonical` frontmatter on them; the page emits a self-referencing canonical. The owner may add "now on nnajiabraham.com" notes on Medium by hand. | Owner decision. |
| D10 | 2026-09 | No analytics, search, comments, newsletter at launch. | Owner decision. |
| D11 | 2026-09 | Projects section name: **"Cleared for Release"** (options in design brief). | Pilot phrasing, signals "only what I'm allowed to share", dry. |
| D12 | 2026-09-24 | Contact: `hello@nnajiabraham.com` + GitHub, LinkedIn, Medium, Twitter from `src/content/data.ts`. **Twitter stays.** No phone. | Owner decision. |
| D13 | 2026-09 | Netlify: production `master`; branch deploys `develop`, `staging`; deploy previews on PRs. | Owner decision. |
| D14 | 2026-09-24 | Legacy root `plan.md` (the completed 2025 CRA to Vite plan) **deleted**, not archived. Root has no `plan.md`; nothing linked to it. | Owner decision: nothing historical to keep. Git history has it if ever needed. |
| D15 | 2026-09-24 | **Résumé: the owner supplies the PDF.** The Resume page links it and mirrors it in HTML; nothing is generated from typed data. | Owner decision. |
| D16 | 2026-09-24 | **Copy style: no em dashes anywhere in site copy or these docs.** Commas, periods, or colons instead; middle dots (`·`) as separators in titles and metadata. | Owner decision. Applied to the three mockups and all planning docs. |
| D17 | 2026-09-24 | **Role statement** (hero): "I build developer platforms. Lately that means the infrastructure teams use to ship AI agents safely." Alternate in `design-brief.md` §2. Title "Senior Software Engineer"; location "BC, Canada". | Owner liked option 2's content and option 5's plainer tone. |
| D18 | 2026-09-24 | **Mockup direction: B (groundcrew) plus C's dark inverted album tile.** Mockups are a starting point, not a pixel spec; see §7. | Owner decision. |
| A1 | 2026-09 | The résumé PDF will be provided before Phase 4; the plan only links it. | No PDF exists in the repo yet. |
| A2 | 2026-09 | Spotify album and artist embeds may load third-party iframes after a click (facade pattern). | Zero-JS-until-interaction keeps Lighthouse honest. |
| A3 | 2026-09 | Medium posts can be re-published here (owner authored them). | Standard Medium terms permit authors to republish. |
| A4 | 2026-09-24 | Astro's built-in Shiki highlighting and heading-ID generation apply under the Sätteri processor as they did under unified. | Both are Astro-level features configured outside the processor. Verified as a Phase 1 acceptance check rather than assumed silently. |

## 5. Risks & trade-offs

| # | Risk / trade-off | Mitigation |
| --- | --- | --- |
| R1 | **Sätteri is new** (0.x package, `@astrojs/markdown-satteri` 0.4.x) and its plugin ecosystem is small; edge cases in directive parsing or plugin ordering may surface. | Our plugin is small and covered by fixture posts in `validate-content`. If blocked, switch `markdown.processor` to `unified()` from `@astrojs/markdown-remark` and use `remark-directive`; the authoring format is identical so no posts change. |
| R2 | Tailwind v4 + Astro scoped styles + blog prose: utility classes cannot style Markdown output; needs a `.prose` layer. | Write the prose layer in plain CSS using the tokens; do not depend on `@tailwindcss/typography` defaults (they assume pure white/black). |
| R3 | Neon green-yellow accent fails text contrast on off-white (1.1:1). | Accent is never used as text colour. It is a highlight background under ink text (11.8:1) or a 2 to 3 px underline/rule. Text-coloured accent uses `--color-accent-ink` (5.4:1). |
| R4 | Photos of the owner risk making the site feel like a portfolio of the person rather than the work. | Photos are small (max 320 px), max one per page except About, and only where the brief says. |
| R5 | Migration of Medium posts may lose formatting (code blocks, images). | Migrate by hand from the RSS `content:encoded`; 9 short posts. |
| R6 | pnpm + Netlify: Netlify auto-detects pnpm from `pnpm-lock.yaml` but needs `NODE_VERSION=22`. | Set in `netlify.toml` `[build.environment]`. |
| R7 | Schema strictness makes writing annoying. | The generator writes valid frontmatter; `status: draft` posts skip only publication, so half-written posts still typecheck. |
| R8 | Astro 7's Rust compiler rejects unclosed tags and no longer fixes invalid nesting; `compressHTML: 'jsx'` strips whitespace between inline elements. | Lint templates early; add `{" "}` where inline runs need a space, or set `compressHTML: true` if it becomes a chore. |
| R9 | Vite 8 / Rolldown: Vite plugins that touch Rollup internals may break. We use only `@tailwindcss/vite`, which supports Vite 8. | Keep the plugin list to that one. |
| R10 | Design iteration during implementation (§7) can drift from the fixed constraints. | The fixed list in §7 is short and checkable; CI greps for pure white/black, em dashes, and font families outside the chosen three. |

## 6. Handover (self-contained)

You are implementing a redesign of nnajiabraham.com, a personal site for Abraham Nnaji, Senior Software Engineer in BC, Canada. The current site is a Vite + React SPA in `src/`; you are replacing it with an Astro 7 site. You have no chat history; everything you need is in this folder.

### Read these, in order

1. This file (`plan.md`): goals, scope, phases, decisions, risks, and this handover.
2. [`design-brief.md`](./design-brief.md): voice, copy rules (no em dashes), palette tokens with contrast checks, type (Red Hat Display / Text / Mono), spacing, the twelve micro-interactions, photo rules, page-by-page inventory.
3. [`blog-architecture.md`](./blog-architecture.md): Astro 7 content collections, schema per template, Sätteri directive plugin for callouts/embeds, drafts, RSS/sitemap/llms.txt/robots.
4. [`content-migration.md`](./content-migration.md): the 9 Medium posts to migrate (dates, slugs, canonical on this site), NDA-safe project entries, blog post ideas.
5. [`mockups/README.md`](./mockups/README.md) and the chosen direction [`mockups/b-groundcrew/`](./mockups/b-groundcrew/) (`index.html`, `blog-post.html`, `about.html`), plus the album tile in [`mockups/c-greenhouse/index.html`](./mockups/c-greenhouse/index.html) (`.tile--music`). Screenshots in [`mockups/screenshots/`](./mockups/screenshots/).
6. [`README.md`](./README.md): folder index. [`../agents.md`](../agents.md): rules for the `docs/` folder, including where your two guides go.
7. Existing copy and social links to carry over: `src/content/data.ts` (repo root). Photos: `mockups/assets/`.

### Chosen direction and how to treat the mockups

**Direction B (groundcrew) with C's dark inverted album tile.** See §7 for what is fixed and what is open. The mockups are a starting point, not a pixel spec: the owner will run several agents building variants of B+C and iterate on the design during implementation. Build the structure and tokens so variants are cheap (tokens in one file, components small, no hard-coded colours or fonts).

### Deliverables

- [ ] Phase 1 tooling on a `develop` branch; PR against `master` with a deploy preview.
- [ ] `docs/2026-09-site-redesign/guides/astro-project-guide.md`: how Astro is used in this project. Project layout; pages, layouts, components, islands; how tokens flow from CSS variables to Tailwind `@theme` to components; how content collections and the Sätteri directive plugin are wired; how to run and debug the dev server; how the build is verified in CI; the Astro 7 gotchas hit (Rust compiler strictness, `compressHTML: 'jsx'`, `src/fetch.ts` reserved).
- [ ] `docs/2026-09-site-redesign/guides/pnpm-guide.md`: install, lockfile discipline, `pnpm dlx` vs `npx`, single-package conventions, how the Makefile wraps pnpm, Netlify and CI caveats.
- [ ] Phase 2 pages from direction B; delete `src/` SPA and its tests once parity is reached; update repo root `README.md` for the new stack (Makefile targets replace the npm script table).
- [ ] Phase 3 blog system; Phase 4 content migration; Phase 5 SEO; Phase 6 polish. Tick acceptance criteria per phase in §3 as you go.
- [ ] Mark this folder's `README.md` status `shipped`, and list what was cut.

### Acceptance checks (summary; details per phase in §3)

- CI green on lint, typecheck, `validate-content`, build; Netlify deploy preview per PR; production from `master`.
- Lighthouse mobile: at least 95 / 100 / 100 / at least 95 on Home and a post. axe: zero violations.
- Drafts never appear in `dist/`, RSS, sitemap, tags. Invalid frontmatter fails the build naming the file.
- 9 migrated posts with original dates and self-canonical URLs. No phone number anywhere. No employer-internal names.
- No pure white, no pure black, no em dashes, no font family outside Red Hat Display / Text / Mono in production output.
- `prefers-reduced-motion` disables all non-essential motion.

### Inputs you may need from the owner

- The résumé PDF (Phase 4). If it has not arrived, ship the Resume page with the HTML version and a placeholder link, and note it in the README.

### Design-variant iteration prompt

Ready to paste for an agent building design variants. Replace `<name>` with a short kebab-case variant name.

> Build a design variant named `<name>` of nnajiabraham.com as static HTML + CSS mockups in `docs/2026-09-site-redesign/mockups/variants/<name>/` with `index.html`, `blog-post.html`, `about.html`, a `style.css`, and minimal vanilla JS. Base it on `docs/2026-09-site-redesign/mockups/b-groundcrew/` (structure, tokens, copy) and use the dark inverted album tile from `mockups/c-greenhouse/index.html` (`.tile--music`). Read `docs/2026-09-site-redesign/design-brief.md` first and obey it.
>
> Fixed, do not change: the palette tokens and contrast rules (warm off-white paper, warm near-black ink, green-yellow accent never as text, no pure white or black); fonts Red Hat Display, Red Hat Text, Red Hat Mono only; the page inventory and content of each page; reduced-motion support; no emoji, no phone number, no employer-internal names. No em dashes anywhere in copy: use commas, periods, or colons.
>
> Open to variation: layout and composition, panels versus hairlines, spacing and radius values, which micro-interactions ship and their timing, photo placement within the photo rules, section labelling and iconography.
>
> Screenshot every page at 1440×900 and 390×844 into `mockups/variants/<name>/screenshots/`. Report: what you changed versus B, why it serves a recruiter on a phone first, and any rule you were tempted to break.

**Chosen mockup direction: B (groundcrew) plus C's dark inverted album tile.**

## 7. Design iteration during implementation

The owner will, in a separate chat, have several agents build variants of the B+C direction and iterate on the design while implementing. The mockups in `mockups/b-groundcrew/` are the starting point, not a pixel spec.

**Must stay fixed**

- Palette constraints: light theme only; warm off-white paper (`#F5F0E6` family, never pure white); warm near-black ink (`#2B2622` family, never pure black); mostly monochrome warm neutrals; light/neon green-yellow (`#C9F53A`) as the only accent, never as text colour; fall colours only as small hints. Every text/background pair meets WCAG AA (see `design-brief.md` §4).
- Type family choice: Red Hat Display (headings/UI), Red Hat Text (body), Red Hat Mono (code). Self-hosted. No other families.
- Page inventory: Home, About, Blog (index, post, tags), Projects ("Cleared for Release"), Resume (PDF link + HTML), Contact (mailto + socials), 404. Content per page as listed in `design-brief.md` §9.
- Blog architecture: everything in `blog-architecture.md` (folder layout, schema, template versioning, drafts, directive authoring format, RSS/sitemap/llms.txt/robots).
- Copy rules: no em dashes; no emoji in UI; no phone number; email only; NDA hygiene.
- Accessibility and motion rules: visible focus, reduced-motion support, no scroll-jacking or parallax, at most two owned motion moments per page.

**Open to variation**

- Layout and composition within a page (grid vs list, card vs row, where the data plate sits, whether the status strip exists).
- Which of the twelve micro-interactions ship first and their exact timing.
- Spacing and radius scale values, border weights, use of panels vs hairlines.
- Photo placement and crop within the photo rules.
- Section labelling details (index chips, mono eyebrows), iconography, the monogram (placeholder today).
- Prose styles for the blog (measure stays about 65ch).

Variants should be judged against the audience priority (recruiter on a phone first) and the acceptance checks in §6, not against the mockup pixels.
