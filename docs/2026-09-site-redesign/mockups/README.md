# Mockups — three directions

Static HTML + CSS explorations of the design brief. They share the same palette tokens, copy, page structure, and micro-interaction set (M1–M12 in `design-brief.md`) so the comparison is about *voice*, not content. Fonts load from Google Fonts here **for mockups only**; the real build self-hosts.

## How to open

Any browser, no build step:

```bash
# from the repo root
open docs/2026-09-site-redesign/mockups/a-fieldnotes/index.html      # macOS
xdg-open docs/2026-09-site-redesign/mockups/a-fieldnotes/index.html  # Linux
# or serve the folder so relative paths and fonts behave identically to production:
npx --yes serve docs/2026-09-site-redesign/mockups
```

Each direction has `index.html` (home), `blog-post.html` (article template), `about.html`, a `style.css`, and a 90-line `app.js` for the interactions that need JS (sliding nav indicator, copy button, embed facades, status-line cycle, TOC highlight). Photos are shared from `assets/`.

Screenshots of every page at 1440 px and 390 px wide are in `screenshots/` (full-page captures with the viewport set to 1440×900 and 390×844; filenames `<direction>-<page>-<viewport>.png`).

## The directions

### `a-fieldnotes` — editorial notebook

Rubik headings, Source Serif 4 body, JetBrains Mono. Hairline rules, a mono marginalia column with section numbers on desktop, radius 4 px only, the headshot as "fig. 1" with a caption, hobby photos floated into the margins on About. Feels like a well-kept notebook. Best long-form reading of the three; the serif body makes the blog the centre of gravity. Risk: the most "designed" of the three and the least aligned with the rounded-geometric brief (Rubik is rounded, Source Serif is not).

### `b-groundcrew` — instrument panel

Red Hat Display / Text / Mono, one superfamily. A thin mono status strip above the nav, a bordered "data plate" beside the hero with key/value facts (role, now, before, base, off duty), a manifest-style table for posts, bordered panels for projects, numbered section headers with an accent index chip, a "flight strip" metadata panel on posts. The aviation and F1 interests show up as structure, not decoration. Recruiter-friendly: the data plate answers the first five questions without scrolling.

### `c-greenhouse` — soft and organic

Nunito headings, Lora body, IBM Plex Mono. Floating pill nav, faint green-yellow and ochre radial glows in the page background, radius 16–24 px, pill tags, an organic blob-mask on the portrait that rounds to a circle on hover, hobby photos as blobs alternating sides, an inverted ink tile for the album. The warmest and friendliest; leans toward the garden/lo-fi side of the personality. Risk: the softness can read "lifestyle blog" to a recruiter, and blob masks date quickly.

## Recommendation

**`b-groundcrew`.** Reasons, in order of weight:

1. The audience priority is recruiters first. The data plate and manifest table give them role, current focus, and proof-of-work in one screen; the other two make them read prose to get there.
2. It is the only direction that satisfies the type brief cleanly: rounded geometric sans for UI and headings *and* body, with a metrically matched mono, two families + mono, all on Fontsource.
3. Structure carries the personality (aviation strips, telemetry labels) without a single decorative flourish, which matches "a bit private, hands-on, dry humour".
4. It has the least CSS surprise for the implementer: no floats with negative margins (A), no blob masks or fixed-attachment gradients (C).

What to borrow from the others if B is chosen: A's serif is not needed, but A's "fig. 1" caption habit for photos is worth keeping; C's inverted ink tile for the album is a better Spotify card than B's tinted panel.

## Notes for the implementer

- All three directions set `prefers-reduced-motion` to disable transitions and animations entirely; keep that.
- The monogram is a placeholder path (`A` + `N` strokes). Replace with a designed mark before launch or drop it and use the name only.
- Embed facades point at real Spotify/YouTube embed URLs; the YouTube ID is a placeholder.
- No pure white or pure black is used anywhere; the darkest value is `#2B2622`, the lightest `#FBF8F2`.
