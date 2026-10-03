'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
const context={cambiSetPastoRsInCorso:new WeakSet(),matchMedia:()=>({matches:false})};vm.createContext(context);
vm.runInContext(html.slice(html.indexOf('async function switchPropostaPastoRs('),html.indexOf('function voceSpecialePastoRs(')),context);
(async()=>{
 let updates=0,animations=0;
 const grid={animate(frames){animations++;assert(frames.every(f=>f.transform.includes('translateX')));return {finished:Promise.resolve()};}};
 const panel={dataset:{nmProposta:'p'},querySelector:selector=>{assert.equal(selector,'.pasto-griglia-compatta');return grid;}};
 const card={querySelectorAll:selector=>{assert.equal(selector,'[data-nm-proposta]');return [panel,{dataset:{nmProposta:'altro'},querySelector(){throw Error('altro pasto animato');}}];}};
 assert.equal(await context.switchPropostaPastoRs(card,'p',async()=>{updates++;return true;}),true);assert.equal(updates,1);assert.equal(animations,1);
 assert.equal(await context.switchPropostaPastoRs(card,'p',async()=>false),false);assert.equal(animations,1);
 await assert.rejects(()=>context.switchPropostaPastoRs(card,'p',async()=>{throw Error('generazione');}),/generazione/);assert(!context.cambiSetPastoRsInCorso.has(card));
 grid.animate=()=>({finished:Promise.reject(Error('cancel'))});assert.equal(await context.switchPropostaPastoRs(card,'p',async()=>true),true);assert(!context.cambiSetPastoRsInCorso.has(card));
 context.cambiSetPastoRsInCorso.add(card);assert.equal(await context.switchPropostaPastoRs(card,'p',async()=>{throw Error('doppio comando');}),false);context.cambiSetPastoRsInCorso.delete(card);
 const start=html.indexOf('  const avviaProposta=async'),end=html.indexOf("  el.querySelectorAll('[data-nm-alternativa]",start),code=html.slice(start,end);assert(code.includes('switchPropostaPastoRs(el,id,'));assert(!code.includes('switchSetPastoRs'));assert(code.includes('soloAnteprima:true'));
 const a=html.indexOf("cont.querySelector('[data-nm-rigenera-proposta]')"),b=html.indexOf("cont.querySelector('[data-nm-annulla-proposta]')",a);assert(html.slice(a,b).includes('switchPropostaPastoRs(card,id,'));assert(!html.includes('pasto-proposal-in'));assert(html.includes('await DietaPlannerMotorV12.salvaRoll(bozza.voce)'));
 console.log('PASS transizione solo griglia proposta, asse X, generazione singola, doppio evento/errore/cancellazione e collegamenti; DOM simulato.');
})().catch(e=>{console.error(e);process.exitCode=1;});
