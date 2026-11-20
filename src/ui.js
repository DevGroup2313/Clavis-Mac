/* CLAVIS · THE ROOMS, PART ONE: the bar, the door, the home page and the results. One thing at a time: ten results to a
   page with numbered pages (never an endless scroll), every result labelled with its source and what kind of source it
   is, a line showing which sources answered, and the search you came for kept in view. */
(function(){
"use strict";
var LV=window.LV,T=LV.T,h=LV.h,$=LV.$,UI=LV.ui={gen:0,papers:new Map()};

/* the seal: src/seal3d.js (UI.seal), a picture in the bar and a stage of layers in depth everywhere else */

/* ---------- keys and small parts ---------- */
UI.key=function(label,on,cls,attrs){var a=Object.assign({type:"button",on:on?{click:on}:null},attrs||{});return h("button.key"+(cls?"."+cls.split(" ").join("."):""),a,label);};
UI.link=function(label,url,cls){return h("a.key"+(cls?"."+cls.split(" ").join("."):""),{href:url,target:"_blank",rel:"noopener noreferrer"},label);};
UI.badge=function(trust,label){return h("span.badge."+(trust||"plain"),{title:label},[h("span.dot",{"aria-hidden":"true"}),label]);};
UI.seg=function(opts,val,on,label){var g=h("div.seg",{role:"group","aria-label":label||""});opts.forEach(function(o){
  g.appendChild(UI.key(o[1],function(){on(o[0]);LV.qsa(".key",g).forEach(function(k){k.setAttribute("aria-pressed",k.dataset.v===String(o[0])?"true":"false");});},"small",{"aria-pressed":String(val)===String(o[0])?"true":"false","data-v":String(o[0])}));});return g;};
UI.when=function(t){if(!t)return "";var d=new Date(t);if(isNaN(d))return "";var days=(Date.now()-d)/864e5;
  if(days<1&&days>=0)return d.toLocaleTimeString(LV.loc(),{hour:"numeric",minute:"2-digit"});
  return d.toLocaleDateString(LV.loc(),{day:"numeric",month:"short",year:days>300?"numeric":undefined});};
UI.ago=function(t){var m=Math.round((Date.now()-t)/6e4);if(m<1)return T("just now","à l’instant");if(m<60)return T(m+" min ago","il y a "+m+" min");var hh=Math.round(m/60);
  if(hh<24)return T(LV.plural(hh,"hour","hours","heure","heures")+" ago","il y a "+LV.plural(hh,"heure","heures","heure","heures"));return UI.when(t);};

/* ---------- sheets: one at a time, Esc to close, focus kept inside and given back after ---------- */
var openSheet=null;
UI.sheet=function(o){if(openSheet)openSheet.close(true,true);var from=document.activeElement,veil=h("div.veil",{on:{click:function(){close();}}});
  var head=h("div.sh",null,[h("h2",{id:"sheet-title",text:o.title}),UI.key("×",function(){close();},"ghost icon",{"aria-label":T("Close","Fermer")})]);
  var body=h("div.sb",null,o.body),sh=h("section.sheet"+(o.center?".center":""),{role:"dialog","aria-modal":"true","aria-labelledby":"sheet-title"},[head,body,o.foot?h("div.sf",null,o.foot):null]);
  document.body.appendChild(veil);document.body.appendChild(sh);
  function keys(e){if(e.key!=="Tab")return;var f=LV.qsa('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])',sh).filter(function(n){return n.offsetParent!==null&&!n.disabled;});
    if(!f.length)return;var i=f.indexOf(document.activeElement);if(e.shiftKey&&i<=0){e.preventDefault();f[f.length-1].focus();}else if(!e.shiftKey&&i===f.length-1){e.preventDefault();f[0].focus();}}
  sh.addEventListener("keydown",keys);
  function esc(e){if(e.key==="Escape"&&openSheet===api&&!e.defaultPrevented){e.preventDefault();close();}}document.addEventListener("keydown",esc);
  function close(silent,nav){if(!sh.parentNode)return;document.removeEventListener("keydown",esc);sh.remove();veil.remove();openSheet=null;if(o.onClose&&!nav)o.onClose();if(!silent&&from&&from.focus)try{from.focus({preventScroll:true});}catch(e){}}
  var api={el:sh,body:body,close:close};openSheet=api;setTimeout(function(){var f=sh.querySelector(o.focus||"input,select,.sb button,.sb a");(f||head.querySelector("button")).focus({preventScroll:true});},30);return api;};
UI.closeSheet=function(nav){if(openSheet)openSheet.close(!!nav,!!nav);};

/* ---------- the bar ---------- */
UI.bar=function(){var b=$("bar");LV.clear(b);var mode=LV.S.mode;
  var brand=h("a.brand",{href:"#/home","aria-label":T("Clavis, home","Clavis, accueil")},[UI.seal("seal-mini"),h("span",null,[h("b",{text:"Clavis"}),h("small",{text:"v"+LV.VERSION})])]);
  var seg=h("div.seg.mode",{role:"group","aria-label":T("Kind of search","Type de recherche")});
  [["everyday",T("Everyday","Au quotidien")],["scholarly",T("Scholarly","Savant")]].forEach(function(m){seg.appendChild(UI.key(m[1],function(){UI.setMode(m[0]);},"small",{"aria-pressed":mode===m[0]?"true":"false",id:"mode-"+m[0]}));});
  var net=h("span.net",{id:"net","data-on":LV.online()?"1":"0",role:"status",title:T("Whether this device has a connection","Si cet appareil est connecté")},h("span",{text:LV.online()?T("Online","En ligne"):T("Offline","Hors ligne")}));
  var pills=h("div.pills",null,[net,
    UI.key(T("⌂ Library","⌂ Bibliothèque"),function(){LV.go("library");},"small wide",{id:"bar-library"}),
    UI.key(T("History","Historique"),function(){LV.go("history");},"small wide",{id:"bar-history"}),
    UI.key(T("Display","Affichage"),function(){UI.settings();},"small wide",{id:"bar-display"}),
    UI.key(T("Guide","Guide"),function(){LV.tour&&LV.tour.start();},"small wide",{id:"bar-guide"}),
    UI.key(T("About","À propos"),function(){UI.about();},"small wide",{id:"bar-about"}),
    UI.key(LV.lang()==="fr"?"🇬🇧":"🇫🇷",function(){LV.set("lang",LV.lang()==="fr"?"en":"fr");UI.bar();UI.render();},"small icon wide",{"aria-label":LV.lang()==="fr"?"English":"Français",title:LV.lang()==="fr"?"English":"Français",id:"bar-lang"}),
    UI.key("☰ "+T("Menu","Menu"),function(){UI.menu();},"small menu-key",{id:"bar-menu"})]);
  b.appendChild(brand);b.appendChild(seg);b.appendChild(h("div.spacer"));b.appendChild(pills);};
UI.menu=function(){var go=function(f){return function(){UI.closeSheet();f();};};
  var list=h("div.list",null,[[T("⌂ Your library","⌂ Votre bibliothèque"),go(function(){LV.go("library");})],[T("🕘 History","🕘 Historique"),go(function(){LV.go("history");})],
    [T("🎛 Display and settings","🎛 Affichage et réglages"),go(function(){UI.settings();})],[T("🧭 Guided tour","🧭 Visite guidée"),go(function(){LV.tour&&LV.tour.start();})],
    [T("ℹ About Clavis","ℹ À propos de Clavis"),go(function(){UI.about();})],[LV.lang()==="fr"?"🇬🇧 English":"🇫🇷 Français",go(function(){LV.set("lang",LV.lang()==="fr"?"en":"fr");UI.bar();UI.render();})]]
    .map(function(r){return UI.key(r[0],r[1],"",{style:{"justify-content":"flex-start",width:"100%"}});}));
  UI.sheet({title:T("Menu","Menu"),body:list});};
UI.setMode=function(m){LV.set("mode",m);LV.qsa(".mode .key").forEach(function(k){k.setAttribute("aria-pressed",k.id==="mode-"+m?"true":"false");});
  var r=LV.route();if(r.path==="search"&&r.p.q)LV.go("search",{q:r.p.q,m:m,t:Q().TABS[m][0].id});else LV.go("home");};
UI.net=function(){var n=$("net");if(!n)return;var on=LV.online();n.setAttribute("data-on",on?"1":"0");n.firstChild.textContent=on?T("Online","En ligne"):T("Offline","Hors ligne");};
function Q(){return LV.search;}

/* ---------- the search box ---------- */
UI.form=function(q,o){o=o||{};var mode=LV.S.mode;
  var input=h("input",{type:"search",name:"q",id:o.id||"q",value:q||"",autocomplete:"off",spellcheck:"true",enterkeyhint:"search","aria-label":T("Search","Rechercher"),
    placeholder:mode==="scholarly"?T("Search articles, books and authors…","Cherchez des articles, des livres, des auteurs…"):T("Search the web, or what you keep…","Cherchez sur le web, ou dans ce que vous gardez…")});
  var clearK=h("button.clear",{type:"button","aria-label":T("Clear","Effacer"),hidden:!q,on:{click:function(){input.value="";clearK.hidden=true;input.focus();}}},"×");
  var glass=h("span.glass",{"aria-hidden":"true",html:'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/></svg>'});
  var go=h("button.key.primary",{type:"submit"},T("Search","Chercher"));
  var box=h("div.qbox",null,[glass,input,clearK,go]),sug=h("ul.suggest",{role:"listbox",id:"sug",hidden:true});
  var f=h("form.qform",{role:"search",on:{submit:function(e){e.preventDefault();sug.hidden=true;UI.submit(input.value,o.tab);}}},[box,sug]);
  input.setAttribute("aria-controls","sug");input.setAttribute("aria-autocomplete","list");
  /* suggestions come only from what is already on this device: your earlier searches and your library's titles */
  var pick=-1,opts=[];
  input.addEventListener("input",LV.debounce(function(){clearK.hidden=!input.value;var v=LV.fold(input.value.trim());if(v.length<2){sug.hidden=true;return;}
    LV.hist.all().then(function(hs){var seen={},out=[];hs.forEach(function(e){if(e.kind==="q"&&e.q&&LV.fold(e.q).indexOf(v)===0&&!seen[e.q]&&out.length<5){seen[e.q]=1;out.push({t:e.q,k:T("searched before","déjà cherché")});}});
      LV.lib.items.forEach(function(it){if(out.length<8&&it.title&&LV.fold(it.title).indexOf(v)>=0&&!seen[it.title]){seen[it.title]=1;out.push({t:it.title,k:T("in your library","dans votre bibliothèque")});}});
      opts=out;pick=-1;LV.clear(sug);if(!out.length||document.activeElement!==input){sug.hidden=true;return;}
      out.forEach(function(s,i){sug.appendChild(h("li",{role:"option",id:"sug-"+i,"aria-selected":"false",on:{mousedown:function(e){e.preventDefault();input.value=s.t;sug.hidden=true;UI.submit(s.t,o.tab);}}},[s.t,h("small",{text:s.k})]));});
      sug.hidden=false;});},120));
  input.addEventListener("keydown",function(e){if(sug.hidden)return;var lis=LV.qsa("li",sug);
    if(e.key==="ArrowDown"||e.key==="ArrowUp"){e.preventDefault();pick=(pick+(e.key==="ArrowDown"?1:-1)+lis.length+1)%(lis.length+1)-0;if(pick===lis.length)pick=-1;
      lis.forEach(function(l,i){l.setAttribute("aria-selected",i===pick?"true":"false");});input.setAttribute("aria-activedescendant",pick>=0?"sug-"+pick:"");if(pick>=0)input.value=opts[pick].t;}
    else if(e.key==="Escape"){sug.hidden=true;}});
  input.addEventListener("blur",function(){setTimeout(function(){sug.hidden=true;},150);});
  return f;};
UI.submit=function(q,tab){q=String(q||"").trim();if(!q)return;var mode=LV.S.mode,r=LV.route();
  var t=tab||(r.path==="search"&&r.p.m===mode&&r.p.t?r.p.t:null);if(t==="library"&&!tab)t=null;
  var p={q:q,m:mode,t:t||Q().TABS[mode][0].id,p:1};if(mode==="scholarly"&&r.path==="search")["from","to","sort","oa","peer","type"].forEach(function(k){if(r.p[k])p[k]=r.p[k];});
  if(LV.support)LV.support.searched(q,mode);LV.hist.add({kind:"q",q:q,mode:mode,tab:p.t});LV.go("search",p);};

/* ---------- the door: the first card, as Inkwell's ---------- */
UI.door=function(force){if(!force&&(!LV.S.door||sessionStorage.getItem("lv_door")))return;try{sessionStorage.setItem("lv_door","1");}catch(e){}
  var d=h("div.door",{id:"door",role:"dialog","aria-modal":"true","aria-labelledby":"door-title"});
  function shut(then){d.remove();document.removeEventListener("keydown",esc,true);if(then)then();else{var q=$("q");if(q)q.focus();}}
  function esc(e){if(e.key==="Escape"){e.preventDefault();shut();}}
  var straight=h("input",{type:"checkbox",checked:!LV.S.door,on:{change:function(){LV.set("door",!straight.checked);}}});
  var dress=UI.seg([["day","☀"],["dusk","◖"],["night","☾"]],LV.S.dress==="auto"?(LV.night()?"night":"day"):LV.S.dress,function(v){LV.set("dress",v);},T("Day, dusk or night","Jour, crépuscule ou nuit"));
  dress.classList.add("dress3");LV.qsa(".key",dress).forEach(function(k,i){k.setAttribute("aria-label",[T("Day","Jour"),T("Dusk","Crépuscule"),T("Night","Nuit")][i]);k.classList.add("icon");});
  var card=h("div.door-card",null,[dress,UI.seal("seal-big"),h("h1",{id:"door-title",tabindex:"-1",text:"Clavis"}),h("div.strap",null,h("span",{text:T("An offline search engine","Un moteur de recherche hors ligne")})),
    h("p.say",{text:T("Clavis is a key to what you are looking for: the open web and the scholarly record when you are online, and everything you have kept when you are not. No AI writes your answers, no advertiser sees your questions, and what you keep stays on this device.",
      "Clavis est une clé pour ce que vous cherchez : le web ouvert et les travaux savants quand vous êtes en ligne, et tout ce que vous avez gardé quand vous ne l’êtes pas. Aucune IA n’écrit vos réponses, aucun annonceur ne voit vos questions, et ce que vous gardez reste sur cet appareil.")}),
    h("p",{style:{margin:"0","font-size":".9rem",color:"var(--ink-3)"}},[T("New here? ","Nouveau ici ? "),h("a",{href:"#",on:{click:function(e){e.preventDefault();shut(function(){LV.tour&&LV.tour.start();});}},style:{"font-weight":"650"}},T("Take the guided tour","Faire la visite guidée"))]),
    h("div.acts",null,[UI.key(T("Open the search","Ouvrir la recherche"),function(){LV.set("mode","everyday");UI.bar();shut();if(LV.route().path!=="home")LV.go("home");else UI.render();},"primary",{id:"door-open"}),
      UI.key(T("Scholarly search","Recherche savante"),function(){LV.set("mode","scholarly");UI.bar();shut();LV.go("home");UI.render();},"",{id:"door-scholar"})]),
    h("label.switch",null,[straight,h("span.track",{"aria-hidden":"true"}),T("Open straight to the search from now on","Ouvrir directement la recherche désormais")]),
    h("hr.rule"),h("div.sign",{text:T("Designed and built by ","Conçu et réalisé par ")+LV.AUTHOR}),h("div.copy",{text:"© "+LV.YEAR+" "+LV.AUTHOR+T(". All rights reserved.",". Tous droits réservés.")})]);
  d.appendChild(card);document.body.appendChild(d);document.addEventListener("keydown",esc,true);setTimeout(function(){var t=$("door-title");if(t)t.focus({preventScroll:true});},50);};

/* ---------- the router's rooms ---------- */
UI.render=function(){var r=LV.route(),m=$("main"),g=++UI.gen;UI.closeSheet(true);
  if(r.p.m&&r.p.m!==LV.S.mode&&(r.p.m==="everyday"||r.p.m==="scholarly")){LV.S.mode=r.p.m;LV.save();UI.bar();}
  LV.clear(m);document.title="Clavis";
  var view={home:UI.home,search:UI.results,read:UI.reader,paper:UI.paper,author:UI.author,library:UI.library,history:UI.history}[r.path]||UI.home;
  try{view(m,r.p,g);}catch(e){console.error(e);m.appendChild(h("div.view",null,UI.oops(e)));}
  LV.emit("rendered",r);};
UI.oops=function(e){return h("div.empty",null,[h("p.big",{text:T("Something did not open.","Quelque chose ne s’est pas ouvert.")}),h("p",{text:String(e&&e.message||e)}),UI.key(T("Back to the search","Retour à la recherche"),function(){LV.go("home");})]);};
UI.stale=function(g){return g!==UI.gen;};

/* ---------- home ---------- */
UI.home=function(m){var mode=LV.S.mode,v=h("div.view.home");m.appendChild(v);
  v.appendChild(UI.seal("seal-home"));v.appendChild(h("div.title",{text:"Clavis"}));
  v.appendChild(h("div.strap",{text:mode==="scholarly"?T("Scholarly search","Recherche savante"):T("An offline search engine","Un moteur de recherche hors ligne")}));
  v.appendChild(UI.form("",{id:"q"}));
  v.appendChild(h("p.qhint",{text:LV.online()?T("Press / to search from anywhere. Nothing you keep leaves this device.","Appuyez sur / pour chercher de partout. Rien de ce que vous gardez ne quitte cet appareil.")
    :T("No connection: Clavis searches what this device keeps.","Pas de connexion : Clavis cherche dans ce que cet appareil garde.")}));
  var below=h("div.below");v.appendChild(below);
  /* what waits: searches put aside for later, and the last search */
  var later=LV.later.list.slice(0,5);
  if(later.length)below.appendChild(h("div.card",null,[h("div.eyebrow",{text:T("Waiting for you","Ce qui vous attend")}),h("div.list",{style:{"margin-top":".6rem"}},later.map(function(l){
    return h("div.item",null,[h("div.ico",{text:l.url?"🔖":"🔎"}),h("div.body",null,[h("div.t",null,l.url?h("a",{href:l.url,target:"_blank",rel:"noopener noreferrer",text:l.title||l.url}):h("span",{text:l.q})),h("div.s",{text:UI.ago(l.at)+(l.from==="thought"?T(" · from your thoughts"," · de vos pensées"):"")}),
      h("div.acts",null,[l.q?UI.key(T("Search it now","Le chercher maintenant"),function(){LV.later.remove(l.id);UI.submit(l.q);},"tiny primary"):null,UI.key(T("Done","Fait"),function(){LV.later.remove(l.id).then(UI.render);},"tiny")])])]);}))]));
  var kept=LV.lib.items.length;
  below.appendChild(h("div.grid2",null,[
    h("div.card",null,[h("div.eyebrow",{text:T("Kept on this device","Gardé sur cet appareil")}),h("div.stat",{style:{margin:".5rem 0 .2rem"},text:LV.num(kept)}),
      h("div.small.muted",{text:kept?T("pages, papers, books and files you can search with no connection","pages, articles, livres et fichiers à chercher sans connexion"):T("Press Keep on any result and it stays here, searchable offline.","Appuyez sur Garder sur un résultat et il reste ici, cherchable hors ligne.")}),
      h("div.acts",{style:{display:"flex",gap:".4rem","flex-wrap":"wrap","margin-top":".7rem"}},[UI.key(T("Open the library","Ouvrir la bibliothèque"),function(){LV.go("library");},"small"),UI.key(T("Take a topic offline","Emporter un sujet hors ligne"),function(){UI.takeOffline();},"small gold")])]),
    h("div.card",{id:"home-last"},[h("div.eyebrow",{text:T("Pick up where you left off","Reprendre où vous en étiez")}),h("div.small.muted",{style:{"margin-top":".5rem"},text:T("Your recent searches appear here (History can be paused in Display).","Vos recherches récentes apparaissent ici (l’historique peut être mis en pause dans Affichage).")})])]));
  LV.hist.all().then(function(hs){var c=$("home-last");if(!c)return;var qs=[],seen={};hs.forEach(function(e){if(e.kind==="q"&&!seen[e.q]&&qs.length<5){seen[e.q]=1;qs.push(e);}});if(!qs.length)return;
    LV.clear(c);c.appendChild(h("div.eyebrow",{text:T("Pick up where you left off","Reprendre où vous en étiez")}));
    c.appendChild(h("div",{style:{display:"flex","flex-wrap":"wrap",gap:".4rem","margin-top":".6rem"}},qs.map(function(e){return UI.key((e.mode==="scholarly"?"🎓 ":"")+e.q,function(){LV.set("mode",e.mode||"everyday");UI.bar();UI.submit(e.q);},"small");})));});
  setTimeout(function(){var q=$("q");if(q&&!document.getElementById("door")&&window.matchMedia("(min-width:721px)").matches)q.focus({preventScroll:true});},60);};

/* ---------- results ---------- */
UI.results=function(m,p,g){var mode=p.m==="scholarly"?"scholarly":"everyday",q=p.q||"",tab=LV.search.tab(mode,p.t),page=Math.max(1,+p.p||1);
  if(!q){LV.go("home",null,true);return;}document.title=q+" · Clavis";
  var v=h("div.view"),head=h("div.rhead");m.appendChild(v);v.appendChild(head);
  head.appendChild(UI.form(q,{id:"q"}));
  if(LV.support)head.appendChild(LV.support.intentLine(q));
  /* the tabs: the ones chosen in Display, the one in use, and More for the rest */
  var tabs=h("div.tabs",{role:"tablist","aria-label":T("Kinds of result","Types de résultat")}),all=LV.search.TABS[mode],shown=mode==="everyday"?all.filter(function(t){return LV.S.tabs.indexOf(t.id)>=0||t.id===tab.id||t.id==="library";}):all;
  shown.forEach(function(t){var a=h("button.tab",{role:"tab",type:"button","aria-selected":t.id===tab.id?"true":"false",id:"tab-"+t.id,on:{click:function(){var np=Object.assign({},p,{t:t.id,p:1});LV.go("search",np);}}},[h("span",{"aria-hidden":"true",text:t.ico}),T(t.name[0],t.name[1])]);tabs.appendChild(a);});
  var rest=all.filter(function(t){return shown.indexOf(t)<0;});
  if(rest.length){var sel=h("select.field",{"aria-label":T("More kinds of result","Plus de types de résultat"),style:{width:"auto","border-radius":"10px","font-size":".82rem","font-weight":"600",padding:".35rem .7rem"},
    on:{change:function(){if(sel.value)LV.go("search",Object.assign({},p,{t:sel.value,p:1}));}}},[h("option",{value:"",text:T("More…","Plus…")})].concat(rest.map(function(t){return h("option",{value:t.id,text:t.ico+" "+T(t.name[0],t.name[1])});})));tabs.appendChild(sel);}
  head.appendChild(tabs);
  if(mode==="scholarly"&&tab.scholar)head.appendChild(UI.filters(p));
  var wrap=h("div.rwrap"),main=h("div.rmain",{id:"results","aria-live":"polite","aria-busy":"true"}),side=h("aside",{id:"side","aria-label":T("About this search","À propos de cette recherche")});
  wrap.appendChild(main);wrap.appendChild(side);v.appendChild(wrap);
  if(tab.layout==="images"||tab.layout==="places"||tab.layout==="library"||tab.layout==="authors"||mode==="scholarly")wrap.classList.add("single");
  LV.hist&&LV.support&&LV.support.inSearch();
  if(tab.layout==="library")return UI.libResults(main,q,tab,page,g);
  if(tab.layout==="authors")return UI.authorResults(main,q,page,g);
  var f={};if(mode==="scholarly"){["from","to","sort","type","lang"].forEach(function(k){if(p[k])f[k]=p[k];});if(p.oa)f.oa=true;if(p.peer)f.peer=true;}
  var st=LV.search.stream(mode,tab.id,q,f),chips=h("div.srcline",{"aria-label":T("Sources asked","Sources interrogées")}),stat=h("div.rstat");
  main.appendChild(stat);main.appendChild(chips);var answerSlot=h("div"),libSlot=h("div"),list=h("div",{id:"rlist"});main.appendChild(answerSlot);main.appendChild(libSlot);main.appendChild(list);
  function drawChips(){LV.clear(chips);st.srcs.forEach(function(s){var x=st.status[s]||{};var lab=LV.search.srcName(s)+(x.state==="ok"||x.state==="kept"?" "+x.n:"");
    chips.appendChild(h("span.srcchip",{"data-s":x.state==="idle"?"wait":x.state,title:x.state==="err"?x.err:x.state==="kept"?T("Kept answer from ","Réponse gardée de ")+UI.ago(x.at):""},lab));});}
  drawChips();if(!st.srcs.length)chips.appendChild(h("span.srcchip",{"data-s":"none"},T("Every source for this tab is switched off in Display.","Toutes les sources de cet onglet sont désactivées dans Affichage.")));
  /* the answers worked out on this device come first, and the panel beside */
  if(page===1&&tab.layout!=="dictionary")LV.answers.detect(q,tab.id).then(function(a){if(a&&!UI.stale(g))answerSlot.appendChild(UI.answer(a));});
  if(tab.layout==="dictionary")UI.dictionary(answerSlot,q,g);
  if(page===1&&(tab.extras||mode==="scholarly"||tab.id==="web"))LV.index.search(q,{only:"lib",kind:mode==="scholarly"?"paper":null,max:3}).then(function(hits){if(UI.stale(g)||!hits.length)return;
    libSlot.appendChild(h("div.block",null,[h("div.bh",null,[h("h2",{text:T("From your library","De votre bibliothèque")}),UI.key(T("All of it","Tout"),function(){LV.go("search",Object.assign({},p,{t:"library",p:1}));},"tiny")]),
      h("div",null,hits.map(function(x){return UI.keptCard(x,q);}))]));});
  if(!LV.online())stat.appendChild(h("span",{text:T("No connection: these come from what this device keeps.","Pas de connexion : ces résultats viennent de ce que cet appareil garde.")}));
  LV.search.page(st,page,function(){if(!UI.stale(g))drawChips();}).then(function(){if(UI.stale(g))return;drawChips();
    var items=LV.search.slice(st,page);
    /* nothing from any source and no connection: what this device holds, searched instead */
    if(!items.length&&(st.offline||!LV.online()))return UI.offlineResults(list,q,mode,g).then(function(){main.setAttribute("aria-busy","false");});
    main.setAttribute("aria-busy","false");
    LV.clear(stat);var per=st.tab.n||LV.perPage(),tot=Object.keys(st.totals).reduce(function(a,k){return a+(+st.totals[k]||0);},0);
    stat.appendChild(h("span",{text:items.length?T("Page ","Page ")+page+(tot?T(" · about "," · environ ")+LV.num(tot)+T(" in all"," en tout"):""):""}));
    if(st.cachedAt)stat.appendChild(h("span",{text:"· "+T("some answers kept from ","des réponses gardées de ")+UI.ago(st.cachedAt)}));
    stat.appendChild(h("button.why",{type:"button",on:{click:function(){UI.why(st);}}},T("Why these results?","Pourquoi ces résultats ?")));
    var sug=st.suggestion;if(page===1&&sug&&LV.fold(sug)!==LV.fold(q))list.appendChild(UI.didYou(sug));
    else if(page===1&&items.length<3)LV.answers.spell(q).then(function(s){if(s&&!UI.stale(g))list.insertBefore(UI.didYou(s),list.firstChild);});
    if(!items.length){list.appendChild(UI.nothing(q,mode,st));}
    else if(tab.layout==="images")list.appendChild(h("div.imgs",null,items.map(UI.imageTile)));
    else if(tab.layout==="places")UI.places(list,items);
    else items.forEach(function(x,i){list.appendChild(x.kind==="paper"?UI.paperCard(x,q):UI.resultCard(x,q));if(tab.extras&&page===1&&i===2&&LV.search.srcOn("openverse"))list.appendChild(UI.imageStrip(q,g));});
    list.appendChild(UI.pager(st,page,p));
    list.appendChild(UI.elsewhere(q,mode));
    if(tab.extras&&page===1)LV.search.panelFor(st).then(function(pn){if(UI.stale(g))return;if(pn)side.appendChild(UI.panel(pn));else if(st.extras.ddg&&st.extras.ddg.abstract)side.appendChild(UI.ddgPanel(st.extras.ddg));});
    if(!side.childNodes.length&&!(tab.extras&&page===1))wrap.classList.add("single");});};

UI.filters=function(p){var bar=h("div.filters",{role:"group","aria-label":T("Filters","Filtres")}),yr=new Date().getFullYear();
  function upd(k,v){var np=Object.assign({},p,{p:1});if(v)np[k]=v;else delete np[k];LV.go("search",np);}
  var from=h("input",{type:"number",min:"1500",max:String(yr+1),value:p.from||"",placeholder:T("from","de"),"aria-label":T("From year","Depuis l’année")}),to=h("input",{type:"number",min:"1500",max:String(yr+1),value:p.to||"",placeholder:T("to","à"),"aria-label":T("To year","Jusqu’à l’année")});
  var yrs=h("label",null,[T("Years","Années"),from,"–",to,UI.key(T("Apply","Appliquer"),function(){var np=Object.assign({},p,{p:1,from:from.value||"",to:to.value||""});LV.go("search",np);},"tiny")]);
  [from,to].forEach(function(i){i.addEventListener("keydown",function(e){if(e.key==="Enter"){e.preventDefault();yrs.querySelector("button").click();}});});
  var sort=h("select",{"aria-label":T("Order","Ordre"),on:{change:function(){upd("sort",sort.value==="rel"?"":sort.value);}}},[["rel",T("Most relevant","Les plus pertinents")],["cited",T("Most cited","Les plus cités")],["new",T("Newest","Les plus récents")],["old",T("Oldest","Les plus anciens")],["trust",T("Most trustworthy first","Les plus fiables d’abord")]].map(function(o){return h("option",{value:o[0],selected:(p.sort||"rel")===o[0],text:o[1]});}));
  var type=h("select",{"aria-label":T("Kind of work","Type de travail"),on:{change:function(){upd("type",type.value);}}},[["",T("Any kind","Tous types")],["article",T("Research articles","Articles de recherche")],["review",T("Reviews","Revues de littérature")],["preprint",T("Preprints","Prépublications")],["thesis",T("Theses","Thèses")],["dataset",T("Datasets","Jeux de données")]].map(function(o){return h("option",{value:o[0],selected:(p.type||"")===o[0],text:o[1]});}));
  var oa=h("input",{type:"checkbox",checked:!!p.oa,on:{change:function(){upd("oa",oa.checked?"1":"");}}}),peer=h("input",{type:"checkbox",checked:!!p.peer,on:{change:function(){upd("peer",peer.checked?"1":"");}}});
  [yrs,h("label",null,[T("Order","Ordre"),sort]),h("label",null,[T("Kind","Type"),type]),h("label",null,[oa,T("Free to read only","Libre accès seulement")]),h("label",null,[peer,T("Peer-reviewed journals only","Revues à comité de lecture seulement")])].forEach(function(n){bar.appendChild(n);});
  if(p.from||p.to||p.sort||p.type||p.oa||p.peer)bar.appendChild(UI.key(T("Clear filters","Effacer les filtres"),function(){LV.go("search",{q:p.q,m:p.m,t:p.t,p:1});},"tiny ghost"));
  return bar;};

/* one web result */
UI.resultCard=function(x,q){var words=LV.words(q),kept=LV.lib.has(x.wiki?"w:"+x.wiki.lang+":"+x.wiki.title:"u:"+x.url);
  var host=LV.host(x.url),path="";try{path=decodeURIComponent(new URL(x.url).pathname).replace(/\/$/,"").split("/").filter(Boolean).slice(0,2).join(" › ");}catch(e){}
  var a=h("a",{href:x.url,target:"_blank",rel:"noopener noreferrer",on:{click:function(){LV.hist.add({kind:"open",title:x.title,url:x.url,q:q});}}},LV.hl(x.title,words));
  var card=h("article.res"+(kept?".kept":""),{"data-id":x.id},[x.thumb?h("img.thumb",{src:x.thumb,alt:"",loading:"lazy",referrerpolicy:"no-referrer",on:{error:function(){this.remove();}}}):null,
    h("div.src",null,[h("span.fav",{"aria-hidden":"true",text:(LV.search.srcName(x.src)||"?").charAt(0)}),h("span.host",{text:host+(path?" › "+path:"")})]),
    h("h3",null,a),x.snippet?h("p.snip",null,LV.hl(x.snippet,words,400)):null,
    h("div.meta",null,[UI.badge(x.vet&&x.vet.trust,x.vet&&x.vet.label),h("span",{text:T("via ","via ")+LV.search.srcName(x.src)}),x.date?h("span",{text:"· "+UI.when(x.date)}):null]),
    h("div.acts",null,[x.wiki?UI.key(T("Read here","Lire ici"),function(){LV.go("read",{wiki:x.wiki.title,lang:x.wiki.lang});},"tiny primary"):null,
      UI.keepKey(x,q),UI.key(T("Later","Plus tard"),function(){LV.later.add({url:x.url,title:x.title,q:q,from:"result"});LV.toast(T("Put aside for later. It waits on the home page.","Mis de côté. Il vous attend sur la page d’accueil."));},"tiny"),
      x.also?UI.link(x.also.label,x.also.url,"tiny"):null,
      UI.link(T("Old copy","Copie ancienne"),"https://web.archive.org/web/2/"+x.url,"tiny ghost")])]);
  return card;};
UI.keepKey=function(x,q){var id=x.kind==="paper"?x.id:x.wiki?"w:"+x.wiki.lang+":"+x.wiki.title:"u:"+x.url,has=LV.lib.has(id);
  var k=UI.key(has?T("✓ Kept","✓ Gardé"):T("Keep","Garder"),function(){if(LV.lib.has(id)){LV.lib.remove(id).then(function(){k.textContent=T("Keep","Garder");k.setAttribute("aria-pressed","false");var c=k.closest(".res");if(c)c.classList.remove("kept");LV.toast(T("Taken out of your library.","Retiré de votre bibliothèque."));});return;}
    k.disabled=true;k.textContent=T("Keeping…","Je garde…");LV.lib.keep(x,q).then(function(){k.disabled=false;k.textContent=T("✓ Kept","✓ Gardé");k.setAttribute("aria-pressed","true");var c=k.closest(".res");if(c)c.classList.add("kept");
      if(!x.wiki)LV.toast(T("Kept in your library, searchable offline.","Gardé dans votre bibliothèque, cherchable hors ligne."));},function(){k.disabled=false;k.textContent=T("Keep","Garder");});},"tiny gold",{"aria-pressed":has?"true":"false"});return k;};
/* one scholarly record */
UI.paperCard=function(x,q){var id=UI.paperId(x);UI.papers.set(id,x);var words=LV.words(q),kept=LV.lib.has(x.id);
  var au=x.authors||[],shownA=au.slice(0,4),authors=h("p.authors");
  shownA.forEach(function(a,i){if(i)authors.appendChild(document.createTextNode(", "));authors.appendChild(a.oa?h("button",{type:"button",on:{click:function(){LV.go("author",{id:a.oa});}}},a.name):document.createTextNode(a.name));});
  if(au.length>4)authors.appendChild(document.createTextNode(T(" and "," et ")+LV.plural(au.length-4,"other","others","autre","autres")));
  if(x.venue){authors.appendChild(document.createTextNode(" · "));authors.appendChild(h("span.venue",{text:x.venue}));}if(x.year)authors.appendChild(document.createTextNode(" · "+x.year));
  var abs=x.abstract?h("p.abs.clamp",null,LV.hl(x.abstract,words,1400)):h("p.abs.muted",{text:T("No abstract in the open records.","Pas de résumé dans les notices ouvertes.")});
  var more=x.abstract&&x.abstract.length>320?UI.key(T("Whole abstract","Tout le résumé"),function(){abs.classList.toggle("clamp");more.textContent=abs.classList.contains("clamp")?T("Whole abstract","Tout le résumé"):T("Shorter","Plus court");},"tiny ghost"):null;
  var card=h("article.res.paper"+(kept?".kept":""),{"data-id":x.id},[
    h("div.src",null,[UI.badge(x.vet.trust,x.vet.label),x.oa?h("span.badge.oa",{text:T("Free to read","Libre accès")}):null,x.preprint?null:h("span.badge.plain",{text:LV.scholar.typeName(x.type)})]),
    h("h3",null,h("a",{href:"#/paper?id="+encodeURIComponent(id)},LV.hl(x.title,words))),authors,abs,more,
    h("div.meta",null,[x.cites?h("span",{text:T("Cited by ","Cité par ")+LV.num(x.cites)}):null,h("span",{text:(x.cites?"· ":"")+T("Found in ","Trouvé dans ")+(x.srcs||[x.src]).map(LV.search.srcName).join(", ")})]),
    h("div.acts",null,[UI.key(T("Cite","Citer"),function(){UI.cite([x]);},"tiny primary"),UI.keepKey(x,q),
      x.pdf?UI.link("PDF",x.pdf,"tiny"):x.oaUrl?UI.link(T("Read it free","Lire gratuitement"),x.oaUrl,"tiny"):null,
      x.doi?UI.link("DOI",UI.doiUrl(x.doi),"tiny ghost"):x.url?UI.link(T("Open","Ouvrir"),x.url,"tiny ghost"):null,
      x.cites&&x.oaid?UI.key(T("Who cites it","Qui le cite"),function(){LV.go("paper",{id:id,v:"cited"});},"tiny ghost"):null])]);
  return card;};
UI.doiUrl=function(d){return "https://doi.org/"+String(d).split("/").map(function(s,i){return i?encodeURIComponent(s).replace(/%2F/g,"/"):s;}).join("/");};
UI.paperId=function(x){return x.doi?"doi:"+x.doi:x.oaid?"oa:"+x.oaid:x.pmid?"pmid:"+x.pmid:x.id;};
/* something kept, found in the library */
UI.keptCard=function(r,q){var x=r.item,words=LV.words(q),lib=r.lib;
  var open=function(){if(x.kind==="paper"||x.paper){var pp=x.paper||x;UI.papers.set(UI.paperId(pp),pp);LV.go("paper",{id:UI.paperId(pp)});return;}
    if(lib&&(x.html||x.text||x.plain))LV.go("read",{id:x.id});else if(x.url)LV.openUrl(x.url);};
  var ico={page:"📖",paper:"📄",book:"📚",file:"🗂",image:"🖼",link:"🔗",web:"🌐",news:"📰",qa:"💬",code:"⌨",place:"📍"}[x.kind]||"🔗";
  return h("article.res"+(lib?".kept":""),null,[h("div.src",null,[h("span.fav",{"aria-hidden":"true",text:ico}),h("span.host",{text:lib?(x.shelf?T("Shelf: ","Étagère : ")+x.shelf:T("In your library","Dans votre bibliothèque")):T("Seen before · ","Déjà vu · ")+(LV.host(x.url||"")||LV.search.srcName(x.src))})]),
    h("h3",null,h("a",{href:x.url||"#",on:{click:function(e){e.preventDefault();open();}}},LV.hl(x.title,words))),
    r.snippet?h("p.snip",null,LV.hl(r.snippet,words,400)):null,
    h("div.meta",null,[x.vet&&x.vet.label?UI.badge(x.vet.trust,x.vet.label):null,h("span",{text:lib?T("kept ","gardé ")+UI.ago(x.at):T("seen ","vu ")+UI.ago(r.at||Date.now())})]),
    h("div.acts",null,[UI.key(lib&&(x.html||x.text||x.plain)?T("Read here","Lire ici"):T("Open","Ouvrir"),open,"tiny primary"),!lib?UI.keepKey(x,q):null])]);};
UI.imageTile=function(x){return h("a.tile",{href:x.url,target:"_blank",rel:"noopener noreferrer",title:x.title},[h("img",{src:x.thumb,alt:x.title,loading:"lazy",referrerpolicy:"no-referrer",on:{error:function(){this.closest(".tile").remove();}}}),h("div.cap",{text:x.title+(x.snippet?" · "+x.snippet:"")})]);};
UI.imageStrip=function(q,g){var b=h("div.block",null,[h("div.bh",null,[h("h2",{text:T("Pictures","Images")}),UI.key(T("More pictures","Plus d’images"),function(){var r=LV.route();LV.go("search",Object.assign({},r.p,{t:"images",p:1}));},"tiny")])]),s=h("div.strip");b.appendChild(s);b.hidden=true;
  LV.search.imagesFor(q).then(function(items){if(UI.stale(g)||!items.length)return;items.forEach(function(x){s.appendChild(UI.imageTile(x));});b.hidden=false;});return b;};
UI.places=function(list,items){var map=h("iframe",{title:T("Map","Carte"),style:{width:"100%",height:"340px",border:"0","border-radius":"var(--r-lg)","box-shadow":"var(--card)",background:"var(--bg-2)"},loading:"lazy",referrerpolicy:"no-referrer"});
  function show(x){var bb=x.place.bbox||[],b=bb.length===4?[+bb[2],+bb[0],+bb[3],+bb[1]]:[x.place.lon-.02,x.place.lat-.02,x.place.lon+.02,x.place.lat+.02];
    map.src="https://www.openstreetmap.org/export/embed.html?bbox="+b.map(function(n){return n.toFixed(5);}).join("%2C")+"&layer=mapnik&marker="+x.place.lat.toFixed(5)+"%2C"+x.place.lon.toFixed(5);}
  list.appendChild(h("div.block",null,[map,h("p.small.muted",{style:{margin:".35rem 0 0"}},[T("Map data © ","Données cartographiques © "),h("a",{href:"https://www.openstreetmap.org/copyright",target:"_blank",rel:"noopener noreferrer",text:T("OpenStreetMap contributors","contributeurs d’OpenStreetMap")})])]));
  items.forEach(function(x,i){var c=UI.resultCard(x,"");c.querySelector(".acts").prepend(UI.key(T("Show on the map","Voir sur la carte"),function(){show(x);map.scrollIntoView({behavior:LV.still()?"auto":"smooth",block:"center"});},"tiny primary"));
    if(x.place.type)c.querySelector(".meta").appendChild(h("span",{text:"· "+x.place.type}));list.appendChild(c);});
  if(items[0])show(items[0]);};
UI.answer=function(a){var c=h("section.answer",{"aria-label":T("Worked out on this device","Calculé sur cet appareil")});
  if(a.kind==="define"){c.appendChild(h("div.q",{text:T("Dictionary · on this device","Dictionnaire · sur cet appareil")}));c.appendChild(h("div.big",{text:a.word}));
    Object.keys(a.groups).forEach(function(pos){c.appendChild(h("div.pos",{text:pos}));c.appendChild(h("ol",null,a.groups[pos].map(function(s){return h("li",null,[s.gloss,s.also.length?h("div.syn",null,s.also.map(function(w){return h("button",{type:"button",on:{click:function(){UI.submit("define "+w);}}},w);})):null]);})));});
    c.appendChild(h("p.small.muted",{style:{margin:".6rem 0 0"},text:a.source}));return c;}
  c.appendChild(h("div.q",{text:a.q}));c.appendChild(h("div.big",{text:a.value}));if(a.sub)c.appendChild(h("div.small.muted",{text:a.sub}));
  c.appendChild(h("div",{style:{display:"flex",gap:".4rem","margin-top":".6rem","align-items":"center"}},[UI.key(T("Copy","Copier"),function(){LV.copy(String(a.raw!=null?a.raw:a.value));},"tiny"),h("span.small.muted",{text:T("Worked out on this device, with no connection.","Calculé sur cet appareil, sans connexion.")})]));return c;};
UI.dictionary=function(slot,q,g){LV.answers.define(q).then(function(a){if(UI.stale(g))return;if(a)slot.insertBefore(UI.answer(a),slot.firstChild);},function(){});
  var st=LV.search.stream("everyday","dictionary",q,{});LV.search.page(st,1).then(function(){if(UI.stale(g))return;var d=st.extras.dict;if(!d||!d.entries.length)return;
    var c=h("section.answer",null,[h("div.q",{text:"Wiktionary"}),h("div.big",{text:d.word})]);
    d.entries.forEach(function(e){c.appendChild(h("div.pos",{text:e.lang+" · "+e.pos}));c.appendChild(h("ol",null,e.defs.map(function(t){return h("li",{text:t});})));});
    c.appendChild(h("p.small",{style:{margin:".6rem 0 0"}},h("a",{href:d.url,target:"_blank",rel:"noopener noreferrer",text:T("The whole entry on Wiktionary ↗","Toute l’entrée sur le Wiktionnaire ↗")})));slot.appendChild(c);});};
UI.panel=function(p){var dl=h("dl");(p.facts||[]).forEach(function(f){dl.appendChild(h("dt",{text:f.label}));dl.appendChild(h("dd",null,f.vals.map(function(v,i){return [i?", ":"",v.url?h("a",{href:LV.safeUrl(v.url),target:"_blank",rel:"noopener noreferrer",text:LV.host(v.url)||v.txt}):v.txt];}).flat()));});
  return h("section.panel",null,[p.image?h("img.hero",{src:p.image,alt:"",loading:"lazy",referrerpolicy:"no-referrer"}):null,h("div.in",null,[h("h2",{text:p.title}),p.desc?h("div.desc",{text:p.desc}):null,h("p",{text:p.extract}),
    dl.childNodes.length?dl:null,h("div",{style:{display:"flex",gap:".4rem","flex-wrap":"wrap","margin-bottom":".6rem"}},[UI.key(T("Read here","Lire ici"),function(){LV.go("read",{wiki:p.title,lang:p.lang});},"tiny primary"),p.url?UI.link("Wikipedia ↗",p.url,"tiny"):null]),
    h("div.from",{text:T("From Wikipedia","D’après Wikipédia")+(p.facts&&p.facts.length?T(" and Wikidata"," et Wikidata"):"")+T(" · background, not evidence"," · un contexte, pas une preuve")})])]);};
UI.ddgPanel=function(d){return h("section.panel",null,[d.image?h("img.hero",{src:d.image,alt:"",loading:"lazy",referrerpolicy:"no-referrer"}):null,h("div.in",null,[d.heading?h("h2",{text:d.heading}):null,h("p",{text:d.abstract}),
  d.infobox&&d.infobox.length?h("dl",null,d.infobox.map(function(r){return [h("dt",{text:r[0]}),h("dd",{text:r[1]})];}).flat()):null,d.url?h("p.small",null,h("a",{href:LV.safeUrl(d.url),target:"_blank",rel:"noopener noreferrer",text:(d.source||LV.host(d.url))+" ↗"})):null,
  h("div.from",{text:T("Instant answer from DuckDuckGo","Réponse instantanée de DuckDuckGo")+(d.source?" ("+d.source+")":"")})])]);};
UI.didYou=function(s){return h("p.didyou",null,[T("Did you mean ","Vouliez-vous dire "),h("button",{type:"button",on:{click:function(){UI.submit(s);}}},s),"?"]);};
UI.nothing=function(q,mode,st){var errs=st.srcs.filter(function(s){return st.status[s]&&st.status[s].state==="err";});
  return h("div.empty",null,[h("p.big",{text:T("Nothing came back for this.","Rien n’est revenu pour cela.")}),
    h("p",{text:errs.length===st.srcs.length&&errs.length?T("The sources did not answer just now (they may be busy). Try again in a moment, or search elsewhere below.","Les sources n’ont pas répondu (elles sont peut-être occupées). Réessayez dans un instant, ou cherchez ailleurs ci-dessous.")
      :T("Try fewer words, other words, or another tab.","Essayez moins de mots, d’autres mots, ou un autre onglet.")}),
    UI.key(T("Try again","Réessayer"),function(){LV.search.forget();UI.render();},"small")]);};
UI.pager=function(st,page,p){var info=LV.search.pages(st),bar=h("nav.pager",{"aria-label":T("Pages","Pages")});
  bar.appendChild(UI.key(T("‹ Previous","‹ Précédente"),function(){LV.go("search",Object.assign({},p,{p:page-1}));window.scrollTo(0,0);},"small",{disabled:page<=1}));
  bar.appendChild(h("span",{text:T("Page ","Page ")+page}));
  bar.appendChild(UI.key(T("Next ›","Suivante ›"),function(){LV.go("search",Object.assign({},p,{p:page+1}));window.scrollTo(0,0);},"small",{disabled:!(info.have>page||info.more)}));return bar;};
UI.elsewhere=function(q,mode){return h("section.elsewhere.card",null,[h("div.eyebrow",{text:T("Search elsewhere","Chercher ailleurs")}),h("p.small.muted",{style:{margin:".3rem 0 .6rem"},text:T("Each opens in its own tab with your words. Where an engine lets its AI be left out, Clavis leaves it out.","Chacun s’ouvre dans son propre onglet avec vos mots. Quand un moteur permet de laisser son IA de côté, Clavis la laisse de côté.")}),
  h("div.links",null,LV.web.elsewhere(q,mode).map(function(e){return h("a.key.small",{href:e[1],target:"_blank",rel:"noopener noreferrer"},e[0]);}))]);};
UI.why=function(st){var rows=st.srcs.map(function(s){var x=st.status[s]||{},src=LV.web.sources[s]||LV.scholar.sources[s];
  return h("div.opt",null,[h("div.ol",null,[LV.search.srcName(s),h("span.small.muted",{text:"· "+(x.state==="ok"?LV.plural(x.n,"result","results","résultat","résultats"):x.state==="kept"?T("kept answer, ","réponse gardée, ")+UI.ago(x.at):x.state==="err"?T("did not answer: ","n’a pas répondu : ")+x.err:T("nothing","rien"))})]),
    src&&src.about?h("p.tip",{text:T(src.about[0],src.about[1])}):null]);});
  UI.sheet({title:T("Why these results?","Pourquoi ces résultats ?"),center:true,body:[h("p",{text:st.mode==="scholarly"?
    T("Each source was asked with your words and filters. Records of the same work were joined into one (by DOI, or by title and year). Retracted works were left out. The order follows your choice; for Most relevant, a work found high by several sources, with your words in its title, comes first. Nothing was ranked by a model, and no one paid to be here.","Chaque source a été interrogée avec vos mots et vos filtres. Les notices d’un même travail ont été réunies (par DOI, ou par titre et année). Les travaux rétractés ont été écartés. L’ordre suit votre choix ; pour « Les plus pertinents », un travail trouvé haut par plusieurs sources, avec vos mots dans son titre, vient d’abord. Aucun modèle n’a classé, et personne n’a payé pour être ici.")
    :T("Each source was asked with your words. The lists were joined by their rank in each source: a page found high by two sources counts for both, and a Wikipedia article whose title is exactly your words comes first. Nothing was ranked by a model, and no one paid to be here.","Chaque source a été interrogée avec vos mots. Les listes ont été réunies selon leur rang dans chaque source : une page trouvée haut par deux sources compte pour les deux, et un article de Wikipédia dont le titre est exactement vos mots vient d’abord. Aucun modèle n’a classé, et personne n’a payé pour être ici.")})].concat(rows)});};
/* the library searched, as a tab of the results */
UI.libResults=function(main,q,tab,page,g){LV.index.search(q,{only:"lib",kind:tab.kind||null}).then(function(hits){if(UI.stale(g))return;main.setAttribute("aria-busy","false");
  main.appendChild(h("div.rstat",null,h("span",{text:LV.plural(hits.length,"thing","things","élément","éléments")+T(" in your library match"," de votre bibliothèque correspondent")})));
  if(!hits.length)main.appendChild(h("div.empty",null,[h("p.big",{text:T("Nothing you keep matches this yet.","Rien de ce que vous gardez ne correspond encore.")}),h("p",{text:T("Press Keep on a result and it will be found here, with or without a connection.","Appuyez sur Garder sur un résultat et il sera trouvé ici, avec ou sans connexion.")})]));
  var per=LV.perPage();hits.slice((page-1)*per,page*per).forEach(function(r){main.appendChild(UI.keptCard(r,q));});
  if(hits.length>per){var p=LV.route().p;main.appendChild(h("nav.pager",null,[UI.key(T("‹ Previous","‹ Précédente"),function(){LV.go("search",Object.assign({},p,{p:page-1}));},"small",{disabled:page<=1}),h("span",{text:page+" / "+Math.ceil(hits.length/per)}),
    UI.key(T("Next ›","Suivante ›"),function(){LV.go("search",Object.assign({},p,{p:page+1}));},"small",{disabled:page*per>=hits.length})]));}});};
/* with no connection: everything this device holds that matches */
UI.offlineResults=function(list,q,mode,g){return LV.index.search(q,{kind:mode==="scholarly"?"paper":null}).then(function(hits){if(UI.stale(g))return;
  list.appendChild(h("div.answer",null,[h("div.q",{text:T("No connection","Pas de connexion")}),h("p",{style:{margin:".3rem 0 0"},text:hits.length?T("These come from what this device keeps: things in your library first, then results you have seen before.","Ces résultats viennent de ce que cet appareil garde : votre bibliothèque d’abord, puis des résultats déjà vus.")
    :T("Nothing kept on this device matches this yet. When the connection returns, the search will run again.","Rien de ce qui est gardé sur cet appareil ne correspond encore. Quand la connexion reviendra, la recherche reprendra.")})]));
  hits.slice(0,30).forEach(function(r){list.appendChild(UI.keptCard(r,q));});});};
UI.authorResults=function(main,q,page,g){LV.search.authors(q,page).then(function(r){if(UI.stale(g))return;main.setAttribute("aria-busy","false");
  if(!r.items.length){main.appendChild(h("div.empty",null,h("p.big",{text:T("No author by that name in OpenAlex.","Aucun auteur de ce nom dans OpenAlex.")})));return;}
  r.items.forEach(function(a){main.appendChild(h("article.res",null,[h("h3",null,h("a",{href:"#/author?id="+a.id,text:a.name})),h("p.authors",{text:[a.inst,a.topics.join(", ")].filter(Boolean).join(" · ")}),
    h("div.meta",null,[h("span",{text:LV.plural(a.works||0,"work","works","travail","travaux")}),h("span",{text:"· "+T("cited ","cité ")+LV.num(a.cites||0)+T(" times"," fois")}),a.h?h("span",{text:"· h-index "+a.h}):null])]));});
  var p=LV.route().p;main.appendChild(h("nav.pager",null,[UI.key(T("‹ Previous","‹ Précédente"),function(){LV.go("search",Object.assign({},p,{p:page-1}));},"small",{disabled:page<=1}),h("span",{text:T("Page ","Page ")+page}),
    UI.key(T("Next ›","Suivante ›"),function(){LV.go("search",Object.assign({},p,{p:page+1}));},"small",{disabled:!r.total||page*10>=r.total})]));},
  function(e){if(UI.stale(g))return;main.setAttribute("aria-busy","false");main.appendChild(h("div.empty",null,[h("p.big",{text:T("OpenAlex did not answer.","OpenAlex n’a pas répondu.")}),h("p",{text:String(e.message||e)})]));});};
})();
