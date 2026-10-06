# Prompt vincolanti per l'integrazione dei 30 criteri PWA

> **Coordinamento esecutivo:** usare `PROMPT_CHIUSURA_PROGETTO_PWA.md`.
> Questo documento resta dettaglio delle regole; le decisioni più recenti
> e il perimetro conservativo di accessi/storico prevalgono.

## Regola prevalente — Set nutrizionista interamente configurabile (23/09/2026)

Decisione esplicita di Cwe: **tutte le quantità, ricorrenze e frequenze devono
essere definibili dalla pagina Set nutrizionista**.

- Il PDF fornisce valori iniziali e riferimenti. Il nutrizionista può impostare
  valori diversi; il resolver non li riporta automaticamente ai limiti PDF.
- Il perimetro comprende dosi e porzioni per ingrediente/ricetta/ruolo e
  contesto, S/G e condimenti, olio e sua ripartizione, frutta, verdura,
  colazione, spuntini, speciali, frequenze e minimi/massimi giornalieri e
  settimanali, ricorrenze e relativi intervalli. Ogni parametro quantitativo
  o temporale utilizzato dalle regole deve avere configurazione effettiva.
- Per parametri temporali già definiti dalle regole applicative, conservare
  il valore approvato come iniziale; l'intervallo configurato alimenta la
  stessa regola, senza alterarne arbitrariamente ambito e semantica binaria.
- I valori elaborati da Qwen completano le dosi iniziali del catalogo e
  restano personalizzabili dal nutrizionista tramite override, senza
  modificare i template globali né gli snapshot già consumati.
- `nutrition-config.js` è l'unico resolver. Tutti i percorsi del PWA applicano
  la configurazione risolta: selezione, sostituzione, calcoli, UI, inventario,
  spesa e consumo. Nessun numero operativo nascosto prevale sulla scelta
  esplicita del nutrizionista.
- Il Set utente resta distinto: applica preferenze e restrizioni entro la
  configurazione del nutrizionista, senza modificarla o ampliarla.
- Validare tipo, unità, segno e coerenza min/max; distinguere valore omesso,
  zero e assenza di massimo. Una configurazione incompatibile con altri
  vincoli si spiega e si corregge esplicitamente, senza clamp silenziosi.
- Per ogni parametro documentare controllo UI, chiave persistita, resolver,
  chiamanti e prova del valore modificato sul percorso reale. Un campo
  visibile che il motore ignora non soddisfa il requisito.
- Verificare salvataggio, riapertura, invalidazione cache e propagazione
  coerente alle nuove realizzazioni; conservare la configurazione precedente
  se il salvataggio fallisce. Non riscrivere il consumo storico.

Le precedenti formulazioni che rendono il PDF un tetto immutabile anche per
il nutrizionista sono superate da questa decisione. Restano le esclusioni
cliniche attive e i vincoli strutturali esplicitamente richiesti. Questa
registrazione aggiorna il contratto, non certifica il runtime attuale.


> Aggiornamento vincolante 23/09/2026: applicare prima le decisioni di Cwe
> registrate in `PROMPT_COMPLETAMENTO_PWA_E_CHIARIMENTI.md`. Frutta/spuntini
> liberi e dosati; ricorrente esaurita → altre verdure; dosi S/G da Qwen;
> consumo reale senza violazione; accessi e politiche storico mantenuti.
> Ogni formulazione precedente in conflitto è subordinata a queste decisioni.

## Contratto comune obbligatorio

Ogni prompt numerato applica integralmente questo contratto. Copiando un singolo
prompt, leggere comunque questo file prima di lavorare. I numeri identificano
requisiti, non moduli indipendenti e non l'ordine di esecuzione.

### Prima di scrivere codice

1. Leggere AGENTS.md, SPECIFICA_PWA_DEFINITIVA.md, la riga pertinente della
   matrice, le sezioni pertinenti di SPECIFICA_FUNZIONALE_CORRENTE.md,
   ARCHITETTURA_MOTOR_V12.md e il filone del REGISTRO_MODIFICHE.md.
   Per dati/regole nutrizionali leggere BASELINE_NUTRIZIONISTA_PDF_V1.md.
   Le istruzioni successive di Cwe prevalgono; lo stato dell'audit è una
   fotografia da ricontrollare, non prova del codice corrente.
2. Tracciare il percorso attivo da index.html fino a motore, resolver,
   materializzazione, IndexedDB e consumatori. Scrivere prima dell'intervento:
   ingresso, uscita attesa, proprietario dei dati, chiamanti, scritture,
   criteri collegati e invarianti da preservare.
3. Riutilizzare il punto comune corretto. Una dipendenza necessaria al criterio
   rientra nell'integrazione: includerla e motivarla. Una nuova regola funzionale
   non definita resta una decisione aperta, senza inventarne il comportamento.
   Un prerequisito mancante rende il punto parziale fino al suo completamento.
4. Conservare modifiche già presenti e funzionalità conformi. Operare nella root
   di DietaPlanner2; mantenere il motore unico e i nuovi cataloghi. Preparare
   migrazioni idempotenti per dati persistenti modificati, con recupero degli
   snapshot esistenti. Non usare ricette.json come fallback.
5. Questa revisione prepara gli interventi: eseguire un prompt richiede
   l'incarico relativo. Pubblicazione e rilascio restano soggetti
   all'autorizzazione già prevista dalla repo.

### Contratti condivisi dei dati

| Oggetto | Responsabilità e collegamenti |
|---|---|
| Configurazione risolta | nutrition-config.js risolve clinica/baseline, regole esplicite Cwe, nutrizionista, profilo, utente; tutti i percorsi usano lo stesso risultato. |
| Catalogo operativo | JSON per compilazione/versionamento; IndexedDB come sorgente operativa. Una cache in memoria deve provenire dalla lettura di IndexedDB ed essere invalidata coerentemente. |
| Identità | Un solo calcolo di dishKey per il piatto, sourceKey per la proteina, rotationKey per P/C; titoli, prefissi e rappresentazioni combinate/separate non aggirano i controlli. dishKey copre anche piatti V, senza introdurre stack su V. |
| Realizzazione | Snapshot unico di ingredienti effettivi, ruoli, quantità/unità, allergeni, nutrienti e identità; template immutabili. Tutti i consumatori leggono lo stesso snapshot. |
| Stato stack | Stato per persona, ricetta/fonte P/C e cronologia d'uso. La data riguarda il pasto pianificato/consumato, distinta dal timestamp tecnico di salvataggio. |
| Stato roll | Stato del ciclo delle alternative con identità, contesto/pool e data dell'estrazione. Distinto da stack e dai permessi UI. Recuperabile senza cancellare il ciclo a ogni render. |
| Contesto di lavoro | Configurazione, settimana, consumati, preservati, blocchi, inventario, chiavi già usate e stati temporanei: una sola vista coerente per operazione. |
| Commit e consumo | Conferma salva piano e tracking coerenti; consumo registra storico e scarico scorte una sola volta. Una proposta non consuma inventario. |
| Diagnostica | Carenze persistenti consultabili/esportabili, distinte da errori tecnici; conteggi dei pool e motivi di esclusione consentono di individuare coperture mancanti. |

