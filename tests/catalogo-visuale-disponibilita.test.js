'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const stores={};
for(const nome of ['ingredienti','varianti','ricette','impostazioni','piano','consumoGiorno','inventario'])stores[nome]=new Map();
global.getAll=async nome=>[...(stores[nome]||new Map()).values()].map(v=>structuredClone(v));
global.getOne=async(nome,chiave)=>{const v=(stores[nome]||new Map()).get(chiave);return v?structuredClone(v):null;};
global.put=async(nome,valore)=>{(stores[nome]||new Map()).set(valore.id??valore.chiave,structuredClone(valore));return valore;};
global.delKey=async(nome,chiave)=>(stores[nome]||new Map()).delete(chiave);
global.fetch=async url=>({ok:true,json:async()=>JSON.parse(fs.readFileSync(path.join(root,String(url).split('?')[0]),'utf8'))});

require('../motor-v12.js');
const M=global.DietaPlannerMotorV12;

/* Estrae dal sorgente reale di index.html le due funzioni di risoluzione
   con precedenza (locale -> visuale -> fallback legacy), per verificarle
   isolatamente senza un browser. Sono autosufficienti (solo
   Object.prototype.hasOwnProperty e Array.isArray), quindi valutabili
   fuori contesto senza mock aggiuntivi. Se il sorgente cambia forma al
   punto da non farle piu' trovare, il test fallisce qui esplicitamente
   invece di saltare silenziosamente la verifica. */
function estraiResolver(){
  const sorgente=fs.readFileSync(path.join(root,'index.html'),'utf8');
  const inizio=sorgente.indexOf('function risolviDescrizioneRicetta');
  const fine=sorgente.indexOf('async function apriModalDettaglioRicetta');
  assert(inizio>=0&&fine>inizio,'risolviDescrizioneRicetta/risolviProcedimentoStrutturatoRicetta non trovate in index.html: precondizione (dettaglio ricetta) non presente o cambiata forma');
  const codice=sorgente.slice(inizio,fine);
  /* new Function invece di vm.createContext: esegue nello stesso realm
     del test, cosi' gli array/oggetti restituiti sono confrontabili con
     assert.deepEqual senza il falso negativo di "not reference-equal"
     che si presenta tra oggetti nativi di realm diversi. */
  const fabbrica=new Function(codice+'\nreturn {risolviDescrizioneRicetta,risolviProcedimentoStrutturatoRicetta};');
  return fabbrica();
}

