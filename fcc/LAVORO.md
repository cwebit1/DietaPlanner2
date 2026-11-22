# LAVORO fcc — B-002 · Impianto dei test di regressione rotto

Piano approvato (2026-11-22). Passi in ordine, verifica ognuno. Se la realtà differisce dal piano, fermati e segnalalo. NON toccare il motore (`motor-v12.js`, `pwa-contracts.js`, `nutrition-config.js`, `index.html`).

## Causa (dall'analisi)
Dopo la scrittura dei test, il motore ha iniziato a: (a) scrivere nell'archivio `diagnosticaCopertura` già in `inizializza` (`motor-v12.js` ~r.3738); (b) salvare il piano tramite `commitPianoContratti` (in app: `index.html` r.1560). I test vecchi simulano il DB con `stores` senza `diagnosticaCopertura` e senza `global.commitPianoContratti`. Il modello corretto è già in `tests/b001-ripetizioni-settimanali.test.js` r.11-25.

## Passi
1. **Riproduci:** esegui con node `tests/lotto-g-weekly-generation.test.js`, `tests/lotto-j-vsg-stress.test.js`, `tests/lotto-carboidrati-stress-validazione.test.js`. Verifica: falliscono con i due errori noti.
2. **Allinea l'impianto** dei tre test a quello di `b001-ripetizioni-settimanali.test.js`: aggiungi `diagnosticaCopertura` agli archivi di `stores` e un `global.commitPianoContratti` che scrive i record nella memoria del test. Solo impianto, NON cambiare le asserzioni. Verifica: i tre test passano. Se uno fallisce su un'asserzione vera: fermati su quel test, registralo con `/zaha-bug`, non correggerlo.
3. **Suite completa:** esegui ogni `tests/*.test.js` con node (non `tests/fixtures`). Ai test che falliscono per lo stesso guasto (archivio mancante o `commitPianoContratti` mancante) applica la stessa correzione. Ogni altro fallimento: solo `/zaha-bug`, nessuna correzione. Verifica: elenco test passati/falliti e bug registrati.
4. **docs/BUGS.md:** voce B-001 → sostituisci `<hash-da-inserire-dopo-commit>` con `06c5e7a` e riscrivi `Esito:` aggiornato (cooldown verdure da `resolved.cooldownDays.verdure`, predefiniti C 15 gg / V 1 gg, commit e push fatti). B-002 → severità `high`, poi spostalo in `## Fixed` come riga singola con l'hash del commit.

## Fuori scope
- Modulo condiviso per l'impianto dei test.
- Correggere bug veri trovati al passo 3 (solo registrarli).

## A fine lavoro
1. Aggiorna `docs/REGISTRO_MODIFICHE.md` (formato esistente): B-002, causa, test toccati, esito suite.
2. Commit solo se i tre test del passo 2 sono verdi (i fallimenti del passo 3 registrati come bug non bloccano): `git pull --ff-only` (se fallisce fermati), aggiungi solo i file toccati (mai `git add -A`), messaggio `B-002: impianto test allineato a diagnosticaCopertura e commitPianoContratti`. Poi push su `origin main` senza `--force`; se rifiutato fermati.
3. Se i tre test non diventano verdi: niente commit né push, aggiorna B-002 in BUGS.md con `Esito:` e riporta l'errore.
4. Riepilogo breve in italiano: causa confermata, file cambiati, N test passati/falliti, bug nuovi (ID, severità, titolo), hash del commit e conferma del push.
