'use strict';
// Verifica funzionale IndexedDB, senza test visuali o screenshot.
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'):'playwright');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const helper=html.slice(html.indexOf('function salvaImpostazioniNutrizionista('),html.indexOf('async function salvaConfigAvanzata('));
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'dp-config-idb-'));
let context;
async function open(){
 context=await chromium.launchPersistentContext(profile,{headless:true,args:['--no-sandbox']});
 await context.route('https://dietaplanner.test/**',r=>r.fulfill({status:200,contentType:'text/html',body:'<!doctype html><title>Verifica configurazione</title>'}));
 const page=await context.newPage();await page.goto('https://dietaplanner.test/');
 await page.evaluate(async()=>{
  window.db=await new Promise((resolve,reject)=>{const r=indexedDB.open('config-test',1);r.onupgradeneeded=()=>r.result.createObjectStore('impostazioni',{keyPath:'chiave'});r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
  window.cacheGetAll={impostazioni:['prima']};
  window.read=key=>new Promise((resolve,reject)=>{const r=db.transaction('impostazioni').objectStore('impostazioni').get(key);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
 });
 await page.addScriptTag({content:helper});return page;
}
(async()=>{
 const page=await open();
 const result=await page.evaluate(async()=>{
  await salvaImpostazioniNutrizionista([{chiave:'configAvanzata',valore:{recipeDoses:{1:{Polenta:43}},deadlines:{pranzo:'15:37'}}},{chiave:'allergeniAttivi',valore:['latte']}]);
  const first=await read('configAvanzata');cacheGetAll.impostazioni=['conservare'];let rejected=false;
  try{await salvaImpostazioniNutrizionista([{chiave:'configAvanzata',valore:{recipeDoses:{1:{Polenta:99}}}},{valore:'chiave mancante: abort reale'}]);}catch{rejected=true;}
  return {first,after:await read('configAvanzata'),rejected,cache:cacheGetAll.impostazioni};
 });
 assert(result.rejected);assert.deepEqual(result.after,result.first);assert.deepEqual(result.cache,['conservare']);
 await context.close();context=null;
 const reopened=await open();
 const saved=await reopened.evaluate(async()=>({config:await read('configAvanzata'),allergens:await read('allergeniAttivi')}));
 assert.equal(saved.config.valore.recipeDoses[1].Polenta,43);assert.equal(saved.config.valore.deadlines.pranzo,'15:37');assert.deepEqual(saved.allergens.valore,['latte']);
 console.log('PASS: funzione applicativa su IndexedDB Chromium reale, commit e abort atomici, dati preservati dopo chiusura e riapertura browser. Nessuna verifica visuale.');
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{if(context)await context.close();fs.rmSync(profile,{recursive:true,force:true});});
