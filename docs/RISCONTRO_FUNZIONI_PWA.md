# Riscontro permanente delle funzioni PWA — 16 sezioni

Lista approvata da Cwe il 24/09/2026. È il quadro sintetico da aggiornare e ripresentare in chat dopo ogni intervento. Integra lo stato lotti e il dettaglio dei 30 criteri, senza sostituire i requisiti vigenti.

## Istruzioni permanenti

- Prima di intervenire leggere le istruzioni di progetto pertinenti e le decisioni successive. Preservare la compilazione a strati dalle proteine e le parti conformi.
- Approfondire una sezione alla volta, includendo le dipendenze concretamente interessate. Ogni funzione approfondita avrà due stati separati: **integrata** e **funzionante**.
- Dopo ogni intervento aggiornare le sole voci interessate con risultato, prova e limite residuo; ripresentare in chat l'intera lista sintetica aggiornata, evidenziando le variazioni. Se il turno è solo documentale, dichiarare che gli stati applicativi non cambiano.
- ✅ Integrata: tutti i collegamenti necessari alla funzione sono verificati. ✅ Funzionante: il comportamento richiesto è dimostrato dalle prove pertinenti. Una parte implementata o un test isolato non chiude l'intera funzione/sezione.
- Usare ❌ per difetto accertato, ◐ per integrazione parziale, ⬜ per mancante e 🔎 per stato non ancora verificato a questo livello. Le parti conformi si conservano; le incomplete restano aperte fino alla conclusione.
- Lo stato 🔎 iniziale delle sezioni non annulla le prove già disponibili: indica che manca una valutazione complessiva della sezione. Riutilizzare riscontri e prove dei documenti di esito, indicando il loro perimetro.
- Risparmio risorse richiesto da Cwe: elenco sommario, approfondimenti progressivi, nessuna ripetizione dell'audit completo o delle prove su aree non interessate. Controlli tecnici necessari sulle modifiche; niente suite estese o visuali automatiche.
- Mantenere accessi e politiche dello storico come già richiesto; la loro presenza nell'inventario non autorizza nuove modifiche.

## Lista di riscontro

Revisione dei 16 punti completata nel codice il 01/10/2026, nei percorsi e requisiti documentati; collaudo finale distinto dallo sviluppo. ✅ Integrata indica collegamenti riscontrati; ✅ Funzionante richiede evidenze di comportamento per l’intera sezione. ◐ conserva prove parziali con residuo esplicito, non indica una riscrittura da fare. S = parte espressamente sospesa; D = collaudo finale sul dispositivo/servizio reale. Non restano verifiche tecniche V aperte nei percorsi esaminati. Nessuna nuova lacuna applicativa dimostrata resta senza correzione nel perimetro esaminato; ciò non certifica tutti i percorsi possibili ; pubblicazione ora autorizzata ed eseguita.

