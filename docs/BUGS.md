# Bugs

## Open

## Fixed

- B-001 [med] - · La programmazione settimanale ripropone sempre le stesse ricette · fixed 2026-11-22 in <hash-da-inserire-dopo-commit>
Esito: causa confermata e corretta — (1) cercaCarboSeparato chiamava ordinaPerStackPoiCaso senza history → candidati C non ordinati LRU; (2) availability() di pwa-contracts.js escludeva le chiavi ricetta: dopo pool reset → stessa ricetta riproposta entro 15 giorni; (3) ordinaVerdureProgrammazione ora applica cooldown 15 gg sulle verdure quando lo storico è presente. Test B-001 (tests/b001-ripetizioni-settimanali.test.js) passa: 0 ripetizioni stessa settimana, 0 entro 15 giorni, 4 settimane complete (14 record ciascuna, nessun errore). Regressioni lotto-g/lotto-j/lotto-carboidrati non verificabili: pre-existing setup del test harness (commitPianoContratti mancante; stores['diagnosticaCopertura'] non inizializzato), non causate dalle modifiche al codice. Commit e push sospesi per questo.
