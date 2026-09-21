'use strict';
/* Regressione mirata: con 14 carboidrati FIXED normali e 0 slot AUTO,
   costruisciPastoSequenziale deve raggiungere anche il percorso
   PX + C.user separato dopo aver esaurito PX+C.user combinato. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const N=require('../nutrition-config.js');
const stores={};
for(const name of ['ingredienti','varianti','ricette','impostazioni','piano','consumoGiorno','inventario'])stores[name]=new Map();
global.getAll=async name=>[...(stores[name]||new Map()).values()].map(value=>structuredClone(value));
global.getOne=async(name,key)=>{const value=(stores[name]||new Map()).get(key);return value?structuredClone(value):null;};
global.put=async(name,value)=>{stores[name].set(value.id??value.chiave,structuredClone(value));return value;};
global.delKey=async(name,key)=>stores[name].delete(key);
global.fetch=async url=>({ok:true,json:async()=>JSON.parse(fs.readFileSync(path.join(root,String(url).split('?')[0]),'utf8'))});
global.todayISO=()=> '2026-08-30';
global.giorniSettimana=()=>['2026-08-31','2026-09-01','2026-09-02','2026-09-03','2026-09-04','2026-09-05','2026-09-06'];
let seed=123456789;
Math.random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
require('../motor-v12.js');
const M=global.DietaPlannerMotorV12;

(async()=>{
  await M.inizializza({basePath:''});

  const fixedCounts={
    riso:2,orzo:2,farro:2,pasta:2,pasta_fresca:2,cous_cous:2,pane:2
  };
  const states=Object.fromEntries(Object.entries(fixedCounts).map(([key,count])=>[key,{mode:'fixed',count}]));
  const resolved=N.resolveNutritionConfig({user:{carbohydrates:{states}}});
  assert.equal(resolved.carbohydrates.fixedTotal,14,'lo scenario deve avere 14 FIXED');
  assert.equal(resolved.carbohydrates.remainingSlots,0,'lo scenario deve avere 0 slot AUTO residui');

  const tabella={
    giorno_0:['carne','pesce'],
    giorno_1:['formaggi','uova'],
    giorno_2:['legumi','pesce'],
    giorno_3:['carne','formaggi'],
    giorno_4:['legumi','pesce'],
    giorno_5:['carne','formaggi'],
    giorno_6:['uova','legumi']
  };
  await global.put('impostazioni',{chiave:'tabellaGiornoCategoria',valore:tabella});
  await global.put('impostazioni',{chiave:'configCarboidratiStati',valore:states});

  const esito=await M.generaPianoSettimana(0,{forza:true});
  assert.deepEqual(esito.errori,[],'14 FIXED / 0 AUTO deve generare senza errori');
  assert.equal(esito.generati.length,14,'devono essere generati tutti i 14 pasti');

  const piano=await global.getAll('piano');
  assert.equal(piano.length,14,'il piano deve contenere 14 pasti');
  for(const voce of piano)assert(voce.carboidratoPianificato,'ogni pasto deve avere carboidratoPianificato');

  const conteggi={};
  for(const voce of piano)conteggi[voce.carboidratoPianificato]=(conteggi[voce.carboidratoPianificato]||0)+1;
  assert.deepEqual(conteggi,fixedCounts,'i conteggi FIXED finali devono coincidere esattamente con quelli scelti');
  for(const voce of piano)assert(Object.prototype.hasOwnProperty.call(fixedCounts,voce.carboidratoPianificato),'non deve essere usato alcun carboidrato AUTO');

  let percorsiSeparati=0;
  for(const voce of piano){
    const ricette=[];
    for(const real of voce.realizzazioni||[]){
      const r=await M.materializzaRealizzazione(real);
      if(r)ricette.push(r);
    }
    const haP=ricette.some(r=>M.copertura(r).P);
    const haC=ricette.some(r=>M.copertura(r).C);
    const haPXConC=ricette.some(r=>{const c=M.copertura(r);return c.P&&c.C;});
    if(haP&&haC&&!haPXConC)percorsiSeparati++;
  }
  assert(percorsiSeparati>0,'almeno un pasto deve dimostrare realmente il percorso PX + C.user separato');

  console.log('OK: 14 FIXED / 0 AUTO, 14 pasti generati, conteggi esatti, nessun AUTO, PX + C.user separato esercitato '+percorsiSeparati+' volte.');
})().catch(e=>{console.error(e);process.exit(1);});
