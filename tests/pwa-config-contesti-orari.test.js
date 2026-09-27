'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const N=require('../nutrition-config.js'),K=require('../pwa-contracts.js');
const stores={};for(const n of ['ingredienti','varianti','ricette','impostazioni','piano','consumoGiorno','inventario','diagnosticaCopertura'])stores[n]=new Map();
global.getAll=async n=>[...stores[n].values()].map(x=>structuredClone(x));
global.getOne=async(n,k)=>structuredClone(stores[n].get(k));
global.put=async(n,x)=>stores[n].set(x.id??x.chiave,structuredClone(x));
global.delKey=async(n,k)=>stores[n].delete(k);
global.fetch=async url=>({ok:true,json:async()=>JSON.parse(fs.readFileSync(path.join(__dirname,'..',String(url).split('?')[0]),'utf8'))});
require('../motor-v12.js');const M=global.DietaPlannerMotorV12;
const src=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const c={console,structuredClone,Date,DietaPlannerMotorV12:M,DietaPlannerContracts:K,getAll,getOne,
 risolviSetUtenteCorrente:()=>M.caricaConfigurazioneNutrizionaleRisolta(),ingredienteEsclusoClinicamenteNelSet:()=>false,
 menuDraftIntercetta:()=>false,setDraftIntercetta:()=>false,rawPut:put,window:{DietaPlannerMotorV12:M},nomeConInizialeMaiuscola:s=>s,todayISO:()=> '2026-09-28'};
