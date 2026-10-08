# Specifica definitiva PWA DietaPlanner2

**Stato:** contratto funzionale consolidato al 22 settembre 2026  
**Ambito:** PWA attiva nella root di `DietaPlanner2`  
**Scopo:** riunire in un solo documento le regole ancora valide contenute in tutti i file Markdown di `DietaPlanner` e `DietaPlanner2`, eliminando ambiguità tra versioni vecchie, correzioni successive e stato reale del codice.

## 1. Autorità e regole di lettura

1. Le istruzioni esplicite più recenti di Cwe prevalgono sulle specifiche precedenti.
2. Per quantità, frequenze e vincoli clinici prevale `BASELINE_NUTRIZIONISTA_PDF_V1.md`, salvo istruzione successiva esplicita.
3. Questo documento è la specifica operativa consolidata del PWA. I documenti originali restano la fonte di dettaglio e di cronologia.
4. I documenti marcati storico o superato non sono operativi, ma sono stati letti per recuperare requisiti non revocati e capire le sostituzioni.
5. Una funzione non è considerata implementata perché esiste un helper, un test passa o la UI mostra un controllo: deve essere collegata al percorso runtime realmente usato dal PWA.
6. In caso di conflitto non risolto da data, autorità o istruzione esplicita, il comportamento non va inventato: deve essere registrato come decisione aperta.

## 2. Definizioni non negoziabili

| Termine | Significato definitivo |
|---|---|
| Template | Ricetta o componente immutabile del catalogo. Non contiene quantità personalizzate di una singola programmazione. |
| Realizzazione | Snapshot concreto del pasto: ricette, ingredienti, ruoli, quantità, coperture C/P/V/S/G e metadati di rotazione. |
| Piano | Programmazione salvata e persistente. |
| Bozza | Programmazione modificabile in memoria prima del salvataggio atomico. |
| Storico | Pasti realmente consumati. Non deve essere riscritto dalla rigenerazione. |
| C | Carboidrato principale. |
| P | Fonte proteica. |
| V | Porzione piena di verdura. |
| S | Salsa/sugo: contributo parziale alla verdura, legato al carboidrato. |
| G | Guarnizione/condimento vegetale: contributo parziale, legato alla proteina. |
| `stack` | Stato binario di disponibilità nella compilazione ordinaria: `1` disponibile, `0` non disponibile. |
| `roll` | Stato binario di disponibilità nel ciclo delle alternative: `1` disponibile, `0` non disponibile. |
| `dishKey` | Identità canonica del piatto concreto, usata per impedire duplicati settimanali. |
| `sourceKey` | Identità canonica della fonte proteica concreta, per esempio tofu, ceci, pollo, salmone, uova o mozzarella. |
| `rotationKey` | Identità canonica di rotazione derivata da ingrediente/variante e ruolo, non dal prefisso del modello. |

## 3. Architettura obbligatoria

### 3.1 Unica applicazione attiva

- L'applicazione vive esclusivamente nella root della repo.
- `index.html` è il PWA attivo; `index-old.html` è soltanto backup e non deve diventare un secondo runtime.
- Non va creata una cartella applicativa parallela.
- `nutrition-config.js` è l'unico resolver di precedenze, limiti e quantità.
- `engine-core.js` contiene helper puri e condivisi.
- `motor-v12.js` è l'unico motore di generazione.
- `db-ricette.json` e `ingredienti-new.json` sono gli unici cataloghi funzionali.
- `ricette.json` è storico: nessun accesso runtime, fallback o recupero automatico è ammesso.

### 3.2 Cataloghi e persistenza

- Il catalogo compilato in IndexedDB è la sorgente operativa; i JSON statici sono sorgenti di compilazione/versionamento.
- `db-visuale.json` è parallelo e non duplica dati nutrizionali. Collega i record esclusivamente per ID.
- Il motore legge dal catalogo visuale soltanto `disponibile` durante la selezione; foto e testi non devono rallentare il motore.
- `disponibile:false` esclude una ricetta dalle nuove proposte, ma non cancella ID, storico o snapshot già salvati.
- L'assenza di immagine, descrizione o procedura è non bloccante e usa un fallback grafico/testuale.
- Le scritture di una settimana devono essere atomiche: nessuna mezza settimana persistita dopo un errore.

## 4. Gerarchia nutrizionale

Precedenza per quantità, ricorrenze e frequenze (decisione Cwe 23/09/2026):

1. Valori espliciti del Set nutrizionista per persona e contesto.
2. Per valori non impostati, valori iniziali del PDF e delle regole applicative approvate.
3. Profilo e Set utente applicano le proprie restrizioni entro la configurazione nutrizionista.

Il nutrizionista può modificare tutti questi parametri. I valori iniziali del
PDF non costituiscono un tetto immutabile per le sue impostazioni. Le
esclusioni cliniche attive e i vincoli strutturali restano applicati.

Regole:

