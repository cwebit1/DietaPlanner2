/* Un'unica versione di HTML, motore, cataloghi e contratti, anche offline.
   L'installazione fallisce se una risorsa obbligatoria manca: resta la versione
   precedente. Il nuovo worker attende la chiusura delle vecchie pagine. */
const CACHE_NAME='dietaplanner-shell-contracts-v7';
const APP_FILES=['./','index.html','nutrition-config.js','engine-core.js',
  'pwa-contracts.js','barcode-spesa.js','motor-v12.js','firebase-auth.js',
  'db-ricette.json','ingredienti-new.json','db-visuale.json',
  'manifest.json','icon-192.png','icon-512.png'];
const appURL=path=>new URL(path,self.registration.scope).href;
/* @qa-metadata
{"id":"PWA-shell-coerente","paths":["install","activate","fetch"],"focusedTest":"tests/pwa-shell-aggiornamento.test.js","rules":["release preparata in cache distinta","risorsa mancante conserva worker precedente","nessun reset IndexedDB"],"pending":["installazione/aggiornamento/offline su dispositivo"]}
*/
self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const responses=await Promise.all(APP_FILES.map(async path=>{
      const response=await fetch(new Request(appURL(path),{cache:'reload'}));
      if(!response.ok)throw new Error('Risorsa release assente: '+path);
      return [appURL(path),response];
    }));
    const cache=await caches.open(CACHE_NAME);
    await Promise.all(responses.map(([url,response])=>cache.put(url,response)));
  })());
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    for(const name of await caches.keys()){
      if((name.startsWith('dietaplanner-shell-')||name.startsWith('dieta-planner-'))&&name!==CACHE_NAME)await caches.delete(name);
    }
    await self.clients.claim();
  })());
});
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url),scope=new URL(self.registration.scope);
  if(event.request.method!=='GET'||url.origin!==scope.origin||!url.pathname.startsWith(scope.pathname))return;
  url.search='';url.hash='';
  const shell=APP_FILES.some(path=>appURL(path)===url.href);
  if(shell){
    event.respondWith((async()=>{
      const cache=await caches.open(CACHE_NAME),cached=await cache.match(url.href);
      return cached||new Response('Versione applicazione incompleta: riaprire dopo aggiornamento',{status:503});
    })());
  }
  // Immagini opzionali restano indipendenti dal contratto del motore.
});
