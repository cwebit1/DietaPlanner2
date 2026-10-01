'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
const context={};vm.createContext(context);
const groups=html.slice(html.indexOf('const COLAZIONE_GRUPPI ='),html.indexOf('/* Colazioni automatiche coerenti:'));
const schemas=html.slice(html.indexOf('const COLAZIONI_AUTOMATICHE_COHERENTI ='),html.indexOf('/* =========================================================\n   E3'));
vm.runInContext(groups+schemas+`;this.schemas=COLAZIONI_AUTOMATICHE_COHERENTI;`,context);
const variants=[];
for(const schema of context.schemas)for(const key of ['proteine','carboidrati','grassi','carboidrati_semplici']){
 if(schema[key]&&!variants.some(v=>v.nome===schema[key]&&v.colazioneGruppo===key))variants.push({id:'v'+variants.length,nome:schema[key],colazioneGruppo:key});
}
for(const schema of context.schemas){
 const result=context.componentiDaSchemaColazione(schema,variants);
 if(schema.proteine&&schema.carboidrati)assert(result?.proteine&&result.carboidrati);
 else assert.equal(result,null,'schema incompleto escluso senza inventare componenti');
}
for(let i=0;i<100;i++){
 const result=context.scegliColazioneAutomaticaCoerente(variants,[],[]);
 assert(result.proteine&&result.carboidrati);
}
const proteins=variants.filter(v=>v.colazioneGruppo==='proteine').map(v=>v.nome);
assert.equal(context.scegliColazioneAutomaticaCoerente(variants,[],proteins),null,'esclusioni senza fallback incompleto');
const explicit=context.componentiColazioneDaSet({proteine:null,carboidrati:variants.find(v=>v.colazioneGruppo==='carboidrati').id},variants);
assert.equal(explicit.proteine,null,'scelta esplicita Set conservata');
assert(explicit.carboidrati);
console.log('PASS: tutti gli schemi automatici richiedono P+C; esclusioni e scelte esplicite Set preservate.');
