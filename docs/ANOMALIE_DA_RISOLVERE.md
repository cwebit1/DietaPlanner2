# Anomalie del catalogo da risolvere

File dedicato per segnalare anomalie riscontrate nei dati funzionali
(`db-ricette.json`, `ingredienti-new.json`) durante il lavoro editoriale
su `db-visuale.json`. Non è un log cronologico delle modifiche (quello è
`docs/REGISTRO_MODIFICHE.md`): qui restano solo le anomalie aperte, da
condividere e risolvere a monte, nel catalogo funzionale — non
correggibili né aggirabili dal lato editoriale/visuale.

---

## 1. Famiglia "con pomodoro" (molluschi/crostacei): pomodoro non tracciato come ingrediente

**Segnalata il:** 11 settembre 2026, durante la compilazione del
campione editoriale di 12 ricette.

**Ricetta che ha fatto emergere il problema:** `nr_37_0`, "Linguine con
Cozze e pomodoro". Ingredienti realmente presenti nella ricetta
concreta: solo `nrv_linguine` e `nrv_cozze`. Nessun `nrv_pomodoro_fresco`
o variante equivalente, nonostante il nome del piatto lo dichiari
esplicitamente.

**Portata:** non è un caso isolato. L'intera famiglia di ricette "con
pomodoro" a base di molluschi/crostacei condivide lo stesso schema —
verificato su:

- `nr_37_0..8` (Linguine/Spaghetti/Tagliolini con Cozze/Gamberetti/Vongole e pomodoro)
- `nr_38_0..5` (stessa famiglia, variante)

In tutti questi record il pomodoro compare nel nome ma non tra gli
ingredienti tracciati.

**Impatto:** chiunque compili contenuti editoriali (descrizione,
procedimento strutturato) per queste ricette rischia di descrivere un
ingrediente che il motore non conosce, con riferimenti `{variantId}`
che non potrebbero mai risolvere. Per `nr_37_0` il procedimento è stato
scritto evitando di nominare il pomodoro come ingrediente aggiunto
(nessun riferimento inventato), ma la ricetta resta editorialmente
monca rispetto al proprio nome.

**Non risolta qui:** la correzione appartiene a `db-ricette.json` (o
alla sua fonte di conversione, vedi
`docs/METODOLOGIA-CONVERSIONE-RICETTE.md`), non a `db-visuale.json` —
fuori dal perimetro di questo intervento editoriale. `nr_37_0` è stato
escluso dal campione compilato in via definitiva, sostituito con
`nr_8_0` (Farro perlato con Taleggio e Speck) per la stessa categoria
("più passaggi") — vedi `docs/REGISTRO_MODIFICHE.md`.

**Da fare (non in questo intervento):** verificare l'intera famiglia
`nr_37_*`/`nr_38_*` nel processo di conversione/generazione di
`db-ricette.json` e aggiungere il pomodoro come ingrediente tracciato
con una quantità realistica, oppure correggere il nome delle ricette se
il pomodoro non fa davvero parte della preparazione.
