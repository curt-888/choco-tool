# English Learning Tools (英语小乐园)

Children's English learning SPA. Pure vanilla HTML/CSS/JS — no build tools, no framework, no dependencies.

## How to run

Open `index.html` in a browser. That's it. No server required (uses localStorage for all data).

## Script load order

JS modules are global objects loaded via `<script>` tags in `index.html`. Order matters:

1. `js/data.js` — vocabulary (80 words), sentences (30), achievements, categories
2. `js/phonics.js` — phonics/sound breakdown engine (`phonics` global)
3. `js/sentence-generator.js` — template-based sentence generator (`sentenceGenerator` global)
4. `js/storage.js` — localStorage persistence (`storage` global)
5. `js/speech.js` — Web Speech API wrapper (`speech` global)
6. `js/srs.js` — Leitner spaced repetition (`srs` global)
7. `js/ui.js` — confetti, toast, animations (`ui` global)
8. `js/app.js` — router + all page controllers (`router`, `setup`, `dashboardPage`, `sentencePage`, `flashcardPage`, `listeningPage`, `listenFillPage`, `challengePage`, `achievementsPage`)

## Architecture

- **Hash-based SPA routing** — `#dashboard`, `#sentence`, `#flashcard`, `#listening`, `#listenfill`, `#challenge`, `#achievements`
- **All data in localStorage** — keys: `profiles`, `activeProfile`, `progress_<userId>`
- **Two roles** — `child` mode (larger fonts via `.child-mode` class) and `parent` mode
- **UI language is Chinese** — all user-facing text is 中文
- **SRS system** — Leitner boxes 0-5 with intervals [0, 1, 3, 7, 14, 30] days

## Key globals

| Object | File | Purpose |
|---|---|---|
| `VOCAB_DATA` | data.js | 80 words across 8 categories |
| `SENTENCE_DATA` | data.js | 30 hardcoded sentences |
| `CATEGORIES` | data.js | 8 word categories with metadata |
| `ACHIEVEMENTS` | data.js | 16 achievement definitions |
| `srs` | srs.js | Spaced repetition engine |
| `storage` | storage.js | All localStorage operations |
| `sentenceGenerator` | sentence-generator.js | Generates 2000+ sentences from templates |
| `phonics` | phonics.js | Word breakdown for phonics hints |
| `speech` | speech.js | TTS via Web Speech API |

## Gotchas

- No module system — all globals, name collisions are possible
- `sentenceGenerator` generates sentences lazily and caches in `_sentences`
- `storage.getProgress()` auto-initializes if missing (recursive call)
- Speech API requires user interaction before first play (browser policy)
- `listenFillPage` uses `sentenceGenerator` which references `VOCAB_DATA` and `CATEGORIES` — these must be loaded first
- `phonics.js` has a manual `WORD_MAP` override for common words — update both `autoBreakdown` rules and `WORD_MAP` when adding phonics rules

## Adding vocabulary

Add entries to `VOCAB_DATA` in `js/data.js`. Each word needs: `id` (unique), `en`, `zh`, `category`, `emoji`, `difficulty` (1-3). Category must exist in `CATEGORIES`.

## Adding sentences

Add to `SENTENCE_DATA` in `js/data.js` for hardcoded sentences, or add templates to `sentenceGenerator.TEMPLATES` in `js/sentence-generator.js` for auto-generated ones.

## File structure

```
index.html          — Single HTML file, all page sections
css/style.css       — All styles, CSS variables for theming
js/data.js          — Static data (vocab, sentences, achievements)
js/phonics.js       — Phonics engine
js/sentence-generator.js — Sentence template engine
js/storage.js       — localStorage wrapper
js/speech.js        — Web Speech API wrapper
js/srs.js           — Leitner SRS algorithm
js/ui.js            — UI effects (confetti, toast, achievements check)
js/app.js           — Router, page controllers, init
```
