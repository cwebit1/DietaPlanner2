'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const stores=Object.fromEntries(['ingredienti','varianti','ricette','impostazioni','piano','consumoGiorno','inventario','diagnosticaCopertura'].map(n=>[n,new Map()]));
global.getAll=async n=>[...stores[n].values()].map(v=>structuredClone(v));global.getOne=async(n,k)=>structuredClone(stores[n].get(k));global.put=async(n,v)=>stores[n].set(v.id??v.chiave,structuredClone(v));global.delKey=async(n,k)=>stores[n].delete(k);
global.fetch=async url=>({ok:true,json:async()=>JSON.parse(fs.readFileSync(path.join(__dirname,'..',String(url).split('?')[0]),'utf8'))});global.todayISO=()=> '2026-10-01';require('../motor-v12.js');const M=global.DietaPlannerMotorV12;
let fail=false,conflict=false;const context={structuredClone,cacheGetAll:{},DietaPlannerMotorV12:M,menuDraftIntercetta:()=>false,db:{transaction(names){
 const draft=Object.fromEntries(Array.from(names).map(n=>[n,new Map(stores[n])])),reads=[];let aborted=false;
 const t={objectStore(name){return {get(id){const r={};let value=structuredClone(stores[name].get(id));if(conflict&&id.startsWith('rollBinario|'))value={chiave:id,valore:{conflitto:true}};reads.push(()=>{r.result=value;r.onsuccess();});return r;},put(row){if(fail&&name==='diagnosticaCopertura'){aborted=true;t.error=Error('errore diagnostica');}draft[name].set(row.id??row.chiave,structuredClone(row));},delete(id){draft[name].delete(id);}};},abort(){aborted=true;}};
 queueMicrotask(()=>{for(const r of reads)r();if(aborted)t.onabort();else{for(const name of Object.keys(draft))stores[name]=draft[name];t.oncomplete();}});return t;
}}};vm.createContext(context);const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');vm.runInContext(html.slice(html.indexOf('function commitPianoContratti('),html.indexOf('function commitSetDraftAtomico(')),context);global.commitPianoContratti=context.commitPianoContratti;
const snapshot=()=>JSON.stringify(Object.fromEntries(Object.keys(stores).map(n=>[n,[...stores[n].values()]])));
(async()=>{
 await M.inizializza({basePath:''});const day='2026-10-05',id=day+'_pranzo';const solved=await M.risolviSlotSingolo(day,'pranzo','PC',{});assert(solved?.realizzazioni?.length);const original={...solved,id,categoriaTarget:'carne',modo:'multi',motoreNuovo:true};await put('piano',original);
 const before=snapshot();let proposal;
 for(const role of ['V','C','P']){proposal=await M.ruotaPasto(day,'pranzo',role,original);if(proposal)break;}
 assert(proposal?._rollPending?.length,'proposta Roll reale obbligatoria');assert.equal(snapshot(),before,'nessuna scrittura di piano/cicli/log durante anteprima');
 const result=await M.validaRecordsContratti([proposal]);assert(result.rollUpdates.length);result.diagnostics.push({id:'prova-abort'});
 fail=true;await assert.rejects(()=>context.commitPianoContratti([proposal],[],result),/errore diagnostica/);assert.equal(snapshot(),before,'errore conserva piano e ciclo');fail=false;
 conflict=true;await assert.rejects(()=>context.commitPianoContratti([proposal],[],result),/annullato/);assert.equal(snapshot(),before,'conflitto ciclo abortisce tutta la transazione');conflict=false;
 await M.salvaRoll(proposal);assert(!stores.piano.get(id)._rollPending);assert.deepEqual(stores.piano.get(id).realizzazioni,proposal.realizzazioni);const pending=proposal._rollPending[0];assert.deepEqual(stores.impostazioni.get(pending.chiave).valore,pending.valore);
 await assert.rejects(()=>M.salvaRoll(proposal),/Ciclo Roll cambiato/,'seconda conferma obsoleta respinta');
 console.log('PASS: Roll reale in anteprima senza scritture, commit piano/ciclo, conflitto e abort atomico. Transazioni simulate.');
})().catch(e=>{console.error(e);process.exitCode=1;});
