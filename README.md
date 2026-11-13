# Quaderno d'Italiano

A small, offline-friendly study site for two Italian learners:

| Section | Level | What's inside |
|---|---|---|
| **Mazzo A2** (`#a2`) | A2 | 161 cards: everyday conversation, restaurant & shops, travel, past tenses, future & conditional, *ci* / *ne*, idioms (*modi di dire*), proverbs, connecting words, colloquial Italian. Most cards carry a short grammar note on the back. |
| **Mazzo A1** (`#a1`) | A1 | 130 cards: greetings, courtesy, survival phrases, question words, numbers, time, family, food, places, first verbs, adjectives & colours. |
| **La mia grammatica** (`#grammatica`) | A1 | A pocket grammar book in 11 chapters: pronunciation, pronouns & *tu/Lei*, *essere* & *avere*, regular verbs, 12 key irregular verbs, reflexives, *piacere*, negation & questions, articles, a first look at the *passato prossimo*, and a conjugation drill. |

## Using it

Open `index.html` in any browser (no build step needed).

Flashcards: read the card and guess the answer, then press **Mostra la risposta** (or tap the card). Mark **✓ Giusto** if you got it right or **✗ Sbagliato** if you didn't. Wrong cards come back a few cards later; right cards count towards your progress. Switch direction (IT → EN / EN → IT), filter by category, shuffle, hide known cards, or turn on **Audio automatico** to hear every card. Progress is saved in the browser.

Keyboard: `Space` reveal · `1` wrong · `2` right · `←` `→` move · `S` speak.

### No sound?

Audio uses the device's built-in Italian voice. If you hear nothing: turn the volume up and switch off silent mode (iPhone side switch); install an Italian voice (iPhone: Settings → Accessibility → Spoken Content → Voices → Italian; Android: Settings → Text-to-speech); and open the page directly in Safari or Chrome rather than inside another app.

## Install it as a phone app

The site is a Progressive Web App: once it is hosted, you can add it to your home screen and it opens full-screen like an app, and works offline.

1. **Host it with GitHub Pages:** repo **Settings → Pages → Build and deployment → Deploy from a branch**, pick the branch and `/ (root)`, then Save. After a minute it is live at `https://<your-username>.github.io/Italian-flashcards-/`. (Free GitHub accounts need the repo to be public for Pages.)
2. **iPhone / iPad:** open that link in **Safari** → Share button → **Add to Home Screen**.
3. **Android:** open it in **Chrome** → ⋮ menu → **Install app** (or **Add to Home screen**).

Each phone keeps its own progress, so you and your partner can use the same link.

## Anki decks

Ready-made decks are in [`anki/`](anki/):

| File | Contents |
|---|---|
| `Italiano-A2.apkg` | 161 phrases as 322 cards (Italian → English and English → Italian), with grammar notes |
| `Italiano-A1.apkg` | 130 phrases as 260 cards, plus 132 verb conjugation cards (*noi · andare → andiamo*) |

Import with **File → Import** in Anki on a computer, or open the file on your phone with **AnkiDroid** (Android, free) or **AnkiMobile** (iPhone, paid). Cards read the Italian aloud with Anki's built-in text-to-speech. Sync between devices with a free AnkiWeb account.

To rebuild the decks after editing cards: `pip install genanki && python3 tools/build_anki.py`. Re-importing updates the existing cards and keeps your review history.

## Adding cards

Cards live in `data/a2-deck.js` and `data/a1-deck.js` as `[italiano, english, category, note]`. Verbs for the grammar book and drill live in `data/grammar.js`.
