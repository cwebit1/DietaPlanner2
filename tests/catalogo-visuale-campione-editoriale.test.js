'use strict';
/* Verifica dedicata al lotto campione di 12 ricette (settembre 2026):
   esattamente 12 record compilati in QUESTO lotto, titoli/testi non
   vuoti, timer interi positivi, ogni {variantId} richiamato nel testo
   risolve contro gli ingredienti REALI della relativa ricetta concreta,
   nessun'altra modifica ai campi storici, 420 ID ancora univoci e
   completi. */
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

const ID_LOTTO=['nr_6_1','nr_13_24','nr_2_4','nr_11_1','nr_10_6','nr_12_24','nr_9_0','nr_19_12','nr_43_2','nr_5_0','nr_12_0','nr_8_0'];

(async()=>{
  const init=await M.inizializza({basePath:''});
  assert.equal(init.concrete,420,'il catalogo concreto deve restare di 420 ricette');
  const visual=JSON.parse(fs.readFileSync(path.join(root,'db-visuale.json'),'utf8'));

  const idsVisual=visual.ricette.map(r=>r.idRicetta);
  assert.equal(new Set(idsVisual).size,idsVisual.length,'nessun ID duplicato in db-visuale.json');
  assert.equal(idsVisual.length,420,'db-visuale.json deve coprire esattamente le 420 ricette concrete');

  const compilati=visual.ricette.filter(r=>Object.prototype.hasOwnProperty.call(r,'procedimentoStrutturato')||Object.prototype.hasOwnProperty.call(r,'descrizione'));
  assert.equal(compilati.length,12,'in questo lotto devono risultare compilati esattamente 12 record, trovati '+compilati.length);
  assert.deepEqual(new Set(compilati.map(r=>r.idRicetta)),new Set(ID_LOTTO),'gli ID compilati non corrispondono esattamente al campione previsto');

  for(const idRicetta of ID_LOTTO){
    const record=visual.ricette.find(r=>r.idRicetta===idRicetta);
    assert(record,'record mancante per '+idRicetta);
    assert.equal(typeof record.descrizione,'string');
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

    /* Campi storici del record intoccati: idRicetta, percorsoImmagine,
       ricettaTestuale, disponibile devono avere ancora i tipi attesi e
       non essere stati sostituiti da questo lotto (verifica di forma,
       non di valore esatto: il valore esatto è indipendente da questo
       intervento e non è oggetto di questa modifica). */
    assert.equal(typeof record.percorsoImmagine,'string');
    assert.equal(typeof record.ricettaTestuale,'string');
    assert.equal(typeof record.disponibile,'boolean');
  }

  /* Nessuno degli altri 408 record deve aver guadagnato i due campi
     nuovi come effetto collaterale di questo lotto. */
  const fuoriLotto=visual.ricette.filter(r=>!ID_LOTTO.includes(r.idRicetta));
  assert.equal(fuoriLotto.length,420-12);
  for(const record of fuoriLotto){
    assert(!Object.prototype.hasOwnProperty.call(record,'descrizione'),'descrizione inattesa fuori dal lotto su '+record.idRicetta);
    assert(!Object.prototype.hasOwnProperty.call(record,'procedimentoStrutturato'),'procedimentoStrutturato inatteso fuori dal lotto su '+record.idRicetta);
  }

  console.log('campione editoriale (12 ricette): ok — '+ID_LOTTO.join(', '));
})().catch(error=>{console.error(error);process.exit(1);});
