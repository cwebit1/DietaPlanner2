# DietaPlanner2 — ripresa a consumo contenuto

## Incarico e stato
Continuare il progetto esistente, preservando il lavoro conforme. Repo attiva DietaPlanner2, file applicativi nella root. Base verificata: main al commit b0babd441f9eb243ea1e5ec9671805f8abae1b79. Push e pubblicazione autorizzati il 01/10/2026 ed eseguiti: remoto 033f1b29b3dbb9cae7161028e96788a1598cb16d, checkpoint locale 3044833071725e2bcb9e1bb6733434b26a3caf77, alberi identici. Non fare reset/checkout distruttivi. Questo documento non contiene il codice: usare la repository aggiornata.

Fonte stato: docs/STATO_LOTTI_E_TEST.md, ultima voce del 01/10/2026. Checklist: docs/RISCONTRO_FUNZIONI_PWA.md, tabella iniziale. I 16 punti sono ora tutti valutati: stato corrente nella tabella con evidenze e residui S/V/D del riscontro. Non ripristinare gli stati 🔎 iniziali sulla base delle note storiche.

## Già implementato nel punto 1 — non riscrivere
Resolver canonico nutrition-config.js; parametri nutrizionista per frequenze P/sottotipi, frutta/V, olio, carboidrati, dosi ingredienti/contesti/ricette, intervalli stack/roll, orari e classi carboidrati. Salvataggio configurazione atomico. Nuove proposte materializzate con dosi correnti; snapshot preservati. Contesti colazione/spuntini, conversioni unità, conteggi condivisi e minimi collegati. Questi interventi hanno prove mirate, NON certificazione completa browser.
Ultimo intervento autorizzato: dichiarazioni ruolo/fonte/limite/copertura nei 39 modelli di db-ricette.json v75; resolver e Set per quantità/massimi S/G distinti, esploso e snapshot con S/G numerici. Cache derivata aggiornata al cambio configurazione senza scrivere piano/consumi. Precedenti correzioni legacy conservate. Dettagli nel registro, voce “Modelli dichiarativi e quote S/G”.

## Sviluppo concluso e collaudo finale circoscritto
Revisione e correzioni dei 16 punti completate nei percorsi documentati. Ultime prove: abort su errore sincrono Menu/Set, uscita Set con validazione comune, consumo/pulizia raw senza sospendere la bozza, render superato senza resurrezione, porzioni storico protette e totali DOM/pz-g; reset piano atomico anche con Menu aperto (abort conserva bozze). Nuove evidenze nel registro «Chiusura dei percorsi tecnici dei 16 punti». Nessun residuo tecnico V individuato resta aperto; non riaprire valutazioni generali. Corretti ricorrente esaurita/ripiego nella chiusura, Roll che scriveva prima della conferma, backup incompleto/non atomico, reset anticipato premio colazione, quantità inventario invalide e bozza Menu sopravvissuta al reset. Shell v4 pubblicata e attivata nel browser reale; aggiornamento v5 per la correzione colazioni. Registro «Revisione tecnica dei 16 punti» contiene resoconto unico.
Dosi S/G sospese e aromi esclusi: non riaprire né chiedere valori. Identità pasto combinato/separato verificata e collegata a costruzione/commit; il riscontro UI delle proposte manuali resta nel collaudo dispositivo. Il prossimo lavoro è il collaudo finale dell’utente: residui D elencati precisamente nella tabella RISCONTRO_FUNZIONI_PWA: IndexedDB e UI/dispositivo, fotocamera, account/sync reale e installazione/offline. Browser cloud ora disponibile: verificati configurazione persistente, Set Salva/Annulla e riavvio, Menu generazione/salvataggio/riapertura, spesa, barcode manuale e inventario, calendario, dettaglio/preferito/timer e totali del giorno. Non ritentare installazioni locali. Lotti legacy non tracciati non ricostruibili; scorta eliminata causa abort senza invenzioni. Pubblicazione autorizzata; certificazione completa ancora subordinata ai residui D/S.

## Accesso rapido barcode
Icona Barcode nella barra inferiore: apre direttamente il lettore comune della Spesa senza cambiare vista o bozze. Acquisto prodotti/inventario atomico; riepilogo aggiornato solo se Spesa attiva, mantenendo settimana corrente. Prova pwa-barcode-barra superata; fotocamera/touch restano dispositivo. Registro «Barcode diretto nella barra inferiore».

## Maschera inserimento ricette
maschera-ricette.html espone ruolo vegetale V/S/G, fonte quantità, dose ingrediente e dosi delle composizioni fisse. Massimi collegati al Set nutrizionista, nessuna dose nuova assegnata. Salvataggio conserva metadati, dosi, composizioni e copertura congiunta; prova maschera-quote-sg superata sui modelli correnti. Modifiche incluse nel push autorizzato. Registro «Maschera: campi quantità sughi e guarnizioni».

## Prove già disponibili
Modelli S/G: pwa-modelli-quote-vegetali e percorso UI nutrizionista superati; generazione runtime di 14 pasti superata su cataloghi reali/archivio in memoria. Sintassi moduli/script inline, integrità JSON e invariabilità dei dati preesistenti verificate. Prove precedenti: pwa-config-preservati-percorso, conteggi-preservati e contratti-essenziali superati. Il test percorso verifica ingressi e commit con solver sostituito. pwa-config-minimi-blocchi-runtime verifica il solver reale, un minimo ingrediente e i blocchi, anche con un consumo speciale; pwa-integrazione-runtime ricontrollato dopo la correzione dei contratti (14 pasti, unicità, fonte P, anteprima/commit). Tutti su archivio in memoria. Persistenza simulata. Diff controllato. Non rieseguire automaticamente all'apertura della sessione.
Prove precedenti e relativi limiti: cercare nel registro solo la voce “Punto 1: integrazione dosi, contesti, classi, orari e conteggi condivisi”, non leggere tutto il registro.