### Flusso comune da preservare

- Caricare configurazione e contesto; filtrare clinica, disponibilità,
  compatibilità e vincoli settimanali.
- Determinare la macro P e il pool di tutte le P valide. Cercare prima in quel
  pool P+C.user combinato, poi P libera con C.user separato, infine C AUTO.
  Non scegliere definitivamente una P prima di aver cercato P+C.user nel pool.
- Risolvere S/G con dosi esplicite, V residua e olio. Materializzare e validare
  il pasto completo. S/G non diventano criteri che invertono la priorità P/C.
- Dopo l'accettazione in bozza aggiornare subito gli stati temporanei e i
  conteggi, così gli slot successivi vedono quanto già usato. Un tentativo
  fallito/backtracking ripristina soltanto il suo delta.
- Alla conferma rileggere lo stato corrente e validare la sostituzione nel
  contesto completo: togliere il contributo della voce sostituita, mantenere
  consumati e blocchi, controllare anche i giorni adiacenti fuori settimana.
- Persistire piano e tracking coerenti atomicamente; su errore mantenere il
  piano precedente. L'annullamento elimina i delta della bozza, non lo storico.
  L'estrazione roll consuma il ciclo delle proposte, non lo stack del piano.
- Al consumo applicare una sola volta storico/scorte/contatori; non contare
  due volte un uso già registrato in programmazione.
- Tutti i percorsi (Programmazione, rigenerazione, manuale, Roll, Alternativa,
  Salvafrigo) condividono filtri, materializzazione e validazione finale.

### Regole di rotazione e fattibilità

Stack P/C: 1 disponibile, 0 escluso; uso accettato 1→0; ritorno 0→1 dopo
15 giorni o a esaurimento delle scelte compatibili. Roll: 1 disponibile,
0 escluso; estrazione 1→0; ritorno 0→1 dopo 15 giorni o a esaurimento,
secondo la precisazione esplicita di Cwe. Ogni ripristino anticipato per
carenza quindicinale alimenta la diagnostica.

Definire il pool dopo i vincoli inderogabili e prima del filtro binario.
Un pool vuoto per allergie, cap, disponibilità, consecutività o unicità non è
un pool esaurito per stack/roll. Il ripristino rilassa soltanto lo stato
binario: conserva tutte le esclusioni e non ripropone un dishKey nella stessa
settimana. Se la copertura manca anche senza cooldown, riportare l'incompatibilità
effettiva senza salvare una settimana incompleta o promettere una soluzione
matematicamente impossibile. Verificare disponibilità della ricetta e delle
fonti P/C insieme; il filtro binario precede ogni ordinamento LRU/inventario.

### Ordine di integrazione e dipendenze

Il contratto dei dati va disegnato per tutti i 30 punti prima di iniziare.
Realizzare poi incrementi verificabili, senza eseguire automaticamente tutti
i prompt quando ne viene richiesto uno.

1. Fondazioni: 1, 3 e schema 2; identità condivise dei punti 6/9,
   struttura degli stati 7/8 e diagnostica 7.
2. Vincoli/materializzazione: 4, 5, 12, 15, 14, 16 e 13.
3. Selezione integrata: unicità 9, stack 7, rotazione 6 e sequenza 11;
   integrazione bozza/commit 10. Disegnare insieme, verificare ogni incremento.
4. Ciclo e sostituzioni: 8, 17, 18, 19; consumo 20 e scorte/spesa 26.
5. Altri pasti e viste: 21, 22, 23, 24, 25 sugli stessi contratti.
6. Estensioni: 27 dopo 26; 28 dopo stabilizzazione di schema e transazioni;
   29 coordinato con ogni aggiornamento di schema/cache.
7. Il punto 30 si applica a ogni fase; revisione finale dopo l'integrazione.

### Prove e chiusura

I file criteri-pwa-selettivi.test.js e revisione-finale-criteri-pwa.test.js
contengono molti controlli statici di nomi/stringhe. Il loro PASS è soltanto
un controllo strutturale: non certifica il funzionamento dei 30 requisiti.

Per ciascun punto, riusare o aggiungere la minima prova deterministica che
attraversa l'API realmente chiamata dal PWA e verifica risultato finale,
persistenza e un caso da rifiutare. Mock solo per confini esterni, non per
riscrivere selettore o validatore. Identificare quale difetto precedente
la prova intercetta. Un nome di funzione o un campo presente non basta.
Aggiornare il selettore interessato affinché richiami la prova funzionale,
senza rendere verde un test indebolendo il requisito o imponendo nomi arbitrari.

Eseguire sintassi, integrità/struttura dei file modificati, coerenza e flusso,
controlli delle funzioni e dipendenze realmente coinvolte, diff completo.
Evitare duplicazioni: un caso condiviso vale per più criteri. Ripetere una
prova solo dopo una correzione o per diagnosticare un'anomalia concreta.
Nessuna suite completa, verifica visuale o batteria preventiva automatica.

Chiudere con: criterio e dipendenze, file/funzioni cambiati, prova ed esito,
limiti residui. Distinguere PASS funzionale, FAIL, PARZIALE e NON VERIFICATO.
Una verifica hardware/cloud non eseguita resta dichiarata tale.
Aggiornare matrice e registro append-only con evidenze reali, senza marcare
un punto completo perché un controllo statico passa.

## Prompt 1 — Sorgenti dati e IndexedDB

```text
Verifica e completa il criterio 1: DietaPlanner2 usa db-ricette.json,
ingredienti-new.json e db-visuale.json come sorgenti di compilazione; collega
il visuale esclusivamente per ID e rende IndexedDB la sorgente operativa delle
ricette per UI e motore. Traccia inizializzazione, compilazione, sincronizzazione
e letture successive. Mantieni separati dati funzionali e visuali. Correggi
soltanto eventuali percorsi runtime che leggono una sorgente diversa o saltano
lo store canonico. Preserva schema ricette, generazione e service worker.

Controlli: node tests/criteri-pwa-selettivi.test.js 1; sintassi dei file
modificati; git diff --check. Riporta quali letture avvengono da JSON durante la
compilazione e quali da IndexedDB durante l'uso.

Integrazione obbligatoria — criteri collegati: 2, 4, 23, 25, 28, 29.
All'avvio distinguere compilazione, scrittura e rilettura IndexedDB; invalidare la cache se catalogo o disponibilità cambiano. disponibile:false esclude nuove scelte ma conserva snapshot e storico; contenuti visuali mancanti usano fallback.

Criterio di uscita funzionale:
Avvio a store vuoto e riapertura con versione invariata leggono ricette coerenti da IndexedDB; una ricetta disabilitata resta consultabile nello storico ma non selezionabile.
Applicare il contratto comune; il PASS del selettore da solo non chiude il punto.

```

