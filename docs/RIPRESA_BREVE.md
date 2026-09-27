# DietaPlanner2 — ripresa a consumo contenuto

## Incarico e stato
Continuare il progetto esistente, preservando il lavoro conforme. Repo attiva DietaPlanner2, file applicativi nella root. Checkpoint del lavoro preparato per commit e push su origin/main su richiesta esplicita di Cwe (27/09/2026). Verificare hash e stato remoto con Git. Non fare reset/checkout distruttivi. Questo documento non contiene il codice: usare la repository aggiornata.

Fonte stato: docs/STATO_LOTTI_E_TEST.md, ultime voci del 27/09/2026. Checklist: docs/RISCONTRO_FUNZIONI_PWA.md, tabella iniziale. Le 16 sezioni sono macroaree, non 16 interventi equivalenti: 1 e 8 parziali, altre 14 da verificare, NON dichiarate mancanti o guaste.

## Già implementato nel punto 1 — non riscrivere
Resolver canonico nutrition-config.js; parametri nutrizionista per frequenze P/sottotipi, frutta/V, olio, carboidrati, dosi ingredienti/contesti/ricette, intervalli stack/roll, orari e classi carboidrati. Salvataggio configurazione atomico. Nuove proposte materializzate con dosi correnti; snapshot preservati. Contesti colazione/spuntini, conversioni unità, conteggi condivisi e minimi collegati. Questi interventi hanno prove mirate, NON certificazione completa browser.
Ultimo intervento: conteggi ordinari comuni per generazione e validatore, deduplica piano/consumo, priorità snapshot, lettura ID legacy, esclusione speciali/vuoti, errore sui riferimenti non leggibili.

## Prossimo lavoro circoscritto
Chiudere i casi ancora aperti del punto 1 usando il codice già implementato, senza rifare il resto. Metadati @qa-metadata / P1-conteggi-preservati in motor-v12.js indicano percorsi e casi rinviati: rigenerazione parziale con blocchi/speciali, confine domenica-lunedì, commit legacy misti. Separare difetto dimostrato, verifica rinviata e dato mancante. Browser/IndexedDB reale bloccato per assenza eseguibile: non ritentare installazioni o prove senza un cambiamento concreto. Dosi S/G mancanti demandate a Qwen; non inventarle.

## Prove già disponibili
Ultima modifica: node --check su motor-v12.js e tests/pwa-conteggi-preservati.test.js; prova conteggi-preservati; pwa-integrazione-runtime (14 pasti, unicità, fonte P, anteprima/commit) superati. Persistenza simulata. Diff controllato. Non rieseguire automaticamente all'apertura della sessione.
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
