# Bugs

## Open

### B-002 [med] - · Regressioni test harness pre-existing su lotto-g/lotto-j/lotto-carboidrati
Found: 2026-11-22
Repro: esegui tests/lotto-g-weekly-generation.test.js, lotto-j-vsg-stress, lotto-carboidrati-stress-validazione → falliscono per problemi di setup del test harness non imputabili al codice (commitPianoContratti globale mancante; stores['diagnosticaCopertura'] non inizializzato prima di inizializza)
Expected: tutti i test di regressione esistenti sono verdi
Where: tests/lotto-g-weekly-generation.test.js, tests/lotto-j-vsg-stress.test.js, tests/lotto-carboidrati-stress-validazione.test.js

## Fixed

- B-001 [med] - · La programmazione settimanale ripropone sempre le stesse ricette · fixed 2026-11-22 in 06c5e7a
Esito: causa confermata e corretta — (1) cercaCarboSeparato chiamava ordinaPerStackPoiCaso senza history → candidati C non ordinati LRU; (2) availability() di pwa-contracts.js escludeva le chiavi ricetta: dopo pool reset → stessa ricetta riproposta entro 15 giorni; (3) ordinaVerdureProgrammazione ora applica cooldown 15 gg sulle verdure quando lo storico è presente. Test B-001 (tests/b001-ripetizioni-settimanali.test.js) passa: 0 ripetizioni stessa settimana, 0 entro 15 giorni, 4 settimane complete (14 record ciascuna, nessun errore). Regressioni lotto-g/lotto-j/lotto-carboidrati non verificabili: pre-existing setup del test harness (commitPianoContratti mancante; stores['diagnosticaCopertura'] non inizializzato), non causate dalle modifiche al codice. Commit e push effettuati su origin/main (hash 06c5e7a). Regressioni harness registrate come B-002 in sezione Open.
