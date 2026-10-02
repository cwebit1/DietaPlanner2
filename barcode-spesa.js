(function(root){
'use strict';
function validEAN(code){
  if(!/^\d{13}$/.test(code))return false;
  return [...code].slice(0,12).reduce((sum,n,i)=>sum+Number(n)*(i%2?3:1),Number(code[12]))%10===0;
}
function quantity(product,count,variant){
  if(!validEAN(product.id)||!Number.isInteger(count)||count<1||!Number.isFinite(product.quantita)||product.quantita<=0)throw new Error('Codice, quantità o confezioni non validi');
  if(product.variantId!==variant.id)throw new Error('Ingrediente non corrispondente');
  if(!['g','ml','pz'].includes(product.unita))throw new Error('Unità non valida');
  if(product.unita==='pz'){
    if(!(Number(variant.pesoPezzo)>0))throw new Error('Manca il peso per pezzo: completare la variante');
    return product.quantita*count*Number(variant.pesoPezzo);
  }
  const native=variant.unitaMisura||'g';
  if(product.unita!==native)throw new Error('Conversione '+product.unita+' → '+native+' non definita per questo ingrediente');
  return product.quantita*count;
}
/* @qa-metadata {"id":"P13-barcode-openfoodfacts","paths":["onlineProduct","productSuggestion","open.find","open.form.onsubmit"],"focusedTest":"tests/pwa-barcode-online.test.js","rules":["locale prima della rete","nessun nutriente o ingrediente canonico importato","quantità solo dichiarata e unità senza densità inventata","risposta superata non modifica modulo","nessuna scrittura prima della conferma"],"pending":["riscontro API/CORS dalla PWA e fotocamera Android"]} */
const onlineCache=new Map(),onlineRequests=[];
function declaredQuantity(value,unit){
  const factors={g:['g',1],kg:['g',1000],mg:['g',0.001],ml:['ml',1],cl:['ml',10],l:['ml',1000],pz:['pz',1]};
  const factor=factors[String(unit||'').trim().toLowerCase()];
  const n=Number(String(value??'').trim().replace(',','.'));
  return factor&&Number.isFinite(n)&&n>0&&Number.isFinite(n*factor[1])?{quantita:n*factor[1],unita:factor[0]}:null;
}
function productSuggestion(code,product){
  if(!product||typeof product!=='object'||(product.code&&String(product.code)!==code))return null;
  const nome=String(product.product_name_it||product.product_name||'').trim();
  const marca=String(product.brands||'').trim(),formato=String(product.quantity||'').trim();
  let dose=declaredQuantity(product.product_quantity,product.product_quantity_unit);
  if(!dose){
    // Solo formato interamente numerico: il formato multiplo è una confezione totale.
    const m=formato.match(/^(?:(\d+)\s*[x×]\s*)?(\d+(?:[.,]\d+)?)\s*(kg|mg|g|ml|cl|l|pz)$/i);
    if(m)dose=declaredQuantity(Number(m[2].replace(',','.'))*Number(m[1]||1),m[3]);
  }
  if(!nome&&!marca&&!formato&&!dose)return null;
  return {id:code,nome,marca,...(dose||{}),formatoDichiarato:formato,fonte:'Open Food Facts',fonteUrl:'https://world.openfoodfacts.org/product/'+code};
}
async function onlineProduct(code,{fetcher=root.fetch?.bind(root),signal,timeoutMs=6000}={}){
  if(!validEAN(code))throw new Error('EAN-13 non valido');
  if(onlineCache.has(code))return onlineCache.get(code);
  const now=Date.now();while(onlineRequests.length&&onlineRequests[0]<=now-60000)onlineRequests.shift();
  if(onlineRequests.length>=15)throw new Error('Limite ricerche online raggiunto: attendi un minuto oppure compila manualmente.');
  if(!fetcher)throw new Error('Ricerca online non disponibile: compila manualmente.');
  const controller=new AbortController(),abort=()=>controller.abort();
  signal?.addEventListener('abort',abort,{once:true});if(signal?.aborted)abort();
  const timer=setTimeout(abort,timeoutMs);
  try{
    onlineRequests.push(now);
    const params=new URLSearchParams({fields:'code,product_name,product_name_it,brands,quantity,product_quantity,product_quantity_unit',lc:'it',cc:'it',app_name:'DietaPlanner2',app_version:'2'});
    const response=await fetcher('https://world.openfoodfacts.org/api/v3/product/'+code+'?'+params,{signal:controller.signal,credentials:'omit',referrerPolicy:'origin'});
    if(response.status===404){onlineCache.set(code,null);return null;}
    if(!response.ok)throw new Error('Servizio non disponibile');
    const data=await response.json(),product=productSuggestion(code,data.product);
    onlineCache.set(code,product);return product;
  }catch(error){
    throw new Error(controller.signal.aborted?'Ricerca interrotta o scaduta: compila manualmente.':'Ricerca online non disponibile: compila manualmente.');
  }finally{clearTimeout(timer);signal?.removeEventListener('abort',abort);}
}
async function open(options){
  const {read,all,commit}=options;
  const variants=await all('varianti');
  const dialog=document.createElement('dialog');
  dialog.innerHTML='<form><h3>Acquista con codice a barre</h3><video autoplay playsinline muted style="max-width:100%"></video><p data-status></p><label>EAN-13<input name="code" inputmode="numeric" required pattern="[0-9]{13}"></label><button type="button" data-camera>Fotocamera</button><button type="button" data-find>Cerca codice</button><label>Ingrediente<select name="variant" required></select></label><label>Nome prodotto<input name="name" required></label><label>Quantità per confezione<input name="amount" type="number" min="0.01" step="any" required></label><label>Unità<select name="unit"><option>g</option><option>ml</option><option>pz</option></select></label><label>Confezioni<input name="count" type="number" min="1" step="1" value="1" required></label><label>Scadenza (facoltativa)<input type="date" name="expiry"></label><label>Lotto (facoltativo)<input name="lot"></label><button type="submit">Conferma acquisto</button><button type="button" data-close>Annulla</button></form>';
  const form=dialog.querySelector('form'),f=form.elements,status=dialog.querySelector('[data-status]');
  const brand=document.createElement('label');brand.textContent='Marca (facoltativa)';
  const brandInput=document.createElement('input');brandInput.name='brand';brand.appendChild(brandInput);f.name.parentElement.after(brand);
  const credit=document.createElement('p');credit.innerHTML='Ricerca prodotti: <a href="https://world.openfoodfacts.org" target="_blank" rel="noopener">Open Food Facts</a> · <a href="https://opendatacommons.org/licenses/odbl/1-0/" target="_blank" rel="noopener">ODbL</a>';
  form.appendChild(credit);
  const placeholder=document.createElement('option');placeholder.value='';placeholder.textContent='Seleziona ingrediente…';f.variant.appendChild(placeholder);
  for(const v of variants){const opt=document.createElement('option');opt.value=v.id;opt.textContent=v.nome;f.variant.appendChild(opt);}
  let stream=null,frame=null,busy=false,sequence=0,request=null,suggestion=null,loadedCode='';
  const stop=()=>{if(frame)cancelAnimationFrame(frame);stream?.getTracks().forEach(t=>t.stop());stream=null;};
  const find=async()=>{
    const code=f.code.value.trim();
    if(!validEAN(code))throw new Error('EAN-13 non valido');
    request?.abort();const ticket=++sequence;request=new AbortController();const signal=request.signal;
    suggestion=null;loadedCode=code;f.variant.value='';f.name.value='';f.brand.value='';f.amount.value='';f.unit.value='g';f.expiry.value='';f.lot.value='';
    status.textContent='Cerco il prodotto…';
    const controls=[f.variant,f.name,f.brand,f.amount,f.unit,form.querySelector('[type="submit"]')];controls.forEach(c=>c.disabled=true);
    try{
      let product=await read('prodotti',code),local=!!product;
      if(!product)product=await onlineProduct(code,{signal});
      if(ticket!==sequence||code!==f.code.value.trim()||signal.aborted)return;
      if(product){
        suggestion=product;f.variant.value=local?product.variantId:'';f.name.value=product.nome||'';f.brand.value=product.marca||'';f.amount.value=product.quantita||'';f.unit.value=product.unita||'g';
        status.textContent=local?'Prodotto associato. Verifica e conferma.':'Trovato su Open Food Facts. Seleziona l’ingrediente e verifica nome e quantità prima di confermare.'+(product.formatoDichiarato?' Formato dichiarato: '+product.formatoDichiarato:'');
      }else status.textContent='Prodotto non trovato: associa ingrediente e formato manualmente.';
    }catch(error){if(ticket===sequence)status.textContent=error.message;}
    finally{if(ticket===sequence){request=null;controls.forEach(c=>c.disabled=false);}}
  };
  f.code.addEventListener('input',()=>{
    request?.abort();request=null;++sequence;suggestion=null;
    if(loadedCode&&f.code.value.trim()!==loadedCode){f.variant.value='';f.name.value='';f.brand.value='';f.amount.value='';f.unit.value='g';f.expiry.value='';f.lot.value='';loadedCode='';}
    [f.variant,f.name,f.brand,f.amount,f.unit,form.querySelector('[type="submit"]')].forEach(c=>c.disabled=false);status.textContent='';
  });
  dialog.querySelector('[data-find]').onclick=()=>find().catch(e=>status.textContent=e.message);
  dialog.querySelector('[data-camera]').onclick=async()=>{
    try{
      stop();
      if(!root.BarcodeDetector||!navigator.mediaDevices?.getUserMedia)throw new Error('Lettura fotocamera non disponibile: inserisci il codice');
      const formats=await root.BarcodeDetector.getSupportedFormats();
      if(!formats.includes('ean_13'))throw new Error('EAN-13 non supportato: inserisci il codice');
      const detector=new root.BarcodeDetector({formats:['ean_13']});
      stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'},audio:false});
      const video=dialog.querySelector('video');video.srcObject=stream;await video.play();
      const scan=async()=>{
        if(!dialog.open||!stream)return;
        try{
          const results=await detector.detect(video),code=results.find(x=>validEAN(x.rawValue));
          if(code){f.code.value=code.rawValue;stop();await find();return;}
          frame=requestAnimationFrame(scan);
        }catch(e){stop();status.textContent=e.message;}
      };
      frame=requestAnimationFrame(scan);
    }catch(e){stop();status.textContent=e.message;}
  };
  dialog.querySelector('[data-close]').onclick=()=>dialog.close();
  dialog.addEventListener('close',()=>{++sequence;request?.abort();stop();dialog.remove();});
  form.onsubmit=async event=>{
    event.preventDefault();if(busy||request)return;busy=true;
    try{
      const product={id:f.code.value.trim(),variantId:f.variant.value,nome:f.name.value.trim(),quantita:Number(f.amount.value),unita:f.unit.value};
      if(!product.nome||!product.variantId)throw new Error('Seleziona ingrediente e nome prodotto');
      if(f.brand.value.trim())product.marca=f.brand.value.trim();
      if(suggestion?.id===product.id&&suggestion.fonte){product.fonte=suggestion.fonte;product.fonteUrl=suggestion.fonteUrl;if(suggestion.formatoDichiarato)product.formatoDichiarato=suggestion.formatoDichiarato;}
      const variant=variants.find(v=>v.id===product.variantId);
      const total=quantity(product,Number(f.count.value),variant);
      await commit(product,{id:'barcode_'+crypto.randomUUID(),variantId:variant.id,quantita:total,zona:variant.zona||'dispensa',categoria:variant.categoria||'conf',stato:'disponibile',dataScadenza:f.expiry.value||null,lotto:f.lot.value||null,dataAcquisto:new Date().toISOString().slice(0,10)});
      dialog.close();
    }catch(e){status.textContent=e.message;}finally{busy=false;}
  };
  document.body.appendChild(dialog);dialog.showModal();
}
const api={validEAN,quantity,productSuggestion,onlineProduct,open};root.DietaPlannerBarcode=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
