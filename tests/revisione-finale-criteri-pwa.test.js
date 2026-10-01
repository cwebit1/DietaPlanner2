'use strict';
// Prove funzionali mirate delle integrazioni. I controlli regex sono opzionali
// e non promuovono nessuno dei 30 criteri a funzionante.
const {spawnSync}=require('node:child_process'),path=require('node:path');
const files=['pwa-contratti-essenziali.test.js','pwa-spuntini-frutta-runtime.test.js','pwa-integrazione-runtime.test.js'];
let failed=false;
for(const file of files){
  const result=spawnSync(process.execPath,[path.join(__dirname,file)],{stdio:'inherit',timeout:180000});
  if(result.status!==0){failed=true;console.error('NON SUPERATO: '+file+(result.error?' — '+result.error.message:''));}
}
(async()=>{
  if(process.argv.includes('--static')){
    const {criteria,runSelection}=require('./criteri-pwa-selettivi.test.js');
    await runSelection([...criteria.keys()]);
  }
  console.log('Revisione 30 punti APERTA: vedere docs/ESITO_INTERVENTI_PWA.md. Vedere il riscontro dei 16 punti: collaudo dispositivo/IndexedDB, scanner e cloud non certificato; dosi S/G sospese, aromi esclusi. Frutta/spuntini liberi e dosati.');
  process.exitCode=failed?1:2; // 2 = prove mirate superate, revisione complessiva non chiusa
})();
