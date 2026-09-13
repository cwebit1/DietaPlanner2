'use strict';
/* Verifica cumulativa dei contenuti editoriali compilati in
   db-visuale.json (descrizione, procedimentoStrutturato), qualunque sia
   il numero di record completati finora attraverso i vari lotti:
   titoli/testi non vuoti, timer interi positivi, ogni {variantId}
   richiamato nel testo risolve contro gli ingredienti REALI della
   relativa ricetta concreta, 420 ID ancora univoci e completi. Non
   ricostruisce la lista dei record per lotto: verifica tutto ciò che
   risulta compilato al momento dell'esecuzione. */
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

(async()=>{
  const init=await M.inizializza({basePath:''});
  assert.equal(init.concrete,420,'il catalogo concreto deve restare di 420 ricette');
  const visual=JSON.parse(fs.readFileSync(path.join(root,'db-visuale.json'),'utf8'));

  const idsVisual=visual.ricette.map(r=>r.idRicetta);
  assert.equal(new Set(idsVisual).size,idsVisual.length,'nessun ID duplicato in db-visuale.json');
  assert.equal(idsVisual.length,420,'db-visuale.json deve coprire esattamente le 420 ricette concrete');

  const completi=visual.ricette.filter(r=>Object.prototype.hasOwnProperty.call(r,'procedimentoStrutturato')||Object.prototype.hasOwnProperty.call(r,'descrizione'));
  console.log('record con contenuti editoriali compilati finora:',completi.length,'su',idsVisual.length);

  for(const record of completi){
    const idRicetta=record.idRicetta;
    assert.equal(typeof record.descrizione,'string','descrizione mancante o non stringa per '+idRicetta);
    assert(record.descrizione.trim().length>0,'descrizione vuota per '+idRicetta);
    assert(Array.isArray(record.procedimentoStrutturato)&&record.procedimentoStrutturato.length>0,'procedimentoStrutturato vuoto o assente per '+idRicetta);

    const ricettaConcreta=M.getRicetta(idRicetta);
    assert(ricettaConcreta,'ricetta concreta non risolta dal motore per '+idRicetta);
    const variantIdReali=new Set((ricettaConcreta.ingredienti||[]).map(i=>i.variantId).filter(Boolean));

    for(const passo of record.procedimentoStrutturato){
      assert.equal(typeof passo.titolo,'string');
      assert(passo.titolo.trim().length>0,'titolo vuoto in un passo di '+idRicetta);
      assert.equal(typeof passo.testo,'string');
      assert(passo.testo.trim().length>0,'testo vuoto in un passo di '+idRicetta);
      if('timerSecondi' in passo){
        assert(Number.isInteger(passo.timerSecondi)&&passo.timerSecondi>0,'timerSecondi non intero positivo in un passo di '+idRicetta);
      }
      const riferimenti=[...passo.testo.matchAll(/\{([^{}]+)\}/g)].map(m=>m[1]);
      for(const variantId of riferimenti){
        assert(variantIdReali.has(variantId),'riferimento {'+variantId+'} nel passo "'+passo.titolo+'" di '+idRicetta+' non corrisponde a un ingrediente reale della ricetta');
      }
    }

    assert.equal(typeof record.percorsoImmagine,'string');
    assert.equal(typeof record.ricettaTestuale,'string');
    assert.equal(typeof record.disponibile,'boolean');
  }

  /* Nessun record NON compilato deve aver guadagnato i due campi nuovi
     come effetto collaterale di qualunque lotto. */
  const idCompletiSet=new Set(completi.map(r=>r.idRicetta));
  for(const record of visual.ricette){
    if(idCompletiSet.has(record.idRicetta))continue;
    assert(!Object.prototype.hasOwnProperty.call(record,'descrizione'),'descrizione inattesa su record non compilato: '+record.idRicetta);
    assert(!Object.prototype.hasOwnProperty.call(record,'procedimentoStrutturato'),'procedimentoStrutturato inatteso su record non compilato: '+record.idRicetta);
  }

  console.log('contenuti editoriali cumulativi in db-visuale.json: ok');
})().catch(error=>{console.error(error);process.exit(1);});
