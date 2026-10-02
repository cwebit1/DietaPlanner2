'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');let click,adapter,opens=0,active=false,refresh=0,fail=false;
let saved={prodotti:[],inventario:[]};
const context={spesaSettimanaScarto:0,getOne:()=>{},getAll:()=>{},cacheGetAll:{prodotti:['cache'],inventario:['cache']},DietaPlannerBarcode:{open:async a=>{opens++;adapter=a;}},document:{getElementById:id=>id==='btnBarcodeBarra'?{addEventListener:(_,h)=>click=h}:{classList:{contains:()=>active}}},avviso:async()=>{},calcolaListaSpesa:async week=>{assert.equal(week,0);refresh++;},db:{transaction(names){assert(['prodotti','prodotti,inventario'].includes(Array.from(names).join(',')));let aborted=false;const draft=structuredClone(saved),t={objectStore:name=>({put(row){if(fail&&name==='inventario')throw Error('errore acquisto');draft[name].push(row);}}),abort(){aborted=true;}};queueMicrotask(()=>{if(aborted)t.onabort();else{saved=draft;t.oncomplete();}});return t;}}};
vm.createContext(context);const start=html.indexOf('async function apriBarcodeSpesa('),end=html.indexOf('async function calcolaListaSpesa(',start);vm.runInContext(html.slice(start,end),context);
const binding="document.getElementById('btnBarcodeBarra').addEventListener('click',()=>apriBarcodeSpesa());";assert(html.includes(binding));vm.runInContext(binding,context);
(async()=>{
 await click();assert.equal(opens,1);assert.equal(adapter.read,context.getOne);assert.equal(adapter.all,context.getAll);assert.equal(refresh,0);
 const icon=html.match(/<button id="btnBarcodeBarra"[^>]*>/)[0];assert(!icon.includes('data-view'));assert(html.includes("nav.tabbar button[data-view]"));
 await adapter.register({id:'registrato'});assert.equal(saved.prodotti.length,1);assert.equal(saved.inventario.length,0);saved.prodotti=[];context.cacheGetAll.prodotti=['cache'];
 const product={id:'ean'},item={id:'lotto'};fail=true;await assert.rejects(()=>adapter.commit(product,item),/errore acquisto/);assert.equal(saved.prodotti.length,0);assert(context.cacheGetAll.prodotti);
 fail=false;await adapter.commit(product,item);assert.equal(saved.prodotti.length,1);assert.equal(saved.inventario.length,1);assert.equal(refresh,0,'nessun ricalcolo da Menu/bozza');
 active=true;await adapter.commit(product,{id:'lotto2'});assert.equal(refresh,1);assert.equal(context.cacheGetAll.prodotti,null);
 console.log('PASS: icona apre lettore direttamente; collegamento comune, nessun cambio vista, rollback acquisto e aggiornamento solo nella Spesa. DOM/IndexedDB simulati.');
})().catch(e=>{console.error(e);process.exitCode=1;});
