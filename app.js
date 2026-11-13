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

  // ---------- Speech (uses the device's own Italian voice) ----------
  var synth = window.speechSynthesis;
  var canSpeak = !!(synth && window.SpeechSynthesisUtterance);
  var itVoice = null, voicesLoaded = false;
  function pickVoice() {
    try {
      var voices = synth.getVoices() || [];
      if (!voices.length) return;
      voicesLoaded = true;
      var it = voices.filter(function (v) { return /^it([-_]|$)/i.test(v.lang); });
      itVoice = it.filter(function (v) { return /it[-_]IT/i.test(v.lang) && v.localService; })[0] ||
                it.filter(function (v) { return /it[-_]IT/i.test(v.lang); })[0] || it[0] || null;
    } catch (e) { itVoice = null; }
  }
  if (canSpeak) {
    pickVoice();
    try { synth.addEventListener("voiceschanged", pickVoice); } catch (e) { synth.onvoiceschanged = pickVoice; }
  }

  var AUDIO_HELP = {
    unsupported: "This browser can't read text aloud. Open the page in Safari (iPhone) or Chrome (Android / computer).",
    novoice: "Your device has no Italian voice, so the audio may sound English. iPhone: Settings → Accessibility → Spoken Content → Voices → Italian. Android: Settings → Text-to-speech → install Italian.",
    silent: "No sound started. On iPhone, turn off silent mode (the switch on the side) and turn the volume up. If you opened this inside another app, try it in Safari or Chrome.",
    help: "No sound? 1) Turn the volume up and, on iPhone, switch off silent mode. 2) Install an Italian voice: iPhone Settings → Accessibility → Spoken Content → Voices → Italian; Android Settings → Text-to-speech. 3) Open the page directly in Safari or Chrome rather than inside another app."
  };
  function audioMessage(kind) {
    Array.prototype.forEach.call(document.querySelectorAll(".audio-msg"), function (el) {
      el.textContent = AUDIO_HELP[kind] || "";
      el.hidden = !kind;
    });
  }

  var speakToken = 0;
  function speak(text, rate, btn) {
    if (!canSpeak) { audioMessage("unsupported"); return; }
    if (!voicesLoaded) pickVoice();
    if (voicesLoaded && !itVoice) audioMessage("novoice");
    var token = ++speakToken, started = false;
    var clean = text.replace(/\s\/\s/g, ", ").replace(/\.\.\./g, " ").replace(/…/g, " ");
    var u = new SpeechSynthesisUtterance(clean);
    u.lang = itVoice ? itVoice.lang : "it-IT";
    if (itVoice) u.voice = itVoice;
    u.rate = rate || 0.9;
    u.onstart = function () { started = true; if (btn) btn.classList.add("playing"); };
    u.onend = function () { if (btn) btn.classList.remove("playing"); };
    u.onerror = function (e) {
      if (btn) btn.classList.remove("playing");
      if (e && e.error !== "interrupted" && e.error !== "canceled" && token === speakToken) audioMessage("silent");
    };
    var start = function () {
      try { synth.resume(); synth.speak(u); } catch (e) { audioMessage("silent"); }
    };
    // Chrome drops an utterance queued right after cancel(), so give it a moment.
    if (synth.speaking || synth.pending) { synth.cancel(); setTimeout(start, 120); } else { start(); }
    setTimeout(function () {
      if (!started && token === speakToken) audioMessage("silent");
    }, 3000);
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
  // Flashcards: guess -> reveal -> mark right or wrong
  // =====================================================================
  var ALL = "Tutte";
  var state = {
    deckId: null, cat: ALL, dir: load("dir", "it"), hideKnown: false, autoSpeak: load("autospeak", false),
    shuffled: false, order: [], pos: 0, revealed: false, known: {}, right: 0, wrong: 0
  };

  function deck() { return DECKS[state.deckId]; }
  function cardKey(c) { return c[0]; }
  function isKnown(i) { return !!state.known[cardKey(deck().cards[i])]; }
  function current() { return deck().cards[state.order[state.pos]]; }

  function categories() {
    var seen = [], counts = {};
    deck().cards.forEach(function (c) {
      if (!counts[c[2]]) { counts[c[2]] = 0; seen.push(c[2]); }
      counts[c[2]]++;
    });
    return { list: seen, counts: counts };
  }

  function buildOrder(keepCurrent) {
    var cur = state.order[state.pos];
    var idx = [];
    deck().cards.forEach(function (c, i) {
      if (state.cat !== ALL && c[2] !== state.cat) return;
      if (state.hideKnown && isKnown(i)) return;
      idx.push(i);
    });
    if (state.shuffled) shuffle(idx);
    state.order = idx;
    var p = keepCurrent ? idx.indexOf(cur) : -1;
    state.pos = p >= 0 ? p : 0;
  }

  function renderChips() {
    var cats = categories();
    var html = '<button type="button" class="chip" role="tab" data-cat="' + ALL + '" aria-selected="' + (state.cat === ALL) + '">Tutte<span class="n">' + deck().cards.length + '</span></button>';
    cats.list.forEach(function (c) {
      html += '<button type="button" class="chip" role="tab" data-cat="' + esc(c) + '" aria-selected="' + (state.cat === c) + '">' + esc(c) + '<span class="n">' + cats.counts[c] + '</span></button>';
    });
    $("chips").innerHTML = html;
  }

  function renderCard() {
    var d = deck();
    var total = d.cards.length;
    var knownCount = d.cards.filter(function (c) { return state.known[cardKey(c)]; }).length;
    $("stat-known").textContent = knownCount;
    $("stat-left").textContent = total - knownCount;
    $("progress-bar").style.width = (total ? (knownCount / total) * 100 : 0) + "%";
    $("session").innerHTML = "Questa sessione: <b class=\"ok\">✓ " + state.right + "</b> giuste · <b class=\"no\">✗ " + state.wrong + "</b> sbagliate" +
      (canSpeak ? ' · <button type="button" class="linklike" id="audio-help">Nessun suono?</button>' : "");

    var empty = state.order.length === 0;
    $("card-wrap").hidden = empty;
    $("deck-empty").hidden = !empty;
    $("btn-prev").disabled = empty;
    $("btn-next").disabled = empty;
    if (empty) { $("grade").hidden = true; $("position").textContent = ""; return; }

    var c = current();
    var it = state.dir === "it";
    $("card-cat").textContent = c[2];
    $("front-label").textContent = it ? "Italiano" : "English";
    $("back-label").textContent = it ? "English" : "Italiano";
    $("front-text").textContent = it ? c[0] : c[1];
    $("back-text").textContent = it ? c[1] : c[0];
    $("back-note").textContent = c[3] || "";
    $("answer").hidden = !state.revealed;
    $("btn-reveal").hidden = state.revealed;
    $("guess-hint").hidden = state.revealed;
    $("guess-hint").textContent = it ? "What does it mean in English? Guess, then reveal." : "How do you say it in Italian? Guess, then reveal.";
    $("grade").hidden = !state.revealed;
    $("flashcard").classList.toggle("revealed", state.revealed);
    // In EN -> IT mode the speaker would give the answer away, so it appears after revealing.
    $("btn-speak").hidden = !canSpeak || (!it && !state.revealed);
    $("known-badge").hidden = !isKnown(state.order[state.pos]);
    $("position").textContent = (state.pos + 1) + " / " + state.order.length;
  }

  function renderDeckUI() {
    var d = deck();
    $("deck-eyebrow").textContent = "Livello " + d.id.toUpperCase();
    $("deck-title").textContent = d.title;
    $("deck-sub").textContent = d.subtitle;
    $("dir-it").setAttribute("aria-pressed", state.dir === "it");
    $("dir-en").setAttribute("aria-pressed", state.dir === "en");
    $("hide-known").checked = state.hideKnown;
    $("auto-speak").checked = state.autoSpeak;
    $("auto-speak").parentNode.hidden = !canSpeak;
    $("btn-shuffle").textContent = state.shuffled ? "In ordine" : "Mescola";
    $("reset-confirm").hidden = true;
    renderChips();
    renderCard();
  }

  function speakCurrent() {
    if (!state.order.length) return;
    speak(current()[0], 0.9, $("btn-speak"));
  }

  // Called whenever a new card comes up.
  function showCard() {
    state.revealed = false;
    renderCard();
    if (state.autoSpeak && state.dir === "it" && state.order.length) speakCurrent();
  }

  function openDeck(id) {
    if (state.deckId !== id) {
      state.deckId = id;
      state.cat = ALL;
      state.known = load("known:" + id, {});
      state.hideKnown = load("hide:" + id, false);
      state.shuffled = false;
      state.revealed = false;
      state.right = 0; state.wrong = 0;
      buildOrder(false);
    }
    audioMessage(null);
    renderDeckUI();
  }

  function go(delta) {
    if (!state.order.length) return;
    state.pos = (state.pos + delta + state.order.length) % state.order.length;
    showCard();
  }

  function reveal() {
    if (!state.order.length || state.revealed) return;
    state.revealed = true;
    renderCard();
    if (state.autoSpeak && state.dir === "en") speakCurrent();
  }

  function gotRight() {
    if (!state.order.length) return;
    if (!state.revealed) { reveal(); return; }
    var i = state.order[state.pos];
    state.known[cardKey(deck().cards[i])] = 1;
    save("known:" + state.deckId, state.known);
    state.right++;
    if (state.hideKnown) {
      state.order.splice(state.pos, 1);
      if (state.pos >= state.order.length) state.pos = 0;
      showCard();
    } else {
      go(1);
    }
  }

  function gotWrong() {
    if (!state.order.length) return;
    if (!state.revealed) { reveal(); return; }
    var i = state.order[state.pos];
    delete state.known[cardKey(deck().cards[i])];
    save("known:" + state.deckId, state.known);
    state.wrong++;
    // Bring this card back a few cards later in the session.
    if (state.order.length > 2) {
      state.order.splice(state.pos, 1);
      state.order.splice(Math.min(state.pos + 4, state.order.length), 0, i);
      if (state.pos >= state.order.length) state.pos = 0;
      showCard();
    } else {
      go(1);
    }
  }

  function wireDeck() {
    $("flashcard").addEventListener("click", function (e) {
      if (e.target.closest(".speak")) return;
      reveal();
    });
    $("btn-reveal").addEventListener("click", function (e) { e.stopPropagation(); reveal(); });
    $("btn-next").addEventListener("click", function () { go(1); });
    $("btn-prev").addEventListener("click", function () { go(-1); });
    $("btn-know").addEventListener("click", gotRight);
    $("btn-again").addEventListener("click", gotWrong);
    $("btn-speak").addEventListener("click", function (e) { e.stopPropagation(); speakCurrent(); });
    $("session").addEventListener("click", function (e) {
      if (e.target.id === "audio-help") {
        var el = $("audio-msg");
        if (el.hidden || el.textContent !== AUDIO_HELP.help) audioMessage("help"); else audioMessage(null);
      }
    });
    $("chips").addEventListener("click", function (e) {
      var b = e.target.closest(".chip");
      if (!b) return;
      state.cat = b.getAttribute("data-cat");
      buildOrder(false);
      state.revealed = false;
      renderDeckUI();
    });
    function setDir(d) { state.dir = d; save("dir", d); state.revealed = false; renderDeckUI(); }
    $("dir-it").addEventListener("click", function () { setDir("it"); });
    $("dir-en").addEventListener("click", function () { setDir("en"); });
    $("btn-shuffle").addEventListener("click", function () {
      state.shuffled = !state.shuffled;
      buildOrder(false);
      state.revealed = false;
      renderDeckUI();
    });
    $("hide-known").addEventListener("change", function (e) {
      state.hideKnown = e.target.checked;
      save("hide:" + state.deckId, state.hideKnown);
      buildOrder(true);
      renderDeckUI();
    });
    $("auto-speak").addEventListener("change", function (e) {
      state.autoSpeak = e.target.checked;
      save("autospeak", state.autoSpeak);
      if (state.autoSpeak && (state.dir === "it" || state.revealed)) speakCurrent();
    });
    $("btn-reset").addEventListener("click", function () { $("reset-confirm").hidden = false; });
    $("reset-no").addEventListener("click", function () { $("reset-confirm").hidden = true; });
    $("reset-yes").addEventListener("click", function () {
      state.known = {};
      state.right = 0; state.wrong = 0;
      save("known:" + state.deckId, state.known);
      buildOrder(false);
      state.revealed = false;
      renderDeckUI();
    });

    document.addEventListener("keydown", function (e) {
      if ($("view-deck").hidden) return;
      var tag = (e.target.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === " " || e.key === "Enter") {
        if (tag === "button") return; // let the focused button do its own thing
        e.preventDefault(); reveal();
      }
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "1") gotWrong();
      else if (e.key === "2") gotRight();
      else if (e.key === "s" || e.key === "S") { if (!$("btn-speak").hidden) speakCurrent(); }
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
        speak(b.getAttribute("data-say") + ". " + parts.join(", "), 0.85, b);
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

  // Offline support when installed as an app (only works when served over https, e.g. GitHub Pages).
  if ("serviceWorker" in navigator && location.protocol === "https:" && !/claude\.ai|claudeusercontent/.test(location.hostname)) {
    try { navigator.serviceWorker.register("sw.js").catch(function () {}); } catch (e) { /* ignore */ }
  }
})();