- Il livello utente può soltanto restringere il piano clinico, mai ampliarlo.
- Un'esclusione clinica, un cap effettivo o un ingrediente disabilitato non può essere rilassato per far riuscire la generazione.
- Setting e Set non modificano dosi o template del catalogo: alimentano il resolver, che produce quantità contestuali nella realizzazione.
- Colazione, pranzo/cena e spuntino sono contesti separati.
- La stessa quantità risolta deve alimentare nutrizione, inventario, spesa e storico.

### 4.1 Frequenze proteiche settimanali

| Macro | Frequenza ordinaria |
|---|---:|
| Carne | 1–3 |
| Pesce | 2–3 |
| Formaggi | 2–3 |
| Uova | 1–2 |
| Legumi | almeno 2; nessun massimo PDF inventato |

I sottolimiti clinici, come carne rossa o categorie equivalenti, restano quelli definiti nella baseline e nel resolver. I conteggi comprendono consumi già avvenuti, pasti preservati e pasti bloccati.

### 4.2 Regole generali delle quantità

- Verdura piena ordinaria: 200–250 g; insalata a foglia: 70–80 g.
- Patate, mais e legumi non diventano verdura per completare V.
- Fagiolini, funghi e zucca sono gestiti secondo le classificazioni verificate del catalogo.
- Piselli freschi sono ammessi solo nel ruolo previsto e non come scorciatoia universale.
- Frutta: 2–3 porzioni al giorno, normalmente 150–200 g.
- Olio: 10 g giornalieri complessivi, normalmente 5 g a pranzo e 5 g a cena, senza moltiplicarlo per il numero di componenti. L'olio non va aggiunto a una ricetta che non lo prevede senza una regola esplicita.
- Colazione complessa: C + P obbligatori; grassi, zuccheri semplici e frutta sono opzionali entro i rispettivi limiti.
- Aromi esclusi dal perimetro (istruzione Cwe 30/09/2026): aglio, basilico fresco, semi di sesamo, cipolla rossa, rosmarino non richiedono dose, non condizionano l'ammissione della ricetta e non ricevono automaticamente una porzione di verdura.

### 4.3 Allergeni e intolleranze

- Ogni ingrediente è classificato con tutti gli allergeni che contiene.
- Ogni ricetta contiene la classificazione completa degli allergeni derivata
  dall'unione degli allergeni di tutti i suoi ingredienti e componenti.
- Il Setting nutrizionista registra allergie e intolleranze della persona.
- Prima della compilazione il motore confronta tali impostazioni con gli
  allergeni di ingredienti e ricette.
- Il motore esclude dal pool ogni ingrediente, ricetta e combinazione che
  contiene un allergene o una sostanza associata alle intolleranze impostate.
- Il filtro viene applicato a programmazione, alternativa, Roll, Salvafrigo,
  inserimento manuale e sostituzione di un componente.
- La realizzazione salva gli allergeni effettivamente presenti nel pasto.

## 5. Contratto della programmazione settimanale

### 5.1 Confini temporali

- La pagina Programmazione modifica da domani in avanti; oggi è di sola lettura.
- La pagina Pasto mostra e gestisce il giorno corrente fino alla chiusura della relativa finestra temporale.
- Il renderer non determina il consumo: il consumo è prodotto da una funzione esplicita, che aggiorna insieme storico e inventario.
- Un pasto già consumato non viene rigenerato o riscritto.

### 5.2 Bozza, salvataggio e blocchi

- Aprire Programmazione crea o carica una bozza separata dal piano persistito.
- `Salva` applica la bozza in modo atomico.
- `Annulla` scarta la bozza.
- `Reset` azzera bozza e blocchi della bozza, non lo storico.
- `Rigenera` rispetta i blocchi.
- I blocchi appartengono alla realizzazione concreta; una ricetta combinata ha un solo blocco coerente.
- La pagina Programmazione non modifica in silenzio il piano al semplice rendering.

### 5.3 Sequenza di costruzione di ogni pranzo/cena

1. Risolvere configurazione clinica, Setting, profilo e Set.
2. Caricare consumi, pasti preservati, blocchi, cronologia di rotazione e diagnostica di copertura.
3. Costruire la griglia delle macro proteiche dell'intera settimana con fattibilità residua.
4. Per ogni slot selezionare P/G.
5. Se esistono carboidrati FIXED residui, tentare nell'ordine:
   - ricetta combinata `P + C.user`;
   - proteina libera + `C.user` separato.
6. Solo dopo usare C AUTO.
7. Calcolare il residuo vegetale dopo S, G e V già presenti.
8. Applicare rotazioni e vincoli prima di accettare il candidato.
9. Dopo l'accettazione portare a `0` gli stati `stack` P/C usati e aggiornare i conteggi; una semplice anteprima non modifica lo stato persistente.
10. Validare l'intera settimana e persistirla in un'unica transazione.

Il motore resta sequenziale per pasto. È ammesso un backtracking limitato sulla griglia settimanale per evitare vicoli ciechi, non un prodotto cartesiano indiscriminato di tutte le ricette.

