'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const K=require('../pwa-contracts.js');
const stores={};for(const n of ['ingredienti','varianti','ricette','impostazioni','piano','consumoGiorno','inventario','diagnosticaCopertura'])stores[n]=new Map();
global.getAll=async n=>[...stores[n].values()].map(x=>structuredClone(x));
global.getOne=async(n,k)=>structuredClone(stores[n].get(k));
global.put=async(n,x)=>stores[n].set(x.id??x.chiave,structuredClone(x));
global.delKey=async(n,k)=>stores[n].delete(k);
global.fetch=async url=>({ok:true,json:async()=>JSON.parse(fs.readFileSync(path.join(__dirname,'..',String(url).split('?')[0]),'utf8'))});
require('../motor-v12.js');const M=global.DietaPlannerMotorV12;
const source=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const c={structuredClone,DietaPlannerMotorV12:M,getAll,getOne};vm.createContext(c);
for(const [start,end] of [
 ['async function ingredientiEffettiviVoce(','async function calcolaFruttaOggi('],
 ['async function variantiColazioneCorrenti(','async function nutrizioneColazione('],
 ['async function nutrizioneColazione(','function componentiColazioneUguali('],
 ['function formattaQuantita(','function fasciaBadgeColorata(']
]){const a=source.indexOf(start),b=source.indexOf(end,a+start.length);assert(a>=0&&b>a);vm.runInContext(source.slice(a,b),c);}
const near=(actual,expected)=>assert(Math.abs(actual-expected)<1e-8,`${actual} != ${expected}`);
(async()=>{
 await M.inizializza({basePath:''});
 const v=(await getAll('varianti')).find(x=>x.nome==='Fette biscottate');assert(v);
 assert.equal(v.unitaPezzo,true);near(v.pesoPezzo,8.8);near(v.porzioneColazione,35.2);
 near(await M.doseContestoVariante(v,'colazione',0),35.2);
 const meal={id:'2026-10-05_colazione',componenti:{carboidrati:v.id}};
 const ingredients=await c.ingredientiEffettiviVoce(meal);near(ingredients[0].quantita,35.2);near(ingredients[0].grammi,35.2);
 const nutrition=await c.nutrizioneColazione(meal.componenti,await c.variantiColazioneCorrenti([v]));near(nutrition.kcal,408*0.352);near(nutrition.carb,76*0.352);
 assert.equal(c.formattaQuantita(v,35.2),'4 pz');
 const debit=K.consumeInventory([{id:'lot',variantId:v.id,stato:'disponibile',quantita:70.4}],ingredients,'2026-10-05');near(debit.changed[0].quantita,35.2);assert.equal(debit.missing.length,0);
 const preserved={...meal,ingredientiEffettivi:[{variantId:v.id,quantita:4,grammi:4,unita:'g'}]};
 near((await c.ingredientiEffettiviVoce(preserved))[0].grammi,4);
 await put('impostazioni',{chiave:'vincoliIngredientiNutrizionista',valore:{[v.ingredienteId]:{contesti:{colazione:{quantita:3,max:4}}}}});M.invalidaConfigRuntime();
 near(await M.doseContestoVariante(v,'colazione',0),26.4);
 near((await c.variantiColazioneCorrenti([v],preserved))[0].porzioneColazione,4);
 const catalog=JSON.parse(fs.readFileSync(path.join(__dirname,'../ingredienti-new.json'))).ingredienti['Fette biscottate'];assert.match(catalog.fontePesoPezzo,/mulinobianco/);assert.equal(catalog.porzione,4);
 console.log('PASS: 4 fette=35.2g, nutrienti, display, scarico/scorte in grammi, override 3 fette=26.4g; snapshot precedenti preservati.');
})().catch(e=>{console.error(e);process.exitCode=1;});
