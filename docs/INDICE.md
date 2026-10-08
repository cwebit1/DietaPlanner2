# DietaPlanner2 — indice della documentazione

Punto di partenza unico. Regola di precedenza (da `SPECIFICA_PWA_DEFINITIVA.md` §1 e `AGENTS.md`): le istruzioni esplicite più recenti di Cwe prevalgono sui documenti; in conflitto nutrizionale prevale `BASELINE_NUTRIZIONISTA_PDF_V1.md`; per il metodo di lavoro prevale `AGENTS.md`.

## Prima di ogni modifica leggere
| Documento | Contiene |
|---|---|
| `AGENTS.md` (root) | Metodo, divieti, obblighi di registro, test, pubblicazione |
| `docs/RIPRESA_BREVE.md` | Indice operativo e stato breve |
| `docs/SPECIFICA_FUNZIONALE_CORRENTE.md` | Comportamento funzionale: configurazione, carboidrati, proteine, verdure/residuo, programmazione, piano/storico, ricette, UI, colazione/spuntini, account |
| `docs/SPECIFICA_PWA_DEFINITIVA.md` | **Stack, cooldown e fallback (§9), roll e alternative (§10), rotazione P/C (§6), condimenti e LRU (§8), autorità (§1)**, UI obbligatoria, PWA/offline |
| `docs/BASELINE_NUTRIZIONISTA_PDF_V1.md` | Dati nutrizionali verificati sul PDF; prevale in conflitto nutrizionale |
| `docs/ARCHITETTURA_MOTOR_V12.md` | Responsabilità dei moduli, realizzazioni, confini v12 |

## Stato e verifica
| Documento | Contiene |
|---|---|
| `docs/STATO_LOTTI_E_TEST.md` | Stato dei lotti e dei test (fonte unica secondo AGENTS) |
| `docs/RISCONTRO_FUNZIONI_PWA.md` | 16 sezioni, «integrata» e «funzionante» |
| `docs/ESITO_INTERVENTI_PWA.md` | Lista operativa per criterio, voci aperte |
| `docs/REQUIREMENTS-MATRIX.md` | Criterio di chiusura dei requisiti |
| `docs/ANOMALIE_DA_RISOLVERE.md` | Anomalie del catalogo ancora aperte |
| `docs/REGISTRO_MODIFICHE.md` | Log permanente, solo aggiunte in coda |

## Per area
`LOTTO_F_CATALOGO_NUOVO.md` (catalogo, decisioni su Riso/Farina 00/burro di arachidi), `LOTTO_G_GENERAZIONE_MANUALE_UI.md` (generazione manuale), `LOTTO_H_CHECKLIST_RELEASE.md` (release), `LOTTO_I_ACCESSI_RBAC_E_MIGRAZIONE_FIRESTORE.md` (progetto accessi, non implementato), `LOTTO_J_MOTORE_UNICO.md` (istruzioni e log del motore), `METODOLOGIA-CONVERSIONE-RICETTE.md` (aggiungere o correggere ricette).

## Archivio
`docs/archivio/` contiene i documenti storici non operativi (vedi `docs/archivio/LEGGIMI.md`).

## Punti noti da risolvere (verificati il 06/10/2026)
1. **Due specifiche sovrapposte** (`SPECIFICA_FUNZIONALE_CORRENTE.md`, ferma nell'intestazione al 30/08, e `SPECIFICA_PWA_DEFINITIVA.md`, 22/09): vanno fuse in una sola.
2. **Condimenti e dosi — decisione recepita il 06/10/2026:** il condimento di V non si considera mai (solo rotazione); i condimenti di P e C hanno dose e la dose si considera; aromi esclusi (aglio, basilico fresco, semi di sesamo, cipolla rossa, rosmarino). Sostituita in `AGENTS.md`, `SPECIFICA_PWA_DEFINITIVA.md` §8.2, `RIPRESA_BREVE.md`, nel motore e nel test `tests/criteri-pwa-selettivi.test.js` criterio 15.
3. **Famiglia «con pomodoro»** (molluschi e crostacei con linguine, spaghetti, tagliolini): «e pomodoro» è solo un testo del nome (`testo2`) e il pomodoro è un sugo (S) non definito. Template 37 (`nr_37_*`, 9 ricette) è ammesso senza sugo e con il nome che lo dichiara; template 38 (`nr_38_*`, 6 ricette) ha `ingredientiDaDefinire: ["Pomodoro fresco"]` ed è escluso dal motore. Decisione di Cwe richiesta (vedi `ANOMALIE_DA_RISOLVERE.md`). Il criterio 15 del test selettivo la segnala.
4. **Riferimenti a file inesistenti:** `lotto-j-una-fonte-proteica-giorno.test.js` (citato in `STATO_LOTTI_E_TEST.md`), `REGOLE_FLUSSO_LOGICO.md`, `ricette-nuovo-formato-precedente.json`, `README.md`.
5. **Test non citati in nessun documento:** 12 su 92 (elenco nel registro del 06/10/2026).
6. **Intestazioni datate:** `STATO_LOTTI_E_TEST.md` riporta «Data: 2026-09-03»; `RIPRESA_BREVE.md` contiene cronologia da shell v6 a v16 contro la regola «non cronologia cumulativa».
7. **File in root non documentati:** `index-pasto-restyling.html`, `restyling-preview.html`, `gestore-ricette-github.html`.
