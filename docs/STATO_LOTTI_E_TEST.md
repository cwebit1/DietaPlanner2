# DietaPlanner — stato consolidato lotti e test

**Data:** 2026-09-03 (aggiornato dopo la sessione pomeridiana — vedi fondo pagina)
**Pubblicazione:** release v2 autorizzata da Cwe il 30 agosto 2026

| Lotto | Stato | Evidenza |
|---|---|---|
| A — baseline | verificato | fixture PDF e snapshot root |
| B — resolver | verificato | precedenze, range, AUTO/EXCLUDED/FIXED |
| C — motore | verificato sulla v12 | integrazione, cap, profili, atomicità settimana, pipeline sequenziale P→C→V |
| D — Setting | verificato | resolver, contesti, nessuna mutazione catalogo |
| E — Set | verificato | stati carboidrati, cap personali restrittivi, bozza con salvataggio esplicito, Fonti proteiche/giorno |
| F — catalogo | verificato sui dati correnti | 39 template, 157 ingredienti, referenze coerenti |
| G — generazione/manuale/UI | implementato e verificato automaticamente + browser reale | quantità atomiche, residuo, deperibilità, pasto odierno, C/P/V raggruppato per ricetta |
| H — stress test/release | release v2 autorizzata | 27/27 automatici passati; verifica browser reale eseguita via Chromium/Playwright il 03/09 (vedi fondo pagina) — resta da fare solo il test su dispositivo Android fisico |
| I — accessi/RBAC/Firestore | login Google funzionante, RBAC/whitelist non implementato | `LOTTO_I_ACCESSI_RBAC_E_MIGRAZIONE_FIRESTORE.md`; esecuzione per fasi con rollback |

## Cataloghi correnti

- `ingredienti-new.json` v21: 157 ingredienti.
- `db-ricette.json` v73: 39 template. Il Blocco 2 V/S/G ha riclassificato
  i sughi parziali come `S` e le guarnizioni proteiche come `G`, conservando
  `V` soltanto nei template misti con porzione vegetale completa.
- Tutte le 218 referenze ingrediente, comprese le composizioni fisse, risolvono
  nel catalogo.
- Nessuna sorgente runtime usa i cataloghi della versione 1.0.
- `db-visuale.json` v1 copre 420 ricette concrete con ID deterministico e
  stato `disponibile`; il record resta risolvibile quando disattivato ma viene
  escluso dal filtro comune delle nuove proposte. `gestore-ricette.html`
  modifica foto, testo e disponibilità senza duplicare dati nutrizionali.
- Il confronto delle 20 voci del formato intermedio archiviato è registrato in
  `AUDIT_CONVERSIONE_RICETTARIO_SOSPESO.md`: tutte le destinazioni sono state
  decise e le conversioni approvate sono applicate; la correzione nominale
  "Pomodori gratinati" è validata nella v69.

## Suite automatica corrente

- `tests/nutrition-lotto-a-root-snapshot.test.js`;
- `tests/nutrition-config.test.js`;
- `tests/engine-core.test.js`;
- `tests/lotto-c-new-engine-integration.test.js`;
- `tests/lotto-d-root-nutritionist-setting.test.js`;
- `tests/lotto-e-root-user-set.test.js`;
- `tests/lotto-f-new-catalog.test.js`.
- `tests/lotto-g-atomic-realizations.test.js`;
- `tests/lotto-g-weekly-generation.test.js`.
- `tests/lotto-h-pwa-source-contract.test.js`;
- `tests/lotto-h-stress-migrations.test.js`.
- `tests/lotto-h-approved-recipe-conversion.test.js`.
- `tests/lotto-h-generation-feedback-catalog-retry.test.js`.
- `tests/lotto-i-google-auth-contract.test.js` (login corrente; RBAC ancora da implementare).
- `tests/lotto-j-vsg-contract.test.js`;
- `tests/lotto-j-vsg-catalog.test.js`;
- `tests/lotto-j-vsg-motor-semantics.test.js`.
- `tests/lotto-j-vsg-structured-coverage.test.js`.
- `tests/lotto-j-vsg-pipeline-order.test.js`.
- `tests/lotto-j-vsg-threshold.test.js`.
- `tests/lotto-j-vsg-atomic-snapshot.test.js`.
- `tests/lotto-j-vsg-roll-salvafrigo.test.js`.
- `tests/lotto-j-vsg-rendering.test.js`.
- `tests/lotto-j-vsg-stress.test.js`.
- `tests/lotto-j-una-fonte-proteica-giorno.test.js`.
- `tests/menu-consumo-automatico-store-reale.test.js`.
- `tests/menu-layer-sequenziale.test.js`.

27/27 suite superate all'ultima esecuzione (03/09/2026, sessione pomeridiana).
Una sola suite (`lotto-g-weekly-generation.test.js`, a volte `lotto-j-vsg-stress.test.js`)
mostra intermittenza non deterministica nota e già spiegata: con margini
settimanali stretti l'ordine casuale delle classi proteiche a volte non trova
l'unica combinazione valida al primo tentativo — non è una violazione di
regola, è un problema di fattibilità numerica ancora da decidere (algoritmo
costruttivo come per i carboidrati, o errore esplicito accettato).

Ultima esecuzione, chiusura Blocco 10 V/S/G: 24/24 test passati, più controllo
sintattico del motore, validazione JSON e `git diff --check`. Il test Lotto C
è stato riallineato alla firma corrente di `creaSequenzaCarboidrati` e alla
classe `C+S`; il test settimanale verifica l'ultima sequenza completa 1 -> 14
senza fallire quando esistono retry interni. Il Blocco 3 ha introdotto la
lettura semantica distinta dei token `V`, `S` e `G` nel motore; il calcolo
quantitativo strutturato è stato aggiunto nel Blocco 4 senza cambiare ancora
l'ordine di costruzione del pasto. Il test dedicato e le suite collegate sono
passati; nella corsa aggregata anche la suite settimanale è passata. Resta
registrata l'intermittenza preesistente del solo controllo di avanzamento,
osservata in una precedente esecuzione isolata.

Il Blocco 5 ha reso esplicito l'ordine P -> C -> V nella costruzione dello
slot e ha eliminato la precedenza implicita delle ricette P+C già combinate,
senza modificare i vincoli o la logica quantitativa del blocco precedente.

