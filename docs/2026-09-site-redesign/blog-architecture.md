# Blog architecture: Astro 7 content collections

Written against **Astro 7** (7.3.x at the time of writing; Content Layer API, `astro/zod`, Vite 8, Sätteri Markdown pipeline by default, Node 22.12+). Facts about the pipeline and the exact configs are in §9, with sources.

## 1. Folder layout

```
content/
  blog/
    writing-a-linkedlist-in-golang/
      index.md
      cover.jpg                # optional, referenced as ./cover.jpg
      linkedlist-diagram.svg
    ubuntu-ultrawide-monitor-fix/
      index.md
  templates/                   # generator sources, NOT a collection
    article.md
    note.md
    fixtures/
      embeds.md                # exercises every directive; parsed by validate-content
src/
  content.config.ts            # collection + schema definitions
  content/
    schemas/
      blog.ts                  # zod schemas per template + union
      shared.ts                # dates, slug, tags
  markdown/
    directives.ts              # Sätteri MDAST plugin: :::note, ::youtube{}, ::figure{}
    registry.ts                # directive name -> element + allowed attributes
  lib/
    content.ts                 # getPublishedPosts(), readingTime()
  components/blog/
    Callout.astro              # used by MDX posts only (see §6)
    YouTube.astro              # facade; used by MDX posts and by the site (Home)
    Figure.astro
    CodeBlock.astro            # copy button wrapper (M7), client-side enhancement
    Toc.astro
  layouts/
    PostArticle.astro          # template=article
    PostNote.astro             # template=note
  pages/
    blog/
      index.astro
      [slug].astro
      tags/[tag].astro
    rss.xml.ts
    llms.txt.ts
    robots.txt.ts
scripts/
  new-post.ts                  # make new-post TEMPLATE= SLUG=
  validate-content.ts          # make validate-content (astro sync + fixture render + custom checks)
```

Decisions: posts live in repo-root `content/`, not `src/content/`, so writing and code are visually separate and the folder can be edited without touching `src/`. Co-located assets are resolved by Astro's image pipeline when referenced relatively from Markdown (`![](./cover.jpg)`), and by the `image()` schema helper for `cover`.

## 2. Astro config and collection config

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import { satteri } from '@astrojs/markdown-satteri';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { directives } from './src/markdown/directives.ts';

export default defineConfig({
  site: 'https://nnajiabraham.com',
  markdown: {
    // Sätteri is the Astro 7 default; we name it explicitly so the options are visible.
    processor: satteri({
      features: { directive: true },   // parses :::name, ::name{}, :name (remark-directive syntax)
      mdastPlugins: [directives],      // turns directive nodes into elements (they are dropped otherwise)
    }),
    syntaxHighlight: 'shiki',
    shikiConfig: { theme: 'warm-paper' }, // custom light theme built from the design tokens
  },
  integrations: [mdx(), sitemap({ filter: (page) => !page.endsWith('/404/') })],
  vite: { plugins: [tailwindcss()] },
  compressHTML: 'jsx',                 // Astro 7 default, stated so nobody is surprised by whitespace
});
```

```ts
// src/content.config.ts
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { blogSchema } from './content/schemas/blog';

const blog = defineCollection({
  loader: glob({ pattern: '*/index.{md,mdx}', base: './content/blog' }),
  schema: blogSchema,           // ({ image }) => z.discriminatedUnion(...)
});

export const collections = { blog };
```

Entry `id` is the folder name (`writing-a-linkedlist-in-golang`) because the pattern matches `*/index.md`; Astro strips `/index`. The schema still requires an explicit `slug` field and a build check asserts `slug === id` so the URL never silently drifts from the folder.

## 3. Frontmatter schema per template

```ts
// src/content/schemas/shared.ts
import { z } from 'astro/zod';

export const isoDate = z.coerce.date();
export const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'kebab-case only');
export const tag = z.string().regex(/^[a-z0-9-]+$/);

export const base = {
  title: z.string().min(3).max(90),
  slug,
  description: z.string().min(20).max(200),
  createdAt: isoDate,
  publishedAt: isoDate.optional(),
  updatedAt: isoDate.optional(),
  status: z.enum(['draft', 'published']).default('draft'),
  tags: z.array(tag).min(1).max(6),
  series: z.object({ name: z.string(), part: z.number().int().positive() }).optional(),
  canonical: z.string().url().optional(),     // only when another site is canonical; unset for migrated posts (D9)
};
```

```ts
// src/content/schemas/blog.ts
import { z, type SchemaContext } from 'astro/zod';
import { base } from './shared';

