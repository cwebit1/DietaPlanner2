'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),K=require('../pwa-contracts.js');
const source=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
let saved,fail=false,serial=Promise.resolve();
const context={structuredClone,Date,DietaPlannerContracts:K,cacheGetAll:{},
 ingredientiEffettiviVoce:async v=>{
  assert(!v.nutrizioneTotale,'vecchia nutrizione rimossa');
  if(v.modo==='unico')assert.deepEqual(Array.from(v.realizzazioni),[],'vecchie realizzazioni rimosse');
  const q=v.componenti?Number(v.componenti.dose):v.ricettaId==='nuova'?70:0;
  return q?[{variantId:'riso',quantita:q,grammi:q,unita:'g'}]:[];
 },
 calcolaNutrizioneVoceConsumata:async v=>({kcal:(v.ingredientiEffettivi||[]).reduce((n,i)=>n+i.quantita,0)*2}),
 risolviSetUtenteCorrente:async()=>({breakfastRegularCount:7}),
 db:{transaction(names,mode){
  assert.equal(mode,'readwrite');assert.equal(Array.from(names).length,5);
  let draft,aborted=false,release;const started=serial;serial=new Promise(r=>release=r);
  const reads=[];const t={objectStore(name){return {
   get(id){return read(()=>draft[name].find(r=>(r.id??r.chiave)===id));},
   getAll(){return read(()=>draft[name]);},
   put(row){if(fail&&name==='consumoGiorno')throw Error('errore storico');const key=row.id??row.chiave;const i=draft[name].findIndex(r=>(r.id??r.chiave)===key);if(i<0)draft[name].push(structuredClone(row));else draft[name][i]=structuredClone(row);},
   delete(id){draft[name]=draft[name].filter(r=>r.id!==id);}
  };},abort(){aborted=true;}};
  function read(fn){const r={};reads.push(()=>{r.result=structuredClone(fn());r.onsuccess();});return r;}
  started.then(()=>{draft=structuredClone(saved);for(const r of reads)r();if(aborted)t.onabort();else{saved=draft;t.oncomplete();}release();});return t;
 }}
};
vm.createContext(context);vm.runInContext(source.slice(source.indexOf('async function salvaConsumoManualeAtomico('),source.indexOf('async function elaboraConsumoAutomatico(')),context);
const date='2026-09-30',id=date+'_pranzo';
function reset(){saved={piano:[],consumoGiorno:[],inventario:[{id:'lotto',variantId:'riso',stato:'disponibile',quantita:200}],impostazioni:[{chiave:'contatoreColazioniMorigerate',valore:3}],ricette:[{id:'nuova'}]};context.cacheGetAll={piano:['cache']};}
(async()=>{
 reset();const meal={id,modo:'unico',ricettaId:'nuova',realizzazioni:[{ricettaId:'vecchia'}],ingredientiEffettivi:[{quantita:999}],nutrizioneTotale:{kcal:999}};
 fail=true;const before=JSON.stringify(saved);await assert.rejects(()=>context.salvaConsumoManualeAtomico(meal,date,'pranzo'),/errore storico/);assert.equal(JSON.stringify(saved),before);assert(context.cacheGetAll.piano);
 fail=false;await Promise.all([context.salvaConsumoManualeAtomico(meal,date,'pranzo'),context.salvaConsumoManualeAtomico(meal,date,'pranzo')]);
 assert.equal(saved.inventario[0].quantita,130);assert.equal(saved.consumoGiorno.length,1);assert.equal(saved.piano[0].nutrizioneTotale.kcal,140);assert.equal(saved.consumoGiorno[0].origine,'utente');assert.equal(context.cacheGetAll.piano,null);assert(saved.ricette[0].ultimoUsato);
 const empty={id,modo:'unico',ricettaId:null};await context.salvaConsumoManualeAtomico(empty,date,'pranzo');assert.equal(saved.inventario[0].quantita,200,'correzione restituisce solo lo scarico precedente');assert.equal(saved.consumoGiorno.length,1);
 reset();saved.inventario[0].quantita=20;await context.salvaConsumoManualeAtomico(meal,date,'pranzo');assert.equal(saved.consumoGiorno[0].scorteMancanti[0].quantita,50);await context.salvaConsumoManualeAtomico(empty,date,'pranzo');assert.equal(saved.inventario[0].quantita,20,'mancanze non restituite come scorta');
 reset();const breakfast={id:date+'_colazione',componenti:{proteine:'latte',carboidrati:'pane',dose:30}};await Promise.all([context.salvaConsumoManualeAtomico(breakfast,date,'colazione'),context.salvaConsumoManualeAtomico(breakfast,date,'colazione')]);assert.equal(saved.impostazioni[0].valore,4);assert.equal(saved.inventario[0].quantita,170);
 await context.salvaConsumoManualeAtomico({...breakfast,componenti:{...breakfast.componenti,dose:40}},date,'colazione');assert.equal(saved.impostazioni[0].valore,4,'correzione non riparte da zero né aumenta il contatore');assert.equal(saved.inventario[0].quantita,160);
 await context.salvaConsumoManualeAtomico({id:breakfast.id,componenti:null,colazioneSpecialeId:null},date,'colazione');assert.equal(saved.impostazioni[0].valore,0);assert.equal(saved.inventario[0].quantita,200);
 reset();saved.piano=[{id,consumato:true,ricettaId:'vecchia'}];saved.consumoGiorno=[{id:id+'_'+date,giorno:date,pasto:'pranzo',origine:'utente',ricettaIds:['vecchia']}];await context.salvaConsumoManualeAtomico(meal,date,'pranzo');assert.equal(saved.inventario[0].quantita,130,'vecchio editor senza scarico non riceve una restituzione inventata');
 reset();saved.inventario=[];saved.consumoGiorno=[{id:id+'_'+date,giorno:date,pasto:'pranzo',ingredientiEffettivi:[{variantId:'riso',quantita:50}],scorteMancanti:[]}];await assert.rejects(()=>context.salvaConsumoManualeAtomico(empty,date,'pranzo'),/Scorta precedente/);assert.equal(saved.piano.length,0);
 reset();saved.consumoGiorno=[{id:id+'_'+date,giorno:date,pasto:'pranzo',origine:'auto'}];await assert.rejects(()=>context.salvaConsumoManualeAtomico(meal,date,'pranzo'),/Dati di scarico/);assert.equal(saved.inventario[0].quantita,200,'scarico legacy ignoto non stimato');
 const begin=source.indexOf('async function apriModalEditorPasto('),end=source.indexOf('async function targetNuovoMotorePerPasto(');assert(begin>=0&&end>begin);const editors=source.slice(begin,end);
 assert.equal(editors.split('salvaConsumoManualeAtomico(').length-1,4,'tutti i quattro ingressi editor collegati');
 assert(!editors.includes('registraConsumoStorico('),'editor instradati al commit atomico');
 console.log('PASS: consumo manuale atomico, snapshot aggiornati, doppio evento, correzione/quantità mancanti, colazione e contatore, record legacy, abort. Transazioni simulate.');
})().catch(e=>{console.error(e);process.exitCode=1;});
