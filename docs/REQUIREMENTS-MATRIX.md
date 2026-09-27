# DietaPlanner — matrice requisiti motor v12

| ID | Requisito corrente | Tipo | Responsabile | Verifica |
|---|---|---|---|---|
| SRC-01 | Root unica; nessuna dipendenza dall'archivio 1.0 | HARD | bootstrap/PWA | snapshot + source audit |
| SRC-02 | Solo `db-ricette.json` e `ingredienti-new.json` | HARD | `motor-v12.js` | snapshot + catalog test |
| SRC-03 | API motore versionata `DietaPlannerMotorV12` | HARD | `motor-v12.js` | integrazione Lotto C |
| CFG-01 | Unico resolver di PDF, APP, Setting, profilo e Set | HARD | `nutrition-config.js` | resolver test |
| CFG-02 | Esclusione clinica prevalente; cap utente solo restrittivo | HARD | resolver | resolver + Lotto E |
| CFG-03 | Setting non modifica cataloghi al salvataggio | HARD | UI Setting | Lotto D |
| CFG-04 | Quantità distinte per contesto | HARD | resolver/realizzazione | Lotto D + futuro Lotto G |
| CARB-01 | Quattordici slot C per la settimana ordinaria | HARD | resolver/motore | Lotto C |
| CARB-02 | AUTO usa soltanto voci senza tetto PDF | HARD | resolver/motore | resolver + Lotto C |
| CARB-03 | EXCLUDED non rientra tramite fallback | HARD | resolver/motore | resolver + Lotto C |
| CARB-04 | FIXED è un numero settimanale esatto | HARD | motore | Lotto C |
| CARB-05 | Tutti i carboidrati 0–2 della pagina 14 sono classificati | HARD | baseline/adattatore | snapshot + Lotto C |
| CARB-06 | Pasti preservati scalano il budget prima della generazione | HARD | motore | Lotto C |
| PROT-01 | Frequenze e profilo derivano dal resolver | HARD | resolver/motore | Lotto C/E |
| PROT-02 | Cap per carne rossa, affettati, pesce grande e conservato | HARD | motore | Lotto C/F |
| PROT-03 | Ingredienti secondari contribuiscono ai cap di famiglia | HARD | motore | Lotto C |
| PROT-04 | Vegetariano/vegano non ricevono override numerici inventati | HARD | resolver/motore | Lotto C |
| VEG-01 | Verdura richiesta a pranzo e cena | HARD | copertura/motore | Lotto G |
| VEG-02 | Copertura verdura quantitativa | HARD | resolver/realizzazione | engine test + Lotto G |
| VEG-03 | Aggiunta del solo residuo necessario | HARD | realizzazione | Lotto G |
| VEG-04 | Ortaggi e insalate usano porzioni distinte | HARD | catalogo/resolver | Lotto F + Lotto G |
| VEG-05 | Patate non sono verdura; classificazioni PDF preservate | HARD | catalogo | Lotto F |
| VEG-06 | `P+V` parziale diventa `P+G`; `C+V` parziale diventa `C+S`; `V` resta solo per una porzione completa | HARD | catalogo/motor v12 | catalog audit + motor test |
| VEG-07 | `S` e `G` contribuiscono in grammi ma non soddisfano da soli il requisito `V` | HARD | motor v12/realizzazione | unit + integrazione |
| VEG-08 | `V_residuo = max(0, V_richiesta - S - G - V_presente)` usa le quantità effettive | HARD | motor v12/realizzazione | unit + Lotto G |
| VEG-09 | Residuo >=50 g crea una `V` dedicata; residuo <50 g viene redistribuito senza mutare il template | HARD | motor v12/realizzazione | unit + Roll + browser |
| PLAN-01 | Programmazione indipendente dalla giacenza | HARD | generatore | Lotto G |
| PLAN-02 | Inventario vuoto produce piano e carrello, non blocco | HARD | generatore/spesa | Lotto G/H |
| PLAN-03 | Verdure delicate prima, durevoli dopo | SOFT obbligatoria | generatore | Lotto G/H |
| PLAN-04 | Carrello contiene varietà di durata coerente col menu | HARD | lista spesa | Lotto G/H |
| PLAN-05 | Generazione automatica soltanto da domani | HARD | motore/UI | Lotto G/H |
| PLAN-06 | Settimana salvata solo se ogni slot è valido | HARD | motore | Lotto C |
| PLAN-07 | Composizione dello slot nell'ordine Proteina/G, Carboidrato/S, residuo V | HARD | motor v12 | integrazione + stress |
| TODAY-01 | Pasto odierno ricorda il programmato | HARD | UI/adattatore | Lotto G/H |
| TODAY-02 | Alternative odierne rispettano il piano nutrizionale | HARD | motore/UI | Lotto G/H |
| TODAY-03 | Scadenza, avanzo e deperibilità sono priorità positive | SOFT | Salvafrigo | Lotto G/H |
| TODAY-04 | Assenza di scorta non vieta una proposta | HARD | Salvafrigo | Lotto G/H |
| TODAY-05 | Scelta diretta persiste finché non viene cambiata | HARD | UI/bozza | Lotto G/H |
| DATA-01 | Ogni ingrediente ricetta risolve nel catalogo | HARD | catalog validator | Lotto F |
| DATA-02 | Categoria gruppo coerente con metadato ingrediente | HARD | catalog validator | Lotto F |
| DATA-03 | Unità `pz` restano a pezzi | HARD | resolver/materializzazione | snapshot + Lotto G |
| DATA-04 | Nessuna dose catalogo mutata dal Setting | HARD | UI/resolver | Lotto D |
| DATA-05 | `disponibile:false` esclude la ricetta concreta da ogni nuova proposta senza cancellare ID, storico o snapshot | HARD | catalogo visuale/motor v12 | test disponibilità catalogo visuale |
| MEAL-01 | Piano, bozza e storico sono distinti | HARD | UI/IndexedDB | Lotto G/H |
| MEAL-02 | Un consumo reale non viene riscritto | HARD | storico | Lotto G/H |
| MEAL-03 | Inventario viene scalato sul consumo reale | HARD | consumo | Lotto G/H |
| MEAL-04 | Quantità condivisa da nutrizione/inventario/spesa/storico | HARD | realizzazione | Lotto G/H |
| INV-01 | La pagina Spesa legge con la fotocamera i codici prodotto, con EAN-13 come formato ordinario | HARD/UX | UI Spesa/scanner | futuro test Android reale |
| INV-02 | Codici commerciali e formati confezione vivono in un archivio parallelo e risolvono gli ingredienti esclusivamente tramite `variantId` | HARD | catalogo prodotti/adattatore | futuro schema test |
| INV-03 | Una scansione confermata aggiunge all'inventario la quantità totale normalizzata in `g`, `ml` o `pz`; più confezioni vengono sommate | HARD | inventario | futuro unit + IndexedDB |
| INV-04 | Un codice sconosciuto richiede conferma o associazione manuale persistente; una ricerca esterna non diventa fonte canonica automaticamente | HARD | scanner/catalogo prodotti | futuro integrazione + browser |
| INV-05 | EAN non produce scadenza o lotto se tali dati non sono esplicitamente codificati | HARD | scanner/inventario | futuro unit + browser |
| ROLL-01 | Roll C modifica soltanto C compatibile | HARD | motor v12/UI | Lotto G/H |
| ROLL-02 | Roll P modifica soltanto P/cottura compatibile | HARD | motor v12/UI | Lotto G/H |
| ROLL-03 | Roll V modifica soltanto V/condimento compatibile | HARD | motor v12/UI | Lotto G/H |
| ROLL-04 | Roll disattivato senza alternativa reale | HARD/UX | motor v12/UI | Lotto G/H |
| COND-01 | Compatibilità condimento per ingrediente | HARD | catalogo/motore | catalog + motor test |
| COND-02 | Rotazione automatica evita ripetizione continua | SOFT obbligatoria | tracking v12 | motor + browser |
| UI-01 | Pranzo/cena mostrati su righe C/P/V | HARD/UX | UI | contratto + browser |
| UI-02 | Stessa struttura in Pasto e Programmazione | HARD/UX | UI | contratto + browser |
| UI-03 | Roll contestuale a destra di ciascuna riga | HARD/UX | UI | contratto + browser |
| UI-04 | Tastiera Android non copre il campo attivo | UX | viewport helper | browser reale |
| MIG-01 | Chiavi legacy leggibili senza reset distruttivo | HARD | adattatore IndexedDB | Lotto H |
| MIG-02 | Conteggi C legacy migrano in AUTO/FIXED correttamente | HARD | motor v12 | Lotto C + browser |
| PWA-01 | Cache include soltanto asset attivi | HARD | `sw.js` | source audit + browser |
| AUTH-01 | Login Google persistente fino al logoff | HARD | Firebase Auth | Lotto I + browser |
| AUTH-02 | Modalità locale non persistente al riavvio | HARD | bootstrap account | Lotto I + browser |
| RBAC-01 | Account senza whitelist non ottiene privilegi | HARD | access resolver/Rules | Lotto I + emulator |
| RBAC-02 | Permessi granulari, nessun controllo email hardcoded | HARD | access resolver | Lotto I unit test |
| RBAC-03 | Setting nutrizionista invisibile e inaccessibile ai non autorizzati | HARD | UI/Rules | Lotto I DOM + emulator |
| CLOUD-01 | Migrazione non distruttiva e idempotente da IndexedDB | HARD | migration service | Lotto I stress/browser |
| CLOUD-02 | Cataloghi e cache compilate non duplicati per utente | HARD | cloud repository | source/schema audit |
| CLOUD-03 | Storico eventi append-only con ID idempotente | HARD | event repository | Lotto I stress |
| CLOUD-04 | Rollback per dominio verso IndexedDB | HARD | repository/feature flags | Lotto I browser |
| REL-01 | Nessuna release prima dello stress test | HARD | processo | stato lotti |
| REL-02 | Release soltanto con autorizzazione esplicita di Cwe | HARD | processo | checklist release |