## 6. Rotazione di proteine e carboidrati

### 6.1 Regola giornaliera

- Pranzo e cena devono usare due macro-categorie proteiche distinte.
- Il vecchio parametro `maxProteinSourcesPerDay` è abolito.
- Le celle manuali restano vincolanti; l'automatico completa le celle mancanti senza violare frequenze e fattibilità residua.
- Se il profilo lascia meno di due macro-categorie compatibili, la configurazione è strutturalmente incompleta e va diagnosticata, non mascherata.

### 6.2 Ambito della rotazione

La rotazione regolata dallo `stack` si applica esclusivamente a:

- ricette e fonti proteiche P;
- ricette e fonti di carboidrati C.

Per P e C, `stack:1` indica disponibilità e `stack:0` indisponibilità. Il
passaggio `1 → 0 → 1` segue la regola definita nel capitolo 9.

Per le proteine P si applica inoltre il vincolo già implementato della
consecutività: la stessa proteina concreta non viene assegnata in due giorni
consecutivi. Questo controllo si aggiunge alla rotazione della ricetta P e usa
`sourceKey` per riconoscere la fonte proteica anche quando cambia la ricetta.

Verdure, salse, guarnizioni, condimenti e cotture seguono le rispettive regole
di priorità, compatibilità, residuo, inventario e LRU.

## 7. Carboidrati

### 7.1 Stato utente

- I carboidrati ordinari sono sempre AUTO e non possono essere fissati o esclusi dall'utente.
- Sono configurabili soltanto i carboidrati con cap esplicito: gnocchi, pasta ripiena, gallette di riso, cracker, friselle, taralli/grissini/crostini, piadina e paste sfoglia/frolla, oltre alle chiavi formalmente presenti nel resolver canonico.
- Valore `0` significa EXCLUDED.
- Valore positivo significa FIXED: quantità esatta settimanale, soggetta sia al cap della singola chiave sia al cap totale.
- Tutti i 14 pasti ordinari richiedono C. La vecchia eccezione “pasto senza carboidrato” è revocata.

### 7.2 Rotazione automatica

- Un carboidrato AUTO usato nel giorno D non è riutilizzabile automaticamente in D e D+1; torna disponibile in D+2.
- L'inserimento manuale può derogare alla sola rotazione automatica, mai ai vincoli clinici.

## 8. Verdure, salse, guarnizioni e condimenti

### 8.1 Calcolo del residuo

Per ogni realizzazione:

`Vres = max(0, Vreq - S - G - Vpresente)`

- Se `Vres >= 50 g`, aggiungere una V esplicita della quantità esatta residua.
- Se `Vres < 50 g`, il residuo può essere assorbito soltanto quando sono presenti sia S sia G, distribuendolo coerentemente tra i due.
- Se manca l'invariante necessario, non si inventa una copertura: il candidato è invalido o va completato esplicitamente.
- Un'insalata fredda di cereali che contiene già una V piena non riceve una seconda verdura automatica.

### 8.2 Salse e condimenti

- S e G devono avere ruolo e dose espliciti nel catalogo o nella regola della ricetta.
- Il resolver non deve trasformare un ingrediente da sugo o aroma in una porzione piena di verdura.
- “Tagliolini al pomodoro” con 225 g di pomodoro fresco non è corretto come fallback automatico per un semplice sugo. Può esserlo soltanto se la ricetta dichiara esplicitamente quella quantità e quel ruolo.
- I condimenti di P e di C (primi e secondi) hanno senso, quantità e funzione: le dosi dichiarate si considerano (esempio: pomodoro 80 g in un sugo) e una dose mancante esclude la ricetta, salvo gli aromi esclusi. Il condimento di V non si considera mai: nessuna dose, solo rotazione LRU. Nessun condimento entra negli stack (Cwe, 06/10/2026).
- Il nome di una ricetta non può simulare un ingrediente assente: se il piatto si chiama “al pomodoro”, il pomodoro deve esistere nella distinta ingredienti o il nome va corretto.
- La rotazione dei condimenti usa una LRU globale tra le alternative compatibili.
- Il cursore LRU avanza solo su una proposta accettata; anteprime annullate e Roll manuali non devono consumarlo.

### 8.3 Verdure ricorrenti e inventario

- La verdura ricorrente ha priorità finché disponibile; quando si esaurisce si passa alle altre secondo la sequenza prevista, senza errore o blocco della generazione.
- La priorità è: ricorrente richiesta, alimento urgente/deperibile disponibile, altra verdura valida.
- L'inventario positivo orienta la priorità e il Salvafrigo; inventario vuoto non impedisce la programmazione, perché genera fabbisogno di spesa.
- La pianificazione deve favorire alimenti freschi a inizio periodo e più durevoli successivamente quando non esiste disponibilità reale.
- La normalizzazione conserva la ricorrente validamente scelta; dopo il suo esaurimento conserva invece la successiva verdura valida selezionata.

## 9. Unicità, `stack`, cooldown e fallback

### 9.1 Unicità settimanale dei piatti principali