Il Blocco 6 applica la soglia: da 50 g compresi viene aggiunta una `V`
compensativa esatta; sotto 50 g il residuo viene diviso a metà fra `S` e `G`,
che in tale condizione sono necessariamente presenti insieme. Nessun caso
alternativo con un solo token è stato introdotto.

Il Blocco 7 congela quantità, nutrienti, ruolo e bilancio V/S/G nello snapshot
della realizzazione e nello storico. Nutrizione, spesa e inventario continuano
a consumare tale snapshot unico; i template del catalogo restano immutati.

Il Blocco 8 fa ricalcolare lo stesso bilancio dopo Roll C/P/V e mantiene
rigenerazione e Salvafrigo sulla pipeline comune. Salvafrigo conserva anche il
bilancio del pasto programmato originale.

Il Blocco 9 mantiene tre sole righe visuali: `S` è incorporato in C, `G` in P
e V compare soltanto per una portata vegetale completa. Pasto e Programmazione
condividono la stessa funzione di proiezione.

Il Blocco 10 ha stressato 25 settimane e 350 pasti senza residui o snapshot
incoerenti. La prova browser sulla build GitHub Pages corrente ha verificato
generazione, salvataggio, persistenza dopo ricarica, rendering C/P/V, Roll C e
Salvafrigo. Il server locale è rimasto irraggiungibile dal browser cloud con
`ERR_BLOCKED_BY_CLIENT`; il responsive Android resta pertanto un gate separato.

L'intervento del 3 settembre 2026 isola il consumo automatico dalla bozza
Menù: `renderMenuSettimanale` disattiva temporaneamente `menuDraft`, esegue
`elaboraConsumoAutomatico` sullo store `piano` reale e ripristina la bozza in
`finally`. Suite completa successiva alla modifica: 25/25 test superati.

## Limite della verifica corrente

Aggiornato il 03/09/2026: la limitazione descritta sotto (server locale
irraggiungibile dal browser cloud) valeva il 30 agosto. Da allora sono state
eseguite più sessioni di verifica browser reale end-to-end (Chromium via
Playwright, server locale servito correttamente) — generazione settimanale,
salvataggio Set con lettura IndexedDB diretta indipendente dall'app, Roll,
Salvafrigo, rendering C/P/V, righe raggruppate per ricetta, avviso "modifiche
non salvate", tutte verificate con successo. Il gate non ancora eseguito è
solo il test su dispositivo Android fisico (touch, tastiera, responsive reale).

Testo originale (30 agosto 2026, mantenuto per cronologia):

Non è stato ancora eseguito un test browser/IndexedDB end-to-end della root
corrente. Il 30 agosto 2026 il browser reale è stato avviato correttamente, ma
il suo ambiente cloud ha bloccato l'accesso al server locale della root su
`http://127.0.0.1:4173/` con `ERR_BLOCKED_BY_CLIENT`. La versione pubblicata non
è stata usata come sostituto perché non rappresenta con certezza il worktree
corrente. I test automatici e di contratto non sostituiscono questo gate.

## Esito Lotto G

- schema unico delle quantità effettive nelle realizzazioni: implementato;
- propagazione a nutrizione, inventario, spesa e storico: implementata;
- programmazione indipendente dalla scorta: verificata con inventario vuoto;
- priorità temporale delle verdure: implementata;
- pasto odierno con priorità scorte/scadenze: implementato;
- UI a righe C/P/V e Roll contestuali: contratto statico verificato;
- verifica browser reale: demandata al Lotto H.

## Gate Lotto H

La checklist eseguibile e il criterio di rilascio sono consolidati in
`LOTTO_H_CHECKLIST_RELEASE.md`.

### Intervento sequenziale sul generatore

La generazione settimanale chiude ora ogni slot prima di avanzare al
successivo. Le celle proteiche utente sono vincolanti, le sole celle mancanti
sono casuali e la rotazione avanza dopo il pasto accettato. Il controllo
giornaliero usa le macro effettive delle ricette miste. Copertura finale e
assenza di scritture parziali restano protette. Test dedicato:
`tests/menu-layer-sequenziale.test.js`. Batteria completa: 26/26 suite
superate; stress V/S/G: 25 settimane e 350 pasti completi.

### Verificato automaticamente

- settimana vuota, parziale e piena;
- preservazione dei pasti bloccati e assenza di scritture sulla settimana piena;
- lettura delle realizzazioni legacy e snapshot quantitativo v1;
- migrazione degli zeri espliciti in `excluded` e dei conteggi utente in `fixed`;
- profili onnivoro, vegetariano e vegano sul nuovo ricettario;
- selezione dei carboidrati AUTO limitata agli incroci coperti dal profilo;
- contratti PWA, manifest, icone, store IndexedDB e assenza di sorgenti runtime 1.0;
- conversione ricette approvate, composizioni fisse, stack condiviso, dosi
  fredde complete e sughi con residuo;
- unit test preesistenti su zeri, min=max, massimo nullo, cap, esclusioni,
  contesti, residuo, inventario, spesa, consumo e storico.

### Ancora da verificare in browser reale

- responsive Android, tastiera, service worker e cache su dispositivo fisico;
- migrazione reale di IndexedDB e reset dall'interfaccia;
- spesa, consumo e storico end-to-end (piano/pasto/Roll/Salvafrigo già
  verificati via Chromium/Playwright il 03/09, vedi sezione finale);
- nessuna release senza esito positivo e autorizzazione di Cwe.

## Riepilogo sessione pomeridiana 03/09/2026 (stato attuale, fonte unica)

Punto di lettura rapido per non dover ricostruire la cronologia sopra.
Ultimo commit di questa sezione: `8d2be4e`.

- `index.html` ripristinato dopo la corruzione di `9f38543` (8.900+ righe
  integre, verificato sintatticamente e in browser).
- Generazione settimanale riscritta in sequenza P→C→V, un pasto alla volta,
  nessun retry sull'intera settimana, nessun prodotto cartesiano.
- Rendering C/P/V: sempre nome ricetta (mai ingredienti sciolti); una
  ricetta a più ruoli compare una sola riga con le icone combinate, su
  Menù e Pasto; giorni passati mostrano "— pasto concluso —" in carattere
  sottile invece del placeholder di stato-vuoto.
- "Proponi nuovo pasto" e Salvafrigo condividono la pipeline settimanale.
- Set utente: bozza vera (nessuna scrittura prima di Salva su tutte le
  sotto-sezioni), i tre pulsanti Salva committano la stessa configurazione.
