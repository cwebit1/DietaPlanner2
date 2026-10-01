'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
let saved={piano:[{id:'preservato'}],consumoGiorno:[{id:'storico'}],spesa:[{id:'acquisto'}],prodotti:[{id:'ean'}],impostazioni:[{chiave:'profilo',valore:'onnivoro'}]},fail=false,invalidations=0;
const context={window:{DietaPlannerMotorV12:{invalidaConfigRuntime:()=>invalidations++}},cacheGetAll:{piano:['cache']},db:{objectStoreNames:Object.keys(saved),transaction(names,mode){
 const draft=structuredClone(saved),reads=[];let aborted=false;const t={objectStore(name){return {getAll(){const r={};reads.push(()=>{r.result=structuredClone(draft[name]);r.onsuccess();});return r;},put(row){if(fail&&name==='consumoGiorno')throw Error('errore storico');const key=row.id??row.chiave;const i=draft[name].findIndex(r=>(r.id??r.chiave)===key);if(i<0)draft[name].push(structuredClone(row));else draft[name][i]=structuredClone(row);}};},abort(){aborted=true;}};
 queueMicrotask(()=>{if(aborted)t.onabort();else{for(const r of reads)r();if(mode==='readwrite')saved=draft;t.oncomplete();}});return t;
}}};vm.createContext(context);vm.runInContext(source.slice(source.indexOf('function esportaBackupDati('),source.indexOf("document.getElementById('btnEsporta').addEventListener")),context);
(async()=>{
 const backup=await context.esportaBackupDati();assert.equal(JSON.stringify(backup),JSON.stringify(saved),'tutti gli archivi esportati inclusi storico e prodotti');
 const payload={piano:[{id:'nuovo'}],consumoGiorno:[{id:'nuovo-storico'}]};const before=JSON.stringify(saved);fail=true;
 await assert.rejects(()=>context.importaBackupDati(payload),/errore storico/);assert.equal(JSON.stringify(saved),before);assert(context.cacheGetAll.piano);assert.equal(invalidations,0);
 fail=false;await context.importaBackupDati(payload);assert.equal(saved.piano.length,2,'merge preserva dati non presenti nel backup');assert.equal(saved.consumoGiorno.length,2);assert.equal(context.cacheGetAll.piano,null);assert.equal(invalidations,1);
 await assert.rejects(()=>context.importaBackupDati({sconosciuto:[]}),/Archivio/);await assert.rejects(()=>context.importaBackupDati({piano:[{}]}),/Record/);await assert.rejects(()=>context.importaBackupDati([]),/Formato/);
 console.log('PASS: backup integrale coerente, merge atomico, abort, validazione e invalidazione dopo commit. IndexedDB simulato.');
})().catch(e=>{console.error(e);process.exitCode=1;});
