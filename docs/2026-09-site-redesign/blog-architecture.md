# Blog architecture: TanStack Start + MDX + a build-time content index

Written against **TanStack Start 1.168.x with Vite 8** (verified on npm 2026-09-25; Start is documented as Release Candidate). Start has no built-in content layer, so this document is the content layer. Requirements are unchanged from the original plan: posts at `content/blog/<slug>/index.mdx` with co-located assets; `article` and `note` templates with `templateVersion`; the build fails on invalid frontmatter; drafts are never built; callouts, embeds, code highlighting, images, tables, YouTube; RSS and tag pages; reading time; Medium posts with original dates and self-canonical URLs.

## 1. Folder layout

```
content/
  blog/
    writing-a-linkedlist-in-golang/
      index.mdx
      cover.jpg                  # optional, referenced as ./cover.jpg
      linkedlist-diagram.svg
    ubuntu-ultrawide-monitor-fix/
      index.mdx
  templates/                     # generator sources, NOT posts
    article.mdx
    note.mdx
    fixtures/
      everything.mdx             # uses every component and syntax feature; compiled by validate-content
src/
  routes/
    __root.tsx                   # <html>, <HeadContent/>, <Scripts/>, notFoundComponent, global head()
    index.tsx                    # Home (latest 3 posts from the index)
    about.tsx
    projects.tsx
    resume.tsx
    contact.tsx
    blog.index.tsx               # /blog
    blog.$slug.tsx               # /blog/<slug>
    blog.tags.$tag.tsx           # /blog/tags/<tag>
    rss[.]xml.ts                 # server route, GET, prerendered
    sitemap[.]xml.ts
    robots[.]txt.ts
    llms[.]txt.ts
  content/
    schema.ts                    # zod schemas per template + union (shared by plugin, script, and routes)
    index.ts                     # typed access: getPublishedPosts(), getPost(slug), getTags()
  components/blog/
    Callout.tsx
    YouTube.tsx                  # facade; iframe on click
    Figure.tsx
    Prose.tsx                    # wraps MDX output, supplies `components` map
    Toc.tsx
  lib/
    seo.ts                       # head() helpers: page meta, OG, JSON-LD
plugins/
  content-index.ts               # Vite plugin: scans content/blog, validates, emits virtual:blog-index and the prerender pages list
scripts/
  new-post.ts                    # make new-post TEMPLATE= SLUG=
  validate-content.ts            # make validate-content
vite.config.ts
```

Posts live in repo-root `content/`, not `src/`, so writing and code stay visually separate. Co-located assets are ordinary Vite assets: `rehype-mdx-import-media` rewrites `![alt](./cover.jpg)` in MDX into an import, so Vite hashes the file into `dist/client/assets/` and the `<img>` gets the final URL. Frontmatter `cover` is resolved the same way by the plugin (it emits an import for it).

## 2. Content pipeline comparison and decision

Start compiles routes with Vite and prerenders by running the SSR build, so the question is: how does a post become (1) typed metadata for lists, feeds, and `head()`, and (2) rendered HTML in the prerendered page, with as little client JS as possible?