- "Fonti proteiche/giorno" rispettato anche dal riempimento automatico,
  incluso il caso limite delle ricette a doppia fonte proteica.
- Config nutrizionale (allergie, profilo) calcolata una volta per sessione,
  non ricaricata da IndexedDB ad ogni pasto/condimento/Roll; pulsante
  manuale dedicato nel Setting nutrizionista per ricalcolarla dopo un
  cambio di profilo.
- Specifica funzionale aggiornata con le deroghe decise in sessione (pasto
  senza carboidrato con avviso, cooldown carboidrati AUTO, vincolo fonti
  proteiche/giorno anche sulle celle libere).
- 27/27 suite di test, incluso il nuovo `lotto-j-una-fonte-proteica-giorno.test.js`.
- **Ancora aperto, non deciso**: l'ordine casuale delle classi proteiche a
  volte non trova l'unica combinazione valida quando i margini settimanali
  sono stretti (visibile soprattutto con "Fonti proteiche/giorno"=1) — in
  attesa di decidere se applicare lo stesso algoritmo costruttivo già usato
  per i carboidrati, o accettare l'errore esplicito.
- Dettaglio completo di ogni intervento nella memoria di sessione di Claude
  e nei messaggi del commit corrispondente su GitHub.

## Aggiornamento 04/09/2026

- Corretto falso avviso (triangolo giallo) di sostituzione carboidrato
  quando tutti gli slot sono AUTO (nessun FIXED nel Set): l'avviso
  confrontava la chiave scelta con il primo elemento di una lista
  mescolata casualmente, non con una reale condizione utente. Ora scatta
  solo se un carboidrato FIXED disponibile è stato scartato. Dettaglio in
  `LOTTO_J_MOTORE_UNICO.md`. Aggiunto
  `tests/lotto-j-avviso-solo-per-fissi-sostituiti.test.js`. 28/28 suite.
- Verificati senza necessità di modifiche: sequenza P→C.user→C (spec
  sez. 6), separazione sughi/condimenti dalla scelta P/C, cache
  `configRuntime()`.
- **Ancora aperto, non affrontato in questa sessione**: latenza percepita
  sul Roll (`statoRollPasto` ricalcola tutte e tre le alternative C/P/V a
  ogni render, anche quando ne è stata usata una sola) — diagnosi fatta,
  fix non applicato, richiede verifica di tempi reali in browser. Il
  codice morto `renderPastoTabContenuto`/`draftPasto` (editor manuale mai
  raggiungibile dal click reale, distinto dal Roll che invece funziona)
  resta da chiarire con Cwe: rimuovere o completare.

## Aggiornamento 04/09/2026 (2) — Programmazione Menù

- Implementato il lucchetto per singola realizzazione (P/C/V, o l'intera
  realizzazione se una ricetta copre più ruoli) nella pagina
  Programmazione/Menù settimanale, rimuovendo da quella pagina editor,
  pannelli a comparsa, Roll e ricerca (restano solo nel Pasto del giorno).
  Dettaglio completo in `LOTTO_J_MOTORE_UNICO.md`.
- `Rigenera` (e "Genera menù") preservano ora esattamente le realizzazioni
  bloccate e rigenerano solo quelle libere; un pasto interamente bloccato
  resta intatto; un blocco che rende impossibile completare un pasto fa
  fallire la generazione con un errore preciso, senza sbloccare nulla.
- Nuovo test `tests/lotto-programmazione-lucchetti.test.js`. Suite: 29/29
  (a parte la flakiness pre-esistente nota di `lotto-j-vsg-stress.test.js`).
- **Non verificato con un browser reale in questa sessione** (limite di
  risorse posto esplicitamente da Cwe): la copertura resta a livello di
  motore con IndexedDB reale via harness Node. Verifica end-to-end in
  Chromium/Playwright ancora da fare quando servirà.
- Punti già noti e ancora aperti (latenza Roll, editor manuale morto)
  restano tali, non toccati in questo intervento.

## Aggiornamento 04/09/2026 (3) — Pagina Pasto

- Eliminato l'editor Pasto morto (`draftPasto` e ~725 righe collegate:
  `renderPastoTabContenuto(LegacyV72)`, `renderContenutoAlternativaCompleta`,
  `generaCandidatoDraft`, `confermaPastoDaTab` e tutti gli helper usati
  solo da questi), verificato irraggiungibile chiamante per chiamante
  prima di toccarlo. Non toccati: `apriModalEditorPasto` (spuntini),
  `renderBloccoSemplice`/`renderContenutoAlternativaSemplice` (spuntini),
  i campi `primoId/secondoId/contornoId` usati per compatibilità con
  record piano legacy altrove nel codice.
- Causa della latenza confermata: `renderBloccoNuovoMotore` chiamava
  `statoRollPasto()` a ogni render, anche senza alcuna richiesta
  dell'utente. Rimossa dal rendering ordinario.
- Nuova interfaccia: sotto ogni pasto modificabile, solo "Alternativa" e
  "Salvafrigo"; un pannello proposta con "Imposta come pasto"/"Rigenera"/
  "Annulla". `rigeneraPasto` ha un nuovo parametro opzionale
  `soloAnteprima` (additivo, invariato se assente) che salta il
  `put('piano',...)`: l'unico salvataggio di tutta la pagina avviene ora
  su "Imposta come pasto" (riusa `salvaRoll`). Dettaglio completo in
  `LOTTO_J_MOTORE_UNICO.md`.
- Nuovo test `tests/lotto-pasto-anteprima-non-salvata.test.js` (fallisce
  sul codice precedente, passa dopo). Suite: 29/29 (stessa flakiness
  pre-esistente nota di `lotto-g-weekly-generation.test.js` e
  `lotto-j-vsg-stress.test.js`). Diff netto: -778/+232 righe.
- `ruotaPasto`/`statoRollPasto` nel motore non hanno più alcun chiamante
  dopo questa modifica ma non sono state rimosse (non erano nell'elenco
  esplicito richiesto) — da decidere con Cwe.
- **Non verificato con un browser reale in questa sessione** (limite di
  risorse posto esplicitamente da Cwe): copertura a livello di motore
  con IndexedDB reale via harness Node. Latenza misurata nello stesso
  harness (non browser), qualitativamente conclusiva: il rendering
  ordinario non chiama più il motore, prima lo faceva a ogni apertura.

## Aggiornamento 04/09/2026 (4) — Regressione icone proteiche