## Criterio di chiusura

Un requisito è chiuso quando possiede almeno un controllo automatico. Se
coinvolge DOM, IndexedDB, responsive o service worker richiede anche una prova
browser reale. La presenza del codice o un test testuale non sono sufficienti.

## Evidenza Lotto H corrente

`tests/lotto-h-stress-migrations.test.js` copre settimane vuote/parziali/piene,
realizzazioni legacy, migrazione carboidrati e profili vegetariano/vegano.
`tests/lotto-h-pwa-source-contract.test.js` copre sorgenti attive, manifest,
icone, store IndexedDB e registrazione degli handler del service worker. I
requisiti marcati `browser` in tabella restano aperti fino a una sessione reale
raggiungibile; la release resta quindi bloccata.

## Evidenza Lotto J V/S/G

I requisiti `VEG-06`—`VEG-09`, `PLAN-07`, `MEAL-04` e `ROLL-01`—`ROLL-03`
sono coperti dai test Lotto J su catalogo, semantica, quantità, pipeline,
soglia, snapshot, Roll/Salvafrigo, rendering e stress. La batteria finale ha
superato 24 suite su 24; lo stress dedicato ha verificato 350 pasti. La prova
browser della build corrente ha coperto generazione, persistenza, righe C/P/V,
Roll C e Salvafrigo. Il responsive Android resta aperto come previsto da
`UI-04` e non viene chiuso da questa evidenza.