| | (a) MDX via `@mdx-js/rollup` + in-repo content index | (b) Velite 0.4 | (c) `@content-collections/*` 0.15 | (d) small build-time unified script |
| --- | --- | --- | --- | --- |
| Frontmatter validation | zod in our plugin; build fails naming file and field | zod-based `s.*` schema; build fails | zod schema; build fails | zod in script; must be wired to fail the Vite build |
| Post body at runtime | a normal ES module (React component), one lazy chunk per post; rendered once into prerendered HTML | compiled MDX **code string** in JSON; evaluated with `new Function` at render; travels through loader data | compiled MDX **code string**; `useMDXComponent` evaluates at render; travels through loader data | HTML string; `dangerouslySetInnerHTML`; travels through loader data |
| Payload per post page | HTML once + one small JS chunk | HTML once **plus the code string again** in the dehydrated loader state | same double-shipping | HTML once **plus the HTML string again** in dehydrated state |
| Co-located images | `rehype-mdx-import-media` → Vite asset pipeline (hashed, served from `dist/client/assets`) | built in (`s.image()`, `copyLinkedFiles`) copies to `public/static` | not built in; custom transform needed | not built in; copy step needed |
| Code highlighting | `rehype-pretty-code` (Shiki) at build → static HTML | rehype plugins supported | rehype plugins supported | any |
| Components in content | native MDX (`<Callout>`), typed props | MDX with components map at runtime | MDX with components map at runtime | none without a directive layer |
| Drafts never built | plugin drops them from the index, so no import edge exists → no chunk, no HTML | filter in Velite config → absent from JSON | filter in `transform` → absent from JSON | filter in script |
| Watch / HMR | Vite handles MDX HMR; plugin re-scans on `content/**` change via `configureServer` watcher | Velite watcher + Vite | Vite plugin with watch | manual `--watch` |
| Typegen | plugin emits `virtual:blog-index.d.ts` from the zod schema (`z.infer`) | generated `.velite/index.d.ts` | generated types | manual |
| Maintenance owner | us (about 150 lines) | Velite (single maintainer, 0.x) | content-collections (small team, 0.x) | us |
| Ecosystem status | MDX 3.1, stable | 0.4.0 (2026-06) | core 0.15.3 (2026-09) | n/a |

**Decision: (a), MDX via `@mdx-js/rollup` plus an in-repo content-index Vite plugin (plan D2).**

Why: it is the only option where the post body is a code-split module rather than a string smuggled through loader data. On a framework that already hydrates every page (plan R1), not shipping each post twice is worth more than the convenience of Velite or content-collections. It also keeps components first-class (real React components with typed props, no directive syntax to invent), and everything in the chain is standard Vite/MDX.

Cons, honestly: we own the plugin (validation, index, reading time, TOC, prerender pages list); Velite's image helpers and content-collections' typegen are nicer than what we will write; `.mdx` is less portable than `.md` (mitigated by keeping components to three and by never importing outside `@/components/blog/*`). If the plugin becomes a burden, (b) or (c) can replace the index while the MDX files stay as they are; the double-shipping cost would return.

## 3. Vite config

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import netlify from '@netlify/vite-plugin-tanstack-start';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@mdx-js/rollup';
import remarkFrontmatter from 'remark-frontmatter';
import remarkMdxFrontmatter from 'remark-mdx-frontmatter';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeMdxImportMedia from 'rehype-mdx-import-media';
import rehypePrettyCode from 'rehype-pretty-code';
import { contentIndex, prerenderPages } from './plugins/content-index';

const SITE = 'https://nnajiabraham.com';