- Corretto: dal commit `8d2be4e` ogni proteina in Pasto/Programmazione
  mostrava genericamente '🥩' (`ICONE_VSG.P`), ignorando il vero gruppo.
  `iconaGruppoProteico()` esisteva già e non veniva più usata da quel
  punto per le righe C/P/V.
- `righeVsgUniche()` propaga ora `gruppoProteico` per riga; nuova
  `iconeRigaVsg(riga)` (unica fonte condivisa, C/V fissi, P sempre via
  `iconaGruppoProteico`) usata nei 3 renderer (Pasto, pannello proposta,
  Programmazione). `iconaPastoDaVoce()` (calendario storico): non
  riduce più al primo gruppo proteico trovato, niente più fallback
  `'🍝'`, condizioni temporali invariate. `motor-v12.js` non toccato.
- Nuovo test `tests/lotto-icone-gruppo-proteico.test.js` (esegue
  davvero le funzioni estratte da `index.html`, fallisce sul codice
  precedente, passa dopo): tutti gli 11 gruppi proteici, coerenza fra
  le tre viste, combo C+P/P+V, doppia proteina reale non ridotta,
  nessun default 🥩/🍝, record legacy con/senza gruppoProteico.
- Suite: 31/31.

## Aggiornamento 04/09/2026 (5) — Finestra Pasto: "concluso" per fascia oraria, non per data

- Corretto: dal commit `ca226c1` la finestra Pasto usava `giorno<=todayISO()`
  (come la Programmazione, dove è corretto) sia per mostrare "pasto
  concluso" su uno slot vuoto sia per decidere la modificabilità - alle
  8 del mattino pranzo e cena di oggi comparivano già come conclusi,
  prima della chiusura della loro fascia oraria.
- `renderBloccoNuovoMotore`: "pasto concluso" su slot vuoto ora usa
  `fasciaPastoSuperata(giorno,pasto)` invece di `giorno<=todayISO()`;
  `modificabile` ora è `!voce.consumato&&!fasciaPastoSuperata(giorno,pasto)`
  invece di `!voce.consumato&&giorno>=todayISO()`. Nessuna duplicazione
  di salvataggio/inventario/storico nel renderer (resta esclusivo di
  `elaboraConsumoAutomatico`, non toccata). Programmazione invariata
  (`riepilogoGrigliaPastoMenu` continua a usare `giorno<=todayISO()`).
- **Corretto anche qui, su richiesta esplicita ("Estendi correzione")**:
  `renderColazione` aveva lo stesso identico pattern di bug
  (`giorno<=todayISO()` per uno slot colazione vuoto, in entrambi i suoi
  rami) - sostituito con `fasciaPastoSuperata(giorno,'colazione')` in
  entrambi, come già per pranzo/cena. Non toccato il confronto
  `giorno===todayISO()` (banner premio costanza, non un bug di fascia).
- Nuovo test `tests/lotto-pasto-fascia-oraria.test.js` (estrae ed
  esegue `fasciaPastoSuperata`/`FASCE_ORARIE_PASTO` da `index.html` con
  orari controllati, fallisce sul codice precedente, passa dopo): tutti
  i casi orari richiesti (08:00/13:00/13:59/14:00/19:00/19:59/20:00),
  giorno passato/futuro, riproduzione della logica "concluso"/
  "modificabile" reale, contratto di sorgente (niente più
  `giorno<=todayISO()`/`giorno>=todayISO()` in `renderBloccoNuovoMotore`,
  niente `put('piano'`/`registraConsumoStorico`/`scalaInventarioPerRicetta`
  diretti), Programmazione confermata invariata.
- Suite: 32/32 (stessa flakiness pre-esistente e nota di
  `lotto-g-weekly-generation.test.js`/`menu-layer-sequenziale.test.js`,
  confermata invariata - `motor-v12.js` non toccato in questo intervento).

## Aggiornamento 04/09/2026 (7) — Set → Proteine: duplicati giornalieri

> **SUPERATO l'08/09/2026** (vedi aggiornamento in fondo al file): la
> semantica "valore 1 → pranzo e cena sempre coincidenti" descritta qui
> sotto era una falsa interpretazione, eliminata per intero insieme al
> parametro `maxProteinSourcesPerDay`. Voce conservata solo come
> cronologia, non più il comportamento reale.

- Corretto: `engine-core.buildProteinGrid()` poteva produrre
  `['carne','carne']` nello stesso giorno (~35-39% delle generazioni
  casuali con i limiti predefiniti, misurato: 3.932/10.000). Causa: un
  fallback riusava la categoria precedente quando il pool alternativo
  era temporaneamente vuoto; inoltre la funzione non riceveva mai
  `maxProteinSourcesPerDay` dal chiamante.
- Riscritta con vero backtracking sui soli slot proteici liberi (mai
  retry casuali illimitati, budget limitato, fattibilità residua
  controllata a monte). Con valore 2: pranzo e cena sempre distinti,
  garantito dalla ricerca stessa. Con valore 1: sempre coincidenti
  (stessa semantica già in `motor-v12.js`), mai dedotto dal riempimento
  della tabella. `index.html`: `completaTabellaProteine` passa ora
  `maxProteinSourcesPerDay` a `buildProteinGrid` e non assegna mai
  un'anteprima se la proposta è invalida (avviso esplicito invece).
  `validaFattibilitaProteineSet` rifiuta `['carne','carne']` con 2
  fonti/giorno (il vecchio controllo `arr.length>limiteGiorno` non lo
  rilevava). `motor-v12.js`: verificato, non modificato — già corretto.
- Nuovi test: `lotto-set-proteine-buildgrid.test.js` (10.000
  generazioni, 0 duplicati, 0 errori in 288ms; mode1/mode2; celle
  manuali; configurazione impossibile → errore esplicito; Casuale =
  Completa), `lotto-set-proteine-validazione.test.js` (validazione Set,
  contratti su `completaTabellaProteine`/`salvaSetCompleto`),
  `lotto-set-proteine-menu-reale.test.js` (generazione reale, macro
  verificate sui dati reali delle realizzazioni, non solo
  `categoriaTarget`). Tutti dimostrati fallire sul codice precedente.
- Suite: 35/35 (stessa flakiness pre-esistente e nota, `motor-v12.js`
  non toccato). Sintassi, JSON, `git diff --check` puliti.

## Aggiornamento 04/09/2026 (8) — C.user: priorità PX+C.user, no fallback senza C

