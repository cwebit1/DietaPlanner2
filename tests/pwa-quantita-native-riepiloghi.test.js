'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
const c={htmlIconaIngredientePastoRs:()=>'',escPastoRs:x=>String(x),getAll:async()=>[{id:'egg',nome:'Uova',unitaPezzo:true,pesoPezzo:60}]};vm.createContext(c);
for(const [start,end] of [
 ['function formattaQuantita(','function fasciaBadgeColorata('],
 ['function htmlIngredientiPastoRs(','function htmlCaroselloPastoRs('],
 ['async function etichettaOpzioneSpuntino(','async function ']
]){const a=source.indexOf(start),b=source.indexOf(end,a+start.length);assert(a>=0&&b>a,start);vm.runInContext(source.slice(a,b),c);}
(async()=>{
 const v={id:'egg',nome:'Uova',unitaPezzo:true,pesoPezzo:60};
 const ingredient={variantId:v.id,quantita:2,grammi:120,unita:'pz'};
 assert.equal(c.formattaQuantitaIngrediente(v,ingredient),'2 pz');
 assert.equal(c.formattaQuantitaIngrediente(v,{...ingredient,quantita:0.5,grammi:30}),'0.5 pz');
 assert.equal(c.formattaQuantitaIngrediente({...v,pesoPezzo:80},ingredient,2),'4 pz','snapshot non reinterpretato da peso corrente');
 assert.equal(c.formattaQuantitaIngrediente(v,{quantita:120,unita:'g'}),'2 pz','legacy in grammi');
 assert.equal(c.formattaQuantitaIngrediente(null,{quantita:35.2,unita:'g'}),'35g');
 const recipe={nome:"Uova",ingredienti:[ingredient]};const html=c.htmlIngredientiPastoRs(recipe,new Map([[v.id,v]]),new Map());assert(html.includes('<small>2 pz</small>'));assert(!html.includes('0 pz'));
 assert.match(await c.etichettaOpzioneSpuntino(recipe,[v]),/Uova 2 pz/);
 for(const call of ['formattaQuantitaIngrediente(variante, ing, scala)','formattaQuantitaIngrediente(variante, i, scala)','formattaQuantitaIngrediente(v,ing)'])assert(source.includes(call),'dettaglio e speciale collegati');
 console.log('PASS: riepilogo e spuntino mostrano 2 uova, frazioni e porzioni; grammi legacy e pezzi snapshot preservati anche dopo cambio peso.');
})().catch(e=>{console.error(e);process.exitCode=1;});
