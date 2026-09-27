'use strict';
// Prova del processo UI -> impostazioni -> resolver del motore -> filtro.
// DOM e archivio simulati: non certifica transazioni IndexedDB o grafica.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const N=require('../nutrition-config.js');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const stores=new Map(),messages=[];
let writes=0,invalidations=0;
const read=async(store,key)=>structuredClone(stores.get(store+':'+key)||null);
const write=async(store,v)=>{writes++;stores.set(store+':'+(v.chiave||v.id),structuredClone(v));};
global.getOne=read;global.getAll=async()=>[];
require('../motor-v12.js');const M=global.DietaPlannerMotorV12;
const inputs=[['proteinFrequencies.carne.min','0'],['proteinFrequencies.carne.max','5'],['subtypeCaps.affettati','3']].map(([key,value])=>({dataset:{cfgAvanzata:key},value}));
inputs.push({dataset:{cfgAvanzata:'deadlines.pranzo',cfgTesto:'1'},value:'15:37'},{dataset:{cfgAvanzata:'vincoliClassiCarboidrati.semplici.min'},value:'2'},{dataset:{cfgAvanzata:'vincoliClassiCarboidrati.semplici.max'},value:'4'});
const recipeInputs=[{dataset:{doseRecipe:'1',doseName:'Polenta'},value:'43'}];
const ctx={structuredClone,console,DietaPlannerNutritionConfig:N,getOne:read,getAll:async()=>[],put:write,avviso:async m=>messages.push(m),
 document:{querySelectorAll:s=>s==='[data-cfg-avanzata]'?inputs:s==='[data-dose-recipe]'?recipeInputs:[],getElementById:()=>({value:'onnivoro',textContent:''})},
 window:{DietaPlannerMotorV12:{invalidaConfigRuntime(){invalidations++;M.invalidaConfigRuntime();}}},
 renderConfigAvanzata:async()=>{},applicaConfigAvanzataRuntime:()=>{},esclusionePianoIngrediente:()=>false};
ctx.salvaImpostazioniNutrizionista=async rows=>{for(const row of rows)await write('impostazioni',row);};
vm.createContext(ctx);
vm.runInContext(html.slice(html.indexOf('const CONFIG_AVANZATA_DEFAULT='),html.indexOf('function macroNutrizionistaIngrediente')),ctx);
vm.runInContext(html.slice(html.indexOf('async function salvaConfigAvanzata(){'),html.indexOf('const NOMI_GIORNI_ESTESI')),ctx);
vm.runInContext(html.slice(html.indexOf('function validaFattibilitaProteineSet('),html.indexOf('async function renderSetTabellaGiorno(')),ctx);
(async()=>{
 await ctx.salvaConfigAvanzata();assert.deepEqual(messages,[]);assert.equal(invalidations,1);
 const saved=await read('impostazioni','configAvanzata');
 const reopened=ctx.configAvanzataEffettivaSalvata(saved.valore);
 assert.equal(reopened.proteinFrequencies.carne.min,0);assert.equal(reopened.proteinFrequencies.carne.max,5);assert.equal(reopened.subtypeCaps.affettati,3);
 let resolved=await M.caricaConfigurazioneNutrizionaleRisolta();assert(resolved.valid);assert.equal(resolved.recipeDoses['1'].Polenta,43);assert.equal(resolved.deadlines.pranzo,'15:37');assert.equal(resolved.carbohydrateClasses.semplici.min,2);assert.equal(resolved.carbohydrateClasses.semplici.max,4);assert.equal(reopened.recipeDoses['1'].Polenta,43);assert.equal(resolved.proteinFrequencies.carne.max,5);
 const table={giorno_0:['carne'],giorno_1:['carne'],giorno_2:['carne'],giorno_3:['carne']};
 assert.equal(ctx.validaFattibilitaProteineSet(table,resolved.proteinFrequencies).ok,true,'Set accetta quattro scelte sotto il tetto cinque');
 assert.equal(ctx.validaFattibilitaProteineSet({...table,giorno_4:['carne'],giorno_5:['carne']},resolved.proteinFrequencies).reason,'weekly-max','Set respinge sei scelte sopra il tetto cinque');
 const recipe={ingredienti:[{nome:'Ingrediente di prova',sottotipo:'affettati',allergeni:[]}],chiaviStack:[]};
 const runtime=r=>({resolved:r,allergie:r.safety.allergens,blockedIngredientIds:new Set(),vincoli:r.ingredientConstraints,weeklyLimits:r.subtypeCaps});
 const allowed=async(count,r=resolved)=>M.ricettaAmmessa(recipe,'2026-09-28',{runtimeConfig:runtime(r),weeklySubtypeCounts:{affettati:count}});
 assert.equal(await allowed(2),true);assert.equal(await allowed(3),false,'esclusione al tetto impostato, non al default PDF');
 inputs[2].value='0';await ctx.salvaConfigAvanzata();resolved=await M.caricaConfigurazioneNutrizionaleRisolta();assert.equal(await allowed(0),false,'zero vieta il sottotipo');
 inputs[2].value='';inputs[1].value='';await ctx.salvaConfigAvanzata();resolved=await M.caricaConfigurazioneNutrizionaleRisolta();
 assert.equal(resolved.subtypeCaps.affettati,null);assert.equal(resolved.proteinFrequencies.carne.max,null);assert.equal(await allowed(8),true);
 recipe.ingredienti[0].allergeni=['latte'];resolved.safety.allergens=['latte'];assert.equal(await allowed(0),false,'assenza tetto non bypassa allergie');
 const baseline=N.resolveNutritionConfig({});assert.equal(baseline.proteinFrequencies.carne.max,3);assert.equal(baseline.subtypeCaps.affettati,1);
 for(const bad of [-1,1.5,'err',true]){
  assert.equal(N.resolveNutritionConfig({nutritionist:{config:{subtypeCaps:{affettati:bad}}}}).valid,false);
  assert.equal(N.resolveNutritionConfig({nutritionist:{config:{proteinFrequencies:{carne:{max:bad}}}}}).valid,false);
 }
 const incompatible=N.resolveNutritionConfig({nutritionist:{config:{proteinFrequencies:{carne:{min:4,max:2}}}}});
 assert.equal(incompatible.valid,false);assert.equal(incompatible.proteinFrequencies.carne.max,2,'nessuna correzione silenziosa del massimo');
 const before=JSON.stringify([...stores]),beforeWrites=writes;
 inputs[2].value='-1';await ctx.salvaConfigAvanzata();assert.equal(writes,beforeWrites);assert.equal(JSON.stringify([...stores]),before);assert(messages.length);
 const subordinate=N.resolveNutritionConfig({nutritionist:{ingredientConstraints:{x:{stato:'limitato',min:0,max:2,quantita:100}}},user:{ingredientWeeklyCaps:{x:8}}});
 assert.equal(subordinate.ingredientConstraints.x.max,2,'il Set utente non amplia il tetto clinico');
 console.log('PASS: salvataggio/riapertura UI, resolver runtime, filtro al tetto/zero/null, allergeni, default, dati invalidi senza scritture e Set subordinato. Archivio simulato.');
})().catch(e=>{console.error(e);process.exitCode=1;});
