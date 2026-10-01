/* Contratti condivisi: identità, disponibilità e cronologia. Nessuna IO. */
(function(root){
'use strict';
const protein=new Set(['PC','PP','PF','PU','PL']);
const unique=x=>[...new Set(x)].sort();
const canonical=x=>String(x||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim().replace(/\s+/g,' ');
const dayNumber=d=>Math.floor(Date.parse(String(d).slice(0,10)+'T12:00:00Z')/86400000);
const week=d=>{const n=dayNumber(d),dow=new Date(n*86400000).getUTCDay();return n-(dow+6)%7;};
function identity(recipe){
  const ingredients=recipe.ingredientiEffettivi||recipe.ingredienti||[];
  const source=i=>canonical(i.ingredienteId||i.variantId||i.nome);
  const food=ingredients.filter(i=>!i.condimento&&i.categoria!=='Condimenti');
  let preparation=unique((recipe.slot||[]).map(s=>canonical(s.cottura&&s.cottura.nome)).filter(Boolean));
  if(Array.isArray(recipe.ingredientiEffettivi)&&recipe.dishKey){
    try{const frozen=JSON.parse(recipe.dishKey);if(Array.isArray(frozen[1]))preparation=unique(frozen[1].map(canonical));}catch(_){}
  }
  const dishKey=JSON.stringify([unique(food.map(i=>source(i))),preparation]);
  const sourceKeys=unique(food.filter(i=>protein.has(i.categoria)).map(i=>'P:'+source(i)));
  const rotationKeys=unique(food.filter(i=>protein.has(i.categoria)||i.categoria==='C').map(i=>(protein.has(i.categoria)?'P:':'C:')+source(i)));
  if(rotationKeys.length)rotationKeys.push('ricetta:'+dishKey);
  return {dishKey,sourceKeys,sourceKey:sourceKeys.join('|'),rotationKeys,
    allergeniPresenti:unique(ingredients.flatMap(i=>i.allergeni||[])),
    stack:1,roll:1};
}
function decorate(recipe){
  const id=identity(recipe);
  const problemiQuantita=(recipe.ingredienti||[]).filter(i=>i.doseMancante).map(i=>i.nome);
  return Object.assign(recipe,id,{chiaviStack:id.rotationKeys,problemiQuantita});
}
/* @qa-metadata
{"id":"PWA-identita-pasto-combinato","paths":["mealIdentity","mealHardReason","events"],"focusedTest":"tests/pwa-identita-pasto-combinato.test.js","rules":["stessa preparazione combinata/separata stessa identità pasto","ingredienti e cotture ordinati canonicamente","unicità limitata alla settimana","controlli ricetta/rotazione conservati","cottura snapshot preservata dopo cambio catalogo"],"pending":["proposte manuali e storico su dispositivo"]}
*/
function mealIdentity(recipes){
  return identity({ingredienti:(recipes||[]).flatMap(r=>r.ingredientiEffettivi||r.ingredienti||[]),slot:(recipes||[]).flatMap(r=>JSON.parse(identity(r).dishKey)[1].map(nome=>({cottura:{nome}})))});
}
function mealHardReason(recipes,date,history){
  const dishKey=mealIdentity(recipes).dishKey;
  return (history||[]).some(e=>week(e.date)===week(date)&&e.mealDishKey===dishKey)?'piatto_gia_usato':null;
}
function events(records,resolve){
  const out=[],seen=new Set();
  for(const record of records||[]){
    const slot=record.giorno&&record.pasto?record.giorno+'_'+record.pasto:record.id;
    if(!slot||seen.has(slot))continue;
    seen.add(slot);
    const date=String(slot).slice(0,10);
    const legacyIds=record.ricettaIds?.length?record.ricettaIds:[record.ricettaId,record.primoId,record.secondoId,record.contornoId].filter(Boolean);
    const reals=record.realizzazioni?.length?record.realizzazioni:unique(legacyIds).map(ricettaId=>({ricettaId}));
    const recipes=reals.map(real=>Object.assign({},resolve(real.ricettaId)||{},real)).filter(r=>(r.ingredientiEffettivi||r.ingredienti||[]).length);
    const mealDishKey=mealIdentity(recipes).dishKey;
    for(const recipe of recipes)out.push({...identity(recipe),mealDishKey,date,slot});
  }
  return out;
}
function hardReason(recipe,date,history){
  const id=identity(recipe);
  if(history.some(e=>week(e.date)===week(date)&&e.dishKey===id.dishKey))return 'piatto_gia_usato';
  if(history.some(e=>Math.abs(dayNumber(e.date)-dayNumber(date))===1&&id.sourceKeys.some(k=>e.sourceKeys.includes(k))))return 'proteina_consecutiva';
  return null;
}
function availability(recipe,date,history,resetRoles=[],days=15){
  const keys=identity(recipe).rotationKeys.filter(k=>!resetRoles.includes(k.split(':')[0])&&!(resetRoles.length&&k.startsWith('ricetta:')));
  const uses=history.filter(e=>Math.abs(dayNumber(date)-dayNumber(e.date))<days&&keys.some(k=>e.rotationKeys.includes(k)));
  return {stack:uses.length?0:1,uses};
}
function filter(pool,date,history,reset,days=15){
  return pool.filter(r=>!hardReason(r,date,history)&&(reset===true||availability(r,date,history,Array.isArray(reset)?reset:[],days).stack===1));
}
function diagnostics(recipes,date,slot,history,days=15){
  return recipes.flatMap(r=>{
    const state=availability(r,date,history,[],days);
    if(state.stack===1)return [];
    const id=identity(r);
    return [{id:slot+'|'+id.dishKey,slot,data:date,timestamp:new Date().toISOString(),
      requisito:id.rotationKeys,elementoRiammesso:{ricettaId:r.id,...id},
      ultimiUsi:state.uses.map(e=>({data:e.date,slot:e.slot,giorni:Math.abs(dayNumber(date)-dayNumber(e.date))})),
      intervalloGiorni:days,causa:'Pool compatibile esaurito prima di '+days+' giorni',azione:'Aggiungere ricette/fonti compatibili con '+id.rotationKeys.join(', ')}];
  });
}
function nextBreakfastCount(current,meal,threshold=7){
  if(Number(current)>=threshold||meal.colazioneSpecialeId||!meal.componenti?.proteine||!meal.componenti?.carboidrati||meal.componenti.grassi||meal.componenti.carboidrati_semplici)return 0;
  return (Number(current)||0)+1;
}
function consumeInventory(inventory,ingredients,date){
  const rows=inventory.map(x=>({...x})),changed=new Map(),missing=[];
  for(const i of ingredients){
    if(!i.variantId||i.nonRichiedeInventario)continue;
    let remaining=Number(i.unita==='pz'?i.grammi:i.quantita);
    if(!Number.isFinite(remaining)||remaining<0)throw new Error('Quantità di consumo non valida o conversione in grammi mancante');
    const matches=rows.filter(r=>r.variantId===i.variantId&&r.stato==='disponibile'&&r.quantita>0)
      .sort((a,b)=>String(a.dataScadenza||'9999').localeCompare(String(b.dataScadenza||'9999'))||a.quantita-b.quantita);
    for(const row of matches){
      if(remaining<=0)break;
      const used=Math.min(remaining,row.quantita);remaining-=used;row.quantita-=used;
      if(!row.dataApertura)row.dataApertura=date;
      changed.set(row.id,row);
    }
    if(remaining>0)missing.push({variantId:i.variantId,quantita:remaining});
  }
  return {changed:[...changed.values()],missing};
}
// Correzione di un consumo: differenza rispetto alle quantità realmente scaricate.
function consumptionDifference(ingredients,previous){
  if(previous&&!Array.isArray(previous.scorteMancanti)&&previous.origine!=='utente')throw new Error('Dati di scarico del consumo precedente non disponibili: correggere prima le scorte.');
  const totals=new Map();
  const add=(i,sign)=>{
    if(!i.variantId||i.nonRichiedeInventario)return;
    const quantity=Number(i.unita==='pz'?i.grammi:i.quantita);
    if(!Number.isFinite(quantity)||quantity<0)throw new Error('Quantità di consumo non valida o conversione in grammi mancante');
    const row=totals.get(i.variantId)||{...i,unita:'g',quantita:0};row.quantita+=sign*quantity;totals.set(i.variantId,row);
  };
  for(const i of ingredients)add(i,1);
  // I vecchi editor manuali non scaricavano scorte; i record automatici conservano le mancanze.
  if(Array.isArray(previous?.scorteMancanti)&&Array.isArray(previous?.ingredientiEffettivi)){
    for(const i of previous.ingredientiEffettivi)add(i,-1);
    for(const i of previous.scorteMancanti)add(i,1);
  }
  return [...totals.values()].filter(i=>Math.abs(i.quantita)>0.000001);
}
function correctInventory(inventory,ingredients,previous,date){
  const difference=consumptionDifference(ingredients,previous),stock=inventory.map(i=>({...i})),credits=[];
  for(const i of difference.filter(i=>i.quantita<0)){
    const row=stock.filter(r=>r.variantId===i.variantId&&r.stato==='disponibile')
      .sort((a,b)=>String(a.dataScadenza||'9999').localeCompare(String(b.dataScadenza||'9999')))[0];
    if(!row)throw new Error('Scorta precedente non più presente: impossibile correggere automaticamente '+i.variantId);
    row.quantita=Number(row.quantita)-i.quantita;credits.push(row);
  }
  const debit=consumeInventory(stock,difference.filter(i=>i.quantita>0),date);
  const changed=new Map(credits.map(i=>[i.id,i]));for(const i of debit.changed)changed.set(i.id,i);
  return {changed:[...changed.values()],missing:debit.missing};
}
const api={identity,mealIdentity,mealHardReason,decorate,events,hardReason,availability,filter,diagnostics,dayNumber,week,nextBreakfastCount,consumeInventory,correctInventory};
root.DietaPlannerContracts=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
