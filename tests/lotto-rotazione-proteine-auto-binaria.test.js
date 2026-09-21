'use strict';
/* Regressione mirata 21/09/2026:
   - nelle celle AUTO una macro usata nel giorno D è NON_USABILE in D+1;
   - pranzo/cena dello stesso giorno restano sempre differenti;
   - una cella manuale può ripetere la macro del giorno precedente;
   - il primo giorno generato considera anche il giorno precedente esterno
     alla settimana quando esiste uno storico reale. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');

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

function rngSeed(n){
  let seed=n>>>0;
  Math.random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
}
async function genera(seed){
  rngSeed(seed);
  await M.inizializza({basePath:''});
  M.invalidaConfigRuntime();
  return M.generaPianoSettimana(0,{forza:true});
}
async function perGiorno(){
  const rows=(await getAll('piano')).sort((a,b)=>a.id.localeCompare(b.id));
  const out={};
  for(const row of rows)(out[row.id.slice(0,10)]??=[]).push(row.categoriaTarget);
  return out;
}
function verificaRotazioneAuto(byDay){
  const days=Object.keys(byDay).sort();
  for(let i=0;i<days.length;i++){
    const oggi=byDay[days[i]];
    assert.equal(new Set(oggi).size,oggi.length,days[i]+': pranzo/cena devono avere macro diverse');
    if(i>0){
      const ieri=new Set(byDay[days[i-1]]);
      assert(!oggi.some(x=>ieri.has(x)),days[i]+': una macro AUTO usata ieri non può ricomparire oggi');
    }
  }
}

(async()=>{
  // Stress deterministico: il vincolo deve essere hard, mai probabilistico.
  for(let run=0;run<40;run++){
    reset();
    const esito=await genera(70000+run);
    assert.deepEqual(esito.errori,[],'run '+run+': generazione valida attesa');
    assert.equal(esito.generati.length,14,'run '+run+': attesi 14 pasti');
    verificaRotazioneAuto(await perGiorno());
  }

  // Manuale prevale sul solo cooldown AUTO.
  reset();
  await put('impostazioni',{chiave:'tabellaGiornoCategoria',valore:{
    giorno_0:['carne','formaggi'],
    giorno_1:['carne']
  }});
  let esito=await genera(81001);
  assert.deepEqual(esito.errori,[]);
  const byManual=await perGiorno();
  assert.deepEqual(byManual['2026-08-31'],['carne','formaggi']);
  assert.equal(byManual['2026-09-01'][0],'carne','la cella manuale del martedì deve restare Carne');
  assert.notEqual(byManual['2026-09-01'][1],'carne','la seconda cella dello stesso giorno deve essere diversa');
  assert.notEqual(byManual['2026-09-01'][1],'formaggi','la cella AUTO non può riusare Formaggi del giorno precedente');

  // Primo giorno generato: usa lo storico reale del giorno precedente esterno.
  reset();
  await put('consumoGiorno',{id:'2026-08-30_pranzo',giorno:'2026-08-30',pasto:'pranzo',categoriaTarget:'carne',ricettaIds:[]});
  await put('consumoGiorno',{id:'2026-08-30_cena',giorno:'2026-08-30',pasto:'cena',categoriaTarget:'formaggi',ricettaIds:[]});
  esito=await genera(92001);
  assert.deepEqual(esito.errori,[]);
  const byStorico=await perGiorno();
  assert(!byStorico['2026-08-31'].includes('carne'),'lunedì AUTO non deve riusare Carne della domenica reale');
  assert(!byStorico['2026-08-31'].includes('formaggi'),'lunedì AUTO non deve riusare Formaggi della domenica reale');

  console.log('OK: rotazione proteica AUTO binaria verificata, incluse celle manuali e giorno precedente esterno.');
})().catch(e=>{console.error(e);process.exit(1);});
