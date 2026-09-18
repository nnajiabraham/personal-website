# Design brief — nnajiabraham.com

Companion to `plan.md`. Everything here is a proposal for the owner to accept, edit, or reject; fixed owner decisions are marked **(fixed)**.

## 1. Brand and voice

**Who the site is for, in order (fixed):** recruiters and hiring managers, peers/engineers, clients, friends, social-media visitors. The first group reads on a phone and gives the page eight seconds; the second reads the blog on a laptop and judges the code blocks.

**Personality (fixed):** inquisitive, sharp, friendly, a bit private, hands-on. Senior software engineer; currently AI-agents platform work; background in developer platforms, AWS infrastructure, and building/scaling a multi-tenant PaaS for partner integrations; has led technical designs and small teams. Outside work: lo-fi music (an album on streaming), Arduino/electronics, gardening, soccer and F1, student pilot (PPL in progress), raves with friends.

**Voice rules**

- Plain declarative sentences. First person. Short paragraphs. No exclamation marks in UI copy.
- Dry humour lives in labels and asides, never in headlines a recruiter must parse. One joke per page, maximum.
- Intellectual honesty is part of the brand: "within run-to-run noise", "not worth it at N; reconsider at N+", "the interim architecture, with a stated migration path". Use these habits in post intros and project write-ups.
- Enablement over gatekeeping: describe controls as "the thing that let us say yes".
- Private by default: hobbies appear as facts and small photos, not as a lifestyle feed. No location more precise than "BC, Canada". No phone number.
- No emoji in UI. Icons are line icons at 1.5px stroke.

