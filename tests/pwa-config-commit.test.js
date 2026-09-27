'use strict';
// Protocollo della funzione transazionale reale, con abort controllato.
// Non sostituisce il collaudo IndexedDB del browser.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
let saved=new Map([['configAvanzata',{chiave:'configAvanzata',valore:{oilGramsPerDay:10}}]]),fail=false;
const c={cacheGetAll:{impostazioni:['cache precedente']},db:{transaction(name,mode){
 assert.equal(name,'impostazioni');assert.equal(mode,'readwrite');
 const pending=new Map(saved);let aborted=false,writes=0;
 const t={objectStore(s){assert.equal(s,'impostazioni');return {put(row){if(fail&&++writes===2)throw Error('errore simulato');pending.set(row.chiave,structuredClone(row));}};},abort(){aborted=true;queueMicrotask(()=>t.onabort());}};
 queueMicrotask(()=>{if(!aborted){saved=pending;t.oncomplete();}});return t;
}}};
vm.createContext(c);vm.runInContext(source.slice(source.indexOf('function salvaImpostazioniNutrizionista('),source.indexOf('async function salvaConfigAvanzata(')),c);
(async()=>{
 const rows=[{chiave:'configAvanzata',valore:{oilGramsPerDay:20}},{chiave:'allergeniAttivi',valore:['latte']}];
 fail=true;await assert.rejects(()=>c.salvaImpostazioniNutrizionista(rows),/simulato|non salvata/);
 assert.equal(saved.get('configAvanzata').valore.oilGramsPerDay,10);assert(!saved.has('allergeniAttivi'));assert(c.cacheGetAll.impostazioni);
 fail=false;await c.salvaImpostazioniNutrizionista(rows);assert.equal(saved.get('configAvanzata').valore.oilGramsPerDay,20);assert.deepEqual(saved.get('allergeniAttivi').valore,['latte']);assert.equal(c.cacheGetAll.impostazioni,null);
 console.log('PASS: commit unico configurazione/allergeni, abort senza aggiornamenti parziali e cache invalidata soltanto al completamento. Transazione simulata.');
})().catch(e=>{console.error(e);process.exitCode=1;});
