'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');let callback,writes=0,fail=false,opened;
const context={voce:{id:'2026-10-01_pranzo',porzioni:1,consumato:true},ricetta:{id:'r'},document:{getElementById:()=>({addEventListener:(_,h)=>callback=h})},put:async(s,row)=>{writes++;if(fail)throw Error('abort');return row;},avviso:async()=>{},apriModalDettaglioRicetta:(r,v)=>opened=v};vm.createContext(context);
const a=html.indexOf("  document.getElementById('modalDettaglioPorzioni').addEventListener('change'"),b=html.indexOf("  document.querySelector('#modalDettaglioTitolo",a);vm.runInContext(html.slice(a,b),context);
(async()=>{
 await callback({target:{value:'2'}});assert.equal(writes,0);assert.equal(context.voce.porzioni,1);
 context.voce.consumato=false;fail=true;const target={value:'2'};await callback({target});assert.equal(context.voce.porzioni,1);assert.equal(target.value,'1');assert.equal(opened,undefined);
 fail=false;await callback({target:{value:'3'}});assert.equal(opened.porzioni,3);assert.equal(context.voce.porzioni,1);
 const before=writes;await callback({target:{value:'-1'}});await callback({target:{value:'err'}});assert.equal(writes,before);
 console.log('PASS: dettaglio protegge porzioni consumate, conserva oggetto su abort e salva copia valida del pasto programmato.');
})().catch(e=>{console.error(e);process.exitCode=1;});
