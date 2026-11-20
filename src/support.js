/* CLAVIS · THE SUPPORTS. The family's own, carried whole: the 💭 thoughts panel (a thought caught without leaving the
   search, sent later to "Search it now" or "Search it later") and Ingenium's quiet screen. And Clavis's own, for a mind
   that follows one link to the next: the question you came with kept in view, the Clepsydra counting the minutes of a
   search, a gentle time check that asks whether you found it and offers to put the rest aside, and a chaptered tour. */
(function(){
"use strict";
var LV=window.LV,T=LV.T,h=LV.h,$=LV.$,UI=LV.ui,SP=LV.support={};

/* ---------- a search session: the question you came with, and its minutes ---------- */
var SK="clavis_session",SMAP="clavis_sessions";
function loadS(){try{var s=JSON.parse(localStorage.getItem(SK)||"null");if(s&&Date.now()-s.lastAt<30*6e4)return s;}catch(e){}return null;}
function saveS(){try{if(LV.session)localStorage.setItem(SK,JSON.stringify(LV.session));}catch(e){}}
function remember(){try{var m=JSON.parse(localStorage.getItem(SMAP)||"{}")||{};if(LV.session&&LV.session.intent)m[LV.session.id]=LV.session.intent;
  var ks=Object.keys(m);if(ks.length>80)ks.slice(0,ks.length-80).forEach(function(k){delete m[k];});localStorage.setItem(SMAP,JSON.stringify(m));}catch(e){}}
LV.session=loadS();
SP.intentOf=function(id){try{return (JSON.parse(localStorage.getItem(SMAP)||"{}")||{})[id]||"";}catch(e){return "";}};
SP.searched=function(q){var now=Date.now();if(!LV.session||now-LV.session.lastAt>30*6e4||LV.session.found)LV.session={id:LV.uid("s"),start:now,lastAt:now,active:0,intent:q,found:false,checks:0};
  LV.session.lastAt=now;saveS();remember();clock();};
SP.inSearch=function(){if(LV.session){LV.session.lastAt=Date.now();saveS();}};
SP.intentLine=function(q){if(!LV.S.pinQuestion||!LV.session||LV.session.found)return h("span",{hidden:true});var s=LV.session;
  var inp=h("input",{type:"text",value:s.intent||q,"aria-label":T("What you came for","Ce que vous cherchiez"),on:{change:function(){s.intent=inp.value.trim()||q;saveS();remember();}}});
  return h("div.intent",{id:"intent"},[h("span",{"aria-hidden":"true",text:"🎯"}),h("b",{text:T("You came for:","Vous cherchiez :")}),inp,
    UI.key(T("✓ Found it","✓ Trouvé"),function(){SP.found();},"tiny",{id:"intent-found"})]);};
SP.found=function(){if(!LV.session)return;LV.session.found=true;saveS();var i=$("intent");if(i)i.remove();clock();
  LV.toast(T("Found. Well searched.","Trouvé. Bien cherché."));LV.hist.add({kind:"found",title:LV.session.intent});hideNudge();};
SP.aside=function(){var q=(LV.session&&LV.session.intent)||(LV.route().p.q)||"";if(q)LV.later.add({q:q,from:"aside"});if(LV.session){LV.session.found=true;saveS();}hideNudge();clock();
  LV.toast(T("Put aside. It waits for you on the home page.","Mis de côté. Il vous attend sur la page d’accueil."));LV.go("home");};

/* the Clepsydra: minutes of searching, counted only while the page is in front of you */
var TICK=30000;
setInterval(function(){var s=LV.session;if(!s||s.found||document.hidden)return;if(Date.now()-s.lastAt>30*6e4)return;s.active=(s.active||0)+TICK;saveS();clock();check();},TICK);
function mins(){return LV.session&&!LV.session.found?Math.floor((LV.session.active||0)/6e4):0;}
function clock(){var c=$("fab-clock-n");if(c)c.textContent=LV.session&&!LV.session.found&&mins()>0?mins()+"′":"";}
function check(){var every=+LV.S.timeCheck||0,s=LV.session;if(!every||!s||s.found)return;var m=mins();if(m>=every*((s.checks||0)+1)&&!$("nudge")&&!(QS&&QS.isOpen())){s.checks=(s.checks||0)+1;saveS();nudge(m);}}
function hideNudge(){var n=$("nudge");if(n)n.remove();}
function nudge(m){var s=LV.session,n=h("section.nudge#nudge",{role:"dialog","aria-labelledby":"nudge-t","aria-describedby":"nudge-d"},[
  h("h3#nudge-t",{text:LV.plural(m,"minute","minutes","minute","minutes")+T(" of searching"," de recherche")}),
  h("p#nudge-d",null,[T("You came for: ","Vous cherchiez : "),h("b",{text:s.intent||"…"}),T(". Did you find it?",". L’avez-vous trouvé ?")]),
  h("div.acts",null,[UI.key(T("Yes, found it","Oui, trouvé"),function(){SP.found();},"small primary"),UI.key(T("Still looking","Je cherche encore"),function(){hideNudge();},"small"),
    UI.key(T("Put the rest aside","Mettre le reste de côté"),function(){SP.aside();},"small gold"),UI.key(T("A quiet minute","Une minute au calme"),function(){hideNudge();QS&&QS.open();},"small ghost")])]);
  n.addEventListener("keydown",function(e){if(e.key==="Escape")hideNudge();});document.body.appendChild(n);}
SP.clockSheet=function(){var s=LV.session,on=s&&!s.found;
  UI.sheet({title:T("The Clepsydra","La Clepsydre"),center:true,body:[h("p.muted",{text:T("A water clock: it counts the minutes of a search while Clavis is in front of you, so time does not slip away unseen.","Une horloge à eau : elle compte les minutes d’une recherche tant que Clavis est devant vous, pour que le temps ne file pas sans être vu.")}),
    on?h("div.answer",null,[h("div.q",{text:T("This search","Cette recherche")}),h("div.big",{text:LV.plural(mins(),"minute","minutes","minute","minutes")}),h("p",{style:{margin:".4rem 0 0"}},[T("You came for: ","Vous cherchiez : "),h("b",{text:s.intent||"…"})])])
      :h("p",{text:T("No search under way. The clock starts with your next search.","Aucune recherche en cours. L’horloge démarre à votre prochaine recherche.")}),
    h("div.opt",null,[h("div.ol",null,[h("span.e",{text:"⌛"}),T("Time check","Point sur le temps")]),UI.seg([[0,T("Off","Non")],[15,"15 min"],[25,"25 min"],[45,"45 min"]],LV.S.timeCheck,function(v){LV.set("timeCheck",+v);}),
      h("p.tip",{text:T("A gentle card after this long, asking whether you found it.","Une carte douce après ce temps, pour demander si vous avez trouvé.")})])],
    foot:on?[UI.key(T("Found it","Trouvé"),function(){UI.closeSheet();SP.found();},"primary"),UI.key(T("Put the rest aside","Mettre le reste de côté"),function(){UI.closeSheet();SP.aside();},"gold"),
      UI.key(T("Start afresh","Recommencer"),function(){LV.session=null;try{localStorage.removeItem(SK);}catch(e){}clock();UI.closeSheet();LV.go("home");})]:null});};

/* ---------- the thoughts panel (shared), in Clavis's green ---------- */
var TCK="clavis_thoughts",box=(function(){try{var a=JSON.parse(localStorage.getItem(TCK)||"[]");return Array.isArray(a)?a:[];}catch(e){return [];}})();
var TC=null,QS=null;
function PLACES(){return [
  {key:"search",label:T("🔎 Search it now","🔎 Le chercher maintenant"),word:T("a search","une recherche"),run:function(it){UI.submit(it.t);}},
  {key:"later",label:T("🕘 Search it later","🕘 À chercher plus tard"),word:T("the list for later","la liste pour plus tard"),run:function(it){LV.later.add({q:it.t.slice(0,300),from:"thought"});LV.toast(T("It waits on the home page, for later.","Elle attend sur la page d’accueil, pour plus tard."));}}];}
SP.init=function(){
  if(window.ThoughtCloud)try{TC=ThoughtCloud.create({app:"clavis",prefix:"clavis_tc_",lang:function(){return LV.lang();},fab:function(){return $("fab-thought");},
    list:function(){return box;},save:function(){try{localStorage.setItem(TCK,JSON.stringify(box));}catch(e){}},toast:function(m){LV.toast(m);},night:LV.night,
    calm:function(){return LV.S.motion!=="full";},quiet:function(){return !!(QS&&QS.isOpen())||!!$("door");},places:PLACES,
    placeholder:T("A thought, a tangent, something to look up later: let it go","Une pensée, une digression, quelque chose à chercher plus tard : laissez-la aller"),hotkey:true});}catch(e){console.error(e);}
  if(window.QuietScreen)try{QS=QuietScreen.create({id:"lvQuiet",night:LV.night,still:LV.still,tc:function(){return TC;},
    look:{day:{bg:"#efe9dc",ink:"#2a2620",orbA:"rgba(248,231,176,.7)",orbB:"rgba(184,134,47,.26)",orbC:"rgba(184,134,47,.05)",glow:"rgba(184,134,47,.14)",keyInk:"#2a2620",keyRim:"rgba(42,38,32,.30)",keyHover:"rgba(42,38,32,.06)",focus:"#8a6424",serif:"'Clavis Cormorant',Georgia,serif"},
      night:{bg:"#0b0b0d",ink:"#e8dfc8",orbA:"rgba(240,211,145,.45)",orbB:"rgba(227,189,105,.22)",orbC:"rgba(227,189,105,.05)",glow:"rgba(227,189,105,.12)",keyInk:"#e8dfc8",keyRim:"rgba(232,223,200,.28)",keyHover:"rgba(232,223,200,.08)",focus:"#e8dfc8",serif:"'Clavis Cormorant',Georgia,serif"}},
    hold:{toast:function(){return $("lv-toast");},replay:function(t){LV.toast(t);},after:function(){check();}}});}catch(e){console.error(e);}
  LV.tc=TC;LV.qs_=QS;fabs();clock();};
SP.quiet=function(){if(QS)QS.open();};

/* ---------- the side buttons ---------- */
/* the glyph is a layer of its own: it breathes and lifts inside a button that stays where it is, as Carpe Diem's do,
   so a hand (or a test) reaching for a button never finds it moving */
function glyph(t){return h("span.fg",{"aria-hidden":"true",text:t});}
function fabs(){var f=$("fabs");LV.clear(f);var tucked=false;try{tucked=localStorage.getItem("clavis_tuck")==="1";}catch(e){}
  var tuck=h("button.fab.tuck",{type:"button","aria-label":tucked?T("Show the side buttons","Montrer les boutons"):T("Tuck the side buttons away","Ranger les boutons"),"aria-expanded":tucked?"false":"true",on:{click:function(){tucked=!tucked;try{localStorage.setItem("clavis_tuck",tucked?"1":"0");}catch(e){}fabs();}}},tucked?"‹":"›");
  f.appendChild(tuck);f.classList.toggle("tucked",tucked);
  f.appendChild(h("button.fab#fab-quiet",{type:"button","aria-label":T("Quiet screen","Écran calme"),title:T("Quiet screen","Écran calme"),on:{click:SP.quiet}},[glyph("🌿")]));
  f.appendChild(h("button.fab#fab-thought",{type:"button","aria-label":T("Catch a thought (Ctrl and full stop)","Noter une pensée (Ctrl et point)"),title:T("Catch a thought · Ctrl+.","Noter une pensée · Ctrl+.")},[glyph("💭")]));
  f.appendChild(h("button.fab#fab-dress",{type:"button","aria-label":LV.night()?T("Day","Jour"):T("Night","Nuit"),title:LV.night()?T("Day","Jour"):T("Night","Nuit"),on:{click:function(){LV.set("dress",LV.night()?"day":"night");}}},[glyph(LV.night()?"☀️":"🌙")]));
  f.appendChild(h("button.fab#fab-clock",{type:"button","aria-label":T("The Clepsydra: minutes of this search","La Clepsydre : minutes de cette recherche"),title:T("The Clepsydra","La Clepsydre"),on:{click:SP.clockSheet}},[glyph("⌛"),h("span.clock#fab-clock-n")]));
  if(TC)try{TC.wireFab();TC.badge();}catch(e){}clock();}
LV.on("dress",function(){var d=$("fab-dress");if(d){var g=d.querySelector(".fg");if(g)g.textContent=LV.night()?"☀️":"🌙";d.setAttribute("aria-label",LV.night()?T("Day","Jour"):T("Night","Nuit"));}});
LV.on("settings",function(k){if(k==="lang"&&$("fabs"))fabs();});

/* ---------- the guided tour, in chapters ---------- */
var TOUR=[
  {ch:["Searching","Chercher"],sel:"#q",t:["The search box","La boîte de recherche"],b:["Type what you are looking for and press Search. Press / from anywhere to come back here. Suggestions come only from your own earlier searches and your library.","Tapez ce que vous cherchez et appuyez sur Chercher. Appuyez sur / de partout pour revenir ici. Les suggestions viennent seulement de vos recherches et de votre bibliothèque."]},
  {ch:["Searching","Chercher"],sel:".bar .mode",t:["Everyday or Scholarly","Au quotidien ou Savant"],b:["Everyday searches the open web, the encyclopaedia, pictures, books, places and more. Scholarly searches the journals and the scholarly record, with filters and citations.","Au quotidien cherche le web ouvert, l’encyclopédie, les images, les livres, les lieux et plus. Savant cherche dans les revues et les travaux savants, avec filtres et citations."]},
  {ch:["Searching","Chercher"],sel:"#net",t:["Online and offline","En ligne et hors ligne"],b:["Online, Clavis asks public sources, none of them run by AI. Offline, it searches what this device keeps: your library, and the results you have already seen.","En ligne, Clavis interroge des sources publiques, aucune animée par une IA. Hors ligne, elle cherche dans ce que cet appareil garde : votre bibliothèque, et les résultats déjà vus."]},
  {ch:["Results","Résultats"],sel:null,t:["Every result is labelled","Chaque résultat est étiqueté"],b:["Each result says where it came from and what kind of source it is: “Encyclopaedia (background, not evidence)”, “Preprint: not peer-reviewed”, “peer review confirmed”. Ten to a page, with numbered pages: nothing scrolls on without end.","Chaque résultat dit d’où il vient et de quel type de source il s’agit : « Encyclopédie (contexte, pas une preuve) », « Prépublication : non évaluée », « évaluation confirmée ». Dix par page, numérotées : rien ne défile sans fin."]},
  {ch:["Results","Résultats"],sel:null,t:["Keep, Later, Read here","Garder, Plus tard, Lire ici"],b:["Keep puts a result in your library, searchable with no connection; a Wikipedia article is kept whole. Later puts it aside on the home page. Read here opens an article inside Clavis, calm and without adverts.","Garder met un résultat dans votre bibliothèque, cherchable sans connexion ; un article de Wikipédia est gardé entier. Plus tard le met de côté sur l’accueil. Lire ici ouvre un article dans Clavis, au calme et sans publicité."]},
  {ch:["Results","Résultats"],sel:null,t:["Cite it","Le citer"],b:["In Scholarly, Cite gives the reference in APA, MLA, Chicago, Harvard, IEEE and more, made by the same engine and styles as Inkwell, and exports BibTeX and RIS for Fontes.","En mode Savant, Citer donne la référence en APA, MLA, Chicago, Harvard, IEEE et d’autres, faite par le même moteur et les mêmes styles qu’Inkwell, et exporte BibTeX et RIS pour Fontes."]},
  {ch:["Keeping","Garder"],sel:"#bar-library, #bar-menu",t:["Your library","Votre bibliothèque"],b:["Everything you keep, on shelves you name, with your notes. Add your own files (text, PDF, BibTeX), or take a whole topic offline in one press.","Tout ce que vous gardez, sur des étagères que vous nommez, avec vos notes. Ajoutez vos fichiers (texte, PDF, BibTeX), ou emportez tout un sujet hors ligne en une pression."]},
  {ch:["Keeping","Garder"],sel:"#bar-history, #bar-menu",t:["How you got here","Comment vous êtes arrivé ici"],b:["History keeps the trail of a search, step by step, only on this device. It can be paused or cleared at any time.","L’historique garde la piste d’une recherche, pas à pas, seulement sur cet appareil. Il se met en pause ou s’efface à tout moment."]},
  {ch:["Calm","Calme"],sel:"#fab-thought",t:["💭 Catch a thought","💭 Noter une pensée"],b:["A thought arrives mid-search? Catch it here (or press Ctrl and the full stop) and carry on. Later, send it to “Search it now” or “Search it later”.","Une pensée arrive en pleine recherche ? Notez-la ici (ou Ctrl et point) et continuez. Ensuite, envoyez-la vers « Le chercher maintenant » ou « À chercher plus tard »."]},
  {ch:["Calm","Calme"],sel:"#fab-clock",t:["⌛ The Clepsydra","⌛ La Clepsydre"],b:["It counts the minutes of a search. If you like, a gentle card asks after a while whether you found what you came for, and offers to put the rest aside.","Elle compte les minutes d’une recherche. Si vous le voulez, une carte douce demande au bout d’un moment si vous avez trouvé, et propose de mettre le reste de côté."]},
  {ch:["Calm","Calme"],sel:"#fab-quiet",t:["🌿 Quiet screen","🌿 Écran calme"],b:["When it is all too much: one still screen, a slow breathing circle, and one way back.","Quand tout est de trop : un écran immobile, un cercle qui respire lentement, et un seul chemin de retour."]},
  {ch:["Calm","Calme"],sel:"#bar-display, #bar-menu",t:["Display","Affichage"],b:["Day, Dusk or Night; text size and spacing; the Hyperlegible letters; calm results, less motion, a reading ruler. Each choice has a tip beneath it, and a box finds any setting by its words.","Jour, Crépuscule ou Nuit ; taille et espacement du texte ; les lettres Hyperlisibles ; résultats calmes, moins de mouvement, une règle de lecture. Chaque choix a un conseil, et une boîte trouve tout réglage par ses mots."]},
  {ch:["Calm","Calme"],sel:"#bar-guide, #bar-menu",t:["Come back any time","Revenez quand vous voulez"],b:["The Guide opens this tour again. That is all: the door is open.","Le Guide rouvre cette visite. C’est tout : la porte est ouverte."]}];
var tourAt=-1,ring=null,card=null;
LV.tour={start:function(i){UI.closeSheet();var d=$("door");if(d)d.remove();if(LV.route().path!=="home"){LV.go("home");setTimeout(function(){LV.tour.show(i||0);},250);}else LV.tour.show(i||0);},
  show:function(i){tourAt=i;var c=TOUR[i];if(!c)return LV.tour.end(true);if(!ring){ring=h("div.tour-ring",{"aria-hidden":"true"});document.body.appendChild(ring);}if(card)card.remove();
    var target=null;if(c.sel)c.sel.split(",").some(function(s){var n=document.querySelector(s.trim());if(n&&n.offsetParent!==null){target=n;return true;}return false;});
    var chs=[];TOUR.forEach(function(x,k){var nm=T(x.ch[0],x.ch[1]);if(!chs.some(function(c2){return c2[0]===nm;}))chs.push([nm,k]);});
    var sel=h("select.field",{style:{width:"auto","font-size":".75rem",padding:".2rem .5rem"},"aria-label":T("Chapters","Chapitres"),on:{change:function(){LV.tour.show(+sel.value);}}},chs.map(function(c2){return h("option",{value:c2[1],selected:T(c.ch[0],c.ch[1])===c2[0],text:c2[0]});}));
    card=h("section.tour-card",{role:"dialog","aria-labelledby":"tour-t","aria-describedby":"tour-b"},[h("div.eyebrow",null,[T("Guided tour · ","Visite guidée · ")+(i+1)+" / "+TOUR.length,sel]),h("h3#tour-t",{text:T(c.t[0],c.t[1])}),h("p#tour-b",{text:T(c.b[0],c.b[1])}),
      h("div.acts",null,[h("div",{style:{display:"flex",gap:".35rem"}},[UI.key(T("End","Terminer"),function(){LV.tour.end();},"small ghost"),i?UI.key(T("‹ Back","‹ Retour"),function(){LV.tour.show(i-1);},"small"):null]),
        h("div.dots",{"aria-hidden":"true"},TOUR.map(function(x,k){return h("i"+(k===i?".on":""));})),UI.key(i===TOUR.length-1?T("Finish","Terminer"):T("Next ›","Suivant ›"),function(){LV.tour.show(i+1);},"small primary",{id:"tour-next"})])]);
    document.body.appendChild(card);card.addEventListener("keydown",function(e){if(e.key==="Escape")LV.tour.end();if(e.key==="ArrowRight")LV.tour.show(i+1);if(e.key==="ArrowLeft"&&i)LV.tour.show(i-1);});
    function place(){var vw=window.innerWidth,vh=window.innerHeight,cw=card.offsetWidth,ch=card.offsetHeight;
      if(target){var r=target.getBoundingClientRect();ring.style.display="block";ring.style.left=(r.left-6)+"px";ring.style.top=(r.top-6)+"px";ring.style.width=(r.width+12)+"px";ring.style.height=(r.height+12)+"px";
        var top=r.bottom+14,left=Math.min(Math.max(12,r.left+r.width/2-cw/2),vw-cw-12);if(top+ch>vh-12)top=Math.max(12,r.top-ch-14);if(r.left>vw*.7&&r.top>vh*.4){top=Math.max(12,Math.min(r.top-ch/2,vh-ch-12));left=Math.max(12,r.left-cw-18);}
        card.style.left=left+"px";card.style.top=top+"px";}
      else{ring.style.display="block";ring.style.left=(vw/2)+"px";ring.style.top=(vh/2)+"px";ring.style.width="0px";ring.style.height="0px";card.style.left=Math.max(12,(vw-cw)/2)+"px";card.style.top=Math.max(12,(vh-ch)/2)+"px";}}
    if(target&&target.scrollIntoView)target.scrollIntoView({block:"nearest"});place();setTimeout(function(){$("tour-next").focus();},40);LV.tour.place=place;},
  end:function(done){if(card)card.remove();if(ring)ring.remove();card=ring=null;tourAt=-1;try{localStorage.setItem("clavis_tour",done?"done":"seen");}catch(e){}var q=$("q");if(q)q.focus();}};
window.addEventListener("resize",function(){if(tourAt>=0&&LV.tour.place)LV.tour.place();});
})();
