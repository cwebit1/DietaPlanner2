'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const N=require('../nutrition-config.js'),K=require('../pwa-contracts.js');
require('../motor-v12.js');const M=global.DietaPlannerMotorV12;
const config={oilGramsPerDay:24,oilLunchPercent:25,specialBreakfastMax:4,specialMealsMax:null,snackWeeklyCaps:{patatine_grisbi:4},snackDailyCaps:{frutta_secca_giornaliero:2},snackPortions:{patatine:18},carbohydrateWeeklyCaps:{gnocchi:4},limitedCarbTotalMax:5,rotationDays:{stack:10,roll:8},breakfastRegularCount:3};
const r=N.resolveNutritionConfig({nutritionist:{config},user:{carbohydrates:{counts:{gnocchi:4}}}});
assert(r.valid,JSON.stringify(r.errors));assert.equal(r.carbohydrates.fixedCounts.gnocchi,4);assert.equal(r.specialBreakfastMax,4);assert.equal(r.specialMealsMax,null);
assert.equal(N.resolveNutritionConfig({nutritionist:{config},user:{carbohydrates:{counts:{gnocchi:5}}}}).valid,false);
assert.equal(N.resolveNutritionConfig({nutritionist:{config:{...config,carbohydrateWeeklyCaps:{gnocchi:0}}},user:{carbohydrates:{counts:{gnocchi:1}}}}).valid,false);
assert.equal(N.resolveNutritionConfig({nutritionist:{config:{...config,carbohydrateWeeklyCaps:{gnocchi:null}}},user:{carbohydrates:{counts:{gnocchi:5}}}}).valid,true);
const oil=()=>[{ingredientiEffettivi:[{nome:'Olio extravergine oliva',grammi:5,quantita:5}]},{ingredientiEffettivi:[{nome:'Olio extravergine oliva',grammi:5,quantita:5}]}];
for(const [pasto,expected] of [['pranzo',6],['cena',18]])assert.equal(M.normalizzaRealizzazioniOlio(oil(),r.oilGramsByMeal[pasto]).reduce((sum,x)=>sum+x.ingredientiEffettivi[0].grammi,0),expected);
assert(M.normalizzaRealizzazioniOlio(oil(),0).every(x=>x.ingredientiEffettivi[0].grammi===0),'zero elimina le quote olio esistenti');
const recipe={ingredienti:[{nome:'riso',categoria:'C'}]},hist=[{...K.identity(recipe),date:'2026-09-01',slot:'2026-09-01_pranzo'}];
assert.equal(K.availability(recipe,'2026-09-10',hist,[],r.rotationDays.stack).stack,0);
assert.equal(K.availability(recipe,'2026-09-11',hist,[],r.rotationDays.stack).stack,1);
assert.equal(K.filter([recipe],'2026-09-10',hist,false,10).length,0);assert.equal(K.filter([recipe],'2026-09-10',hist,['C'],10).length,1);
assert.equal(K.diagnostics([recipe],'2026-09-10','slot',hist,10)[0].intervalloGiorni,10);
assert.equal(K.nextBreakfastCount(3,{componenti:{proteine:'latte',carboidrati:'pane'}},3),0);
for(const bad of [{oilLunchPercent:101},{rotationDays:{roll:-1}},{specialBreakfastMax:1.5},{snackPortions:{patatine:0}},{carbohydrateWeeklyCaps:{gnocchi:-1}}])assert.equal(N.resolveNutritionConfig({nutritionist:{config:bad}}).valid,false);
const src=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8'),stores={ricette:[],varianti:[{id:'chips',ingredienteId:'chips',nome:'Patatine in busta'},{id:'nuts',ingredienteId:'nuts',nome:'Noci e mandorle'}],ingredienti:[{id:'chips',allergeni:[]},{id:'nuts',allergeni:[]}]};
let resolved=r,count=0;
const c={console,structuredClone,globalThis:null,DietaPlannerNutritionConfig:N,DietaPlannerMotorV12:M,
 getAll:async name=>structuredClone(stores[name]||[]),getOne:async(name,key)=>name==='impostazioni'?{valore:config}:stores[name].find(x=>x.id===key),
 put:async(name,value)=>{const pos=stores[name].findIndex(x=>x.id===value.id);if(pos<0)stores[name].push(value);else stores[name][pos]=value;},
 risolviSetUtenteCorrente:async()=>resolved,conteggiSpuntini:async()=>({settimana:{patatine_grisbi:count},giorno:{}}),ingredienteEsclusoClinicamenteNelSet:()=>false};
c.globalThis=c;vm.createContext(c);
vm.runInContext(src.slice(src.indexOf('async function materializzaSpuntinoCorrente('),src.indexOf('async function etichettaOpzioneSpuntino(')),c);
vm.runInContext(src.slice(src.indexOf('const NUTRITION_CONFIG_SET='),src.indexOf('/* Nel Set esistono stati utente')),c);
(async()=>{
 let options=await c.opzioniSpuntinoDisponibili('2026-09-28');assert.equal(options.find(x=>x.id==='spuntino-base-patatine').ingredienti[0].quantita,18);
 assert.equal(options.find(x=>x.id==='spuntino-base-frutta-secca').ingredienti[0].quantita,10);
 count=4;assert(!(await c.opzioniSpuntinoDisponibili('2026-09-28')).some(x=>x.id==='spuntino-base-patatine'));
 resolved=N.resolveNutritionConfig({nutritionist:{config:{snackWeeklyCaps:{patatine_grisbi:null}}}});assert((await c.opzioniSpuntinoDisponibili('2026-09-28')).some(x=>x.id==='spuntino-base-patatine'));
 resolved=N.resolveNutritionConfig({nutritionist:{config:{snackWeeklyCaps:{patatine_grisbi:0}}}});count=0;assert(!(await c.opzioniSpuntinoDisponibili('2026-09-28')).some(x=>x.id==='spuntino-base-patatine'));
 await c.aggiornaTettoCarbLimitatiSet();assert.equal(vm.runInContext("CONFIG_CARB_TIPI.find(x=>x.chiave==='gnocchi').maxIndividuale",c),4);
 console.log('PASS: tetti carboidrati e UI Set, speciali, dosi/cap snack, olio zero e ripartizione, confini stack/log e soglia colazione. Archivio simulato.');
})().catch(e=>{console.error(e);process.exitCode=1;});
