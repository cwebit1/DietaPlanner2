# LAVORO fcc — B-001 · La programmazione settimanale ripropone sempre le stesse ricette

Piano già approvato (2026-11-22). Esegui i passi in ordine, verificando ognuno. Se la realtà differisce dal piano (ipotesi sbagliata, file nuovo necessario oltre al test), fermati e segnalalo. Commit e push sono autorizzati solo come descritto in "A fine lavoro".

## Contesto (dall'analisi, da confermare al passo 1)
- Il bug: le stesse **ricette** (stessa ricetta del catalogo) si ripetono **sia nella stessa settimana sia tra settimane diverse**.
- La rotazione reale è in `pwa-contracts.js` r.55-68: `hardReason` vieta stesso `dishKey` nella settimana e proteina in giorni consecutivi; `availability`/`filter` bloccano chiavi P/C (+ `ricetta:<dishKey>`) per `rotationDays.stack` = 15 giorni (`nutrition-config.js` r.45).
- Ipotesi 1: `cooldownOk` / `registraUtilizzo` (`motor-v12.js` r.964-990) sembrano mai chiamati e la generazione passa sempre `ignoraCooldown:true` → criteri di rotazione impostati lì senza effetto.
- Ipotesi 2: quando il pool si esaurisce, `costruisciPastoSequenziale` (`motor-v12.js` r.2478-2496, analogo `completaPastoConBloccate` ~r.2650) prova `resetRoles` `[C]`, `[P]`, `[P,C]`; con qualsiasi reset cadono anche le chiavi `ricetta:` → la ricetta può tornare, e la scelta tra i candidati non privilegia i meno usati di recente.
- Ipotesi 3: ricette senza ingredienti P né C hanno `rotationKeys` vuote (`pwa-contracts.js` r.19-20) → mai ruotate.
- La cronologia della settimana in corso viene aggiornata durante la generazione (`motor-v12.js` r.3008).

## Passi

1. **Riproduci.** Crea `tests/b001-ripetizioni-settimanali.test.js` basandoti sull'harness di `tests/lotto-g-weekly-generation.test.js`. Genera 4 settimane consecutive con il catalogo reale (`db-ricette.json`) e seed fissi. Conta: (a) stessa ricetta (id) ripetuta nella stessa settimana, (b) stessa ricetta ripetuta entro 15 giorni; stampa quando scatta il reset e con quali `resetRoles` (`diagnosticaCopertura`).
   Verifica: il test oggi FALLISCE. Riporta quale delle 3 ipotesi è confermata (anche: `registraUtilizzo`/`cooldownOk` hanno chiamanti reali?).

2. **Stessa settimana.** In `pwa-contracts.js` `hardReason`: vieta la stessa ricetta nella stessa settimana anche dopo qualsiasi reset. Se il doppione è davvero inevitabile (nessuna alternativa), non bloccare la generazione: ammettilo e registralo nelle diagnostiche.
   Verifica: la parte (a) del test B-001 passa.

3. **Tra settimane.** Nel ramo con reset (`motor-v12.js` ~r.2485 e `completaPastoConBloccate`), ordina i candidati per uso meno recente: prima ultima data d'uso più vecchia (mai usata = prima), poi meno utilizzi nei 15 giorni. Se il passo 1 conferma l'ipotesi 3, aggiungi una chiave di rotazione `ricetta:<dishKey>` anche alle ricette senza P/C. Segui i pattern esistenti, nessuna nuova astrazione.
   Verifica: il test B-001 passa per intero.

4. **Regressioni.** Esegui i test esistenti, almeno `lotto-g-weekly-generation`, `lotto-j-vsg-stress`, `lotto-carboidrati-stress-validazione` (idealmente tutta `tests/`).
   Verifica: tutti verdi.

## Rischi
- Vincolo più stretto + catalogo piccolo → settimana non generabile: mantenere il ripiego "doppione inevitabile" con diagnostica, mai un errore bloccante.
- Non toccare piani/storico già salvati.

## Fuori scope
- Rimuovere o riattivare `cooldownOk`/`registraUtilizzo`: solo segnalare se sono codice morto.
- Cambiare l'intervallo di 15 giorni.
- Aggiungere ricette al catalogo.

## A fine lavoro
1. **Documenta.**
   - `docs/BUGS.md`: sposta B-001 in `## Fixed` come riga singola (`- B-001 [med] - · La programmazione settimanale ripropone sempre le stesse ricette · fixed <data> in <hash>`), dopo il commit inserisci l'hash corto. Se non risolto del tutto, lascialo in `## Open` e aggiungi una riga `Esito:` con causa confermata e cosa resta.
   - `docs/REGISTRO_MODIFICHE.md`: nuova voce nel formato esistente (data, B-001, causa confermata, file toccati, test aggiunto, esito dei test).
2. **Commit** — solo se tutti i test del passo 4 sono verdi:
   - prima `git pull --ff-only` su `main`; se fallisce, fermati e segnalalo.
   - aggiungi solo i file toccati da questo lavoro (codice, test, `docs/BUGS.md`, `docs/REGISTRO_MODIFICHE.md`, `fcc/LAVORO.md`), mai `git add -A`.
   - messaggio: `B-001: niente ricette ripetute nella programmazione settimanale` + riga vuota + 2-4 righe sulla causa e la correzione.
3. **Push** su `origin main`. Mai `--force`. Se viene rifiutato, fermati e segnalalo.
4. **Se un test fallisce o un passo si blocca:** niente commit né push; aggiorna comunque `docs/BUGS.md` con `Esito:` e riporta l'errore.
5. **Riepilogo finale** (breve, in italiano): causa confermata, cosa è cambiato e in quali file, esito dei test, hash del commit e conferma del push (o perché non è stato fatto).
