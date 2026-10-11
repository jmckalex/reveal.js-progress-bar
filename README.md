# Progress bar

A Beamer-style progress bar for reveal.js 5 decks built on the `libs/v2026`
bundle of jmckalex.org: a thin bar along the top of every slide, divided into
the deck's sections, that fills one step per build.

- **Sections** come from the deck's `<h1>` headings, found through the outline
  slides that `reveal-outline.js` makes. Slides before the first heading form an
  untitled lead-in. A section whose title does not fit floats it over the bar
  while current.
- **Builds, not slides:** each slide counts once for its initial state and once
  per fragment group (`$progress_bar_unit = 'slides'` counts slides instead).
- **Widths** grow as (length)^0.8, with no section narrower than 24 px, so a
  short section (the bibliography, say) is not squashed to a sliver.
- **Click** the bar to jump to the build under the pointer; **hover** for a
  thumbnail of that slide, drawn by copying it (videos and iframes become
  placeholders, so nothing heavy loads).
- **Labels:** `data-progress-label="The end"` on any slide of a section (or its
  vertical stack, not the `<h1>`) renames it on the bar;
  `data-progress-icon="fa-book"` shows an icon instead;
  `data-progress-section="Seminar"` makes slides with no `<h1>` a section of
  their own.
- It recomputes itself when slides are added or removed (the late-arriving
  bibliography, slides a deck switches on and off).

## Using it in a deck

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
`progressBar` entry of `Reveal.initialize()`'s config.

## This directory

`src/` is the canonical copy; `make install` copies it into the bundle and
`make check` says whether the two are in step. The deck-side PHP (the settings
above and the loading) lives in the bundle's templates, and the bundle's
`README.md` documents it too.

## History

Built for PH226-426, *Philosophy of Society*, 2026-27: first inline in the
*identity* lecture (1 October 2026), copied into week 3 and given gentler
widths, clicking and thumbnails (11 October), then moved into `libs/v2026` as
an option, with `data-progress-section` and a refresh on slide changes. See
https://jmckalex.org/software/reveal/ for the full chronicle.
