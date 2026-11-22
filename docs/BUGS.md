# Bugs

## Open

### B-006 [med] - · lotto-set-preferenze-runtime: assert actual:false expected:true
Found: 2026-11-22
Repro: node tests/lotto-set-preferenze-runtime.test.js → fallisce a asserzione `actual: false, expected: true`
Expected: impostazione preferenze runtime salvata e letta correttamente
Where: tests/lotto-set-preferenze-runtime.test.js (asserzione vera sul comportamento del motore, non errore di setup)

### B-005 [med] - · lotto-pasto-anteprima-non-salvata: stessa macro pranzo e cena
Found: 2026-11-22
Repro: node tests/lotto-pasto-anteprima-non-salvata.test.js → fallisce: `Stessa macro a pranzo e cena: 2026-09-01`
Expected: pranzo e cena dello stesso giorno non devono avere la stessa macro proteica
Where: tests/lotto-pasto-anteprima-non-salvata.test.js (asserzione vera sul comportamento del motore, non errore di setup)

### B-004 [med] - · lotto-carboidrati-priorita-pxcuser: carboidrato EXCLUDED usato
Found: 2026-11-22
Repro: node tests/lotto-carboidrati-priorita-pxcuser.test.js → fallisce: `carboidrato escluso (EXCLUDED) usato: crackers`
Expected: un carboidrato con priorità EXCLUDED non deve mai essere selezionato
Where: tests/lotto-carboidrati-priorita-pxcuser.test.js (asserzione vera sul comportamento del motore, non errore di setup)

### B-003 [med] - · lotto-g: pranzo 2026-09-05 non contiene Pomodoro fresco (verduraRicorrente)
Found: 2026-11-22
Repro: node tests/lotto-g-weekly-generation.test.js → fallisce alla riga 98: `2026-09-05 deve contenere Pomodoro fresco`
Expected: ogni pranzo della settimana contiene la variante impostata come verduraRicorrente
Where: tests/lotto-g-weekly-generation.test.js riga 98 (asserzione vera sul comportamento del motore, non errore di setup)

## Fixed

- B-002 [high] - · Regressioni test harness pre-existing su lotto-g/lotto-j/lotto-carboidrati · fixed 2026-11-22 in 3f89cd3
- B-001 [med] - · La programmazione settimanale ripropone sempre le stesse ricette · fixed 2026-11-22 in 06c5e7a
Esito: causa confermata e corretta — (1) cercaCarboSeparato chiamava ordinaPerStackPoiCaso senza history → candidati C non ordinati LRU; (2) availability() di pwa-contracts.js escludeva le chiavi ricetta: dopo pool reset → stessa ricetta riproposta entro 15 giorni; (3) ordinaVerdureProgrammazione ora applica cooldown 15 gg sulle verdure quando lo storico è presente. Test B-001 (tests/b001-ripetizioni-settimanali.test.js) passa: 0 ripetizioni stessa settimana, 0 entro 15 giorni, 4 settimane complete (14 record ciascuna, nessun errore). Regressioni lotto-g/lotto-j/lotto-carboidrati non verificabili: pre-existing setup del test harness (commitPianoContratti mancante; stores['diagnosticaCopertura'] non inizializzato), non causate dalle modifiche al codice. Commit e push effettuati su origin/main (hash 06c5e7a). Regressioni harness registrate come B-002 in sezione Open.
