# Criteri PWA e stato reale di implementazione

> **Fotografia dell’audit iniziale, non stato del codice modificato.**
> Per gli interventi in corso e le prove effettive vedere
> [ESITO_INTERVENTI_PWA.md](ESITO_INTERVENTI_PWA.md) e
> [STATO_LOTTI_E_TEST.md](STATO_LOTTI_E_TEST.md).

**Data verifica:** 22 settembre 2026  
**Repository verificato:** `DietaPlanner2`, root PWA corrente  
**Scopo:** conservare i criteri funzionali approvati e mostrare cosa è realmente
implementato e verificabile nel percorso attivo.

**Limite dell'audit:** gli stati sotto riportati sono la fotografia della verifica
indicata, non una certificazione dello stato corrente. I selettori aggiunti
successivamente includono verifiche statiche e non provano da soli questi stati.
Per chiudere ogni punto applicare il contratto comune e le prove funzionali di
`docs/PROMPT_INTERVENTI_PWA.md`; aggiornare le righe solo dopo la relativa prova.

## Legenda

- ✅ **Implementato e verificato:** percorso runtime presente e controllo mirato superato.
- 🟡 **Parziale:** esiste una parte concreta, ma il criterio completo non è dimostrato o presenta uno scostamento.
- ❌ **Da integrare:** comportamento assente oppure diverso dal criterio approvato.

## Lista verificata

