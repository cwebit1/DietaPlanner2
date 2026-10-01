'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8'),context={};vm.createContext(context);
const start=html.indexOf('function quantitaInventarioDaInput('),end=html.indexOf("document.getElementById('btnSalvaIngrediente').addEventListener",start);assert(start>=0&&end>start);vm.runInContext(html.slice(start,end),context);
for(const [raw,wanted] of [['',0],['0',0],['20.5',20.5],[200,200]])assert.equal(context.quantitaInventarioDaInput(raw),wanted);
for(const raw of ['-1','NaN','Infinity','5g',null,true])assert.throws(()=>context.quantitaInventarioDaInput(raw),/non negativo/);
const save=html.slice(end,html.indexOf("document.getElementById('btnSalvaConfigAvanzata')",end));assert(save.indexOf('quantitaInventarioDaInput')<save.indexOf("put('varianti'"),'rifiuto prima di modificare dati');
console.log('PASS: inventario rifiuta quantità negative/non finite senza scritture, mantiene zero e vuoto.');