export const ARTICLE_VERSION = 1;
export const NOTE_VERSION = 1;

export const blogSchema = ({ image }: SchemaContext) =>
  z.discriminatedUnion('template', [
    z.object({
      ...base,
      template: z.literal('article'),
      templateVersion: z.literal(ARTICLE_VERSION),
      cover: z.object({ src: image(), alt: z.string().min(5) }).optional(),
      toc: z.boolean().default(true),
    }),
    z.object({
      ...base,
      template: z.literal('note'),
      templateVersion: z.literal(NOTE_VERSION),
      title: base.title.max(70),          // notes: no cover, no toc, shorter title cap
    }),
  ])
  .superRefine((post, ctx) => {
    if (post.status === 'published' && !post.publishedAt) {
      ctx.addIssue({ code: 'custom', message: 'published posts need publishedAt', path: ['publishedAt'] });
    }
    if (post.publishedAt && post.publishedAt < post.createdAt) {
      ctx.addIssue({ code: 'custom', message: 'publishedAt before createdAt', path: ['publishedAt'] });
    }
    if (post.updatedAt && post.publishedAt && post.updatedAt < post.publishedAt) {
      ctx.addIssue({ code: 'custom', message: 'updatedAt before publishedAt', path: ['updatedAt'] });
    }
  });
```

### Field reference

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `title` | string | yes | max 90 (article), max 70 (note) |
| `slug` | kebab string | yes | must equal folder name; build asserts |
| `description` | string 20 to 200 | yes | used for meta description, RSS, list rows |
| `createdAt` | date | yes | when the draft was started; for migrated posts equals `publishedAt` |
| `publishedAt` | date | if published | original Medium date for migrations |
| `updatedAt` | date | no | shown as "Updated" when it differs from `publishedAt` |
| `status` | `draft` or `published` | default `draft` | drafts never in build (§7) |
| `template` | `article` or `note` | yes | picks layout |
| `templateVersion` | int literal | yes | must equal the current version for that template (§4) |
| `tags` | 1 to 6 kebab strings | yes | tag pages generated from the union of tags |
| `cover` | `{src, alt}` | no (article only) | processed by Astro image pipeline; used as OG image |
| `series` | `{name, part}` | no | renders a series box with prev/next in the series |
| `canonical` | url | no | emits `<link rel=canonical>` to that URL; otherwise the page is self-canonical |
| `toc` | boolean | default true (article only) | disables TOC for short articles |

Computed at render time, not in frontmatter (and not by a Markdown plugin, see D2b):

```ts
// src/lib/content.ts
export function readingTime(body: string) {
  const words = body.replace(/```[\s\S]*?```/g, ' ').split(/\s+/).filter(Boolean).length;
  return { words, minutes: Math.max(1, Math.ceil(words / 200)) };
}
// usage: const { minutes } = readingTime(entry.body ?? '');
```

`entry.body` is the raw Markdown string every content-collection entry exposes, regardless of processor.

## 4. Template versioning strategy

- Each template has a single integer `*_VERSION` constant. The schema uses `z.literal(VERSION)`, so a post whose `templateVersion` does not match fails the build with the file path and field name. There is no silent "old posts render with old layout".
- Bump the version when the layout's contract with frontmatter changes (a field added/removed/renamed or its meaning changes). Do not bump for pure CSS changes.
- Bumping requires a codemod in the same PR: `scripts/migrate-template.ts --template article --from 1 --to 2` rewrites frontmatter for every matching post. Tests cover the codemod on a fixture folder.
- `content/templates/<name>.md` (generator source) carries the current version and is the single example of a valid post; `validate-content` parses these fixtures too, so the generator can never produce an invalid post.

Trade-off: `z.literal` is strict; a repo with hundreds of posts would prefer `z.union` of supported versions with per-version layouts. At this blog's size, one version at a time plus a codemod is simpler and keeps layouts singular. Revisit if a bump ever needs to be staggered.

## 5. Template files and new-post generation

`content/templates/article.md`:

```md
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
```

`make new-post TEMPLATE=article SLUG=safety-rails-by-default` runs `pnpm tsx scripts/new-post.ts`:

1. Validates `TEMPLATE` against the templates folder and `SLUG` against the slug regex; refuses if `content/blog/<slug>/` exists.
2. Copies the template, substitutes `{{slug}}`, `{{title}}` (slug title-cased), `{{today}}` (ISO date).
3. Creates the folder and `index.md`, prints the path.
4. Runs `astro sync` so types and the schema check pick it up immediately.

Non-interactive by design so an agent can run it. `TEMPLATE` defaults to `article`.

## 6. Media and embeds on Astro 7

What Markdown gives us with no plugin at all: images (relative paths, processed to WebP/AVIF with width/height set), fenced code with Shiki highlighting (theme: a custom warm-light theme derived from the tokens; line highlighting via `{2-4}` meta), GFM tables, footnotes, heading IDs (Astro generates them and returns them from `render(entry)` as `headings`, which feeds the TOC).

For callouts and embeds there are three viable routes on Astro 7. Each is stated with its config; the recommendation follows.

### Route 1 (recommended): Sätteri directives + a small MDAST plugin

Authoring stays plain Markdown with remark-directive syntax, which Sätteri parses natively when `features.directive` is on:

```md
:::note[Why this matters]
Callout body, Markdown allowed.
:::

