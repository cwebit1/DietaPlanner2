'use strict';
const assert=require('node:assert/strict'),K=require('../pwa-contracts.js');
// Stessa preparazione dichiarata in due rappresentazioni: fixture, nessuna nuova ricetta di catalogo.
const p={id:'p',ingredienti:[{ingredienteId:'pollo',categoria:'PC'}],slot:[{cottura:{nome:'Piastra'}}]},c={id:'c',ingredienti:[{ingredienteId:'riso',categoria:'C'}],slot:[{cottura:{nome:'Lessato'}}]},v={id:'v',ingredienti:[{ingredienteId:'carote',categoria:'V'}],slot:[{cottura:{nome:'Lessato'}}]};
const combined={id:'unico',ingredienti:[...p.ingredienti,...c.ingredienti,...v.ingredienti],slot:[...p.slot,...c.slot,...v.slot]};
const recipes=new Map([p,c,v,combined].map(r=>[r.id,r]));
const separated=[{id:'2026-10-05_pranzo',ricettaIds:[],modo:'multi',primoId:'c',secondoId:'p',contornoId:'v'}];
const unified=[{id:'2026-10-05_pranzo',ricettaId:'unico'}];
const history=K.events(separated,id=>recipes.get(id));assert.equal(history.length,3,'ID legacy letti anche con ricettaIds vuoto');
assert.equal(K.mealIdentity([p,c,v]).dishKey,K.mealIdentity([combined]).dishKey);
assert.equal(K.mealHardReason([combined],'2026-10-08',history),'piatto_gia_usato');assert.equal(K.mealHardReason([p,c,v],'2026-10-08',K.events(unified,id=>recipes.get(id))),'piatto_gia_usato');
assert.equal(K.mealHardReason([v,c,p],'2026-10-08',history),'piatto_gia_usato','ordine componenti irrilevante');
assert.equal(K.mealHardReason([combined],'2026-10-12',history),null,'nessuna nuova esclusione fra settimane');
const different={...p,slot:[{cottura:{nome:'Arrosto'}}]};assert.equal(K.mealHardReason([different,c,v],'2026-10-08',history),null,'preparazione diversa conserva identità distinta');
const snapshot=[{id:'2026-10-05_pranzo',realizzazioni:[{ricettaId:'p',ingredientiEffettivi:p.ingredienti,dishKey:K.identity(p).dishKey},{ricettaId:'c',ingredientiEffettivi:c.ingredienti},{ricettaId:'v',ingredientiEffettivi:v.ingredienti}]}];assert.equal(K.events(snapshot,id=>recipes.get(id))[0].mealDishKey,history[0].mealDishKey);assert.equal(K.events(snapshot,id=>id==='p'?different:recipes.get(id))[0].mealDishKey,history[0].mealDishKey,'cottura snapshot preservata dopo cambio catalogo');
assert.equal(K.hardReason(p,'2026-10-06',history),'piatto_gia_usato','contratto singola ricetta conservato');
const fs=require('node:fs'),source=fs.readFileSync(require('node:path').join(__dirname,'../motor-v12.js'),'utf8');assert(source.includes('K.mealHardReason(entries.map(e=>e.recipe),date,history)'));assert(source.includes('K.mealHardReason(risultato.ricette,giorno,ctx.contractHistory)'));
console.log('PASS: identità del pasto combinato/separato, snapshot/legacy, ordine, preparazioni diverse e settimane; confronto collegato a costruzione e commit.');
