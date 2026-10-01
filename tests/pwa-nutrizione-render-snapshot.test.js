'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
const element={innerHTML:''},rows={colazione:{nutrizioneTotale:{kcal:120,prot:10,carb:5,grassi:7}},pranzo:{motoreNuovo:true,realizzazioni:[{nutrientiEffettivi:{kcal:300,proteine:20,carboidrati:35,grassi:9}}]},cena:{ingredientiEffettivi:[{variantId:'uovo',quantita:1,grammi:60,unita:'pz'}]}};
let calls=0;
const context={structuredClone,giornoSelezionato:'2026-10-01',document:{getElementById:()=>element},getOne:async(_,id)=>rows[id.split('_')[1]],getAll:async()=>{calls++;return [{id:'uovo',kcal100:200,prot100:10,carb100:0,grassi100:15}];},aggiungiNutrizione:(tot,n)=>{for(const k of Object.keys(tot))tot[k]+=n?.[k]||0;return tot;}};
vm.createContext(context);
let start=html.indexOf('async function calcolaNutrizioneVoceConsumata('),end=html.indexOf('\nasync function ',start+10);vm.runInContext(html.slice(start,end),context);
start=html.indexOf('async function renderNutrizioneGiorno(){');end=html.indexOf('async function renderFrequenzeSettimana(){',start);vm.runInContext(html.slice(start,end),context);
(async()=>{
 const n=await context.calcolaNutrizioneRicetta({ingredienti:[{variantId:'uovo',quantita:2,grammi:120,unita:'pz'}]});assert.equal(n.kcal,240);assert.equal(n.prot,12);
 const g=await context.calcolaNutrizioneRicetta({ingredienti:[{variantId:'uovo',quantita:50,unita:'g'}]});assert.equal(g.kcal,100);
 calls=0;await context.renderNutrizioneGiorno();for(const value of ['540','36','40','25'])assert(element.innerHTML.includes('>'+value),'totale mostrato '+value);assert.equal(calls,1,'snapshot nutrienti non ricalcolati da catalogo corrente');
 console.log('PASS: quantità pz convertita con grammi, legacy g invariato e totali DOM 540 kcal/36P/40C/25G da snapshot. Nessun test visuale.');
})().catch(e=>{console.error(e);process.exitCode=1;});
