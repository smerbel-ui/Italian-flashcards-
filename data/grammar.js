// A1 grammar book: verb conjugations and essentials.
window.PRONOUNS = ["io", "tu", "lui / lei / Lei", "noi", "voi", "loro"];
window.PRONOUNS_EN = ["I", "you", "he / she / you (formal)", "we", "you (plural)", "they"];

// forms = present tense: io, tu, lui/lei, noi, voi, loro
window.VERBS = {
  essere:   { en: "to be", group: "irregolare", forms: ["sono", "sei", "è", "siamo", "siete", "sono"],
              ex: [["Sono italiana.", "I'm Italian."], ["Siamo in vacanza.", "We're on holiday."]] },
  avere:    { en: "to have", group: "irregolare", forms: ["ho", "hai", "ha", "abbiamo", "avete", "hanno"],
              ex: [["Ho trent'anni.", "I'm thirty (I have thirty years)."], ["Hai fame?", "Are you hungry?"]] },
  parlare:  { en: "to speak", group: "-are", forms: ["parlo", "parli", "parla", "parliamo", "parlate", "parlano"],
              ex: [["Parlo un po' di italiano.", "I speak a little Italian."]] },
  prendere: { en: "to take; to have (food/drink)", group: "-ere", forms: ["prendo", "prendi", "prende", "prendiamo", "prendete", "prendono"],
              ex: [["Prendo un cappuccino.", "I'll have a cappuccino."]] },
  dormire:  { en: "to sleep", group: "-ire", forms: ["dormo", "dormi", "dorme", "dormiamo", "dormite", "dormono"],
              ex: [["Dormi bene?", "Do you sleep well?"]] },
  capire:   { en: "to understand", group: "-ire (-isc-)", forms: ["capisco", "capisci", "capisce", "capiamo", "capite", "capiscono"],
              ex: [["Non capisco.", "I don't understand."]] },
  mangiare: { en: "to eat", group: "-are", forms: ["mangio", "mangi", "mangia", "mangiamo", "mangiate", "mangiano"],
              ex: [["Mangiamo alle otto.", "We eat at eight."]], note: "Only one i: mangi, mangiamo (not mangii)." },
  cercare:  { en: "to look for", group: "-are", forms: ["cerco", "cerchi", "cerca", "cerchiamo", "cercate", "cercano"],
              ex: [["Cerco la stazione.", "I'm looking for the station."]], note: "Add h before i to keep the hard 'k' sound: cerchi." },
  andare:   { en: "to go", group: "irregolare", forms: ["vado", "vai", "va", "andiamo", "andate", "vanno"],
              ex: [["Vado a casa.", "I'm going home."], ["Andiamo al mare!", "Let's go to the seaside!"]] },
  fare:     { en: "to do; to make", group: "irregolare", forms: ["faccio", "fai", "fa", "facciamo", "fate", "fanno"],
              ex: [["Che lavoro fai?", "What do you do (for work)?"], ["Fa freddo.", "It's cold."]] },
  stare:    { en: "to stay; to be (feeling)", group: "irregolare", forms: ["sto", "stai", "sta", "stiamo", "state", "stanno"],
              ex: [["Come stai? Sto bene.", "How are you? I'm well."]] },
  venire:   { en: "to come", group: "irregolare", forms: ["vengo", "vieni", "viene", "veniamo", "venite", "vengono"],
              ex: [["Vieni con noi?", "Are you coming with us?"]] },
  volere:   { en: "to want", group: "irregolare", forms: ["voglio", "vuoi", "vuole", "vogliamo", "volete", "vogliono"],
              ex: [["Vuoi un caffè?", "Do you want a coffee?"]], note: "Polite: vorrei = I would like." },
  potere:   { en: "can; to be able to", group: "irregolare", forms: ["posso", "puoi", "può", "possiamo", "potete", "possono"],
              ex: [["Posso entrare?", "May I come in?"]] },
  dovere:   { en: "must; to have to", group: "irregolare", forms: ["devo", "devi", "deve", "dobbiamo", "dovete", "devono"],
              ex: [["Devo andare.", "I have to go."]] },
  sapere:   { en: "to know (a fact); can (a skill)", group: "irregolare", forms: ["so", "sai", "sa", "sappiamo", "sapete", "sanno"],
              ex: [["Non lo so.", "I don't know."], ["Sai nuotare?", "Can you swim?"]] },
  dire:     { en: "to say; to tell", group: "irregolare", forms: ["dico", "dici", "dice", "diciamo", "dite", "dicono"],
              ex: [["Come si dice?", "How do you say it?"]] },
  uscire:   { en: "to go out", group: "irregolare", forms: ["esco", "esci", "esce", "usciamo", "uscite", "escono"],
              ex: [["Usciamo stasera?", "Shall we go out tonight?"]] },
  bere:     { en: "to drink", group: "irregolare", forms: ["bevo", "bevi", "beve", "beviamo", "bevete", "bevono"],
              ex: [["Bevo solo acqua.", "I only drink water."]] },
  dare:     { en: "to give", group: "irregolare", forms: ["do", "dai", "dà", "diamo", "date", "danno"],
              ex: [["Mi dai il sale?", "Will you pass me the salt?"]] },
  chiamarsi:{ en: "to be called", group: "riflessivo", forms: ["mi chiamo", "ti chiami", "si chiama", "ci chiamiamo", "vi chiamate", "si chiamano"],
              ex: [["Mi chiamo Laura.", "My name is Laura."]] },
  alzarsi:  { en: "to get up", group: "riflessivo", forms: ["mi alzo", "ti alzi", "si alza", "ci alziamo", "vi alzate", "si alzano"],
              ex: [["Mi alzo alle sette.", "I get up at seven."]] }
};

window.ENDINGS = {
  "-are": ["-o", "-i", "-a", "-iamo", "-ate", "-ano"],
  "-ere": ["-o", "-i", "-e", "-iamo", "-ete", "-ono"],
  "-ire": ["-o", "-i", "-e", "-iamo", "-ite", "-ono"],
  "-ire (-isc-)": ["-isco", "-isci", "-isce", "-iamo", "-ite", "-iscono"]
};

window.PARTICIPLES = [
  ["fare", "fatto", "done / made"],
  ["dire", "detto", "said"],
  ["vedere", "visto", "seen"],
  ["prendere", "preso", "taken"],
  ["mettere", "messo", "put"],
  ["leggere", "letto", "read"],
  ["scrivere", "scritto", "written"],
  ["aprire", "aperto", "opened"],
  ["bere", "bevuto", "drunk"],
  ["essere", "stato", "been"],
  ["venire", "venuto", "come"],
  ["rimanere", "rimasto", "stayed"]
];