- Lo stesso `dishKey` o la stessa ricetta concreta dei piatti principali non può comparire due volte nella stessa settimana. Frutta e spuntini sono liberi e dosati: nessuna unicità settimanale o rotazione stack/roll viene aggiunta a questi contesti.
- Il controllo copre ricette combinate, componenti separati che materializzano lo stesso piatto e proposte manuali.
- Titoli diversi non rendono diversi due piatti con la stessa identità canonica.
- Questa regola non è rilassabile. Se il catalogo non copre sette giorni senza duplicati, va registrata una carenza di catalogo.

### 9.2 Semantica binaria di `stack`

- Ogni ricetta e fonte P/C deve avere uno stato `stack` esplicito.
- `stack:1` significa **disponibile** alla compilazione.
- `stack:0` significa **non disponibile** e il candidato viene escluso
  matematicamente prima della scelta.
- Quando una realizzazione viene accettata, gli elementi effettivamente usati
  passano da `stack:1` a `stack:0` e viene salvata la data d'uso.
- Una semplice anteprima, un rendering o una proposta annullata non cambia lo
  stato persistente.
- Uno stato `stack:0` torna a `stack:1` dopo 15 giorni.
- Se tutti gli elementi compatibili del pool sono a `0`, il pool è esaurito:
  gli elementi necessari possono tornare anticipatamente a `1` per permettere
  la compilazione, senza produrre errore.
- Ogni ripristino anticipato deve essere scritto nel registro delle carenze di
  copertura.
- L'identità controllata non deve dipendere dal prefisso del modello (`PX`,
  `CX`, ecc.): usa ingrediente/variante, fonte, ruolo e piatto canonici.

### 9.3 Regola matematica di compilazione

Per ogni pool già filtrato per clinica, compatibilità, cap, disponibilità del
catalogo e frequenze:

1. mantenere soltanto i candidati con `stack:1`;
2. escludere comunque i piatti già usati nella stessa settimana;
3. scegliere esclusivamente tra i candidati rimasti;
4. se nessun candidato resta perché tutti gli elementi compatibili hanno
   `stack:0`, ripristinare il pool necessario da `0` a `1` e ripetere la
   compilazione;
5. se il ripristino avviene prima del quindicesimo giorno, registrare la
   carenza di copertura.

Il ripristino per esaurimento non può rendere valide ricette clinicamente
escluse, indisponibili, incompatibili, oltre cap o duplicate nella settimana.

### 9.4 Registro delle carenze di copertura

Ogni rilassamento deve salvare almeno:

| Campo | Contenuto |
|---|---|
| timestamp/data slot | Quando e per quale pasto è avvenuto |
| requisito | Macro, ruolo, fonte o combinazione richiesta |
| candidati normali | Numero prima e dopo i filtri |
| filtri bloccanti | Stati `stack:0`, compatibilità, disponibilità, cap, frequenze |
| elemento riammesso | ID ricetta, `dishKey`, `sourceKey`, `rotationKey` |
| collisione | Ultimo uso e distanza in giorni |
| causa sintetica | Copertura catalogo insufficiente o profilo troppo ristretto |
| azione suggerita | Famiglia di ricette/fonti da aggiungere |

Il log deve stare in una store IndexedDB dedicata o equivalente persistente, essere consultabile/esportabile e non confondersi con gli errori tecnici.

## 10. Semantica binaria di `roll` e alternative

### 10.1 Valore binario

- `roll:1` significa **disponibile** nel ciclo delle alternative.
- `roll:0` significa **non disponibile** nel ciclo e viene escluso
  matematicamente dalla query successiva.
- Quando un'alternativa viene estratta nel ciclo, il suo stato `roll` passa da
  `1` a `0`, così non può essere riproposta subito.
- Uno stato `roll:0` torna a `1` dopo 15 giorni dall'estrazione, secondo la
  precisazione esplicita di Cwe; il timestamp dell'estrazione è distinto
  dalla data d'uso del piano.
- Quando non resta alcuna alternativa compatibile con `roll:1`, il pool è
  esaurito: gli stati del pool tornano da `0` a `1` e il ciclo può ripartire.
  Il ripristino anticipato registra la carenza di copertura quindicinale.
  Reset temporale o a esaurimento preservano tutti i filtri inderogabili.
- `roll` non significa “componente modificabile” e non è un permesso UI.
- Il comando Roll C modifica soltanto C compatibile.
- Il comando Roll P modifica soltanto P e l'eventuale cottura/guarnizione
  collegata.
- Il comando Roll V modifica soltanto V/S/G secondo compatibilità e ricalcola
  il residuo.
- Un comando Roll non deve rigenerare di nascosto l'intero pasto.
- Ogni risultato confermato deve essere ricalcolato atomicamente per quantità,
  nutrizione, inventario, spesa e coperture.

### 10.2 Distinzione dalla funzione “Alternativa”

