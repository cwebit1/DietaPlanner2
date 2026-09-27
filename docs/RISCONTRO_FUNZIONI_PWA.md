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

Stati iniziali di sezione: da consolidare con gli esiti già disponibili, senza nuove certificazioni in questo aggiornamento documentale.

| # | Sezione | Funzioni comprese | Integrata | Funzionante |
|---|---|---|---|---|
| 1 | Configurazione nutrizionista | Quantità, frequenze, ricorrenze, allergeni, profili, limiti e valori iniziali | ◐ | ◐ |
| 2 | Set utente | Scelte P/C, preferenze, esclusioni consentite, verdure ricorrenti, colazione | 🔎 | 🔎 |
| 3 | Cataloghi | Ingredienti, ricette, classificazioni, dosi, immagini, disponibilità e aggiornamenti | 🔎 | 🔎 |
| 4 | Compilazione a strati | Proteine → combinazioni P+C → completamento C → residuo V con S/G | 🔎 | 🔎 |
| 5 | Esclusioni e rotazione | Stati binari, stack, roll, unicità, consecutività, esaurimento e log | 🔎 | 🔎 |
| 6 | Programmazione Menu | Generazione, settimane, blocchi, bozze, conferma e annullamento | 🔎 | 🔎 |
| 7 | Pasto del giorno | Proposte, cambio piatto, Roll P/C/V, Alternativa, Salvafrigo e speciali | 🔎 | 🔎 |
| 8 | Colazione, frutta e spuntini | Composizione, dosi, libertà di scelta, frequenze e contatori | ◐ | ◐ |
| 9 | Ricette e dettaglio | Consultazione, preferiti, ingredienti, quantità, procedimento, timer e assegnazione | 🔎 | 🔎 |
| 10 | Consumo e storico | Consumo automatico e manuale, correzioni, snapshot e conteggi | 🔎 | 🔎 |
| 11 | Nutrizione | Totali del giorno, frequenze settimanali, indicatori e grafici | 🔎 | 🔎 |
| 12 | Inventario | Inserimento/modifica, giacenze, scadenze, congelamento e scarico | 🔎 | 🔎 |
| 13 | Spesa e barcode | Fabbisogni, sottrazione scorte, acquisti, scansione e associazione prodotti | 🔎 | 🔎 |
| 14 | Navigazione e interfaccia | Calendario, caroselli, comandi, finestre e stati visualizzati | 🔎 | 🔎 |
| 15 | Account e dati | Accesso locale/Google, sincronizzazione, backup, ripristino e reset | 🔎 | 🔎 |
| 16 | PWA e manutenzione | Avvio, installazione, offline, cache, aggiornamenti e diagnostica | 🔎 | 🔎 |

## Ultimo aggiornamento

24/09/2026: salvati elenco e istruzioni permanenti. Nessuna modifica applicativa e nessun nuovo test runtime. Prove e difetti precedenti restano in ESITO_INTERVENTI_PWA.md; stato generale in STATO_LOTTI_E_TEST.md.


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