**Tone references.** The owner admires the micro-interactions on [sarah.dev](https://sarah.dev/). Studied: one signature moment per page (hand-drawn SVG fern logo; a canvas "glitch" hero on the 404), everything else quiet — link hovers are a plain `opacity` fade over 250 ms, no parallax, no scroll-jacking. The lesson we take: **spend the motion budget on one or two owned details and keep the rest still.** The owner dislikes the typeface on pawlean.com; the pairings below avoid humanist/rounded-display faces in that register.

## 2. Role statement options (one line, for the hero)

1. Senior software engineer building the platform other engineers ship AI agents on.
2. I build developer platforms — lately, the infrastructure that lets teams ship AI agents safely.
3. Platform engineer. Now: agents infrastructure. Before: multi-tenant PaaS, payments, AWS.
4. Senior engineer who turns "we should be able to" into a paved road. Currently paving for AI agents.
5. I make platforms boring in the good way: multi-tenant systems, cloud infrastructure, and now an agents platform.

Recommendation: **2** for the hero (clear to a recruiter, honest to a peer). **3** works as the `<meta description>` and the résumé header.

## 3. Projects-section name options

The Projects page must signal "only the things I am allowed to share" without sounding apologetic.

| Option | Read |
| --- | --- |
| **Cleared for Release** | Pilot/ATC phrasing; implies a gate was passed; dry. |
| Show and Tell | Friendly, school-room; slightly undersells senior work. |
| Declassified | Fun but implies secrecy for its own sake. |
| The Shareable Bits | Honest, casual, a little apologetic. |
| Unredacted | Clever; reads as if the rest is redacted, which is true, but darker in tone. |

**Pick: "Cleared for Release."** Sub-line under the heading: "Work I can talk about. The rest is under NDA, which is a compliment to the work." URL stays `/projects`.

## 4. Palette

Warm off-white, warm near-black, monochrome warm neutrals, hints of fall colours, light/neon green-yellow as the single accent **(fixed)**. Checked against the four owner photos: the paper `#F5F0E6` sits behind a warm dark skin tone without greying it; the accent `#C9F53A` echoes the neon green of the current site and the greenery photo; the rust hint picks up the Cessna stripe; the plum is the F1 grid shadow tone. Avoid cool greys anywhere — they make warm skin look ashen in adjacent photos.

### Tokens

```css
:root {
  /* surfaces */
  --color-paper:        #F5F0E6; /* page background — never pure white */
  --color-paper-raised: #FBF8F2; /* cards on paper */
  --color-paper-sunken: #EDE6D8; /* code blocks, table stripes, inputs */
  --color-line:         #DDD4C4; /* hairlines, borders */

  /* text */
  --color-ink:          #2B2622; /* primary text — never pure black */
  --color-ink-2:        #5C544C; /* secondary text */
  --color-ink-3:        #766C61; /* meta, captions */

  /* accent (green-yellow) */
  --color-accent:       #C9F53A; /* highlight backgrounds, underlines, marks — never as text */
  --color-accent-soft:  #EEF9C4; /* tinted backgrounds */
  --color-accent-ink:   #4F6A05; /* accent-coloured text and links */
  --color-accent-ink-2: #3F5604; /* link hover */

  /* fall hints — one per page at most */
  --color-rust:         #A24A22;
  --color-rust-soft:    #F3DDD2;
  --color-ochre:        #8A6415;
  --color-ochre-soft:   #F4E7C9;
  --color-plum:         #6F3E55;
  --color-plum-soft:    #EBDDE3;

  /* focus */
  --color-focus:        #4F6A05;
}
```

### WCAG contrast checks (computed, relative luminance per WCAG 2.x)

| Foreground | Background | Ratio | Passes |
| --- | --- | --- | --- |
| ink `#2B2622` | paper `#F5F0E6` | 13.18 | AAA |
| ink-2 `#5C544C` | paper | 6.54 | AAA |
| ink-3 `#766C61` | paper | 4.52 | AA (normal text) |
| ink | paper-sunken `#EDE6D8` | 12.05 | AAA |
| ink-2 | paper-sunken | 5.98 | AA |
| ink-3 | paper-sunken | 4.14 | AA large only → use ink-2 for meta inside code/sunken areas |
| accent-ink `#4F6A05` | paper | 5.44 | AA |
| accent-ink | accent-soft `#EEF9C4` | 5.59 | AA |
| accent-ink-2 `#3F5604` | paper | 7.27 | AAA |
| ink | accent `#C9F53A` (highlight) | 11.84 | AAA |
| paper | ink (inverted chips, buttons) | 13.18 | AAA |
| accent | ink (accent text on dark chips only) | 11.84 | AAA |
| rust `#A24A22` | paper | 5.22 | AA |
| ochre `#8A6415` | paper | 4.72 | AA |
| plum `#6F3E55` | paper | 7.41 | AAA |
| accent | paper (non-text) | 1.11 | n/a — decorative only, always paired with an ink outline or text |
| line | paper (non-text) | 1.29 | n/a — hairlines; interactive borders must also change colour, not only weight |

Rule: **accent is never a text colour on paper.** It is a background behind ink text, a 2–3 px underline, a mark, or a dot.

## 5. Typography

Constraints **(fixed)**: rounded geometric sans for UI/headings, monospace for code, max two families + mono, self-hosted in production. Excluded by the owner: Inter, Geist, Space Grotesk, Bricolage Grotesque, Manrope, DM Sans, Poppins, Outfit, Plus Jakarta Sans.

| # | Headings / UI | Body | Mono | Character | Used in mockup |
| --- | --- | --- | --- | --- | --- |
| 1 | **Rubik** (500/600) — geometric with softly rounded corners | **Source Serif 4** (400/400i) | JetBrains Mono | Editorial. Serif body gives long posts a "written" feel; Rubik keeps UI friendly. | `a-fieldnotes` |
| 2 | **Red Hat Display** (500/700) — geometric, rounded terminals | **Red Hat Text** (400/500) | Red Hat Mono (or JetBrains Mono) | One superfamily; tight, technical, cohesive. Display and Text are metrically related so headings and body align. | `b-groundcrew` |
| 3 | **Nunito** (600/800) — fully rounded geometric | **Lora** (400/400i) | IBM Plex Mono | Softest option. Rounded terminals everywhere; Lora is warm and reads well at 18px. | `c-greenhouse` |

All three are on Google Fonts (for mockups) and on Fontsource (for self-hosting). Recommendation: **pairing 2** — it is the only one where UI and body share a skeleton, which matters at the small sizes recruiters hit on phones. Pairing 1 is the stronger blog-reading experience if the blog becomes the main event.

### Scale

Fluid, `clamp()` between 390 px and 1440 px. Base 17 px on mobile, 18 px on desktop.

| Token | Size | Use |
| --- | --- | --- |
| `--text-xs` | 0.75rem | mono labels, badges |
| `--text-sm` | 0.875rem | meta, captions, nav |
| `--text-base` | clamp(1.0625rem, 1rem + 0.2vw, 1.125rem) | body |
| `--text-lg` | 1.25rem | lede, pull quotes |
| `--text-xl` | clamp(1.5rem, 1.2rem + 1vw, 1.75rem) | h3 |
| `--text-2xl` | clamp(1.875rem, 1.4rem + 1.6vw, 2.25rem) | h2 |
| `--text-3xl` | clamp(2.25rem, 1.6rem + 2.6vw, 3rem) | h1 |

Line-height 1.6 body, 1.15 headings. Reading measure **65ch** (fixed) for prose; page container 72rem max; content column 42rem for single-column pages.

## 6. Spacing and radius

Spacing scale (rem): `0.25 0.5 0.75 1 1.5 2 3 4 6 8` → `--space-1 … --space-10`. Section rhythm: `--space-8` (4rem) between sections on desktop, `--space-7` on mobile.

Radius scale: `--radius-sm 4px` (chips, code inline), `--radius-md 8px` (cards, inputs), `--radius-lg 16px` (photos, embeds), `--radius-pill 999px` (tags). Directions differ in which they lean on: `a` uses sm only, `b` uses sm/md, `c` uses md/lg/pill.

Borders: 1px `--color-line`. Shadows: none, except a single `0 1px 0 var(--color-line)` under sticky nav once scrolled.

## 7. Motion principles and micro-interactions

Principles

1. Motion budget: at most **two owned moments per page**; everything else is a 150–250 ms ease-out on hover/focus.
2. Never move layout. Animate colour, opacity, transform, underline size — never width/height of text containers.
3. Respect `prefers-reduced-motion: reduce` — all non-essential transitions and animations off. Provide the same information statically.
4. Motion should reveal information (where am I, what will happen), not decorate.
5. No motion on page load except a single fade-in ≤ 200 ms on the hero. No scroll-jacking, no parallax.

The specific micro-interactions (implement all; they are cheap)

| # | Where | Behaviour | Tech |
| --- | --- | --- | --- |
| M1 | Text links in prose | 1px underline in `--color-line` grows to 3px `--color-accent` and the text darkens to `--color-accent-ink-2` (200 ms). | CSS `background-size` on a gradient |
| M2 | Nav | Current-page indicator is a 3px accent bar under the link; on hover it slides between links (`transform`, 250 ms). Active page also gets `aria-current`. | CSS `:has()` + transform, or 12 lines of JS |
| M3 | Post rows on Home/Blog | Whole row is the hit target; on hover the title gains an accent highlight behind it (like a marker) and the arrow glyph nudges 4px right. | CSS |
| M4 | Buttons | Ink button: background shifts from ink to ink-2 and the label lifts 1px. Ghost button: border → ink, background → paper-raised. Pressed: `translateY(1px)`. | CSS |
| M5 | Hero signature moment | The owner's initials mark (an "AN" monogram drawn as a single SVG path) draws itself once on load using `stroke-dasharray` (600 ms), then stays. On hover it re-draws. This is the sarah.dev fern lesson: one owned detail. | inline SVG + CSS |
| M6 | Tags/pills | On hover the pill background fills with `--color-accent-soft` and the text becomes `--color-accent-ink`. | CSS |
| M7 | Code blocks | Copy button appears on hover/focus-within (opacity), says "Copied" for 1.2 s with a green dot. | 15 lines JS |
| M8 | Photos | Grayscale at rest where the direction wants it (headshot), full colour on hover with 300 ms transition. Never on mobile (no hover) — colour by default there. | CSS `filter` |
| M9 | Spotify facade | Static cover art with a play glyph; on click the iframe replaces it with a 200 ms crossfade. | JS |
| M10 | Footer "status line" | A mono line like `status: building agents platform · listening: lo-fi · flying: PPL in progress` where the middle item cycles every 6 s with a 300 ms crossfade; static first item under reduced motion. | JS + CSS |
| M11 | Table of contents (article template) | Current section link is highlighted with the accent bar as you scroll. | `IntersectionObserver` |
| M12 | Skip link | Slides down from the top on focus. | CSS |

Not doing: cursor followers, magnetic buttons, text scramble, page-transition animations, smooth-scroll libraries, particle canvases.

## 8. Photo usage

Photos are small and only where meaningful **(fixed)**. Available (all ≤ 1600 px, in `mockups/assets/`):

| File | Content | Use |
| --- | --- | --- |
| `headshot-bw.jpg` | B&W portrait | Hero (Home) at ≤ 160 px wide, and About header at ≤ 240 px. The only photo on Home. |
| `cessna.jpg` | Standing beside a Cessna with orange stripes | About → "Outside work" beside the student-pilot line. ≤ 320 px. |
| `overalls-greenery.jpg` | In overalls with greenery | About → gardening line, or as the About header instead of the headshot in direction `c`. |
| `f1-grid.jpg` | F1 grid walk, Montreal | About → soccer/F1 line. Portrait crop; ≤ 280 px. |

Rules: max one photo on Home, max three on About, zero on Blog/Projects/Resume/Contact. `loading="lazy"` except the hero. Always `alt` that says what is happening, not who. Radius per direction. Never full-bleed.

## 9. Page inventory and wireframe notes

Shared: sticky top nav (name/monogram left; Home About Blog Projects Resume Contact right; collapses to a two-row wrap on mobile — no hamburger, six short links fit), footer with socials (GitHub, LinkedIn, Medium, Twitter/X, Email), status line (M10), copyright. Skip link. `<main>` landmark.

### Home `/`

1. **Hero** — monogram (M5), name "Abraham Nnaji", role statement (§2), two-line intro ("Based in BC, Canada. Currently …"), two buttons: "Email me" (ink) and "Resume" (ghost). Headshot ≤ 160 px right-aligned on desktop, above text on mobile.
2. **Latest writing** — three most recent published posts as rows: date (mono), title, one-line description, reading time. "All posts →" link. (M3)
3. **Cleared for Release** — three featured project cards (title, one-paragraph problem/outcome, tags), plus the **Spotify card**: album facade with "I also make lo-fi. This is the album." and artist link. (M9) "More projects →".
4. **Now** — three short mono lines (building / listening / flying). Optional; can merge into footer status line.

### About `/about`

Single column, 42rem. Header: name, headshot ≤ 240 px, role statement 3. Sections: "Work" (4–5 paragraphs from the NDA-safe extract, problem-shape only), "How I work" (bullets: reversible first steps, divergence ≠ defect, enablement framing, honest about noise), "Outside work" (four short paragraphs with the three hobby photos inline, ≤ 320 px, alternating sides on desktop), "Elsewhere" (socials). JSON-LD `Person`.

### Blog `/blog`

Year-grouped list of published posts: date (mono), title, description, tags, reading time. Tag filter row at top (links to `/blog/tags/<tag>`). RSS link. No pagination until > 40 posts.

### Blog post `/blog/<slug>`

Template `article`: eyebrow (template label + reading time + date), h1, description as lede, optional cover ≤ 65ch wide, TOC (desktop, sticky right; M11), prose at 65ch with code (highlighted, copy button M7), callouts (note/tip/warn), tables, YouTube embed (facade). Footer: tags, "Updated" date if differs, prev/next. Template `note`: same without TOC and lede; smaller h1.

### Projects `/projects`

Heading "Cleared for Release" + sub-line (§3). Groups: "Agents platform (current)", "Developer platform & infrastructure", "Payments & multi-tenancy", "Frontend & design systems", "Side projects" (lo-fi album with both Spotify embeds, Arduino tinkering, this site). Each entry: title, 2–3 sentence problem → what I did → outcome, tag chips, sensitivity is never shown to visitors.

### Resume `/resume`

One paragraph, a large "Download PDF" ink button, then an HTML version of the résumé (roles from `data.ts` experience entries, skills grouped) so recruiters can read without downloading. Print stylesheet. No phone.

### Contact `/contact`

"Say hello" — one line of intent ("Recruiting, a question about a post, or a soccer take — email works best"), `mailto:hello@nnajiabraham.com` as a big link, socials as a list with handles. No form.

### 404

"Wrong runway." One line, link home. One joke, as allowed.
