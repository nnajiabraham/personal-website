# Blog architecture — Astro content collections

Written against Astro 6 (Content Layer API, `astro/zod`, Vite 7). The collection API is unchanged in Astro 7; the Markdown pipeline is not (see §9).

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
src/
  content.config.ts            # collection + schema definitions
  content/
    schemas/
      blog.ts                  # zod schemas per template + union
      shared.ts                # dates, slug, tags
  components/blog/
    Callout.astro
    YouTube.astro
    Figure.astro
    CodeBlock.astro            # copy button wrapper (M7)
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
  validate-content.ts          # make validate-content (runs astro sync + custom checks)
```

Decisions: posts live in repo-root `content/`, not `src/content/`, so writing and code are visually separate and the folder can be edited without touching `src/`. Co-located assets are resolved by Astro's image pipeline when referenced relatively from Markdown (`![](./cover.jpg)`), and by the `image()` schema helper for `cover`.

## 2. Collection config sketch

```ts
// src/content.config.ts
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { blogSchema } from './content/schemas/blog';

const blog = defineCollection({
  loader: glob({ pattern: '*/index.md', base: './content/blog' }),
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
  canonical: z.string().url().optional(),     // set only if another site is canonical
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
      // notes: no cover, no toc, shorter title cap
      title: base.title.max(70),
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
| `title` | string | yes | ≤ 90 (article), ≤ 70 (note) |
| `slug` | kebab string | yes | must equal folder name; build asserts |
| `description` | string 20–200 | yes | used for meta description, RSS, list rows |
| `createdAt` | date | yes | when the draft was started; for migrated posts equals `publishedAt` |
| `publishedAt` | date | if published | original Medium date for migrations |
| `updatedAt` | date | no | shown as "Updated" when it differs from `publishedAt` |
| `status` | `draft` \| `published` | default `draft` | drafts never in build (§7) |
| `template` | `article` \| `note` | yes | picks layout |
| `templateVersion` | int literal | yes | must equal the current version for that template (§4) |
| `tags` | 1–6 kebab strings | yes | tag pages generated from the union of tags |
| `cover` | `{src, alt}` | no (article only) | processed by Astro image pipeline; used as OG image |
| `series` | `{name, part}` | no | renders a series box with prev/next in the series |
| `canonical` | url | no | emits `<link rel=canonical>`; otherwise self |
| `toc` | boolean | default true (article only) | disables TOC for short articles |

Computed at render time, not in frontmatter: `readingTime` (words / 200, rounded up, via a remark plugin writing to `frontmatter.readingTime`), `wordCount`, `excerpt` for RSS.

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

## 6. Media and embeds; adding a new type

Markdown gets these out of the box: images (relative paths, processed to WebP/AVIF with width/height set), fenced code with Shiki highlighting (theme: a custom warm-light theme derived from the tokens; line highlighting via `{2-4}` meta), GFM tables, footnotes.

Components are available inside Markdown without MDX by using **Markdown directives** (`remark-directive`) mapped to Astro components:

```md
:::note{title="Why this matters"}
Callout body, Markdown allowed.
:::

::youtube{id="dQw4w9WgXcQ" title="Talk title"}
```

Supported at launch: `note`, `tip`, `warn` callouts; `youtube` (facade: thumbnail from `i.ytimg.com`, iframe injected on click, `loading=lazy`); `figure` (image + caption). Tables and code need no directive.

**Adding a new embed type** (e.g. `spotify`):

1. Add `src/components/blog/Spotify.astro` with the facade pattern (static image → iframe on click).
2. Register the directive name in `src/lib/directives.ts` (`spotify: { component: Spotify, attrs: ['uri', 'title'] }`) — the remark plugin turns `::spotify{uri=... title=...}` into that component with validated attrs; unknown attrs fail the build.
3. Add a fixture under `content/templates/fixtures/embeds.md` so `validate-content` exercises it.
4. Document it in the Astro project guide.

Why directives over MDX: posts stay plain `.md`, portable to any other renderer, and authors (including agents) cannot import arbitrary components into content. MDX can be added later for a single post if truly needed.

## 7. Drafts handling

- `status` defaults to `draft`; the generator writes `status: draft`.
- One helper, `getPublishedPosts()`, wraps `getCollection('blog', p => p.data.status === 'published' && p.data.publishedAt <= now)`. Every consumer (post routes, index, tags, RSS, sitemap, llms.txt, Home latest-three) uses it. A lint rule (`no-restricted-imports` on `getCollection` outside `src/lib/content.ts`) enforces this.
- `pnpm dev` shows drafts with a "DRAFT" banner when `import.meta.env.DEV`; `astro build` never emits them. A CI check greps `dist/` for every draft slug and fails if any appear.
- Future-dated `publishedAt` posts are also excluded until the date passes; a redeploy is required to publish them (no scheduled builds at launch — this is a known limitation and the Handover mentions a Netlify build hook cron as a follow-up).

## 8. RSS, sitemap, llms.txt, robots

- **RSS** `src/pages/rss.xml.ts` via `@astrojs/rss`, from `getPublishedPosts()` sorted by `publishedAt` desc, `content` rendered to HTML with relative image URLs rewritten to absolute. Autodiscovery `<link>` in the base layout.
- **Sitemap** `@astrojs/sitemap` with `filter` excluding `/404` and any URL not in the published set; `lastmod` from `updatedAt ?? publishedAt`.
- **llms.txt** `src/pages/llms.txt.ts` — Markdown text per the llms.txt convention: site name, one-paragraph description, then sections `## Pages` (static pages with one-line descriptions) and `## Posts` (title, URL, description, date). Generated from the same data as the sitemap so it cannot drift.
- **robots.txt** `src/pages/robots.txt.ts` — `User-agent: *`, `Allow: /`, `Sitemap: https://nnajiabraham.com/sitemap-index.xml`. No AI-crawler blocks at launch (owner can add `GPTBot` etc. later; llms.txt signals intent).
- **JSON-LD** `Person` on About only, with `name`, `url`, `jobTitle`, `sameAs` (socials), `image` (headshot). Blog posts get `BlogPosting` JSON-LD as a Phase 5 nice-to-have.

## 9. Astro 7 note

If Handover Q1 lands on Astro 7: the Sätteri Markdown pipeline is the default and remark/rehype are not installed by default. The plan above depends on `remark-directive` (callouts/embeds) and a small reading-time remark plugin. Before committing to 7, verify either that Sätteri supports directives and frontmatter mutation, or that opting back into the remark pipeline is supported and not deprecated. If neither, the fallback is MDX for embed-bearing posts, which weakens §6's "plain Markdown" argument. Record the outcome in `plan.md` decisions.