export default defineConfig({
  plugins: [
    // MDX must run before React so JSX in .mdx is transformed by the React plugin.
    { enforce: 'pre', ...mdx({
      providerImportSource: '@mdx-js/react',
      remarkPlugins: [remarkFrontmatter, [remarkMdxFrontmatter, { name: 'frontmatter' }], remarkGfm],
      rehypePlugins: [rehypeSlug, rehypeMdxImportMedia, [rehypePrettyCode, { theme: 'warm-paper' /* custom Shiki theme from tokens */, keepBackground: false }]],
    }) },
    contentIndex({ dir: 'content/blog', site: SITE }),
    tanstackStart({
      prerender: { enabled: true, crawlLinks: true, failOnError: true, autoSubfolderIndex: true },
      // Every published slug, tag page, non-HTML route, and /404 enumerated from the index.
      // Belt and braces: crawlLinks would find most of these, but nothing depends on a link existing.
      pages: prerenderPages({ dir: 'content/blog' }),
      sitemap: { enabled: false },  // we emit our own from a server route
    }),
    viteReact(),
    tailwindcss(),
    netlify(),
  ],
});
```

`prerenderPages()` returns entries like `{ path: '/blog/<slug>' }`, `{ path: '/blog/tags/<tag>' }`, `{ path: '/rss.xml', prerender: { enabled: true } }`, `{ path: '/sitemap.xml', … }`, `{ path: '/robots.txt', … }`, `{ path: '/llms.txt', … }`, and `{ path: '/404', prerender: { enabled: true, outputPath: '/404.html' } }`. Server routes have no component, so they are never auto-discovered and must be listed; the Start docs say so explicitly.

Netlify: `netlify.toml` gets `[build] command = "vite build"`, `publish = "dist/client"`, `[build.environment] NODE_VERSION = "22"`. The plugin emits the server function; prerendered files are served from the CDN and the function only sees misses, server routes at request time (none at launch, since those are prerendered too), and `/_serverFn/*` (none at launch).

## 4. Frontmatter schema per template

```ts
// src/content/schema.ts
import { z } from 'zod';

const isoDate = z.coerce.date();
const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'kebab-case only');
const tag = z.string().regex(/^[a-z0-9-]+$/);

const base = {
  title: z.string().min(3).max(90),
  slug,
  description: z.string().min(20).max(200),
  createdAt: isoDate,
  publishedAt: isoDate.optional(),
  updatedAt: isoDate.optional(),
  status: z.enum(['draft', 'published']).default('draft'),
  tags: z.array(tag).min(1).max(6),
  series: z.object({ name: z.string(), part: z.number().int().positive() }).optional(),
  canonical: z.string().url().optional(),   // only when another site is canonical; unset for migrated posts (D9)
};

export const ARTICLE_VERSION = 1;
export const NOTE_VERSION = 1;

export const postSchema = z.discriminatedUnion('template', [
  z.object({
    ...base,
    template: z.literal('article'),
    templateVersion: z.literal(ARTICLE_VERSION),
    cover: z.object({ src: z.string().startsWith('./'), alt: z.string().min(5) }).optional(),
    toc: z.boolean().default(true),
  }),
  z.object({
    ...base,
    template: z.literal('note'),
    templateVersion: z.literal(NOTE_VERSION),
    title: base.title.max(70),
  }),
]).superRefine((p, ctx) => {
  if (p.status === 'published' && !p.publishedAt) ctx.addIssue({ code: 'custom', message: 'published posts need publishedAt', path: ['publishedAt'] });
  if (p.publishedAt && p.publishedAt < p.createdAt) ctx.addIssue({ code: 'custom', message: 'publishedAt before createdAt', path: ['publishedAt'] });
  if (p.updatedAt && p.publishedAt && p.updatedAt < p.publishedAt) ctx.addIssue({ code: 'custom', message: 'updatedAt before publishedAt', path: ['updatedAt'] });
});

export type PostFrontmatter = z.infer<typeof postSchema>;
```

### Field reference

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `title` | string | yes | max 90 (article), max 70 (note) |
| `slug` | kebab string | yes | must equal folder name; the plugin asserts it |
| `description` | string 20 to 200 | yes | meta description, RSS, list rows |
| `createdAt` | date | yes | when the draft was started; for migrated posts equals `publishedAt` |
| `publishedAt` | date | if published | original Medium date for migrations |
| `updatedAt` | date | no | shown as "Updated" when it differs from `publishedAt` |
| `status` | `draft` or `published` | default `draft` | drafts never in build (§8) |
| `template` | `article` or `note` | yes | picks layout inside `blog.$slug.tsx` |
| `templateVersion` | int literal | yes | must equal the current version for that template (§5) |
| `tags` | 1 to 6 kebab strings | yes | tag pages generated from the union of tags |
| `cover` | `{src, alt}` | no (article only) | relative path; plugin turns it into an asset import; used as OG image |
| `series` | `{name, part}` | no | renders a series box with prev/next in the series |
| `canonical` | url | no | emits `<link rel=canonical>` to that URL; otherwise the page is self-canonical |
| `toc` | boolean | default true (article only) | disables TOC for short articles |

Computed by the plugin, not written by authors: `readingTime` (words / 200, rounded up, code fences and frontmatter stripped), `wordCount`, `headings` (h2/h3 with slugs matching `rehype-slug`), `url`, and formatted date strings (formatted at build so SSR and client agree; see plan R10).

## 5. Template versioning strategy

- Each template has a single integer `*_VERSION` constant. The schema uses `z.literal(VERSION)`, so a post whose `templateVersion` does not match fails the build with the file path and field name. There is no silent "old posts render with old layout".
- Bump the version when the layout's contract with frontmatter changes (a field added/removed/renamed or its meaning changes). Do not bump for pure CSS changes.
- Bumping requires a codemod in the same PR: `scripts/migrate-template.ts --template article --from 1 --to 2` rewrites frontmatter for every matching post. Tests cover the codemod on a fixture folder.
- `content/templates/<name>.mdx` (generator source) carries the current version and is the single example of a valid post; `validate-content` parses these too, so the generator can never produce an invalid post.

Trade-off: `z.literal` is strict; a repo with hundreds of posts would prefer `z.union` of supported versions with per-version layouts. At this blog's size, one version at a time plus a codemod is simpler.

## 6. The content-index plugin

`plugins/content-index.ts` is a Vite plugin (about 150 lines) that does at build and dev time what Astro's content layer did for us:

1. **Scan** `content/blog/*/index.mdx`. Parse frontmatter with `gray-matter`. Validate with `postSchema`. On failure, throw an error with the file path and the zod issue path; Vite aborts the build.
2. **Assert** `slug === folder name`; reject duplicate slugs and duplicate tags differing only by case.
3. **Compute** `readingTime`, `wordCount`, `headings` (regex over `^##{1,2} ` lines, slugged with `github-slugger` so IDs match `rehype-slug`), `url`, formatted dates.
4. **Filter** by mode: in `vite build`, drop `status: draft` and `publishedAt > now`; in `vite dev`, keep them and mark `isDraft: true`.
5. **Emit** `virtual:blog-index`:

