'use strict';
const assert=require('node:assert/strict');
const N=require('../nutrition-config.js');
const resolve=(rule,user={})=>N.resolveNutritionConfig({nutritionist:{ingredientConstraints:{x:rule}},user:{ingredientWeeklyCaps:user}});
for(const field of ['min','max'])for(const value of [-1,1.5,true,'abc','',Infinity]){
 const r=resolve({stato:'limitato',[field]:value});assert.equal(r.valid,false,field+'='+value);
}
for(const context of ['colazione','pastoPrincipale','spuntino']){
 for(const value of [-1,1.5,true,'abc','',Infinity])assert.equal(resolve({contesti:{[context]:{max:value}}}).valid,false);
 for(const value of [0,-1,true,'abc','',Infinity])assert.equal(resolve({contesti:{[context]:{quantita:value}}}).valid,false);
 const r=resolve({contesti:{[context]:{quantita:12.5,max:0}}});assert(r.valid);assert.equal(r.ingredientConstraints.x.contexts[context].quantity,12.5);assert.equal(r.ingredientConstraints.x.contexts[context].max,0);
}
const incoherent=resolve({stato:'limitato',min:3,max:1});assert.equal(incoherent.valid,false);assert.equal(incoherent.ingredientConstraints.x.max,1);
const restricted=resolve({stato:'limitato',min:2,max:4},{x:1});assert.equal(restricted.valid,false);assert.equal(restricted.ingredientConstraints.x.max,1);
const uncapped=resolve({stato:'limitato',min:null,max:null,quantita:null});assert(uncapped.valid);assert.equal(uncapped.ingredientConstraints.x.max,null);
assert.equal(resolve({stato:'disponibile'},{x:-1}).valid,false);
console.log('PASS: quantità positive, frequenze intere, null/zero distinti e intervalli incoerenti respinti senza ampliare i limiti.');
