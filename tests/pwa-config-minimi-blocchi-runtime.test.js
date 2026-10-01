'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
const stores={};
for(const name of ['ingredienti','varianti','ricette','impostazioni','piano','consumoGiorno','inventario','diagnosticaCopertura'])stores[name]=new Map();
global.getAll=async name=>[...stores[name].values()].map(v=>structuredClone(v));
global.getOne=async(name,key)=>structuredClone(stores[name].get(key));
global.put=async(name,v)=>{stores[name].set(v.id??v.chiave,structuredClone(v));return v;};
global.delKey=async(name,key)=>stores[name].delete(key);
global.commitPianoContratti=async(records,deleted,result)=>{
  for(const v of records)await put('piano',v);
  for(const id of deleted)await delKey('piano',id);
  await put('impostazioni',{chiave:'stackBinario',valore:result.stack});
  for(const row of result.diagnostics)await put('diagnosticaCopertura',row);
};
global.fetch=async url=>({ok:true,json:async()=>JSON.parse(fs.readFileSync(path.join(root,String(url).split('?')[0]),'utf8'))});
global.todayISO=()=> '2026-09-27';
global.giorniSettimana=()=>['2026-09-28','2026-09-29','2026-09-30','2026-10-01','2026-10-02','2026-10-03','2026-10-04'];
let seed=714;Math.random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
require('../motor-v12.js');
const M=global.DietaPlannerMotorV12,K=require('../pwa-contracts.js');
(async()=>{
 await M.inizializza({basePath:''});
 const initial=await M.generaPianoSettimana(0,{forza:true});assert.deepEqual(initial.errori,[]);
 const records=await getAll('piano');
 const target=records.slice().reverse().find(row=>row.realizzazioni.some(real=>{const r=M.getRicetta(real.ricettaId);const c=M.copertura(r);return c.V&&!c.P&&!c.C;}));
 assert(target,'fixture reale con contorno separato');
 let unlocked;
 for(const row of records){
  for(const real of row.realizzazioni){real.bloccata=true;}
  if(row.id===target.id){unlocked=row.realizzazioni.find(real=>{const c=M.copertura(M.getRicetta(real.ricettaId));return c.V&&!c.P&&!c.C;});unlocked.bloccata=false;}
  await put('piano',row);
 }
 const locked=target.realizzazioni.filter(r=>r.bloccata),before=JSON.stringify(await getAll('piano'));
 const protein=await M.materializzaRealizzazione(locked.find(r=>M.copertura(M.getRicetta(r.ricettaId)).P));
 const ingredient=protein.ingredienti.find(i=>['PC','PP','PF','PU','PL'].includes(i.categoria)).ingredienteId;
 await put('impostazioni',{chiave:'vincoliIngredientiNutrizionista',valore:{[ingredient]:{min:1,max:null}}});M.invalidaConfigRuntime();
 const result=await M.generaPianoSettimana(0,{forza:true});assert.deepEqual(result.errori,[]);assert.deepEqual(result.generati,[target.id]);
 const after=await getAll('piano');
 for(const row of records.filter(r=>r.id!==target.id))assert.deepEqual(after.find(r=>r.id===row.id),row,'pasto interamente bloccato preservato');
 for(const real of locked)assert.deepEqual(after.find(r=>r.id===target.id).realizzazioni.find(r=>r.ricettaId===real.ricettaId),real,'snapshot bloccato preservato');
 assert.notEqual(JSON.stringify(after),before,'sola parte libera rigenerata');
 const specialSlot=records.find(r=>r.id!==target.id);
 await put('consumoGiorno',{id:specialSlot.id,giorno:specialSlot.id.slice(0,10),pasto:specialSlot.id.split('_')[1],origine:'utente-speciale'});
 const specialBefore=JSON.stringify(await getAll('consumoGiorno'));
 const savedBefore=await getAll('piano');
 const withSpecial=await M.generaPianoSettimana(0,{forza:true});
 assert.deepEqual(withSpecial.errori,[]);assert.deepEqual(withSpecial.generati,[target.id]);
 for(const row of savedBefore.filter(r=>r.id!==target.id))assert.deepEqual(await getOne('piano',row.id),row);
 for(const real of locked)assert.deepEqual((await getOne('piano',target.id)).realizzazioni.find(r=>r.ricettaId===real.ricettaId),real);
 assert.equal(JSON.stringify(await getAll('consumoGiorno')),specialBefore,'consumo speciale immutato');
 console.log('PASS: cataloghi/solver reali, rigenerazione di un pasto con minimo ingrediente e parti bloccate; variante con consumo utente-speciale preservato. Altri 13 piani e snapshot bloccati immutati. Archivio in memoria.');
})().catch(e=>{console.error(e);process.exitCode=1;});
