#!/usr/bin/env python3
"""Build Anki decks (.apkg) from the website's card data.

    pip install genanki
    python3 tools/build_anki.py

Writes anki/Italiano-A2.apkg and anki/Italiano-A1.apkg. Audio uses Anki's
built-in text-to-speech ({{tts it_IT:...}}), which reads the Italian with the
phone's or computer's own Italian voice, so no audio files are needed.
Re-importing an updated deck updates the existing cards and keeps your progress.
"""
import json
import re
from pathlib import Path

import genanki

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "anki"


def read_js_array(path, start_marker):
    """Pull a JSON-compatible array out of one of the data/*.js files."""
    text = path.read_text(encoding="utf-8")
    text = "\n".join(l for l in text.splitlines() if not l.strip().startswith("//"))
    start = text.index(start_marker) + len(start_marker) - 1
    depth = 0
    for i in range(start, len(text)):
        if text[i] == "[":
            depth += 1
        elif text[i] == "]":
            depth -= 1
            if depth == 0:
                return json.loads(text[start:i + 1])
    raise ValueError(f"No array after {start_marker!r} in {path}")


def read_verbs(path):
    text = path.read_text(encoding="utf-8")
    body = text[text.index("window.VERBS = {"):]
    verbs = []
    for m in re.finditer(r'(\w+):\s*\{\s*en:\s*"([^"]+)",\s*group:\s*"([^"]+)",\s*forms:\s*(\[[^\]]+\])', body):
        verbs.append((m.group(1), m.group(2), m.group(3), json.loads(m.group(4))))
    return verbs


CSS = """
.card { font-family: -apple-system, "Segoe UI", Roboto, Arial, sans-serif; font-size: 22px;
        text-align: center; color: #1a2232; background: #f6f8fc; padding: 18px 12px; }
.nightMode .card, .card.nightMode { color: #e6ebf4; background: #0f141d; }
.cat { font-size: 12px; letter-spacing: .12em; text-transform: uppercase; color: #5a6478; margin-bottom: 18px; }
.label { font-size: 11px; letter-spacing: .14em; text-transform: uppercase; color: #5a6478; margin-bottom: 6px; }
.big { font-size: 30px; font-weight: 700; line-height: 1.25; }
.answer { color: #1f3f94; }
.nightMode .answer { color: #93b1ff; }
.note { margin-top: 16px; font-size: 18px; color: #c4303b; font-style: italic; }
.nightMode .note { color: #ff7c84; }
hr#answer { border: 0; border-top: 2px dashed #cfd8e8; margin: 22px 0; }
"""

PHRASE_MODEL = genanki.Model(
    1735101201,
    "Quaderno Italiano (phrase)",
    fields=[{"name": "Italian"}, {"name": "English"}, {"name": "Category"}, {"name": "Note"}],
    templates=[
        {
            "name": "Italiano → English",
            "qfmt": '<div class="cat">{{Category}}</div><div class="label">Italiano</div>'
                    '<div class="big">{{Italian}}</div>{{tts it_IT speed=0.9:Italian}}',
            "afmt": '{{FrontSide}}<hr id="answer"><div class="label">English</div>'
                    '<div class="big answer">{{English}}</div>{{#Note}}<div class="note">{{Note}}</div>{{/Note}}',
        },
        {
            "name": "English → Italiano",
            "qfmt": '<div class="cat">{{Category}}</div><div class="label">English</div>'
                    '<div class="big">{{English}}</div>',
            "afmt": '{{FrontSide}}<hr id="answer"><div class="label">Italiano</div>'
                    '<div class="big answer">{{Italian}}</div>{{tts it_IT speed=0.9:Italian}}'
                    '{{#Note}}<div class="note">{{Note}}</div>{{/Note}}',
        },
    ],
    css=CSS,
)

VERB_MODEL = genanki.Model(
    1735101202,
    "Quaderno Italiano (verb form)",
    fields=[{"name": "Prompt"}, {"name": "Answer"}, {"name": "Meaning"}, {"name": "Table"}],
    templates=[{
        "name": "Coniuga",
        "qfmt": '<div class="cat">Presente</div><div class="big">{{Prompt}}</div>'
                '<div class="note" style="color:#5a6478">{{Meaning}}</div>',
        "afmt": '{{FrontSide}}<hr id="answer"><div class="big answer">{{Answer}}</div>'
                '{{tts it_IT speed=0.9:Answer}}<div class="note" style="font-style:normal">{{Table}}</div>',
    }],
    css=CSS,
)


def tag(category):
    return re.sub(r"[^a-z0-9]+", "_", category.lower()).strip("_")


def phrase_notes(cards, prefix):
    notes = []
    for it, en, cat, *rest in cards:
        note = rest[0] if rest else ""
        notes.append(genanki.Note(
            model=PHRASE_MODEL,
            fields=[it, en, cat, note],
            tags=[prefix, tag(cat)],
            guid=genanki.guid_for(prefix, it),
        ))
    return notes


def main():
    OUT.mkdir(exist_ok=True)
    a2 = read_js_array(ROOT / "data/a2-deck.js", "cards: [")
    a1 = read_js_array(ROOT / "data/a1-deck.js", "cards: [")
    verbs = read_verbs(ROOT / "data/grammar.js")

    deck_a2 = genanki.Deck(2059400101, "Italiano::A2 Frasi e modi di dire")
    for n in phrase_notes(a2, "a2"):
        deck_a2.add_note(n)
    genanki.Package(deck_a2).write_to_file(OUT / "Italiano-A2.apkg")

    deck_a1 = genanki.Deck(2059400102, "Italiano::A1 Primi passi")
    for n in phrase_notes(a1, "a1"):
        deck_a1.add_note(n)
    deck_verbs = genanki.Deck(2059400103, "Italiano::A1 Verbi (coniugazione)")
    pronouns = ["io", "tu", "lui / lei", "noi", "voi", "loro"]
    for inf, en, group, forms in verbs:
        table = "<br>".join(f"{p} <b>{f}</b>" for p, f in zip(pronouns, forms))
        for p, f in zip(pronouns, forms):
            deck_verbs.add_note(genanki.Note(
                model=VERB_MODEL,
                fields=[f"{p} · {inf}", f, f"{en} ({group})", table],
                tags=["a1", "verbi", tag(group)],
                guid=genanki.guid_for("verb", inf, p),
            ))
    genanki.Package([deck_a1, deck_verbs]).write_to_file(OUT / "Italiano-A1.apkg")

    print(f"A2: {len(a2)} notes ({len(a2) * 2} cards, both directions)")
    print(f"A1: {len(a1)} notes ({len(a1) * 2} cards) + {len(verbs) * 6} verb cards")


if __name__ == "__main__":
    main()