| # | Sezione | Funzioni comprese | Integrata | Funzionante | Evidenza disponibile | Residuo preciso |
|---|---|---|---|---|---|---|
| 1 | Configurazione nutrizionista | Quantità, frequenze, ricorrenze, allergeni, profili, limiti e valori iniziali | ◐ | ◐ | Resolver e salvataggio/riapertura: pwa-config-proteine-percorso, contesti-orari, commit; modelli-quote-vegetali. | S: dosi S/G sospese. Browser reale: salvataggio e riavvio orario pranzo 15:37 superati. D: altri parametri sul dispositivo. |
| 2 | Set utente | Scelte P/C, preferenze, esclusioni consentite, verdure ricorrenti, colazione | ✅ | ◐ | Lotto E; set-preferenze-runtime, carboidrati-priorita-pxcuser; ricorrente-ripiego; Set-uscita-validata e commit-errori-sincroni. | Browser reale: Annulla conserva bozza, Salva ed esci persiste preferenza al riavvio. D: scelte P/C e ricorrente. |
| 3 | Cataloghi | Ingredienti, ricette, classificazioni, dosi, immagini, disponibilità e aggiornamenti | ◐ | ◐ | Lotto F: referenze dei 39 modelli, categorie e unità; disponibilità/visuale per ID; nuovi ruoli preservano dati nativi; maschera-quote-sg verifica lettura/salvataggio dosi e dichiarazioni nei 39 modelli. | S: sole dosi S/G mancanti, aromi esclusi. D: aggiornamento cataloghi e immagini in PWA installata. |
| 4 | Compilazione a strati | Proteine → combinazioni P+C → completamento C → residuo V con S/G | ✅ | ✅ | Generazione reale di 14 pasti; C.user, FIXED/AUTO, minimi/blocchi e residuo; nuovo slot reale con ricorrente esaurita. | Nessun difetto residuo dimostrato nel motore per i cataloghi/configurazioni coperti. S/G senza dose respinte, non inventate. |
| 5 | Esclusioni e rotazione | Stati binari, stack, roll, unicità, consecutività, esaurimento e log | ✅ | ◐ | Contratti essenziali, cronologia legacy, pwa-integrazione-runtime; Roll anteprima/commit/conflitto e identità pasto combinato/separato nuovi. | D: proposte manuali combinato/separato, persistenza cicli e diagnostica al riavvio. Identità comune verificata con fixture e collegata a costruzione/commit. |
| 6 | Programmazione Menu | Generazione, settimane, blocchi, bozze, conferma e annullamento | ✅ | ◐ | Lucchetti, conteggi preservati e minimi/blocchi; commit comune con baseline; reset atomico sul piano reale anche con Menu aperto; errori sincroni abortiscono e render superato non ripristina bozze. | Browser reale: generazione, Salva, riavvio e cambio settimana superati. D: Annulla/blocchi e conflitto concorrente reale. |
| 7 | Pasto del giorno | Proposte, cambio piatto, Roll P/C/V, Alternativa, Salvafrigo e speciali | ✅ | ◐ | Anteprima/conferma obbligatoria; Roll reale senza scritture e commit unico; Salvafrigo e rigenerazione su pipeline comune. | Browser reale: Roll C anteprima/Annulla e Roll P anteprima/Imposta superati. D: Roll V, fascia oraria e Salvafrigo con scorte reali. |
| 8 | Colazione, frutta e spuntini | Composizione, dosi, libertà di scelta, frequenze e contatori | ✅ | ◐ | Contesti/pz-g, dosi e conteggi frutta/spuntini; editor atomico; premio standard/speciale non azzera alla scelta; schemi automatici P+C completi e conversione fette verificati. | D: scadenza/consumo premio e scelta frutta/spuntini. Conversione fette corretta e provata: peso documentato 8,8g, 4 pezzi=35,2g; nuovi nutrienti/scarico e override 3 pezzi=26,4g verificati, snapshot precedenti preservati. Resta collaudo UI. |
| 9 | Ricette e dettaglio | Consultazione, preferiti, ingredienti, quantità, procedimento, timer e assegnazione | ✅ | ◐ | Snapshot quantitativi, rendering V/S/G per ricetta, visuale per ID e timer; dettaglio delle realizzazioni materializzate; dettaglio-porzioni protegge consumati e oggetto su abort. | Browser reale: dettaglio snapshot, preferito e avvio timer superati. D: storico dopo cambio catalogo, porzioni e timer touch. Contenuto editoriale assente usa fallback già previsto. |
| 10 | Consumo e storico | Consumo automatico e manuale, correzioni, snapshot e conteggi | ✅ | ◐ | Consumo manuale atomico: quattro ingressi, doppio evento, correzione, mancanze, contatore e abort; consumo/pulizia raw e bozza attiva nel Menu verificati. | D: consumo automatico/manuale con bozza aperta su IndexedDB reale. Limite dati: scarico/lotti legacy non tracciati; scarico ignoto o scorta eliminata causa abort esplicito. |
| 11 | Nutrizione | Totali del giorno, frequenze settimanali, indicatori e grafici | ✅ | ◐ | Quantità/nutrienti negli snapshot, override e frutta deduplicata piano/storico; contesti-orari e spuntini-frutta-runtime; nutrizione-render-snapshot verifica i numeri nel DOM e conversione pz/g. | Browser reale: totali giorno 1044 kcal, 69g P, 167g C, 9g G riscontrati. D: barre/grafici e interazione dispositivo. Totali numerici giorno con snapshot e pz/g verificati nel DOM; frequenze e deduplicazione già provate nei percorsi documentati. |
| 12 | Inventario | Inserimento/modifica, giacenze, scadenze, congelamento e scarico | ✅ | ◐ | FEFO/pz-g, correzione quantitativa, acquisto atomico; editor ora rifiuta negativo/NaN/Infinity prima di scrivere. | Browser reale: 250g persistiti, negativo respinto, modifica 240g e congelamento superati. D: editor pz, apertura e scadenze; nessuna provenienza lotto inventata nelle correzioni legacy. |
| 13 | Spesa e barcode | Fabbisogni, sottrazione scorte, acquisti, scansione e associazione prodotti | ✅ | ◐ | Fabbisogno meno consumati/scorte, checksum e confezioni; acquisto manuale atomico/idempotente e rollback; icona Barcode diretta nella barra, helper comune e rollback verificati. | Browser reale: icona diretta, EAN manuale e prodotto 2×125g, inventario e spesa al netto scorte superati. D: fotocamera EAN e confezioni ml/pz. |
| 14 | Navigazione e interfaccia | Calendario, caroselli, comandi, finestre e stati visualizzati | ✅ | ◐ | Navigazione/bozza e rendering per ricetta conservati; reset-bozze atomico anche con Menu aperto. Prove browser storiche riusate entro il loro perimetro. | Browser reale: calendario e navigazione superati. D: Android touch/tastiera/visualViewport e caroselli; nessun test visuale automatico eseguito. |
| 15 | Account e dati | Accesso locale/Google, sincronizzazione, backup, ripristino e reset | ✅ | ◐ | Accessi/politiche correnti conservati; contratto Google/UID esistente; backup tutti gli archivi e import merge atomico/abort; reset piano reale atomico con Menu aperto. | Browser reale: esportazione JSON di tutti i 10 archivi riscontrata; import interrotto, esito non certificato. D: riapertura dopo import e Google/UID. Sync/migrazione sospese secondo specifica §14, senza riaprire lo sviluppo. |
| 16 | PWA e manutenzione | Avvio, installazione, offline, cache, aggiornamenti e diagnostica | ✅ | ◐ | Shell v4 distinta: risorsa mancante conserva versione precedente, attivazione/query offline simulate; metadati QA e riepiloghi aggiornati. | Browser reale: deploy Pages e passaggio cache v3→v4 superati. D: installazione/offline, scelta locale senza rete e diagnostica. Pubblicazione autorizzata. |

