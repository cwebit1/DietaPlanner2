# Prompt vincolante — completamento integrato DietaPlanner2

Aggiornato il 24/09/2026. Sostituisce il precedente prompt coordinatore. Conserva i requisiti approvati dei 30 punti, con prevalenza delle successive decisioni di Cwe.

## Lista operativa prevalente

La lista punto per punto in `ESITO_INTERVENTI_PWA.md` distingue cosa è provato, cosa esiste da verificare, cosa è difettoso e cosa manca. È il perimetro operativo di questo prompt. I requisiti generali sotto sono condizioni di accettazione da preservare, non ordini di ricostruzione delle funzionalità.

Implementare gli interventi residui accertati: precedenza del resolver e dosi locali; integrazione editor consumo; atomicità acquisto manuale; correzione della prova condizionale delle alternative. Per configurazione completa, snapshot e ricorrente, tracciare le lacune indicate e modificare solo i collegamenti effettivamente mancanti o difettosi. Integrare dosi Qwen alla disponibilità dei dati.

Le voci “presente da verificare” richiedono verifica, non sviluppo preventivo. Le parti provate si conservano; si ricontrollano soltanto se una modifica ne coinvolge concretamente il comportamento. Accessi e politiche storico restano invariati.

## Obiettivo

Completa gli interventi residui nella root di DietaPlanner2, partendo dal codice reale e dalle modifiche locali. Il risultato richiesto è il funzionamento congiunto dei criteri lungo l'intero flusso:

**Set nutrizionista → configurazione → catalogo e selezione → composizione → validazione → conferma → consumo → inventario, spesa e storico.**

## 1. Piano unico delle dipendenze

Leggi AGENTS.md, sezioni pertinenti delle specifiche, PDF originale e baseline aggiornata, architettura, prompt dei 30 punti e registro. Confrontali con il codice attuale; i vecchi report non provano il funzionamento. Cataloghi attivi: db-ricette.json e ingredienti-new.json.

Prima delle modifiche prepara una tabella compatta dei 30 criteri: requisito vigente, funzioni e percorsi attivi, prova disponibile e suoi limiti, stato e lavoro residuo. Distingui: conforme e verificato; implementato da verificare; difetto accertato; mancante; invariato per decisione dell'utente. Conserva la numerazione senza ripristinare requisiti eliminati.

Organizza gli interventi per dipendenze condivise. Per ciascun gruppo indica dati letti/scritti, chiamanti, criteri coinvolti e risultato osservabile. Fissa i contratti comuni di configurazione, identità, realizzazione e persistenza riutilizzando quelli presenti. Collega tutti i percorsi dipendenti: generazione, inserimento manuale, Roll, Alternativa, Salvafrigo e consumo, rispettandone le differenti finalità.

Conserva le funzioni conformi. Verifica quelle prive di prova prima di riscriverle. Ogni ulteriore modifica a una parte già sistemata deve avere una causa concreta e una valutazione degli effetti sugli altri criteri. Procedi per gruppi integrati senza ripetere l'intera analisi a ogni passaggio.

## 2. Riscontri attuali da cui partire

| Percorso | Riscontro e lavoro residuo |
|---|---|
| nutrition-config.js: resolveProteinFrequencies, resolveSubtypeCaps, resolveFruit | Impongono ancora limiti PDF ai valori del nutrizionista. Adeguare insieme UI, persistenza, resolver e utilizzatori. |
| index.html: sincronizzaRicetteSpuntinoBase | Dosi locali, incluse patatine 25 g e frutta secca 15 g. Collegare configurazione e valori iniziali documentati nel PDF, preservando libertà degli spuntini. |
| motor-v12.js: scegliDedicataConRicorrente, chiudiPastoConVerdura | La scelta ammette ripiego, la chiusura respinge un pasto privo della ricorrente richiesta. Ricostruire assegnazione/esaurimento del vincolo anche nel Roll e correggere il percorso completo. |
| index.html: apriModalEditorPasto, apriModalEditorColazione | Scritture separate di piano e storico. Integrare consumo reale, snapshot, contatori e scorte nella transazione comune. |
| index.html: generaColazioniSettimanaCorrente | Il chiamante salva componenti senza snapshot esplicito. Verificare la materializzazione nel percorso di scrittura e completarla dove manca. |
| tests/pwa-integrazione-runtime.test.js | La conferma è controllata soltanto dentro if(proposal). Predisporre un caso con alternativa disponibile e asserirne esistenza, validità e conferma. |

Questi riscontri non certificano gli altri percorsi. Contratti comuni, validatore, transazioni, conteggi frutta/spuntini, barcode e cache hanno già implementazioni: colmare solo difetti o lacune dimostrati. Persistenza simulata non certifica IndexedDB del browser.

## 3. Criteri di accettazione da preservare insieme — non elenco di funzioni da riscrivere