| # | Criterio: cosa fa il PWA | Stato | Evidenza reale / integrazione necessaria |
|---:|---|:---:|---|
| 1 | Usa i nuovi cataloghi, compila le ricette in IndexedDB e collega `db-visuale.json` per ID. | 🟡 | `motor-v12.js` carica esclusivamente i tre cataloghi nuovi e sincronizza lo store `ricette`; il motore seleziona però dalla cache runtime compilata direttamente dai JSON, quindi il contratto “tutti leggono soltanto IndexedDB” non è letterale. |
| 2 | Ogni ricetta contiene identità, componenti, quantità, compatibilità, allergeni, disponibilità, `stack`, `roll` e nutrizione. | 🟡 | Tutti i 218 elementi del catalogo hanno `stack` e `roll`; le ricette concrete ricevono ID, ingredienti, quantità e nutrienti. Manca una classificazione allergeni aggregata e persistita su ogni ricetta; `stack/roll` restano metadati statici. |
| 3 | Risolve baseline, nutrizionista, profilo, utente e quantità della realizzazione con una gerarchia unica. | ✅ | `nutrition-config.js` è il resolver unico; `nutrition-config.test.js` e `lotto-resolver-unica-fonte-runtime.test.js` superati. |
| 4 | Classifica allergeni su ingredienti e ricette e applica le esclusioni in ogni percorso. | 🟡 | Tutti i 157 ingredienti hanno l'array `allergeni`; il motore filtra gli ingredienti tramite Setting nutrizionista. La ricetta non salva l'unione esplicita degli allergeni e manca una prova end-to-end per tutti i percorsi manuali/alternativi. |
| 5 | Applica frequenze proteiche, sottolimiti e due macro differenti tra pranzo e cena. | ✅ | Resolver e generazione Menu reale verificati; `lotto-set-proteine-menu-reale.test.js` ha prodotto 10 settimane senza violazioni di macro/target. |
| 6 | Ruota ricette/fonti P e C tramite stack e garantisce un giorno di distanza per la stessa proteina concreta. | ❌ | Esiste la rotazione AUTO della **macro** proteica D→D+1, già testata. `chiaviStack()` esclude C dal tracciamento principale e non esiste una `sourceKey` della proteina concreta: il criterio approvato P/C non è implementato. |
| 7 | Gestisce `stack` come stato binario `1 disponibile / 0 non disponibile`, con ripristino dopo 15 giorni o a esaurimento e log della carenza. | ❌ | Il runtime usa `chiaviStack` statiche più timestamp `ultimoUtilizzo`; non esegue il ciclo persistente `1 → 0 → 1` e non possiede una store diagnostica delle carenze. |
| 8 | Gestisce `roll` come stato binario delle alternative e ripristina a 1 dopo 15 giorni o a esaurimento. | ❌ | Il campo viene copiato dal catalogo, ma non viene consumato o aggiornato dal motore. Nessun ciclo runtime persistente `1 → 0 → 1`. |
| 9 | Assegna una sola occorrenza settimanale a ogni `dishKey` su tutti i percorsi. | ❌ | `dishKey` non esiste nel runtime. Le chiavi correnti e l'ordinamento morbido non garantiscono l'unicità del piatto; è coerente con i duplicati osservati nel PWA. |
| 10 | Programma da domani, usa una bozza settimanale, mantiene i blocchi e salva atomicamente. | ✅ | Bozza `menuDraft`, esclusione di oggi, scrittura atomica e blocchi per realizzazione presenti; test atomicità e lucchetti superati. |
| 11 | Costruisce ogni pasto nell'ordine P → C.user → C AUTO → S/G → residuo V. | ✅ | Flusso in `costruisciPastoSequenziale`; test di priorità `PX+C.user` e realizzazioni atomiche superati. |
| 12 | Inserisce C nei 14 pasti, gestisce AUTO/FIXED/EXCLUDED e i cap settimanali. | ✅ | Test quantità esatte dei carboidrati limitati e priorità C.user superati; validazione finale richiede `carbKeyUsato`. |
| 13 | Interroga la dispensa e ordina le verdure: ricorrente, deperibile, disponibile, spesa. | 🟡 | Priorità ricorrente verificata e funzioni inventario/deperibilità presenti. Manca un controllo end-to-end deterministico dell'intera sequenza con dispensa vuota e piena. |
| 14 | Distingue V, S e G e calcola il residuo quantitativo con soglia 50 g. | ✅ | Pipeline strutturata, semantica e soglia superano i test mirati V/S/G. |
| 15 | Assegna a sughi e condimenti ruolo, dose, compatibilità, allergeni e rotazione LRU. | ❌ | La LRU esiste, ma 14/14 ingredienti nei gruppi `Condimenti` sono privi di `dose`; resta aperta la famiglia “con pomodoro” senza pomodoro tracciato. Il caso dei 225 g non è risolto a monte. |
| 16 | Gestisce 10 g di olio al giorno, 5 g per pasto principale. | ✅ | Resolver canonico e test `lotto-olio-evo-quota-pasto.test.js` superato. |
| 17 | Offre Roll C/P/V locale al ruolo e ricalcola atomicamente la realizzazione. | ❌ | Le funzioni motore esistono, ma `index.html` non chiama `ruotaPasto()`/`statoRollPasto()`; usa `salvaRoll()` soltanto come committer di proposte complete. Il test Roll/VSG corrente fallisce. |
| 18 | Genera Alternativa come bozza completa e salva soltanto con conferma. | ✅ | `bozzePropostaPasto` mantiene la proposta in memoria; test anteprima senza scritture superato. |
| 19 | Genera Salvafrigo da scadenze, avanzi e freezer mantenendo i vincoli. | 🟡 | Funzioni e percorso UI sono presenti; la prova combinata Roll/Salvafrigo fallisce sul contratto corrente e manca una conferma end-to-end pulita del risultato finale. |
| 20 | Al consumo salva storico, scala inventario e aggiorna conteggi/stati. | ✅ | `elaboraConsumoAutomatico()` e lo store reale `piano` sono collegati; controllo mirato del consumo automatico superato. |
| 21 | Compone la colazione per gruppi, gestisce speciali e contatore morigerato. | 🟡 | Composizione, consumo, speciali e contatore esistono. La soglia runtime del messaggio è 5 e il flusso completo non ha una verifica mirata aggiornata ai criteri consolidati. |
| 22 | Distribuisce frutta e spuntini rispettando porzioni e cap. | 🟡 | Resolver frutta 2–3 porzioni da 150–200 g e cap spuntini presenti; manca la dimostrazione che la programmazione settimanale distribuisca realmente il minimo giornaliero. |
| 23 | La pagina Pasto mostra pasti, immagini, ingredienti, kcal, dettagli, Alternativa, Salvafrigo, Speciali e conferma. | ✅ | Renderer e azioni del PWA attivo sono collegati; il percorso funzionale Alternativa/Salvafrigo usa bozze. La resa visuale resta affidata alla verifica utente. |
| 24 | La pagina Menu mostra la settimana, le realizzazioni, i lucchetti, la bozza e la navigazione. | ✅ | Renderer Menu, carosello settimane, `menuDraft`, lucchetti e salvataggio presenti; test lucchetti superato. |
| 25 | Il dettaglio ricetta mostra contenuti, quantità, porzioni, nutrizione, procedimento e timer. | 🟡 | Descrizione, ingredienti, porzioni, nutrizione, procedimento strutturato, spunte e timer sono implementati. Gli allergeni della realizzazione non sono mostrati esplicitamente. |
| 26 | Inventario e spesa gestiscono g/ml/pezzi, giacenze, fabbisogno e `variantId`. | 🟡 | Store, calcolo fabbisogno, sottrazione giacenze e acquisto sono presenti; manca un controllo end-to-end mirato aggiornato sull'intero flusso spesa→inventario→consumo. |
| 27 | Legge barcode EAN-13, collega il prodotto a `variantId` e registra confezioni. | ❌ | Nessun codice scanner, `BarcodeDetector`, libreria EAN o accesso fotocamera è presente nel runtime. |
| 28 | Gestisce Google, modalità locale, UID, ruoli, whitelist e sincronizzazione Firestore. | 🟡 | Login Google persistente, profilo per UID e regole Firestore per proprietario presenti. Ruoli, whitelist e sincronizzazione completa dei dati applicativi non sono implementati; la UI stessa li dichiara futuri. |
| 29 | È installabile dalla root, usa manifest/service worker e funziona offline sui dati locali. | ✅ | `start_url:"."`, registrazione service worker, cache con fallback offline e icone presenti; test contratto PWA superato. |
| 30 | Verifica ogni modifica con controlli mirati sul percorso reale e aggiorna il registro. | 🟡 | Regole operative e molti test mirati esistono. Nell'audit corrente sono emersi test obsoleti e il conflitto reale Patate V disattivata/C FIXED. |