## 26/09/2026 — Precedenza nutrizionista per frequenze P e sottotipi

Rimosso il tetto PDF nel resolver per proteinFrequencies e subtypeCaps. I valori espliciti restano invariati; null sul massimo elimina quel tetto, zero esclude, omissione usa i default. Invalidi negativi, decimali, valori non numerici e min>max. UI chiarisce massimo vuoto/zero; Set e filtro motore leggono i valori risolti attraverso i collegamenti esistenti. Nessuna modifica della compilazione a strati, rotazione o cataloghi.

Prove superate: tests/nutrition-config.test.js (aspettative P aggiornate alla decisione 23/09) e tests/pwa-config-proteine-percorso.test.js (funzioni reali UI, salvataggio/riapertura simulati, resolver motore, Set, soglia cap, zero/null, allergeni e rifiuto invalidi senza scritture). Sintassi dei moduli/test e 4 script inline, integrità HTML, coerenza chiamanti e diff verificati. Archivio simulato: IndexedDB reale non certificato. Sezione 1 ancora parziale per gli altri parametri e collegamenti; nessuna nuova spunta di sezione.


## 26/09/2026 — Parametri frutta e porzioni verdura dal Set nutrizionista

Rimossi i clamp PDF da frequenze/range frutta e porzioni ortaggi/insalata. Aggiunti i due campi verdura alla UI e alla configurazione canonica salvata/riletta. Valori numerici invalidi e range incoerenti sono respinti; porzioni positive, frequenze frutta non negative anche frazionarie. Il massimo giornaliero frutta null significa nessun tetto e l'indicatore lo mostra correttamente. Il conteggio usa il range di porzione risolto già previsto dal processo.