## Prompt 2 — Struttura completa della ricetta

```text
Implementa il criterio 2 sulla ricetta concreta compilata. Ogni realizzazione
deve portare ID, modello, componenti C/P/V/S/G, ingredienti, quantità,
compatibilità, disponibilità, allergeni aggregati, stack, roll e nutrienti.
Definisci un solo punto di materializzazione e conserva i template immutabili.
Aggiorna persistenza e lettori soltanto per i campi necessari, mantenendo
compatibilità con gli snapshot già salvati. Coordina questo punto con il
criterio 4 senza implementare qui la logica delle esclusioni.

Controlli: node tests/criteri-pwa-selettivi.test.js 2; compilazione di una
ricetta campione; verifica struttura IndexedDB; sintassi; git diff --check.

Integrazione obbligatoria — criteri collegati: 1, 4, 6, 7, 8, 9, 14, 15, 16, 25, 26.
Separare template, ricetta compilata, snapshot e stato personale mutabile. Centralizzare identità e schema degli stati prima di implementarli; foto/testi restano nel visuale. Migrare snapshot senza ricostruire falsi usi storici.

Criterio di uscita funzionale:
Materializzare una combinata e componenti separati: campi completi, quantità/unità coerenti, allergeni effettivi; ricaricare lo snapshot e verificare che template e storico restino invariati.
Applicare il contratto comune; il PASS del selettore da solo non chiude il punto.

```

## Prompt 3 — Resolver nutrizionale unico

```text
Verifica il criterio 3 e correggi esclusivamente eventuali bypass del resolver
canonico. Tutte le quantità e decisioni nutrizionali devono derivare da
nutrition-config.js secondo clinica/baseline, regole esplicite Cwe, nutrizionista,
profilo e utente; la realizzazione è l'uscita quantitativa. Individua letture dirette delle impostazioni che duplicano la
precedenza e instradale nel resolver. Mantieni separati i contesti colazione,
pasto principale e spuntino.

Controlli: node tests/criteri-pwa-selettivi.test.js 3; node
tests/nutrition-config.test.js; sintassi; ricerca dei bypass; git diff --check.

Integrazione obbligatoria — criteri collegati: 4, 5, 11, 12, 14, 16, 21, 22.
Una precedenza per UI e motore. Un utente può restringere, non allargare un limite clinico. Trattare il conflitto Patate escluse come V/C FIXED in base al ruolo approvato, preservando le esclusioni cliniche globali.

Criterio di uscita funzionale:
Una configurazione con valori discordanti risolve sempre allo stesso modo in Set, generazione e sostituzione; un override utente oltre cap viene respinto.
Applicare il contratto comune; il PASS del selettore da solo non chiude il punto.

```

## Prompt 4 — Allergeni e intolleranze

```text
Implementa il criterio 4. Ogni ingrediente conserva l'elenco completo degli
allergeni; ogni ricetta concreta salva allergeniPresenti come unione
deterministica degli ingredienti effettivi. Il Setting nutrizionista alimenta
un filtro hard applicato prima della selezione in Programmazione, Alternativa,
Roll, Salvafrigo, inserimento manuale e sostituzione. La realizzazione e il
dettaglio devono usare gli allergeni effettivi. Mantieni invariati profilo,
frequenze e quantità.

Controlli: node tests/criteri-pwa-selettivi.test.js 4; fixture con un allergene
attivo e una ricetta compatibile; sintassi; integrità catalogo; git diff
--check.

Integrazione obbligatoria — criteri collegati: 1, 2, 3, 15, 17, 18, 19, 25.
Aggregare ingredienti realmente scelti, inclusi S/G, olio e condimenti. Separare allergie da intolleranze con mappatura esplicita; metadati mancanti non equivalgono ad assenza certificata. La classificazione di un template non deve escludere una combinazione sicura per un ingrediente opzionale non scelto.

Criterio di uscita funzionale:
Usare una fixture parametrizzata sui sei percorsi: allergene nel condimento escluso, alternativa compatibile ammessa; dopo sostituzione allergeni e dettaglio corrispondono allo snapshot.
Applicare il contratto comune; il PASS del selettore da solo non chiude il punto.

```

## Prompt 5 — Frequenze proteiche

```text
Verifica il criterio 5. Il resolver e il generatore devono applicare carne
1-3, pesce 2-3, formaggi 2-3, uova 1-2 e legumi almeno 2, insieme ai sottocap
del nutrizionista. Pranzo e cena dello stesso giorno ricevono macro differenti.
I conteggi includono consumati, preservati, bloccati e nuove scelte. Correggi
soltanto conteggi o controlli che producono una violazione riproducibile.

Controlli: node tests/criteri-pwa-selettivi.test.js 5; node
tests/lotto-set-proteine-menu-reale.test.js una volta; sintassi; git diff
--check.

Integrazione obbligatoria — criteri collegati: 3, 6, 7, 9, 10, 11, 12.
Conservare minimi/massimi distinti, nessun massimo PDF inventato per legumi. Contare ogni pasto una volta, inclusi preservati/consumati; verificare fattibilità residua prima di accettare una scelta.

Criterio di uscita funzionale:
Una settimana con celle manuali e blocchi rispetta macro diverse ogni giorno e target; una sostituzione sottrae il vecchio contributo e non supera sottocap.
Applicare il contratto comune; il PASS del selettore da solo non chiude il punto.

```

## Prompt 6 — Rotazione P/C e distanza della proteina

```text
Implementa il criterio 6. La rotazione stack riguarda esclusivamente ricette e
fonti P e C. Introduci identità canoniche per la ricetta P/C e sourceKey per la
proteina concreta. Includi C nelle chiavi stack. Oltre alla rotazione della
ricetta P, garantisci un giorno intermedio senza la stessa proteina concreta:
se usata il giorno D, è esclusa il giorno D+1, anche con ricette diverse. Mantieni separate le due macro
giornaliere e lascia V/S/G/condimenti fuori da questa rotazione.

Controlli: node tests/criteri-pwa-selettivi.test.js 6; fixture P con due ricette
della stessa fonte; fixture C; sintassi; git diff --check.

Integrazione obbligatoria — criteri collegati: 2, 5, 7, 9, 12.
Usare identità condivise: ricette e fonti P/C, non regole speciali per tofu/legumi. Controllare sourceKey concreta nei giorni D-1 e D+1, anche ai confini settimana. Non confondere macro e fonte né rimuovere vincoli macro vigenti per introdurre questo.

Criterio di uscita funzionale:
Due ricette diverse della stessa fonte in giorni consecutivi sono respinte; alternative P di altra fonte e C disponibili sono selezionabili; V non viene esclusa per stack P/C.
Applicare il contratto comune; il PASS del selettore da solo non chiude il punto.

```