- `Alternativa` genera una nuova realizzazione completa del pasto.
- Roll C/P/V sostituisce un solo ruolo modificabile.
- `Salvafrigo` genera una realizzazione completa privilegiando l'inventario reale.
- Il PWA attuale espone principalmente la rigenerazione completa: copiare il
  campo `roll` senza trasformare realmente `1 → 0 → 1` non soddisfa il
  contratto.

## 11. Anteprime Pasto e Salvafrigo

- Alternativa e Salvafrigo sono calcolate su richiesta, non precaricate.
- La proposta resta in memoria finché l'utente sceglie `Imposta come pasto`.
- Cambiare schermata, giorno o annullare elimina la bozza di anteprima senza alterare il piano.
- Pranzo e cena hanno bozze indipendenti.
- Accettare una proposta aggiorna insieme realizzazione, quantità, coperture e dati derivati.
- Salvafrigo usa quantità realmente disponibili e date/urgenze note; non inventa scadenze da un codice EAN.

## 12. Interfaccia obbligatoria del PWA

### 12.1 Navigazione e Pasto

- Header e navigazione inferiore sono fissi e coerenti con la safe area mobile.
- Il selettore dei giorni è un carosello esteso e mantiene il giorno selezionato.
- Ogni pasto mostra orario, immagine 18:5 o fallback, titolo, composizione, kcal e accesso ai dettagli.
- Il pannello azioni distingue stato normale, proposta e modalità speciale.
- Lo scorrimento tra realizzazioni rispetta il contesto: niente wrap dove non previsto; ciclo solo nelle raccolte speciali.
- I blocchi non appartengono alla pagina Pasto: sono nella pagina Programmazione/Menu.

### 12.2 Menu/Programmazione

- Vista settimanale verticale semplice, senza dipendere dalle immagini.
- Tutti i giorni della bozza sono ispezionabili.
- Blocchi per realizzazione con icone coerenti per colazione, pranzo e cena.
- Supporto al passaggio tra settimane senza perdere o salvare implicitamente la bozza.

### 12.3 Dettaglio ricetta

- Descrizione, ingredienti e quantità della realizzazione.
- Procedura strutturata, timer utilizzabili e spunta dei passaggi.
- Porzioni e valori nutrizionali coerenti con lo snapshot.
- Statistiche o funzioni sociali non possono precedere correttezza del motore e del catalogo.

## 13. Autenticazione, ruoli e sincronizzazione

- Login Google persistente; sessione locale non persistente.
- Ruoli previsti: admin, user, limited/local e blocked, con whitelist e permessi espliciti.
- Ogni dato remoto deve essere confinato per UID e protetto da regole Firestore, non soltanto nascosto nella UI.
- La migrazione IndexedDB → Firestore deve essere incrementale, idempotente e mantenere un backup locale fino a validazione.
- Stato corrente: RBAC completo, whitelist e migrazione cloud sono requisiti approvati ma non ancora chiusi.

## 14. Scanner spesa

- Formato ordinario EAN-13, con supporto agli altri formati dichiarati dal modulo scanner.
- Il catalogo prodotti commerciali è separato e collega ogni codice a `variantId`.
- Una scansione confermata aggiunge la quantità totale normalizzata in g, ml o pezzi; più confezioni si sommano.
- Un codice sconosciuto richiede associazione o conferma manuale persistente.
- Una ricerca esterna non diventa automaticamente fonte canonica.
- EAN non determina scadenza o lotto se l'informazione non è codificata.
- Stato corrente: requisito futuro approvato, non implementazione da dichiarare conclusa.

## 15. PWA, offline e aggiornamenti

- Manifest e `start_url` puntano alla root attiva.
- Il service worker cachea solo risorse previste, con versione e invalidazione esplicite.
- Un aggiornamento non deve lasciare insieme HTML nuovo e motore/cataloghi vecchi.
- Il PWA deve degradare correttamente offline per funzioni locali; cloud e ricerca esterna mostrano uno stato non disponibile chiaro.
- Le verifiche finali mobile comprendono almeno Android reale, installazione PWA, riapertura offline, aggiornamento cache e fotocamera quando lo scanner sarà implementato.

## 16. Controlli e criterio di chiusura

Il numero di test passati non è una prova di correttezza. Per ogni intervento:

1. descrivere prima l'invariante funzionale che deve fallire nel codice precedente;
2. usare un caso deterministico e minimo;
3. attraversare la stessa API/percorso usato dal PWA, non un helper morto o una replica della logica nel test;
4. verificare l'output finale persistito/materializzato, non soltanto un array intermedio;
5. eseguire una volta il controllo mirato, più sintassi e `git diff --check`;
6. non lanciare suite massive o loop statistici senza un motivo diagnostico esplicito;
7. non dichiarare risolto un requisito se il test non discrimina il comportamento vecchio da quello nuovo;
8. registrare apertamente flakiness, copertura mancante e limiti della fixture.

Controlli minimi per il motore di rotazione:

- zero `dishKey` duplicati nella stessa settimana;
- nei pool P e C, un candidato con `stack:1` deve battere ed escludere quello
  con `stack:0`;