Verificato il percorso UI salvataggio/riapertura → resolver del motore → conteggio frutta e calcolo residuo V → snapshot. Il caso con V richiesta 300 g e S 80 g produce solo 220 g di contorno, senza cambiare i template. Controllata anche insalata a 90 g. Il test iniziale confrontava esattamente 220 con 220.00000000000003: corretta esclusivamente la tolleranza floating point della prova (1e-8), nessuna modifica del processo o dei dati per ottenere il PASS.

**Prove:** tests/pwa-config-frutta-verdura.test.js e tests/nutrition-config.test.js superati; sintassi resolver/test/4 script inline, integrità HTML e diff controllati. DOM e archivio simulati, nessuna attestazione IndexedDB reale. Nessuna suite estesa o test visuale.

**Limiti:** non sono state completate la selezione/dose di ogni scelta frutta nei diversi contesti né le altre regole degli spuntini; conteggio e parametri configurati non certificano l'intera sezione 8. Sezione 1 resta parziale per olio, speciali/spuntini, carboidrati, dosi/intervalli e persistenza reale. Conservati ordine a strati, priorità verdure e rotazione; nessuna distribuzione automatica della frutta aggiunta.


### 27/09/2026 — Evidenze parziali punto 1
Limiti speciali/spuntini/carboidrati, olio ripartito/zero, dosi spuntini, intervalli stack/roll e salvataggio atomico collegati; validazione ingredienti rinforzata. Prove e residui in STATO_LOTTI_E_TEST.md, voce del 27/09. Sezione 1 non chiusa: quantità contestuali/snapshot, copertura completa parametri e prova dispositivo ancora aperti.

27/09/2026 — Dose contestuale pasto principale: nuova proposta materializzata prima del filtro; snapshot preesistente preservato, prova su catalogo reale in pwa-config-dosi-proposte.test.js. Punto 1 resta parziale.


27/09/2026 — Punto 1: configurazione dosi/contesti/ricette/classi/orari collegata al runtime; snapshot colazione/spuntini e budget condivisi verificati puntualmente. Prove e limiti nel registro. Test browser IndexedDB BLOCCATO per eseguibile assente; minimi su casi combinati parziali/speciali non ancora certificati. Sezione non chiusa.


## 27/09/2026 — Conteggi preservati: modifica non collaudata

Unificati in motor-v12.js i conteggi iniziali di piano/consumi per slot, con lettura delle realizzazioni salvate ed esclusione di vuoti/speciali dal bilancio ordinario. Applicazione al singolo pasto, alla rigenerazione settimanale e al giorno precedente fuori settimana. Dettagli nel registro modifiche. Nessun test eseguito: richiesta autorizzazione preventiva obbligatoria salvata in AGENTS.md. Punto 1 ancora parziale: da verificare conteggi e coerenza dei record legacy nel validatore finale; restano browser/IndexedDB e dati S/G da Qwen. Sezioni 1 e 8 ◐ integrata / ◐ funzionante; altre 14 🔎/🔎. Nessuna nuova certificazione.


## 27/09/2026 — Validatore allineato e tracce QA

Validatore settimanale collegato alla stessa lettura di generazione/rigenerazione per snapshot e ID legacy; riferimenti mancanti segnalati esplicitamente. Metadati @qa-metadata / P1-conteggi-preservati in motor-v12.js indicano funzioni, regole, prova mirata e casi da approfondire senza ricostruire l'analisi. Sintassi, struttura e diff controllati; pwa-conteggi-preservati e singolo percorso pwa-integrazione-runtime superati (archivio simulato). Nessuna suite estesa o verifica visuale. Il precedente divieto di controlli minimi è superato dall'ultima autorizzazione utente, registrata in AGENTS.md. Punto 1 ancora parziale: restano combinazioni annotate, IndexedDB reale e dati S/G. Stati complessivi invariati: 1 e 8 ◐/◐; altre 14 sezioni 🔎/🔎. Dettagli nel registro.
