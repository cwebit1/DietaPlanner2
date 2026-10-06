# Prompt vincolante — completamento PWA secondo PDF e decisioni di Cwe

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


Data: 23 settembre 2026. Corretto dopo la risposta di Cwe: le sette domande
precedenti sono ritirate. Applicare le decisioni qui registrate, senza
riproporle come chiarimenti aperti. Il PDF originale è stato recuperato e
letto integralmente in testo (22 pagine) in questa sessione.

## Obiettivo e fonti

Portare DietaPlanner2 a una PWA funzionante nelle parti richieste, conforme
alle specifiche approvate e alle decisioni di Cwe registrate sotto. Parti dallo
stato reale della root e dalle modifiche locali presenti; non ricominciare,
non scartare lavoro esistente e non assumere che il precedente report provi
il funzionamento del codice corrente.

Leggi AGENTS.md, ESITO_INTERVENTI_PWA.md, STATO_LOTTI_E_TEST.md,
SPECIFICA_PWA_DEFINITIVA.md, PROMPT_INTERVENTI_PWA.md e le sezioni pertinenti
 delle fonti tecniche, baseline e registro richiamate. Risolvi la precedenza
con le istruzioni più recenti di Cwe. Non usare il vecchio ricette.json.

## Metodo obbligatorio

1. **Chiarimenti prima delle decisioni nuove.** Verifica se la risposta è già
   nelle fonti. Sottoponi in chat soltanto eventuali contraddizioni nuove realmente irrisolte, numerate,
   con le fonti in conflitto e il loro effetto. Non trasformare test mancanti,
   difetti o scelte tecniche in domande al proprietario. Non riaprire le
   definizioni già approvate di stack, roll, P/C, allergeni e sequenza P/C/V.
2. **Registra le risposte.** Collega ogni risposta ai criteri interessati e
   aggiorna le specifiche operative con un'unica regola coerente. Non assumere
   che il silenzio approvi una proposta. Lascia aperta soltanto la dipendenza
   realmente bloccata e prosegui sulle parti indipendenti già autorizzate.
3. **Progetta l'integrazione completa.** Prima delle modifiche traccia i
   percorsi Programmazione, Pasto, manuale, Roll, Alternativa, Salvafrigo,
   colazione, spuntini, speciali, consumo, inventario, spesa, account e offline.
   Per ciascuno indica ingresso, configurazione risolta, snapshot, controlli,
   scritture e consumatori. Ogni nuovo campo deve avere lettura, scrittura,
   migrazione, invalidazione cache e trattamento degli snapshot storici.
4. **Completa nell'ordine delle dipendenze.** Dati e identità; validazione
   condivisa; dosi e copertura; generazione e sostituzioni; altri pasti;
   transazioni di salvataggio/consumo/acquisto; viste; migrazione, permessi,
   sincronizzazione e offline. Una correzione locale è conclusa soltanto
   quando tutti i percorsi che condividono il contratto la rispettano.
5. **Mantieni i vincoli approvati.** Stack riguarda P/C; stack e roll sono
   binari, con ritorno a 1 dopo 15 giorni o esaurimento compatibile e log.
   Esaurire C non riapre automaticamente P. Il reset non elimina allergie,
   cap, consecutività P o unicità inderogabile del piatto nel suo ambito.
   Cerca prima tutte le P+C.user combinate, poi P libera+C.user, poi AUTO;
   S/G determinano successivamente il residuo V. Mantieni priorità delle
   verdure, quantità, olio, frequenze, blocchi e snapshot approvati.
6. **Chiudi i difetti già individuati.** Uniforma manuale, colazioni e
   speciali; implementa la distribuzione reale della frutta; completa Roll e
   Salvafrigo, acquisto manuale atomico e transazioni browser. Riconcilia la
   protezione dei Setting nutrizionista con il modello a permessi del Lotto I:
   sincronizzare genericamente tutte le impostazioni dell'utente non basta a
   proteggere la configurazione clinica. Gestisci dati esistenti, appartenenza
   all'account, backup, revoca permessi, conflitti e riavvio offline.
7. **Verifica comportamenti, non nomi nel codice.** Esegui sintassi,
   integrità, coerenza del flusso, diff e la minima prova mirata necessaria.
   Riusa le prove valide; amplia solo per un rischio concreto emerso. Verifica
   risultati e mancati effetti collaterali: nessuna scrittura nelle anteprime,
   rollback completo, consumo/acquisto idempotenti, nessuna perdita dei dati.
   Una prova in memoria non certifica IndexedDB; una regex non certifica una
   funzione; un seed riuscito non certifica tutte le configurazioni. Evita
   batterie ripetitive e test visuali automatici. Per prove hardware o cloud
   inaccessibili indica precisamente quale verifica reale manca e prepara
   un collaudo breve, riproducibile, con risultato atteso.
8. **Chiudi ogni criterio con evidenza.** Per tutti i 30 punti riporta:
   percorso attivo, modifica, prova, esito e limite residuo. Usa soltanto
   “verificato”, “parziale” o “bloccato da risposta/accesso”, specificando la
   causa. Non chiamare completamento una quarantena di ricette senza dose,
   una feature nascosta o una prova saltata. Un limite di ricerca non è una
   prova di catalogo matematicamente insufficiente.
