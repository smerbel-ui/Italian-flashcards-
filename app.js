(function () {
  "use strict";

  var DECKS = { a2: window.DECK_A2, a1: window.DECK_A1 };
  var $ = function (id) { return document.getElementById(id); };

  // ---------- Storage (best effort: progress lives in this browser only) ----------
  function load(key, fallback) {
    try { var v = localStorage.getItem("quaderno:" + key); return v ? JSON.parse(v) : fallback; }
    catch (e) { return fallback; }
  }
  function save(key, value) {
    try { localStorage.setItem("quaderno:" + key, JSON.stringify(value)); } catch (e) { /* ignore */ }
  }

  // ---------- Speech (Italian voice if the device has one) ----------
  var canSpeak = "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
  var itVoice = null;
  function pickVoice() {
    try {
      var voices = window.speechSynthesis.getVoices();
      itVoice = voices.filter(function (v) { return /^it/i.test(v.lang); })[0] || null;
    } catch (e) { itVoice = null; }
  }
  if (canSpeak) {
    pickVoice();
    try { window.speechSynthesis.onvoiceschanged = pickVoice; } catch (e) { /* ignore */ }
  }
  function speak(text, rate) {
    if (!canSpeak) return;
    try {
      window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text.replace(/\s\/\s/g, ", ").replace(/\.\.\./g, " "));
      u.lang = "it-IT";
      if (itVoice) u.voice = itVoice;
      u.rate = rate || 0.9;
      window.speechSynthesis.speak(u);
    } catch (e) { /* ignore */ }
  }
  var SPEAK_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  // =====================================================================
  // Flashcards
  // =====================================================================
  var ALL = "Tutte";
  var state = {
    deckId: null, cat: ALL, dir: load("dir", "it"), hideKnown: false,
    shuffled: false, order: [], pos: 0, flipped: false, known: {}
  };

  function deck() { return DECKS[state.deckId]; }
  function cardKey(c) { return c[0]; }
  function isKnown(i) { return !!state.known[cardKey(deck().cards[i])]; }

  function categories() {
    var seen = [], counts = {};
    deck().cards.forEach(function (c) {
      if (!counts[c[2]]) { counts[c[2]] = 0; seen.push(c[2]); }
      counts[c[2]]++;
    });
    return { list: seen, counts: counts };
  }

  function buildOrder(keepCurrent) {
    var current = state.order[state.pos];
    var idx = [];
    deck().cards.forEach(function (c, i) {
      if (state.cat !== ALL && c[2] !== state.cat) return;
      if (state.hideKnown && isKnown(i)) return;
      idx.push(i);
    });
    if (state.shuffled) shuffle(idx);
    state.order = idx;
    var p = keepCurrent ? idx.indexOf(current) : -1;
    state.pos = p >= 0 ? p : Math.min(state.pos, Math.max(idx.length - 1, 0));
    if (!keepCurrent) state.pos = 0;
  }

  function renderChips() {
    var cats = categories();
    var html = '<button type="button" class="chip" role="tab" data-cat="' + ALL + '" aria-selected="' + (state.cat === ALL) + '">Tutte<span class="n">' + deck().cards.length + '</span></button>';
    cats.list.forEach(function (c) {
      html += '<button type="button" class="chip" role="tab" data-cat="' + esc(c) + '" aria-selected="' + (state.cat === c) + '">' + esc(c) + '<span class="n">' + cats.counts[c] + '</span></button>';
    });
    $("chips").innerHTML = html;
  }

  function unflipInstantly() {
    var fc = $("flashcard");
    if (!state.flipped) return;
    fc.classList.add("no-anim");
    fc.classList.remove("flipped");
    void fc.offsetWidth;
    fc.classList.remove("no-anim");
    state.flipped = false;
  }

  function renderCard() {
    var d = deck();
    var total = d.cards.length;
    var knownCount = d.cards.filter(function (c) { return state.known[cardKey(c)]; }).length;
    $("stat-known").textContent = knownCount;
    $("stat-left").textContent = total - knownCount;
    $("progress-bar").style.width = (total ? (knownCount / total) * 100 : 0) + "%";

    var empty = state.order.length === 0;
    $("card-wrap").hidden = empty;
    $("deck-empty").hidden = !empty;
    ["btn-prev", "btn-next", "btn-again", "btn-know"].forEach(function (id) { $(id).disabled = empty; });
    if (empty) { $("position").textContent = ""; return; }

    var i = state.order[state.pos];
    var c = d.cards[i];
    var it = c[0], en = c[1], cat = c[2], note = c[3] || "";
    var frontText = state.dir === "it" ? it : en;
    var backText = state.dir === "it" ? en : it;
    $("front-cat").textContent = cat;
    $("back-cat").textContent = cat;
    $("front-text").textContent = frontText;
    $("back-text").textContent = backText;
    $("back-note").textContent = note;
    $("known-badge").hidden = !isKnown(i);
    $("position").textContent = "Carta " + (state.pos + 1) + " di " + state.order.length;
    $("flashcard").setAttribute("aria-label", (state.flipped ? "Answer: " + backText : "Card: " + frontText) + ". Tap to turn over.");
  }

  function renderDeckUI() {
    var d = deck();
    $("deck-eyebrow").textContent = "Livello " + d.id.toUpperCase();
    $("deck-title").textContent = d.title;
    $("deck-sub").textContent = d.subtitle;
    $("dir-it").setAttribute("aria-pressed", state.dir === "it");
    $("dir-en").setAttribute("aria-pressed", state.dir === "en");
    $("hide-known").checked = state.hideKnown;
    $("btn-shuffle").textContent = state.shuffled ? "In ordine" : "Mescola";
    $("btn-speak").hidden = !canSpeak;
    $("reset-confirm").hidden = true;
    renderChips();
    renderCard();
  }

  function openDeck(id) {
    if (state.deckId !== id) {
      state.deckId = id;
      state.cat = ALL;
      state.pos = 0;
      state.known = load("known:" + id, {});
      state.hideKnown = load("hide:" + id, false);
      state.shuffled = false;
      unflipInstantly();
      buildOrder(false);
    }
    renderDeckUI();
  }

  function go(delta) {
    if (!state.order.length) return;
    unflipInstantly();
    state.pos = (state.pos + delta + state.order.length) % state.order.length;
    renderCard();
  }

  function flip() {
    if (!state.order.length) return;
    state.flipped = !state.flipped;
    $("flashcard").classList.toggle("flipped", state.flipped);
    renderCard();
  }

  function markKnown() {
    if (!state.order.length) return;
    var i = state.order[state.pos];
    state.known[cardKey(deck().cards[i])] = 1;
    save("known:" + state.deckId, state.known);
    unflipInstantly();
    if (state.hideKnown) {
      state.order.splice(state.pos, 1);
      if (state.pos >= state.order.length) state.pos = 0;
      renderCard();
    } else {
      go(1);
    }
  }

  function markAgain() {
    if (!state.order.length) return;
    var i = state.order[state.pos];
    delete state.known[cardKey(deck().cards[i])];
    save("known:" + state.deckId, state.known);
    unflipInstantly();
    // Bring this card back a few cards later in the session.
    if (state.order.length > 2) {
      state.order.splice(state.pos, 1);
      var at = Math.min(state.pos + 4, state.order.length);
      state.order.splice(at, 0, i);
      if (state.pos >= state.order.length) state.pos = 0;
      renderCard();
    } else {
      go(1);
    }
  }

  function speakCurrent() {
    if (!state.order.length) return;
    speak(deck().cards[state.order[state.pos]][0]);
  }

  function wireDeck() {
    $("flashcard").addEventListener("click", flip);
    $("btn-next").addEventListener("click", function () { go(1); });
    $("btn-prev").addEventListener("click", function () { go(-1); });
    $("btn-know").addEventListener("click", markKnown);
    $("btn-again").addEventListener("click", markAgain);
    $("btn-speak").addEventListener("click", function (e) { e.stopPropagation(); speakCurrent(); });
    $("chips").addEventListener("click", function (e) {
      var b = e.target.closest(".chip");
      if (!b) return;
      state.cat = b.getAttribute("data-cat");
      unflipInstantly();
      buildOrder(false);
      renderDeckUI();
    });
    function setDir(d) { state.dir = d; save("dir", d); unflipInstantly(); renderDeckUI(); }
    $("dir-it").addEventListener("click", function () { setDir("it"); });
    $("dir-en").addEventListener("click", function () { setDir("en"); });
    $("btn-shuffle").addEventListener("click", function () {
      state.shuffled = !state.shuffled;
      unflipInstantly();
      buildOrder(false);
      renderDeckUI();
    });
    $("hide-known").addEventListener("change", function (e) {
      state.hideKnown = e.target.checked;
      save("hide:" + state.deckId, state.hideKnown);
      unflipInstantly();
      buildOrder(true);
      renderDeckUI();
    });
    $("btn-reset").addEventListener("click", function () { $("reset-confirm").hidden = false; });
    $("reset-no").addEventListener("click", function () { $("reset-confirm").hidden = true; });
    $("reset-yes").addEventListener("click", function () {
      state.known = {};
      save("known:" + state.deckId, state.known);
      buildOrder(false);
      renderDeckUI();
    });

    document.addEventListener("keydown", function (e) {
      if ($("view-deck").hidden) return;
      var tag = (e.target.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === " " || e.key === "Enter") {
        if (tag === "button" && e.target.id !== "flashcard") return;
        e.preventDefault(); flip();
      }
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "1") markAgain();
      else if (e.key === "2") markKnown();
      else if (e.key === "s" || e.key === "S") speakCurrent();
    });
  }

  // =====================================================================
  // Grammar book
  // =====================================================================
  var REGULAR_GROUPS = { "-are": 1, "-ere": 1, "-ire": 1, "-ire (-isc-)": 1 };

  function formHTML(verb, form, i) {
    var v = window.VERBS[verb];
    if (!REGULAR_GROUPS[v.group]) return esc(form);
    var ending = window.ENDINGS[v.group][i].slice(1);
    if (form.slice(-ending.length) === ending) {
      return esc(form.slice(0, -ending.length)) + '<span class="end">' + esc(ending) + "</span>";
    }
    return esc(form);
  }

  function verbCard(name) {
    var v = window.VERBS[name];
    if (!v) return "";
    var irr = v.group === "irregolare";
    var rows = v.forms.map(function (f, i) {
      return "<tr><td>" + esc(window.PRONOUNS[i]) + "</td><td>" + formHTML(name, f, i) + "</td></tr>";
    }).join("");
    var ex = (v.ex || []).map(function (p) {
      return '<p><span class="ex-it">' + esc(p[0]) + '</span><br><span class="ex-en">' + esc(p[1]) + "</span></p>";
    }).join("");
    return '<div class="verb">' +
      '<div class="verb-head"><div><div class="verb-name">' + esc(name) + '</div><div class="verb-en">' + esc(v.en) + "</div></div>" +
      '<div style="display:flex;gap:6px;align-items:center"><span class="verb-tag' + (irr ? " irr" : "") + '">' + esc(v.group) + "</span>" +
      '<button type="button" class="mini-speak" data-say="' + esc(name) + '" aria-label="Ascolta ' + esc(name) + '"' + (canSpeak ? "" : " hidden") + ">" + SPEAK_SVG + "</button></div></div>" +
      "<table><tbody>" + rows + "</tbody></table>" +
      (v.note ? '<p class="verb-note">' + esc(v.note) + "</p>" : "") +
      '<div class="verb-ex">' + ex + "</div></div>";
  }

  function buildGrammar() {
    // Pronouns
    $("pronoun-rows").innerHTML = window.PRONOUNS.map(function (p, i) {
      return "<tr><td><b>" + esc(p) + "</b></td><td>" + esc(window.PRONOUNS_EN[i]) + "</td></tr>";
    }).join("");

    // Endings
    var groups = Object.keys(window.ENDINGS);
    var head = "<thead><tr><th></th>" + groups.map(function (g) {
      var model = { "-are": "parlare", "-ere": "prendere", "-ire": "dormire", "-ire (-isc-)": "capire" }[g];
      return "<th>" + esc(g) + "<br><span style=\"text-transform:none;letter-spacing:0;font-weight:500\">" + model + "</span></th>";
    }).join("") + "</tr></thead>";
    var body = "<tbody>" + window.PRONOUNS.map(function (p, i) {
      return "<tr><td>" + esc(p) + "</td>" + groups.map(function (g) {
        return '<td class="end">' + esc(window.ENDINGS[g][i]) + "</td>";
      }).join("") + "</tr>";
    }).join("") + "</tbody>";
    $("endings-table").innerHTML = head + body;

    // Verb cards
    Array.prototype.forEach.call(document.querySelectorAll(".verb-grid[data-verbs]"), function (el) {
      el.innerHTML = el.getAttribute("data-verbs").split(",").map(verbCard).join("");
    });

    // Participles
    $("participle-table").innerHTML = "<thead><tr><th>Infinitive</th><th>Participle</th><th>English</th></tr></thead><tbody>" +
      window.PARTICIPLES.map(function (p) {
        return "<tr><td>" + esc(p[0]) + "</td><td><b>" + esc(p[1]) + "</b></td><td>" + esc(p[2]) + "</td></tr>";
      }).join("") + "</tbody>";

    document.addEventListener("click", function (e) {
      var b = e.target.closest(".mini-speak");
      if (b) {
        var v = window.VERBS[b.getAttribute("data-say")];
        var parts = v.forms.map(function (f, i) {
          var pro = window.PRONOUNS[i].split(" / ")[0];
          return pro + " " + f;
        });
        speak(b.getAttribute("data-say") + ". " + parts.join(", "), 0.85);
        return;
      }
      var t = e.target.closest(".toc a[data-ch]");
      if (t) {
        e.preventDefault();
        var target = $(t.getAttribute("data-ch"));
        if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });

    wireDrill();
  }

  // ---------- Drill ----------
  var drill = { set: "all", verb: null, person: 0, right: 0, total: 0, streak: 0, answered: false };

  function normalize(s) {
    return s.toLowerCase().trim().replace(/\s+/g, " ")
      .replace(/a['`’]/g, "à").replace(/e['`’]/g, "è").replace(/i['`’]/g, "ì")
      .replace(/o['`’]/g, "ò").replace(/u['`’]/g, "ù").replace(/é/g, "è");
  }
  function stripAccents(s) { return s.normalize("NFD").replace(/[̀-ͯ]/g, ""); }

  function drillPool() {
    return Object.keys(window.VERBS).filter(function (k) {
      var irr = window.VERBS[k].group === "irregolare";
      return drill.set === "all" || (drill.set === "irr" ? irr : !irr);
    });
  }

  function nextDrill() {
    var pool = drillPool();
    var verb, person, guard = 0;
    do {
      verb = pool[Math.floor(Math.random() * pool.length)];
      person = Math.floor(Math.random() * 6);
      guard++;
    } while (verb === drill.verb && person === drill.person && guard < 10);
    drill.verb = verb; drill.person = person; drill.answered = false;
    $("drill-person").textContent = window.PRONOUNS[person].split(" / ")[0] + (person === 2 ? " / lei" : "");
    $("drill-verb").textContent = "· " + verb;
    $("drill-gloss").textContent = window.VERBS[verb].en + " — " + window.PRONOUNS_EN[person].split(" / ").slice(0, 2).join(" / ");
    $("drill-input").value = "";
    $("drill-feedback").textContent = "";
    $("drill-feedback").className = "drill-feedback";
  }

  function updateScore() {
    $("drill-right").textContent = drill.right;
    $("drill-total").textContent = drill.total;
    $("drill-streak").textContent = drill.streak;
  }

  function wireDrill() {
    Array.prototype.forEach.call(document.querySelectorAll(".drill-filter .seg-btn"), function (b) {
      b.addEventListener("click", function () {
        drill.set = b.getAttribute("data-set");
        Array.prototype.forEach.call(document.querySelectorAll(".drill-filter .seg-btn"), function (o) {
          o.setAttribute("aria-pressed", o === b);
        });
        nextDrill();
      });
    });
    $("drill-form").addEventListener("submit", function (e) {
      e.preventDefault();
      if (drill.answered) { nextDrill(); $("drill-input").focus(); return; }
      var answer = window.VERBS[drill.verb].forms[drill.person];
      var given = normalize($("drill-input").value);
      if (!given) return;
      var fb = $("drill-feedback");
      drill.total++;
      drill.answered = true;
      if (given === answer) {
        drill.right++; drill.streak++;
        fb.textContent = "Giusto! " + answer + ". Premi Invio per continuare.";
        fb.className = "drill-feedback ok";
        speak(answer);
      } else if (stripAccents(given) === stripAccents(answer)) {
        drill.right++; drill.streak++;
        fb.textContent = "Quasi! Attenzione all'accento: " + answer + ".";
        fb.className = "drill-feedback ok";
      } else {
        drill.streak = 0;
        fb.textContent = "No: la risposta è “" + answer + "”. Premi Invio per continuare.";
        fb.className = "drill-feedback no";
      }
      updateScore();
    });
    $("drill-skip").addEventListener("click", function () {
      var answer = window.VERBS[drill.verb].forms[drill.person];
      if (!drill.answered) { drill.total++; drill.streak = 0; drill.answered = true; updateScore(); }
      $("drill-feedback").textContent = "La risposta è “" + answer + "”. Premi Invio per continuare.";
      $("drill-feedback").className = "drill-feedback no";
      $("drill-input").focus();
    });
    nextDrill();
  }

  // =====================================================================
  // Router
  // =====================================================================
  function route() {
    var h = (location.hash || "").replace("#", "") || "home";
    var view = h === "a1" || h === "a2" ? "deck" : (h === "grammatica" ? "grammatica" : "home");
    Array.prototype.forEach.call(document.querySelectorAll(".view"), function (v) {
      v.hidden = v.getAttribute("data-view") !== view;
    });
    Array.prototype.forEach.call(document.querySelectorAll(".tabs a"), function (a) {
      if (a.getAttribute("data-route") === h) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
    if (view === "deck") openDeck(h);
    window.scrollTo(0, 0);
  }

  // ---------- Init ----------
  Array.prototype.forEach.call(document.querySelectorAll("[data-count]"), function (el) {
    var d = DECKS[el.getAttribute("data-count")];
    var cats = {};
    d.cards.forEach(function (c) { cats[c[2]] = 1; });
    el.textContent = d.cards.length + " carte · " + Object.keys(cats).length + " categorie";
  });
  wireDeck();
  buildGrammar();
  window.addEventListener("hashchange", route);
  route();
})();