- Corretto: il motore non rispettava il processo logico "filtra PX →
  cerca PX+C.user → posiziona → solo dopo C/C+V". Cause: (1)
  `carboidratiCandidatiSlot` mescolava FIXED (C.user) e AUTO in un solo
  shuffle; (2) i PX venivano provati in ordine di rotazione senza mai
  cercare prima, in tutto il pool, quelli che realizzano già PX+C.user;
  (3) un PX già combinato con C veniva accettato subito se il C
  incorporato era ammissibile in qualunque forma (anche solo AUTO),
  precedendo un possibile PX+C.user altrove nel pool; (4) se nessun
  carboidrato risultava compatibile, il pasto si chiudeva comunque con
  la sola proteina (`carbKeyUsato:null`).
- Riscritte `costruisciPastoSequenziale` (sequenza fase-per-fase: prima
  tutto il pool per PX+C.user, poi PX libero → C.user separato → C.auto,
  mai un fallback senza C) e la branch analoga di
  `completaPastoConBloccate` (P bloccato, C libero). Nuova funzione
  condivisa `cercaCarboSeparato`. `carboidratiCandidatiSlot` ora
  restituisce sempre fissi-poi-auto, mai mescolati. Nuova
  `erroreValidazionePastoFinale`, chiamata in `generaPianoSettimana`
  prima di ogni `put()`: nessuna scrittura se anche un solo pasto non ha
  P/C/V completi, `carbKeyUsato` non nullo, nessun EXCLUDED.
- Verificato con dati reali: PX+C.user (combo Panino+Prosciutto crudo,
  carboidrato 'pane') scelto in **100/100** generazioni dopo il fix,
  **32/97 (~33%)** prima — regressione dimostrata e risolta. 180
  generazioni di stress su 6 combinazioni (tutti AUTO, FIXED, FIXED con
  tetto, EXCLUDED, misti, blocchi): sempre C presente, FIXED esatti,
  EXCLUDED mai usati, tetti rispettati. Scenario impossibile (tutti i
  carboidrati esclusi): errore esplicito, zero scritture parziali.
- Nuovi test: `lotto-carboidrati-priorita-pxcuser.test.js`,
  `lotto-carboidrati-stress-validazione.test.js`. Dettaglio completo in
  `LOTTO_J_MOTORE_UNICO.md`. Suite: 37/37. Set UI carboidrati:
  verificata già corretta (tre stati canonici), aggiunto solo testo
  esplicativo che "Casuale 14"/"Completa e fissa" producono FIXED (nessun
  cambio di comportamento).

## Aggiornamento 08/09/2026 — Proteine: eliminata la falsa semantica "1 fonte/giorno"

- Regola definitiva di Cwe: pranzo e cena hanno **sempre** due categorie
  proteiche diverse, senza eccezioni. Il numero "1" nel vecchio motore
  indicava solo che l'utente aveva già scelto una delle due categorie e
  il sistema doveva completare la seconda — mai "stessa categoria per
  entrambi i pasti", interpretazione introdotta erroneamente
  nell'aggiornamento del 04/09/2026 (7) e ora eliminata per intero.
- Rimosso completamente `maxProteinSourcesPerDay` (e i suoi alias
  `unaSolaFonteAlGiorno` in `motor-v12.js`,
  `maxFontiProteicheGiornaliereSet` in `index.html`) da
  `nutrition-config.js`, `engine-core.js`, `motor-v12.js`, `index.html`
  (inclusa la voce "Fonti proteiche/giorno" nel Setting nutrizionista,
  rimossa dal form). Nessun parametro sostitutivo: il numero di
  categorie già scelte si deduce solo dalla tabella del giorno (0 → 2
  diverse, 1 → completata con una diversa, 2 → entrambe preservate).
- `engine-core.buildProteinGrid()` riscritta: sempre due categorie
  distinte, stesso backtracking di prima ma senza il ramo "valore 1".
  `motor-v12.js:opzioniProteinaPerSlot()`: rimossi `unaSolaFonteAlGiorno`
  e il parametro/Map `targetGiorno` (diventato interamente inutile), il
  pool esclude sempre la categoria già usata nel giorno, mai una
  riapertura silenziosa.
- Nuova validazione canonica in `nutrition-config.js`: dopo profilo ed
  esclusioni, se restano meno di due categorie proteiche ammesse,
  `resolved.valid=false` con un errore esplicito — riusa
  automaticamente il controllo già esistente in `salvaConfigAvanzata`
  (`if(!resolved.valid)...return`), nessuna configurazione incompatibile
  viene salvata.
- **Conseguenza rilevata, non risolta, riservata a Cwe**: il profilo
  "vegano" (esclude carne/pesce/formaggi/uova, lascia solo "legumi")
  diventa strutturalmente incompatibile con la nuova regola — prima
  funzionava solo perché "1 fonte/giorno" permetteva pranzo=cena=legumi.
- File modificati: `nutrition-config.js`, `engine-core.js`,
  `motor-v12.js`, `index.html`. Test: nuovo
  `lotto-proteine-autocompletamento.test.js` (0/1/2 scelte, esclusioni,
  meno di due categorie disponibili → rifiuto prima della generazione);
  aggiornati `lotto-set-proteine-buildgrid.test.js`,
  `lotto-set-proteine-validazione.test.js`,
  `lotto-resolver-unica-fonte-runtime.test.js`,
  `lotto-set-proteine-menu-reale.test.js`,
  `lotto-proteine-giorno-esclusione.test.js`; rimosso
  `lotto-j-una-fonte-proteica-giorno.test.js` (testava per intero la
  semantica ora eliminata). Dettaglio completo in
  `docs/REGISTRO_MODIFICHE.md`.

## 23/09/2026 — Integrazione criteri PWA in corso

Stato **APERTO**, nessuna release. Il dettaglio per tutti i 30 criteri e i
limiti delle prove è in `ESITO_INTERVENTI_PWA.md`. La settimana deterministica
con cataloghi reali supera unicità e consecutività P; persistenza simulata.
Superate le prove mirate dei contratti e delle funzioni UI frutta/spuntini/spesa.
Restano aperti frutta automatica, percorsi manuali, transazioni browser,
dosi mancanti, migrazioni account e verifiche cloud/dispositivo. I controlli
statici precedenti non costituiscono certificazione del runtime modificato.


## 24/09/2026 — Quadro sintetico permanente delle funzioni