## Regole da conservare
- P → PX+C.user se disponibile → altrimenti PX e poi C/C+V → V residua, includendo S/G. Nessun ottimizzatore globale.
- Rotazione P e C; stack/roll binari: 1 disponibile, 0 indisponibile; riapertura dopo intervallo configurato (default 15 gg) o esaurimento compatibile, con log. Unicità settimanale e consecutività fonte P restano distinte.
- Quantità/frequenze/ricorrenze configurabili dal nutrizionista; PDF come default, Set utente può restringere; esclusioni cliniche vincolanti.
- Frutta/spuntini liberi e dosati. Verdure ricorrenti → deperibili → altre; dispensa vuota non impedisce la pianificazione.
- Cataloghi correnti db-ricette.json e ingredienti-new.json; mai il vecchio ricette.json.

## Metodo vincolante per ridurre sprechi
1. Leggere AGENTS.md e questa scheda, poi soltanto le sezioni normative pertinenti. Cercare simboli con rg e leggere intervalli circoscritti; non caricare interi index.html, motore o registro.
2. Prima di editare individuare chiamanti, dipendenze e risultato atteso. Non ripetere audit generale né riscrivere parti funzionanti.
3. Eseguire sintassi/integrità/diff e la prova minima delle funzioni modificate. Riutilizzare le evidenze valide. Niente suite complete, test visuali o regressioni estese automatiche.
4. Completare un intervento coerente e autonomamente autorizzato senza fermarsi a ogni micro-modifica. Non allargare l'obiettivo a nuove funzioni.
5. Aggiornare questa scheda sostituendo lo stato corrente, senza accodare cronologia. Nel registro aggiungere una voce breve; negli altri documenti stato e riferimento, non duplicare il resoconto.
6. Risposta breve: cosa chiuso, prova/limite, cosa resta. Ripresentare il riscontro per gruppi di stati invariati; tabella completa quando cambia o viene richiesta.
7. Non promettere percentuali di risparmio o completamento: non è disponibile una misura affidabile del costo settimanale per intervento.

## Prompt per nuova chat nello stesso workspace
Leggi AGENTS.md e docs/RIPRESA_BREVE.md. Continua dal prossimo lavoro indicato usando il codice locale esistente. Non rifare audit o interventi già conclusi. Leggi solo file/sezioni pertinenti, esegui soltanto i controlli minimi, aggiorna la scheda e riferisci brevemente esito e residui. Prima di modificare assicurati che siano presenti le modifiche locali descritte; se manca il workspace, segnalalo senza ricostruire o riscrivere l'app.

## Verifica reale in corso
Colazioni automatiche incomplete escluse secondo specifica §12 e baseline §2.6: richiesti P+C, senza aggiunte o dosi inventate; Set esplicito conservato. Prova pwa-colazione-automatica-completa superata. Le 16 spunte complete non sono ancora ottenute: fotocamera, Android, Google/UID e PWA installata/offline restano verifiche concrete; cloud/migrazione e dosi S/G non vengono riaperti. Resoconto unico nel registro «Push autorizzato e collaudo browser reale».

Ultimi riscontri: Roll C anteprima/Annulla e Roll P anteprima/Imposta superati; backup esportato con tutti i 10 archivi, import interrotto senza attestazione di esito. 02/10: corretto il dato Fette biscottate con riferimento Mulino Bianco Dorate 8,8g/fetta approvato da Cwe. Catalogo ingredienti v23: porzione nativa 4 pezzi, peso 35,2g, fonte salvata. Conversione, nutrienti, scarico e override provati; snapshot precedenti preservati. Shell v6; proseguire i residui UI della matrice, senza rifare i test validi.

Stato corrente: 7 sezioni verdi (2,4,6,7,9,11,12). Shell v8 pubblicata/attivata: riepilogo Uova 2pz, barra Uova 1 dopo consumo, porzioni piatto unico 2→4pz con nutrienti/persona invariati, speciali aggiornati senza navigazione. Registro «Chiusura riscontri browser e residui». Restano i soli casi precisati nella matrice (5/8/10 e dispositivo/Google/import/PWA), più S/G sospese nei punti 1/3; non ricominciare prove valide, né import/browser install già bloccati.

Google/login: Cwe conferma funzionante il 02/10, residuo chiuso su sua evidenza; non ritentare né chiedere autenticazione. Punto 15 resta aperto soltanto per ripristino/import.

## 02/10 — Ricerca barcode online
Codice sconosciuto: API v3 Open Food Facts precompila nome/marca e quantità dichiarata, poi richiede ingrediente e conferma acquisto. Associazioni locali prima della rete; cache di sessione, timeout e inserimento manuale. Test mirati superati; shell v9 pubblicata e attivata dopo chiusura della vecchia pagina. API/CORS reale verificati: EAN 3017620422003 → Nutella, marca, 400g, ingrediente vuoto. Punto 13 resta parziale per fotocamera e ml/pz sul dispositivo. Registro «Barcode: ricerca Open Food Facts».