## Prompt 7 — Stack binario e copertura quindicinale

```text
Implementa il criterio 7 sulle ricette e fonti P/C. stack=1 significa
disponibile e stack=0 non disponibile. Dopo l'accettazione passa 1→0. Torna
0→1 dopo 15 giorni oppure quando tutte le alternative compatibili del pool
sono esaurite. Il ripristino anticipato completa la generazione e crea un log
persistente con slot, requisito, pool, elemento riattivato, ultimo uso, giorni
trascorsi e copertura da aggiungere. Applica subito la transizione al contesto temporaneo dopo l'accettazione
in bozza, e al persistente soltanto alla conferma; ripristina il delta
se il tentativo viene scartato.

Controlli: node tests/criteri-pwa-selettivi.test.js 7; due fixture
deterministiche, pool sufficiente e pool esaurito; verifica store diagnostica;
sintassi; git diff --check.

Integrazione obbligatoria — criteri collegati: 2, 5, 6, 9, 10, 12, 20, 28.
Data d'uso riferita allo slot e delta di bozza visibili agli slot successivi. Pool dopo vincoli hard, reset solo degli stati necessari; log con conteggi prima/dopo filtri, identità, ultima data, deficit e famiglia da aggiungere. Sostituzione/annullamento rimuovono soltanto prenotazioni pertinenti.

Criterio di uscita funzionale:
Fixture con 1 e 0 esclude lo 0; a 14 giorni resta 0 se esiste scelta, al giorno 15 torna 1; esaurimento anticipato completa e registra log riletto da storage. Pool vuoto per allergia non viene riabilitato.
Applicare il contratto comune; il PASS del selettore da solo non chiude il punto.

```

## Prompt 8 — Roll binario delle alternative

```text
Implementa il criterio 8. roll=1 significa alternativa disponibile e roll=0
alternativa già estratta. Ogni estrazione applica 1→0. Dopo 15 giorni torna a 1; anche quando tutte le
alternative compatibili del relativo pool sono a 0, ripristina il pool a 1 e
ricomincia il ciclo, registrando la carenza se il reset è anticipato. Usa identità canoniche e mantieni separati i pool C, P e
V. Conserva il ciclo tra chiamate e render; distingui lo stato delle estrazioni
dallo stato del piano e isola persone, slot e ruoli.

Controlli: node tests/criteri-pwa-selettivi.test.js 8; ciclo controllato con
tre alternative; verifica ordine senza ripetizioni e reset; sintassi; git diff
--check.

Integrazione obbligatoria — criteri collegati: 2, 4, 7, 9, 17, 18, 19.
Usare identità di alternativa effettiva e pool compatibile con il contesto; apertura/render non azzerano il ciclo. Memorizzare estrazioni e date; annullare la proposta lascia piano/stack/scorte intatti. Il ruolo UI modificabile è distinto dal valore roll.

Criterio di uscita funzionale:
Tre alternative non si ripetono prima dell'esaurimento; riapertura conserva il ciclo; reset a esaurimento o al giorno 15, senza riabilitare escluse cliniche. Estrarre una proposta non salva un pasto.
Applicare il contratto comune; il PASS del selettore da solo non chiude il punto.

```

## Prompt 9 — Unicità settimanale del piatto

```text
Implementa il criterio 9. Crea dishKey canonico per ogni piatto concreto e
usalo come vincolo settimanale assoluto. Applica la stessa funzione in
generazione, rigenerazione, Alternativa, Salvafrigo, inserimento manuale e
sostituzione. Titoli, prefissi modello o percorsi diversi devono produrre lo
stesso dishKey quando il piatto è lo stesso. Valida l'intera settimana prima
del commit atomico. Mantieni distinto dishKey da sourceKey e stack.

Controlli: node tests/criteri-pwa-selettivi.test.js 9; fixture con due forme
dello stesso piatto; settimana finale senza duplicati; sintassi; git diff
--check.

Integrazione obbligatoria — criteri collegati: 2, 4, 6, 7, 10, 17, 18, 19.
Identificare anche i singoli piatti della composizione: cambiare C/P non rende nuovo lo stesso contorno V. Unicità di tutte le ricette concrete, stack solo P/C. Importare consumati, preservati e blocchi; sostituire una voce esclude dal confronto soltanto quella voce.

Criterio di uscita funzionale:
Due rappresentazioni dello stesso piatto e un contorno ripetuto con P diversa vengono respinti in settimana; la sostituzione con identità uguale a se stessa non crea falso duplicato. Il reset stack non supera questo controllo.
Applicare il contratto comune; il PASS del selettore da solo non chiude il punto.

```

## Prompt 10 — Programmazione, bozza e blocchi

```text
Verifica il criterio 10. La Programmazione costruisce da domani, lavora in
menuDraft, preserva consumati e blocchi per realizzazione e committa l'intera
settimana atomicamente. Salva, Annulla, Reset e Rigenera devono operare sulla
bozza secondo il loro contratto. Correggi soltanto una violazione riproducibile
e conserva il consumo automatico sullo store reale.

Controlli: node tests/criteri-pwa-selettivi.test.js 10; node
tests/lotto-programmazione-lucchetti.test.js; controllo atomicità mirato;
sintassi; git diff --check.

Integrazione obbligatoria — criteri collegati: 5, 7, 9, 11, 20, 24, 26.
La bozza possiede conteggi e tracking temporanei; il commit valida contro piano corrente, inclusi consumi intervenuti nel frattempo. I blocchi preservano snapshot e identità, non solo il titolo.

Criterio di uscita funzionale:
Accetta due slot in bozza senza riusare la prima ricetta; Annulla lascia piano/tracking precedenti; errore di scrittura non salva metà settimana; consumo intervenuto durante la bozza è preservato.
Applicare il contratto comune; il PASS del selettore da solo non chiude il punto.

```

## Prompt 11 — Flusso sequenziale del pasto