9. **Consegna leggibile.** Aggiorna stato lotti, esito e registro in sola
   aggiunta. Scrivi il riepilogo in chat: Cwe non deve aprire i Markdown.
   Pubblicazione, deploy delle regole e modifica dei dati reali restano
   azioni separate: prepara prima un risultato verificato e un piano di
   migrazione/ripristino, poi richiedi l'autorizzazione finale prevista dalla
   repo. Non dichiarare funzionante ciò che non è stato provato.

## Decisioni vincolanti di Cwe — sostituiscono le sette domande

1. **Frutta e spuntini sono liberi e dosati.** Non introdurre unicità
   settimanale, stack o roll per limitarne la ripetizione. Applicare dosi e
   frequenze del PDF, senza trasferire a questi contesti i vincoli P/C dei
   pasti principali. Non estendere autonomamente tali vincoli alla colazione.
2. **Verdura ricorrente prima, poi le altre quando si esaurisce.** Leggere
   disponibilità e impieghi già previsti; quando la ricorrente è esaurita,
   continuare con la sequenza deperibile/disponibile/spesa già definita.
   L'esaurimento della ricorrente non deve causare errore o piantare il
   generatore. La normalizzazione conserva una scelta valida già effettuata;
   non forza nuovamente una ricorrente esaurita.
3. **Dosi di sughi e condimenti elaborate da Qwen.** Preparare i dati di
   ingresso dal catalogo reale e integrare l'elaborato ricevuto collegandolo
   agli ID esistenti, con ruoli S/G, ingredienti, quantità, unità, allergeni e
   copertura coerenti. Conservare le dosi già stabilite nel PDF e le successive
   decisioni di Cwe, compresa la quota olio. Non sostituire Qwen con dosi
   inventate dall'assistente. Non dichiarare ricevuti dati non ancora elaborati.
4. **Collocazione frutta dal PDF, non da una nuova regola.** Pagina 13:
   2–3 porzioni giornaliere da circa 150–200 g, ai pasti principali e/o agli
   spuntini; pagine 10–11 consentono frutta a colazione. Contare una volta la
   quantità effettiva nei vari contesti. Pagina 19: gli spuntini sono
   facoltativi, non creare spuntini obbligatori né un ordine rigido di
   collocazione non richiesto. Conservare la libertà di scelta prevista.
5. **Registrare ciò che è stato mangiato senza etichetta di violazione.**
   Pagine 2, 7 e 21: flessibilità, nessuna classificazione morale del cibo,
   pasto libero senza sgarro né compensazioni. Registrare fedelmente quantità
   e consumi, senza messaggi punitivi né riequilibri automatici inventati.
   Questo non revoca il filtro allergeni richiesto per le proposte.
6. **Accessi: lasciare come sono adesso.** Nessun nuovo modello di funzioni
   local/limited, permessi o migrazione account in questa fase. Conservare lo
   stato esistente senza promuoverlo a verificato; le modifiche preparate nei
   turni precedenti restano distinguibili e non vengono pubblicate qui.
7. **Storico: lasciare come è adesso.** Non introdurre nuove politiche di
   conservazione, cancellazione o scadenza. Restano necessari correttezza,
   conservazione dei dati e coerenza tra consumo, inventario e conteggi.

## Fonte primaria letta e conseguenze operative

PDF: `PERCORSO ALIMENTARE MIRIA SPILLER.pdf`, 22 pagine;
riferimento recuperato: `libfile_8ca401da6860819183efbbff02182d67`.
La lettura non è una verifica di conformità dell'app: confrontare ogni
prescrizione pertinente con resolver, catalogo e percorsi reali prima di
spuntare il criterio. Le istruzioni esplicite successive di Cwe prevalgono.

- Pagine 2 e 12: porzioni indicative e flessibilità. Le regole applicative
  esplicite di Cwe restano distinte dalle indicazioni del PDF.
- Pagine 8–11: colazione a gruppi; possibilità di dividere il pasto e di
  combinare due alimenti dello stesso gruppo dimezzandone le quantità;
  aggiunte facoltative. Non inventare divieti di ripetizione.
- Pagina 13: frutta e verdura hanno quantità e contesti propri; le prime non
  sono vincolate a uno specifico orario di spuntino.
- Pagine 14–17: quantità per contesto, frequenze e natura delle fonti P/C;
  pasta 100% legumi è P, non sostituisce automaticamente il carboidrato.
- Pagina 18: condimenti e piccole aggiunte hanno indicazioni specifiche;
  Qwen completa i dati culinari mancanti rispettando tali indicazioni.
- Pagina 19: spuntini facoltativi; frutta secca circa **10 g**, patatine circa
  **20 g**. Le opzioni operative attuali riportano rispettivamente 15 e 25 g:
  discrepanza da correggere verificando tutte le dipendenze, non ancora
  corretta da questo intervento documentale.
- Pagina 21: nessuna compensazione automatica per un pasto libero.
- Pagina 22: settimana esemplificativa, non schema obbligatorio da imporre.

## Prossimi interventi autorizzati dal contratto complessivo

Confrontare il PWA con il PDF e con queste decisioni; correggere le divergenze
nei percorsi condivisi. Proseguire con snapshot, conteggi, rotazione P/C,
completamento pasti, transazioni, consumo e spesa; applicare prove mirate.
Per S/G attendere l'elaborato Qwen da integrare. Accessi e politiche dello
storico restano nel perimetro conservativo dei punti 6 e 7. Scrivere l'esito
in chat. Nessuna nuova serie di domande sui criteri qui già risolti.
