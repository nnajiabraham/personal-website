# Plan: nnajiabraham.com redesign

Owner: Abraham Nnaji. Planning agent: Cursor cloud agent (Sept 2026). Implementer: a later agent (see §6 Handover, which is written to be read without any chat context).

## 1. Goals

1. **Make the site do a job.** Today it is a one-page terminal-styled résumé. The redesign turns it into a small personal site with a real blog, a projects page that survives an NDA, and a résumé/contact path a recruiter can complete in under a minute.
2. **Own the writing.** Move the existing Medium posts home, keep their original dates, and make publishing a new post a five-minute task with a generator and a schema that fails the build when metadata is wrong.
3. **Look like the person.** Warm, light, mostly monochrome, one sharp green-yellow accent, small photos where they mean something, few and delightful micro-interactions. Curious, friendly, a bit private, dry humour allowed.
4. **Modern tooling that can grow a backend.** TanStack Start (React) + Tailwind v4 + TypeScript + pnpm on Netlify. Launch as a fully prerendered static site; add server functions or API routes later without changing frameworks. CI lints, typechecks, validates content, builds. No analytics at launch.

Audience priority (owner's order): recruiters/hiring managers, then peers/engineers, then clients, then friends, then social media. Every layout decision defaults to the recruiter reading on a phone between meetings.

## 2. Scope

### In scope

- Six pages: Home, About, Blog (index + post + tag pages), Projects, Resume (PDF link), Contact. Plus 404.
- Blog system: MDX posts at `content/blog/<slug>/index.mdx` with a build-time content index, two templates (`article`, `note`), template versioning, drafts excluded from build, RSS, tag pages, reading time. See `blog-architecture.md`.
- Content migration of 9 Medium posts with original publish dates, canonical on nnajiabraham.com.
- Basic SEO: per-route title/description/OG, `robots.txt`, `sitemap.xml`, `llms.txt`, RSS, JSON-LD `Person` on About; all emitted as static files at build.
- Netlify: production from `master`, branch deploys for `develop` and `staging`, deploy previews on PRs, via `@netlify/vite-plugin-tanstack-start`.
- Makefile: `dev`, `build`, `preview`, `new-post TEMPLATE= SLUG=`, `lint`, `check`, `validate-content`, `deploy-status`.
- Two guides written by the implementer into `docs/2026-09-site-redesign/guides/`: a TanStack Start project guide and a pnpm guide.

### Out of scope

- Search, comments, newsletter, analytics, dark theme (light only by decision), CMS, i18n.
- Any server function or API route at launch. The architecture allows them (that is the point of choosing Start); none ship in this plan.
- Any phone number anywhere. Contact is email + socials only.
- Naming the employer's internal systems, partners, or customers in any content.
- Generating the résumé from typed data. The owner supplies the PDF.

## 3. Phases

Each phase is a mergeable unit. Phases 1 and 2 replace the current site; 3 to 6 can ship incrementally behind branch deploys.

### Phase 1: Tooling

Scaffold TanStack Start with Vite (`pnpm create @tanstack/start@latest` or `pnpm dlx @tanstack/cli@latest create`, file-based routing, React 19), TypeScript strict, Tailwind v4 (`@tailwindcss/vite`), `@netlify/vite-plugin-tanstack-start`, ESLint 9 flat config + Prettier, Makefile, GitHub Actions CI (lint, typecheck, validate-content, build), Netlify config (`vite build`, publish `dist/client`, Node 22, branch deploys, deploy previews). Enable `prerender: { enabled: true, crawlLinks: true, failOnError: true }` from day one.

**Acceptance**

- `make dev|build|preview|lint|check|validate-content|deploy-status` all exist and are documented in the pnpm guide.
- CI runs on PRs and on `master`, `develop`, `staging`; a failing zod schema fails the build.
- Netlify builds from `master` with the same command CI uses; deploy previews appear on PRs; Netlify CLI, if used, is 17.31+.
- `package.json` has no npm-specific scripts left; `pnpm-lock.yaml` is committed, `package-lock.json` deleted.
- `@tanstack/react-start` and `@tanstack/react-router` pinned to exact versions (the RC guidance is to lock, not float); Vite resolves to 8.x; Node 22.12+ in `netlify.toml` and CI.
- The pipeline checks in `blog-architecture.md` §9 pass on a throwaway post: MDX compiles with frontmatter validation, callout and YouTube components render, Shiki output is static HTML, a co-located image is hashed into `dist/client/assets`, reading time is computed, a draft post is absent from the build.
- `vite build` output: prerendered `index.html` files for every static route under `dist/client`, plus the Netlify server function. A request for a prerendered path in the deploy preview is served with no function invocation (check the `x-nf-request-id` and function logs).

### Phase 2: Start migration (pages + design system)

Port Home, About, Projects, Resume, Contact, 404 to Start file routes using direction B (groundcrew) with C's dark album tile (see §7). Implement design tokens as CSS variables consumed by Tailwind v4's `@theme`. Self-host Red Hat Display, Red Hat Text, and Red Hat Mono via `@fontsource-variable` or static `@fontsource` packages, preloaded from the root route `head()`. Micro-interactions are CSS plus small hooks; no TanStack Query, no client state library.

**Acceptance**

- Lighthouse (mobile) at least 95 performance, 100 accessibility, 100 best practices, at least 95 SEO on Home and a blog post. See R1 for why this is the hard one and what to do if it slips.
- Initial JS on Home under 130 kB gzipped (React 19 + Router + Start runtime + route chunk); measured in CI with a size-limit check.
- No CDN font requests in production; `font-display: swap` with size-adjusted fallbacks.
- All copy from `src/content/data.ts` that survives (socials, name, role, experience) moves to typed data files; no phone number; email only.
- Spotify embed on Home is a facade (static cover, then iframe on click) so it costs nothing until clicked.
- Every interactive element has a visible focus style; `prefers-reduced-motion` disables all non-essential motion.
- Root route renders `<HeadContent />` and `<Scripts />`; every route defines `head()` with title and description; 404 route returns status 404 when served by the function and is also prerendered to `/404.html`.
- No em dash (U+2014) in any rendered copy (a grep for the character across `src/` and `content/` returns nothing).

### Phase 3: Blog system

Implement `blog-architecture.md`: MDX pipeline, content index Vite plugin, two templates, `templateVersion`, generator script, reading time, drafts handling, tag pages, RSS, post route with code highlighting, callouts, tables, images, YouTube facade.

**Acceptance**

- `make new-post TEMPLATE=article SLUG=hello` creates `content/blog/hello/index.mdx` with valid frontmatter; `make validate-content` passes.
- A post with `status: draft` is absent from `dist/client` (no HTML, no JS chunk), the RSS feed, the sitemap, `llms.txt`, and tag pages.
- A post with an unknown `templateVersion` or missing required field fails `vite build` with a message naming the file and field.
- `/blog/<slug>/`, `/blog/tags/<tag>/`, `/rss.xml` are prerendered files; reading time matches word count / 200, rounded up.
- `<Callout>`, `<YouTube>`, `<Figure>` render from MDX; an import from outside `@/components/blog/*` inside `content/` fails lint.

### Phase 4: Content migration

Migrate the 9 Medium posts per `content-migration.md` (original `publishedAt`, `createdAt` = same date, `updatedAt` = migration date, no `canonical` field so the page is self-canonical). Write Projects entries and About copy from the NDA-safe extract. Add the owner-supplied résumé PDF to `public/`.

**Acceptance**

- Every inventory row in `content-migration.md` has a matching folder under `content/blog/` with `publishedAt` equal to the Medium date.
- Projects page contains only entries marked low/medium sensitivity, phrased by problem shape; no employer-internal names.
- Resume page links the owner's PDF in `public/` and the PDF contains no phone number.

### Phase 5: SEO

Per-route `head()` with `<title>`, description, OG/Twitter tags and a generated default OG image; `robots.txt`, `sitemap.xml`, `rss.xml`, `llms.txt` as server routes listed in `pages` so they prerender to static files; RSS autodiscovery link; JSON-LD `Person` on About via `head().scripts`.

**Acceptance**

- `curl` of each prerendered page shows a unique title + description; OG image resolves.
- `sitemap.xml` has no draft URLs; `robots.txt` references the sitemap; `llms.txt` lists pages and posts. All four exist as files in `dist/client` after `vite build`.
- Rich-results test passes for `Person` JSON-LD.
- Migrated posts emit `<link rel="canonical" href="https://nnajiabraham.com/blog/<slug>/">`.

### Phase 6: Polish

Micro-interactions from the design brief, 404 page, print stylesheet for Resume, favicon set, final a11y pass (axe), copy pass for voice and the no-em-dash rule, bundle review.

**Acceptance**

- axe reports zero violations on all pages.
- Motion inventory in `design-brief.md` matches what shipped; nothing moves for users with reduced motion.
- Owner sign-off on copy.

## 4. Decisions & assumptions log

| # | Date | Decision / assumption | Rationale |
| --- | --- | --- | --- |
| D1 | 2026-09-25 | **Framework: TanStack Start (React), replacing the earlier Astro decision.** Launch fully prerendered; add server functions / API routes later in the same codebase. | Owner decision. Astro can add endpoints too, but Start makes server functions and typed server routes first-class in the same router, which is the owner's stated growth path. Trade-offs: Start ships React and hydrates every page (no islands), so baseline client JS is roughly 90 to 120 kB gzipped versus near zero on Astro; Start is documented as a Release Candidate; there are no built-in content collections, so we own the Markdown pipeline (§D2). Sources: [Start overview](https://tanstack.com/start/latest/docs/framework/react/overview), [RC announcement](https://tanstack.com/blog/announcing-tanstack-start-v1). |
| D1a | 2026-09-25 | **Versions (verified on npm 2026-09-25):** `@tanstack/react-start` 1.168.58 (engines `node >= 22.12`, peer `vite >= 7`), `@tanstack/react-router` 1.170.39, `@netlify/vite-plugin-tanstack-start` 1.3.19 (peer `@tanstack/react-start >= 1.132`, `vite >= 7`, engines `node ^22.12 or >= 24`), `vite` 8.3.1. We use Vite 8. | Pin exact versions; the docs recommend locking rather than floating during RC. |
| D1b | 2026-09-25 | **Status: Release Candidate, not GA.** The overview page and the RC post (2025-09-23, which promises an in-place update when 1.0 ships) both still say RC. A third-party post claims a 1.0 tag on 2026-03-18; not corroborated by TanStack's own pages. | Treat as RC: pin versions, read release notes on every bump, keep the surface we use small (file routes, `head()`, loaders, prerender, server routes). |
| D1c | 2026-09-25 | **Rendering mode: full prerender (`prerender.enabled: true`, `crawlLinks: true`) with the Netlify plugin, not SPA mode.** | Prerender gives real HTML for SEO and the recruiter-on-a-phone case; SPA mode ships a shell and renders on the client, which the Start docs themselves call less SEO friendly. Source: [Static prerendering](https://tanstack.com/start/latest/docs/framework/react/guide/static-prerendering), [SPA mode](https://tanstack.com/start/latest/docs/framework/react/guide/spa-mode). |
| D1d | 2026-09-25 | **Netlify integration: `@netlify/vite-plugin-tanstack-start`; build `vite build`; publish `dist/client`.** The plugin always emits a serverless function for SSR/server routes; prerendered files in `dist/client` are served from the CDN first and the function only handles misses, server routes, and `/_serverFn/*`. Adding endpoints later means adding `server.handlers` to a route file or a `createServerFn`; no config change. | Source: [Netlify guide](https://docs.netlify.com/build/frameworks/framework-setup-guides/tanstack-start/), [Start hosting](https://tanstack.com/start/latest/docs/framework/react/guide/hosting), [Server routes](https://tanstack.com/start/latest/docs/framework/react/guide/server-routes). The "static-first, function on miss" ordering is standard Netlify behaviour for a publish dir plus functions; confirmed as a Phase 1 acceptance check rather than assumed silently (A4). |
| D1e | 2026-09-25 | **Dynamic routes** (`/blog/$slug`, `/blog/tags/$tag`) are prerendered by link crawling from `/blog/` (they are excluded from automatic discovery); as a belt-and-braces measure `pages` also lists every published slug and tag from the content index so nothing depends on a link existing. **Non-HTML routes** (`/rss.xml`, `/sitemap.xml`, `/robots.txt`, `/llms.txt`) are server routes with `GET` handlers listed in `pages` with `prerender: { enabled: true }`; Start's built-in `sitemap` option is disabled in favour of our own. **404** is the root route's `notFoundComponent`, also prerendered via `pages: [{ path: '/404', prerender: { outputPath: '/404.html' } }]`. | Source: static-prerendering guide ("Routes without components" and "Routes with path parameters" are not auto-discovered); [SEO guide](https://tanstack.com/start/latest/docs/framework/react/guide/seo) (server-route sitemap/robots). |
| D1f | 2026-09-25 | **Head/SEO:** every route defines `head()` returning `meta`, `links`, `scripts`; the root route renders `<HeadContent />` in `<head>` and `<Scripts />` before `</body>`. Post routes build `head()` from loader data (title, description, OG image, canonical, `BlogPosting` JSON-LD); About adds `Person` JSON-LD. Router dedupes `title` and `meta` by name/property, last wins. | Source: [Document head management](https://tanstack.com/router/latest/docs/framework/react/guide/document-head-management). |
| D2 | 2026-09-25 | **Content pipeline: MDX via `@mdx-js/rollup` plus a small in-repo Vite plugin that builds a typed, zod-validated content index (`virtual:blog-index`) at build time.** Not Velite, not `@content-collections/*`, not a standalone unified script. Full comparison in `blog-architecture.md` §2. | Only this option makes each post a normal code-split ES module: prerendered HTML contains the rendered post once, the post's JS is one lazy chunk, and nothing about the post is serialised into loader data. Velite and content-collections compile MDX to a code string that must travel through loader data (so the post ships twice: as HTML and as a string in the dehydrated state) and be evaluated at runtime. A unified script producing HTML strings has the same double-shipping problem. Cost: we maintain about 150 lines of plugin and lose the off-the-shelf watch/typegen those tools provide (Vite HMR covers most of it). |
| D2a | 2026-09-25 | Posts are `.mdx`. Callouts, figures, and YouTube are React components passed via MDX `components`; no directive syntax. remark: `remark-frontmatter`, `remark-mdx-frontmatter`, `remark-gfm`. rehype: `rehype-slug`, `rehype-mdx-import-media` (turns `![alt](./x.jpg)` into an import so Vite hashes and serves the co-located asset), `rehype-pretty-code` (Shiki, static HTML at build). | Standard, boring MDX 3 stack; every plugin is remark/rehype, which is what Vite MDX runs. |
| D2b | 2026-09-25 | Reading time and word count are computed by the content-index plugin from the MDX source (frontmatter and code fences stripped) and exposed on the index entry. | Pipeline-independent; one source of truth for lists, RSS, and the post header. |
| D2c | 2026-09-25 | Heading IDs from `rehype-slug`; the TOC is built by the content-index plugin from the MDX source (headings h2 and h3) so it is available to the route without rendering the body. | No client-side DOM scan; TOC is in the prerendered HTML. |
| D2d | 2026-09-25 | Drafts and future-dated posts are removed from the content index in production builds, so no import reference to them exists and Vite emits neither HTML nor a chunk. In `vite dev` they appear with a DRAFT banner. | Makes "drafts never in build" a property of the module graph, not of a filter every consumer must remember. |
| D3 | 2026-09 | Tailwind v4 via `@tailwindcss/vite`; design tokens as CSS variables in `@theme`. | v4 is CSS-first; tokens stay usable in plain CSS for the blog prose. |
| D4 | 2026-09-25 | pnpm, Node 22 LTS (22.12+). | Start and the Netlify plugin both require Node 22.12+. |
| D5 | 2026-09 | Light theme only; warm off-white; never pure white or pure black. | Owner decision. Reduces token surface by half. |
| D6 | 2026-09 | Two font families max + one mono, self-hosted. Mockups may use Google Fonts links; production may not. | Owner decision; privacy and performance. |
| D6a | 2026-09-24 | **Type: Red Hat Display (headings/UI), Red Hat Text (body), Red Hat Mono (code).** | Follows from choosing direction B. One superfamily; all on Fontsource. |
| D7 | 2026-09 | Blog posts live at `content/blog/<slug>/index.mdx` (repo root `content/`, not `src/`). | Keeps writing separate from code; the content-index plugin reads any base path. |
| D8 | 2026-09 | Two templates at launch: `article`, `note`. Versioned via `templateVersion`. | YAGNI; add types when a real post needs them. |
| D9 | 2026-09-24 | **Migrated Medium posts are canonical on nnajiabraham.com.** No `canonical` frontmatter on them; the page emits a self-referencing canonical. | Owner decision. |
| D10 | 2026-09 | No analytics, search, comments, newsletter at launch. | Owner decision. |
| D11 | 2026-09 | Projects section name: **"Cleared for Release"** (options in design brief). | Pilot phrasing, signals "only what I'm allowed to share", dry. |
| D12 | 2026-09-24 | Contact: `hello@nnajiabraham.com` + GitHub, LinkedIn, Medium, Twitter from `src/content/data.ts`. **Twitter stays.** No phone. | Owner decision. |
| D13 | 2026-09 | Netlify: production `master`; branch deploys `develop`, `staging`; deploy previews on PRs. | Owner decision. |
| D14 | 2026-09-24 | Legacy root `plan.md` (the completed 2025 CRA to Vite plan) **deleted**, not archived. | Owner decision: nothing historical to keep. |
| D15 | 2026-09-24 | **Résumé: the owner supplies the PDF.** The Resume page links it and mirrors it in HTML; nothing is generated from typed data. | Owner decision. |
| D16 | 2026-09-24 | **Copy style: no em dashes anywhere in site copy or these docs.** Commas, periods, or colons instead; middle dots (`·`) as separators in titles and metadata. | Owner decision. Applied to the three mockups and all planning docs. |
| D17 | 2026-09-24 | **Role statement** (hero): "I build developer platforms. Lately that means the infrastructure teams use to ship AI agents safely." Alternate in `design-brief.md` §2. Title "Senior Software Engineer"; location "BC, Canada". | Owner liked option 2's content and option 5's plainer tone. |
| D18 | 2026-09-24 | **Mockup direction: B (groundcrew) plus C's dark inverted album tile.** Mockups are a starting point, not a pixel spec; see §7. | Owner decision. |
| D19 | 2026-09-25 | Superseded: the Astro 7 / Sätteri decisions from 2026-09-24 (old D2, D2a to D2d, A4, R1, R8, R9). Kept only in git history. | Framework change (D1). |
| A1 | 2026-09 | The résumé PDF will be provided before Phase 4; the plan only links it. | No PDF exists in the repo yet. |
| A2 | 2026-09 | Spotify album and artist embeds may load third-party iframes after a click (facade pattern). | Zero-JS-until-interaction keeps Lighthouse honest. |
| A3 | 2026-09 | Medium posts can be re-published here (owner authored them). | Standard Medium terms permit authors to republish. |
| A4 | 2026-09-25 | On Netlify with the Start plugin, a prerendered file under `dist/client` is served without invoking the function, and only misses reach the function. | Standard publish-dir-first behaviour; the plugin README and Netlify guide do not spell it out. Verified in Phase 1 acceptance. |
| A5 | 2026-09-25 | `import.meta.glob` is not used for post bodies; the content-index plugin emits explicit `() => import('/content/blog/<slug>/index.mdx')` thunks, which Vite code-splits per post. | Avoids bundling every post into one chunk and lets drafts be omitted from the graph entirely. |

## 5. Risks & trade-offs

| # | Risk / trade-off | Mitigation |
| --- | --- | --- |
| R1 | **Client JS and the Lighthouse 95 mobile target.** Start hydrates the whole page with React 19 + Router + Start runtime (order of 90 to 120 kB gzipped before our code), where Astro would ship near zero. On a 4G-throttled mobile Lighthouse run this costs Total Blocking Time and LCP headroom. | Per-route code splitting (default with file routes); no TanStack Query, no UI library, no icon font (inline SVG only); MDX compiled to static HTML at build (Shiki output is HTML, not a runtime highlighter); fonts preloaded and subset; Spotify/YouTube as facades; `defaultPreload: 'intent'` so hover prefetch replaces heavy eager loading; size-limit check in CI (130 kB gz initial on Home). If 95 is still missed after that, the fallback is Start's SPA mode for nothing (we lose SEO) or accepting 90+, which the owner must decide; document the measured number in the README. |
| R2 | **Start is RC.** APIs are declared stable but the label has not moved since 2025-09; patch releases are frequent (1.168.x). | Pin exact versions; a Renovate/Dependabot PR per bump with the deploy preview as the test; keep our usage to the documented core (file routes, loaders, `head()`, prerender, server routes). |
| R3 | **We own the content pipeline** (about 150 lines of Vite plugin plus MDX config). Bugs are ours; there is no upstream to file against. | Fixture posts under `content/templates/fixtures/` exercised by `validate-content` and by the build; the plugin is plain TypeScript with unit tests on the scanner and schema. Velite or content-collections remain a documented fallback if the plugin becomes a burden (`blog-architecture.md` §2). |
| R4 | **Prerender completeness.** Dynamic routes only prerender if crawled or listed. A tag page nobody links to would silently be missing. | The content-index plugin also produces the `pages` list for `tanstackStart()`, so every published slug and tag is enumerated explicitly; `failOnError: true`; a CI step diffs `dist/client` against the index. |
| R5 | Neon green-yellow accent fails text contrast on off-white (1.1:1). | Accent is never used as text colour; see `design-brief.md` §4. |
| R6 | Photos of the owner risk making the site feel like a portfolio of the person rather than the work. | Photos are small (max 320 px), max one per page except About, and only where the brief says. |
| R7 | Migration of Medium posts may lose formatting (code blocks, images). | Migrate by hand from the RSS `content:encoded`; 9 short posts. |
| R8 | pnpm + Netlify: Netlify auto-detects pnpm from `pnpm-lock.yaml` but needs `NODE_VERSION=22`. | Set in `netlify.toml` `[build.environment]`. |
| R9 | Schema strictness makes writing annoying. | The generator writes valid frontmatter; `status: draft` posts skip only publication, so half-written posts still typecheck. |
| R10 | Hydration mismatches from date formatting, `Math.random`, or `window` access in components. | Format dates at build (in the content index) as strings; no locale-dependent rendering in components; `useEffect` for anything browser-only. |
| R11 | Design iteration during implementation (§7) can drift from the fixed constraints. | The fixed list in §7 is short and checkable; CI greps for pure white/black, em dashes, and font families outside the chosen three. |
| R12 | Vite 8 / Rolldown: plugins that touch Rollup internals may break. We use `@tailwindcss/vite`, `@mdx-js/rollup`, the Start plugin, and the Netlify plugin. | All four declare Vite 8 support or are Vite-agnostic Rollup plugins; verify in the Phase 1 build. |

## 6. Handover (self-contained)

You are implementing a redesign of nnajiabraham.com, a personal site for Abraham Nnaji, Senior Software Engineer in BC, Canada. The current site is a Vite + React SPA in `src/`; you are replacing it with a TanStack Start site that is fully prerendered at launch and can grow server functions later. You have no chat history; everything you need is in this folder.

### Read these, in order

1. This file (`plan.md`): goals, scope, phases, decisions, risks, and this handover.
2. [`design-brief.md`](./design-brief.md): voice, copy rules (no em dashes), palette tokens with contrast checks, type (Red Hat Display / Text / Mono), spacing, the twelve micro-interactions, photo rules, page-by-page inventory.
3. [`blog-architecture.md`](./blog-architecture.md): MDX pipeline, content-index Vite plugin, schema per template, drafts, RSS/sitemap/llms.txt/robots as prerendered server routes, generator and validation scripts.
4. [`content-migration.md`](./content-migration.md): the 9 Medium posts to migrate (dates, slugs, canonical on this site), NDA-safe project entries, blog post ideas.
5. [`mockups/README.md`](./mockups/README.md) and the chosen direction [`mockups/b-groundcrew/`](./mockups/b-groundcrew/) (`index.html`, `blog-post.html`, `about.html`), plus the album tile in [`mockups/c-greenhouse/index.html`](./mockups/c-greenhouse/index.html) (`.tile--music`). Screenshots in [`mockups/screenshots/`](./mockups/screenshots/).
6. [`README.md`](./README.md): folder index. [`../agents.md`](../agents.md): rules for the `docs/` folder, including where your two guides go.
7. Existing copy and social links to carry over: `src/content/data.ts` (repo root). Photos: `mockups/assets/`.
8. External: [Netlify TanStack Start guide](https://docs.netlify.com/build/frameworks/framework-setup-guides/tanstack-start/), [Start static prerendering](https://tanstack.com/start/latest/docs/framework/react/guide/static-prerendering), [Router document head](https://tanstack.com/router/latest/docs/framework/react/guide/document-head-management), [Start server routes](https://tanstack.com/start/latest/docs/framework/react/guide/server-routes).

### Chosen direction and how to treat the mockups

**Direction B (groundcrew) with C's dark inverted album tile.** See §7 for what is fixed and what is open. The mockups are a starting point, not a pixel spec: the owner will run several agents building variants of B+C and iterate on the design during implementation. Build the structure and tokens so variants are cheap (tokens in one file, components small, no hard-coded colours or fonts).

### Deliverables

- [ ] Phase 1 tooling on a `develop` branch; PR against `master` with a deploy preview.
- [ ] `docs/2026-09-site-redesign/guides/tanstack-start-project-guide.md`: how Start is used in this project. Project layout (`src/routes/`, `src/router.tsx`, `src/server.ts` if any, `content/`); file-route conventions used (`$slug`, `[.]xml` escaping, `__root.tsx`); how `head()`, loaders, and `notFoundComponent` are used; the prerender and `pages` configuration and where the list comes from; the content-index plugin and MDX config; how tokens flow from CSS variables to Tailwind `@theme` to components; how to add a server function or server route later and what changes on Netlify when you do; how to run and debug `vite dev` with the Netlify plugin's emulation; how the build is verified in CI; the Start gotchas hit.
- [ ] `docs/2026-09-site-redesign/guides/pnpm-guide.md`: install, lockfile discipline, `pnpm dlx` vs `npx`, single-package conventions, how the Makefile wraps pnpm, Netlify and CI caveats.
- [ ] Phase 2 pages from direction B; delete the old `src/` SPA and its tests once parity is reached; update repo root `README.md` for the new stack (Makefile targets replace the npm script table).
- [ ] Phase 3 blog system; Phase 4 content migration; Phase 5 SEO; Phase 6 polish. Tick acceptance criteria per phase in §3 as you go.
- [ ] Mark this folder's `README.md` status `shipped`, record the measured Lighthouse and initial-JS numbers, and list what was cut.

### Acceptance checks (summary; details per phase in §3)

- CI green on lint, typecheck, `validate-content`, build; Netlify deploy preview per PR; production from `master`.
- Every page and every published post exists as a prerendered file under `dist/client`; `rss.xml`, `sitemap.xml`, `robots.txt`, `llms.txt`, `404.html` too.
- Lighthouse mobile: at least 95 / 100 / 100 / at least 95 on Home and a post; initial JS on Home under 130 kB gzipped. axe: zero violations.
- Drafts never appear in `dist/client`, RSS, sitemap, tags. Invalid frontmatter fails the build naming the file.
- 9 migrated posts with original dates and self-canonical URLs. No phone number anywhere. No employer-internal names.
- No pure white, no pure black, no em dashes, no font family outside Red Hat Display / Text / Mono in production output.
- `prefers-reduced-motion` disables all non-essential motion.

### Inputs you may need from the owner

- The résumé PDF (Phase 4). If it has not arrived, ship the Resume page with the HTML version and a placeholder link, and note it in the README.
- A decision if Lighthouse mobile performance lands between 90 and 95 after the R1 mitigations.

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
- Blog architecture: everything in `blog-architecture.md` (folder layout, schema, template versioning, drafts, MDX components, RSS/sitemap/llms.txt/robots).
- Copy rules: no em dashes; no emoji in UI; no phone number; email only; NDA hygiene.
- Accessibility and motion rules: visible focus, reduced-motion support, no scroll-jacking or parallax, at most two owned motion moments per page.
- Performance budget: initial JS on Home under 130 kB gzipped; no new runtime dependencies for visual effects.

**Open to variation**

- Layout and composition within a page (grid vs list, card vs row, where the data plate sits, whether the status strip exists).
- Which of the twelve micro-interactions ship first and their exact timing.
- Spacing and radius scale values, border weights, use of panels vs hairlines.
- Photo placement and crop within the photo rules.
- Section labelling details (index chips, mono eyebrows), iconography, the monogram (placeholder today).
- Prose styles for the blog (measure stays about 65ch).

Variants should be judged against the audience priority (recruiter on a phone first) and the acceptance checks in §6, not against the mockup pixels.