Elenco approvato in `RISCONTRO_FUNZIONI_PWA.md`: 16 sezioni, stati separati di integrazione e funzionamento, aggiornamento e ripresentazione in chat dopo ogni intervento. Questa registrazione non modifica gli stati applicativi e non ripete i test. Gli aggiornamenti utente recepiti in `ESITO_INTERVENTI_PWA.md` prevalgono sui residui storici sopra: nessun obbligo aggiunto di frutta automatica e nessuna nuova migrazione cloud richiesta.


## 26/09/2026 — Precedenza nutrizionista per frequenze P e sottotipi

Rimosso il tetto PDF nel resolver per proteinFrequencies e subtypeCaps. I valori espliciti restano invariati; null sul massimo elimina quel tetto, zero esclude, omissione usa i default. Invalidi negativi, decimali, valori non numerici e min>max. UI chiarisce massimo vuoto/zero; Set e filtro motore leggono i valori risolti attraverso i collegamenti esistenti. Nessuna modifica della compilazione a strati, rotazione o cataloghi.

Prove superate: tests/nutrition-config.test.js (aspettative P aggiornate alla decisione 23/09) e tests/pwa-config-proteine-percorso.test.js (funzioni reali UI, salvataggio/riapertura simulati, resolver motore, Set, soglia cap, zero/null, allergeni e rifiuto invalidi senza scritture). Sintassi dei moduli/test e 4 script inline, integrità HTML, coerenza chiamanti e diff verificati. Archivio simulato: IndexedDB reale non certificato. Sezione 1 ancora parziale per gli altri parametri e collegamenti; nessuna nuova spunta di sezione.


## 26/09/2026 — Parametri frutta e porzioni verdura dal Set nutrizionista

Rimossi i clamp PDF da frequenze/range frutta e porzioni ortaggi/insalata. Aggiunti i due campi verdura alla UI e alla configurazione canonica salvata/riletta. Valori numerici invalidi e range incoerenti sono respinti; porzioni positive, frequenze frutta non negative anche frazionarie. Il massimo giornaliero frutta null significa nessun tetto e l'indicatore lo mostra correttamente. Il conteggio usa il range di porzione risolto già previsto dal processo.

Verificato il percorso UI salvataggio/riapertura → resolver del motore → conteggio frutta e calcolo residuo V → snapshot. Il caso con V richiesta 300 g e S 80 g produce solo 220 g di contorno, senza cambiare i template. Controllata anche insalata a 90 g. Il test iniziale confrontava esattamente 220 con 220.00000000000003: corretta esclusivamente la tolleranza floating point della prova (1e-8), nessuna modifica del processo o dei dati per ottenere il PASS.

**Prove:** tests/pwa-config-frutta-verdura.test.js e tests/nutrition-config.test.js superati; sintassi resolver/test/4 script inline, integrità HTML e diff controllati. DOM e archivio simulati, nessuna attestazione IndexedDB reale. Nessuna suite estesa o test visuale.

**Limiti:** non sono state completate la selezione/dose di ogni scelta frutta nei diversi contesti né le altre regole degli spuntini; conteggio e parametri configurati non certificano l'intera sezione 8. Sezione 1 resta parziale per olio, speciali/spuntini, carboidrati, dosi/intervalli e persistenza reale. Conservati ordine a strati, priorità verdure e rotazione; nessuna distribuzione automatica della frutta aggiunta.


## 27/09/2026 — Punto 1: limiti, intervalli, dosi spuntini e commit configurazione

Ripresa del lavoro locale del 26/09, qui registrato senza attribuire chiusura all'intera sezione.

- Tolti i clamp PDF residui per speciali, spuntini, olio e tetti individuali dei carboidrati limitati. Default conservati; massimo null senza tetto, zero esclusione. Il Set utente legge i tetti risolti del nutrizionista; restano i 14 slot strutturali.
- Collegati dosi spuntini, soglia contatore colazione e intervalli stack/roll configurabili (default 15 giorni). Conservati reset per esaurimento compatibile, log, maschere P/C e ordine della compilazione a strati.
- Olio giornaliero configurabile anche a zero e ripartibile fra pranzo e cena. La normalizzazione opera sulle realizzazioni e mantiene il totale del pasto, senza aggiungere olio alle ricette che non lo prevedono.
- Salvataggio e ripristino dei cinque record nutrizionista in una sola transazione IndexedDB. Cache invalidata soltanto al completamento; nessun aggiornamento parziale in caso di abort.
- Validazione ingredienti: quantità positive, frequenze intere non negative, null distinto da zero; valori negativi/non numerici/booleani respinti. Intervalli incoerenti segnalati senza rialzare silenziosamente il massimo. Corretto il vecchio test che pretendeva l'ampliamento del tetto utente nonostante configurazione invalida.

**Prove effettuate:** nutrition-config; pwa-config-proteine-percorso; pwa-config-frutta-verdura; pwa-config-limiti-intervalli; pwa-config-commit; pwa-config-ingredienti-validazione; contratti essenziali e percorso runtime su 14 pasti (questi ultimi nel segmento precedente della stessa lavorazione). Sintassi JS e quattro script inline, integrità documento e diff controllati. DOM/archivio/transazioni simulati: non equivalgono a prova IndexedDB sul dispositivo. Nessuna suite completa o verifica visuale.

**Punto 1 ancora parziale:** precedenza delle dosi ingrediente/contesto rispetto alle dosi delle ricette compilate; aggiornamento delle nuove proposte dopo cambio configurazione preservando snapshot consumati; configurabilità completa delle dosi ricetta/S/G senza inventare dati; applicazione completa delle classi carboidrati e orari. I relativi campi o controlli parziali non costituiscono prova del percorso completo. Persistenza sul dispositivo da verificare.

**File applicativi:** nutrition-config.js, motor-v12.js, pwa-contracts.js, index.html; test mirati e documenti di riscontro. Catalogo non modificato da questo intervento. **Commit:** nessuno; nessun push o pubblicazione.


## 27/09/2026 — Punto 1: dosi correnti nella selezione delle nuove proposte

**Difetto:** poolAmmesso leggeva le quantità della cache persistente compilata, potenzialmente precedenti al salvataggio del nutrizionista. Il ricalcolo successivo dei condimenti non rendeva corretti i controlli precedenti di selezione/copertura.

**Correzione:** prima del filtro di ammissibilità, materializzazione della combinazione usando il percorso esistente e il resolver corrente. Nessuna scrittura nel catalogo, nessuna modifica dello storico o dell'ordine P → C → V. Le eccezioni di dose esplicite della ricetta restano tali; questo intervento non introduce override per ricetta e non inventa dosi S/G mancanti.

