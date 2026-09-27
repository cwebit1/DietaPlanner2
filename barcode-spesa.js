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
async function open(options){
  const {read,all,commit}=options;
  const variants=await all('varianti');
  const dialog=document.createElement('dialog');
  dialog.innerHTML='<form><h3>Acquista con codice a barre</h3><video autoplay playsinline muted style="max-width:100%"></video><p data-status></p><label>EAN-13<input name="code" inputmode="numeric" required pattern="[0-9]{13}"></label><button type="button" data-camera>Fotocamera</button><button type="button" data-find>Cerca codice</button><label>Ingrediente<select name="variant" required></select></label><label>Nome prodotto<input name="name" required></label><label>Quantità per confezione<input name="amount" type="number" min="0.01" step="any" required></label><label>Unità<select name="unit"><option>g</option><option>ml</option><option>pz</option></select></label><label>Confezioni<input name="count" type="number" min="1" step="1" value="1" required></label><label>Scadenza (facoltativa)<input type="date" name="expiry"></label><label>Lotto (facoltativo)<input name="lot"></label><button type="submit">Conferma acquisto</button><button type="button" data-close>Annulla</button></form>';
  const form=dialog.querySelector('form'),f=form.elements,status=dialog.querySelector('[data-status]');
  for(const v of variants){const opt=document.createElement('option');opt.value=v.id;opt.textContent=v.nome;f.variant.appendChild(opt);}
  let stream=null,frame=null,busy=false;
  const stop=()=>{if(frame)cancelAnimationFrame(frame);stream?.getTracks().forEach(t=>t.stop());stream=null;};
  const find=async()=>{
    const code=f.code.value.trim();
    if(!validEAN(code))throw new Error('EAN-13 non valido');
    const product=await read('prodotti',code);
    if(product){f.variant.value=product.variantId;f.name.value=product.nome;f.amount.value=product.quantita;f.unit.value=product.unita;status.textContent='Prodotto associato. Verifica e conferma.';}
    else{f.name.value='';f.amount.value='';status.textContent='Codice nuovo: associa ingrediente e formato prima di confermare.';}
  };
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
  dialog.addEventListener('close',()=>{stop();dialog.remove();});
  form.onsubmit=async event=>{
    event.preventDefault();if(busy)return;busy=true;
    try{
      const product={id:f.code.value.trim(),variantId:f.variant.value,nome:f.name.value.trim(),quantita:Number(f.amount.value),unita:f.unit.value};
      const variant=variants.find(v=>v.id===product.variantId);
      const total=quantity(product,Number(f.count.value),variant);
      await commit(product,{id:'barcode_'+crypto.randomUUID(),variantId:variant.id,quantita:total,zona:variant.zona||'dispensa',categoria:variant.categoria||'conf',stato:'disponibile',dataScadenza:f.expiry.value||null,lotto:f.lot.value||null,dataAcquisto:new Date().toISOString().slice(0,10)});
      dialog.close();
    }catch(e){status.textContent=e.message;}finally{busy=false;}
  };
  document.body.appendChild(dialog);dialog.showModal();
}
const api={validEAN,quantity,open};root.DietaPlannerBarcode=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
