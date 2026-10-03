'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
let plan,expired=false,writes=0,used=0,timer,markup;
const options=[{id:'a',nome:'Mela',ingredienti:[{variantId:'mela',quantita:150}]},{id:'b',nome:'Yogurt',ingredienti:[{variantId:'yogurt',quantita:125}]}];
const variants=[{id:'mela',nome:'Mela',ingredienteId:'frutta'},{id:'yogurt',nome:'Yogurt',ingredienteId:'latte',immagine:'assets/yogurt.png'}];
const esc=x=>String(x??'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
const context={WeakMap,Date,Math,JSON,structuredClone,requestAnimationFrame:cb=>cb(),clearTimeout(){},setTimeout:cb=>{timer=cb;return 1;},
 getOne:async(store,id)=>store==='piano'?structuredClone(plan):structuredClone(options.find(r=>r.id===id)),getAll:async name=>name==='varianti'?variants:[],
 fasciaPastoSuperata:()=>expired,opzioniSpuntinoDisponibili:async()=>options,ingredientiEffettiviVoce:async v=>structuredClone(options.find(r=>r.id===v.ricettaId).ingredienti),
 put:async(store,row)=>{assert.equal(store,'piano');plan=structuredClone(row);writes++;},segnaRicettaUsata:async()=>used++,
 materializzaSpuntinoCorrente:async(r,v)=>({...r,ingredienti:v.ingredientiEffettivi||r.ingredienti}),nutrizionePerPersona:async()=>({kcal:90}),etichettaOpzioneSpuntino:async r=>r.nome,
 calcolaCoperturaRicetta:async()=>1,nutrizioneInaffidabile:()=>false,stellaBtn:()=>'',escPastoRs:esc,iconaIngredientePastoRs:()=> '🍎',finePastoMinuti:()=>1200,
 renderBloccoSemplice:async()=>{},giornoSelezionato:'2099-01-01',renderNutrizioneGiorno(){},renderIndicatoreFrutta(){},aggiornaListaSpesaAutomatica(){},avviso:async()=>{}};
vm.createContext(context);const a=html.indexOf('const timerScadenzaSpuntiniRs='),b=html.indexOf('async function renderBloccoSemplice(',a);vm.runInContext(html.slice(a,b),context);
const el={clientWidth:320,isConnected:true,querySelector:()=>null,querySelectorAll:()=>[]};
(async()=>{
 assert.equal(await context.salvaSceltaSpuntinoCarosello('2099-01-01','spuntino1','a'),true);assert.equal(plan.ricettaId,'a');assert.equal(plan.consumato,undefined);assert.equal(writes,1);assert.equal(used,1);
 await context.renderSpuntinoCarosello(el,'spuntino1','2099-01-01',structuredClone(plan),s=>markup=s);
 assert(markup.includes('has-selection'));assert(markup.includes('aria-pressed="true"'));assert(markup.includes('aria-pressed="false"'));assert.equal((markup.match(/snack-carousel-group/g)||[]).length,3);assert(markup.includes('assets/yogurt.png'));assert(markup.includes('snack-choice-text">Mela'));assert(timer,'scadenza aggiorna riquadro aperto');
 assert.equal(await context.salvaSceltaSpuntinoCarosello('2099-01-01','spuntino1','b'),true);assert.equal(plan.ricettaId,'b');assert.deepEqual(plan.ingredientiEffettivi,options[1].ingredienti);
 assert.equal(await context.salvaSceltaSpuntinoCarosello('2099-01-01','spuntino1','b'),true);assert.equal(plan.ricettaId,null);assert(!plan.ingredientiEffettivi);assert(!plan.nutrizioneTotale);
 await context.renderSpuntinoCarosello(el,'spuntino1','2099-01-01',plan,s=>markup=s);assert(!markup.includes('has-selection'));assert(!markup.includes('aria-pressed="true"'));
 const before=writes;assert.equal(await context.salvaSceltaSpuntinoCarosello('2099-01-01','spuntino1','inesistente'),false);assert.equal(writes,before);
 plan={id:'2099-01-01_spuntino1',ricettaId:'a',ingredientiEffettivi:options[0].ingredienti};expired=true;
 assert.equal(await context.salvaSceltaSpuntinoCarosello('2099-01-01','spuntino1','b'),false);assert.equal(writes,before);
 await context.renderSpuntinoCarosello(el,'spuntino1','2099-01-01',plan,s=>markup=s);assert(markup.includes('snack-selected-only'));assert(!markup.includes('<button'));assert(!markup.includes('Yogurt'));assert(!markup.includes('data-snack-carousel'));
 expired=false;plan.consumato=true;assert.equal(await context.salvaSceltaSpuntinoCarosello('2099-01-01','spuntino1','a'),false);
 const image={complete:true,naturalWidth:0,nextElementSibling:{hidden:true},addEventListener(){}};el.querySelectorAll=selector=>selector==='[data-snack-image]'?[image]:[];
 await context.renderSpuntinoCarosello(el,'spuntino1','2099-01-01',plan,s=>markup=s);assert.equal(image.hidden,true);assert.equal(image.nextElementSibling.hidden,false);
 plan=undefined;context.ingredientiEffettiviVoce=async v=>{expired=true;return options[0].ingredienti;};assert.equal(await context.salvaSceltaSpuntinoCarosello('2099-01-01','spuntino1','a'),false);assert.equal(writes,before,'scadenza durante materializzazione non salva');
 assert(html.includes('opacity:.5'));assert(html.includes('scroll-snap-type:none'));assert(html.includes("if(aperto)requestAnimationFrame(()=>el._centraSpuntino?.());"));assert(html.includes("chosen.offsetLeft-(track.clientWidth-chosen.offsetWidth)/2"));
 console.log('PASS: selezione/sostituzione/toggle nel piano, riapertura dati, snapshot puliti, limiti, scadenza durante scelta, consumati immutati, renderer readonly e fallback immagine; DOM simulato, nessuna verifica visuale.');
})().catch(e=>{console.error(e);process.exitCode=1;});
