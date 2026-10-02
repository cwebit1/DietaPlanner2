# Interventi PWA — lista operativa al 24 settembre 2026

Questa lista distingue lavoro già realizzato, difetti e verifiche residue. Stato tecnico aggiornato il 01/10/2026, coerente con la matrice dei 16 punti. Le prove pregresse restano valide e non sono rieseguite; nuove prove circoscritte ai difetti effettivamente corretti. I residui D richiedono dispositivo/servizio reale, S è sospeso su istruzione.

**Legenda:** ✅ comportamento provato nel perimetro indicato; 🔎 presente, da verificare; ❌ difetto accertato; ⚠️ incoerenza da seguire nei chiamanti; ⬜ mancante; ⏸ mantenere su istruzione. Una spunta su una parte non certifica l'intero criterio o il browser. I numeri sono quelli della lista corrente dei 30 criteri, non ripristinano il vecchio punto eliminato.

| # | Criterio | Cosa c’è e stato | Solo lavoro residuo |
|---|---|---|---|
| 1 | Cataloghi | ✅ Caricamento cataloghi reali provato. | 🔎 Cache e migrazione browser da verificare; conservare il caricamento. |
| 2 | Ricette e componenti | ✅ Identità compilate e snapshot principali presenti. | 01/10: identità pasto combinato/separato comune provata e collegata a costruzione/commit. Resta UI/dispositivo. |
| 3 | Configurazione | ✅ Resolver/precedenze/parametri collegati e verificati nei percorsi documentati. | S/G sospese; orario pranzo salvato e riletto su IndexedDB reale. Altri parametri da collaudare. Vedere matrice corrente dei 16 punti. |
| 4 | Allergeni | ✅ Filtro clinico e snapshot allergeni verificati; classificazioni del catalogo Lotto F preservate. | D: interazione esclusioni e proposte sul dispositivo; nessuna classificazione inventata. |
| 5 | Frequenze P | ✅ Frequenze risolte e conteggi condivisi verificati nei percorsi documentati. | D: salvataggio/riapertura sul dispositivo; prove tecniche riutilizzate. |
| 6 | Rotazione P/C | ✅ Rotazione P/C, consecutività e intervalli configurati verificati. | D: persistenza cicli/log al riavvio; nessuna riscrittura del motore. |
| 7 | Stack | ✅ Stack, soglie e filtro al reset verificati. | D: riavvio e consultazione log reali. |
| 8 | Roll binario | ✅ Roll in anteprima senza scritture e commit/conflitto/abort provati. | D: interazione C/P/V e persistenza su dispositivo. |
| 9 | Unicità piatti | ✅ Settimana di 14 pasti senza duplicati e rifiuto duplicato al commit provati. | 01/10: unicità pasto combinato/separato aggiunta conservando i contratti per ricetta; proposte manuali da collaudare sul dispositivo. |
| 10 | Bozza e conferma | ✅ Commit con baseline, abort sincrono e preservazione bozza verificati. | D: IndexedDB reale e gesti Salva/Annulla. |
| 11 | Sequenza P/C/V | ✅ P→C→V e priorità PX+C.user verificati; algoritmo preservato. | Nessuna verifica tecnica residua nei casi documentati; collaudo UI nella sezione Pasto. |
| 12 | Carboidrati | ✅ FIXED/AUTO, tetti e conteggi verificati nei percorsi documentati. | D: selezione e riapertura Set sul dispositivo. |
| 13 | Verdure | ✅ Ricorrente esaurita rilascia la priorità; chiusura conserva ripiego compatibile. | 01/10: slot reale e pool senza ricorrente verificati. Resta collaudo dispositivo. |
| 14 | Residuo V/S/G | ✅ Residuo, override e snapshot verificati con dosi dichiarate. | S: sole dosi S/G mancanti sospese; D: resa quantità sul dispositivo. |
| 15 | Dosi sughi | ⬜ Dati mancanti nel catalogo; esclusione delle dosi mancanti già presente. | Sospeso su istruzione Cwe; aromi esclusi. Non riaprire in questo incarico. |
| 16 | Olio | ✅ Quota risolta e normalizzazione sulle realizzazioni verificate. | D: resa delle quantità nei dettagli; dosi esistenti conservate. |
| 17 | Roll C/P/V | ✅ Roll reale con conferma atomica e nessuna scrittura durante anteprima. | D: comandi C/P/V sul dispositivo. |
| 18 | Alternativa | ✅ Anteprima senza scrittura piano provata. 🔎 Conferma implementata. | 30/09: proposta obbligatoria e conferma provate su cataloghi reali/in memoria; altri pasti preservati e rifiuto senza scritture. Resta dispositivo. |
| 19 | Salvafrigo | ✅ Salvafrigo sulla pipeline comune, priorità scorte e residuo documentati nel Lotto G. | D: interazione con scorte reali e fascia oraria. |
| 20 | Consumo | ◐ Consumo automatico e quattro ingressi editor manuali transazionali; correzioni verificate in simulazione. | 30/09: snapshot, contatori, differenza scorte, doppio evento e rollback verificati. Restano dispositivo e correzione di scorta eliminata. |
| 21 | Colazione | ✅ Snapshot, contatore e premio al consumo verificati. | D: composizione e consumo premio su dispositivo. |
| 22 | Frutta e spuntini | ✅ Conteggi, deduplicazione, contesti e dosi configurate collegati e provati. | Collaudo scelta/consumo su dispositivo; frutta/spuntini liberi e dosati. |
| 23 | Pagina Pasto | ✅ Pipeline proposte/snapshot e conferma verificati. | D: interazione e resa visiva dei comandi; nessun nuovo restyling. |
| 24 | Menu | ✅ Bozza, commit/errori, reset atomico sul piano reale con Menu aperto e isolamento consumo verificati. | D: navigazione/cambio settimana e IndexedDB reale. |
| 25 | Dettaglio | ✅ Snapshot e protezione porzioni consumate; abort conserva oggetto. | D: preferiti, consultazione storico e timer touch. |
| 26 | Inventario e spesa | ✅ Fabbisogno meno consumati/scorte provato. ◐ Acquisto manuale atomico verificato in simulazione. | 30/09: transazione unica, doppia conferma e abort provati; conservato calcolo spesa. Acquisto barcode manuale 2×125g e persistenza reale verificati; restano altri percorsi. |
| 27 | Barcode | ✅ Checksum e quantità provati. 🔎 Scanner e acquisto implementati. | Icona diretta e inserimento EAN/prodotto manuali superati nel browser; fotocamera ancora dispositivo. |
| 28 | Accessi e cloud | ⏸ Mantenere per decisione utente. | Non riaprire sviluppo o migrazioni cloud; nessuna certificazione implicita. |
| 29 | Offline | ✅ Shell v4, install fallito e query offline verificati in simulazione. | D: installazione, aggiornamento e avvio locale offline reali. |
| 30 | Controlli e stato | ✅ Conferma obbligatoria provata; riepiloghi riallineati ai 16 punti. | Conservare evidenze e matrice corrente; collaudo finale circoscritto dai metadati. |

