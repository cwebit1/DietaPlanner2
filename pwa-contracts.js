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
  const preparation=unique((recipe.slot||[]).map(s=>canonical(s.cottura&&s.cottura.nome)).filter(Boolean));
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
function events(records,resolve){
  const out=[],seen=new Set();
  for(const record of records||[]){
    const slot=record.giorno&&record.pasto?record.giorno+'_'+record.pasto:record.id;
    if(!slot||seen.has(slot))continue;
    seen.add(slot);
    const date=String(slot).slice(0,10);
    const reals=record.realizzazioni||((record.ricettaIds||[]).map(ricettaId=>({ricettaId})));
    for(const real of reals){
      const base=resolve(real.ricettaId)||{};
      if(!(real.ingredientiEffettivi||base.ingredienti||[]).length)continue;
      const id=identity(Object.assign({},base,real));
      out.push({...id,date,slot});
    }
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
const api={identity,decorate,events,hardReason,availability,filter,diagnostics,dayNumber,week,nextBreakfastCount,consumeInventory};
root.DietaPlannerContracts=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
