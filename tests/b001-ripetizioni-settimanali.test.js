'use strict';
/* B-001: La programmazione settimanale ripropone sempre le stesse ricette.
   Riproduzione: genera 4 settimane consecutive con il catalogo reale
   (db-ricette.json) e seed fisso, conta ripetizioni (a) stessa ricetta nella
   stessa settimana e (b) stessa ricetta entro 15 giorni, stampa quando scatta
   il reset (diagnosticaCopertura). Il test deve FALLIRE alla prima esecuzione. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const stores={};
for(const name of ['ingredienti','varianti','ricette','impostazioni','piano','consumoGiorno','inventario','diagnosticaCopertura'])stores[name]=new Map();
global.getAll=async name=>[...(stores[name]||new Map()).values()].map(value=>structuredClone(value));
global.getOne=async(name,key)=>{const value=(stores[name]||new Map()).get(key);return value?structuredClone(value):null;};
global.put=async(name,value)=>{(stores[name]||new Map()).set(value.id??value.chiave,structuredClone(value));return value;};
global.delKey=async(name,key)=>(stores[name]||new Map()).delete(key);
global.commitPianoContratti=async(records,deleted,result)=>{
  for(const v of records)await put('piano',v);
  for(const id of deleted)await delKey('piano',id);
  await put('impostazioni',{chiave:'stackBinario',valore:result.stack});
  for(const row of result.diagnostics)await put('diagnosticaCopertura',row);
};
global.fetch=async url=>({ok:true,json:async()=>JSON.parse(fs.readFileSync(path.join(root,String(url).split('?')[0]),'utf8'))});
global.todayISO=()=>'2026-08-30';
/* 4 settimane consecutive a partire da lunedì 31/08/2026 (tutte dopo today). */
const settimane=[
  ['2026-08-31','2026-09-01','2026-09-02','2026-09-03','2026-09-04','2026-09-05','2026-09-06'],
  ['2026-09-07','2026-09-08','2026-09-09','2026-09-10','2026-09-11','2026-09-12','2026-09-13'],
  ['2026-09-14','2026-09-15','2026-09-16','2026-09-17','2026-09-18','2026-09-19','2026-09-20'],
  ['2026-09-21','2026-09-22','2026-09-23','2026-09-24','2026-09-25','2026-09-26','2026-09-27'],
];
global.giorniSettimana=(scarto)=>settimane[Math.min(Math.floor(Number(scarto||0)/7),settimane.length-1)];

/* Seed fisso per riproduribilità (il motore usa Math.random quando ctx.rng manca). */
const origRandom=Math.random;
let seed=0xC0FFEE12;
Math.random=function(){seed=(seed*1664525+1013904223)>>>0;return (seed>>>0)/0xFFFFFFFF;};

require('../motor-v12.js');
const M=global.DietaPlannerMotorV12;

function giornoNumero(d){return Math.floor(Date.parse(String(d).slice(0,10)+'T12:00:00Z')/86400000);}

(async()=>{
  const init=await M.inizializza({basePath:''});
  console.log('inizializza:',JSON.stringify(init));
  const ricette=M.getRicette();
  console.log('catalogo ricette concrete:',ricette.length);

  const tutte=[]; // {id,nome,data,slot}
  const resetSegnalati=[];

  for(const [w,settimana] of settimane.entries()){
    const result=await M.generaPianoSettimana(w*7,{forza:true});
    console.log('settimana '+(w+1)+' errori:',JSON.stringify(result.errori));
    assert.deepEqual(result.errori,[],'generazione settimana '+(w+1)+' deve completarsi senza errori');
    const records=await global.getAll('piano');
    const recSettimana=records.filter(r=>settimana.includes(String(r.id).slice(0,10)));
    console.log('settimana '+(w+1)+' record generati:',recSettimana.length);
    for(const rec of recSettimana){
      for(const real of rec.realizzazioni){
        const recipe=await M.materializzaRealizzazione(real);
        if(recipe)tutte.push({id:recipe.id,nome:recipe.nome,data:String(rec.id).slice(0,10),slot:rec.pasto});
      }
      if(rec.diagnosticaCopertura&&rec.diagnosticaCopertura.length){
        resetSegnalati.push({slot:rec.id,righe:rec.diagnosticaCopertura.map(x=>({id:x.id,requisito:x.requisito,causa:x.causa}))});
      }
    }
  }

  // (a) stessa ricetta (id) ripetuta nella stessa settimana
  const ripetuteSettimana=[];
  const perSettimana=new Map();
  for(const t of tutte){
    const inizio=new Date(settimane[0][0]);
    const wIdx=Math.floor((giornoNumero(t.data)-giornoNumero(settimane[0][0]))/7);
    if(wIdx<0||wIdx>=settimane.length)continue;
    const chiave='w'+wIdx;
    if(!perSettimana.has(chiave))perSettimana.set(chiave,new Map());
    const m=perSettimana.get(chiave);
    if(!m.has(t.id))m.set(t.id,[]);
    m.get(t.id).push(t.data+' '+t.slot);
  }
  for(const [wIdx,m] of perSettimana.entries()){
    for(const [id,usate] of m.entries()){
      if(usate.length>1)ripetuteSettimana.push({settimana:wIdx,id,usate});
    }
  }

  // (b) stessa ricetta ripetuta entro 15 giorni (date diverse)
  const perRicetta=new Map();
  for(const t of tutte){
    if(!perRicetta.has(t.id))perRicetta.set(t.id,[]);
    perRicetta.get(t.id).push(t.data);
  }
  const ripetute15giorni=[];
  for(const [id,date] of perRicetta.entries()){
    date.sort();
    for(let i=0;i<date.length;i++)for(let j=i+1;j<date.length;j++){
      const diff=giornoNumero(date[j])-giornoNumero(date[i]);
      if(diff>0&&diff<15)ripetute15giorni.push({id,data1:date[i],data2:date[j],giorni:diff});
    }
  }

  console.log('--- RIPETIZIONI STESSA SETTIMANA ---');
  console.log(JSON.stringify(ripetuteSettimana,null,1));
  console.log('--- RIPETIZIONI ENTRO 15 GIORNI ---');
  console.log(JSON.stringify(ripetute15giorni,null,1));
  console.log('--- RESET SCATTATI (diagnosticaCopertura) ---');
  console.log(JSON.stringify(resetSegnalati,null,1));

  assert.equal(ripetuteSettimana.length,0,'(a) nessuna ricetta ripetuta nella stessa settimana');
  assert.equal(ripetute15giorni.length,0,'(b) nessuna ricetta ripetuta entro 15 giorni');
  console.log('B-001 OK: nessuna ripetizione settimanale né entro 15 giorni');
})().catch(error=>{console.error(error);process.exit(1);});