::youtube{id="dQw4w9WgXcQ" title="Talk title"}

::figure{src="./diagram.svg" alt="Data flow" caption="How a promotion PR moves through the gate"}
```

Sätteri produces `containerDirective` / `leafDirective` / `textDirective` nodes but **drops them at the MDAST to HAST step unless a plugin sets `data.hName`**. Our plugin does exactly that:

```ts
// src/markdown/registry.ts
export const DIRECTIVES = {
  note:    { kind: 'container', element: 'aside', attrs: [] },
  tip:     { kind: 'container', element: 'aside', attrs: [] },
  warn:    { kind: 'container', element: 'aside', attrs: [] },
  youtube: { kind: 'leaf', element: 'div', attrs: ['id', 'title'] },
  figure:  { kind: 'leaf', element: 'figure', attrs: ['src', 'alt', 'caption'] },
} as const;
```

```ts
// src/markdown/directives.ts
import { defineMdastPlugin } from 'satteri';   // add `satteri` as a direct devDependency; pnpm does not hoist it from @astrojs/markdown-satteri
import { DIRECTIVES } from './registry';

function fail(name: string, msg: string): never {
  throw new Error(`[directives] ::${name}: ${msg}`);   // surfaces as a build error naming the file
}

export const directives = defineMdastPlugin({
  name: 'site-directives',
  containerDirective(node, ctx) {
    const def = DIRECTIVES[node.name as keyof typeof DIRECTIVES];
    if (!def || def.kind !== 'container') fail(node.name, 'unknown container directive');
    // Sätteri renders the [label] as a child paragraph flagged `data.directiveLabel`; keep it as the title.
    ctx.replaceNode(node, {
      type: 'callout',
      data: { hName: def.element, hProperties: { className: ['callout', `callout-${node.name}`], role: 'note' } },
      children: node.children,
    });
  },
  leafDirective(node, ctx) {
    const def = DIRECTIVES[node.name as keyof typeof DIRECTIVES];
    if (!def || def.kind !== 'leaf') fail(node.name, 'unknown leaf directive');
    for (const k of Object.keys(node.attributes ?? {})) if (!def.attrs.includes(k as never)) fail(node.name, `unexpected attribute "${k}"`);
    if (node.name === 'youtube') {
      const { id, title = 'YouTube video' } = node.attributes ?? {};
      if (!id) fail('youtube', 'id is required');
      // Facade markup; app.js swaps in the iframe on click (M9). No YouTube bytes load until then.
      ctx.replaceNode(node, {
        type: 'embed',
        data: { hName: 'button', hProperties: { className: ['yt'], type: 'button', 'data-embed': `https://www.youtube-nocookie.com/embed/${id}`, 'data-title': title, 'aria-label': `Play: ${title}` } },
        children: [{ type: 'text', value: `Play · ${title}` }],
      });
    }
    // figure: similar, emits <figure><img …><figcaption>…</figcaption></figure>
  },
});
```

Text directives (`:name`) are not used and fall through to `fail()` via a `textDirective` visitor, so a stray `:foo` in prose is caught at build time.

Why this is the recommendation: posts stay portable `.md`; the authoring format is identical to `remark-directive`, so if Sätteri ever blocks us the same posts render under `unified()` + `remark-directive` with no content changes (§9); the plugin is about 60 lines, typed, and covered by `content/templates/fixtures/embeds.md` in `validate-content`.

Costs: Sätteri's plugin API is 0.x and not remark-compatible; any future plugin we want must be written for it or done outside the pipeline.

### Route 2 (alternative, no remark/rehype dependency): MDX with Astro components

Install `@astrojs/mdx` (8.x, runs on Sätteri's MDX entry point in Astro 7). A post that needs a component becomes `content/blog/<slug>/index.mdx` and imports Astro components directly:

```mdx
---
title: "…"
template: article
templateVersion: 1
---
import Callout from '@/components/blog/Callout.astro';
import YouTube from '@/components/blog/YouTube.astro';

