'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
let saved={piano:[{id:'vecchio'}],impostazioni:[{chiave:'vecchio',valore:1}],diagnosticaCopertura:[]},throwAt=2,writes=0;
const context={structuredClone,menuDraftIntercetta:()=>false,setDraft:{voci:new Map([['a',{chiave:'a',valore:2}],['b',{chiave:'b',valore:3}]])},cacheGetAll:{impostazioni:['cache']},DietaPlannerMotorV12:{adottaTrackingDopoCommit:()=>{}},db:{transaction(names){
 const draft=structuredClone(saved);let aborted=false;const t={objectStore(name){return {get(id){const r={result:saved[name].find(x=>(x.id??x.chiave)===id)};queueMicrotask(()=>r.onsuccess());return r;},put(row){if(++writes===throwAt)throw Error('scrittura non clonabile');draft[name].push(structuredClone(row));},delete(id){draft[name]=draft[name].filter(x=>(x.id??x.chiave)!==id);}};},abort(){aborted=true;}};
 queueMicrotask(()=>{if(aborted)t.onabort();else{saved=draft;t.oncomplete();}});return t;
}}};vm.createContext(context);
const start=html.indexOf('function commitPianoContratti('),end=html.indexOf('async function mostraDiagnosticaCopertura',start);vm.runInContext(html.slice(start,end),context);
(async()=>{
 const initial=JSON.stringify(saved),result={baseline:{},stack:{},diagnostics:[]};
 await assert.rejects(()=>context.commitPianoContratti([{id:'nuovo'}],[],result,true),/non clonabile/);assert.equal(JSON.stringify(saved),initial);assert(context.cacheGetAll.impostazioni);
 writes=0;await assert.rejects(()=>context.commitSetDraftAtomico(),/non clonabile/);assert.equal(JSON.stringify(saved),initial);assert(context.cacheGetAll.impostazioni);assert.equal(context.setDraft.voci.size,2);
 writes=0;throwAt=Infinity;await context.commitSetDraftAtomico();assert.equal(saved.impostazioni.length,3);assert.equal(context.cacheGetAll.impostazioni,null);
 assert.match(html,/try\{await commitMenuDraftAtomico\(\);\}\s*catch\(error\)\{await avviso\('Salvataggio non riuscito: '\+error.message\);return;\}/);
 console.log('PASS: errori sincroni Menu/Set abortiscono le scritture precedenti; cache e bozza preservate, commit valido riuscito. Transazioni simulate.');
})().catch(e=>{console.error(e);process.exitCode=1;});