```ts
// what `import { posts } from 'virtual:blog-index'` resolves to (generated)
export const posts = [
  {
    slug: 'prompt-promotion-is-a-release',
    url: '/blog/prompt-promotion-is-a-release/',
    frontmatter: { /* validated, dates as ISO strings */ },
    readingTime: 9, wordCount: 1840,
    headings: [{ depth: 2, text: 'Pins', id: 'pins' }, /* … */],
    cover: () => import('/content/blog/prompt-promotion-is-a-release/cover.jpg?url'),
    load: () => import('/content/blog/prompt-promotion-is-a-release/index.mdx'),
  },
  // …
] as const;
export const tags = ['agents', 'evals', /* … */];
```

   Each `load` thunk is a real dynamic import, so Vite code-splits one chunk per post and never bundles drafts (there is no import edge to them). A companion `virtual:blog-index.d.ts` is written to `src/` so the export is typed from `z.infer`.
6. **Watch** `content/**` in `configureServer`; on change, invalidate the virtual module so the index and HMR update.
7. **Export** `prerenderPages()` for `vite.config.ts` (§3), using the same scan, so the prerender list and the index cannot disagree.

`src/content/index.ts` wraps the virtual module with `getPublishedPosts()` (sorted by `publishedAt` desc), `getPost(slug)`, `getTags()`, `getPostsByTag(tag)`. Routes import only from here; a lint rule forbids importing `virtual:blog-index` elsewhere.

## 7. Routes, rendering, and head

```tsx
// src/routes/blog.$slug.tsx
import { createFileRoute, notFound } from '@tanstack/react-router';
import { getPost } from '@/content';
import { postHead } from '@/lib/seo';
import { Prose } from '@/components/blog/Prose';

export const Route = createFileRoute('/blog/$slug')({
  loader: ({ params }) => {
    const post = getPost(params.slug);
    if (!post) throw notFound();
    return { post };                                    // metadata only; this is what gets serialised for hydration
  },
  head: ({ loaderData }) => postHead(loaderData.post), // title, description, OG, canonical, BlogPosting JSON-LD
  component: PostPage,
});

// One lazy component per slug, created once per module so React keeps its identity across renders.
const bodies = new Map<string, React.LazyExoticComponent<React.ComponentType>>();
function bodyFor(post: Post) {
  let Body = bodies.get(post.slug);
  if (!Body) { Body = React.lazy(post.load); bodies.set(post.slug, Body); }
  return Body;
}

function PostPage() {
  const { post } = Route.useLoaderData();
  const Body = bodyFor(post);
  const Layout = post.frontmatter.template === 'article' ? ArticleLayout : NoteLayout;
  return (
    <Layout post={post}>
      <Prose><React.Suspense fallback={null}><Body /></React.Suspense></Prose>
    </Layout>
  );
}
```

