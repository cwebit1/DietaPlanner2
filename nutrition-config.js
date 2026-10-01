(function(root,factory){
  if(typeof module==='object'&&module.exports) module.exports=factory();
  else root.DietaPlannerNutritionConfig=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const VERSION='PDF-V1.2';

  const PDF_BASELINE={
    proteinFrequencies:{
      carne:{min:1,max:3},
      pesce:{min:2,max:3},
      formaggi:{min:2,max:3},
      uova:{min:1,max:2},
      legumi:{min:2,max:null}
    },
    subtypeCaps:{carne_rossa:1,affettati:1,pesce_grande:1,pesce_conservato:1},
    carbohydrateWeeklyCaps:{
      gnocchi:2,
      pasta_ripiena:2,
      gallette:2,
      crackers:2,
      friselle:2,
      taralli:2,
      piadina:2,
      pasta_sfoglia:2
    },
    carbohydrateUncapped:['pasta','pasta_fresca','riso','farro','orzo','cous_cous','pane','patate','polenta'],
    fruit:{dailyMin:2,dailyMax:3,portionMinGrams:150,portionMaxGrams:200},
    vegetables:{vegetablePortionMinGrams:200,vegetablePortionMaxGrams:250,saladPortionMinGrams:70,saladPortionMaxGrams:80},
    specialBreakfastMax:2,
    snackWeeklyMax:{grana_spuntino:3,crackers_spuntino:3,pane_marmellata_spuntino:3,granita_spuntino:3,patatine_grisbi:2},
    snackDailyMax:{frutta_secca_giornaliero:1},
    oil:{minGramsPerDay:10,maxGramsPerDay:15}
  };

  const APP_DEFAULTS={
    proteinTargets:{carne:3,pesce:3,formaggi:3,uova:2,legumi:3},
    specialBreakfastMax:1,
    specialMealsMax:2,
    snackWeeklyCaps:{da_limitare:2,grana_spuntino:2,crackers_spuntino:2,pane_marmellata_spuntino:2,granita_spuntino:2,patatine_grisbi:1},
    snackDailyCaps:{frutta_secca_giornaliero:1},
    cooldownDays:{carboidrati:7,verdure:2},
    oilGramsPerDay:10,
    rotationDays:{stack:15,roll:15},
    breakfastRegularCount:7,
    snackPortions:{grana:20,crackers:30,pane:25,marmellata:5,granita:150,patatine:20,fruttaSecca:10,yogurt:125},
    deadlines:{pranzo:'15:00',cena:'22:00'},
    carbSlots:14,
    carbCellMax:6,
    limitedCarbTotalMax:3
  };

  const PROFILE_FORBIDDEN_MACROS={
    onnivoro:[],
    vegetariano:['carne','pesce'],
    vegano:['carne','pesce','formaggi','uova']
  };

  /* Metadata PDF contestuali. Gli alias per nome servono soltanto a collegare
     il catalogo corrente alla baseline; il motore non deve dedurre regole dal nome.
     Quando il catalogo avrà metadata espliciti, questi alias potranno essere migrati. */
  const PDF_CONTEXT_RULES_EXACT={
    'uova':{
      colazione:{maxPerWeek:2,quantityDefault:1,quantityMin:1,quantityMax:2,unit:'pz'},
      pastoPrincipale:{quantityDefault:2,quantityMin:2,quantityMax:2,unit:'pz'}
    },
    'ricotta':{
      colazione:{quantityDefault:50,quantityMin:50,quantityMax:60,unit:'g'},
      pastoPrincipale:{quantityDefault:100,quantityMin:100,quantityMax:100,unit:'g'}
    },
    'salmone affumicato':{
      colazione:{quantityDefault:40,quantityMin:40,quantityMax:40,unit:'g'},
      pastoPrincipale:{quantityDefault:100,quantityMin:100,quantityMax:100,unit:'g'}
    },
    'burro':{
      colazione:{maxPerWeek:2,note:'1 cucchiaino; quantità in grammi da non inferire senza metadata unità'}
    },
    'crema di nocciole e cacao':{
      colazione:{maxPerWeek:2,note:'1 cucchiaino; quantità in grammi da non inferire senza metadata unità'}
    }
  };
  const PDF_CONTEXT_RULES_SUBTYPE={
    affettati:{
      colazione:{quantityDefault:40,quantityMin:40,quantityMax:40,unit:'g'},
      pastoPrincipale:{quantityDefault:60,quantityMin:60,quantityMax:60,unit:'g'}
    }
  };

  function clone(value){
    if(value===undefined) return undefined;
    return JSON.parse(JSON.stringify(value));
  }
  function mergeContextRules(base,extra){
    const out=clone(base||{});
    for(const [context,rule] of Object.entries(extra||{}))out[context]=Object.assign({},out[context]||{},clone(rule));
    return out;
  }
  function contextDefaultsForIngredient(meta){
    meta=meta||{};
    const name=String(meta.nome||meta.name||'').trim().toLowerCase(),subtype=meta.sottotipo||meta.subtype||null;
    return mergeContextRules(PDF_CONTEXT_RULES_SUBTYPE[subtype],PDF_CONTEXT_RULES_EXACT[name]);
  }
  function own(obj,key){return !!obj&&Object.prototype.hasOwnProperty.call(obj,key);}
  function finite(value){const n=Number(value);return Number.isFinite(n)?n:null;}
  function nonNegative(value){const n=finite(value);return n!==null&&n>=0?n:null;}
  function positive(value){const n=finite(value);return n!==null&&n>0?n:null;}
  function clamp(value,min,max){
    let n=Number(value);
    if(!Number.isFinite(n)) return null;
    if(min!==null&&min!==undefined) n=Math.max(min,n);
    if(max!==null&&max!==undefined) n=Math.min(max,n);
    return n;
  }
  function integer(value){
    const n=finite(value);
    return n===null?null:Math.trunc(n);
  }
  function pushUnique(arr,msg){if(!arr.includes(msg))arr.push(msg);}

  /* Decisione esplicita di Cwe: il tetto cumulativo settimanale dei
     carboidrati limitati è una regola applicativa APP-CWE (non derivata
     dal PDF), configurabile ad personam dal nutrizionista. Campo
     canonico limitedCarbTotalMax: intero 0-14, default 3 quando assente
     (configurazioni storiche prive del campo si risolvono
     automaticamente con 3, nessuna migrazione). Valori decimali,
     negativi, non numerici o superiori a 14 rendono l'intera
     configurazione non valida (mai salvati, mai silenziosamente
     clampati) - in quel caso questa funzione restituisce comunque il
     default 3 come valore di fallback nell'oggetto risolto, ma
     resolved.valid resta false grazie all'errore accodato qui. */
  function resolveLimitedCarbTotalMax(config,errors){
    if(!own(config,'limitedCarbTotalMax')||config.limitedCarbTotalMax===null||config.limitedCarbTotalMax===undefined){
      return APP_DEFAULTS.limitedCarbTotalMax;
    }
    const raw=config.limitedCarbTotalMax,n=Number(raw);
    if(!Number.isFinite(n)||!Number.isInteger(n)||n<0||n>14){
      pushUnique(errors,'Tetto cumulativo carboidrati limitati non valido ('+JSON.stringify(raw)+'): deve essere un intero tra 0 e 14.');
      return APP_DEFAULTS.limitedCarbTotalMax;
    }
    return n;
  }

  // Il PDF fornisce default; i valori espliciti del nutrizionista sono
  // vincolanti. null su un massimo significa nessun tetto, non zero.
  function clinicalCount(raw,key,fallback,errors,label,nullable){
    if(!own(raw,key)||raw[key]===undefined)return fallback;
    if(raw[key]===null)return nullable?null:fallback;
    const value=raw[key];
    const n=(typeof value==='number'||(typeof value==='string'&&value.trim()!==''))?Number(value):NaN;
    if(!Number.isInteger(n)||n<0){
      pushUnique(errors,label+': deve essere un intero non negativo.');
      return fallback;
    }
    return n;
  }

  function resolveProteinFrequencies(raw,warnings,errors){
    const out={};raw=raw||{};
    for(const key of Object.keys(PDF_BASELINE.proteinFrequencies)){
      const pdf=PDF_BASELINE.proteinFrequencies[key],req=raw[key]||{};
      const min=clinicalCount(req,'min',pdf.min,errors,key+' minimo',false);
      const max=clinicalCount(req,'max',pdf.max,errors,key+' massimo',true);
      if(max!==null&&max<min)pushUnique(errors,key+': minimo '+min+' supera il massimo '+max+'.');
      // Target tecnico, non esposto come prescrizione: resta nel range
      // clinico impostato, anche quando si restringe una configurazione salvata.
      let target=clinicalCount(req,'target',APP_DEFAULTS.proteinTargets[key],errors,key+' target',false);
      target=Math.max(min,target);
      if(max!==null)target=Math.min(max,target);
      const quantity=req.quantita===null||req.quantita===undefined?null:positive(req.quantita);
      if(req.quantita!==null&&req.quantita!==undefined&&
        (quantity===null||!['number','string'].includes(typeof req.quantita)))
        pushUnique(errors,key+': quantità non valida.');
      out[key]={min,max,target,quantita:quantity};
    }
    return out;
  }

  function resolveSubtypeCaps(raw,warnings,errors){
    raw=raw||{};
    const out={};
    for(const [key,pdfMax] of Object.entries(PDF_BASELINE.subtypeCaps)){
      out[key]=clinicalCount(raw,key,pdfMax,errors,key+' massimo',true);
    }
    return out;
  }

  function clinicalQuantity(raw,key,fallback,errors,label,allowZero){
    if(!own(raw,key)||raw[key]===null||raw[key]===undefined)return fallback;
    const value=raw[key];
    const n=(typeof value==='number'||(typeof value==='string'&&value.trim()!==''))?Number(value):NaN;
    if(!Number.isFinite(n)||(allowZero?n<0:n<=0)){
      pushUnique(errors,label+(allowZero?': deve essere un numero non negativo.':': deve essere una quantità positiva.'));
      return fallback;
    }
    return n;
  }

  function ingredientQuantity(resolved,id,context,fallback,options){
    options=options||{};
    const exact=resolved.recipeDoses?.[options.recipeId]?.[options.name];
    if(exact!=null)return exact;
    if(options.recipeDose!=null&&options.recipeDose!=='')return Number(options.recipeDose);
    const rule=resolved.ingredientConstraints?.[id];
    const contextual=rule?.contexts?.[context]?.quantity;
    if(contextual!=null&&!rule.contexts[context].quantityIsDefault)return contextual;
    if(context==='pastoPrincipale'&&rule?.quantity!=null)return rule.quantity;
    if(context==='pastoPrincipale'&&resolved.proteinFrequencies?.[options.macro]?.quantita!=null)
      return resolved.proteinFrequencies[options.macro].quantita;
    if(contextual!=null)return contextual;
    return fallback;
  }

  function mainMealConstraints(resolved,otherCounts){
    return Object.fromEntries(Object.entries(resolved.ingredientConstraints).map(([id,rule])=>{
      const used=otherCounts[id]||0;
      return [id,{...rule,min:rule.min==null?null:Math.max(0,rule.min-used),max:rule.max==null?null:Math.max(0,rule.max-used)}];
    }));
  }

  // Le dichiarazioni appartengono al modello, non al catalogo esploso.
  // Nessun default numerico per S/G: quantità e massimo sono distinti.
  function recipeIngredientQuantity(resolved,id,component,options,fallback){
    const declaration=component.quantita;
    if(!declaration)return {quantity:ingredientQuantity(resolved,id,'pastoPrincipale',fallback,options),missing:false};
    const exact=resolved.recipeDoses?.[options.recipeId]?.[options.name];
    if(exact!=null)return {quantity:exact,missing:false};
    let quantity=null;
    if(declaration.fonte==='ricetta')quantity=component.dose??null;
    else if(declaration.fonte==='ingrediente'){
      const partial=['S','G','Condimento'].some(role=>(component.ruoli||[]).includes(role));
      const rule=resolved.ingredientConstraints?.[id],context=rule?.contexts?.[declaration.contesto];
      quantity=partial?(context&&!context.quantityIsDefault?context.quantity:rule?.quantity)??null:ingredientQuantity(resolved,id,declaration.contesto,null,{...options,recipeDose:undefined});
      if(quantity==null&&options.fallbackAllowed)quantity=fallback;
    }
    else if(declaration.fonte==='nutrizionista'){
      const match=/^quoteVegetali\.([SG])$/.exec(declaration.parametro||'');
      if(!match)throw new Error('Riferimento quantità ricetta non valido: '+declaration.parametro);
      quantity=resolved.quoteVegetali?.[match[1]]?.quantita??null;
      if(quantity!=null&&declaration.quota!=null)quantity*=Number(declaration.quota);
    }else throw new Error('Fonte quantità ricetta non valida: '+declaration.fonte);
    if(declaration.fonte==='ingrediente'&&quantity==null&&!['S','G','Condimento'].some(role=>(component.ruoli||[]).includes(role)))quantity=fallback;
    if(quantity!=null&&(!Number.isFinite(Number(quantity))||Number(quantity)<0))throw new Error('Quantità ricetta non valida: '+options.name);
    return {quantity:quantity==null?0:Number(quantity),missing:quantity==null};
  }

  function recipeRoleLimits(resolved,ingredients){
    const limits={S:null,G:null};
    for(const i of ingredients||[]){
      if(!i.limite)continue;
      const match=/^quoteVegetali\.([SG])\.massimo$/.exec(i.limite.parametro||'');
      if(i.limite.fonte!=='nutrizionista'||!match)throw new Error('Riferimento limite ricetta non valido');
      limits[match[1]]=resolved.quoteVegetali?.[match[1]]?.massimo??null;
    }
    return limits;
  }

  function resolveFruit(raw,warnings,errors){
    raw=raw||{};
    const min=clinicalQuantity(raw,'min',PDF_BASELINE.fruit.dailyMin,errors,'Frutta minimo giornaliero',true);
    const max=(own(raw,'max')&&raw.max===null)?null:clinicalQuantity(raw,'max',PDF_BASELINE.fruit.dailyMax,errors,'Frutta massimo giornaliero',true);
    const portionMin=clinicalQuantity(raw,'portionMin',PDF_BASELINE.fruit.portionMinGrams,errors,'Frutta porzione minima');
    const portionMax=clinicalQuantity(raw,'portionMax',PDF_BASELINE.fruit.portionMaxGrams,errors,'Frutta porzione massima');
    if(max!==null&&min>max)pushUnique(errors,'Frutta: minimo superiore al massimo.');
    if(portionMin>portionMax)pushUnique(errors,'Frutta: porzione minima superiore alla massima.');
    return {min,max,portionMin,portionMax};
  }

  function resolveIngredientConstraints(clinical,userCaps,errors){
    clinical=clinical||{};
    userCaps=userCaps||{};
    const out={};
    const keys=new Set([...Object.keys(clinical),...Object.keys(userCaps)]);
    const contexts=['colazione','pastoPrincipale','spuntino'];
    for(const id of keys){
      const c=clinical[id]||{},user=clinicalCount(userCaps,id,null,errors,'Ingrediente '+id+' massimo utente',true);
      const contextRules={};
      for(const context of contexts){
        const raw=c.contesti&&c.contesti[context]||{};
        const q=clinicalQuantity(raw,'quantita',null,errors,'Ingrediente '+id+' ('+context+') quantità contestuale');
        const mx=clinicalCount(raw,'max',null,errors,'Ingrediente '+id+' ('+context+') massimo contestuale',true);
        contextRules[context]={quantity:q,max:mx};
        if(raw._quantityDefault===true)contextRules[context].quantityIsDefault=true;
      }
      if(c.stato==='escluso'){
        out[id]={state:'excluded',clinicalState:'escluso',min:null,max:0,quantity:null,contexts:contextRules,userMax:user};
        continue;
      }
      const clinicalLimited=c.stato==='limitato';
      const min=clinicalLimited?clinicalCount(c,'min',null,errors,'Ingrediente '+id+' minimo',true):null;
      const clinicalMax=clinicalLimited?clinicalCount(c,'max',null,errors,'Ingrediente '+id+' massimo',true):null;
      const quantity=clinicalLimited?clinicalQuantity(c,'quantita',null,errors,'Ingrediente '+id+' quantità'):null;
      if(clinicalLimited&&min!==null&&clinicalMax!==null&&clinicalMax<min){
        pushUnique(errors,'Ingrediente '+id+': minimo clinico '+min+' supera il massimo clinico '+clinicalMax+'.');
      }
      let max=clinicalMax;
      if(user!==null) max=max===null?user:Math.min(max,user);

      if(min!==null&&max!==null&&max<min){
        pushUnique(errors,'Ingrediente '+id+': il tetto utente '+max+' è sotto il minimo clinico '+min+'.');
      }
      const state=clinicalLimited?'limited':(user!==null?'user_limited':'available');
      out[id]={state,clinicalState:c.stato||'disponibile',min,max,quantity,contexts:contextRules,userMax:user};
    }
    return out;
  }

  /* Normalizzatore di compatibilita' del formato storico piu' vecchio
     (precedente all'introduzione di configCarboidratiStati), eseguito ad
     ogni lettura delle impostazioni: non scrive nulla, non e' una
     migrazione persistente, va rieseguito identico ogni volta che questi
     dati vengono letti. Il vecchio formato contava un totale di caselle
     carboidrato cliccate per chiave (configCarboidrati) con un array
     "origine" (configCarboidratiOrigini) 'utente'/'sistema' per indice; il
     vecchio pulsante Salva completava sempre automaticamente il totale a
     CONFIG_CARB_TOTALE_OBBLIGATORIO prima di scrivere, quindi il conteggio
     grezzo per chiave puo' includere caselle aggiunte dal completamento
     automatico ("Completa e fissa"/"Casuale"), mai scelte dall'utente.

     L'array origine e' affidabile SOLO quando e' un vero array, ha
     esattamente la stessa lunghezza del conteggio grezzo e ogni elemento e'
     esattamente 'utente' oppure 'sistema' (nessun altro valore). Solo in
     questo caso si contano le sole caselle 'utente' come FIXED (zero
     elementi 'utente' => AUTO, mai un conteggio inventato).

     Quando l'array e' assente, piu' corto, piu' lungo, o contiene un
     valore diverso da 'utente'/'sistema', il dato e' incompleto o
     inconsistente e non c'e' modo affidabile di isolare le sole caselle
     utente: in questo caso un conteggio grezzo positivo resta interamente
     FIXED (mai perso, mai ridotto a un sottoinsieme dedotto), un conteggio
     grezzo zero resta AUTO. Questa e' la regola conservativa: con dati
     incompleti non si deve mai perdere un conteggio storico positivo.

     Punto canonico unico: sia l'interfaccia (Set) sia il motore devono
     derivare gli stessi conteggi da questa funzione, mai duplicare la
     logica altrove. */
  function legacyCarbohydrateUserCounts(rawCounts,origins){
    rawCounts=rawCounts||{};origins=origins||{};
    const counts={};
    for(const key of Object.keys(rawCounts)){
      const n=Math.max(0,Math.trunc(Number(rawCounts[key])||0));
      const source=origins[key];
      const affidabile=Array.isArray(source)&&source.length===n&&source.every(x=>x==='utente'||x==='sistema');
      if(affidabile){
        const userCount=source.filter(x=>x==='utente').length;
        if(userCount>0) counts[key]=userCount;
      }else if(n>0){
        counts[key]=n;
      }
    }
    return counts;
  }

  /* Stato canonico carboidrati:
     - le voci senza tetto PDF (carbohydrateUncapped) sono SEMPRE AUTO;
       qualunque vecchio FIXED/EXCLUDED/count/zero esplicito viene
       neutralizzato qui, prima di qualunque uso da parte di Set o motore;
     - le voci con tetto settimanale sono le sole configurabili: assenza,
       AUTO o zero significano 0 utilizzi (EXCLUDED); un conteggio positivo
       significa FIXED esatto, poi validato contro il tetto PDF/applicativo.
     Questa funzione e' l'unico punto canonico di normalizzazione: nessun
     chiamante deve reimplementare la distinzione. */
  function normalizeCarbohydrateSelection(input){
    input=input||{};
    const counts=input.counts||input.configCarboidrati||{};
    const states=input.states||{};
    const uncapped=new Set(PDF_BASELINE.carbohydrateUncapped);
    const limited=Object.keys(PDF_BASELINE.carbohydrateWeeklyCaps);
    const keys=[...uncapped,...limited];
    const out={};

    for(const key of keys){
      if(uncapped.has(key)){
        out[key]={mode:'auto',count:0};
        continue;
      }

      const st=states[key];
      if(st&&typeof st==='object'&&st.mode==='fixed'){
        const count=Math.max(0,integer(st.count)||0);
        out[key]=count>0?{mode:'fixed',count}:{mode:'excluded',count:0};
        continue;
      }
      if(typeof st==='number'&&st>0){
        out[key]={mode:'fixed',count:Math.trunc(st)};
        continue;
      }

      const n=own(counts,key)?integer(counts[key]):null;
      if(n!==null&&n>0){
        out[key]={mode:'fixed',count:n};
      }else{
        out[key]={mode:'excluded',count:0};
      }
    }
    return out;
  }

  function resolveCarbohydratePlan(input,errors,limitedCarbTotalMax,clinicalCaps){
    clinicalCaps=clinicalCaps||PDF_BASELINE.carbohydrateWeeklyCaps;
    limitedCarbTotalMax=limitedCarbTotalMax===undefined?APP_DEFAULTS.limitedCarbTotalMax:limitedCarbTotalMax;
    const selection=normalizeCarbohydrateSelection(input);
    const fixedCounts={},excludedKeys=[],autoEligibleKeys=[];
    let fixedTotal=0,limitedFixedTotal=0;

    for(const [key,state] of Object.entries(selection)){
      const pdfCap=clinicalCaps[key];
      if(state.mode==='excluded'){
        excludedKeys.push(key);
        continue;
      }
      if(state.mode==='fixed'){
        let n=Math.max(0,integer(state.count)||0);
        if(pdfCap!==undefined&&pdfCap!==null&&n>pdfCap){
          pushUnique(errors,key+': '+n+' occorrenze superano il tetto nutrizionista '+pdfCap+'.');
        }
        fixedCounts[key]=n;
        fixedTotal+=n;
        if(pdfCap!==undefined) limitedFixedTotal+=n;
        continue;
      }
      if(pdfCap===undefined) autoEligibleKeys.push(key);
    }

    if(limitedFixedTotal>limitedCarbTotalMax){
      pushUnique(errors,'Carboidrati limitati: '+limitedFixedTotal+' occorrenze superano il tetto applicativo totale '+limitedCarbTotalMax+'.');
    }
    if(fixedTotal>APP_DEFAULTS.carbSlots){
      pushUnique(errors,'Carboidrati: '+fixedTotal+' occorrenze fisse superano i '+APP_DEFAULTS.carbSlots+' slot settimanali.');
    }

    const remainingSlots=Math.max(0,APP_DEFAULTS.carbSlots-fixedTotal);
    if(remainingSlots>0&&autoEligibleKeys.length===0){
      pushUnique(errors,'Carboidrati: nessuna voce AUTO senza tetto disponibile per completare i '+remainingSlots+' slot residui.');
    }

    return {
      selection,
      fixedCounts,
      fixedTotal,
      remainingSlots,
      autoEligibleKeys,
      excludedKeys,
      limitedFixedTotal,
      totalSlots:APP_DEFAULTS.carbSlots,
      randomizeNature:true,
      randomizePlacement:true,
      autoInsertWeeklyCapped:false
    };
  }

  function resolveVegetablePortions(raw,warnings,errors){
    raw=raw||{};
    return {
      vegetablePortionGrams:clinicalQuantity(raw,'vegetablePortionGrams',PDF_BASELINE.vegetables.vegetablePortionMinGrams,errors,'Porzione ortaggi'),
      saladPortionGrams:clinicalQuantity(raw,'saladPortionGrams',PDF_BASELINE.vegetables.saladPortionMinGrams,errors,'Porzione insalata')
    };
  }

  function vegetableCoverage(entries,portionConfig){
    entries=Array.isArray(entries)?entries:[];
    const cfg=Object.assign({vegetablePortionGrams:200,saladPortionGrams:70},portionConfig||{});
    let rawFraction=0;
    for(const row of entries){
      if(!row) continue;
      const qty=nonNegative(row.quantity);
      if(qty===null||qty<=0) continue;
      const target=row.kind==='salad'?cfg.saladPortionGrams:cfg.vegetablePortionGrams;
      if(target>0) rawFraction+=qty/target;
    }
    const coveredFraction=Math.min(1,rawFraction);
    const remainingFraction=Math.max(0,1-coveredFraction);
    return {
      coveredFraction,
      remainingFraction,
      rawFraction,
      residualVegetableGrams:remainingFraction*cfg.vegetablePortionGrams,
      residualSaladGrams:remainingFraction*cfg.saladPortionGrams
    };
  }

  function resolveNutritionConfig(input){
    input=input||{};
    const warnings=[],errors=[];
    const nutritionist=input.nutritionist||{};
    const config=nutritionist.config||input.configAvanzata||{};
    const user=input.user||{};

    const profileName=PROFILE_FORBIDDEN_MACROS[config.dietProfile]?config.dietProfile:'onnivoro';
    if(config.dietProfile&&!PROFILE_FORBIDDEN_MACROS[config.dietProfile]){
      pushUnique(warnings,'Profilo alimentare sconosciuto: usato onnivoro.');
    }

    const proteinFrequencies=resolveProteinFrequencies(config.proteinFrequencies,warnings,errors);
    const subtypeCaps=resolveSubtypeCaps(config.subtypeCaps,warnings,errors);
    const fruit=resolveFruit(config.fruit,warnings,errors);
    const vegetablePortions=resolveVegetablePortions(config.vegetables,warnings,errors);

    /* Regola definitiva di Cwe: la settimana ha sempre due pasti
       principali al giorno con categorie proteiche DIVERSE (mai un
       "maxProteinSourcesPerDay", concetto eliminato). Perché questo sia
       sempre possibile, dopo profilo (esclusioni per dieta
       vegetariana/vegana) ed esclusioni esplicite del nutrizionista
       (max:0 su una categoria) devono restare almeno due categorie
       proteiche ammesse: con una sola, pranzo e cena non potrebbero mai
       avere categorie differenti. Punto unico di validazione: se
       insufficienti, la configurazione è dichiarata incompatibile
       (valid=false) e chi la salva/usa deve fermarsi qui, mai salvare o
       generare con questa configurazione. */
    const forbiddenSet=new Set(PROFILE_FORBIDDEN_MACROS[profileName]);
    const categorieProteicheAmmesse=Object.keys(proteinFrequencies).filter(k=>!forbiddenSet.has(k)&&proteinFrequencies[k].max!==0);
    if(categorieProteicheAmmesse.length<2){
      errors.push('Categorie proteiche disponibili insufficienti dopo profilo ed esclusioni ('+categorieProteicheAmmesse.length+'): servono almeno due categorie proteiche ammesse per completare pranzo e cena con categorie sempre diverse.');
    }

    const specialBreakfastMax=clinicalCount(config,'specialBreakfastMax',APP_DEFAULTS.specialBreakfastMax,errors,'Colazioni speciali massimo',true);
    const snackWeeklyCaps={},snackDailyCaps={};
    for(const [key,value] of Object.entries(APP_DEFAULTS.snackWeeklyCaps))
      snackWeeklyCaps[key]=clinicalCount(config.snackWeeklyCaps||{},key,value,errors,'Spuntino '+key+' massimo settimanale',true);
    for(const [key,value] of Object.entries(APP_DEFAULTS.snackDailyCaps))
      snackDailyCaps[key]=clinicalCount(config.snackDailyCaps||{},key,value,errors,'Spuntino '+key+' massimo giornaliero',true);

    /* Decisione esplicita di Cwe (prevale sul testo PDF "2-3 cucchiaini per
       pasto"): l'olio EVO ha un'unica fonte quantitativa GIORNALIERA, non
       per pasto - 10 g/die, ripartiti 5 g a pranzo e 5 g a cena. Il campo
       legacy "oilGramsPerMeal" (mai realmente consumato dalla pipeline
       nuova) non alimenta questo valore: leggerlo come se fosse già una
       quota giornaliera raddoppierebbe silenziosamente un vecchio 10 g
       "per pasto" in 20 g/die, esattamente l'errore da evitare. Solo il
       nuovo campo canonico "oilGramsPerDay" viene letto. */
    const oilGramsPerDay=clinicalQuantity(config,'oilGramsPerDay',APP_DEFAULTS.oilGramsPerDay,errors,'Olio giornaliero',true);
    const oilLunchPercent=clinicalQuantity(config,'oilLunchPercent',50,errors,'Percentuale olio a pranzo',true);
    if(oilLunchPercent>100)pushUnique(errors,'Percentuale olio a pranzo: massimo 100.');
    const oilGramsByMeal={pranzo:oilGramsPerDay*oilLunchPercent/100,cena:oilGramsPerDay*(100-oilLunchPercent)/100};
    const oilGramsPerMainMeal=oilGramsPerDay/2; // compatibilità per chiamanti senza contesto pasto

    const userIngredientCaps=user.ingredientWeeklyCaps||user.tettiIngredienteSettimanali||{};
    const clinicalIngredients=Object.fromEntries(Object.entries(nutritionist.ingredientConstraints||input.vincoliIngredientiNutrizionista||{}).map(([id,rule])=>[id,{...rule,contesti:{...rule?.contesti}}]));
    for(const base of input.ingredientCatalog||[]){
      const defaults=contextDefaultsForIngredient(base);
      if(!Object.keys(defaults).length)continue;
      const rule=clinicalIngredients[base.id]||(clinicalIngredients[base.id]={});
      rule.contesti=rule.contesti||{};
      for(const [context,d] of Object.entries(defaults)){
        const fallback={};
        if(d.quantityDefault!=null)fallback.quantita=d.quantityDefault;
        if(d.maxPerWeek!=null)fallback.max=d.maxPerWeek;
        const stored=rule.contesti[context]||{},useDefault=stored.quantita==null&&fallback.quantita!=null;
        rule.contesti[context]={...fallback,...stored,_quantityDefault:useDefault};
        if(useDefault)rule.contesti[context].quantita=fallback.quantita;
      }
    }
    const ingredientConstraints=resolveIngredientConstraints(clinicalIngredients,userIngredientCaps,errors);

    const carbInput=user.carbohydrates||{
      counts:user.configCarboidrati||{},
      explicitZeroKeys:user.configCarboidratiExplicitZeroKeys||[],
      states:user.configCarboidratiStati||{}
    };
    const limitedCarbTotalMax=resolveLimitedCarbTotalMax(config,errors);
    const carbohydrateWeeklyCaps={};
    for(const [key,value] of Object.entries(PDF_BASELINE.carbohydrateWeeklyCaps))
      carbohydrateWeeklyCaps[key]=clinicalCount(config.carbohydrateWeeklyCaps||{},key,value,errors,'Carboidrato '+key+' massimo',true);
    const carbohydrates=resolveCarbohydratePlan(carbInput,errors,limitedCarbTotalMax,carbohydrateWeeklyCaps);

    const specialMealsMax=clinicalCount(config,'specialMealsMax',APP_DEFAULTS.specialMealsMax,errors,'Pasti speciali massimo',true);
    const cooldownDays=Object.assign({},APP_DEFAULTS.cooldownDays,config.cooldownDays||{});
    const deadlines={};
    for(const [meal,value] of Object.entries(APP_DEFAULTS.deadlines)){
      const requested=config.deadlines?.[meal]??value;
      if(typeof requested!=='string'||!/^([01]\d|2[0-3]):[0-5]\d$/.test(requested)){
        pushUnique(errors,'Orario '+meal+': usare HH:MM valido.');deadlines[meal]=value;
      }else deadlines[meal]=requested;
    }
    const rotationDays={};
    for(const key of ['stack','roll'])rotationDays[key]=clinicalCount(config.rotationDays||{},key,APP_DEFAULTS.rotationDays[key],errors,'Intervallo '+key,false);
    const breakfastRegularCount=clinicalCount(config,'breakfastRegularCount',APP_DEFAULTS.breakfastRegularCount,errors,'Contatore colazioni',false);
    if(breakfastRegularCount<1)pushUnique(errors,'Contatore colazioni: almeno una colazione.');
    const snackPortions={};
    for(const [key,value] of Object.entries(APP_DEFAULTS.snackPortions))snackPortions[key]=clinicalQuantity(config.snackPortions||{},key,value,errors,'Dose spuntino '+key);


    const carbohydrateClasses={};
    for(const key of ['complessi','semplici']){
      const raw=config.carbohydrateClasses?.[key]||{};
      const min=clinicalCount(raw,'min',null,errors,'Classe '+key+' minimo',true);
      const max=clinicalCount(raw,'max',null,errors,'Classe '+key+' massimo',true);
      if(min!=null&&max!=null&&min>max)pushUnique(errors,'Classe '+key+': minimo superiore al massimo.');
      carbohydrateClasses[key]={min,max};
    }
    const quoteVegetali={};
    for(const role of ['S','G']){
      const raw=config.quoteVegetali?.[role]||{};
      const quantita=clinicalQuantity(raw,'quantita',null,errors,'Quota '+role+' quantità',true);
      const massimo=clinicalQuantity(raw,'massimo',null,errors,'Quota '+role+' massimo',true);
      if(quantita!=null&&massimo!=null&&quantita>massimo)pushUnique(errors,'Quota '+role+': quantità superiore al massimo.');
      quoteVegetali[role]={quantita,massimo};
    }
    const recipeDoses={};
    for(const [id,ingredients] of Object.entries(config.recipeDoses||{})){
      if(!ingredients||typeof ingredients!=='object'||Array.isArray(ingredients)){pushUnique(errors,'Dosi ricetta '+id+': formato non valido.');continue;}
      recipeDoses[id]={};
      for(const name of Object.keys(ingredients)){
        const q=clinicalQuantity(ingredients,name,null,errors,'Ricetta '+id+' / '+name);
        if(q!=null)recipeDoses[id][name]=q;
      }
    }
    const allergens=[...new Set(nutritionist.allergens||input.allergeniAttivi||[])];
    const blockedIngredientIds=[...new Set(nutritionist.blockedIngredientIds||input.ingredientiBloccati||[])];

    return {
      version:VERSION,
      valid:errors.length===0,
      errors,
      warnings,
      profile:{name:profileName,forbiddenProteinMacros:PROFILE_FORBIDDEN_MACROS[profileName].slice()},
      proteinFrequencies,
      subtypeCaps,
      ingredientConstraints,
      carbohydrates,
      limitedCarbTotalMax,
      fruit,
      vegetables:vegetablePortions,
      specialBreakfastMax,
      specialMealsMax,
      snackWeeklyCaps,
      snackDailyCaps,
      oilGramsPerDay,
      oilGramsPerMainMeal,oilLunchPercent,oilGramsByMeal,carbohydrateWeeklyCaps,
      cooldownDays,rotationDays,breakfastRegularCount,snackPortions,recipeDoses,quoteVegetali,carbohydrateClasses,
      deadlines,
      safety:{allergens,blockedIngredientIds}
    };
  }

  return {
    VERSION,
    PDF_BASELINE:clone(PDF_BASELINE),
    APP_DEFAULTS:clone(APP_DEFAULTS),
    PROFILE_FORBIDDEN_MACROS:clone(PROFILE_FORBIDDEN_MACROS),
    PDF_CONTEXT_RULES_EXACT:clone(PDF_CONTEXT_RULES_EXACT),
    PDF_CONTEXT_RULES_SUBTYPE:clone(PDF_CONTEXT_RULES_SUBTYPE),
    contextDefaultsForIngredient,ingredientQuantity,recipeIngredientQuantity,recipeRoleLimits,mainMealConstraints,
    legacyCarbohydrateUserCounts,
    normalizeCarbohydrateSelection,
    resolveCarbohydratePlan:function(input){const errors=[];const plan=resolveCarbohydratePlan(input,errors);return Object.assign({valid:errors.length===0,errors},plan);},
    vegetableCoverage,
    resolveNutritionConfig
  };
});
