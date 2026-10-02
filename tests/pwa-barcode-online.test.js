'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../barcode-spesa.js'),'utf8');
function setup(fetcher,cameraOptions={}){
 let dialog;const fields={};const submit={disabled:false};
 const node=()=>({value:'',disabled:false,listeners:{},appendChild(){},after(){},setAttribute(k,v){this[k]=v;},focus(){this.focused=true;},addEventListener(k,f){this.listeners[k]=f;}});
 for(const name of ['code','variant','name','amount','unit','count','expiry','lot'])fields[name]=node();
 fields.name.parentElement=node();fields.unit.value='g';fields.count.value='1';
 const status=node(),find=node(),camera=node(),close=node(),details=node(),search=node(),info=node(),title=node(),recognized=node(),create=node(),video=node(),cameraView=node();video.play=async()=>{};details.hidden=true;recognized.hidden=true;
 const form={elements:fields,appendChild(){},querySelector:()=>submit,checkValidity:()=>!!(fields.variant.value&&fields.name.value&&Number(fields.amount.value)>0&&fields.code.value.length===13),reportValidity(){this.reported=true;}};
 const document={body:{appendChild(){}},createElement(tag){
  if(tag==='dialog'){dialog={open:false,querySelector:s=>({'form':form,'[data-status]':status,'[data-find]':find,'[data-camera]':camera,'[data-close]':close,'[data-details]':details,'[data-search]':search,'[data-info]':info,'[data-product-name]':title,'[data-recognized]':recognized,'[data-new]':create,'[data-camera-view]':cameraView,'video':video}[s]),addEventListener(k,f){this[k]=f;},showModal(){this.open=true;},close(){this.open=false;this['closeEvent']?.();},remove(){this.removed=true;}};dialog.addEventListener=(k,f)=>dialog[k==='close'?'closeEvent':k]=f;return dialog;}
  const n=node();if(tag==='input')Object.defineProperty(n,'name',{set(v){fields[v]=n;}});return n;
 }};
 const context={window:{fetch:fetcher,...cameraOptions.window},module:{exports:{}},document,AbortController,URLSearchParams,setTimeout,clearTimeout,Date,crypto:{randomUUID:()=> 'test'},cancelAnimationFrame(){},navigator:cameraOptions.navigator||{},requestAnimationFrame:cameraOptions.frame||(()=>1)};
 vm.createContext(context);vm.runInContext(source,context);
 return {api:context.module.exports,fields,status,find,form,details,search,info,title,recognized,create,cameraView,get dialog(){return dialog;}};
}
const reply=product=>({ok:true,status:200,json:async()=>({product})});
(async()=>{
 let requests=0;
 const ui=setup(async(url,options)=>{requests++;assert(url.includes('/api/v3/product/'));assert.equal(options.credentials,'omit');assert(!url.includes('nutriments'));return reply({code:'3017620422003',product_name_it:'Crema',brands:'Marca',product_quantity:400,product_quantity_unit:'g',nutriments:{energy:999}});});
 const variants=[{id:'v',nome:'Ingrediente',unitaMisura:'g',kcal100:100}];const initial=JSON.stringify(variants);let commits=[];
 await ui.api.open({all:async()=>variants,read:async()=>null,commit:async(p,i)=>commits.push({p,i})});
 ui.fields.code.value='3017620422003';await ui.find.onclick();assert.equal(requests,1);assert.equal(ui.fields.name.value,'Crema');assert.equal(ui.fields.brand.value,'Marca');assert.equal(ui.fields.amount.value,400);assert.equal(ui.fields.variant.value,'');assert.equal(commits.length,0);assert.equal(ui.title.textContent,'Crema');assert.equal(ui.recognized.hidden,false);assert.equal(ui.details.hidden,true);assert.equal(ui.search.hidden,true);ui.info.onclick();assert.equal(ui.details.hidden,false);assert.equal(ui.search.hidden,true);ui.info.onclick();assert.equal(ui.details.hidden,true);
 await ui.form.onsubmit({preventDefault(){}});assert.equal(commits.length,0,'ingrediente da scegliere esplicitamente');assert.equal(ui.details.hidden,false);assert.equal(ui.form.reported,true);
 ui.fields.variant.value='v';await ui.form.onsubmit({preventDefault(){}});assert.equal(commits[0].i.quantita,400);assert.equal(commits[0].p.marca,'Marca');assert.equal(commits[0].p.fonte,'Open Food Facts');assert(!('nutriments' in commits[0].p));assert.equal(JSON.stringify(variants),initial);
 await ui.api.onlineProduct('3017620422003');assert.equal(requests,1,'riusa risultato nella sessione');
 const local=setup(async()=>{throw Error('la rete non deve essere chiamata');});await local.api.open({all:async()=>variants,read:async()=>commits[0].p,commit:async()=>{}});local.fields.code.value='3017620422003';await local.find.onclick();assert.equal(local.fields.variant.value,'v');assert.equal(local.fields.amount.value,400);assert.equal(local.create.hidden,true);assert.equal(local.info.hidden,false);
 for(const [p,q,u] of [[{product_quantity:1.5,product_quantity_unit:'kg'},1500,'g'],[{quantity:'3 x 125 g'},375,'g'],[{quantity:'1,5 L'},1500,'ml']]){const x=ui.api.productSuggestion('3017620422003',p);assert.equal(x.quantita,q);assert.equal(x.unita,u);}
 const uncertain=ui.api.productSuggestion('3017620422003',{product_name:'Uova',quantity:'6 uova'});assert(!('quantita' in uncertain));assert.equal(ui.api.productSuggestion('3017620422003',{code:'5901234123457',product_name:'Altro'}),null);
 await assert.rejects(()=>ui.api.onlineProduct('123'),/EAN/);
 const absent=setup(async()=>({ok:false,status:404}));assert.equal(await absent.api.onlineProduct('3017620422003'),null);
 const offline=setup(async()=>{throw Error('rete assente');});await assert.rejects(()=>offline.api.onlineProduct('3017620422003'),/compila manualmente/);
 const timeout=setup((_,o)=>new Promise((resolve,reject)=>o.signal.addEventListener('abort',()=>reject(Error('abort')))));await assert.rejects(()=>timeout.api.onlineProduct('3017620422003',{timeoutMs:10}),/scaduta/);
 let resolveLate;const late=setup(()=>new Promise(resolve=>resolveLate=resolve));await late.api.open({all:async()=>variants,read:async()=>null,commit:async()=>{throw Error('scrittura inattesa');}});
 late.fields.code.value='3017620422003';const pending=late.find.onclick();await new Promise(resolve=>setImmediate(resolve));late.fields.code.value='5901234123457';late.fields.code.listeners.input();late.fields.name.value='Manuale';resolveLate(reply({product_name:'Risposta vecchia',product_quantity:400,product_quantity_unit:'g'}));await pending;assert.equal(late.fields.name.value,'Manuale');assert.equal(late.fields.amount.value,'');assert.equal(late.fields.variant.disabled,false);assert.equal(late.recognized.hidden,true);
 const rate=setup(async()=>({ok:false,status:404}));for(let i=0;i<15;i++){const first='2000000000'+String(i).padStart(2,'0');const sum=[...first].reduce((s,n,j)=>s+Number(n)*(j%2?3:1),0);await rate.api.onlineProduct(first+((10-sum%10)%10));}await assert.rejects(()=>rate.api.onlineProduct('3017620422003'),/Limite/);
 assert(source.includes('<form novalidate>'));assert(source.includes('data-info hidden aria-expanded="false"'));assert(source.includes('data-details hidden'));assert(source.includes('data-recognized hidden'));assert(source.includes('Aggiungi all’inventario'));assert.equal((source.match(/data-close>Annulla/g)||[]).length,1);assert(source.includes('class="barcode-line"'));assert(source.includes('background:var(--panel,#20261a)'));

 const unknown=setup(async()=>({ok:false,status:404}));let registered=[],stock=[];
 await unknown.api.open({all:async()=>variants,read:async()=>null,register:async p=>registered.push(p),commit:async(p,i)=>stock.push(i)});
 assert.equal(unknown.search.hidden,false,'fallback manuale senza camera');assert.equal(unknown.info.hidden,true);assert.equal(unknown.create.hidden,true);
 unknown.fields.code.value='3017620422003';await unknown.find.onclick();assert.equal(unknown.create.hidden,false);assert.equal(unknown.info.hidden,true);assert.equal(unknown.details.hidden,true);assert.equal(unknown.search.hidden,true);
 unknown.create.onclick();assert.equal(unknown.details.hidden,false);assert.equal(unknown.create.hidden,true);unknown.fields.name.value='Nuovo';unknown.fields.amount.value='125';unknown.fields.variant.value='v';
 await unknown.form.onsubmit({preventDefault(){}});assert.equal(registered.length,1);assert.equal(stock.length,0);assert.equal(unknown.recognized.hidden,false);assert.equal(unknown.details.hidden,true);
 await unknown.form.onsubmit({preventDefault(){}});assert.equal(stock.length,1);assert.equal(stock[0].quantita,125);
 let cameraCalls=0,stopped=0,scanFrame;const device={window:{BarcodeDetector:class {static async getSupportedFormats(){return ['ean_13'];}async detect(){return [{rawValue:'3017620422003'}];}}},navigator:{mediaDevices:{getUserMedia:async opts=>{cameraCalls++;assert.equal(opts.video.facingMode.ideal,'environment');return {getTracks:()=>[{stop(){stopped++;}}]};}}},frame:cb=>{scanFrame=cb;return 1;}};
 const direct=setup(async()=>reply({product_name:'Letto',quantity:'125 g'}),device);await direct.api.open({all:async()=>variants,read:async()=>null,commit:async()=>{}});assert.equal(cameraCalls,1,'avvio automatico senza click');assert.equal(direct.cameraView.hidden,false);assert.equal(direct.search.hidden,true);assert.equal(direct.info.hidden,true);assert.equal(direct.create.hidden,true);
 await scanFrame();assert.equal(direct.title.textContent,'Letto');assert.equal(direct.recognized.hidden,false);assert.equal(stopped,1);assert.equal(direct.cameraView.hidden,true);
 let release;const closing=setup(async()=>null,{...device,navigator:{mediaDevices:{getUserMedia:()=>new Promise(r=>release=r)}}});const opening=closing.api.open({all:async()=>variants,read:async()=>null,commit:async()=>{}});await new Promise(r=>setImmediate(r));closing.dialog.close();release({getTracks:()=>[{stop(){stopped++;}}]});await opening;assert.equal(stopped,2,'chiusura durante richiesta permesso rilascia stream');
 console.log('PASS: apertura fotocamera diretta, stati identificato/sconosciuto, registrazione separata e rilascio camera; vista compatta, spunta, dettagli, crea nuovo senza scritture, validazione espansa; lookup locale/online, cache, conferma ingrediente/acquisto, unità e multipack dichiarati, quantità ignota, offline/404/timeout, risposta superata, rate limit e catalogo immutato. DOM/API simulati.');
})().catch(e=>{console.error(e);process.exitCode=1;});