```text
Verifica il criterio 11 nel percorso usato dal Menu. Per ogni slot determina prima la macro P e TUTTO il pool P valido;
cerca nel pool P+C.user combinato, poi P libera con C.user separato, quindi C AUTO,
successivamente S/G e infine V residua. Aggiorna conteggi soltanto dopo
l'accettazione. Mantieni il motore sequenziale e limita il backtracking alla
fattibilità settimanale. Correggi i punti necessari a garantire questo ordine nell'intero percorso.

Controlli: node tests/criteri-pwa-selettivi.test.js 11; test deterministico
dell'ordine con FIXED e AUTO; sintassi; git diff --check.

Integrazione obbligatoria — criteri collegati: 3, 4, 5, 6, 7, 9, 12, 13, 14, 15, 16.
Filtrare prima dell'ordinamento; esaminare tutte le P valide per P+C.user prima di P libera. Valutare la fattibilità della composizione completa; tentativi falliti rilasciano conteggi/stati temporanei. S/G contribuiscono solo dopo alla chiusura quantitativa.

Criterio di uscita funzionale:
Fixture con P libera in prima posizione e P+C.user valida successiva sceglie la combinata; se assente sceglie P+C.user separati prima di AUTO; tentativo respinto non consuma stack.
Applicare il contratto comune; il PASS del selettore da solo non chiude il punto.

```

## Prompt 12 — Carboidrati AUTO/FIXED/EXCLUDED

```text
Verifica il criterio 12. Tutti i 14 pranzi/cene ricevono C. Gli ordinari sono
AUTO; i carboidrati capped accettano 0=EXCLUDED e valore positivo=FIXED esatto.
Rispetta cap per chiave, cap cumulativo, pasti preservati e distanza D→D+1
degli AUTO. Il risultato finale deve contenere carbKeyUsato valido in ogni
slot. Correggi esclusivamente conteggi, precedenza o validazione C.

Controlli: node tests/criteri-pwa-selettivi.test.js 12; test quantità esatte e
priorità C.user una volta; sintassi; git diff --check.

Integrazione obbligatoria — criteri collegati: 3, 5, 6, 7, 9, 10, 11.
14 C conteggiando anche slot consumati/preservati; FIXED è numero esatto, non massimo. AUTO escluso in D e D+1, ammesso da D+2 se gli altri vincoli lo consentono. Deroga manuale solo alla rotazione AUTO già autorizzata, non a clinica/cap.

Criterio di uscita funzionale:
FIXED residuo raggiunge il conteggio esatto; 0 esclude il capped; vecchio FIXED ordinario migra ad AUTO. Coprire D/D+1 e distinzione C/V senza riaprire il criterio cancellato.
Applicare il contratto comune; il PASS del selettore da solo non chiude il punto.

```

## Prompt 13 — Verdure e dispensa

```text
Implementa e verifica il criterio 13 con una sequenza unica: verdura ricorrente,
verdura disponibile/deperibile, altra verdura disponibile, quindi verdura da
acquistare. La Programmazione interroga la dispensa; con dispensa vuota genera
spesa e colloca fresche a inizio settimana e durevoli dopo. Salvafrigo usa la
priorità urgente del giorno. Mantieni V fuori dalla rotazione stack P/C.

Controlli: node tests/criteri-pwa-selettivi.test.js 13; fixture con ricorrente,
deperibile e dispensa vuota; sintassi; git diff --check.

Integrazione obbligatoria — criteri collegati: 3, 11, 14, 15, 19, 26.
Interrogare inventario anche nella programmazione. Ricorrente resta prima e viene preservata dalla normalizzazione. In assenza di scorta produrre fabbisogno, con fresche nei primi giorni e durevoli dopo; evitare che spesa diventi blocco di disponibilità.

Criterio di uscita funzionale:
Un caso con ricorrente e deperibile sceglie la ricorrente; senza ricorrente privilegia deperibile, poi scorta ordinaria; dispensa vuota produce piano e spesa coerenti.
Applicare il contratto comune; il PASS del selettore da solo non chiude il punto.

```

## Prompt 14 — Bilancio V/S/G

```text
Verifica il criterio 14. Calcola Vres=max(0,V richiesta-S-G-V presente). Con
residuo almeno 50 g aggiungi una V esatta; sotto 50 g redistribuisci a metà soltanto con S e G entrambi presenti.
Se manca uno dei due, completa esplicitamente o respingi il candidato. Mantieni la stessa quantità in realizzazione,
nutrizione, inventario, spesa e storico. Correggi il punto sorgente del calcolo
e preserva i template.

Controlli: node tests/criteri-pwa-selettivi.test.js 14; test V/S/G e soglia;
sintassi; git diff --check.

Integrazione obbligatoria — criteri collegati: 2, 3, 11, 13, 15, 16, 17, 26.
Stesse unità e quantità effettive, senza doppio conteggio di V interna. S/G sono contributi vegetali: olio/aromi non diventano V. Il risultato quantitativo viene scritto una volta nello snapshot e riusato da tutti i consumatori.

Criterio di uscita funzionale:
Casi residuo 0, 49 e 50 g: nessun contorno duplicato; 49 con S+G diviso a metà; 50 V esplicita esatta. Coprire il caso con S o G assente.
Applicare il contratto comune; il PASS del selettore da solo non chiude il punto.

```

## Prompt 15 — Sughi e condimenti

```text
Implementa il criterio 15 nel catalogo e nel resolver. Ogni sugo/condimento
deve avere ruolo, dose, allergeni e compatibilità espliciti. Correggi le
famiglie nominate “al pomodoro” affinché nome, distinta e quantità coincidano.
Il pomodoro da sugo usa la dose da sugo; la porzione 200-250 g appartiene a una
V dichiarata. Mantieni la selezione LRU globale aggiornata all'accettazione.

Controlli: node tests/criteri-pwa-selettivi.test.js 15; materializzazione dei
Tagliolini al pomodoro; integrità delle dosi di tutti i Condimenti; sintassi;
integrità JSON; git diff --check.

Integrazione obbligatoria — criteri collegati: 2, 3, 4, 11, 13, 14, 16, 25, 26.
Esaminare tutte le famiglie interessate, non hardcode dei Tagliolini. Dose e unità provengono da catalogo/regola approvata; una dose mancante resta lacuna da documentare, non numero inventato. Alternative di sughi restano combinazioni valide già definite. LRU globale si aggiorna solo all'accettazione persistente.

Criterio di uscita funzionale:
Caso sugo con dose esplicita e V piena: il primo usa la propria dose, la seconda conserva porzione prevista; distinta, nutrienti e spesa coincidono. Annullamento non avanza LRU.
Applicare il contratto comune; il PASS del selettore da solo non chiude il punto.

```

## Prompt 16 — Quota olio

