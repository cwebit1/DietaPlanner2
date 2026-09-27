'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const N=require('../nutrition-config.js'),source=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const data={impostazioni:new Map(),piano:new Map(),consumoGiorno:new Map(),ingredienti:new Map(),varianti:new Map()},messages=[];
const getOne=async(s,k)=>structuredClone(data[s].get(k)||null),getAll=async s=>[...data[s].values()].map(x=>structuredClone(x));
const put=async(s,r)=>data[s].set(r.chiave||r.id,structuredClone(r));
global.getOne=getOne;global.getAll=getAll;require('../motor-v12.js');const M=global.DietaPlannerMotorV12;
const inputs=Object.entries({'fruit.min':'0','fruit.max':'4','fruit.portion.min':'100','fruit.portion.max':'120','vegetables.vegetablePortionGrams':'300','vegetables.saladPortionGrams':'90'}).map(([cfgAvanzata,value])=>({dataset:{cfgAvanzata},value}));
const indicator={innerHTML:''};
const c={structuredClone,console,DietaPlannerNutritionConfig:N,getOne,getAll,put,avviso:async m=>messages.push(m),
 document:{querySelectorAll:s=>s==='[data-cfg-avanzata]'?inputs:[],getElementById:id=>id==='indicatoreFrutta'?indicator:{value:'onnivoro'}},
 window:{DietaPlannerMotorV12:M},renderConfigAvanzata:async()=>{},esclusionePianoIngrediente:()=>false,
 risolviSetUtenteCorrente:()=>M.caricaConfigurazioneNutrizionaleRisolta(),ingredientiEffettiviVoce:async v=>v.ingredientiEffettivi||[]};
c.salvaImpostazioniNutrizionista=async rows=>{for(const row of rows)await put('impostazioni',row);};
vm.createContext(c);
vm.runInContext(source.slice(source.indexOf('const CONFIG_AVANZATA_DEFAULT='),source.indexOf('function macroNutrizionistaIngrediente')),c);
vm.runInContext('let CAP_SPUNTINO_SETTIMANALE,CAP_SPUNTINO_GIORNALIERO,CAP_COLAZIONE_SPECIALE,FRUTTA_GIORNALIERA;const giornoSelezionato="2026-09-28";',c);
for(const [a,b] of [['async function salvaConfigAvanzata(){','const NOMI_GIORNI_ESTESI'],['function applicaConfigAvanzataRuntime(','const COLAZIONE_GRUPPI'],['async function calcolaFruttaOggi(','const LABEL_PASTO']])vm.runInContext(source.slice(source.indexOf(a),source.indexOf(b,source.indexOf(a))),c);
(async()=>{
 await c.salvaConfigAvanzata();assert.deepEqual(messages,[]);
 const cfg=await M.caricaConfigurazioneNutrizionaleRisolta();assert(cfg.valid);
 assert.equal(cfg.vegetables.vegetablePortionGrams,300);assert.equal(cfg.vegetables.saladPortionGrams,90);
 const reopened=c.configAvanzataEffettivaSalvata((await getOne('impostazioni','configAvanzata')).valore);assert.equal(reopened.vegetables.vegetablePortionGrams,300);
 await put('piano',{id:'2026-09-28_pranzo',ingredientiEffettivi:[{gruppo:'frutta',grammi:220}]});
 assert.equal(await c.calcolaFruttaOggi('2026-09-28'),2,'porzioni calcolate dalla dose configurata 110 g');
 await c.renderIndicatoreFrutta();assert(indicator.innerHTML.includes('0–4 porzioni'));
 inputs[1].value='';await c.salvaConfigAvanzata();await c.renderIndicatoreFrutta();assert(indicator.innerHTML.includes('almeno 0'));assert(!indicator.innerHTML.includes('null'));
 const ingredient={nome:'Zucchine',gruppo:'verdura',macro:'verdura',porzione:200,grammi:80,quantita:80};
 const sauce={id:'s',classe:['C','S'],ingredienti:[ingredient]},side={id:'v',classe:['V'],ingredienti:[{...ingredient,grammi:200,quantita:200}]};
 const before=JSON.stringify([sauce,side]);
 const completed=M.completaResiduoVerduraRicette([sauce],[side],'2026-09-28',cfg.vegetables);
 const balance=M.coperturaVerduraRicette(completed,cfg.vegetables);
 assert.equal(balance.richiestaGrammi,300);assert.equal(balance.residuoGrammi,0);
 assert(Math.abs(completed.find(r=>r.id==='v').ingredienti[0].grammi-220)<1e-8,'solo residuo 300-80, tolleranza aritmetica floating point');
 assert.equal(JSON.stringify([sauce,side]),before,'template intatti');
 const snapshot=M.snapshotRealizzazione({ricettaId:'v'},completed.find(r=>r.id==='v'));assert(Math.abs(snapshot.ingredientiEffettivi[0].grammi-220)<1e-8);
 const salad=N.vegetableCoverage([{kind:'salad',quantity:45}],cfg.vegetables);assert.equal(salad.remainingFraction,0.5);assert.equal(salad.residualSaladGrams,45);
 for(const config of [{fruit:{min:4,max:1}},{fruit:{portionMin:130,portionMax:100}},{fruit:{portionMin:0}},{fruit:{min:-1}},{vegetables:{vegetablePortionGrams:0}},{vegetables:{saladPortionGrams:'x'}}])assert.equal(N.resolveNutritionConfig({nutritionist:{config}}).valid,false);
 assert.equal(N.resolveNutritionConfig({nutritionist:{config:{fruit:{min:0.5,max:1.5}}}}).valid,true);
 const saved=JSON.stringify([...data.impostazioni]);inputs[4].value='0';await c.salvaConfigAvanzata();assert(messages.length);assert.equal(JSON.stringify([...data.impostazioni]),saved,'config invalida non salvata');
 console.log('PASS: UI salvata/riletta, conteggio frutta e massimo aperto, porzioni V, residuo S+V e snapshot, template intatti, invalidi respinti. DOM/archivio simulati.');
})().catch(e=>{console.error(e);process.exitCode=1;});
