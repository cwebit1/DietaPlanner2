'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../sw.js'),'utf8');
const handlers={},scope='https://example.test/app/',data=new Map([['dietaplanner-shell-contracts-v3',new Map([['vecchia','preservata']])]]);let missing=false;
const context={URL,Request,Response,Promise,self:{registration:{scope},clients:{claim:async()=>{}},addEventListener:(n,f)=>handlers[n]=f},fetch:async request=>new Response(request.url,{status:missing&&request.url.endsWith('motor-v12.js')?404:200}),caches:{
 open:async name=>{if(!data.has(name))data.set(name,new Map());return {put:async(k,v)=>data.get(name).set(k,v),match:async k=>data.get(name).get(k)};},
 keys:async()=>[...data.keys()],delete:async name=>data.delete(name)
}};vm.createContext(context);vm.runInContext(source,context);
async function event(name){let work;handlers[name]({waitUntil:p=>work=p});await work;}
(async()=>{
 missing=true;await assert.rejects(()=>event('install'),/Risorsa release assente/);assert(data.has('dietaplanner-shell-contracts-v3'));assert(!data.has('dietaplanner-shell-contracts-v16'));
 missing=false;await event('install');assert(data.has('dietaplanner-shell-contracts-v3'),'installazione non modifica cache attiva precedente');assert(data.get('dietaplanner-shell-contracts-v16').has(scope+'pwa-contracts.js'));
 let response;handlers.fetch({request:new Request(scope+'motor-v12.js?v=123'),respondWith:p=>response=p});assert.equal((await response).status,200,'cache shell gestisce query anti-cache del motore');
 await event('activate');assert(!data.has('dietaplanner-shell-contracts-v3'));assert(data.has('dietaplanner-shell-contracts-v16'));
 console.log('PASS: shell release distinta, install fallito conserva cache precedente, attivazione e avvio offline con query. Service worker simulato.');
})().catch(e=>{console.error(e);process.exitCode=1;});
