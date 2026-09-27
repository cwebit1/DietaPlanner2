import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js';
import {
  GoogleAuthProvider,
  browserLocalPersistence,
  getAuth,
  onAuthStateChanged,
  setPersistence,
  signInWithPopup,
  signOut
} from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js';
import {
  doc,
  collection,
  getDoc,
  getDocs,
  getFirestore,
  runTransaction,
  serverTimestamp,
  setDoc
} from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyAR6KGaiCzD7QLf7NwGiK2JGUyV6Du6XdY',
  authDomain: 'dietaplanner-a6683.firebaseapp.com',
  projectId: 'dietaplanner-a6683',
  storageBucket: 'dietaplanner-a6683.firebasestorage.app',
  messagingSenderId: '359859329968',
  appId: '1:359859329968:web:7473a1d5e40317d2369475'
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

let currentUser = null;
let currentAccess = {role:'local',allowed:false};
let readyResolve;
const ready = new Promise(resolve => { readyResolve = resolve; });

function publicUser(user){
  return user ? {
    uid:user.uid,
    role:currentAccess.role,
    displayName:user.displayName || '',
    email:user.email || '',
    photoURL:user.photoURL || ''
  } : null;
}

async function ensureProfile(user){
  if(!user||!currentAccess.allowed) return;
  await setDoc(doc(firestore,'users',user.uid), {
    displayName:user.displayName || '',
    email:user.email || '',
    photoURL:user.photoURL || '',
    lastLoginAt:serverTimestamp(),
    appVersion:'2'
  }, {merge:true});
}

function emitAuth(){
  window.dispatchEvent(new CustomEvent('dietaplanner-auth-changed', {
    detail:{user:publicUser(currentUser)}
  }));
}

async function login(){
  await setPersistence(auth,browserLocalPersistence);
  const result=await signInWithPopup(auth,provider);
  return publicUser(result.user);
}

async function logout(){
  await signOut(auth);
}

// Politica conflitti: modifica su un solo lato viene applicata; modifiche
// concorrenti differenti richiedono risoluzione esplicita. Mai last-write-wins.
const syncStores=['piano','impostazioni','inventario','spesa','consumoGiorno','prodotti','diagnosticaCopertura'];
const syncSetting=key=>!/^catalogoSorgente:|^sync:/.test(key);
const stable=value=>JSON.stringify(value,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))):v);
async function sync(adapter){
  const user=currentUser;
  if(!user||!currentAccess.allowed)throw new Error('Account non autorizzato alla sincronizzazione');
  const snapshot={};for(const store of syncStores)snapshot[store]=await adapter.all(store);
  await adapter.put('impostazioni',{chiave:'sync:backup:'+Date.now(),valore:snapshot});
  let completed=0;
  for(const store of syncStores){
    const local=new Map(snapshot[store].filter(v=>store!=='impostazioni'||syncSetting(v.chiave)).map(v=>[String(v.id??v.chiave),v]));
    const remote=await getDocs(collection(firestore,'users',user.uid,'stores',store,'records'));
    const remoteMap=new Map(remote.docs.map(d=>[d.data().key,d.data().value]));
    const journalKey='sync:journal:'+store,journal=(await adapter.read('impostazioni',journalKey))?.valore||{};
    const keys=new Set([...local.keys(),...remoteMap.keys(),...Object.keys(journal)]);
    for(const key of keys){
      if(currentUser?.uid!==user.uid)throw new Error('Account cambiato durante la sincronizzazione');
      const l=local.get(key),r=remoteMap.get(key),lf=stable(l??null),rf=stable(r??null),base=journal[key]??'null';
      if(lf!==rf){
        if(lf!==base&&rf!==base)throw new Error('Conflitto da risolvere: '+store+'/'+key);
        if(lf===base&&(l?.consumato||store==='consumoGiorno'&&l))throw new Error('Storico locale protetto: '+key);
        if(stable((await adapter.read(store,key))??null)!==lf)throw new Error('Dato locale cambiato: '+key);
        if(lf!==base){
          if(r?.consumato||store==='consumoGiorno'&&r)throw new Error('Storico remoto protetto: '+key);
          const ref=doc(firestore,'users',user.uid,'stores',store,'records',encodeURIComponent(key));
          await runTransaction(firestore,async transaction=>{
            const latest=await transaction.get(ref);
            if(stable(latest.exists()?latest.data().value:null)!==rf)throw new Error('Dato remoto cambiato: '+key);
            if(l)transaction.set(ref,{schema:1,key,value:l});else transaction.delete(ref);
          });
          journal[key]=lf;
        }else{
          if(r)await adapter.put(store,r);else await adapter.del(store,key);
          journal[key]=rf;
        }
      }else journal[key]=lf;
      await adapter.put('impostazioni',{chiave:journalKey,valore:journal});completed++;
    }
  }
  return {completed};
}

window.DietaPlannerCloud = {
  ready,
  login,
  logout,
  sync,
  getAccess:()=>({...currentAccess}),
  getUser:()=>publicUser(currentUser),
  getFirestore:()=>firestore
};

setPersistence(auth,browserLocalPersistence)
  .catch(err=>console.warn('[auth persistence]',err));

onAuthStateChanged(auth,async user=>{
  currentUser=user;
  currentAccess={role:user?'limited':'local',allowed:false};
  // Il database locale deve aprirsi anche senza risposta di Firestore.
  // I permessi cloud restano negati finché la whitelist non è verificata.
  localStorage.setItem('dietaplanner:lastLocalOwner',user?.uid||'');
  emitAuth();
  readyResolve(publicUser(user));
  if(user){
    try{
      const access=await getDoc(doc(firestore,'access',user.uid));
      if(currentUser?.uid!==user.uid)return;
      const role=access.exists()?access.data().role:'limited';
      currentAccess={role:['admin','user','limited','blocked'].includes(role)?role:'limited',allowed:['admin','user'].includes(role)};
    }catch(err){console.warn('[autorizzazioni]',err);}
    if(currentUser?.uid!==user.uid)return;
    try{ await ensureProfile(user); }
    catch(err){ console.warn('[profilo cloud]',err); }
  }
  if(currentUser?.uid!==user?.uid)return;
  emitAuth();
});
