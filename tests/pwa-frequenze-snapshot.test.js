'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
const rows={piano:[{id:'2026-10-02_pranzo',modo:'multi',consumato:true,realizzazioni:[{ricettaId:'nuovo',gruppoProteico:'uova'},{ricettaId:'verdura',gruppoProteico:null}]},{id:'2026-10-02_cena',modo:'multi',realizzazioni:[{ricettaId:'rosso',gruppoProteico:'carne_rossa'}]},{id:'2026-10-03_pranzo',ricettaId:'legacy'}],ricette:[{id:'nuovo',gruppoProteico:'pesce'},{id:'verdura',gruppoProteico:'formaggi'},{id:'legacy',gruppoProteico:'legumi'}],consumoGiorno:[]};
const context={Promise,Map,Set,Object,SOTTOTIPO_A_GRUPPO:{carne_rossa:'carne'},giorniSettimana:()=>['2026-10-02','2026-10-03'],getAll:async store=>rows[store]};vm.createContext(context);
const start=html.indexOf('async function conteggiProteiciSettimana('),end=html.indexOf('/* Tetti settimanali degli SPUNTINI',start);vm.runInContext(html.slice(start,end),context);
(async()=>{
 let counts=await context.getConsumiProteiciSettimanaConsumati();assert.equal(counts.gruppi.uova,1);assert.equal(counts.gruppi.pesce,0);assert.equal(counts.gruppi.formaggi,0);assert.equal(counts.gruppi.carne,0);
 counts=await context.getConsumiProteiciSettimana();assert.equal(counts.gruppi.carne,1);assert.equal(counts.sottotipi.carne_rossa,1);assert.equal(counts.gruppi.legumi,1);
 rows.consumoGiorno=[{giorno:'2026-10-02',pasto:'pranzo',realizzazioni:[{ricettaId:'rimosso',gruppoProteico:'uova'}]},{giorno:'2026-10-03',pasto:'cena',modo:'multi',secondoId:'legacy'}];
 counts=await context.getConsumiProteiciSettimanaConsumati();assert.equal(counts.gruppi.uova,1,'log e piano deduplicati, gruppo snapshot anche senza catalogo');assert.equal(counts.gruppi.legumi,1,'storico legacy senza piano');
 assert.equal(rows.piano[0].realizzazioni[0].gruppoProteico,'uova');assert.equal(rows.ricette[0].gruppoProteico,'pesce');
 console.log('PASS: frequenze da snapshot, storico deduplicato, null congelato, catalogo mancante, legacy e piano futuro separati.');
})().catch(error=>{console.error(error);process.exitCode=1;});