**Prova mirata:** tests/pwa-config-dosi-proposte.test.js usa i cataloghi reali con archivio simulato: cambia una dose contestuale a 137, verifica il nuovo candidato e i nutrienti, rimaterializza il vecchio snapshot e ne verifica quantità immutate; verifica anche cache persistente immutata. Primo tentativo del test usava il nome macro errato “proteine”; corretto il selettore del test ai token P reali senza modificare catalogo o processo. Sintassi, integrità e diff controllati.

**Stato:** punto 1 ancora parziale. Risolto l'uso di dosi stantie nel pool delle nuove proposte; restano copertura completa colazione/spuntini, precedenze e configurazione di dosi per ricetta, parametri temporali/classi e verifica sul dispositivo. Le altre sezioni mantengono gli stati precedenti; nessuna nuova certificazione generale.

**File:** motor-v12.js; tests/pwa-config-dosi-proposte.test.js; registro, stato, riscontro, matrice ed esito. Nessun commit/push/release.

Controllo del percorso coinvolto completato: pwa-integrazione-runtime.test.js superato (14 pasti, unicità, consecutività fonte P, anteprima e commit validato in memoria). Eseguito perché è cambiata la costruzione del pool comune. Nessuna suite estesa o visuale.


## 27/09/2026 — Punto 1, collegamenti contesti/ricette/orari

Collegati dosi contestuali e per ricetta, conversione pz/g, snapshot colazione/spuntini e relativi riepiloghi; tutti gli ingredienti esposti nel Setting; classi carboidrati nel resolver; orari salvati usati al minuto; budget globali ingredienti deduplicati fra piano/storico e ripartiti fra contesti; controlli dei minimi nella costruzione dei pasti completi. Preservati compilazione a strati, cataloghi e snapshot esistenti.

Prove mirate e percorso reale di 14 pasti su archivio simulato superati. Dettaglio completo ed eccezioni nel REGISTRO_MODIFICHE.md, voce “Punto 1: integrazione dosi, contesti, classi, orari e conteggi condivisi”. Prova IndexedDB reale preparata ma BLOCCATA: manca l'eseguibile browser. Nessun test visuale, commit o pubblicazione.

**Sezione 1: ◐ integrata / ◐ funzionante.** Restano collaudo sul runtime PWA reale, esercizio combinato dei minimi su rigenerazioni parziali/pasti speciali e dati S/G demandati a Qwen. Sezione 8 resta ◐/◐; le altre 14 sezioni restano 🔎/🔎. Nessuna spunta verde complessiva assegnata sulla base di prove parziali.


## 27/09/2026 — Conteggi preservati: modifica non collaudata

Unificati in motor-v12.js i conteggi iniziali di piano/consumi per slot, con lettura delle realizzazioni salvate ed esclusione di vuoti/speciali dal bilancio ordinario. Applicazione al singolo pasto, alla rigenerazione settimanale e al giorno precedente fuori settimana. Dettagli nel registro modifiche. Nessun test eseguito: richiesta autorizzazione preventiva obbligatoria salvata in AGENTS.md. Punto 1 ancora parziale: da verificare conteggi e coerenza dei record legacy nel validatore finale; restano browser/IndexedDB e dati S/G da Qwen. Sezioni 1 e 8 ◐ integrata / ◐ funzionante; altre 14 🔎/🔎. Nessuna nuova certificazione.


## 27/09/2026 — Validatore allineato e tracce QA

Validatore settimanale collegato alla stessa lettura di generazione/rigenerazione per snapshot e ID legacy; riferimenti mancanti segnalati esplicitamente. Metadati @qa-metadata / P1-conteggi-preservati in motor-v12.js indicano funzioni, regole, prova mirata e casi da approfondire senza ricostruire l'analisi. Sintassi, struttura e diff controllati; pwa-conteggi-preservati e singolo percorso pwa-integrazione-runtime superati (archivio simulato). Nessuna suite estesa o verifica visuale. Il precedente divieto di controlli minimi è superato dall'ultima autorizzazione utente, registrata in AGENTS.md. Punto 1 ancora parziale: restano combinazioni annotate, IndexedDB reale e dati S/G. Stati complessivi invariati: 1 e 8 ◐/◐; altre 14 sezioni 🔎/🔎. Dettagli nel registro.


## 30/09/2026 — Punto 1: contratti legacy e verifiche dei preservati

Allineati ID legacy singoli/multipli alla cronologia e ai controlli del commit; verificati gli ingressi della rigenerazione parziale con blocchi/speciali e il confine domenica-lunedì. Evidenze e limiti nel registro, voce omonima. Sezioni 1 e 8 restano ◐/◐; altre 14 🔎/🔎. Provata anche la rigenerazione parziale con minimo ingrediente e blocchi, inclusa una variante con consumo utente-speciale, su solver/cataloghi reali e archivio in memoria. Restano collaudo PWA/IndexedDB reale e dati S/G; nessuna spunta verde complessiva.


## 30/09/2026 — Modelli dichiarativi e quote S/G

Applicata la proposta autorizzata: dichiarazioni nel modello sorgente, resolver/Set nutrizionista e propagazione all’esploso con S/G numerici. Prove mirate e limiti nel registro, voce omonima. Restano parametri nutrizionista non impostati e collaudo PWA/IndexedDB reale. Sezioni 1 e 8 ◐/◐; altre 14 🔎/🔎, nessuna certificazione complessiva.


30/09/2026 — Quantità iniziali S/G 80 g: verifiche mirate nel test `pwa-modelli-quote-vegetali`; dosi specifiche e Set prevalgono, massimi configurabili senza tetto iniziale. Dettagli: registro «Valore iniziale S/G concluso». Macroaree restano parziali; IndexedDB reale e dosi aromi non dichiarate restano aperti.


30/09/2026 — Rettifica: rimosso default universale S/G 80 g; conservate dosi native e verifiche struttura/resolver. Dati mancanti circoscritti da definire con Cwe; riferimento registro «Rettifica default S/G e lacune contestualizzate». Stati complessivi invariati.


30/09/2026 — Aromi esclusi su istruzione Cwe: non sono più un residuo di questo intervento. Restano dati S/G; stati complessivi invariati. Riferimento registro «Aromi esclusi dal perimetro».


