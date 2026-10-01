'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const K=require('../pwa-contracts.js');
const source=fs.readFileSync(require.resolve('../motor-v12.js'),'utf8');
const days=Array.from({length:7},(_,i)=>'2026-09-'+String(21+i));
const recipe=(id,macro,food)=>({id,nome:id,macro,ingredienti:[{ingredienteId:food,categoria:'PC',quantita:37}],chiaviStack:['P:'+food],carb:'riso'});
const a=recipe('a','carne','A'),b=recipe('b','pesce','B'),special={...a,id:'special',piattoSpeciale:true};
const recipes=new Map([a,b,special].map(r=>[r.id,r]));
const cfg={vincoli:{A:{min:1,max:14}},weeklyLimits:{},resolved:{valid:true,vegetables:{},carbohydrates:{excludedKeys:[],fixedCounts:{}},carbohydrateClasses:{complessi:{min:null,max:null}},proteinFrequencies:{}}};
let plan=[],logs=[],capture,commits=0;
const context={Map,Set,Error,Date,Math,JSON,Number,String,Object,Array,K,uniq:a=>[...new Set(a)],clone:structuredClone,
 state:{ricetteById:recipes,tracking:{}},
 getAll:async name=>structuredClone(name==='piano'?plan:name==='consumoGiorno'?logs:[]),
 getOne:async(name,id)=>structuredClone(name==='ricette'?recipes.get(id):name==='piano'?plan.find(r=>r.id===id):null),
 materializzaRealizzazione:async r=>r.snapshot||recipes.get(r.ricettaId),
 configRuntime:async()=>cfg,configConteggiSettimana:async c=>c,
 caricaConfigurazioneNutrizionaleRisolta:async()=>cfg.resolved,
 ricettaAmmessa:async()=>true,coperturaVerduraRicette:()=>({coperturaCompleta:true}),erroreValidazionePastoFinale:()=>null,
 macroProteicaRicette:rs=>rs[0]?.macro,carbPrincipaleRicette:rs=>rs[0]?.carb,
 validaMinimiProteici:()=>[],variantiPrioritarieDeperimento:async()=>new Set(),
 giorniSettimana:()=>days,todayISO:()=> '2026-09-20',addGiorni:(d,n)=>new Date(Date.parse(d+'T12:00:00Z')+n*86400000).toISOString().slice(0,10),
 put:async()=>{},salvaRecordsContratti:async()=>{commits++;},
 risolviSettimanaSequenziale:async(slots,ctx)=>{capture={slots,ctx};return {ok:true,slotDefs:[],scelte:[],completati:0};}
};
vm.createContext(context);
function load(from,to){const start=source.indexOf(from),end=source.indexOf(to,start);assert(start>=0&&end>start);vm.runInContext(source.slice(start,end),context);}
load('function accumulaConteggiPasto(','function ricetteDaIds(');
load('function pastoRispettaConteggi(','async function generaCandidatiPasto(');
load('function minimiIngredientiFattibili(','/* @qa-metadata');
load('function unisciPianoEConsumi(','async function contestoConteggiSettimana(');
load('async function cronologiaContratti(','async function salvaRecordsContratti(');
load('async function generaPianoSettimana(','async function verduraRicorrenteRichiesta(');
const record=(day,meal,r,extra={})=>({id:day+'_'+meal,categoriaTarget:r.macro,carboidratoPianificato:r.carb,ricettaId:r.id,...extra});
(async()=>{
 // Il formato legacy singolo deve alimentare unicita e stack/roll.
 assert.equal(K.events([record(days[0],'pranzo',a)],id=>recipes.get(id)).length,1,'ID legacy singolo nella cronologia');
 assert.equal(K.events([{id:days[0]+'_pranzo',primoId:'a',secondoId:'a',contornoId:'b'}],id=>recipes.get(id)).length,2,'ID legacy multipli deduplicati');
 const snapshot={...a,ingredienti:[{ingredienteId:'OLD',categoria:'PC',quantita:11}]};
 const mixed=record(days[0],'pranzo',a,{realizzazioni:[{ricettaId:'a',ingredientiEffettivi:snapshot.ingredienti,snapshot}]});
 assert(K.events([mixed],id=>recipes.get(id))[0].sourceKeys.includes('P:old'),'identita dello snapshot');
 plan=[record(days[0],'pranzo',a),record(days[0],'cena',b)];
 await assert.rejects(()=>context.validaRecordsContratti([record(days[2],'pranzo',a)]),/piatto_gia_usato/,'commit legacy non aggira unicita');
 await assert.rejects(()=>context.validaRecordsContratti([record(days[1],'pranzo',a)]),/piatto_gia_usato|proteina_consecutiva/);
 await assert.rejects(()=>context.validaRecordsContratti([record(days[2],'pranzo',a,{realizzazioni:[{ricettaId:'a'}]})]),/piatto_gia_usato/,'commit snapshot vede la storia legacy');
 const sunday=record('2026-09-20','pranzo',a);
 plan=[sunday];
 await assert.rejects(()=>context.validaRecordsContratti([record(days[0],'pranzo',a)]),/proteina_consecutiva/,'domenica-lunedi');
 const valid=await context.validaRecordsContratti([record(days[0],'pranzo',b)]);
 assert.equal(valid.stack['P:a'].ultimoUso,'2026-09-20');assert.equal(valid.stack['P:b'].ultimoUso,days[0]);
 // Orchestratore reale; solver sostituito per ispezionare SOLO i dati di ingresso.
 const locked=record(days[0],'pranzo',a,{realizzazioni:[{ricettaId:'a',snapshot,bloccata:true}]});
 plan=[sunday,locked,record(days[0],'cena',b),record(days[1],'pranzo',a),record(days[1],'cena',b,{bloccata:true}),record(days[2],'pranzo',b,{bloccata:true})];
 logs=[{giorno:days[1],pasto:'cena',ricettaId:'special',origine:'utente-speciale'}];
 const before=JSON.stringify(plan);
 await context.generaPianoSettimana(0,{forza:true});
 assert.equal(capture.slots.length,11);assert.equal(capture.ctx.weeklyIngredientCounts.OLD,1,'snapshot bloccato contato');
 assert.equal(capture.ctx.weeklyIngredientCounts.B,1,'consumo speciale sostituisce piano ordinario');
 assert.equal(capture.ctx.weeklyIngredientCounts.A,undefined,'slot rigenerato e domenica fuori dai budget settimanali');
 assert(capture.ctx.proteineGiorno.get('2026-09-20').has('carne'),'macro domenica per rotazione AUTO');
 assert.equal(capture.ctx.verificaMinimiIngredienti,false,'speciale fuori dai 14 ordinari');
 assert.equal(JSON.stringify(plan),before,'pasti bloccati e storico immutati');
 logs=[];await context.generaPianoSettimana(0,{forza:true});
 assert.equal(capture.ctx.verificaMinimiIngredienti,true,'14 ordinari tra preservati e generabili');
 assert.equal(context.minimiIngredientiFattibili([],cfg,{},0),false);
 assert.equal(context.minimiIngredientiFattibili([a],cfg,{},0),true);
 assert.equal(commits,2);
 console.log('PASS: commit legacy/snapshot, unicita, consecutivita domenica-lunedi e stack; ingressi rigenerazione parziale, blocchi/speciali, budget e attivazione minimi. Archivio/solver simulati, nessuna certificazione browser o ricerca completa.');
})().catch(e=>{console.error(e);process.exitCode=1;});
