'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
let choice='salva',valid=false,saves=0,transition=0,messages=[];
const draft={modificata:true,voci:new Map([['d',{chiave:'d',valore:2}]])};
const context={setDraft:draft,menuDraft:null,tabellaProteineDraft:{},tabellaProteineAnteprima:{},document:{querySelector:()=>({dataset:{view:'set'}})},mostraModaleAvviso:async()=>choice,avviso:async m=>messages.push(m),salvaSetCompleto:async(show)=>{assert.equal(show,false);saves++;return valid?{ok:true}:{ok:false,errori:['Limite superato']};},commitSetDraftAtomico:()=>{throw Error('bypass validazione');}};
vm.createContext(context);let start=html.indexOf('async function mostraVista(nome){'),end=html.indexOf("  document.querySelectorAll('nav.tabbar button')",start);context.finish=()=>transition++;vm.runInContext(html.slice(start,end)+'finish();}',context);
(async()=>{
 await context.mostraVista('piano');assert.equal(saves,1);assert.equal(transition,0);assert.equal(context.setDraft,draft);assert(messages[0].includes('Limite superato'));
 choice=null;await context.mostraVista('piano');assert.equal(saves,1);assert.equal(context.setDraft,draft);assert.equal(transition,0);
 choice='salva';valid=true;await context.mostraVista('piano');assert.equal(saves,2);assert.equal(context.setDraft,null);assert.equal(transition,1);
 console.log('PASS: Salva ed esci Set usa validazione comune, errore/chiusura conserva bozza, successo permette uscita.');
})().catch(e=>{console.error(e);process.exitCode=1;});