30/09/2026 — Dosi S/G sospese su istruzione Cwe. Verificata conferma proposta obbligatoria nel percorso runtime; acquisto manuale ora atomico e idempotente con prove di abort/doppio evento in simulazione. Riferimento registro «Prosecuzione: conferma proposte e acquisto manuale». Restano dispositivo e consumo manuale/editor; macrosezioni invariate.


30/09/2026 — Consumo manuale/editor: quattro ingressi ora atomici, snapshot aggiornati, rettifica quantitativa scorte e contatore, doppio evento/abort verificati in simulazione. Riferimento registro «Consumo manuale/editor atomico». Resta dispositivo; scorta eliminata non ricreata e lotti legacy non certificati. Macroaree invariate, S/G sospese.


## 01/10/2026 — Revisione tecnica dei 16 punti
Tutte le sezioni valutate; stato corrente e residui S/V/D nella matrice RISCONTRO_FUNZIONI_PWA.md, che supera gli stati iniziali e le note storiche incompatibili. Corretti i difetti dimostrati su ricorrente, Roll, backup, premio colazione, quantità inventario e reset-bozze; shell v4 preparata. Prove mirate dei percorsi modificati superate in memoria/simulazione. Dettagli e file nel registro «Revisione tecnica dei 16 punti». Identità dishKey del pasto combinato/separato verificata e collegata a costruzione/commit; residui circoscritti di dispositivo/servizi. Dosi S/G sospese, aromi esclusi. Nessun test visuale/suite completa, installazione browser, commit/push/pubblicazione. Chiusura della revisione tecnica non equivale a certificazione di release.

## 01/10/2026 — Chiusura dei percorsi tecnici dei 16 punti

Completate le correzioni eseguibili nei percorsi documentati: nessun residuo V individuato resta aperto. Nuove prove mirate di commit Menu/Set, uscita Set, isolamento consumo/bozza, porzioni storico e totali nutrizionali DOM superate. Matrice corrente in RISCONTRO_FUNZIONI_PWA; evidenze pregresse riutilizzate e stati obsoleti dell’esito riallineati. Restano esclusivamente collaudo finale D, limiti dei dati legacy e dosi S/G espressamente sospese; aromi esclusi. Resoconto unico nel registro omonimo. Nessuna certificazione release, commit o push.

## 01/10/2026 — Maschera: quantità S/G

Campi dei modelli collegati in maschera-ricette.html; modifica dosi ingredienti e composizioni, riferimenti nutrizionista e preservazione metadati verificati con prova mirata. Nessuna dose assegnata né scrittura GitHub. Stati complessivi dei 16 punti invariati; interazione dispositivo da collaudare. Resoconto nel registro omonimo.

## 01/10/2026 — Accesso rapido barcode

Icona diretta nella barra inferiore, collegata al lettore comune della Spesa senza cambio vista/bozze. Prova mirata collegamento/acquisto/rollback superata, sintassi e diff verificati. Stati complessivi invariati; resta fotocamera/touch sul dispositivo. Resoconto nel registro «Barcode diretto nella barra inferiore». Nessuna pubblicazione.

## 01/10/2026 — Push autorizzato e browser reale
Push eseguito, deploy Pages riuscito. Nuovi riscontri reali nei residui della matrice dei 16 punti; dettagli nel registro «Push autorizzato e collaudo browser reale». Corretto il difetto dimostrato delle colazioni automatiche incomplete, prova mirata superata e shell v5 predisposta. Certificazione completa ancora aperta per i soli casi non provati, hardware/servizi e sospensioni; nessuna spunta assegnata senza evidenza completa.

## 02/10/2026 — Peso fette documentato
Dato approvato e applicato: ingredienti v23, 8,8g/fetta, 4 pezzi=35,2g. Prova mirata conversione/nutrienti/scarico/override/snapshot e shell v6 superata; dettagli nel registro omonimo. Collaudo UI ancora da completare, dosi S/G sospese.

02/10/2026 — Set e Menu verificati nel browser e promossi nella matrice. Correzioni riepilogo pz/frequenze snapshot provate; shell v7 predisposta, attivazione reale da verificare. Resoconto nel registro «Riepiloghi quantitativi e frequenze da snapshot».

02/10/2026 — Shell v7 verificata, punti 9/11 promossi con quantità/porzioni/storico e frequenze/grafici reali. Flag speciale aggiorna ora il listener del Piano, prova mirata passata; shell v8 predisposta. Riferimento registro «Attivazione riepiloghi e selezione speciale».

02/10/2026 — Shell v8 attivata, aggiornamento speciali verificato senza navigazione; apertura/scadenza inventario riscontrata al consumo. Sezioni verdi 2/4/6/7/9/11/12; residui precisi nella matrice, S/G sospese. Registro «Chiusura riscontri browser e residui».

02/10/2026 — Lookup barcode Open Food Facts implementato; prove mirate locale/rete, conferma, quantità, cache, errori e risposta superata passate. Shell v9 attivata; API/CORS reali verificati (Nutella 400g, ingrediente vuoto); fotocamera e ml/pz restano dispositivo. Registro «Barcode: ricerca Open Food Facts».

02/10/2026 — Barcode compatto implementato e verificato con prova DOM/API mirata; validazione espande i dati mancanti prima dell’acquisto. Verifica visuale utente; stati 16 punti invariati. Registro «Finestra barcode compatta».

02/10/2026 — Corretto flusso barcode su segnalazione Cwe: camera diretta, azioni per stato, registrazione distinta da acquisto. Prove mirate simulate passate; camera/visuale Android ancora da riscontrare. Registro «Barcode: lettura immediata e azioni per stato».

02/10/2026 — Rimossi pulsanti UI Ruota C/P/V; runtime e pipeline invariati. Evidenze precedenti su tali pulsanti storiche. Registro «Rimozione pulsanti Ruota C/P/V».

02/10/2026 — Ricerca ingrediente barcode locale/offline mentre si scrive, buffer dieci righe e selezione esplicita verificati in simulazione. Registro «Barcode: ricerca rapida ingrediente».

03/10/2026 — Spuntini Pasto: carosello con scelta singola/toggle nel piano e readonly alla scadenza. Prova mirata superata; grafica/touch dispositivo rinviati. Nessun push. Registro «Spuntini: carosello e selezione persistente».

03/10/2026 — Cambia piatto/Rigenera proposta animano solo griglia alternative sull’asse X; prova mirata passata. Riscontro UI dispositivo. Registro «Proposte: transizione orizzontale locale».
