'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),K=require('../pwa-contracts.js');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');let saved;
const context={Date,put:async(store,row)=>{assert.equal(store,'piano','scegliere il premio non modifica il contatore');saved=structuredClone(row);}};
vm.createContext(context);const start=html.indexOf('async function programmaPremioColazione('),end=html.indexOf('async function renderColazione(',start);assert(start>=0&&end>start);vm.runInContext(html.slice(start,end),context);
(async()=>{
 const regular={id:'2026-10-01_colazione',componenti:{proteine:'latte',carboidrati:'pane'}};
 await context.programmaPremioColazione(regular,'standard');assert.equal(saved.premioCostanza,true);assert(saved.programmatoIl);assert.deepEqual(saved.componenti,regular.componenti);assert.equal(K.nextBreakfastCount(7,saved,7),0,'reset al consumo successivo');
 await context.programmaPremioColazione(regular,'speciale');assert.equal(saved.colazioneSpecialeId,'speciale');assert.equal(saved.componenti,null);assert.equal(K.nextBreakfastCount(3,saved,7),0,'speciale azzera al consumo');
 assert.match(html,/mostraPremioCostanza[^;]+!voce\.premioCostanza/,'scelta standard non riapre il pannello premio');
 const renderer=html.slice(end,html.indexOf('async function apriModalDettaglioColazione',end));assert(!renderer.includes("chiave:'contatoreColazioniMorigerate', valore: 0"));
 console.log('PASS: premio standard/speciale conserva contatore alla scelta, registra programmazione e azzera solo al consumo.');
})().catch(e=>{console.error(e);process.exitCode=1;});