- la stessa proteina concreta non deve comparire in due giorni consecutivi;
- dopo un uso accettato `stack` passa da `1` a `0`;
- dopo 15 giorni `stack` torna da `0` a `1`;
- a pool esaurito gli `stack:0` necessari tornano anticipatamente a `1`, il
  piano viene completato e viene creata la diagnostica;
- un'alternativa estratta passa da `roll:1` a `roll:0` e non ricompare finché
  esistono alternative a `1`;
- a esaurimento del ciclo gli stati `roll` del pool tornano a `1`;
- un sugo usa la sua dose, non la porzione V di 225 g;
- una ricetta contenente un allergene impostato dal nutrizionista viene
  esclusa dal risultato finale in ogni percorso di generazione;
- l'accettazione, non la semplice anteprima, aggiorna lo `stack` persistente e
  la LRU.

## 17. Stato reale e scostamenti da chiudere

| Area | Contratto | Stato rilevato dai documenti/codice | Esito |
|---|---|---|---|
| Unicità piatti settimanale | Nessun duplicato | I vincoli esistenti non garantiscono un'identità canonica unica su tutti i percorsi | **Da correggere** |
| Stack 15 giorni | `1` disponibile, `0` escluso; ritorno a `1` dopo 15 giorni o a pool esaurito con log | Il runtime usa timestamp e chiavi, ma non materializza integralmente il ciclo binario richiesto | **Da correggere** |
| Rotazione P/C | Stato `stack` applicato alle ricette e fonti P e C; stessa proteina esclusa per due giorni consecutivi | La consecutività proteica è già implementata; il ciclo binario completo va verificato | **Parziale** |
| Roll binario | `1` disponibile, `0` escluso; reset a `1` quando il pool delle alternative è esaurito | Il dato è propagato, ma non viene consumato come stato binario dal percorso PWA | **Da correggere** |
| Sughi/condimenti | Ruolo e dose espliciti | Fallback V può produrre quantità improprie; anomalie pomodoro note | **Da correggere dati + resolver** |
| Carboidrati | AUTO ordinari, FIXED solo capped | Regola documentata e implementata nei filoni recenti | **Da preservare** |
| Due macro al giorno | Pranzo/cena distinti | Regola recente sostituisce il vecchio massimo configurabile | **Da preservare e verificare** |
| Allergeni e intolleranze | Classificazione su ogni ingrediente e ricetta; esclusione secondo Setting nutrizionista | Metadati e copertura di tutti i percorsi da verificare sull'intero catalogo | **Da verificare** |
| Verdura ricorrente | Vincolo attivo | Correzione presente; inventario nella programmazione non è completamente chiuso | **Parziale** |
| Catalogo visuale | ID + disponibilità + contenuti | 420 record dichiarati; anomalie testuali/ingredienti restano | **Parziale** |
| RBAC/Firestore | UID e permessi reali | Progettato, non chiuso | **Futuro** |
| Scanner | EAN → `variantId` confermato | Progettato, non implementato | **Futuro** |

## 18. Regole sostituite

| Regola vecchia | Regola vigente |
|---|---|
| Fallback al vecchio `ricette.json` | Vietato; la copertura mancante resta dichiarata. |
| `V-` o verdura generica per salse/condimenti | Ruoli distinti V, S e G con quantità esplicite. |
| `maxProteinSourcesPerDay` configurabile | Due macro proteiche distinte ogni giorno. |
| Carboidrati ordinari fissabili/escludibili | Ordinari sempre AUTO; configurabili solo quelli capped. |
| Pasto ordinario senza C | C obbligatorio in tutti i 14 slot pranzo/cena. |
| Stack interpretato come flag di partecipazione | Stato mutabile: `1` disponibile, `0` non disponibile. |
| Cooldown di 15 giorni fino all'errore | Ritorno anticipato `stack:0 → 1` a pool esaurito e log persistente. |
| Rotazione descritta come universale | Rotazione `stack` applicata esclusivamente a P e C. |
| `roll` interpretato come permesso di modifica | Stato delle alternative: `1` disponibile, `0` non disponibile, ritorno a `1` dopo 15 giorni o a esaurimento. |
| Comando Roll come sinonimo di rigenerazione pasto | Roll UI locale C/P/V; Alternativa rigenera l'intero pasto. |
| Condimento scelto con cursore locale al template | LRU globale, aggiornata solo all'accettazione. |
| Controllo verdura ricorrente a posteriori | Vincolo attivo durante la selezione e preservato dalla normalizzazione. |
| Programmazione automatica anche per oggi | Programmazione da domani; oggi gestito nella pagina Pasto. |
| Test verde = requisito chiuso | Chiusura solo con invariante discriminante sul percorso runtime reale. |
| Vecchia UI PWA come applicazione principale | Restyling in `index.html`; `index-old.html` è backup. |

## 19. Ordine di sistemazione obbligatorio

### Fase 1 — Identità e osservabilità

Prima di cambiare la selezione:

- definire `dishKey`, `sourceKey` e `rotationKey` in un solo punto;
- tracciare per ogni candidato i motivi di esclusione;
- aggiungere la store persistente delle carenze di copertura;
- impedire che titoli o prefissi diversi aggirino la stessa identità.

**Criterio di uscita:** per ogni pasto generato è possibile spiegare quale candidato è stato scelto e perché gli altri sono stati esclusi.

### Fase 2 — Unicità settimanale

- applicare il vincolo su tutti i percorsi: generazione, rigenerazione, alternativa, Salvafrigo, manuale e blocchi;
- validare prima del commit atomico.

**Criterio di uscita:** nessun `dishKey` duplicato in una settimana; nessuna correzione a posteriori del titolo.

### Fase 3 — Stack e fallback dei 15 giorni

- usare esclusivamente lo stato binario `1` disponibile / `0` non disponibile;
- dopo l'uso portare lo stato da `1` a `0`;
- riportarlo da `0` a `1` dopo 15 giorni oppure quando il pool è esaurito;
- persistere la diagnostica;
- non toccare vincoli non rilassabili.

**Criterio di uscita:** un catalogo sufficiente non ripete; se il solo cooldown
impedisce la scelta, il reset completa e documenta la lacuna. Se mancano
candidati anche per i vincoli inderogabili, la diagnostica distingue questa
impossibilità dal cooldown e non salva una settimana invalida.

### Fase 4 — Rotazione P e C

- applicare lo stato binario `stack` alle ricette e fonti P e C;
- usare `sourceKey` per verificare la consecutività delle proteine;
- preservare il criterio già implementato che esclude la stessa proteina per
  due giorni consecutivi;
- lasciare V, S, G, condimenti e cotture alle rispettive logiche.

**Criterio di uscita:** P e C rispettano il ciclo binario dello stack e la
stessa proteina concreta non compare in due giorni consecutivi.

### Fase 5 — Salse, condimenti e dati anomali

- correggere ruoli e dosi nel catalogo;
- eliminare il fallback automatico alla porzione V;
- correggere nomi con ingredienti assenti;
- verificare la LRU globale.

**Criterio di uscita:** nessun aroma o sugo riceve 200–250 g senza dichiarazione esplicita; nome, distinta e quantità concordano.

### Fase 6 — Roll reale e integrazione UI

- decidere i controlli C/P/V visibili;
- collegarli alla sostituzione locale;
- escludere dal ciclo le alternative con `roll:0` e ripristinarle a `1` a
  esaurimento del pool;
- ricalcolare la realizzazione atomicamente.

**Criterio di uscita:** il Roll richiesto cambia un solo ruolo e il ciclo non ripete finché esistono alternative.

### Fase 7 — Regressioni mirate e rilascio

- verificare invarianti nutrizionali, carboidrati, verdura ricorrente, inventario e consumi;
- validare PWA reale e aggiornamento cache;
- aggiornare stato e matrice requisiti soltanto con prove discriminanti.

## 20. Prompt vincolanti per l'integrazione

La fonte operativa dei prompt è `docs/PROMPT_INTERVENTI_PWA.md`: contratto
comune, dipendenze dei 30 criteri, ordine d'integrazione, prompt numerati e
revisione finale. Questa sezione sostituisce i precedenti prompt A–F per
evitare istruzioni concorrenti.

Ogni intervento comprende le dipendenze tecniche necessarie a funzionare nel
sistema. Prima del codice si definiscono flusso, dati condivisi, lettori,
scrittori e invarianti. Una modifica isolata non chiude un criterio se i
percorsi collegati continuano ad aggirarlo.

Gli stati accettati in bozza sono aggiornati immediatamente nel contesto
temporaneo per impedire riusi negli slot successivi; la conferma li persiste
insieme al piano. Backtracking e annullamento eliminano soltanto i delta
provvisori. Il consumo è idempotente e non conta due volte l'uso pianificato.

I test selettivi attuali includono controlli statici: PASS non equivale a
funzionamento dimostrato. Ogni chiusura richiede una prova discriminante
sul percorso attivo e sui dati risultanti. La revisione finale verifica
anche le interazioni fra criteri e dichiara i limiti non verificati.

## 21. Anomalie note da non dichiarare risolte senza verifica

- Ripetizione dello stesso piatto o della stessa ricetta nella settimana.
- Ripetizione di ricette o fonti P/C mentre esistono alternative disponibili.
- Ripetizione della stessa proteina concreta in due giorni consecutivi.
- Quantità da porzione V assegnate a pomodoro da sugo o cipolla da condimento.
- Ricette “al pomodoro” prive di pomodoro nella distinta ingredienti.
- Campi `stack` e `roll` presenti ma non gestiti integralmente come stati
  binari `1 → 0 → 1` nei rispettivi percorsi.
- Cooldown che produce errore invece di recupero diagnostico.
- Test che passano su helper isolati ma non dimostrano il comportamento del PWA.
- Integrazione inventario/deperibilità nella programmazione ancora incompleta.
- Profilo vegano non garantito finché la macro legumi non offre sufficiente copertura interna compatibile.

