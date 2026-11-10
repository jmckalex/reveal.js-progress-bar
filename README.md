# Progress bar

A Beamer-style progress bar for reveal.js 5: a thin bar along the top of every
slide, divided into the deck's sections, that fills one step per build. It was
written for the `libs/v2026` bundle of jmckalex.org's lecture decks, and works
in any reveal.js 5 deck.

- **Sections** come from the deck's `<h1>` headings, found through the outline
  slides that `reveal-outline.js` makes, or, in any other deck, from
  `data-progress-section`. Slides before the first section form an untitled
  lead-in. A section whose title does not fit floats it over the bar while
  current.
- **Builds, not slides:** each slide counts once for its initial state and once
  per fragment group (`unit: 'slides'` counts slides instead).
- **Widths** grow as (length)^0.8, with no section narrower than 24 px, so a
  short section (the bibliography, say) is not squashed to a sliver.
- **Click** the bar to jump to the build under the pointer; **hover** for a
  thumbnail of that slide, drawn by copying it (videos and iframes become
  placeholders, so nothing heavy loads).
- **Labels:** `data-progress-label="The end"` on any slide of a section (or its
  vertical stack, not the `<h1>`) renames it on the bar;
  `data-progress-icon="fa-book"` shows a Font Awesome icon instead;
  `data-progress-section="Seminar"` starts a section of that name.
- It recomputes itself when slides are added or removed (the late-arriving
  bibliography, slides a deck switches on and off), and hides itself in the
  overview and in a PDF (`?print-pdf`).

![The bar along the top of a slide, with a thumbnail of a later slide below the pointer](https://jmckalex.org/software/reveal/images/bar-hover.webp)

## Installing it in a reveal.js deck

Download the two files in `src/`, `progress-bar.js` and `progress-bar.css`
(or `git clone https://github.com/jmckalex/reveal.js-progress-bar`), and put
them beside your deck. Then:

1. **Load them after reveal.js and before `Reveal.initialize()`.** The script
   needs the global `Reveal` that `dist/reveal.js` defines, and listens for
   its `ready` event:
   ```html
   <link rel="stylesheet" href="progress-bar.css">
   …
   <script src="dist/reveal.js"></script>
   <script src="progress-bar.js"></script>
   <script>
     Reveal.initialize({
       hash: true,
       // Every setting is optional; these are the defaults.
       progressBar: {
         unit: 'builds',        // or 'slides'
         exponent: 0.8,         // widths grow as length^exponent; 1 = proportional
         minSectionPx: 24,      // no section narrower than this; 0 = no minimum
         clickable: true,       // click to jump
         thumbnails: true,      // hover for a thumbnail
         thumbnailWidth: 256    // in px
       }
     });
   </script>
   ```
2. **Mark where each section begins**, with `data-progress-section` on its
   first slide. Every slide after it belongs to that section until the next
   one begins:
   ```html
   <section><h2>Title</h2></section>                     <!-- the lead-in -->
   <section data-progress-section="Introduction">…</section>
   <section>…</section>                                  <!-- still Introduction -->
   <section data-progress-section="The argument" data-progress-label="Argument">…</section>
   <section data-progress-section="References" data-progress-icon="fa-book">…</section>
   ```
   Put the attribute on a slide rather than on a vertical stack: on a phone,
   reveal.js's scroll view takes the stacks apart, and their attributes with
   them. (`reveal-outline.js` decks are the exception: the bar records the
   stacks' attributes before that happens.)
3. **Icons** (`data-progress-icon`) need Font Awesome 6 on the page; without
   it, leave them out. The thumbnails use it too, for the placeholders that
   stand in for videos and iframes.

The bar is brown, to suit the theme it was made for (`--theme-brown`, which
falls back to `rgb(139, 116, 61)`). To recolour it, override the
`.build-progress` rules in `progress-bar.css`, or set `--theme-brown` on
`:root` for the fill's line and the pointer's tick.

## In a libs/v2026 deck

Set these before including `reveal-template-top.php`; each can be left out for
its default:

```php
$show_progress_bar = true;
$progress_bar_unit = 'builds';          // 'builds' or 'slides'
$progress_bar_exponent = 0.8;           // widths grow as length^exponent; 1 = proportional
$progress_bar_min_section_px = 24;      // no section narrower than this; 0 = no minimum
$progress_bar_clickable = true;         // click to jump
$progress_bar_thumbnails = true;        // hover for a thumbnail
$progress_bar_thumbnail_width = 256;    // in px
```

The templates load `js/progress-bar.js` and `css/progress-bar.css` only when the
bar is on, and never with `?print-pdf`, and pass the settings as the
`progressBar` entry of `Reveal.initialize()`'s config. Sections come from the
deck's `<h1>`s, through `reveal-outline.js`.

## This directory

`src/` is the canonical copy; `make install` copies it into the bundle and
`make check` says whether the two are in step. The deck-side PHP (the settings
above and the loading) lives in the bundle's templates, and the bundle's
`README.md` documents it too.

## History

Built for PH226-426, *Philosophy of Society*, 2026-27: first inline in the
*identity* lecture (1 October 2026), copied into week 3 and given gentler
widths, clicking and thumbnails (11 October), then moved into `libs/v2026` as
an option, with `data-progress-section` and a refresh on slide changes. Made
usable in any reveal.js deck on 10 November. See
https://jmckalex.org/software/reveal/ for the full chronicle.

## Licence

MIT; see `LICENSE`.
