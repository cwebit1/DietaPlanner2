'use strict';

/*
 * Controlli STATICI dei criteri PWA consolidati. Non certificano il runtime.
 *
 * Uso:
 *   node tests/criteri-pwa-selettivi.test.js --list
 *   node tests/criteri-pwa-selettivi.test.js 7
 *   node tests/criteri-pwa-selettivi.test.js 6,7,8,9
 *   node tests/criteri-pwa-selettivi.test.js --all
 *
 * Ogni criterio è isolato. Un criterio ancora da implementare deve fallire
 * con un messaggio che descrive il contratto mancante.
 */

const assert=require('assert/strict');
const fs=require('fs');
const path=require('path');
const vm=require('vm');

const ROOT=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(ROOT,name),'utf8');
const json=name=>JSON.parse(read(name));
const source={
  index:read('index.html'),
  motor:read('motor-v12.js'),
  nutrition:read('nutrition-config.js'),
  engine:read('engine-core.js'),
  auth:read('firebase-auth.js'),
  rules:read('firestore.rules'),
  sw:read('sw.js'),
  agents:read('AGENTS.md')
};
const catalog={
  ingredients:json('ingredienti-new.json').ingredienti,
  recipes:json('db-ricette.json').ricette,
  visual:json('db-visuale.json').ricette,
  manifest:json('manifest.json')
};

function has(text,pattern,message){
  assert.match(text,pattern,message);
}
function lacks(text,pattern,message){
  assert.doesNotMatch(text,pattern,message);
}
function functionBody(text,name){
  const match=new RegExp('(?:async\\s+)?function\\s+'+name+'\\s*\\(').exec(text);
  assert(match,'Funzione assente: '+name);
  const open=text.indexOf('{',match.index);
  assert(open>=0,'Corpo funzione assente: '+name);
  let depth=0,quote=null,escaped=false;
  for(let i=open;i<text.length;i++){
    const ch=text[i];
    if(quote){
      if(escaped)escaped=false;
      else if(ch==='\\')escaped=true;
      else if(ch===quote)quote=null;
      continue;
    }
    if(ch==='"'||ch==="'"||ch==='`'){quote=ch;continue;}
    if(ch==='{')depth++;
    if(ch==='}'&&--depth===0)return text.slice(open+1,i);
  }
  throw new Error('Corpo funzione non chiuso: '+name);
}
function allRecipeItems(){
  const out=[];
  for(const recipe of catalog.recipes){
    for(const group of recipe.gruppi||[]){
      for(const item of group.ingredienti||[])out.push({recipe,group,item,kind:'ingrediente'});
      for(const item of group.cotture||[])out.push({recipe,group,item,kind:'cottura'});
    }
  }
  return out;
}
function inlineScriptsAreValid(){
  const scripts=[...source.index.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]);
  assert(scripts.length>0,'Script inline assenti');
  for(const code of scripts)new vm.Script(code);
}

const criteria=new Map();
function criterion(id,title,run){criteria.set(id,{id,title,run});}

criterion(1,'Nuovi cataloghi, IndexedDB e collegamento visuale per ID',()=>{
  has(source.motor,/loadJson\(base\+'db-ricette\.json'\)/,'db-ricette.json non caricato');
  has(source.motor,/loadJson\(base\+'ingredienti-new\.json'\)/,'ingredienti-new.json non caricato');
  has(source.motor,/loadJson\(base\+'db-visuale\.json'\)/,'db-visuale.json non caricato');
  has(source.motor,/sincronizzaCacheRicette\(\)/,'cache ricette IndexedDB non sincronizzata');
  assert(catalog.visual.every(x=>x.idRicetta&&typeof x.disponibile==='boolean'),'Record visuali incompleti');
});

