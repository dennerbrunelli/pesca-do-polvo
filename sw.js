/* Pesca do Polvo: funciona sem internet.
   O jogo tenta sempre a versão nova pela rede, mas só guarda resposta boa.
   Sem sinal, ou se o site estiver fora do ar, abre a cópia guardada no celular. */
const CACHE='pesca-do-polvo-2026.10.23-1';
const ARQUIVOS=['./','index.html','manifest.webmanifest','icon-192.png','icon-512.png','icon-maskable-512.png','apple-touch-icon.png','favicon.png','placar-config.js'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ARQUIVOS)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
const guardada=r=>caches.match(r,{ignoreSearch:true}).then(m=>m||(r.mode==='navigate'?caches.match('index.html').then(i=>i||caches.match('./')):undefined));
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;
  if(/versao\.txt/.test(r.url)){e.respondWith(fetch(r).catch(()=>new Response('',{status:503})));return}
  const url=new URL(r.url);
  if(url.origin===location.origin){
    e.respondWith(fetch(r).then(res=>{
      if(res.ok){const cp=res.clone();caches.open(CACHE).then(c=>c.put(r,cp));return res}
      // site fora do ar ou arquivo sumiu (404/500): usa a cópia boa que está no celular
      return guardada(r).then(m=>m||res);
    }).catch(()=>guardada(r).then(m=>m||new Response('Sem sinal',{status:503}))));
  }else if(/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)){
    e.respondWith(caches.match(r).then(m=>m||fetch(r).then(res=>{if(res.ok||res.type==='opaque'){const cp=res.clone();caches.open(CACHE).then(c=>c.put(r,cp))}return res})));
  }
});