(async()=>{
  const init=await M.inizializza({basePath:''});
  const visual=JSON.parse(fs.readFileSync(path.join(root,'db-visuale.json'),'utf8'));
  const idsVisual=visual.ricette.map(r=>r.idRicetta);
  const idsConcrete=M.getRicette().map(r=>r.id);

  assert.equal(init.concrete,420);
  assert.equal(new Set(idsVisual).size,idsVisual.length,'db-visuale.json non deve contenere ID duplicati');
  assert.deepEqual(new Set(idsVisual),new Set(idsConcrete),'il catalogo visuale deve coprire esattamente le ricette concrete (420 ID invariati)');

  const CAMPI_STORICI=['idRicetta','percorsoImmagine','ricettaTestuale','disponibile'];
  const CAMPI_FACOLTATIVI=new Set(['descrizione','procedimentoStrutturato']);
  for(const row of visual.ricette){
    for(const chiave of CAMPI_STORICI)assert(Object.prototype.hasOwnProperty.call(row,chiave),'campo storico mancante: '+chiave+' su '+row.idRicetta);
    for(const chiave of Object.keys(row))assert(CAMPI_STORICI.includes(chiave)||CAMPI_FACOLTATIVI.has(chiave),'campo non atteso su '+row.idRicetta+': '+chiave);
    assert.equal(typeof row.disponibile,'boolean');
    if('descrizione' in row)assert.equal(typeof row.descrizione,'string','descrizione deve essere una stringa quando presente ('+row.idRicetta+')');
    if('procedimentoStrutturato' in row){
      assert(Array.isArray(row.procedimentoStrutturato),'procedimentoStrutturato deve essere un array quando presente ('+row.idRicetta+')');
      for(const passo of row.procedimentoStrutturato){
        assert.equal(typeof passo,'object','ogni passo deve essere un oggetto ('+row.idRicetta+')');
        if(passo.titolo!==undefined)assert.equal(typeof passo.titolo,'string');
        if(passo.testo!==undefined)assert.equal(typeof passo.testo,'string');
        if('timerSecondi' in passo){
          assert(Number.isInteger(passo.timerSecondi)&&passo.timerSecondi>0,'timerSecondi deve essere un intero positivo quando presente ('+row.idRicetta+')');
        }
      }
    }
  }

  const target=M.getRicette()[0];
  const altro=M.getRicette()[1];
  await M.applicaDisponibilitaCatalogoVisuale(M.getRicette(),{
    ricette:[{idRicetta:target.id,percorsoImmagine:'',ricettaTestuale:'',disponibile:false}]
  });
  assert.equal(M.getRicetta(target.id).disponibile,false,'la ricetta disattivata deve restare risolvibile per storico e dettagli');
  assert(!M.getRicetteDisponibili().some(r=>r.id===target.id),'la ricetta disattivata non deve essere proponibile');
  assert.equal(M.getRicetta(altro.id).disponibile,true,'un ID visuale assente deve restare disponibile');
  assert.equal(await M.ricettaAmmessa(M.getRicetta(target.id),'2026-09-11',{}),false,'il filtro comune deve respingere la ricetta disattivata');
  assert.equal((await global.getOne('ricette',target.id)).disponibile,false,'il flag deve essere sincronizzato nella cache IndexedDB');

  await assert.rejects(
    M.applicaDisponibilitaCatalogoVisuale(M.getRicette(),{ricette:[{idRicetta:target.id},{idRicetta:target.id}]}),
    /ID duplicato/
  );

  /* Il motore deve usare SOLO "disponibile" per la logica funzionale:
     applicare un record visuale con contenuti editoriali non deve
     alterare in alcun modo i campi funzionali della ricetta concreta. */
  const primaSnapshot=JSON.stringify(M.getRicetta(altro.id));
  await M.applicaDisponibilitaCatalogoVisuale(M.getRicette(),{
    ricette:[{idRicetta:altro.id,percorsoImmagine:'',ricettaTestuale:'',disponibile:true,descrizione:'Contenuto editoriale di prova',procedimentoStrutturato:[{titolo:'Passo',testo:'Testo',timerSecondi:60}]}]
  });
  assert.equal(JSON.stringify(M.getRicetta(altro.id)),primaSnapshot,'i contenuti editoriali del record visuale non devono alterare la ricetta funzionale');
  assert(!Object.prototype.hasOwnProperty.call(M.getRicetta(altro.id),'descrizione'),'descrizione non deve entrare nello store funzionale ricette');

  /* Accessor di sola lettura getContenutoVisualeRicetta: si appoggia al
     db-visuale.json realmente caricato da inizializza(), quindi lo si
     verifica reinizializzando il motore con un fetch che serve una copia
     modificata di db-visuale.json (stessi 420 ID, un solo record con i
     due campi editoriali aggiunti) - stesso percorso di caricamento
     reale, nessun accesso allo stato interno del modulo. */
  const fetchOriginale=global.fetch;
  const visualeModificato=JSON.parse(JSON.stringify(visual));
  const rigaAltro=visualeModificato.ricette.find(r=>r.idRicetta===altro.id);
  rigaAltro.descrizione='Contenuto editoriale di prova';
  rigaAltro.procedimentoStrutturato=[{titolo:'Passo',testo:'Testo',timerSecondi:60}];
  global.fetch=async url=>{
    if(String(url).split('?')[0].endsWith('db-visuale.json'))return {ok:true,json:async()=>visualeModificato};
    return fetchOriginale(url);
  };
  await M.inizializza({basePath:''});
  global.fetch=fetchOriginale;

  const contenuto=M.getContenutoVisualeRicetta(altro.id);
  assert.equal(contenuto.descrizione,'Contenuto editoriale di prova');
  assert.equal(contenuto.procedimentoStrutturato[0].testo,'Testo');
  contenuto.descrizione='alterato dal chiamante';
  assert.notEqual(M.getContenutoVisualeRicetta(altro.id).descrizione,'alterato dal chiamante','la copia restituita non deve riflettersi sullo stato interno');
  assert.equal(M.getContenutoVisualeRicetta('id-inesistente-xyz'),null,'un ID assente dal catalogo visuale deve restituire null, mai un record fittizio');
  assert(!Object.prototype.hasOwnProperty.call(M.getRicetta(altro.id),'descrizione'),'anche dopo la reinizializzazione, descrizione non deve entrare nello store funzionale ricette');

  /* Prova mirata della precedenza: override locale -> contenuto
     visuale -> fallback legacy. */
  const {risolviDescrizioneRicetta,risolviProcedimentoStrutturatoRicetta}=estraiResolver();
  const visuale={descrizione:'Dal catalogo visuale',procedimentoStrutturato:[{titolo:'Dal visuale',testo:'x'}]};

  assert.equal(risolviDescrizioneRicetta({descrizione:'Override locale'},visuale),'Override locale','l\'override locale deve vincere sul contenuto visuale');
  assert.equal(risolviDescrizioneRicetta({},visuale),'Dal catalogo visuale','senza override locale deve usare il contenuto visuale');
  assert.equal(risolviDescrizioneRicetta({},null),null,'senza nessuna fonte deve restituire null (fallback legacy gestito a valle)');

  assert.deepEqual(risolviProcedimentoStrutturatoRicetta({procedimentoStrutturato:[{titolo:'Locale',testo:'y'}]},visuale),[{titolo:'Locale',testo:'y'}],'l\'override locale non vuoto deve vincere sul contenuto visuale');
  assert.deepEqual(risolviProcedimentoStrutturatoRicetta({},visuale),[{titolo:'Dal visuale',testo:'x'}],'senza override locale deve usare il contenuto visuale');
  assert.deepEqual(risolviProcedimentoStrutturatoRicetta({procedimentoStrutturato:[]},visuale),[],'un array locale esplicitamente vuoto deve selezionare il fallback legacy SENZA essere scavalcato dal contenuto visuale');
  assert.deepEqual(risolviProcedimentoStrutturatoRicetta({},null),[],'senza nessuna fonte deve restituire array vuoto (fallback legacy gestito a valle)');

  /* I due gestori devono preservare i campi nuovi: normalizeRecord non
     deve ricostruire il record con soli quattro campi. */
  for(const file of ['gestore-ricette.html','gestore-ricette-github.html']){
    const sorgente=fs.readFileSync(path.join(root,file),'utf8');
    assert(sorgente.includes('row.descrizione'),file+': normalizeRecord deve preservare descrizione');
    assert(sorgente.includes('row.procedimentoStrutturato'),file+': normalizeRecord deve preservare procedimentoStrutturato');
    assert(sorgente.includes('data-field="descrizione"'),file+': manca il campo di modifica per descrizione');
    assert(sorgente.includes('data-field="procedimentoStrutturatoTesto"'),file+': manca il campo di modifica per il procedimento strutturato');
    assert(sorgente.includes('data-field="disponibile"'));
  }
  assert(!fs.readFileSync(path.join(root,'gestore-ricette-github.html'),'utf8').match(/id="search"|id="filter"/),'gestore-ricette-github.html non deve reintrodurre Cerca o Filtro');
  assert(fs.readFileSync(path.join(root,'gestore-ricette.html'),'utf8').includes("a.download='db-visuale.json'"));

  /* Lo script di sincronizzazione deve preservare i campi facoltativi
     per gli ID rimasti validi, senza generarne il contenuto. */
  const sync=fs.readFileSync(path.join(root,'tools/sincronizza-db-visuale.js'),'utf8');
  assert(sync.includes('prima.descrizione'),'sincronizza-db-visuale.js deve preservare descrizione');
  assert(sync.includes('prima.procedimentoStrutturato'),'sincronizza-db-visuale.js deve preservare procedimentoStrutturato');

  console.log('catalogo visuale, disponibilita e contenuti editoriali: ok');
})().catch(error=>{console.error(error);process.exit(1);});