## Riepilogo

| Stato | Totale |
|---|---:|
| ✅ Implementato e verificato | 12 |
| 🟡 Parziale | 11 |
| ❌ Da integrare | 7 |

## Priorità di integrazione risultante

1. Identità canoniche `dishKey` per tutti i piatti, `sourceKey` per le proteine e `rotationKey` per lo stack P/C.
2. Stato binario reale `stack` per P/C, ripristino a esaurimento e log persistente.
3. Stato binario reale `roll` e collegamento Roll C/P/V alla UI attiva.
4. Unicità settimanale assoluta del piatto su tutti i percorsi.
5. Rotazione C e distanza giornaliera della proteina concreta.
6. Dosi esplicite di sughi/condimenti e correzione delle famiglie “al pomodoro”.
7. Aggregazione allergeni sulla ricetta e copertura dei percorsi manuali.
8. Correzione del conflitto Patate V disattivata/C FIXED.
9. Chiusura Salvafrigo e inventario/spesa con prove end-to-end mirate.
10. Barcode, ruoli/whitelist e sincronizzazione Firestore.

## Controlli eseguiti durante l'audit

- Sintassi: `nutrition-config.js`, `engine-core.js`, `motor-v12.js`,
  `firebase-auth.js`, `sw.js` e quattro script inline di `index.html` validi.
- Integrità catalogo: 157 ingredienti con array allergeni; 39 template; 218
  elementi ricetta con `stack` e `roll`; 420 record visuali con
  `disponibile` booleano.
- Test mirati superati: resolver nutrizionale, engine core, realizzazioni
  atomiche, carboidrati limitati, priorità C.user, due macro giornaliere,
  rotazione macro AUTO, verdura ricorrente, V/S/G, soglia 50 g, olio,
  anteprime, lucchetti, consumo reale, PWA e generazione Menu reale.
- Test mirati falliti: snapshot/catalogo con versione attesa obsoleta,
  Roll/VSG, auth vincolato al vecchio markup e preferenze runtime sul conflitto
  Patate.
- `git diff --check` eseguito dopo la stesura del prospetto.

## Script di verifica selettiva

Elenco dei 30 controlli disponibili:

```bash
node tests/criteri-pwa-selettivi.test.js --list
```

Verifica di un singolo criterio:

```bash
node tests/criteri-pwa-selettivi.test.js 7
```

Verifica di più criteri o di un intervallo:

```bash
node tests/criteri-pwa-selettivi.test.js 6,7,8,9
node tests/criteri-pwa-selettivi.test.js 6-9
```

Ogni controllo produce `PASS` oppure `FAIL`. Un requisito ancora da integrare
resta intenzionalmente rosso fino alla sua implementazione.

## Revisione finale

Dopo avere completato gli interventi:

```bash
node tests/revisione-finale-criteri-pwa.test.js
```

Il runner esegue una volta tutti i 30 controlli e stampa i numeri che falliscono.
L'esito positivo indica solo il superamento dei controlli implementati, molti
dei quali statici. La conformità funzionale richiede le prove discriminanti e
la revisione integrata definite in `docs/PROMPT_INTERVENTI_PWA.md`.