```text
Verifica il criterio 16. Il resolver produce 10 g di olio al giorno e 5 g per
ciascun pasto principale. La normalizzazione applica una sola quota per pasto
e propaga la quantità a nutrizione, inventario, spesa e storico. Correggi
soltanto duplicazioni o divergenze dimostrate.

Controlli: node tests/criteri-pwa-selettivi.test.js 16; node
tests/lotto-olio-evo-quota-pasto.test.js; sintassi; git diff --check.

Integrazione obbligatoria — criteri collegati: 3, 14, 15, 17, 20, 26.
Quota per pasto derivata dalla quota giornaliera canonica: default 10/2=5 g. Sommare occorrenze reali tra ricette, senza introdurre olio in una ricetta priva di previsione. Colazione/spuntini mantengono le proprie regole.

Criterio di uscita funzionale:
Pasto con più componenti contenenti olio totalizza una sola quota; sostituzione ripetuta non accumula olio; nutrizione e scarico inventario leggono lo stesso totale.
Applicare il contratto comune; il PASS del selettore da solo non chiude il punto.

```

## Prompt 17 — Roll C/P/V nella UI

```text
Implementa il criterio 17 collegando la UI attiva a statoRollPasto() e
ruotaPasto(). Roll C cambia soltanto C, Roll P soltanto P/preparazione e Roll V
soltanto V/S/G. La proposta resta in memoria e viene salvata alla conferma. Il
ricalcolo aggiorna atomicamente bilancio V/S/G, olio, quantità, nutrienti,
allergeni e snapshot. Usa il ciclo binario definito dal criterio 8.

Controlli: node tests/criteri-pwa-selettivi.test.js 17; una fixture per C, P e
V; conferma/annullamento; sintassi; git diff --check.

Integrazione obbligatoria — criteri collegati: 4, 6, 7, 8, 9, 12, 14, 15, 16, 23.
Collegare i listener attivi all'API locale, distinguendo mutazione del ruolo e ricalcoli derivati necessari. Per una combinata, preservare gli altri ruoli: se impossibile non fingere un Roll locale rigenerando tutto. Confermare tramite validatore condiviso.

Criterio di uscita funzionale:
Per C/P/V confrontare snapshot prima/dopo: varia solo il ruolo e le dipendenze quantitative necessarie; conferma salva, annulla no. Il controllo UI riflette alternative effettivamente ammesse.
Applicare il contratto comune; il PASS del selettore da solo non chiude il punto.

```

## Prompt 18 — Alternativa completa

```text
Verifica il criterio 18. Alternativa genera una realizzazione completa in
bozzePropostaPasto, conserva il programmato originale e scrive nel piano solo
con “Imposta come pasto”. Rigenera sostituisce soltanto la bozza corrente;
Annulla la elimina. Applica allergeni, dishKey, stack e frequenze attraverso la
stessa pipeline del motore. Correggi soltanto scritture anticipate o bypass.

Controlli: node tests/criteri-pwa-selettivi.test.js 18; node
tests/lotto-pasto-anteprima-non-salvata.test.js; sintassi; git diff --check.

Integrazione obbligatoria — criteri collegati: 4, 5, 6, 7, 9, 10, 14, 16, 23.
Usare il costruttore comune di pasto completo, con eventuali vincoli contestuali già approvati. Bozze indipendenti per pranzo/cena; cambio giorno/schermata scarta proposta. Riconvalidare frequenze e identità alla conferma.

Criterio di uscita funzionale:
Genera/rigenera senza scritture su piano/scorte/stack; conferma una volta aggiorna snapshot e tracking; un conflitto introdotto dopo l'anteprima viene intercettato al salvataggio.
Applicare il contratto comune; il PASS del selettore da solo non chiude il punto.

```

## Prompt 19 — Salvafrigo

```text
Verifica e completa il criterio 19. Salvafrigo costruisce una proposta usando
in ordine scadenze, avanzi, congelati da tempo e altre scorte disponibili,
mantenendo allergeni, frequenze, C/P/V e quantità. La proposta resta in memoria
e viene committata alla conferma. Usa la stessa identità dishKey e gli stessi
controlli del pasto ordinario.

Controlli: node tests/criteri-pwa-selettivi.test.js 19; fixture inventario con
scadenza, avanzo e freezer; verifica anteprima/commit; sintassi; git diff
--check.

Integrazione obbligatoria — criteri collegati: 4, 5, 6, 7, 9, 13, 14, 18, 26.
Leggere disponibilità e urgenze reali; non simulare scorte/scadenze. Applicare priorità solo tra candidati ammessi. Distinguere programmazione con spesa da Salvafrigo: il deficit non viene presentato come ingrediente disponibile.

Criterio di uscita funzionale:
Scadenza, avanzo e freezer producono una proposta coerente con quantità reali e vincoli; nessuna scrittura prima della conferma; ingrediente urgente allergenico resta escluso.
Applicare il contratto comune; il PASS del selettore da solo non chiude il punto.

```

## Prompt 20 — Consumo reale

```text
Verifica il criterio 20. Alla chiusura della fascia, un pasto programmato passa
a consumato, scala l'inventario con le quantità della realizzazione, registra
lo storico e aggiorna conteggi e stati. Il flusso usa lo store piano reale
anche mentre il Menu ha una bozza aperta. Correggi soltanto divergenze tra
snapshot, inventario e storico.

Controlli: node tests/criteri-pwa-selettivi.test.js 20; node
tests/menu-consumo-automatico-store-reale.test.js; sintassi; git diff --check.

Integrazione obbligatoria — criteri collegati: 7, 10, 16, 18, 21, 22, 26, 28.
Transizione idempotente sul piano reale: storico, scorte e contatori una sola volta, anche dopo riavvio o doppio evento. Consumo non ricrea la data di prenotazione come nuovo uso stack; preservare snapshot consumato.

Criterio di uscita funzionale:
Invocare due volte lo stesso consumo con bozza Menu aperta: uno scarico, uno storico, un incremento contatore; bozza non sostituisce il piano reale.
Applicare il contratto comune; il PASS del selettore da solo non chiude il punto.

```

## Prompt 21 — Colazione

```text
Verifica e completa il criterio 21. La colazione compone i gruppi richiesti con
quantità contestuali, gestisce colazioni speciali e aggiorna il contatore
morigerato al consumo. Usa il resolver canonico e conserva snapshot,
nutrizione, inventario e storico. Definisci il comportamento dalla specifica
approvata e correggi soltanto scostamenti riproducibili.

Controlli: node tests/criteri-pwa-selettivi.test.js 21; fixture colazione
ordinaria e speciale; consumo e reset contatore; sintassi; git diff --check.

Integrazione obbligatoria — criteri collegati: 2, 3, 4, 20, 22, 23, 26.
Colazione C complesso+P; opzionali contestuali. Soglia morigerata 7 secondo specifica corrente, non costante runtime 5: incremento al consumo regolare, reset per grassi/zuccheri semplici e consumo successivo alla proposta speciale; reset consumi azzera.

Criterio di uscita funzionale:
Ordinaria e speciale rispettano quantità/cap; anteprima non cambia contatore; soglia 7 e reset successivo verificati con consumi deterministici; rispettare nonRichiedeInventario.
Applicare il contratto comune; il PASS del selettore da solo non chiude il punto.

```