## 22. Mappa completa delle fonti Markdown lette

I file identici nelle due repo sono stati letti una volta e confrontati byte per byte; i file divergenti sono stati letti e confrontati tra le due versioni.

| File | Uso nel consolidamento |
|---|---|
| `AGENTS.md` | Metodo, confini architetturali, fonti canoniche, registro e sicurezza delle modifiche. |
| `Vecchia versione 1.0/README.md` | Contesto storico, non operativo. |
| `docs/ARCHITETTURA_MOTOR_V12.md` | Responsabilità dei moduli, snapshot e flusso v12. |
| `docs/AUDIT_CONVERSIONE_RICETTARIO_SOSPESO.md` | Esiti della conversione e coperture dichiarate. |
| `docs/BASELINE_NUTRIZIONISTA_PDF_V1.md` | Quantità, frequenze, classificazioni e vincoli clinici. |
| `docs/LOTTO_F_CATALOGO_NUOVO.md` | Cataloghi correnti, classificazioni e immutabilità dei template. |
| `docs/LOTTO_G_GENERAZIONE_MANUALE_UI.md` | Realizzazioni, bozza, generazione, Roll, Salvafrigo e priorità operative. |
| `docs/LOTTO_H_CHECKLIST_RELEASE.md` | Controlli di rilascio e non regressione. |
| `docs/LOTTO_I_ACCESSI_RBAC_E_MIGRAZIONE_FIRESTORE.md` | Login, ruoli, whitelist, UID e migrazione cloud. |
| `docs/LOTTO_J_MOTORE_UNICO.md` | Motore unico, fattibilità, frequenze, rotazioni e criteri di selezione. |
| `docs/METODOLOGIA-CONVERSIONE-RICETTE.md` | Regole per aggiungere/correggere ricette senza recuperi legacy. |
| `docs/PIANO_REVISIONE_ROOT_NUOVO_DB.md` | Piano root, archivio visuale e disponibilità dei record. |
| `docs/REGISTRO_MODIFICHE.md` | Cronologia delle decisioni, correzioni, UI e limiti reali dei test. |
| `docs/REQUIREMENTS-MATRIX.md` | Requisiti tracciati e criteri HARD/UX. |
| `docs/SPECIFICA_FUNZIONALE_CORRENTE.md` | Contratto funzionale corrente prima di questo consolidamento. |
| `docs/STATO-NUOVO-RICETTARIO.md` | Stato e composizione del nuovo ricettario. |
| `docs/STATO_LOTTI_E_TEST.md` | Stato dichiarato dei lotti e delle verifiche. |
| `docs/STORICO_VERSIONE_1_0.md` | Decisioni superate e contesto storico. |
| `docs/ANOMALIE_DA_RISOLVERE.md` | Anomalie aperte specifiche di DietaPlanner2. |

## 23. Criterio finale di completezza del PWA

Il PWA è conforme soltanto quando:

- produce settimane nutrizionalmente valide senza duplicati di piatto;
- applica lo stato binario di disponibilità alle ricette e fonti P e C;
- applica il vincolo della stessa proteina concreta su due giorni consecutivi;
- tratta correttamente salse, condimenti e quantità;
- applica `stack` a P/C e `roll` alle alternative come stati `1` disponibile /
  `0` non disponibile, con ripristino dopo 15 giorni o a esaurimento secondo
  il relativo pool;
- usa il cooldown di 15 giorni come vincolo forte ma recuperabile e misura le carenze di catalogo;
- mantiene coerenti piano, inventario, spesa, nutrizione e storico;
- espone nel PWA reale le funzioni dichiarate;
- supera controlli deterministici che discriminano davvero il comportamento precedente;
- non usa dati o runtime della versione 1.0;
- non dichiara chiusi RBAC, scanner, cloud o anomalie finché non sono verificati nel loro percorso reale.

## Decisioni Cwe del 23/09/2026 — precedenza sulle formulazioni precedenti

- Riferimento nutrizionale: PDF originale letto nelle sue 22 pagine; applicare
  libertà e dosi, senza introdurre ulteriori divieti. Frutta ai pasti e/o agli
  spuntini, anche a colazione; spuntini facoltativi (pagine 10–13 e 19).
- Verdura ricorrente: all'esaurimento proseguire con le altre senza piantate.
- Dosi mancanti S/G: elaborate da Qwen, poi integrate nel catalogo esistente.
- Consumo effettivo: registrabile senza etichetta di violazione, sgarro o
  compensazione (pagine 2, 7 e 21); preservare il filtro allergeni nelle proposte.
- Accessi e politica di conservazione/cancellazione storico: lasciare come
  sono ora, senza nuove scelte o estensioni in questa fase.
- Il prompt di completamento recepisce queste decisioni; le sette domande
  precedentemente poste sono ritirate. Nessuna conformità runtime è attestata
  dalla sola correzione dei documenti.

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
