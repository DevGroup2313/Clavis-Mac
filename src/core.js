/* CLAVIS · CORE. The parts every room leans on: words in English and French, the settings and how they dress the page,
   the keep on this device (IndexedDB, with a memory keep when the browser refuses one), fetching with a time limit, the
   result cache that lets a search come back with no connection, small helpers for safe text, and the router, so the
   browser's own Back key always goes back one step. Nothing here sends anything anywhere by itself. */
(function(){
"use strict";
var LV=window.LV={NAME:"Clavis",VERSION:"1.0",BUILD:"100",AUTHOR:"Yannie D. Forest",YEAR:"2026"};
LV.SEAL_DAY=(window.LV_SEALS||{}).day||"";LV.SEAL_NIGHT=(window.LV_SEALS||{}).night||"";

/* ---------- words ---------- */
LV.lang=function(){return LV.S&&LV.S.lang==="fr"?"fr":"en";};
var T=LV.T=function(en,fr){return LV.lang()==="fr"&&fr!=null?fr:en;};
LV.loc=function(){return LV.lang()==="fr"?"fr-FR":"en-GB";};
LV.num=function(n){try{return Number(n).toLocaleString(LV.loc());}catch(e){return String(n);}};
LV.plural=function(n,en1,enN,fr1,frN){return LV.num(n)+" "+(LV.lang()==="fr"?(n<2?fr1:frN):(n===1?en1:enN));};

/* ---------- small helpers ---------- */
var $=LV.$=function(id){return document.getElementById(id);};
LV.qs=function(sel,root){return (root||document).querySelector(sel);};
LV.qsa=function(sel,root){return [].slice.call((root||document).querySelectorAll(sel));};
/* h("div.card#id",{attrs},[children]): text is always text; html only where asked for with {html:...} after sanitising */
LV.h=function(tag,attrs,kids){var m=/^([a-z0-9]+)((?:[.#][\w-]+)*)$/i.exec(tag)||[0,tag,""],n=document.createElement(m[1]);
  (m[2].match(/[.#][\w-]+/g)||[]).forEach(function(p){if(p[0]===".")n.classList.add(p.slice(1));else n.id=p.slice(1);});
  if(attrs)for(var k in attrs){var v=attrs[k];if(v==null||v===false)continue;
    if(k==="text")n.textContent=v;else if(k==="html")n.innerHTML=v;
    else if(k==="on"){for(var e in v)n.addEventListener(e,v[e]);}
    else if(k==="style"&&typeof v==="object"){for(var s in v)n.style.setProperty(s,v[s]);}
    else if(k==="data"){for(var d in v)n.setAttribute("data-"+d,v[d]);}
    else n.setAttribute(k,v===true?"":v);}
  (Array.isArray(kids)?kids:kids==null?[]:[kids]).forEach(function(c){if(c==null||c===false)return;n.appendChild(typeof c==="string"||typeof c==="number"?document.createTextNode(String(c)):c);});
  return n;};
LV.clear=function(n){while(n&&n.firstChild)n.removeChild(n.firstChild);return n;};
LV.uid=function(p){return (p||"x")+Date.now().toString(36)+Math.random().toString(36).slice(2,7);};
LV.clamp=function(v,a,b){return Math.max(a,Math.min(b,v));};
LV.esc=function(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});};
/* plain text from a bit of HTML a source sent (its tags are dropped, its entities read) */
var _tx=null;LV.text=function(html){if(html==null)return "";var s=String(html);if(s.indexOf("<")<0&&s.indexOf("&")<0)return s.replace(/\s+/g," ").trim();
  try{if(!_tx)_tx=new DOMParser();var d=_tx.parseFromString("<body>"+s.replace(/<(br|\/p|\/div|\/li)\b[^>]*>/gi," $&")+"</body>","text/html");return (d.body.textContent||"").replace(/\s+/g," ").trim();}
  catch(e){return s.replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim();}};
LV.trunc=function(s,n){s=String(s||"").replace(/\s+/g," ").trim();return s.length>n?s.slice(0,n-1).replace(/\s+\S*$/,"")+"…":s;};
LV.host=function(u){try{return new URL(u).hostname.replace(/^www\./,"");}catch(e){return "";}};
/* the tracking bits some links carry are taken off before a link is shown or kept */
LV.cleanUrl=function(u){try{var x=new URL(u);if(!/^https?:$/.test(x.protocol))return "";
  ["utm_source","utm_medium","utm_campaign","utm_term","utm_content","utm_id","fbclid","gclid","dclid","msclkid","mc_cid","mc_eid","igshid","ref_src","_hsenc","_hsmi","yclid","spm"].forEach(function(k){x.searchParams.delete(k);});
  return x.toString();}catch(e){return "";}};
LV.safeUrl=function(u){u=String(u||"").trim();if(/^\/\//.test(u))u="https:"+u;return /^https?:\/\//i.test(u)?LV.cleanUrl(u):"";};
LV.debounce=function(f,ms){var t=0;return function(){var a=arguments,s=this;clearTimeout(t);t=setTimeout(function(){f.apply(s,a);},ms);};};
LV.copy=function(text){var done=function(){LV.toast(T("Copied.","Copié."));};
  try{if(navigator.clipboard&&window.isSecureContext)return navigator.clipboard.writeText(text).then(done,fallback);}catch(e){}fallback();
  function fallback(){var t=LV.h("textarea",{style:{position:"fixed",opacity:"0"}});t.value=text;document.body.appendChild(t);t.select();try{document.execCommand("copy");done();}catch(e){}t.remove();}};
/* inside the family's app shells a file is saved through the app: the Mac and Windows apps' Save dialog
   (window.pywebview.api.save_file), the iPhone's and iPad's share sheet and the tablet's Save as (window.CarpeNative,
   the family's bridge name); in a browser, by a download */
LV.shell=function(){try{if(window.pywebview&&window.pywebview.api&&window.pywebview.api.save_file)return "desktop";if(window.CarpeNative&&window.CarpeNative.saveFile)return "mobile";}catch(e){}return "";};
function b64utf8(text){var bytes=new TextEncoder().encode(String(text)),bin="";for(var i=0;i<bytes.length;i+=32768)bin+=String.fromCharCode.apply(null,bytes.subarray(i,i+32768));return btoa(bin);}
LV.openUrl=function(u){u=LV.safeUrl(u);if(!u)return;try{if(window.pywebview&&window.pywebview.api&&window.pywebview.api.open_url){window.pywebview.api.open_url(u);return;}
  if(window.CarpeNative&&window.CarpeNative.openUrl){window.CarpeNative.openUrl(u);return;}}catch(e){}window.open(u,"_blank","noopener");};
LV.download=function(name,text,type){var sh=LV.shell();
  if(sh){try{var b64=b64utf8(text),mime=type||"text/plain";if(sh==="desktop"){Promise.resolve(window.pywebview.api.save_file(name,mime,b64)).then(function(r){if(r&&r!=="cancelled"&&typeof r==="string")LV.toast(LV.T("Saved: ")+r);});}
    else window.CarpeNative.saveFile(name,mime,b64);return;}catch(e){}}
  try{var b=new Blob([text],{type:type||"text/plain;charset=utf-8"}),a=LV.h("a",{href:URL.createObjectURL(b),download:name});
  document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove();},1500);}catch(e){LV.toast(T("The file could not be made.","Le fichier n’a pas pu être créé."));}};

/* ---------- words of a query ---------- */
var STOP={};("a an the and or of to in on at by for with from as is are was were be been it its this that these those what which who whom how why when where "+
  "do does did i you he she we they my your our their me him her us them not no but if then than so such can could would should will shall may might "+
  "le la les un une des du de et ou en au aux sur par pour avec dans est sont qui que quoi dont où ce cet cette ces il elle ils elles nous vous je tu ne pas plus").split(" ").forEach(function(w){STOP[w]=1;});
LV.STOP=STOP;
LV.fold=function(s){return String(s||"").toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g,"");};
LV.words=function(q){return LV.fold(q).replace(/"[^"]*"/g,function(m){return m.replace(/[^\p{L}\p{N}]+/gu," ");}).split(/[^\p{L}\p{N}]+/u).filter(function(w){return w&&w.length>1&&!STOP[w];});};
/* a query, read the way the search box reads it: "a phrase", -left out, site:a.host */
LV.parseQuery=function(q){var o={raw:String(q||"").trim(),phrases:[],not:[],site:"",words:[],plain:""};var s=o.raw;
  s=s.replace(/(^|\s)site:(\S+)/i,function(m,a,h){o.site=h.replace(/^https?:\/\//,"").replace(/\/.*$/,"").toLowerCase();return " ";});
  s=s.replace(/"([^"]+)"/g,function(m,p){o.phrases.push(p.trim());return " "+p+" ";});
  s=s.replace(/(^|\s)-(\S+)/g,function(m,a,w){o.not.push(LV.fold(w));return " ";});
  o.plain=s.replace(/\s+/g," ").trim();o.words=LV.words(o.plain);return o;};
/* marks the query's words inside a text, as DOM, never as HTML */
LV.hl=function(text,words,max){text=String(text||"");if(max)text=LV.trunc(text,max);var frag=document.createDocumentFragment();
  if(!words||!words.length){frag.appendChild(document.createTextNode(text));return frag;}
  var folded=LV.fold(text),marks=[];words.forEach(function(w){if(!w||w.length<2)return;var i=0;while((i=folded.indexOf(w,i))>=0){
    var before=i===0||/[^\p{L}\p{N}]/u.test(folded[i-1]);if(before)marks.push([i,i+w.length]);i+=w.length;}});
  marks.sort(function(a,b){return a[0]-b[0];});var at=0;marks.forEach(function(m){if(m[0]<at)return;
    if(m[0]>at)frag.appendChild(document.createTextNode(text.slice(at,m[0])));
    frag.appendChild(LV.h("mark",{text:text.slice(m[0],m[1])}));at=m[1];});
  if(at<text.length)frag.appendChild(document.createTextNode(text.slice(at)));return frag;};

/* ---------- the settings ---------- */
var SKEY="clavis_settings";
LV.DEFAULTS={lang:(navigator.language||"en").slice(0,2)==="fr"?"fr":"en",dress:"auto",depth:"raised",text:"m",gap:"normal",font:"family",motion:"full",
  links:"plain",snippets:"full",thumbs:true,calmResults:false,perPage:10,ruler:false,
  pinQuestion:true,timeCheck:25,history:true,door:true,mode:"everyday",
  wikiLang:"auto",safe:true,seSite:"stackoverflow",marginaliaKey:"",openalexKey:"",mailto:"",
  tabs:["all","web","images","books","places"],
  src:{marginalia:true,wikipedia:true,ddg:true,wikidata:true,openlibrary:true,archive:true,stackexchange:true,hn:true,github:true,commons:true,openverse:true,osm:true,gdelt:true,wiktionary:true,
    openalex:true,crossref:true,europepmc:true,pubmed:true,doaj:true,s2:true}};
LV.S=(function(){var s={};try{s=JSON.parse(localStorage.getItem(SKEY)||"{}")||{};}catch(e){}
  var o=JSON.parse(JSON.stringify(LV.DEFAULTS));for(var k in s)if(k in o){if(k==="src"&&s.src&&typeof s.src==="object"){for(var j in s.src)if(j in o.src)o.src[j]=!!s.src[j];}else o[k]=s[k];}
  return o;})();
LV.save=function(){try{localStorage.setItem(SKEY,JSON.stringify(LV.S));}catch(e){}};
LV.set=function(k,v){LV.S[k]=v;LV.save();LV.dress();LV.emit("settings",k);};
LV.wikiLang=function(){var w=LV.S.wikiLang;return w&&w!=="auto"?w:LV.lang();};

/* events, kept small */
var subs={};LV.on=function(ev,f){(subs[ev]=subs[ev]||[]).push(f);};
LV.emit=function(ev,a){(subs[ev]||[]).forEach(function(f){try{f(a);}catch(e){console.error(e);}});};

/* ---------- the dress: day, dusk or night, and the rest of Display ---------- */
var mqDark=window.matchMedia?window.matchMedia("(prefers-color-scheme: dark)"):null;
var mqStill=window.matchMedia?window.matchMedia("(prefers-reduced-motion: reduce)"):null;
LV.night=function(){return document.documentElement.getAttribute("data-dress")==="night";};
LV.still=function(){var m=LV.S.motion;return m==="still"||(m!=="full"&&!!(mqStill&&mqStill.matches))||document.documentElement.hasAttribute("data-sc-calm");};
LV.dress=function(){var r=document.documentElement,S=LV.S,d=S.dress==="auto"?(mqDark&&mqDark.matches?"night":"day"):S.dress;
  r.setAttribute("data-dress",d);r.setAttribute("data-depth",S.depth);r.setAttribute("data-text",S.text);r.setAttribute("data-gap",S.gap);
  r.setAttribute("data-font",S.font);r.setAttribute("data-motion",S.motion);r.setAttribute("data-links",S.links);r.setAttribute("data-snippets",S.calmResults?"short":S.snippets);
  r.setAttribute("data-thumbs",S.thumbs&&!S.calmResults?"1":"0");r.setAttribute("data-calm-results",S.calmResults?"1":"0");r.setAttribute("data-ruler",S.ruler?"1":"0");
  r.lang=LV.lang();
  var mc=document.querySelector('meta[name="theme-color"]');if(mc)mc.setAttribute("content",d==="night"?"#0e0e11":d==="dusk"?"#e4dfd3":"#f5f2ea");
  /* the tab's icon follows the dress, as the family's do */
  var ic=document.getElementById("lv-icon"),SL=window.LV_SEALS||{};if(ic){var want=d==="night"?SL.iconNight:SL.iconDay;if(want&&ic.getAttribute("href")!==want)ic.setAttribute("href",want);}
  LV.emit("dress",d);};
if(mqDark){var md=function(){if(LV.S.dress==="auto")LV.dress();};if(mqDark.addEventListener)mqDark.addEventListener("change",md);else if(mqDark.addListener)mqDark.addListener(md);}
LV.perPage=function(){return LV.S.calmResults?Math.min(5,LV.S.perPage):LV.S.perPage;};

/* ---------- the toast: one short line, then gone ---------- */
var toastT=0;LV.toast=function(msg,ms){var t=$("lv-toast");if(!t)return;t.textContent=msg;t.classList.add("show");clearTimeout(toastT);
  toastT=setTimeout(function(){t.classList.remove("show");},ms||(2600+Math.min(3000,msg.length*30)));};

/* ---------- the keep on this device ---------- */
var DBN="clavis",DBV=1,STORES=["items","cache","history","later","meta"],dbp=null,mem={};
STORES.forEach(function(s){mem[s]=new Map();});
function openDB(){if(dbp)return dbp;dbp=new Promise(function(res){if(!window.indexedDB){res(null);return;}
  try{var rq=indexedDB.open(DBN,DBV);
    rq.onupgradeneeded=function(){var db=rq.result;STORES.forEach(function(s){if(!db.objectStoreNames.contains(s))db.createObjectStore(s,{keyPath:"id"});});};
    rq.onsuccess=function(){res(rq.result);};rq.onerror=function(){res(null);};rq.onblocked=function(){res(null);};}catch(e){res(null);}});return dbp;}
function tx(store,mode,fn){return openDB().then(function(db){if(!db)return fn(null);return new Promise(function(res,rej){
  try{var t=db.transaction(store,mode),st=t.objectStore(store),out=fn(st);t.oncomplete=function(){res(out&&out.__r!==undefined?out.__r:out);};t.onerror=function(){rej(t.error);};t.onabort=function(){rej(t.error);};}
  catch(e){rej(e);}});});}
function req(r,box){r.onsuccess=function(){box.__r=r.result;};return box;}
LV.db={
  get:function(s,id){return tx(s,"readonly",function(st){if(!st)return {__r:mem[s].get(id)};return req(st.get(id),{});});},
  put:function(s,v){return tx(s,"readwrite",function(st){if(!st){mem[s].set(v.id,v);return {__r:v};}st.put(v);return {__r:v};});},
  del:function(s,id){return tx(s,"readwrite",function(st){if(!st){mem[s].delete(id);return {__r:true};}st.delete(id);return {__r:true};});},
  all:function(s){return tx(s,"readonly",function(st){if(!st)return {__r:Array.from(mem[s].values())};return req(st.getAll(),{});});},
  clear:function(s){return tx(s,"readwrite",function(st){if(!st){mem[s].clear();return {__r:true};}st.clear();return {__r:true};});},
  count:function(s){return tx(s,"readonly",function(st){if(!st)return {__r:mem[s].size};return req(st.count(),{});});}};
LV.db.ready=function(){return openDB().then(function(db){LV.memOnly=!db;return !!db;});};
/* ask the browser to keep this app's keep even when space runs low (the owner asked for the apps' storage to be expanded) */
LV.persist=function(){try{if(navigator.storage&&navigator.storage.persist)return navigator.storage.persisted().then(function(p){return p||navigator.storage.persist();});}catch(e){}return Promise.resolve(false);};
LV.usage=function(){try{if(navigator.storage&&navigator.storage.estimate)return navigator.storage.estimate();}catch(e){}return Promise.resolve(null);};
LV.bytes=function(n){if(n==null)return "–";var u=["B","KB","MB","GB"],i=0;while(n>=1024&&i<u.length-1){n/=1024;i++;}return (i?n.toFixed(n<10?1:0):n)+" "+u[i];};

/* ---------- what the page carries inside it ----------
   The dictionary, the word list, the citation engine and its styles, and the PDF reader travel inside the page itself,
   compressed (as Ingenium carries its parts), so the page works by double-click with no server and no connection. Each is
   read only the first time it is needed. A browser too old to unpack them reads them from the vendor folder instead. */
var RES={};
function unpack(b64){var bin=atob(b64),u=new Uint8Array(bin.length);for(var i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);
  var ds=new DecompressionStream("gzip"),out=new Blob([u]).stream().pipeThrough(ds);return new Response(out).text();}
LV.res=function(name){if(RES[name])return RES[name];
  var csl=/^csl\//.test(name),key=csl?"csl.json":name,node=document.getElementById("lvres-"+key.replace(/[^a-z0-9]/gi,"-"));
  var p;if(node&&window.DecompressionStream){p=(RES["@"+key]||(RES["@"+key]=unpack(node.textContent.replace(/\s+/g,""))));if(csl)p=p.then(function(t){var j=JSON.parse(t),v=j[name.slice(4)];if(v==null)throw new Error(name);return v;});}
  else p=fetch("vendor/"+name).then(function(r){if(!r.ok)throw new Error(name+" "+r.status);return r.text();});
  RES[name]=p.catch(function(e){delete RES[name];throw e;});return RES[name];};
/* a script the page carries, run once */
LV.script=function(name,test){if(test())return Promise.resolve();return LV.res(name).then(function(code){var s=document.createElement("script");s.textContent=code+"\n//# sourceURL=clavis-"+name;document.head.appendChild(s);if(!test())throw new Error(name);});};

/* ---------- the connection ---------- */
LV.online=function(){return navigator.onLine!==false&&!LV.S.offlineOnly;};
/* one fetch with a time limit; the answer as JSON (or text), or a plain error that names the source */
LV.fetch=function(url,o){o=o||{};var ctl=window.AbortController?new AbortController():null,ms=o.timeout||12000,timer=0;
  if(!LV.online())return Promise.reject(new Error("offline"));
  var p=fetch(url,{headers:o.headers||{},signal:ctl?ctl.signal:undefined,credentials:"omit",referrerPolicy:"strict-origin-when-cross-origin",cache:o.cache||"default"}).then(function(r){
    clearTimeout(timer);if(!r.ok){var e=new Error((o.name||LV.host(url))+" answered "+r.status);e.status=r.status;throw e;}
    return o.as==="text"?r.text():o.as==="blob"?r.blob():o.as==="buf"?r.arrayBuffer():r.json();});
  timer=setTimeout(function(){try{ctl&&ctl.abort();}catch(e){}},ms);
  return p.catch(function(e){clearTimeout(timer);if(e&&e.name==="AbortError")e=new Error((o.name||LV.host(url))+" took too long");throw e;});};

/* the result cache: each answer a source gave is kept a while, so the same search comes back with no connection */
LV.cache={
  key:function(parts){return parts.map(function(p){return typeof p==="object"?JSON.stringify(p):String(p==null?"":p);}).join("|");},
  get:function(k,maxAge){return LV.db.get("cache",k).then(function(v){if(!v)return null;if(maxAge&&Date.now()-v.at>maxAge)return null;return v;}).catch(function(){return null;});},
  put:function(k,data,extra){var v={id:k,at:Date.now(),data:data};if(extra)for(var x in extra)v[x]=extra[x];return LV.db.put("cache",v).catch(function(){});},
  prune:function(){return LV.db.all("cache").then(function(all){var old=Date.now()-1000*60*60*24*45,list=all.sort(function(a,b){return b.at-a.at;});
    return Promise.all(list.filter(function(v,i){return v.at<old||i>1500;}).map(function(v){return LV.db.del("cache",v.id);}));}).catch(function(){});}};

/* ---------- the router: #/search?q=…  The browser's Back key always goes back one step. ---------- */
LV.route=function(){var h=location.hash.replace(/^#\/?/,""),i=h.indexOf("?"),path=(i<0?h:h.slice(0,i))||"home",p={};
  new URLSearchParams(i<0?"":h.slice(i+1)).forEach(function(v,k){p[k]=v;});return {path:path,p:p};};
LV.go=function(path,p,replace){var qs=new URLSearchParams();if(p)for(var k in p)if(p[k]!=null&&p[k]!==""&&p[k]!==false)qs.set(k,p[k]);
  var h="#/"+path+(qs.toString()?"?"+qs.toString():"");if(location.hash===h){LV.emit("route");return;}
  if(replace)history.replaceState(null,"",h);else history.pushState(null,"",h);LV.emit("route");};
window.addEventListener("popstate",function(){LV.emit("route");});
window.addEventListener("hashchange",function(){LV.emit("route");});
})();
