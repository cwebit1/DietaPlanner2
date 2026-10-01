'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
let saved,fail=false,serial=Promise.resolve();
const context={structuredClone,todayISO:()=> '2026-09-30',uid:()=> 'nuova-scorta',derivaDaCategoria:()=>({zona:'dispensa'}),cacheGetAll:{spesa:['cache'],inventario:['cache']},db:{transaction(names,mode){
 assert.equal(Array.from(names).join(','),'spesa,inventario');assert.equal(mode,'readwrite');
 let draft,aborted=false,release;
 const started=serial;serial=new Promise(r=>{release=r;});
 const t={objectStore(name){return {
  get(id){return read(()=>draft[name].find(r=>r.id===id));},
  getAll(){return read(()=>draft[name]);},
  put(row){if(fail&&name==='spesa')throw Error('scrittura fallita');const i=draft[name].findIndex(r=>r.id===row.id);if(i<0)draft[name].push(structuredClone(row));else draft[name][i]=structuredClone(row);}
 };},abort(){aborted=true;}};
 const reads=[];function read(fn){const r={};reads.push(()=>{r.result=structuredClone(fn());r.onsuccess();});return r;}
 started.then(()=>{
  draft=structuredClone(saved);
  for(const read of reads)read();
  if(aborted)t.onabort();else{saved=draft;t.oncomplete();}
  release();
 });return t;
}}};
vm.createContext(context);vm.runInContext(source.slice(source.indexOf('async function segnaAcquistoSpesaAtomico('),source.indexOf('async function calcolaListaSpesa(')),context);
function reset(stock=[]){saved={spesa:[{id:'spesa1',variantId:'riso',totaleAcquisto:500,comprato:false}],inventario:stock};context.cacheGetAll={spesa:['cache'],inventario:['cache']};}
(async()=>{
 reset([{id:'scorta',variantId:'riso',quantita:100,stato:'disponibile',lotto:'preservato'}]);
 fail=true;await assert.rejects(()=>context.segnaAcquistoSpesaAtomico('spesa1'),/scrittura fallita/);
 assert.equal(saved.inventario[0].quantita,100);assert.equal(saved.spesa[0].comprato,false);assert(context.cacheGetAll.inventario);
 fail=false;await Promise.all([context.segnaAcquistoSpesaAtomico('spesa1'),context.segnaAcquistoSpesaAtomico('spesa1')]);
 assert.equal(saved.inventario[0].quantita,600);assert.equal(saved.inventario[0].lotto,'preservato');assert.equal(saved.spesa[0].comprato,true);assert.equal(context.cacheGetAll.spesa,null);assert.equal(context.cacheGetAll.inventario,null);
 reset();await context.segnaAcquistoSpesaAtomico('spesa1');assert.equal(saved.inventario.length,1);assert.equal(saved.inventario[0].quantita,500);
 reset();saved.spesa[0].totaleAcquisto=-1;await assert.rejects(()=>context.segnaAcquistoSpesaAtomico('spesa1'),/Quantità/);assert.equal(saved.inventario.length,0);assert.equal(saved.spesa[0].comprato,false);
 reset();await context.segnaAcquistoSpesaAtomico('rimossa');assert.equal(saved.inventario.length,0);
 assert(!source.slice(source.indexOf("row.querySelector('[data-comprato]')"),source.indexOf('// Suggerimento per ingredienti')).includes("put('inventario'"));
 console.log('PASS: acquisto manuale atomico, abort senza scritture parziali, doppia conferma, nuova scorta, quantità invalida e riga rimossa. Transazioni simulate.');
})().catch(e=>{console.error(e);process.exitCode=1;});
