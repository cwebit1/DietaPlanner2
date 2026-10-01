'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../motor-v12.js'),'utf8');
const recipes=new Map([
 ['ordinary',{id:'ordinary',ingredienti:[{ingredienteId:'P',quantita:200}]}],
 ['special',{id:'special',piattoSpeciale:true,ingredienti:[{ingredienteId:'P',quantita:200}]}]
]);
const context={Map,Set,Error,state:{ricetteById:recipes},uniq:a=>[...new Set(a)],getOne:async(_,id)=>recipes.get(id),materializzaRealizzazione:async r=>r.snapshot||recipes.get(r.ricettaId)};
vm.createContext(context);
const start=source.indexOf('function unisciPianoEConsumi('),end=source.indexOf('async function contestoConteggiSettimana(',start);
assert(start>=0&&end>start);vm.runInContext(source.slice(start,end),context);
(async()=>{
 const id='2026-09-28_pranzo';
 const rows=[...context.unisciPianoEConsumi([{id,ricettaId:'ordinary'}],[{giorno:'2026-09-28',pasto:'pranzo',ricettaIds:['special']}])];
 assert.equal(rows.length,1);assert.equal(rows[0].id,id);
 assert.equal((await context.ricetteOrdinariePerConteggi(rows[0])).length,0,'consumo speciale sostituisce ordinario pianificato');
 assert.equal((await context.ricetteOrdinariePerConteggi({id})).length,0,'record vuoto non conta');
 assert.equal((await context.ricetteOrdinariePerConteggi({origine:'utente-speciale',ricettaId:'ordinary'})).length,0);
 const legacy=await context.ricetteOrdinariePerConteggi({ricettaIds:['ordinary','ordinary']});assert.equal(legacy.length,1);
 const snapshot={id:'ordinary',ingredienti:[{ingredienteId:'P',quantita:37}]};
 const read=await context.ricetteOrdinariePerConteggi({realizzazioni:[{ricettaId:'ordinary',snapshot}],ricettaIds:['special']});
 assert.equal(read[0].ingredienti[0].quantita,37,'snapshot prevale su cache e ID legacy');
 assert.equal(recipes.get('ordinary').ingredienti[0].quantita,200,'catalogo immutato');
 await assert.rejects(()=>context.ricetteOrdinariePerConteggi({realizzazioni:[{ricettaId:'missing'}]}),/Realizzazione non leggibile/);
 await assert.rejects(()=>context.ricetteOrdinariePerConteggi({ricettaIds:['missing']}),/Ricetta salvata non leggibile/);
 await assert.rejects(()=>context.ricetteOrdinariePerConteggi({id,realizzazioni:[{snapshot:{ingredienti:[]}}]}),/senza ingredienti leggibili/);
 const metadata=source.split('/* @qa-metadata').slice(1).map(part=>JSON.parse(part.split('*/')[0])).find(m=>m.id==='P1-conteggi-preservati');
 assert.equal(metadata.id,'P1-conteggi-preservati');assert(fs.existsSync(require('node:path').join(__dirname,'..',metadata.focusedTest)));
 console.log('PASS: deduplica slot, speciali/vuoti, legacy, priorita snapshot, riferimenti mancanti e metadati QA. Helper reali; materializzazione simulata.');
})().catch(e=>{console.error(e);process.exitCode=1;});