Serialisation note: Start serialises loader data into the HTML for hydration, so the loader returns only metadata. The body is a `React.lazy` module resolved during prerender (React 19 SSR waits for lazy boundaries) and fetched as one chunk on client navigation. The post body therefore appears once in the HTML and never in the dehydrated state. If `React.lazy` inside SSR proves awkward in Start, the fallback is the route-level `component: lazyRouteComponent(...)` pattern per slug via a generated route file; the project guide records whichever pattern was verified in Phase 1.

`Prose` supplies the MDX `components` map: `{ Callout, YouTube, Figure, pre: CodeBlock, a: SmartLink, img: Img }`. `CodeBlock` adds the copy button (M7) around the static Shiki HTML.

`head()` helpers (`src/lib/seo.ts`) return `{ meta, links, scripts }` per the Router document-head API: `title`, `description`, `og:*`, `twitter:card`, `<link rel="canonical">` (from `frontmatter.canonical ?? SITE + url`), `<link rel="alternate" type="application/rss+xml">` on the root, and `scripts: [{ type: 'application/ld+json', children: JSON.stringify(jsonLd) }]`. Router dedupes `title` and `meta` by name/property; nested routes win.

404: `__root.tsx` sets `notFoundComponent`; `blog.$slug.tsx` throws `notFound()` for unknown slugs. The function returns HTTP 404 for misses at runtime; `/404.html` is also prerendered for hosts that serve it statically.

## 8. Drafts handling

- `status` defaults to `draft`; the generator writes `status: draft`.
- Production builds exclude drafts and future-dated posts at the index (§6 step 4). Because the only reference to a post module is the `load` thunk in the index, an excluded post produces no route, no HTML, no chunk, no RSS item, no sitemap entry, no tag.
- `vite dev` shows drafts with a DRAFT banner; the banner component checks `post.isDraft`.
- A CI step greps `dist/client` for every draft slug and fails if any appear.
- Future-dated posts need a redeploy to publish (no scheduled builds at launch); a Netlify build hook on a cron is the documented follow-up.

## 9. Template files, generator, and validation

`content/templates/article.mdx`:

```mdx
---
title: "{{title}}"
slug: "{{slug}}"
description: ""
createdAt: {{today}}
status: draft
template: article
templateVersion: 1
tags: []
---

Lede paragraph. Say what the reader gets.

## First section

<Callout kind="note" title="Optional">Callouts are components.</Callout>
```

`make new-post TEMPLATE=article SLUG=safety-rails-by-default` runs `pnpm tsx scripts/new-post.ts`:

1. Validates `TEMPLATE` against `content/templates/*.mdx` and `SLUG` against the slug regex; refuses if `content/blog/<slug>/` exists.
2. Copies the template, substitutes `{{slug}}`, `{{title}}` (slug title-cased), `{{today}}` (ISO date).
3. Creates the folder and `index.mdx`, prints the path.
4. Runs the scanner once (same code as the plugin) so a bad template is caught immediately.

`make validate-content` runs `pnpm tsx scripts/validate-content.ts`:

1. Runs the scanner in build mode over `content/blog` and in a lenient mode over `content/templates` (placeholders allowed) and reports every zod issue with file and path; exits non-zero on any.
2. Compiles `content/templates/fixtures/everything.mdx` with the same MDX options as `vite.config.ts` (via `@mdx-js/mdx` `compile`) to catch broken MDX syntax and unknown components before the build does.
3. Checks that every `![]()` and `cover.src` target exists on disk.
4. Greps `content/` for U+2014 (the em dash) and fails if found.

Both scripts are non-interactive so an agent can run them. CI runs `validate-content` before `vite build`.

## 10. Media and embeds