## Ultimo aggiornamento

01/10/2026 — Push autorizzato eseguito, deploy Pages riuscito e nuovi riscontri browser reale incorporati nei residui. Correzione colazioni automatiche incomplete provata; nessuna promozione dell’intera sezione sulla sola prova parziale. Registro «Push autorizzato e collaudo browser reale».

01/10/2026: tutti i 16 punti esaminati e sviluppo chiuso nel perimetro documentato. Ulteriori difetti di commit, uscita Set, concorrenza bozza, porzioni storico e grammi nei nutrienti corretti e verificati. Prove pregresse conservate. Registro «Chiusura dei percorsi tecnici dei 16 punti» per le sole novità. Stati Funzionante restano distinti dal collaudo dispositivo; S/G sospese. La matrice sopra è lo stato corrente; le note datate successive descrivono lo stato al momento del singolo intervento.


## 26/09/2026 — Frequenze proteiche e tetti sottotipi

Completato il percorso esistente dei valori espliciti P/sottotipi: UI salvataggio e riapertura → resolver → lettura del motore → filtro al tetto. Eliminati i clamp PDF soltanto per queste frequenze; massimo null = nessun tetto, zero = esclusione, assenza = default. Valori invalidi rendono la configurazione non valida senza correggere silenziosamente min/max. Set utente legge i tetti risolti e resta subordinato. Preservati algoritmo a strati, cataloghi e rotazioni.