criterion(2,'Struttura completa di ricette e componenti',()=>{
  const items=allRecipeItems();
  assert(items.length>0,'Catalogo ricette vuoto');
  assert(items.every(x=>x.item.stack!==undefined),'Elemento senza stack');
  assert(items.every(x=>x.item.roll!==undefined),'Elemento senza roll');
  const body=functionBody(source.motor,'compilaRicetta');
  for(const field of ['id','ingredienti','nutrienti','chiaviStack','allergeniPresenti']){
    assert(body.includes(field),'Ricetta compilata senza campo '+field);
  }
});

criterion(3,'Resolver nutrizionale unico e gerarchia completa',()=>{
  has(source.nutrition,/function resolveNutritionConfig\(/,'Resolver canonico assente');
  has(source.nutrition,/nutritionist/,'Livello nutrizionista assente');
  has(source.nutrition,/profile/,'Profilo alimentare assente');
  has(source.nutrition,/user/,'Livello utente assente');
  has(source.index,/DietaPlannerNutritionConfig\.resolveNutritionConfig/,'UI scollegata dal resolver');
});

criterion(4,'Allergeni su ingredienti, ricette e tutti i percorsi',()=>{
  assert(Object.values(catalog.ingredients).every(x=>Array.isArray(x.allergeni)),'Ingrediente senza array allergeni');
  has(functionBody(source.motor,'ricettaAmmessa'),/i\.allergeni.*cfg\.allergie/s,'Filtro allergeni motore assente');
  has(functionBody(source.motor,'compilaRicetta'),/allergeniPresenti/,'Unione allergeni non salvata sulla ricetta');
});

criterion(5,'Frequenze proteiche e due macro giornaliere distinte',()=>{
  for(const [key,min,max] of [['carne',1,3],['pesce',2,3],['formaggi',2,3],['uova',1,2]]){
    has(source.nutrition,new RegExp(key+':\\{min:'+min+',max:'+max),'Frequenza errata: '+key);
  }
  has(source.nutrition,/legumi:\{min:2,max:null/,'Frequenza legumi errata');
  has(source.motor,/proteineGiorno/,'Controllo macro giornaliere assente');
});

criterion(6,'Rotazione stack P/C e distanza della proteina concreta',()=>{
  has(source.motor,/sourceKey/,'sourceKey della proteina concreta assente');
  const body=functionBody(source.motor,'chiaviStack');
  lacks(body,/categoria!=='C'/,'C escluso dallo stack principale');
  has(source.motor,/sourceKey[\s\S]{0,300}addGiorni\([^)]*,-1\)/,'Distanza D→D+1 della proteina concreta assente');
});

criterion(7,'Stack binario 1→0→1 con log di copertura',()=>{
  has(source.motor,/\.stack\s*=\s*0|stack\s*:\s*0/,'Transizione stack 1→0 assente');
  has(source.motor,/\.stack\s*=\s*1|stack\s*:\s*1[\s\S]{0,200}pool/,'Ripristino stack 0→1 assente');
  has(source.index,/diagnosticaCopertura/,'Store persistente diagnosticaCopertura assente');
});

criterion(8,'Roll binario delle alternative con reset a esaurimento',()=>{
  has(source.motor,/\.roll\s*=\s*0/,'Transizione roll 1→0 assente');
  has(source.motor,/\.roll\s*=\s*1/,'Reset roll 0→1 assente');
  has(source.motor,/roll[\s\S]{0,300}(esaurit|every\()/i,'Rilevazione esaurimento pool roll assente');
});

criterion(9,'Unicità settimanale assoluta tramite dishKey',()=>{
  has(source.motor,/dishKey/,'dishKey assente dal motore');
  has(source.motor,/weeklyDishKeys|dishKeySet/,'Registro settimanale dishKey assente');
  has(source.index,/dishKey/,'Controllo dishKey assente dai percorsi UI/manuali');
});

criterion(10,'Programmazione da domani, bozza, blocchi e commit atomico',()=>{
  has(source.motor,/if\(day<=today\)continue/,'Programmazione non limitata a domani');
  has(source.index,/menuDraft=/,'Bozza Menu assente');
  has(source.index,/bloccata/,'Blocchi realizzazione assenti');
  has(source.motor,/scriviPianoAtomico|transaction|tx\./,'Commit atomico piano assente');
});

criterion(11,'Flusso P → C.user → C AUTO → S/G → V',()=>{
  const body=functionBody(source.motor,'costruisciPastoSequenziale');
  const p=body.indexOf('proteine');
  const fixed=body.indexOf('fissiRimasti');
  const auto=body.indexOf('autoCandidati');
  const vegetable=body.indexOf('chiudiPastoConVerdura');
  assert(p>=0&&fixed>p&&auto>fixed&&vegetable>auto,'Ordine sequenziale P/C/V non rispettato');
});

criterion(12,'Carboidrati AUTO/FIXED/EXCLUDED e cap sui 14 pasti',()=>{
  has(source.nutrition,/autoEligibleKeys/,'Carboidrati AUTO assenti');
  has(source.nutrition,/excludedKeys/,'Carboidrati EXCLUDED assenti');
  has(source.nutrition,/fixedCounts/,'Carboidrati FIXED assenti');
  has(source.motor,/14/,'Contratto dei 14 slot non rilevato');
  has(functionBody(source.motor,'erroreValidazionePastoFinale'),/carbKeyUsato/,'Validazione C finale assente');
});

criterion(13,'Verdure: ricorrente, deperibile, disponibile, spesa',()=>{
  has(source.motor,/verduraRicorrenteRichiesta/,'Priorità ricorrente assente');
  has(source.motor,/variantiPrioritarieDeperimento/,'Priorità deperibilità assente');
  has(source.motor,/livelliPrioritaInventario/,'Interrogazione inventario assente');
  has(source.motor,/prioritaVerdureProgrammazionePasti/,'Fallback programmazione/spesa assente');
});

criterion(14,'V/S/G e residuo quantitativo con soglia 50 g',()=>{
  has(source.motor,/function calcolaBilancioVSG\(/,'Bilancio V/S/G assente');
  has(source.motor,/50/,'Soglia 50 g assente');
  has(source.motor,/residu/i,'Residuo vegetale assente');
});

criterion(15,'Sughi e condimenti con dose, allergeni, compatibilità e LRU',()=>{
  const cond=allRecipeItems().filter(x=>x.group.categoria==='Condimenti'&&x.kind==='ingrediente');
  assert(cond.length>0,'Condimenti catalogo assenti');
  assert(cond.every(x=>Number.isFinite(Number(x.item.dose))&&Number(x.item.dose)>0),'Condimento senza dose esplicita');
  has(source.motor,/assegnaCondimentiRotazioneGlobale/,'LRU globale condimenti assente');
  const anomalie=read('docs/ANOMALIE_DA_RISOLVERE.md');
  lacks(anomalie,/Famiglia "con pomodoro"/,'Famiglia con pomodoro ancora aperta');
});

criterion(16,'Olio: 10 g al giorno e 5 g per pasto',()=>{
  has(source.nutrition,/oilGramsPerDay:10/,'Quota olio giornaliera diversa da 10 g');
  has(source.nutrition,/oilGramsPerMainMeal=oilGramsPerDay\/2/,'Ripartizione olio per pasto assente');
});

criterion(17,'Roll C/P/V collegato alla UI e ricalcolo atomico',()=>{
  const body=functionBody(source.motor,'ruotaPasto');
  for(const tipo of ['C','P','V'])has(body,new RegExp("tipo==='"+tipo+"'|\\['C','P','V'\\]"),'Percorso Roll '+tipo+' non rilevato nel motore');
  has(source.index,/DietaPlannerMotorV12\.ruotaPasto\(/,'UI non collegata a ruotaPasto');
  has(source.index,/DietaPlannerMotorV12\.statoRollPasto\(/,'UI non collegata a statoRollPasto');
});

criterion(18,'Alternativa in bozza e salvataggio solo su conferma',()=>{
  has(source.index,/const bozzePropostaPasto\s*=\s*\{\}/,'Store bozze proposta assente');
  has(source.index,/Proposta alternativa/,'Rendering Alternativa assente');
  has(source.index,/Imposta come pasto/,'Conferma proposta assente');
  has(source.index,/salvaRoll\(bozza\.voce\)/,'Commit esplicito proposta assente');
});

criterion(19,'Salvafrigo da scadenze, avanzi e freezer',()=>{
  for(const name of ['getScadenzeImminenti','getAvanziScomodi','getCongelatiDaTempo','salvafrigo'])functionBody(source.motor,name);
  has(source.index,/usaInventario:true/,'Proposta Salvafrigo non collegata all’inventario');
});

criterion(20,'Consumo: storico, inventario, conteggi e stato',()=>{
  const body=functionBody(source.index,'elaboraConsumoAutomatico');
  has(body,/scalaInventarioPerRicetta/,'Consumo non scala inventario');
  has(body,/registraConsumoStorico/,'Consumo non registra storico');
  has(body,/consumato=true/,'Stato consumato non aggiornato');
});

criterion(21,'Colazione per gruppi, speciali e contatore morigerato',()=>{
  has(source.index,/generaColazione|componentiColazione/,'Composizione colazione assente');
  has(source.index,/colazioneSpecialeId/,'Colazioni speciali assenti');
  has(source.index,/contatoreColazioniMorigerate/,'Contatore colazioni morigerate assente');
});

criterion(22,'Frutta 2–3 porzioni e spuntini entro i cap',()=>{
  has(source.nutrition,/dailyMin:2,dailyMax:3,portionMinGrams:150,portionMaxGrams:200/,'Regola frutta errata');
  has(source.index,/CAP_SPUNTINO_SETTIMANALE/,'Cap spuntini settimanali assenti');
  has(source.index,/CAP_SPUNTINO_GIORNALIERO/,'Cap spuntini giornalieri assenti');
  has(source.index,/resolved[^\n]*\.fruit|fruit[^\n]*dailyMin/,'Distribuzione frutta del resolver non collegata alla programmazione');
});

criterion(23,'Pagina Pasto completa e azioni collegate',()=>{
  for(const token of ['meal-frame','Salvafrigo','Alternativa','Special','Dettagli'])assert(source.index.includes(token),'Elemento Pasto assente: '+token);
  has(source.index,/renderPasto|render.*Piano/,'Renderer Pasto assente');
});

criterion(24,'Pagina Menu con settimane, bozza e lucchetti',()=>{
  has(source.index,/renderMenuSettimanale/,'Renderer Menu assente');
  has(source.index,/menuSettimanaScarto/,'Navigazione settimane assente');
  has(source.index,/menuDraft/,'Bozza Menu assente');
  has(source.index,/lucchetto/,'Lucchetti realizzazione assenti');
});

criterion(25,'Dettaglio ricetta con quantità, allergeni, nutrizione e timer',()=>{
  const body=functionBody(source.index,'apriModalDettaglioRicetta');
  for(const token of ['ingredient','porzioni','nutriz','procedimento','timer'])assert(body.toLowerCase().includes(token),'Dettaglio senza '+token);
  has(body,/allergen/i,'Allergeni assenti dal dettaglio ricetta');
});

criterion(26,'Inventario e spesa con unità e variantId',()=>{
  has(source.index,/createObjectStore\('inventario'/,'Store inventario assente');
  has(source.index,/createObjectStore\('spesa'/,'Store spesa assente');
  has(source.index,/variantId/,'Collegamento variantId assente');
  has(source.index,/grammi|\bml\b|\bpz\b/,'Unità inventario incomplete');
  has(source.index,/calcolaListaSpesa/,'Calcolo lista spesa assente');
});

criterion(27,'Scanner EAN-13 collegato a variantId e confezioni',()=>{
  has(source.index,/BarcodeDetector|ZXing|Quagga/,'Motore scanner barcode assente');
  has(source.index,/getUserMedia/,'Accesso fotocamera assente');
  has(source.index,/EAN-?13/i,'Formato EAN-13 assente');
  has(source.index,/variantId/,'Associazione barcode→variantId assente');
});

criterion(28,'Google, UID, ruoli, whitelist e sincronizzazione Firestore',()=>{
  has(source.auth,/GoogleAuthProvider/,'Login Google assente');
  has(source.auth,/browserLocalPersistence/,'Persistenza login assente');
  has(source.auth,/doc\(firestore,'users',user\.uid\)/,'Profilo UID assente');
  has(source.rules,/request\.auth\.uid == userId/,'Confine UID Firestore assente');
  has(source.auth,/role|ruolo/,'Ruoli assenti');
  has(source.auth,/whitelist/i,'Whitelist assente');
  has(source.auth,/piano|inventario|spesa|impostazioni/,'Sincronizzazione dati applicativi assente');
});

criterion(29,'PWA root, manifest, service worker e fallback offline',()=>{
  assert.equal(catalog.manifest.start_url,'.','start_url PWA errato');
  has(source.index,/navigator\.serviceWorker\.register\('\.\/sw\.js\?v=2'\)/,'Service worker non registrato');
  has(source.sw,/cache/i,'Cache PWA assente');
  has(source.sw,/Offline|offline/,'Fallback offline assente');
  for(const icon of catalog.manifest.icons||[])assert(fs.existsSync(path.join(ROOT,icon.src.replace(/^\.\//,''))),'Icona PWA assente: '+icon.src);
});

criterion(30,'Controlli selettivi, revisione finale e registro',()=>{
  assert(fs.existsSync(path.join(__dirname,'criteri-pwa-selettivi.test.js')),'Script selettivo assente');
  assert(fs.existsSync(path.join(__dirname,'revisione-finale-criteri-pwa.test.js')),'Runner finale assente');
  has(source.agents,/REGISTRO_MODIFICHE\.md/,'Obbligo registro assente');
  inlineScriptsAreValid();
});

function parseSelection(argv){
  if(argv.includes('--list'))return {list:true,ids:[]};
  if(argv.includes('--all'))return {list:false,ids:[...criteria.keys()]};
  const raw=argv.filter(x=>!x.startsWith('--')).join(',');
  assert(raw,'Indicare uno o più criteri, per esempio: 6 oppure 6,7,8');
  const ids=[...new Set(raw.split(',').flatMap(part=>{
    const range=part.match(/^(\d+)-(\d+)$/);
    if(!range)return [Number(part)];
    const a=Number(range[1]),b=Number(range[2]),out=[];
    for(let i=Math.min(a,b);i<=Math.max(a,b);i++)out.push(i);
    return out;
  }))];
  for(const id of ids)assert(criteria.has(id),'Criterio inesistente: '+id);
  return {list:false,ids};
}

async function runSelection(ids,{quiet=false}={}){
  const results=[];
  for(const id of ids){
    const item=criteria.get(id);
    try{
      await item.run();
      results.push({id,title:item.title,status:'PASS'});
      if(!quiet)console.log(`STATIC_OK ${String(id).padStart(2,'0')} — ${item.title}`);
    }catch(error){
      results.push({id,title:item.title,status:'FAIL',error:error.message});
      if(!quiet)console.error(`STATIC_FAIL ${String(id).padStart(2,'0')} — ${item.title}\n  ${error.message}`);
    }
  }
  return results;
}

async function main(){
  const selection=parseSelection(process.argv.slice(2));
  if(selection.list){
    for(const item of criteria.values())console.log(`${String(item.id).padStart(2,'0')} — ${item.title}`);
    return;
  }
  const results=await runSelection(selection.ids);
  const failed=results.filter(x=>x.status==='FAIL');
  console.log(`\nTotale: ${results.length} · PASS: ${results.length-failed.length} · FAIL: ${failed.length}`);
  if(failed.length)process.exitCode=1;
}

module.exports={criteria,runSelection};
if(require.main===module)main().catch(error=>{console.error(error.stack||error);process.exitCode=1;});