| Feature | How | Client JS |
| --- | --- | --- |
| Images | `![alt](./file.jpg)` → `rehype-mdx-import-media` → Vite asset; `Img` component adds `loading="lazy"`, `decoding="async"`, width/height from `vite-imagetools` (`?w=…&format=webp&as=metadata`) | none |
| Code | fenced blocks → `rehype-pretty-code` (Shiki, custom warm-light theme, `{2-4}` line highlight) → static HTML | copy button only (M7) |
| Tables, footnotes, task lists | `remark-gfm` | none |
| Callouts | `<Callout kind="note|tip|warn" title="…">` | none |
| Figure | `<Figure src={…} alt caption>` or the `img` mapping when a caption follows | none |
| YouTube | `<YouTube id="…" title="…" />`: static thumbnail from `i.ytimg.com`, iframe injected on click | a few lines (facade swap) |
| Spotify (site, not posts) | `SpotifyFacade` component on Home/Projects | facade swap |
| Heading anchors and TOC | `rehype-slug` IDs; TOC from `post.headings` (§6) | none (M11 highlight is an `IntersectionObserver` in `Toc`) |

**Adding a new embed type:** create the component under `src/components/blog/`, add it to the `Prose` components map, add a usage to `content/templates/fixtures/everything.mdx`, and document it in the Start project guide. The lint rule that restricts imports inside `content/` to `@/components/blog/*` keeps posts from pulling arbitrary modules.

## 11. RSS, sitemap, robots, llms.txt, canonical

All four are server routes with a `GET` handler and no component, listed in `pages` so they prerender to static files in `dist/client` (plan D1e). They read from `getPublishedPosts()` so they cannot disagree with the pages.

```ts
// src/routes/rss[.]xml.ts
import { createFileRoute } from '@tanstack/react-router';
import { getPublishedPosts } from '@/content';
import { renderRss } from '@/lib/feeds';

export const Route = createFileRoute('/rss.xml')({
  server: {
    handlers: {
      GET: () => new Response(renderRss(getPublishedPosts()), { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } }),
    },
  },
});
```

- **RSS**: title, link, description, `pubDate` from `publishedAt`, `<content:encoded>` from the post description plus a "read on the site" link (full-body rendering in RSS would require compiling MDX to static HTML in the handler; deferred, and noted as a follow-up).
- **Sitemap**: static pages plus posts and tag pages; `lastmod` from `updatedAt ?? publishedAt`. Start's own `sitemap` option is disabled to avoid two sources of truth.
- **robots.txt**: `User-agent: *`, `Allow: /`, `Sitemap: https://nnajiabraham.com/sitemap.xml`.
- **llms.txt**: site name, one-paragraph description, `## Pages`, `## Posts` (title, URL, description, date).
- **Canonical**: `head()` emits `<link rel="canonical" href={frontmatter.canonical ?? SITE + url}>`. Migrated Medium posts have no `canonical` field, so they are canonical here (D9).
- **JSON-LD**: `Person` on About (`name`, `url`, `jobTitle` "Senior Software Engineer", `address` BC, Canada, `sameAs` socials, `image` headshot); `BlogPosting` on posts.

## 12. Verification checklist (plan Phase 1 acceptance)

Build a throwaway post that uses a `<Callout>`, a `<YouTube>`, a fenced block with `{2-3}` line highlight, a co-located image via `![]()`, three heading levels, a GFM table, and a footnote; and a second post with `status: draft`. Assert after `vite build`:

- `dist/client/blog/<slug>/index.html` exists and contains the rendered callout, the Shiki `<span>`s, the hashed image URL, and heading IDs; the dehydrated loader state in that HTML contains the post metadata but not the post body.
- `dist/client/assets/` contains exactly one JS chunk for the post and none for the draft; no `dist/client/blog/<draft>/`.
- `rss.xml`, `sitemap.xml`, `robots.txt`, `llms.txt`, `404.html` exist in `dist/client` and mention no draft.
- Removing a required frontmatter field fails the build with the file path and field name.
- In the Netlify deploy preview, requesting a prerendered page produces no function invocation in the function log.
