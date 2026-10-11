# The Beamer-style progress bar for reveal.js decks built on libs/v2026.
#
# src/ is the canonical copy.  The bundle serves its own copy, as
# js/progress-bar.js and css/progress-bar.css, which `make install` refreshes;
# the PHP that turns the bar on and passes its settings stays in the bundle's
# templates (reveal-template-top.php, reveal-template-bottom.php).
#
#   make check     how src/ differs from the bundle's copy (nothing: in step)
#   make install   copy src/ into the bundle
#   make pull      copy the bundle's files back here, if they were edited there

LIBS = $(HOME)/Sites/jmckalex/prez/libs/v2026

.PHONY: help check install pull

help:
	@echo "check    compare src/ with $(LIBS)"
	@echo "install  copy src/ into $(LIBS)"
	@echo "pull     copy $(LIBS)'s files back into src/"

check:
	@diff -u $(LIBS)/js/progress-bar.js src/progress-bar.js && diff -u $(LIBS)/css/progress-bar.css src/progress-bar.css && echo "In step with $(LIBS)."

install:
	cp src/progress-bar.js $(LIBS)/js/progress-bar.js
	cp src/progress-bar.css $(LIBS)/css/progress-bar.css
	@echo "Now commit in $(LIBS), and upload it with: cd ~/Sites/jmckalex/prez && make minimal-sync"

pull:
	cp $(LIBS)/js/progress-bar.js src/progress-bar.js
	cp $(LIBS)/css/progress-bar.css src/progress-bar.css
