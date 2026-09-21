'use strict';
/* Regressione mirata: solo i carboidrati con tetto sono configurabili.
   0 = escluso; 1/2 = conteggio settimanale esatto; gli slot restanti
   devono essere completati da carboidrati normali AUTO. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const N=require('../nutrition-config.js');

const stores={};
for(const name of ['ingredienti','varianti','ricette','impostazioni','piano','consumoGiorno','inventario'])stores[name]=new Map();
function reset(){for(const m of Object.values(stores))m.clear();}
global.getAll=async name=>[...(stores[name]||new Map()).values()].map(value=>structuredClone(value));
global.getOne=async(name,key)=>{const value=(stores[name]||new Map()).get(key);return value===undefined?null:structuredClone(value);};
global.put=async(name,value)=>{stores[name].set(value.id??value.chiave,structuredClone(value));return value;};
global.delKey=async(name,key)=>stores[name].delete(key);
global.fetch=async url=>({ok:true,json:async()=>JSON.parse(fs.readFileSync(path.join(root,String(url).split('?')[0]),'utf8'))});
global.todayISO=()=> '2026-08-30';
global.giorniSettimana=()=>['2026-08-31','2026-09-01','2026-09-02','2026-09-03','2026-09-04','2026-09-05','2026-09-06'];
require('../motor-v12.js');
const M=global.DietaPlannerMotorV12;

function seedRng(n){
  let seed=n>>>0;
  Math.random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
}
function statiPer(spec){
  const states={};
  for(const k of N.PDF_BASELINE.carbohydrateUncapped)states[k]={mode:'auto',count:0};
  for(const k of Object.keys(N.PDF_BASELINE.carbohydrateWeeklyCaps)){
    const n=Number(spec[k])||0;
    states[k]=n>0?{mode:'fixed',count:n}:{mode:'excluded',count:0};
  }
  return states;
}
async function genera(spec,seed){
  reset();seedRng(seed);
  await M.inizializza({basePath:''});
  await put('impostazioni',{chiave:'configCarboidratiStati',valore:statiPer(spec)});
  M.invalidaConfigRuntime();
  const esito=await M.generaPianoSettimana(0,{forza:true});
  const rows=await getAll('piano'),counts={};
  for(const row of rows)counts[row.carboidratoPianificato]=(counts[row.carboidratoPianificato]||0)+1;
  return {esito,rows,counts};
}

(async()=>{
  // Tutti i limitati a 0: nessuno deve entrare automaticamente.
  let r=await genera({},1001);
  assert.deepEqual(r.esito.errori,[]);
  assert.equal(r.rows.length,14);
  for(const k of Object.keys(N.PDF_BASELINE.carbohydrateWeeklyCaps))assert.equal(r.counts[k]||0,0,k+' a 0 non deve comparire');
  for(const row of r.rows)assert(N.PDF_BASELINE.carbohydrateUncapped.includes(row.carboidratoPianificato));

  // Conteggi esatti.
  r=await genera({gnocchi:1},1002);
  assert.deepEqual(r.esito.errori,[]);
  assert.equal(r.counts.gnocchi,1);

  r=await genera({gnocchi:2},1003);
  assert.deepEqual(r.esito.errori,[]);
  assert.equal(r.counts.gnocchi,2);

  // Più limitati entro limitedCarbTotalMax: tutti esatti.
  r=await genera({gnocchi:1,crackers:1,pasta_ripiena:1},1004);
  assert.deepEqual(r.esito.errori,[]);
  assert.equal(r.counts.gnocchi,1);
  assert.equal(r.counts.crackers,1);
  assert.equal(r.counts.pasta_ripiena,1);
  assert.equal(r.rows.length,14);

  // Oltre il tetto cumulativo: resolver invalido prima della generazione.
  const over=N.resolveNutritionConfig({user:{carbohydrates:{states:statiPer({gnocchi:2,crackers:2})}}});
  assert.equal(over.valid,false);
  assert(over.errors.some(x=>x.includes('tetto applicativo totale')));

  console.log('OK: limitati 0/1/2 esatti, multipli entro tetto, resto AUTO normale.');
})().catch(e=>{console.error(e);process.exit(1);});
