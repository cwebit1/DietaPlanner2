'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
const start=html.indexOf("  document.querySelector('#modalDettaglioTitolo [data-speciale]')?.addEventListener"),end=html.indexOf('\n  if(modalitaModifica)',start);
let listener,active=true;const calls=[];
const context={ricetta:{id:'r'},voce:{id:'2026-10-02_pranzo'},porzioniSel:1,modalitaModifica:false,document:{querySelector:()=>({addEventListener:(_,fn)=>listener=fn}),getElementById:()=>({classList:{contains:()=>active}})},togglePiattoSpeciale:async id=>{calls.push('salva:'+id);return {id,piattoSpeciale:true};},renderPiano:async()=>calls.push('aggiorna-listener'),apriModalDettaglioRicetta:(r,v)=>{assert.equal(r.piattoSpeciale,true);assert.equal(v,context.voce);calls.push('dettaglio');}};
vm.createContext(context);vm.runInContext(html.slice(start,end),context);
(async()=>{await listener({target:{dataset:{speciale:'r'}}});assert.deepEqual(calls,['salva:r','aggiorna-listener','dettaglio']);calls.length=0;active=false;await listener({target:{dataset:{speciale:'r'}}});assert.deepEqual(calls,['salva:r','dettaglio']);console.log('PASS: contrassegno speciale salva, aggiorna selezione attiva e conserva dettaglio; nessun render Piano fuori vista.');})().catch(e=>{console.error(e);process.exitCode=1;});
