'use strict';
/* Regressione aggiornata: i vecchi FIXED/EXCLUDED sui carboidrati normali
   non sono più vincoli utente. Devono essere neutralizzati ad AUTO dal
   resolver/migrazione e non possono impedire la generazione dei 14 pasti. */
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
  const storico={};
  for(const k of N.PDF_BASELINE.carbohydrateUncapped)storico[k]={mode:k==='pasta'? 'excluded':'fixed',count:k==='pasta'?0:2};
  for(const k of Object.keys(N.PDF_BASELINE.carbohydrateWeeklyCaps))storico[k]={mode:'excluded',count:0};
  await global.put('impostazioni',{chiave:'configCarboidratiStati',valore:storico});

  await M.inizializza({basePath:''});
  const canonico=(await global.getOne('impostazioni','configCarboidratiStati')).valore;
  for(const k of N.PDF_BASELINE.carbohydrateUncapped){
    assert.deepEqual(canonico[k],{mode:'auto',count:0},k+' deve essere normalizzato AUTO');
  }

  const resolved=await M.caricaConfigurazioneNutrizionaleRisolta();
  assert.equal(resolved.carbohydrates.fixedTotal,0,'nessun carboidrato normale storico deve restare FIXED');
  assert.equal(resolved.carbohydrates.remainingSlots,14);
  assert.deepEqual(resolved.carbohydrates.autoEligibleKeys.slice().sort(),N.PDF_BASELINE.carbohydrateUncapped.slice().sort());

  const esito=await M.generaPianoSettimana(0,{forza:true});
  assert.deepEqual(esito.errori,[]);
  assert.equal(esito.generati.length,14);
  const piano=await global.getAll('piano');
  assert.equal(piano.length,14);
  for(const voce of piano){
    assert(voce.carboidratoPianificato,'ogni pasto deve avere un carboidrato');
    assert(N.PDF_BASELINE.carbohydrateUncapped.includes(voce.carboidratoPianificato),'con tutti i limitati a 0 il C deve provenire dal pool normale AUTO');
  }

  console.log('OK: vecchi FIXED/EXCLUDED normali neutralizzati, 14/14 pasti con soli carboidrati normali AUTO.');
})().catch(e=>{console.error(e);process.exit(1);});