vm.createContext(c);
for(const [start,end] of [
 ['async function put(store, obj){','function getOneRaw('],
 ['function contestoAlimentare(','async function calcolaFruttaOggi('],
 ['async function calcolaNutrizioneVoceConsumata(','async function '],
 ['async function variantiColazioneCorrenti(','async function nutrizioneColazione('],
 ['async function materializzaSpuntinoCorrente(','async function opzioniSpuntinoDisponibili('],
 ['let SCADENZE_PASTO_RUNTIME=','async function consumaVoceAtomica('],
 ['function orarioPastoRs(','function htmlTestataPastoRs(']
]){
 const a=src.indexOf(start),b=src.indexOf(end,a+start.length);assert(a>=0&&b>a,start);vm.runInContext(src.slice(a,b),c);
}
(async()=>{
 await M.inizializza({basePath:''});
 const egg=(await getAll('varianti')).find(v=>v.nome==='Uova');assert(egg);
 const base=(await getAll('ingredienti')).find(b=>b.id===egg.ingredienteId);
 await put('impostazioni',{chiave:'vincoliIngredientiNutrizionista',valore:{[base.id]:{contesti:{colazione:{quantita:1,max:1},pastoPrincipale:{quantita:2},spuntino:{quantita:0.5}}}}});M.invalidaConfigRuntime();
 const grams=base.pesoPorzioneGrammi/base.porzione;
 const explicit=N.resolveNutritionConfig({ingredientCatalog:[base],nutritionist:{ingredientConstraints:{[base.id]:{stato:'limitato',quantita:3}}}});
 assert.equal(N.ingredientQuantity(explicit,base.id,'pastoPrincipale',0),3,'dose esplicita ingrediente precede il default contestuale PDF');
 assert.equal(N.ingredientQuantity(explicit,base.id,'colazione',0),1,'dose pasto principale non altera la dose colazione');
 assert.equal(N.ingredientQuantity(explicit,base.id,'pastoPrincipale',0,{recipeDose:1}),1,'eccezione ricetta preservata');

 assert.equal(await M.doseContestoVariante(egg,'colazione',0),grams);
 assert.equal(await M.doseContestoVariante(egg,'spuntino',0),grams/2);
 const entry={id:'2026-09-28_colazione',componenti:{proteine:egg.id}};
 await c.put('piano',entry);const saved=await getOne('piano',entry.id);assert.equal(saved.ingredientiEffettivi[0].grammi,grams);assert(saved.nutrizioneTotale.kcal>0);
 // Second breakfast is rejected by the contextual cap, while lunch stays admissible.
 await assert.rejects(()=>c.put('piano',{...entry,id:'2026-09-29_colazione'}),/Limite nutrizionista/);
 const counts=await c.conteggiIngredientiContesti('2026-09-28',null),resolved=await M.caricaConfigurazioneNutrizionaleRisolta();
 assert.equal(c.ingredienteEntroLimiti(base.id,'pastoPrincipale',resolved,counts),true);
 await put('impostazioni',{chiave:'vincoliIngredientiNutrizionista',valore:{[base.id]:{contesti:{colazione:{quantita:2,max:null}}}}});M.invalidaConfigRuntime();
 const oldVariants=await c.variantiColazioneCorrenti([egg],saved),freshVariants=await c.variantiColazioneCorrenti([egg]);
 assert.equal(oldVariants[0].porzioneColazione,grams);assert.equal(freshVariants[0].porzioneColazione,2*grams);
 assert.equal(JSON.stringify(await getOne('piano',entry.id)),JSON.stringify(saved));
 const recipe=M.getRicette().find(r=>r.ingredienti.some(i=>i.categoria==='C'&&i.quantita>0));assert(recipe);
 const ing=recipe.ingredienti.find(i=>i.categoria==='C');
 await put('impostazioni',{chiave:'configAvanzata',valore:{recipeDoses:{[recipe.recipeModelId]:{[ing.nome]:43}},deadlines:{pranzo:'15:37',cena:'22:15'}}});M.invalidaConfigRuntime();
 const materialized=await M.materializzaRealizzazione({ricettaId:recipe.id});assert.equal(materialized.ingredienti.find(i=>i.nome===ing.nome).quantita,43);
 // A fresh snack receives its contextual quantity, while an existing snack keeps its snapshot.
 const snack={id:'test-snack',tipoPortata:'spuntino',porzioni:1,ingredienti:[{variantId:egg.id,quantita:20}]};
 await put('ricette',snack);await c.put('piano',{id:'2026-09-28_spuntino1',ricettaId:snack.id,porzioni:1});
 const storedSnack=await getOne('piano','2026-09-28_spuntino1');assert.equal(storedSnack.ingredientiEffettivi[0].grammi,20);
 const limits=N.resolveNutritionConfig({nutritionist:{ingredientConstraints:{[base.id]:{stato:'limitato',min:3,max:4}}}});
 const reduced=await M.configConteggiSettimana({resolved:limits,vincoli:limits.ingredientConstraints},K.week('2026-09-28'));
 assert.equal(reduced.vincoli[base.id].min,1);assert.equal(reduced.vincoli[base.id].max,2,'colazione e spuntino sottratti dal limite globale');
 assert.equal(M.minimiIngredientiFattibili([],reduced,{},0),false);
 assert.equal(M.minimiIngredientiFattibili([{ingredienti:[{ingredienteId:base.id}]}],reduced,{},0),true);
 assert.equal(limits.ingredientConstraints[base.id].max,4,'configurazione originale immutata');

 const projected=await c.materializzaSpuntinoCorrente({...snack,ingredienti:[{variantId:egg.id,quantita:80}]},storedSnack);
 assert.equal(projected.ingredienti[0].grammi,20);
 // Removing breakfast clears the previous quantitative snapshot.
 await c.put('piano',{...saved,componenti:null});const removed=await getOne('piano',saved.id);assert.equal(removed.ingredientiEffettivi,undefined);
 const config=await M.caricaConfigurazioneNutrizionaleRisolta();c.deadlines=config.deadlines;vm.runInContext('SCADENZE_PASTO_RUNTIME=deadlines',c);
 assert.equal(c.fasciaPastoSuperata('2026-09-28','pranzo',new Date(2026,8,28,15,36)),false);
 assert.equal(c.fasciaPastoSuperata('2026-09-28','pranzo',new Date(2026,8,28,15,37)),true);
 assert.equal(c.orarioPastoRs('pranzo'),'12:00 – 15:37');
 for(const config of [{deadlines:{pranzo:'25:00'}},{recipeDoses:{1:{Uova:0}}},{carbohydrateClasses:{semplici:{min:3,max:1}}}])assert.equal(N.resolveNutritionConfig({nutritionist:{config}}).valid,false);
 console.log('PASS: contesti reali e conversione pz/g, salvataggio colazione e snapshot, cap contestuale senza blocco pranzo, dose ricetta, scadenza al minuto e orario mostrato. Archivio simulato.');
})().catch(e=>{console.error(e);process.exitCode=1;});
