'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../barcode-spesa.js'),'utf8');
function setup(fetcher){
 let dialog;const fields={};const submit={disabled:false};
 const node=()=>({value:'',disabled:false,listeners:{},appendChild(){},after(){},setAttribute(k,v){this[k]=v;},focus(){this.focused=true;},addEventListener(k,f){this.listeners[k]=f;}});
 for(const name of ['code','variant','name','amount','unit','count','expiry','lot'])fields[name]=node();
 fields.name.parentElement=node();fields.unit.value='g';fields.count.value='1';
 const status=node(),find=node(),camera=node(),close=node(),details=node(),search=node(),info=node(),title=node(),recognized=node(),create=node(),video=node();details.hidden=true;recognized.hidden=true;
 const form={elements:fields,appendChild(){},querySelector:()=>submit,checkValidity:()=>!!(fields.variant.value&&fields.name.value&&Number(fields.amount.value)>0&&fields.code.value.length===13),reportValidity(){this.reported=true;}};
 const document={body:{appendChild(){}},createElement(tag){
  if(tag==='dialog'){dialog={open:false,querySelector:s=>({'form':form,'[data-status]':status,'[data-find]':find,'[data-camera]':camera,'[data-close]':close,'[data-details]':details,'[data-search]':search,'[data-info]':info,'[data-product-name]':title,'[data-recognized]':recognized,'[data-new]':create,'video':video}[s]),addEventListener(k,f){this[k]=f;},showModal(){this.open=true;},close(){this.open=false;this['closeEvent']?.();},remove(){this.removed=true;}};dialog.addEventListener=(k,f)=>dialog[k==='close'?'closeEvent':k]=f;return dialog;}
  const n=node();if(tag==='input')Object.defineProperty(n,'name',{set(v){fields[v]=n;}});return n;
 }};
 const context={window:{fetch:fetcher},module:{exports:{}},document,AbortController,URLSearchParams,setTimeout,clearTimeout,Date,crypto:{randomUUID:()=> 'test'},cancelAnimationFrame(){}};
 vm.createContext(context);vm.runInContext(source,context);
 return {api:context.module.exports,fields,status,find,form,details,search,info,title,recognized,create,get dialog(){return dialog;}};
}
const reply=product=>({ok:true,status:200,json:async()=>({product})});
(async()=>{
 let requests=0;
 const ui=setup(async(url,options)=>{requests++;assert(url.includes('/api/v3/product/'));assert.equal(options.credentials,'omit');assert(!url.includes('nutriments'));return reply({code:'3017620422003',product_name_it:'Crema',brands:'Marca',product_quantity:400,product_quantity_unit:'g',nutriments:{energy:999}});});
 const variants=[{id:'v',nome:'Ingrediente',unitaMisura:'g',kcal100:100}];const initial=JSON.stringify(variants);let commits=[];
 await ui.api.open({all:async()=>variants,read:async()=>null,commit:async(p,i)=>commits.push({p,i})});
 ui.fields.code.value='3017620422003';await ui.find.onclick();assert.equal(requests,1);assert.equal(ui.fields.name.value,'Crema');assert.equal(ui.fields.brand.value,'Marca');assert.equal(ui.fields.amount.value,400);assert.equal(ui.fields.variant.value,'');assert.equal(commits.length,0);assert.equal(ui.title.textContent,'Crema');assert.equal(ui.recognized.hidden,false);assert.equal(ui.details.hidden,true);assert.equal(ui.search.hidden,true);ui.info.onclick();assert.equal(ui.details.hidden,false);assert.equal(ui.search.hidden,false);ui.info.onclick();assert.equal(ui.details.hidden,true);
 await ui.form.onsubmit({preventDefault(){}});assert.equal(commits.length,0,'ingrediente da scegliere esplicitamente');assert.equal(ui.details.hidden,false);assert.equal(ui.form.reported,true);
 ui.fields.variant.value='v';await ui.form.onsubmit({preventDefault(){}});assert.equal(commits[0].i.quantita,400);assert.equal(commits[0].p.marca,'Marca');assert.equal(commits[0].p.fonte,'Open Food Facts');assert(!('nutriments' in commits[0].p));assert.equal(JSON.stringify(variants),initial);
 await ui.api.onlineProduct('3017620422003');assert.equal(requests,1,'riusa risultato nella sessione');
 const local=setup(async()=>{throw Error('la rete non deve essere chiamata');});await local.api.open({all:async()=>variants,read:async()=>commits[0].p,commit:async()=>{}});local.fields.code.value='3017620422003';await local.find.onclick();assert.equal(local.fields.variant.value,'v');assert.equal(local.fields.amount.value,400);local.create.onclick();assert.equal(local.recognized.hidden,true);assert.equal(local.details.hidden,false);assert.equal(local.fields.code.value,'3017620422003');assert.equal(local.fields.name.value,'');assert.equal(local.fields.variant.value,'');assert.equal(local.fields.name.focused,true);
 for(const [p,q,u] of [[{product_quantity:1.5,product_quantity_unit:'kg'},1500,'g'],[{quantity:'3 x 125 g'},375,'g'],[{quantity:'1,5 L'},1500,'ml']]){const x=ui.api.productSuggestion('3017620422003',p);assert.equal(x.quantita,q);assert.equal(x.unita,u);}
 const uncertain=ui.api.productSuggestion('3017620422003',{product_name:'Uova',quantity:'6 uova'});assert(!('quantita' in uncertain));assert.equal(ui.api.productSuggestion('3017620422003',{code:'5901234123457',product_name:'Altro'}),null);
 await assert.rejects(()=>ui.api.onlineProduct('123'),/EAN/);
 const absent=setup(async()=>({ok:false,status:404}));assert.equal(await absent.api.onlineProduct('3017620422003'),null);
 const offline=setup(async()=>{throw Error('rete assente');});await assert.rejects(()=>offline.api.onlineProduct('3017620422003'),/compila manualmente/);
 const timeout=setup((_,o)=>new Promise((resolve,reject)=>o.signal.addEventListener('abort',()=>reject(Error('abort')))));await assert.rejects(()=>timeout.api.onlineProduct('3017620422003',{timeoutMs:10}),/scaduta/);
 let resolveLate;const late=setup(()=>new Promise(resolve=>resolveLate=resolve));await late.api.open({all:async()=>variants,read:async()=>null,commit:async()=>{throw Error('scrittura inattesa');}});
 late.fields.code.value='3017620422003';const pending=late.find.onclick();await new Promise(resolve=>setImmediate(resolve));late.fields.code.value='5901234123457';late.fields.code.listeners.input();late.fields.name.value='Manuale';resolveLate(reply({product_name:'Risposta vecchia',product_quantity:400,product_quantity_unit:'g'}));await pending;assert.equal(late.fields.name.value,'Manuale');assert.equal(late.fields.amount.value,'');assert.equal(late.fields.variant.disabled,false);assert.equal(late.recognized.hidden,true);
 const rate=setup(async()=>({ok:false,status:404}));for(let i=0;i<15;i++){const first='2000000000'+String(i).padStart(2,'0');const sum=[...first].reduce((s,n,j)=>s+Number(n)*(j%2?3:1),0);await rate.api.onlineProduct(first+((10-sum%10)%10));}await assert.rejects(()=>rate.api.onlineProduct('3017620422003'),/Limite/);
 assert(source.includes('<form novalidate>'));assert(source.includes('data-info aria-expanded="false"'));assert(source.includes('data-details hidden'));assert(source.includes('data-recognized hidden'));assert(source.includes('Aggiungi prodotto'));
 console.log('PASS: vista compatta, spunta, dettagli, crea nuovo senza scritture, validazione espansa; lookup locale/online, cache, conferma ingrediente/acquisto, unità e multipack dichiarati, quantità ignota, offline/404/timeout, risposta superata, rate limit e catalogo immutato. DOM/API simulati.');
})().catch(e=>{console.error(e);process.exitCode=1;});
