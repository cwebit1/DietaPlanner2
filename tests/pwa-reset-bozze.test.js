'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');let handler,fail=true;
const rows=[{id:'2026-10-01_pranzo'}],logs=[{id:'consumo-preservato'}];
const original={modificata:true,voci:new Map([['bozza',{id:'bozza'}]])};
const context={menuDraft:original,bozzePropostaPasto:{bozza:{}},draftColazione:{bozza:{}},cacheGetAll:{piano:['cache']},chiediConferma:async()=>true,getAll:()=>{throw Error('reset intercettato dalla bozza');},delKey:()=>{throw Error('reset intercettato dalla bozza');},avviso:async()=>{},renderPiano:()=>{},renderMenuSettimanale:()=>{},document:{getElementById:id=>id==='btnResetPiano'?{addEventListener:(_,h)=>handler=h}:{classList:{contains:()=>true}}},db:{transaction(name,mode){assert.equal(name,'piano');assert.equal(mode,'readwrite');let cleared=false,aborted=false;const t={objectStore:()=>({clear(){if(fail)throw Error('abort reset');cleared=true;}}),abort(){aborted=true;}};queueMicrotask(()=>{if(aborted)t.onabort();else{if(cleared)rows.length=0;t.oncomplete();}});return t;}}};
vm.createContext(context);const start=html.indexOf('function azzeraPianoAtomico(){'),end=html.indexOf('/* =========================================================',start);assert(start>=0&&end>start);vm.runInContext(html.slice(start,end),context);
(async()=>{
 await handler();assert.equal(rows.length,1);assert.equal(context.menuDraft,original);assert(context.cacheGetAll.piano);assert.equal(Object.keys(context.bozzePropostaPasto).length,1);
 fail=false;await handler();assert.equal(rows.length,0);assert.equal(logs.length,1);assert.equal(context.menuDraft,null);assert.equal(Object.keys(context.bozzePropostaPasto).length,0);assert.equal(Object.keys(context.draftColazione).length,0);
 console.log('PASS: reset atomico sul piano reale con Menu aperto; abort conserva bozze/dati, successo elimina bozze e preserva storico.');
})().catch(e=>{console.error(e);process.exitCode=1;});