## Prove eseguite

- `pwa-integrazione-runtime.test.js`: motore e cataloghi reali; settimana di
  14 pasti, unicità dei piatti, consecutività della fonte P, anteprima senza
  scrittura del piano e rifiuto di una sostituzione duplicata. SUPERATO.
  Persistenza simulata: non prova le transazioni IndexedDB del browser.
- `pwa-contratti-essenziali.test.js`: 14/15 giorni, riapertura C senza
  riaprire P, duplicati inderogabili, consecutività P, contatore colazione,
  scarico FEFO, conversione pezzi e checksum EAN. SUPERATO.
- `pwa-spuntini-frutta-runtime.test.js`: funzioni effettive estratte dalla UI;
  colazione e snapshot frutta, deduplicazione storico/piano, settimana
  richiesta, sostituzione spuntino, fabbisogno spesa meno consumati e scorte.
  SUPERATO; archivio in memoria. Verificato anche il rifiuto clinico di uno
  snapshot che omette gli allergeni presenti nella classificazione canonica.
- Sintassi dei moduli modificati e dei quattro script inline; integrità JSON;
  `git diff --check`: SUPERATI prima dell'ultima revisione documentale.
- Nessuna verifica visuale, fotocamera, Android o servizio Firestore eseguita.


## Perché i punti ricomparivano

1. Implementazioni comuni aggiunte senza completare tutti i percorsi: consumo automatico atomico ma editor manuali separati; acquisto barcode atomico ma acquisto manuale separato.
2. Prove con copertura inferiore al requisito: una settimana deterministica non certifica ogni configurazione; archivio simulato non certifica IndexedDB; il ramo if(proposal) può saltare la conferma.
3. Il nuovo prompt ripresentava requisiti generali come attività, senza separare implementazione e verifica. La ripetizione nel prompt non dimostra una regressione del codice.
4. Report non allineato alle decisioni successive: distribuzione automatica frutta e migrazioni cloud non sono nuovi lavori richiesti. Anche il testo finale del runner contiene quel riferimento superato alla frutta: correggerne il resoconto, senza costruire la funzione non richiesta.
5. Il quadro del 24/09 riportava clamp e collegamenti allora incompleti: superati dagli interventi 26–30/09. Non riaprire sulla base di quella descrizione storica.

Non ci sono evidenze sufficienti per attribuire ogni voce aperta a una regressione, né per quantificare il consumo di budget di ciascuna attività. Il lavoro applicativo esiste ma la chiusura dell'integrazione è incompleta.

## Interventi coordinati residui
Stato corrente nella matrice dei 16 punti di RISCONTRO_FUNZIONI_PWA.md (01/10/2026): residui S/V/D circoscritti per sezione. Configurazione, dosi contestuali, editor consumo/acquisti, ripiego ricorrente, conferma proposta e contatore premio non sono più interventi applicativi da rifare. Dosi S/G sospese e aromi esclusi. Collettore finale non eseguito: suite completa/regressioni estese/visuali non autorizzate.


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

02/10/2026: conversione fette corretta con peso documentato autorizzato; prova pwa-fette-peso-documentato superata. Riferimento registro «Peso fette documentato»; stati complessivi non promossi dalla sola prova quantitativa.

02/10/2026 — Set e Menu verificati nel browser e promossi nella matrice. Correzioni riepilogo pz/frequenze snapshot provate; shell v7 predisposta, attivazione reale da verificare. Resoconto nel registro «Riepiloghi quantitativi e frequenze da snapshot».

02/10/2026 — Shell v7 verificata, punti 9/11 promossi con quantità/porzioni/storico e frequenze/grafici reali. Flag speciale aggiorna ora il listener del Piano, prova mirata passata; shell v8 predisposta. Riferimento registro «Attivazione riepiloghi e selezione speciale».