<Callout kind="note" title="Why this matters">Body, Markdown allowed.</Callout>

<YouTube id="dQw4w9WgXcQ" title="Talk title" />
```

Pros: full component power, real props with TypeScript, no custom Markdown plugin. Cons: posts are no longer plain Markdown, authors can import anything (a linter rule can restrict imports to `@/components/blog/*`), and MDX compilation is slower. **Decision: MDX is installed and allowed as the escape hatch for a post that needs something the directive set does not cover (D2d).** The glob pattern in §2 already accepts `.mdx`.

### Route 3 (alternative, no remark/rehype dependency): build-time content transform

A pre-processing step (`scripts/expand-directives.ts`, run by `make build` and `make dev` via a watcher) rewrites `:::note … :::` into raw HTML in a generated mirror of `content/` that the glob loader reads. Zero pipeline coupling and works under any processor. Rejected for now: it doubles the content tree, makes line numbers in build errors wrong, and reintroduces the "works in dev, breaks in build" class of bug that Astro 7's dev server was redesigned to remove. Keep as a documented fallback only.

### Route 4 (legacy, depends on remark/rehype): `unified()` + `remark-directive`

Still supported on Astro 7 via `@astrojs/markdown-remark` (exact config in §9). Not chosen because it forfeits the Rust pipeline and adds a dependency Astro no longer installs, for no authoring difference.

### Feature by feature

| Feature | Recommended route | Alternative without remark/rehype |
| --- | --- | --- |
| Callouts (`note`, `tip`, `warn`) | Route 1 directive → `<aside class="callout">` | Route 2 `<Callout>` in MDX |
| YouTube embed | Route 1 leaf directive → facade `<button data-embed>` | Route 2 `<YouTube>` in MDX |
| Figure with caption | Route 1 leaf directive → `<figure>` | Markdown image + `*caption*` line styled by CSS (`img + em`) |
| Code highlighting + line highlight | Astro built-in Shiki (processor-independent) | n/a |
| Copy button on code blocks | Client-side `app.js` decorates `pre` (M7) | Route 2 `<CodeBlock>` wrapper in MDX |
| Tables, footnotes, task lists | GFM (Sätteri default) | n/a |
| Heading IDs / TOC | Astro `render(entry).headings` | n/a |
| Reading time | `readingTime(entry.body)` in `src/lib/content.ts` | n/a |
| Spotify embed (site, not posts) | Astro component with facade on Home/Projects | Route 1 leaf directive if a post ever needs it |

**Adding a new embed type** (e.g. `spotify`): add an entry to `registry.ts`, a branch in `directives.ts` (or a shared "facade" helper), a fixture line in `content/templates/fixtures/embeds.md`, and a paragraph in the Astro project guide. If the embed needs real interactivity beyond the facade swap, write it as an Astro component and use it from MDX (Route 2) instead of stretching the directive.

## 7. Drafts handling

- `status` defaults to `draft`; the generator writes `status: draft`.
- One helper, `getPublishedPosts()`, wraps `getCollection('blog', p => p.data.status === 'published' && p.data.publishedAt <= now)`. Every consumer (post routes, index, tags, RSS, sitemap, llms.txt, Home latest-three) uses it. A lint rule (`no-restricted-imports` on `getCollection` outside `src/lib/content.ts`) enforces this.
- `pnpm dev` shows drafts with a "DRAFT" banner when `import.meta.env.DEV`; `astro build` never emits them. A CI check greps `dist/` for every draft slug and fails if any appear.
- Future-dated `publishedAt` posts are also excluded until the date passes; a redeploy is required to publish them (no scheduled builds at launch; a Netlify build hook on a cron is the documented follow-up).

## 8. RSS, sitemap, llms.txt, robots, canonical

- **RSS** `src/pages/rss.xml.ts` via `@astrojs/rss`, from `getPublishedPosts()` sorted by `publishedAt` desc, `content` rendered to HTML with relative image URLs rewritten to absolute. Autodiscovery `<link>` in the base layout.
- **Sitemap** `@astrojs/sitemap` with `filter` excluding `/404` and any URL not in the published set; `lastmod` from `updatedAt ?? publishedAt`.
- **llms.txt** `src/pages/llms.txt.ts`: Markdown text per the llms.txt convention: site name, one-paragraph description, then `## Pages` (static pages with one-line descriptions) and `## Posts` (title, URL, description, date). Generated from the same data as the sitemap so it cannot drift.
- **robots.txt** `src/pages/robots.txt.ts`: `User-agent: *`, `Allow: /`, `Sitemap: https://nnajiabraham.com/sitemap-index.xml`. No AI-crawler blocks at launch.
- **Canonical**: the base layout emits `<link rel="canonical" href={data.canonical ?? Astro.url.href}>`. Migrated Medium posts have no `canonical` field, so they are canonical here (D9).
- **JSON-LD** `Person` on About only, with `name`, `url`, `jobTitle` ("Senior Software Engineer"), `address` ("BC, Canada" as `addressRegion`/`addressCountry`), `sameAs` (socials), `image` (headshot). `BlogPosting` JSON-LD on posts is a Phase 5 nice-to-have.

## 9. Astro 7 Markdown pipeline: facts, configs, and the fallback

Verified 2026-09-24 against the npm registry, the Astro v7 upgrade guide, the Astro 7.0 release post, and the Sätteri docs.

- **Versions.** `astro@7.3.5` (published 2026-09-24) depends on `vite@^8.0.13` and `@astrojs/markdown-satteri@0.4.2`; engines `node >= 22.12.0`. `astro@7.0.0` was published 2026-06-22. `@astrojs/mdx@8.0.2` peers on `astro ^7.2.10` and on either `@astrojs/markdown-remark ^7.3` or `@astrojs/markdown-satteri ^0.4`. `@astrojs/markdown-remark` is **not** a dependency of `astro` any more.
- **Default processor.** Astro 7 renders `.md` and `.mdx` with Sätteri (a Rust parser on `pulldown-cmark` with a JavaScript plugin layer). GFM and SmartyPants are on by default. Source: Astro v7 upgrade guide, "New default Markdown processor: Sätteri".
- **remark/rehype still work, via config.** Install `@astrojs/markdown-remark` and set the processor:

  ```js
  import { unified } from '@astrojs/markdown-remark';
  import remarkDirective from 'remark-directive';
  export default defineConfig({
    markdown: {
      processor: unified({ remarkPlugins: [remarkDirective, ourRemarkDirectiveRenderer], rehypePlugins: [] }),
    },
  });
  ```

  The top-level `markdown.remarkPlugins`, `markdown.rehypePlugins`, `markdown.remarkRehype`, `markdown.gfm`, `markdown.smartypants` options are **deprecated**: they still function but only when `@astrojs/markdown-remark` is installed, and Astro warns that a Sätteri processor does not run them. Move them onto `unified({...})`. Source: Astro v7 upgrade guide; `@astrojs/markdown-remark@7.2.0` release notes.
- **Sätteri plugins.** `satteri({ features, mdastPlugins, hastPlugins })` from `@astrojs/markdown-satteri` (which depends on `satteri@^0.10`; `@astrojs/markdown-satteri` also carries `github-slugger`, which is how heading IDs are generated under this processor). Plugins are objects with a `name` and per-node visitors, wrapped in `defineMdastPlugin` / `defineHastPlugin` from `satteri`; MDAST plugins run before HAST plugins, in array order. `features.directive: true` parses container/leaf/text directives exactly as remark-directive defines them; without a plugin that sets `data.hName`, directive nodes are dropped (unlike remark's `<div>` wrapper). Existing remark/rehype plugins do **not** run unmodified. Source: Sätteri docs (Features, Plugin API, Divergences).
- **Other Astro 7 changes that touch this plan.** Rust `.astro` compiler is the only compiler (unclosed tags error; invalid nesting is passed through). `compressHTML` default is `'jsx'` (whitespace between inline elements is stripped; add `{" "}` or set `compressHTML: true`). `src/fetch.ts` is reserved for advanced routing. `@astrojs/db` removed. Source: Astro v7 upgrade guide.

**Pipeline decision (D2a):** Sätteri with `features.directive` and our MDAST plugin. **Fallback (R1):** if Sätteri blocks us, switch to the `unified()` config above with `remark-directive` plus a 40-line remark renderer that emits the same elements; no post changes, because the authoring syntax is the same.

**Phase 1 verification (acceptance, not an open question):** build a throwaway post that uses every directive, a fenced block with `{2-3}` line highlight, three heading levels, a GFM table, and a footnote. Assert: directives render as the elements above; unknown directive fails the build; Shiki classes are present; `render(entry).headings` lists the three headings with IDs; `entry.body` is a string; `readingTime()` returns the expected minutes.
