'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
const removed=[],consumed=[],draft={modificata:true,voci:new Map([['proposta',{id:'proposta'}]])};let release;
const context={menuRenderGen:0,menuDraft:draft,getAllRaw:async()=>[
 {id:'2026-09-30_pranzo'},
 {id:'2026-09-30_cena',ricettaId:'r',origine:'auto'},
 {id:'2026-09-30_colazione',componenti:{proteine:'uovo'},origine:'utente'}
],getAll:async()=>[],todayISO:()=> '2026-10-01',finePastoMinuti:()=>840,fasciaPastoSuperata:()=>true,rawDelKey:async(s,id)=>{assert.equal(s,'piano');removed.push(id);},delKey:()=>{throw Error('cancellazione intercettabile dalla bozza');},consumaVoceAtomica:async row=>consumed.push(row.id)};
vm.createContext(context);let start=html.indexOf('async function elaboraConsumoAutomatico(){'),end=html.indexOf('/* =========================================================',start);vm.runInContext(html.slice(start,end),context);
(async()=>{
 await context.elaboraConsumoAutomatico();assert.deepEqual(removed,['2026-09-30_pranzo','2026-09-30_cena']);assert.deepEqual(consumed,['2026-09-30_colazione']);assert.equal(context.menuDraft,draft);
 context.elaboraConsumoAutomatico=()=>new Promise(r=>release=r);
 start=html.indexOf('async function renderMenuSettimanale(){');end=html.indexOf('  const giorni = giorniSettimana(menuSettimanaScarto);',start);
 vm.runInContext(html.slice(start,end)+'}',context);
 const pending=context.renderMenuSettimanale();assert.equal(context.menuDraft,draft,'bozza attiva durante il consumo');context.menuDraft=null;context.menuRenderGen++;release();await pending;assert.equal(context.menuDraft,null,'render superato non ripristina bozza annullata');
 console.log('PASS: consumo/pulizia automatica sul piano reale; bozza attiva durante attesa e nessuna resurrezione dopo annullamento.');
})().catch(e=>{console.error(e);process.exitCode=1;});
