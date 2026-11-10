// Beamer-style progress bar along the top edge of a v2026 presentation.
//
// reveal-template-top.php loads this file, and css/progress-bar.css, only
// when the deck sets $show_progress_bar = true before including it; the
// deck's other $progress_bar_* variables arrive as the progressBar entry of
// Reveal.initialize()'s config (see the options below, and the README).
// Any other reveal.js 5 deck can load it, and the stylesheet, after
// reveal.js and before calling Reveal.initialize(), pass the options as
// progressBar in its config, and mark where each section begins with
// data-progress-section (below), since it has no reveal-outline.js.
//
// Unlike reveal's own progress bar (which counts slides), this counts every
// *build*: each slide contributes one step for its initial state plus one
// per fragment group.  (With $progress_bar_unit = 'slides' it counts slides
// instead.)
//
// The bar is divided into the deck's main sections, as in Beamer: one per
// <h1>, found via the outline slides that reveal-outline.js puts in their
// place.  <h2> sub-sections stay within their <h1>'s segment.  Slides
// before the first heading form an untitled lead-in.
//
// To show a different label on the bar -- a short form of a long title, or
// a name for the untitled lead-in -- give data-progress-label to any slide
// in that segment, or to the vertical stack containing it (not to the
// <h1>, which reveal-outline.js removes).  E.g.
//     <section data-progress-label="Info">  <h1>Course information</h1> ...
//     <section id="title-page" data-progress-label="Intro"> ...
//
// data-progress-icon, placed the same way, shows a FontAwesome icon instead
// of the text, for sections usually too small for any: e.g.
// data-progress-icon="fa-book".  ("fa-solid" is assumed unless another
// style is given.)  The name still appears beside the icon in the tag that
// floats over the bar while that section is current.
//
// data-progress-section="Seminar" on a slide, or on a vertical stack, makes
// it a section of its own with that name, for slides that have no <h1>:
// e.g. seminar slides added at the end.
//
// The bar is recomputed whenever slides are added or removed (the
// bibliography, which Biblify adds late, or slides a deck switches on and
// off), so a deck need not tell it.
//
// Sections' widths are not strictly proportional to their length (see
// exponent below), so that a short one is not squashed to a sliver.
//
// Clicking the bar jumps to the build nearest the pointer.  While the
// pointer is over the bar, a thumbnail of that build hangs below it.
(function() {
	// The options, each settable from the deck as $progress_bar_<name in
	// snake case>, e.g. $progress_bar_min_section_px:
	//
	//   unit            'builds' counts every fragment step, 'slides' only slides.
	//   exponent        A section's share of the bar grows as (its steps)^exponent,
	//                   i.e. less than in proportion when below 1.  1 makes the
	//                   bar strictly proportional.  Within a section the steps
	//                   are evenly spaced.
	//   minSectionPx    No section is narrower than this; 0 for no minimum.
	//   clickable       Clicking the bar jumps to the build nearest the pointer.
	//   thumbnails      While the pointer is over the bar, a thumbnail of that
	//                   build hangs below it.
	//   thumbnailWidth  In px.
	const DEFAULTS = {
		unit: 'builds',
		exponent: 0.8,
		minSectionPx: 24,
		clickable: true,
		thumbnails: true,
		thumbnailWidth: 256
	};
	let options = DEFAULTS;		// replaced once reveal is ready

	// Whether a step is a build (a fragment index) rather than a slide.
	const countsBuilds = () => options.unit === 'builds' && Reveal.getConfig().fragments;

	function stepsIn(slide) {
		if (!countsBuilds()) return 1;
		const groups = new Set();
		slide.querySelectorAll('.fragment').forEach(f => groups.add(f.getAttribute('data-fragment-index')));
		return 1 + groups.size;
	}

	// If this slide opens a section, return its title.  reveal-outline.js
	// replaces every <h1> with a copy of the outline slide
	// (section.highlightCurrent) whose own entry is marked .current-item,
	// so that copy is the first slide of each section.  An <h2> entry is
	// a sub-section, so climb to its top-level <h1> entry.  A slide in a
	// data-progress-section stack belongs to that section instead.
	function sectionTitleAt(slide) {
		const own = progressAttributeAt(slide, 'data-progress-section');
		if (own !== null) return own;
		if (!slide.classList.contains('highlightCurrent')) return null;
		let item = slide.querySelector('.current-item');
		if (!item) return null;
		while (item.parentElement.parentElement.tagName === 'LI') {
			item = item.parentElement.parentElement;
		}
		return item.querySelector(':scope > a').textContent.trim();
	}

	// Scroll view (used on phones) moves every slide out of its vertical
	// stack into its own .scroll-page, tagging it with data-index-h, and
	// discards the stacks -- and their attributes with them.  So record
	// each top-level section's attributes while the original structure
	// still exists: reveal-outline.js runs before reveal starts, and so
	// before scroll view can activate.
	const PROGRESS_ATTRIBUTES = ['data-progress-label', 'data-progress-icon', 'data-progress-section'];
	const stackAttributes = [];
	document.addEventListener('outline-built', () => {
		document.querySelectorAll('.reveal .slides > section').forEach((section, h) => {
			stackAttributes[h] = Object.fromEntries(PROGRESS_ATTRIBUTES.map(a => [a, section.getAttribute(a)]));
		});
	});

	// The named attribute on this slide, or on its enclosing stack.
	function progressAttributeAt(slide, name) {
		if (slide.hasAttribute(name)) return slide.getAttribute(name);
		const stack = slide.parentElement.closest('section');
		if (stack) return stack.getAttribute(name);
		const h = slide.getAttribute('data-index-h');	// scroll view
		return h !== null ? stackAttributes[h]?.[name] ?? null : null;
	}

	// The deck's slides in order.  In scroll view, getSlides() also returns
	// the emptied stacks reveal leaves at the front of .slides; skip them.
	function deckSlides() {
		const slides = Reveal.getSlides();
		return Reveal.isScrollView() ? slides.filter(s => s.closest('.scroll-page')) : slides;
	}

	// Shares of the bar in proportion to weights, except that none is
	// smaller than floor (a fraction of the bar): any that would be are
	// held at the floor, and the rest divide what remains.
	function shares(weights, floor) {
		if (floor * weights.length >= 1) return weights.map(() => 1 / weights.length);
		const held = weights.map(() => false);
		for (;;) {
			const free = weights.reduce((sum, w, k) => held[k] ? sum : sum + w, 0);
			const room = 1 - floor * held.filter(Boolean).length;
			const out = weights.map((w, k) => held[k] ? floor : room * w / free);
			const under = out.map((s, k) => !held[k] && s < floor);
			if (!under.includes(true)) return out;
			under.forEach((u, k) => { if (u) held[k] = true; });
		}
	}

	// Every step of the deck as of the last update, for the pointer:
	// its slide, its fragment index, and its position on the bar (0-1).
	let steps = [];

	function update(bar) {
		// Recomputed every time, since the bibliography slides are added
		// after the presentation starts.
		const slides = deckSlides();
		const current = slides.indexOf(Reveal.getCurrentSlide());
		// Group consecutive slides into sections, recording each section's
		// first step and length.  A sub-section's outline slide yields its
		// parent's title, so it only starts a new segment if the title
		// actually changes.
		const sections = [];
		let done = 0, title = '';
		steps = [];
		slides.forEach((slide, i) => {
			const opens = sectionTitleAt(slide);
			if (opens !== null) title = opens;
			if (!sections.length || sections[sections.length - 1].title !== title) {
				sections.push({ title, label: null, icon: null, first: steps.length, length: 0, current: false });
			}
			const section = sections[sections.length - 1];
			if (section.label === null) section.label = progressAttributeAt(slide, 'data-progress-label');
			if (section.icon === null) section.icon = progressAttributeAt(slide, 'data-progress-icon');
			if (i === current) {
				section.current = true;
				done = steps.length;
			}
			const n = stepsIn(slide);
			for (let j = 0; j < n; j++) {
				steps.push({ slide, fragment: countsBuilds() ? j - 1 : undefined });
			}
			section.length += n;
		});
		if (countsBuilds()) {
			const f = Reveal.getIndices().f;
			done += (typeof f === 'number') ? f + 1 : 0;
		}
		done = Math.min(done, steps.length - 1);

		// Lay the sections out along the bar, and place each step.  The
		// steps of the last section run right to the end of the bar, so
		// that the last step of all fills it.
		const floor = bar.clientWidth ? options.minSectionPx / bar.clientWidth : 0;
		const share = shares(sections.map(s => Math.pow(s.length, options.exponent)), floor);
		let left = 0;
		sections.forEach((s, k) => {
			s.left = left;
			s.width = share[k];
			left += share[k];
			const gaps = k === sections.length - 1 ? s.length - 1 : s.length;
			for (let j = 0; j < s.length; j++) {
				steps[s.first + j].at = s.left + (gaps ? s.width * j / gaps : s.width);
			}
		});
		const at = steps[done]?.at ?? 0;
		bar.querySelector('.fill').style.width = (100 * at) + '%';

		// Rebuild the segments only when the section layout changes, so
		// the colour transition on the current title still animates.
		sections.forEach(s => s.text = s.label ?? s.title);
		const layout = sections.map(s => s.text + '/' + s.icon).join('|');
		const holder = bar.querySelector('.segments');
		if (holder.dataset.layout !== layout) {
			holder.dataset.layout = layout;
			holder.replaceChildren(...sections.map(s => {
				const seg = document.createElement('div');
				seg.className = 'segment';
				const label = seg.appendChild(document.createElement('span'));
				if (s.icon) {
					const icon = label.appendChild(document.createElement('i'));
					icon.className = /\bfa-(solid|regular|light|thin|duotone|brands)\b/.test(s.icon) ? s.icon : 'fa-solid ' + s.icon;
					const name = label.appendChild(document.createElement('span'));
					name.className = 'segment-name';
					name.textContent = s.text;
				} else {
					label.textContent = s.text;
				}
				return seg;
			}));
		}
		const barBox = bar.getBoundingClientRect();
		holder.querySelectorAll('.segment').forEach((seg, k) => {
			const s = sections[k];
			seg.style.left = (100 * s.left) + '%';
			seg.style.width = (100 * s.width) + '%';
			seg.classList.toggle('current', s.current);
			if (s.current) {
				const p = s.width ? (at - s.left) / s.width : 1;
				seg.style.setProperty('--section-progress', (100 * Math.max(0, Math.min(1, p))) + '%');
			}

			// Measured each time, since the bar has no width while hidden
			// (e.g. in overview mode) and the window can be resized.
			const label = seg.firstChild;
			if (!barBox.width) return;
			label.style.marginLeft = '';
			const room = seg.clientWidth - 8;	// less the 4px padding either side
			// For an icon, test only the icon: the name beside it is shown
			// only once the segment is already floating.
			const content = label.querySelector(':scope > i') ?? label;
			seg.classList.toggle('tight', content.offsetWidth > room);

			// Keep a floating title on screen at either end of the bar, by
			// shifting it back by exactly its overhang.  (Clamping to the
			// bar rather than to the segment matters on phones, where a
			// small section's segment is narrower than its own padding and
			// so pokes past the bar's edge.)
			if (seg.matches('.tight.current')) {
				const box = label.getBoundingClientRect();
				const shift = box.left < barBox.left ? barBox.left - box.left
					: box.right > barBox.right ? barBox.right - box.right : 0;
				if (shift) label.style.marginLeft = shift + 'px';
			}
		});
	}

	// The step whose position is nearest a point on the bar (a clientX).
	function stepAt(bar, x) {
		const box = bar.getBoundingClientRect();
		const p = (x - box.left) / box.width;
		let best = 0;
		steps.forEach((s, d) => {
			if (Math.abs(s.at - p) < Math.abs(steps[best].at - p)) best = d;
		});
		return best;
	}

	function goTo(step) {
		const { h, v } = Reveal.getIndices(step.slide);
		Reveal.slide(h, v, step.fragment);
	}

	// Paint a slide's own background (data-background-*), or failing that
	// its stack's, onto el.  Done from the attributes, since reveal.js
	// only loads a background image once its slide is near.
	function paintBackground(el, slide) {
		const has = s => s && [...s.attributes].some(a => a.name.startsWith('data-background'));
		const stack = slide.parentElement.closest('section');
		const from = has(slide) ? slide : has(stack) ? stack : null;
		el.removeAttribute('style');
		if (!from) return;
		const get = name => from.getAttribute('data-background-' + name);
		let image = get('image'), color = get('color');
		const either = from.getAttribute('data-background');
		if (either && /^(http|file|\/\/)|\.(svg|png|jpe?g|gif|bmp|webp)([?#\s]|$)/i.test(either)) image ??= either;
		else if (either) color ??= either;
		el.style.background = get('gradient') ?? color ?? '';
		if (image) {
			el.style.backgroundImage = image.split(',').map(u => 'url("' + u.trim().replace(/"/g, '%22') + '")').join(', ');
		}
		el.style.backgroundSize = get('size') ?? 'cover';
		el.style.backgroundPosition = get('position') ?? 'center';
		el.style.backgroundRepeat = get('repeat') ?? 'no-repeat';
		el.style.opacity = get('opacity') ?? '';
	}

	// A copy of a step's slide, with its fragments as they stand at that
	// step.  A vertical slide is wrapped in a bare copy of its stack, so
	// that selectors relying on the stack (an id, say) still match.
	function copyOf(step) {
		const slide = step.slide;
		const copy = slide.cloneNode(true);
		copy.querySelectorAll('script').forEach(e => e.remove());
		copy.querySelectorAll('.fragment').forEach(e => {
			const k = parseInt(e.getAttribute('data-fragment-index'), 10);
			e.classList.toggle('visible', step.fragment === undefined || k <= step.fragment);
			e.classList.toggle('current-fragment', k === step.fragment);
		});
		// Images reveal.js has not lazy-loaded yet.
		copy.querySelectorAll('img[data-src]').forEach(e => { e.src = e.getAttribute('data-src'); });
		// Canvases copy empty; copy their pixels where the browser allows.
		const canvases = slide.querySelectorAll('canvas');
		copy.querySelectorAll('canvas').forEach((c, k) => {
			try { c.getContext('2d').drawImage(canvases[k], 0, 0); } catch (e) { /* e.g. WebGL */ }
		});
		// Videos (unless they have a poster) and iframes become placeholders;
		// audio goes.
		const media = slide.querySelectorAll('video, iframe, audio, object, embed');
		copy.querySelectorAll('video, iframe, audio, object, embed').forEach((e, k) => {
			if (e.tagName === 'AUDIO') return e.remove();
			const box = document.createElement(e.tagName === 'VIDEO' && e.poster ? 'img' : 'div');
			box.style.cssText = e.style.cssText;
			const w = media[k].offsetWidth, h = media[k].offsetHeight;
			if (w && h) {
				box.style.width = w + 'px';
				box.style.height = h + 'px';
			} else {
				if (e.getAttribute('width')) box.style.width = parseInt(e.getAttribute('width'), 10) + 'px';
				if (e.getAttribute('height')) box.style.height = parseInt(e.getAttribute('height'), 10) + 'px';
				if (!box.style.width || !box.style.height) box.style.aspectRatio = '16 / 9';
			}
			if (box.tagName === 'IMG') box.src = e.poster;
			else {
				box.className = 'thumb-placeholder';
				box.innerHTML = e.tagName === 'VIDEO' ? "<i class='fa-solid fa-film'></i>" : "<i class='fa-solid fa-globe'></i>";
			}
			e.replaceWith(box);
		});
		const stack = slide.parentElement.closest('section');
		const outer = stack ? stack.cloneNode(false) : copy;
		if (stack) outer.appendChild(copy);
		for (const s of new Set([outer, copy])) {
			s.classList.remove('past', 'future');
			s.classList.add('present');
			s.removeAttribute('hidden');
			s.removeAttribute('aria-hidden');
			s.style.display = 'block';
		}
		if (stack) outer.classList.add('stack');
		return { outer, copy };
	}

	// Show a thumbnail of a step below the bar, centred under its position.
	let thumb = null, shownStep = null;
	function showThumbnail(bar, step) {
		if (!thumb) {
			thumb = document.createElement('div');
			thumb.className = 'reveal build-progress-thumb';
			thumb.setAttribute('aria-hidden', 'true');
			thumb.innerHTML = "<div class='thumb-background'></div><div class='slides'></div>";
			// The deck's own background (from the theme) lies under the slide's.
			const look = getComputedStyle(Reveal.getViewportElement());
			for (const p of ['backgroundColor', 'backgroundImage', 'backgroundSize', 'backgroundPosition', 'backgroundRepeat']) {
				thumb.style[p] = look[p];
			}
			Reveal.getViewportElement().appendChild(thumb);
		}
		// Laid out at full size and scaled down, leaving reveal's margin
		// around the slide, as on screen.
		const { width, height } = Reveal.getComputedSlideSize();
		const margin = Reveal.getConfig().margin || 0;
		const thumbWidth = options.thumbnailWidth;
		const scale = thumbWidth * (1 - margin) / width;
		const thumbHeight = Math.round(thumbWidth * height / width);
		thumb.style.width = thumbWidth + 'px';
		thumb.style.height = thumbHeight + 'px';
		const slides = thumb.querySelector('.slides');
		Object.assign(slides.style, {
			width: width + 'px',
			height: height + 'px',
			left: (thumbWidth * margin / 2) + 'px',
			top: (thumbHeight * margin / 2) + 'px',
			transform: 'scale(' + scale + ')'
		});
		if (step !== shownStep) {
			shownStep = step;
			paintBackground(thumb.querySelector('.thumb-background'), step.slide);
			const { outer, copy } = copyOf(step);
			slides.replaceChildren(outer);
			// Vertical centring, as reveal.js does it.
			if (Reveal.getConfig().center || copy.classList.contains('center')) {
				if (outer !== copy) outer.style.top = 0;
				copy.style.top = Math.max((height - copy.scrollHeight) / 2, 0) + 'px';
			}
		}
		const box = bar.getBoundingClientRect();
		const x = box.left + step.at * box.width - thumbWidth / 2;
		thumb.style.left = Math.max(4, Math.min(x, innerWidth - thumbWidth - 6)) + 'px';
		thumb.style.top = (box.bottom + 6) + 'px';
		thumb.classList.add('shown');
	}

	function hideThumbnail(bar) {
		bar.classList.remove('hovering');
		if (thumb) thumb.classList.remove('shown');
	}

	Reveal.on('ready', () => {
		options = Object.assign({}, DEFAULTS, Reveal.getConfig().progressBar);
		const bar = document.createElement('div');
		bar.className = 'build-progress';
		bar.innerHTML = "<div class='fill'></div><div class='segments'></div><div class='hover-mark'></div>";
		document.querySelector('.reveal').appendChild(bar);

		const refresh = () => update(bar);
		['slidechanged', 'fragmentshown', 'fragmenthidden', 'overviewhidden', 'resize'].forEach(e => Reveal.on(e, refresh));
		refresh();

		// Slides added or removed after the start.  Other changes inside the
		// slides (MathJax typesetting, say) are ignored, and a burst of
		// changes costs one recomputation.
		let pending = null;
		const isSlide = n => n.nodeType === 1 && (n.tagName === 'SECTION' || n.querySelector('section'));
		new MutationObserver(records => {
			if (pending || !records.some(r => [...r.addedNodes, ...r.removedNodes].some(isSlide))) return;
			pending = setTimeout(() => { pending = null; refresh(); }, 50);
		}).observe(Reveal.getSlidesElement(), { childList: true, subtree: true });

		// Otherwise the bar lets the pointer through to the slide beneath.
		if (!options.clickable && !options.thumbnails) return;
		bar.classList.add('interactive');
		bar.classList.toggle('clickable', !!options.clickable);
		bar.addEventListener('mousemove', e => {
			const step = steps[stepAt(bar, e.clientX)];
			if (!step) return;
			bar.querySelector('.hover-mark').style.left = (100 * step.at) + '%';
			bar.classList.add('hovering');
			if (options.thumbnails) showThumbnail(bar, step);
		});
		bar.addEventListener('mouseleave', () => hideThumbnail(bar));
		if (options.clickable) {
			bar.addEventListener('click', e => {
				const step = steps[stepAt(bar, e.clientX)];
				if (!step) return;
				hideThumbnail(bar);
				goTo(step);
			});
		}
		Reveal.on('overviewshown', () => hideThumbnail(bar));
	});
})();