- **Configurazione:** tutte le quantità, ricorrenze e frequenze sono definibili in Set nutrizionista, inclusi dosi per ingrediente/ricetta/contesto, S/G, olio, frutta, verdure, colazioni, spuntini, speciali e intervalli. PDF, decisioni approvate e Qwen forniscono valori iniziali; le impostazioni esplicite del nutrizionista prevalgono. nutrition-config.js resta l'unico resolver; Set utente resta subordinato. Distinguere assente, zero e assenza di massimo; segnalare incoerenze senza correzioni nascoste.
- **Rotazione:** riguarda P e C secondo stack. Stack e roll mantengono la propria funzione: 1 disponibile, 0 non disponibile; 0→1 dopo 15 giorni iniziali, con intervallo configurabile, oppure all'esaurimento delle alternative compatibili. Registrare riaperture anticipate, ruolo, carenze e cause utili a completare il ricettario quindicinale. Esaurire C non riapre P. Restano unicità settimanale dei piatti principali, esclusioni cliniche e divieto della stessa fonte proteica per due giorni consecutivi.
- **Composizione:** leggere la classe P, filtrare i PX validi, cercare fra questi PX+C.user; se assenti scegliere PX, poi C o C+V secondo Set e disponibilità. Completare V. S/G intervengono sulle quantità e sul residuo, senza guidare la scelta P/C. Aggiornare conteggi e stato temporaneo dopo ogni scelta accettata; ripristinarli per tentativi scartati.
- **Verdure:** ricorrente, poi deperibili, poi altre secondo disponibilità e logica spesa. Interrogare la dispensa anche in programmazione. Esaurita la ricorrente, proseguire con le altre; a dispensa vuota gestire la spesa. Il ripiego conserva gli altri vincoli.
- **Identità e allergeni:** ogni ingrediente e ricetta porta gli allergeni; ogni proposta applica le esclusioni impostate. Titoli o rappresentazioni combinata/separata non aggirano identità e vincoli.
- **Pasti secondari:** frutta e spuntini liberi, dosati e soggetti alle frequenze configurate. Spuntini facoltativi; frutta nei contesti previsti dal PDF. Conservare conteggi unici, colazioni a gruppi, speciali e contatore approvato. Le realizzazioni alimentano coerentemente quantità, unità, nutrizione, spesa e consumo.
- **Persistenza:** anteprima, conferma, annullamento e consumo hanno effetti distinti. Le proposte lasciano inalterati piano confermato e scorte; il ciclo di estrazione roll resta distinto dallo stack d'uso. Conferma, consumo e acquisto aggiornano atomicamente i dati pertinenti, gestendo doppio evento e conflitti. Registrare il consumo reale senza etichette di violazione, sgarro o compensazioni. Le correzioni mantengono coerenti storico, scorte e conteggi. Gli snapshot consumati restano stabili al cambiare della configurazione.

## 4. Dipendenze e perimetro

Per le dosi S/G mancanti prepara ID e componenti da sottoporre a Qwen, specificando dose per porzione, unità e contesto richiesti. Integra i risultati quando disponibili, verificando corrispondenza e propagazione a residuo V, nutrizione, spesa e consumo. Nessuna dose inventata; prosegui sulle parti indipendenti. Non dichiarare invii o risultati Qwen non avvenuti.

Mantieni accessi e politiche dello storico come richiesto. Conserva UI e funzioni conformi; collega i percorsi corretti a Menu, Pasto e dettaglio. Verifica cache e riapertura quando interessate dalle modifiche ai dati. Nessuna seconda applicazione, fallback a ricette.json, commit, push o pubblicazione implicita.

## 5. Verifica e conclusione

Per ogni gruppo modificato esegui sintassi, integrità, coerenza, verifica del flusso, controlli funzionali mirati e revisione del diff. Scegli prove che attraversino i criteri collegati: un parametro nutrizionista modificato deve arrivare coerentemente alla proposta, alla conferma e ai calcoli successivi, rispettando insieme allergeni, rotazione e quantità.

Le prove devono fallire se manca il comportamento richiesto: nessuna conferma saltata perché la proposta è nulla, nessun PASS basato solo su regex, nessuna attestazione browser da simulazioni. Riusa i controlli validi. Test visuali, screenshot, suite complete e regressioni estese solo su richiesta o per anomalie concrete che li rendano necessari.

Chiudi ciascun gruppo quando funzionano insieme i percorsi e i criteri coinvolti. Riporta separatamente limiti di dati, hardware e servizi. Aggiorna stato lotti, matrice, esito e registro, preservando la cronologia in sola aggiunta. Spunta solo ciò che ha prova sufficiente. Consegna in chat cosa funziona e cosa resta aperto con causa concreta. Prosegui sul lavoro eseguibile senza riaprire decisioni già prese; chiedi soltanto dati indispensabili. Nessuna promessa di assenza assoluta di errori sostituisce queste condizioni di accettazione.