| Funzione approfondita | Integrata | Funzionante | Evidenza/limite |
|---|---|---|---|
| Precedenza delle frequenze P e dei tetti sottotipi dal nutrizionista fino al filtro | ✅ | ✅ nelle prove mirate | Funzioni UI reali, resolver e filtro motore; DOM/archivio simulati. Salvataggio e riapertura sul dispositivo non certificati. |
| Rispetto dei tetti P nel Set utente | ✅ | ✅ nelle prove mirate | Quattro scelte ammesse con massimo cinque; sei respinte. |

La sezione 1 resta parziale: altri clamp (frutta, verdure, olio, speciali/spuntini e carboidrati), configurabilità completa di dosi/intervalli e persistenza browser restano aperti. Le altre 15 sezioni non sono state riesaminate o ricertificate.

Verifiche: nutrition-config.test.js e pwa-config-proteine-percorso.test.js superati; sintassi JS/4 script inline, integrità HTML e diff controllati. Nessuna suite estesa, test visuale o modifica al motore a strati. Nessun commit/push/release.


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

Ripresa sintetica del 27/09/2026: vedi RIPRESA_BREVE.md. Solo modifica documentale; stati applicativi invariati (1/8 ◐/◐; 2–7/9–16 🔎/🔎).


## 30/09/2026 — Punto 1: contratti legacy e verifiche dei preservati

Allineati ID legacy singoli/multipli alla cronologia e ai controlli del commit; verificati gli ingressi della rigenerazione parziale con blocchi/speciali e il confine domenica-lunedì. Evidenze e limiti nel registro, voce omonima. Sezioni 1 e 8 restano ◐/◐; altre 14 🔎/🔎. Provata anche la rigenerazione parziale con minimo ingrediente e blocchi, inclusa una variante con consumo utente-speciale, su solver/cataloghi reali e archivio in memoria. Restano collaudo PWA/IndexedDB reale e dati S/G; nessuna spunta verde complessiva.


## 30/09/2026 — Modelli dichiarativi e quote S/G

Applicata la proposta autorizzata: dichiarazioni nel modello sorgente, resolver/Set nutrizionista e propagazione all’esploso con S/G numerici. Prove mirate e limiti nel registro, voce omonima. Restano parametri nutrizionista non impostati e collaudo PWA/IndexedDB reale. Sezioni 1 e 8 ◐/◐; altre 14 🔎/🔎, nessuna certificazione complessiva.


30/09/2026 — Quantità iniziali S/G 80 g: verifiche mirate nel test `pwa-modelli-quote-vegetali`; dosi specifiche e Set prevalgono, massimi configurabili senza tetto iniziale. Dettagli: registro «Valore iniziale S/G concluso». Macroaree restano parziali; IndexedDB reale e dosi aromi non dichiarate restano aperti.


30/09/2026 — Rettifica: rimosso default universale S/G 80 g; conservate dosi native e verifiche struttura/resolver. Dati mancanti circoscritti da definire con Cwe; riferimento registro «Rettifica default S/G e lacune contestualizzate». Stati complessivi invariati.


30/09/2026 — Aromi esclusi su istruzione Cwe: non sono più un residuo di questo intervento. Restano dati S/G; stati complessivi invariati. Riferimento registro «Aromi esclusi dal perimetro».


30/09/2026 — Dosi S/G sospese su istruzione Cwe. Verificata conferma proposta obbligatoria nel percorso runtime; acquisto manuale ora atomico e idempotente con prove di abort/doppio evento in simulazione. Riferimento registro «Prosecuzione: conferma proposte e acquisto manuale». Restano dispositivo e consumo manuale/editor; macrosezioni invariate.


30/09/2026 — Consumo manuale/editor: quattro ingressi ora atomici, snapshot aggiornati, rettifica quantitativa scorte e contatore, doppio evento/abort verificati in simulazione. Riferimento registro «Consumo manuale/editor atomico». Resta dispositivo; scorta eliminata non ricreata e lotti legacy non certificati. Macroaree invariate, S/G sospese.
