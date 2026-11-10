# Quaderno d'Italiano

A small, offline-friendly study site for two Italian learners:

| Section | Level | What's inside |
|---|---|---|
| **Mazzo A2** (`#a2`) | A2 | 161 cards: everyday conversation, restaurant & shops, travel, past tenses, future & conditional, *ci* / *ne*, idioms (*modi di dire*), proverbs, connecting words, colloquial Italian. Most cards carry a short grammar note on the back. |
| **Mazzo A1** (`#a1`) | A1 | 130 cards: greetings, courtesy, survival phrases, question words, numbers, time, family, food, places, first verbs, adjectives & colours. |
| **La mia grammatica** (`#grammatica`) | A1 | A pocket grammar book in 11 chapters: pronunciation, pronouns & *tu/Lei*, *essere* & *avere*, regular verbs, 12 key irregular verbs, reflexives, *piacere*, negation & questions, articles, a first look at the *passato prossimo*, and a conjugation drill. |

## Using it

Open `index.html` in any browser (no build step, no server needed), or turn on GitHub Pages for the repo.

Flashcards: tap the card to turn it over, **Lo so** marks it as known, **Ripassa** brings it back a few cards later. Switch direction (IT → EN / EN → IT), filter by category, shuffle, and hide known cards. The speaker button reads the Italian aloud using your device's Italian voice. Progress is saved in the browser.

Keyboard: `Space` flip · `←` `→` move · `1` review · `2` know · `S` speak.

## Adding cards

Cards live in `data/a2-deck.js` and `data/a1-deck.js` as `[italiano, english, category, note]`. Verbs for the grammar book and drill live in `data/grammar.js`.