## Prompt 22 — Frutta e spuntini

```text
Implementa e verifica il criterio 22. La programmazione deve distribuire 2-3
porzioni di frutta al giorno da 150-200 g e applicare i cap giornalieri e
settimanali degli spuntini. Collega il risultato del resolver alla generazione
reale e ai conteggi dei pasti preservati/consumati. Mantieni le quantità
coerenti con inventario, spesa e storico.

Controlli: node tests/criteri-pwa-selettivi.test.js 22; giornata con minimo e
massimo frutta; cap spuntino; sintassi; git diff --check.

Integrazione obbligatoria — criteri collegati: 2, 3, 4, 10, 20, 21, 23, 26.
Contare la frutta effettiva in tutti i contesti una sola volta; evitare di sommare nuovamente quella a colazione. Cap spuntino sono contestuali. Pianificare il residuo giornaliero considerando consumati/preservati.

Criterio di uscita funzionale:
Giorno con frutta già a colazione completa il minimo senza superare massimo; spuntino oltre cap è respinto; snapshot e spesa riportano le porzioni finali.
Applicare il contratto comune; il PASS del selettore da solo non chiude il punto.

```

## Prompt 23 — Pagina Pasto

```text
Verifica il criterio 23 nel PWA attivo. La pagina mostra calendario,
colazione, spuntini, pranzo, cena, immagini, ingredienti, quantità, kcal,
Dettagli, Alternativa, Salvafrigo, Speciali e conferma. Collega ogni comando al
percorso reale già definito negli altri criteri. Intervieni soltanto su elementi
assenti o scollegati; conserva il restyling corrente.

Controlli: node tests/criteri-pwa-selettivi.test.js 23; sintassi degli script
inline; controllo dei listener interessati; git diff --check. Verifica visuale
riservata all'utente.

Integrazione obbligatoria — criteri collegati: 10, 17, 18, 19, 20, 21, 22, 25.
Conservare calendario, caroselli, Preferiti, Speciali, Dettagli, azioni e stato selezionato. Mostrare snapshot effettivi, distinguere proposta e piano; rendering privo di scritture. Header/bottom fissi e grafica esistente restano il riferimento.

Criterio di uscita funzionale:
Invocare i listener reali nel contesto del pasto: proposta/conferma/annulla e cambio giorno hanno gli effetti corretti. Una stringa HTML presente non dimostra il collegamento.
Applicare il contratto comune; il PASS del selettore da solo non chiude il punto.

```

## Prompt 24 — Pagina Menu

```text
Verifica il criterio 24. Menu mostra settimane, giorni, realizzazioni e
lucchetti; naviga tra settimane e lavora su menuDraft fino al salvataggio.
Mantieni un blocco per realizzazione e il consumo automatico sul piano reale.
Correggi soltanto renderer, listener o persistenza direttamente coinvolti.

Controlli: node tests/criteri-pwa-selettivi.test.js 24; test lucchetti; sintassi
inline; git diff --check. Verifica visuale riservata all'utente.

Integrazione obbligatoria — criteri collegati: 5, 9, 10, 20, 23.
Navigazione e blocchi leggono la bozza; consumo legge piano reale. Una combinata ha un blocco coerente. Tutti i giorni ispezionabili; passaggio settimana non salva implicitamente.

Criterio di uscita funzionale:
Navigare dopo una modifica preserva lo stato previsto; Rigenera mantiene snapshot bloccati; Salva/Annulla e Reset rispettano i contratti del punto 10.
Applicare il contratto comune; il PASS del selettore da solo non chiude il punto.

```

## Prompt 25 — Dettaglio ricetta

```text
Completa il criterio 25. Il dettaglio mostra descrizione, ingredienti e
quantità della realizzazione, allergeni effettivi, porzioni, valori
nutrizionali, procedimento strutturato, spunta passaggi e timer. Leggi i dati
visuali per ID e usa lo snapshot funzionale per quantità/nutrizione/allergeni.
Mantieni il fallback dei contenuti editoriali.

Controlli: node tests/criteri-pwa-selettivi.test.js 25; fixture con allergene e
timer; sintassi inline; git diff --check. Verifica visuale riservata all'utente.

Integrazione obbligatoria — criteri collegati: 1, 2, 4, 14, 15, 16, 23.
Visuale solo per ID; ingredienti/quantità/allergeni/nutrizione dallo snapshot. Porzioni mostrate non mutano silenziosamente piano e storico; eventuale conferma di modifica attraversa pipeline comune.

Criterio di uscita funzionale:
Confrontare dettaglio di snapshot consumato con catalogo successivamente cambiato: mantiene dati effettivi; timer/spunte funzionano e assenza editoriale usa fallback.
Applicare il contratto comune; il PASS del selettore da solo non chiude il punto.

```

## Prompt 26 — Inventario e lista della spesa

```text
Verifica e completa il criterio 26. Inventario e spesa usano variantId e unità
g/ml/pz, confrontano giacenza e fabbisogno, sommano confezioni e scalano al
consumo. La quantità della realizzazione è la fonte comune. Costruisci una
prova end-to-end minima spesa→acquisto→inventario→consumo e correggi le divergenze necessarie a chiudere l'intero flusso interessato.

Controlli: node tests/criteri-pwa-selettivi.test.js 26; fixture con g e pz;
sintassi; verifica store; git diff --check.

Integrazione obbligatoria — criteri collegati: 2, 10, 14, 15, 16, 19, 20, 22, 27.
Fabbisogno dai pasti programmati effettivi meno giacenze compatibili. Conversioni g/ml/pz solo con fattori disponibili; niente equivalenze inventate. Modifica piano ricalcola spesa, consumo scala scorte.

Criterio di uscita funzionale:
Una fixture acquisto→giacenza→consumo con g e pezzi e due confezioni verifica quantità esatte; sostituzione aggiorna fabbisogno senza scaricare scorte prima del consumo.
Applicare il contratto comune; il PASS del selettore da solo non chiude il punto.

```

## Prompt 27 — Barcode EAN-13

```text
Implementa il criterio 27. Aggiungi scanner fotocamera EAN-13 nella pagina
Spesa, archivio prodotti separato e collegamento confermato a variantId. Una
scansione registra formato, numero confezioni e quantità normalizzata. Un
codice sconosciuto apre l'associazione manuale e la persiste. Mantieni
scadenza e lotto come dati inseriti esplicitamente.

Controlli: node tests/criteri-pwa-selettivi.test.js 27; fixture EAN noto e
sconosciuto; somma di due confezioni; sintassi; verifica Android/fotocamera
soltanto quando richiesta dall'utente; git diff --check.

Integrazione obbligatoria — criteri collegati: 1, 26, 28, 29.
Usare archivio prodotti separato; EAN stringa valida, acquisizione duplicata dal video non equivale a nuova confezione. Associazione a variantId e registrazione quantità richiedono conferma; gestire rifiuto permessi e codice ignoto.

Criterio di uscita funzionale:
Simulare eventi del decoder: noto/ignoto/duplicato e due confezioni confermate; quantità corrette nello store. Camera reale non provata = limite dichiarato, non criterio certificato.
Applicare il contratto comune; il PASS del selettore da solo non chiude il punto.

```

## Prompt 28 — Accesso, ruoli e sincronizzazione

```text
Completa il criterio 28. Mantieni Google e modalità locale; aggiungi ruoli,
whitelist e stato bloccato con autorizzazione reale. Tutti i documenti cloud
sono confinati per UID dalle regole Firestore. Sincronizza progressivamente
piano, impostazioni, inventario, spesa e storico con operazioni idempotenti e
backup locale. Definisci migrazioni e conflitti prima di attivare la scrittura.

Controlli: node tests/criteri-pwa-selettivi.test.js 28; test regole UID/ruoli;
fixture migrazione ripetuta; sintassi; git diff --check.

Integrazione obbligatoria — criteri collegati: 1, 2, 7, 8, 10, 20, 26, 27, 29.
Isolare ogni store personale e tracking per UID; cambio account non riusa dati del precedente. Permessi applicati server, non solo UI. Migrazione versionata/idempotente con backup e politica conflitti documentata; non sovrascrivere storico consumato.

Criterio di uscita funzionale:
Accesso altro UID e scrittura utente blocked negati nelle regole; doppia migrazione non duplica; conflitto locale/cloud preserva dati secondo politica. Se backend non verificabile, lascia esplicitamente parziale.
Applicare il contratto comune; il PASS del selettore da solo non chiude il punto.

```

## Prompt 29 — PWA e offline

```text
Verifica il criterio 29. Manifest apre la root, service worker gestisce cache e
fallback offline e un aggiornamento usa versioni coerenti di interfaccia,
motore e cataloghi. Mantieni le icone e l'installabilità Android. Correggi
soltanto difetti dimostrati nel contratto PWA o nella strategia cache.

Controlli: node tests/criteri-pwa-selettivi.test.js 29; sintassi sw.js; test
contratto PWA; git diff --check. Installazione e resa Android restano verifica
utente salvo richiesta esplicita.

Integrazione obbligatoria — criteri collegati: 1, 2, 23, 24, 27, 28.
Coordinare versione UI/motore/cataloghi/schema; aggiornamento cache non resetta stack/roll né bozze/snapshot. Avvio offline deve poter usare IndexedDB senza dipendere da download iniziale già eseguito.

Criterio di uscita funzionale:
Fixture avvio offline con catalogo locale e aggiornamento di versione: nessuna combinazione incoerente di risorse; cloud/camera esterni indisponibili sono distinguibili. Installazione Android resta da verificare sul dispositivo.
Applicare il contratto comune; il PASS del selettore da solo non chiude il punto.

```

## Prompt 30 — Disciplina delle verifiche

```text
Applica il criterio 30 all'intervento corrente. Definisci prima l'invariante,
esegui sintassi, struttura, flusso interessato, controllo mirato del criterio e
diff. Usa il percorso reale del PWA e verifica l'output finale. Evita esecuzioni duplicate; ripeti soltanto dopo una correzione o un'anomalia. Registra esiti reali, compresi FAIL e limiti della fixture,
nel registro modifiche.

Controlli: node tests/criteri-pwa-selettivi.test.js 30; git diff --check;
verifica che il diff del registro contenga soltanto aggiunte.

Integrazione obbligatoria — criteri collegati: tutti i punti 1–29.
Separare evidenza statica da prova funzionale. Non assumere corretto il vecchio audit: il runtime può essere cambiato. Registrare anche un requisito non provato, senza trasformare assenza di test in PASS.

Criterio di uscita funzionale:
Ogni chiusura rinvia a ingresso runtime, fixture discriminante, output e storage verificati; revisione controlla dipendenze oltre i conteggi del runner e preservazione delle sezioni del registro.
Applicare il contratto comune; il PASS del selettore da solo non chiude il punto.

```

## Prompt finale — Revisione di tutti gli interventi

```text
Leggi il contratto comune di docs/PROMPT_INTERVENTI_PWA.md e riesamina gli
interventi integrati, non soltanto la presenza dei 30 blocchi.

1. Rileggi specifica, matrice, registro e diff degli interventi effettivi.
   Ricostruisci la catena UI→resolver→motore→snapshot→commit→consumo.
2. Per tutti i 30 criteri collega requisito, funzioni attive, store,
   dipendenze e prova funzionale. Distingui PASS funzionale, FAIL, PARZIALE,
   NON VERIFICATO; gli esiti statici rimangono separati.
3. Verifica che i selettori richiamino prove discriminanti: stringhe, nomi
   o campi non costituiscono una prova del comportamento.
4. Esegui una volta node tests/revisione-finale-criteri-pwa.test.js.
   Evita di duplicare casi condivisi. Per i controlli ancora statici indica
   espressamente quali contratti restano non dimostrati.
5. Esegui una fixture integrata minima sul percorso PWA: settimana con
   consumati/blocchi, P+C.user, alternativa P e C disponibile, allergene in
   condimento, dispensa e dosi S/G; poi Roll/Alternativa e conferma, ricarica
   da IndexedDB e consumo. Riutilizza prove esistenti per non duplicarle.
6. Verifica: nessun piatto ripetuto (anche contorni); stack solo P/C;
   fonte P assente nei giorni consecutivi; stati temporanei aggiornati
   durante costruzione; cooldown recuperabile solo a pool esaurito con log;
   roll binario; allergeni prima della scelta; conteggi FIXED/cap corretti;
   dosi uguali in dettaglio, nutrienti, spesa, inventario e storico.
7. Verifica annullamento/errore senza commit parziale, consumo idempotente
   e sostituzione che non conta due volte la voce precedente.
8. Esegui sintassi, integrità dei file toccati e git diff --check.
   Controlla il diff completo e l'append-only del registro.
9. Aggiorna gli stati solo con evidenze correnti. Elenca decisioni aperte,
   dipendenze incomplete, controlli hardware/cloud non eseguiti.
   Non pubblicare automaticamente e non lanciare suite estese/visive.

Consegna tabella dei 30 criteri con esito funzionale, prova, dipendenze residue
e file modificati. Un runner tutto verde non basta a dichiarare il sistema
completo: anche la fixture integrata e i contratti tra punti devono risultare
dimostrati. Registra il resoconto in docs/REGISTRO_MODIFICHE.md in sola aggiunta.
```
