/* CLAVIS · THE ROOMS, PART TWO: reading here, a scholarly work on its own page, an author, the library, the history,
   citing, and Display. Display is laid out as Ingenium's Settings are, in rooms with one plain line saying what each
   holds, a box that finds any setting by its words, a key to show them all at once, and a tip under every choice. */
(function(){
"use strict";
var LV=window.LV,T=LV.T,h=LV.h,$=LV.$,UI=LV.ui;

/* ---------- reading here ---------- */
UI.reader=function(m,p,g){var v=h("div.view"),r=h("div.reader");v.appendChild(r);m.appendChild(v);
  var top=h("div.top",null,[UI.key(T("‹ Back","‹ Retour"),function(){history.length>1?history.back():LV.go("home");},"small")]),art=h("article",{tabindex:"-1"},h("p.muted",{text:T("Opening…","Ouverture…")}));
  r.appendChild(top);r.appendChild(art);r.appendChild(h("div.ruler",{"aria-hidden":"true",id:"ruler"}));
  var id=p.id||(p.wiki?"w:"+(p.lang||LV.wikiLang())+":"+p.wiki:"");
  function show(it,fresh){if(UI.stale(g))return;document.title=it.title+" · Clavis";LV.clear(art);LV.clear(top);
    var kept=LV.lib.has(it.id);
    top.appendChild(UI.key(T("‹ Back","‹ Retour"),function(){history.length>1?history.back():LV.go("home");},"small"));
    var acts=h("div",{style:{display:"flex",gap:".4rem","flex-wrap":"wrap"}});top.appendChild(acts);
    if(it.wiki){var kk=UI.key(kept?T("✓ Kept to read offline","✓ Gardé pour lire hors ligne"):T("Keep to read offline","Garder pour lire hors ligne"),function(){
        if(LV.lib.has(it.id)){LV.lib.remove(it.id).then(function(){kk.textContent=T("Keep to read offline","Garder pour lire hors ligne");LV.toast(T("Taken out of your library.","Retiré de votre bibliothèque."));});return;}
        kk.disabled=true;LV.lib.keepArticle(it.wiki.title,it.wiki.lang,"").then(function(){kk.disabled=false;kk.textContent=T("✓ Kept to read offline","✓ Gardé pour lire hors ligne");},function(e){kk.disabled=false;LV.toast(String(e.message||e));});},"small gold");acts.appendChild(kk);}
    if(it.url)acts.appendChild(UI.link(it.src==="wikipedia"?"Wikipedia ↗":T("Original ↗","Original ↗"),it.url,"small"));
    acts.appendChild(UI.key(T("Cite","Citer"),function(){UI.cite([{kind:"web",title:it.title,url:it.url||"",src:it.src,authors:[{name:it.src==="wikipedia"?"Wikipedia contributors":""}].filter(function(a){return a.name;}),venue:it.src==="wikipedia"?"Wikipedia":""}]);},"small"));
    if(LV.lib.has(it.id))acts.appendChild(UI.key(T("Note","Note"),function(){UI.noteFor(it.id);},"small"));
    art.appendChild(h("h1",{text:it.title}));
    art.appendChild(h("div.lv-src",null,[it.src==="wikipedia"?T("From Wikipedia, the free encyclopaedia","De Wikipédia, l’encyclopédie libre"):it.file?T("Your file: ","Votre fichier : ")+it.file.name:LV.host(it.url||""),
      kept?" · "+T("kept ","gardé ")+UI.ago(it.at):fresh?" · "+T("read live","lu en direct"):"",it.vet&&it.vet.label?" · "+it.vet.label:""]));
    if(it.sections&&it.sections.length>3)art.appendChild(h("nav.toc",{"aria-label":T("Contents","Sommaire")},[h("div.eyebrow",{text:T("Contents","Sommaire")})].concat(it.sections.map(function(s){return h("a",{href:"#"+s.a,"data-anchor":s.a,text:s.t});}))));
    var body=h("div.body");art.appendChild(body);
    if(it.html)body.innerHTML=it.html;  /* rebuilt from plain tags by LV.web.clean before it was kept */
    else if(it.plain||it.text){String(it.plain||it.text).split(/\n{2,}/).slice(0,4000).forEach(function(par){if(par.trim())body.appendChild(h("p",{text:par.trim()}));});}
    else{body.appendChild(h("p",{text:it.snippet||""}));if(it.url)body.appendChild(h("p",null,UI.link(T("Open the page ↗","Ouvrir la page ↗"),it.url,"small primary")));}
    if(it.note)art.insertBefore(h("div.answer",null,[h("div.q",{text:T("Your note","Votre note")}),h("p",{style:{margin:".3rem 0 0","white-space":"pre-wrap"},text:it.note})]),body);
    art.focus({preventScroll:true});window.scrollTo(0,0);}
  /* the footnotes and the contents move within the page; a link to another article opens it here */
  art.addEventListener("click",function(e){var a=e.target.closest&&e.target.closest("a");if(!a)return;var hr=a.getAttribute("href")||"",anc=a.getAttribute("data-anchor")||(/^#w-/.test(hr)?hr.slice(1):"");
    if(anc){e.preventDefault();var t=document.getElementById(anc)||document.getElementById("w-"+anc);if(t)t.scrollIntoView({behavior:LV.still()?"auto":"smooth",block:"start"});}});
  var kept=id&&LV.lib.get(id);
  if(kept)show(kept,false);
  else if(p.wiki){if(!LV.online()){LV.clear(art);art.appendChild(h("div.empty",null,[h("p.big",{text:T("Not kept on this device.","Pas gardé sur cet appareil.")}),h("p",{text:T("With a connection it opens here; press Keep and it will open with none.","Avec une connexion, il s’ouvre ici ; appuyez sur Garder et il s’ouvrira sans.")})]));return;}
    LV.web.article(p.wiki,p.lang).then(function(a){var it={id:"w:"+a.lang+":"+a.wtitle,title:a.title,url:a.url,src:"wikipedia",html:a.html,sections:a.sections,wiki:{lang:a.lang,title:a.wtitle},vet:{trust:"low",label:T("Encyclopaedia (background, not evidence)","Encyclopédie (contexte, pas une preuve)")}};
      LV.hist.add({kind:"open",title:a.title,url:a.url});show(LV.lib.get(it.id)||it,true);},function(e){if(UI.stale(g))return;LV.clear(art);art.appendChild(UI.oops(e));});}
  else{LV.clear(art);art.appendChild(UI.oops(new Error(T("This is not in your library any more.","Ceci n’est plus dans votre bibliothèque."))));}
  /* the reading ruler: a band that follows the line you are on */
  var ruler=$("ruler");if(ruler&&LV.S.ruler){var mv=function(e){ruler.style.top=(e.clientY-ruler.offsetHeight/2)+"px";};art.addEventListener("pointermove",mv);ruler.style.top="40vh";}};

/* ---------- one scholarly work ---------- */
UI.paper=function(m,p,g){var v=h("div.view"),d=h("div.detail");v.appendChild(d);m.appendChild(v);var id=p.id||"";
  d.appendChild(h("div",{style:{"margin-bottom":"1rem"}},UI.key(T("‹ Back to the results","‹ Retour aux résultats"),function(){history.length>1?history.back():LV.go("home");},"small")));
  var holder=h("div");d.appendChild(holder);
  var known=UI.papers.get(id)||(function(){var hit=null;LV.lib.items.forEach(function(it){if(it.paper&&UI.paperId(it.paper)===id)hit=it.paper;});return hit;})();
  if(known)draw(known,false);else holder.appendChild(h("p.muted",{text:T("Opening…","Ouverture…")}));
  if(LV.online())LV.scholar.work(id).then(function(full){if(UI.stale(g))return;if(known){LV.scholar.absorb(full,known);["cites","oa","doaj"].forEach(function(k){if(known[k]&&!full[k])full[k]=known[k];});LV.scholar.vet(full);}
    full.id=known&&known.id||("p:"+LV.scholar.keyOf(full));UI.papers.set(id,full);draw(full,true);},function(e){if(UI.stale(g))return;if(!known){LV.clear(holder);holder.appendChild(UI.oops(e));}});
  else if(!known){LV.clear(holder);holder.appendChild(UI.oops(new Error(T("Not kept on this device, and there is no connection.","Pas gardé sur cet appareil, et pas de connexion."))));}
  function draw(x,full){LV.clear(holder);document.title=x.title+" · Clavis";var kept=LV.lib.has(x.id);
    var authors=h("p.authors",{style:{"font-size":".95rem"}});(x.authors||[]).slice(0,30).forEach(function(a,i){if(i)authors.appendChild(document.createTextNode(", "));
      authors.appendChild(a.oa?h("button",{type:"button",title:a.inst||"",on:{click:function(){LV.go("author",{id:a.oa});}}},a.name):document.createTextNode(a.name));});
    if((x.authors||[]).length>30)authors.appendChild(document.createTextNode(T(" and others"," et d’autres")));
    var where=[x.venue?h("i",{text:x.venue}):null,x.volume?" "+x.volume+(x.issue?"("+x.issue+")":""):null,x.pages?", "+x.pages:null,x.year?" · "+x.year:null,x.publisher&&x.publisher!==x.venue?" · "+x.publisher:null].filter(Boolean);
    var links=h("div",{style:{display:"flex",gap:".45rem","flex-wrap":"wrap",margin:".9rem 0 .2rem"}},[
      x.pdf?UI.link(T("PDF (free to read)","PDF (libre accès)"),x.pdf,"small primary"):x.oaUrl?UI.link(T("Read it free","Lire gratuitement"),x.oaUrl,"small primary"):null,
      x.doi?UI.link("DOI ↗",UI.doiUrl(x.doi),"small"):x.url?UI.link(T("Open ↗","Ouvrir ↗"),x.url,"small"):null,
      x.pmid?UI.link("PubMed ↗","https://pubmed.ncbi.nlm.nih.gov/"+x.pmid+"/","small"):null,x.pmcid?UI.link("Europe PMC ↗","https://europepmc.org/article/PMC/"+x.pmcid,"small"):null,
      UI.key(kept?T("✓ Kept","✓ Gardé"):T("Keep","Garder"),function(){if(LV.lib.has(x.id)){LV.lib.remove(x.id).then(function(){draw(x,full);});}else LV.lib.keep(x,"").then(function(){LV.toast(T("Kept in your library, with its citation.","Gardé dans votre bibliothèque, avec sa citation."));draw(x,full);});},"small gold"),
      kept?UI.key(T("Note","Note"),function(){UI.noteFor(x.id);},"small"):null]);
    holder.appendChild(h("div.card",null,[h("div.eyebrow",{text:LV.scholar.typeName(x.type)}),h("h1",{text:x.title}),authors,h("p.small.muted",{style:{margin:".2rem 0 .6rem"}},where),
      h("div.checks",null,[UI.badge(x.vet.trust,x.vet.label)].concat(x.vet.checks.slice(1).map(function(c){return h("span.badge.plain",{text:c});}))),links]));
    holder.appendChild(h("div.card",null,[h("h2.h2",{text:T("Abstract","Résumé")}),x.abstract?h("p.abs",{text:x.abstract}):h("p.muted",{text:T("No abstract in the open records. The publisher’s page may have one.","Pas de résumé dans les notices ouvertes. La page de l’éditeur en a peut-être un.")}),
      x.topics&&x.topics.length?h("p.small.muted",{text:T("Topics: ","Thèmes : ")+x.topics.join(" · ")}):null]));
    var citeCard=h("div.card");holder.appendChild(citeCard);UI.citeInto(citeCard,[x]);
    if(x.versions&&x.versions.length>1)holder.appendChild(h("div.card",null,[h("h2.h2",{text:T("Where it can be read","Où le lire")}),h("div.list",null,x.versions.map(function(vv){
      return h("div.item",null,[h("div.ico",{text:vv.oa?"🔓":"🔒"}),h("div.body",null,[h("div.t",null,h("a",{href:LV.safeUrl(vv.url),target:"_blank",rel:"noopener noreferrer",text:vv.name||LV.host(vv.url)})),
        h("div.s",{text:[vv.oa?T("free to read","libre accès"):T("may need a subscription","peut demander un abonnement"),vv.version==="publishedVersion"?T("published version","version publiée"):vv.version==="acceptedVersion"?T("accepted manuscript","manuscrit accepté"):vv.version==="submittedVersion"?T("submitted (preprint)","soumis (prépublication)"):""].filter(Boolean).join(" · ")})])]);}))]));
    /* who cites it, what it cites, what is like it */
    if(x.oaid||x.doi){var rooms=h("div.card"),tabs=h("div.tabs",{role:"tablist"}),out=h("div");rooms.appendChild(h("h2.h2",{text:T("Around this work","Autour de ce travail")}));rooms.appendChild(tabs);rooms.appendChild(out);holder.appendChild(rooms);
      var which=[["cited",T("Cited by","Cité par")+(x.cites?" ("+LV.num(x.cites)+")":"")],["refs",T("What it cites","Ce qu’il cite")+(x.refsCount?" ("+LV.num(x.refsCount)+")":"")],["related",T("Related","Apparentés")]].filter(function(w){return x.oaid||w[0]==="cited";});
      var cur=p.v&&which.some(function(w){return w[0]===p.v;})?p.v:which[0][0],pg=1;
      function load(){LV.clear(out);out.appendChild(h("p.muted",{text:T("Asking…","Je demande…")}));
        var pr=!x.oaid?LV.scholar.citedByS2(x.doi,pg):cur==="cited"?LV.scholar.citedBy(x.oaid,pg):cur==="refs"?LV.scholar.refs(x.oaid,pg):LV.scholar.related(x.oaid,pg);
        pr.then(function(r){if(UI.stale(g))return;LV.clear(out);if(!r.items.length){out.appendChild(h("p.muted",{text:T("None in the open records.","Aucun dans les notices ouvertes.")}));return;}
          r.items.forEach(function(y){out.appendChild(UI.paperCard(y,""));});
          out.appendChild(h("nav.pager",null,[UI.key(T("‹ Previous","‹ Précédente"),function(){pg--;load();},"small",{disabled:pg<=1}),h("span",{text:T("Page ","Page ")+pg}),UI.key(T("Next ›","Suivante ›"),function(){pg++;load();},"small",{disabled:r.items.length<10||(r.total!=null&&pg*10>=r.total)})]));},
          function(e){if(UI.stale(g))return;LV.clear(out);out.appendChild(h("p.muted",{text:T("The records did not answer: ","Les notices n’ont pas répondu : ")+(e.message||e)}));});}
      which.forEach(function(w){tabs.appendChild(h("button.tab",{type:"button",role:"tab","aria-selected":w[0]===cur?"true":"false",on:{click:function(){cur=w[0];pg=1;LV.qsa(".tab",tabs).forEach(function(t){t.setAttribute("aria-selected",t===this?"true":"false");},this);load();}}},w[1]));});
      if(LV.online())load();else out.appendChild(h("p.muted",{text:T("With a connection, the works around this one appear here.","Avec une connexion, les travaux autour de celui-ci apparaissent ici.")}));}}};

/* ---------- an author ---------- */
UI.author=function(m,p,g){var v=h("div.view"),d=h("div.detail");v.appendChild(d);m.appendChild(v);
  d.appendChild(h("div",{style:{"margin-bottom":"1rem"}},UI.key(T("‹ Back","‹ Retour"),function(){history.back();},"small")));var holder=h("div",null,h("p.muted",{text:T("Opening…","Ouverture…")}));d.appendChild(holder);
  LV.scholar.author(p.id).then(function(a){if(UI.stale(g))return;LV.clear(holder);document.title=a.name+" · Clavis";var max=Math.max.apply(null,a.years.map(function(y){return y.works_count||0;}).concat([1]));
    holder.appendChild(h("div.card",null,[h("div.eyebrow",{text:T("Author","Auteur")}),h("h1",{text:a.name}),a.inst.length?h("p.authors",{text:a.inst.join(" · ")}):null,
      h("div.grid3",{style:{margin:".9rem 0"}},[[LV.num(a.works),T("works","travaux")],[LV.num(a.cites),T("citations","citations")],[a.h!=null?a.h:"–",T("h-index (h of their works are each cited at least h times)","indice h (h de ses travaux sont chacun cités au moins h fois)")]].map(function(s){return h("div",null,[h("div.stat",{text:String(s[0])}),h("div.small.muted",{text:s[1]})]);})),
      a.years.length?h("div",{role:"img","aria-label":T("Works a year: ","Travaux par an : ")+a.years.map(function(y){return y.year+": "+y.works_count;}).join(", "),style:{display:"flex","align-items":"flex-end",gap:"4px",height:"70px",margin:".4rem 0"}},
        a.years.map(function(y){return h("div",{title:y.year+": "+y.works_count,style:{flex:"1",height:Math.max(3,Math.round((y.works_count||0)/max*66))+"px",background:"var(--accent)",opacity:".75","border-radius":"4px 4px 0 0"}});})):null,
      a.years.length?h("div",{style:{display:"flex","justify-content":"space-between"},class:"small muted"},[h("span",{text:String(a.years[0].year)}),h("span",{text:String(a.years[a.years.length-1].year)})]):null,
      a.topics.length?h("p.small.muted",{text:T("Topics: ","Thèmes : ")+a.topics.join(" · ")}):null,
      h("div",{style:{display:"flex",gap:".4rem","flex-wrap":"wrap"}},[a.orcid?UI.link("ORCID ↗",a.orcid,"small"):null,UI.link("OpenAlex ↗","https://openalex.org/"+a.id,"small ghost")])]));
    var list=h("div.card"),sort=p.s==="new"?"new":"cited",pg=1,out=h("div");holder.appendChild(list);
    list.appendChild(h("div",{style:{display:"flex","justify-content":"space-between","align-items":"center","flex-wrap":"wrap",gap:".5rem"}},[h("h2.h2",{text:T("Their works","Ses travaux")}),
      UI.seg([["cited",T("Most cited","Les plus cités")],["new",T("Newest","Les plus récents")]],sort,function(v){sort=v;pg=1;load();})]));list.appendChild(out);
    function load(){LV.clear(out);out.appendChild(h("p.muted",{text:T("Asking…","Je demande…")}));LV.scholar.byAuthor(a.id,pg,sort).then(function(r){if(UI.stale(g))return;LV.clear(out);r.items.forEach(function(y){out.appendChild(UI.paperCard(y,""));});
      out.appendChild(h("nav.pager",null,[UI.key(T("‹ Previous","‹ Précédente"),function(){pg--;load();},"small",{disabled:pg<=1}),h("span",{text:T("Page ","Page ")+pg}),UI.key(T("Next ›","Suivante ›"),function(){pg++;load();},"small",{disabled:r.items.length<10})]));},
      function(e){LV.clear(out);out.appendChild(h("p.muted",{text:String(e.message||e)}));});}
    load();},function(e){if(UI.stale(g))return;LV.clear(holder);holder.appendChild(UI.oops(e));});};

/* ---------- citing ---------- */
UI.citeStyle=function(){try{return localStorage.getItem("clavis_style")||"apa";}catch(e){return "apa";}};
UI.citeInto=function(box,works){LV.clear(box);var style=UI.citeStyle(),out=h("div.citebox",{"aria-live":"polite"},h("span.muted",{text:T("Shaping the citation…","Mise en forme de la citation…")})),inText=h("p.small.muted");
  var sel=h("select.field",{style:{width:"auto"},"aria-label":T("Citation style","Style de citation"),on:{change:function(){try{localStorage.setItem("clavis_style",sel.value);}catch(e){}style=sel.value;run();}}},
    LV.scholar.STYLES.map(function(s){return h("option",{value:s[0],selected:s[0]===style,text:s[1]});}));
  var text="";function run(){LV.scholar.format(works,style).then(function(r){LV.clear(out);out.innerHTML=r.entries.join("");text=out.innerText.trim();
      inText.textContent=r.cite?(r.note?T("Note: ","Note : "):T("In the text: ","Dans le texte : "))+new DOMParser().parseFromString(r.cite,"text/html").body.textContent:"";},
    function(e){LV.clear(out);out.appendChild(h("span.muted",{text:String(e.message||e)}));});}
  box.appendChild(h("div",{style:{display:"flex","justify-content":"space-between","align-items":"center",gap:".6rem","flex-wrap":"wrap"}},[h("h2.h2",{style:{margin:0},text:works.length>1?T("Citations","Citations"):T("Cite it","Le citer")}),sel]));
  box.appendChild(out);box.appendChild(inText);
  box.appendChild(h("div",{style:{display:"flex",gap:".4rem","flex-wrap":"wrap"}},[UI.key(T("Copy","Copier"),function(){LV.copy(text);},"small primary"),
    UI.key("BibTeX",function(){LV.download("clavis.bib",LV.scholar.bibtex(works),"application/x-bibtex");},"small"),UI.key("RIS",function(){LV.download("clavis.ris",LV.scholar.ris(works),"application/x-research-info-systems");},"small"),
    UI.key("CSL-JSON",function(){LV.download("clavis.json",LV.scholar.cslJSON(works),"application/json");},"small")]));
  box.appendChild(h("p.tip",{text:T("The same styles as Inkwell, made by the same engine. BibTeX and RIS open in Fontes, in Inkwell and in any reference manager.","Les mêmes styles qu’Inkwell, produits par le même moteur. BibTeX et RIS s’ouvrent dans Fontes, dans Inkwell et dans tout gestionnaire de références.")}));
  run();};
UI.cite=function(works){var box=h("div");UI.sheet({title:T("Cite","Citer"),center:true,body:box});UI.citeInto(box,works);};

/* ---------- a note on something kept ---------- */
UI.noteFor=function(id){var it=LV.lib.get(id);if(!it)return;var ta=h("textarea.field",{"aria-label":T("Your note","Votre note")});ta.value=it.note||"";
  var shelf=h("input.field",{list:"lv-shelves",value:it.shelf||"",placeholder:T("A shelf, for example: Thesis chapter 2","Une étagère, par exemple : Thèse chapitre 2"),"aria-label":T("Shelf","Étagère")});
  var dl=h("datalist#lv-shelves",null,LV.lib.shelves().map(function(s){return h("option",{value:s.name});}));
  var s=UI.sheet({title:T("Note and shelf","Note et étagère"),center:true,focus:"textarea",body:[h("p.small.muted",{text:it.title}),ta,h("div",{style:{height:".7rem"}}),shelf,dl,
    h("p.tip",{text:T("Notes and shelves are searched too, with or without a connection.","Les notes et les étagères sont cherchées aussi, avec ou sans connexion.")})],
    foot:[UI.key(T("Save","Enregistrer"),function(){LV.lib.update(id,{note:ta.value.trim(),shelf:shelf.value.trim()}).then(function(){s.close();LV.toast(T("Saved.","Enregistré."));UI.render();});},"primary")]});};

/* ---------- the library ---------- */
UI.library=function(m,p,g){var v=h("div.view");m.appendChild(v);var room=p.room||"all";document.title=T("Your library","Votre bibliothèque")+" · Clavis";
  v.appendChild(h("div.eyebrow",{text:T("Kept on this device","Gardé sur cet appareil")}));v.appendChild(h("h1.h1",{text:T("Your library","Votre bibliothèque")}));
  v.appendChild(h("p.lede",{text:T("Everything here can be read and searched with no connection. It stays on this device unless you export it.","Tout ce qui est ici se lit et se cherche sans connexion. Cela reste sur cet appareil sauf si vous l’exportez.")}));
  var items=LV.lib.items,count=function(f){return items.filter(f).length;};
  var ROOMS=[["all",T("Everything","Tout"),function(){return true;},T("All you keep, newest first.","Tout ce que vous gardez, le plus récent d’abord.")],
    ["pages",T("Articles to read","Articles à lire"),function(i){return i.kind==="page";},T("Whole articles, kept to read here with no connection.","Des articles entiers, gardés pour les lire ici sans connexion.")],
    ["papers",T("Papers","Travaux savants"),function(i){return i.kind==="paper";},T("Scholarly works with their citations. Export them all for Fontes or Inkwell.","Des travaux savants avec leurs citations. Exportez-les tous pour Fontes ou Inkwell.")],
    ["books",T("Books","Livres"),function(i){return i.kind==="book";},T("Books from library catalogues.","Des livres de catalogues de bibliothèques.")],
    ["files",T("Your files","Vos fichiers"),function(i){return i.kind==="file";},T("Your own documents, read into the index: text, Markdown, web pages and PDF.","Vos propres documents, lus dans l’index : texte, Markdown, pages web et PDF.")],
    ["links",T("Links and pictures","Liens et images"),function(i){return i.kind==="link"||i.kind==="image";},T("Pages on other sites: their titles and words are kept, and the link to the page.","Des pages d’autres sites : leurs titres et leurs mots sont gardés, avec le lien.")],
    ["later",T("For later","Pour plus tard"),null,T("Searches and pages put aside, from a result or from your thoughts.","Des recherches et des pages mises de côté, depuis un résultat ou vos pensées.")]];
  var shelves=LV.lib.shelves();shelves.forEach(function(s){ROOMS.push(["shelf:"+s.name,"🏷 "+s.name,function(i){return i.shelf===s.name;},T("Your shelf “","Votre étagère « ")+s.name+T("”."," ».")]);});
  var cur=ROOMS.filter(function(r){return r[0]===room;})[0]||ROOMS[0];
  var tabs=h("div.rooms",{role:"tablist"},ROOMS.map(function(r){var n=r[2]?count(r[2]):LV.later.list.length;return h("button.key.small",{type:"button",role:"tab","aria-selected":r[0]===cur[0]?"true":"false",on:{click:function(){LV.go("library",{room:r[0]},true);}}},r[1]+" · "+n);}));
  LV.qsa(".key",tabs).forEach(function(k){if(k.getAttribute("aria-selected")==="true")k.setAttribute("aria-pressed","true");});tabs.classList.add("seg");
  v.appendChild(tabs);v.appendChild(h("p.roomline",{text:cur[3]}));
  /* adding: files, a topic taken offline */
  var fileIn=h("input",{type:"file",multiple:true,accept:".txt,.md,.markdown,.html,.htm,.pdf,.bib,.ris,.json,text/plain,text/html,application/pdf",hidden:true,on:{change:function(){add(fileIn.files);fileIn.value="";}}});
  var drop=h("div.drop",{tabindex:"0",role:"button","aria-label":T("Add files to your library","Ajouter des fichiers à votre bibliothèque"),on:{click:function(){fileIn.click();},keydown:function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();fileIn.click();}},
    dragover:function(e){e.preventDefault();drop.classList.add("over");},dragleave:function(){drop.classList.remove("over");},drop:function(e){e.preventDefault();drop.classList.remove("over");add(e.dataTransfer.files);}}},
    [h("strong",{text:T("Drop files here, or press to choose","Déposez des fichiers ici, ou appuyez pour choisir")}),h("div.small.muted",{text:T("Text, Markdown, web pages and PDF are read into the index. BibTeX and RIS become papers.","Texte, Markdown, pages web et PDF sont lus dans l’index. BibTeX et RIS deviennent des travaux.")})]);
  function add(fl){if(!fl||!fl.length)return;LV.toast(T("Reading ","Lecture de ")+LV.plural(fl.length,"file","files","fichier","fichiers")+"…");
    LV.lib.importFiles(fl,cur[0].indexOf("shelf:")===0?cur[0].slice(6):"").then(function(r){LV.toast(LV.plural(r.done,"file","files","fichier","fichiers")+T(" added."," ajoutés.")+(r.errs.length?" "+r.errs.join("; "):""),6000);UI.render();});}
  var tools=h("div.grid2",{style:{margin:"0 0 1.2rem"}},[h("div",null,[drop,fileIn]),
    h("div.card",null,[h("div.eyebrow",{text:T("Take a topic offline","Emporter un sujet hors ligne")}),h("p.small.muted",{style:{margin:".35rem 0 .6rem"},text:T("Keeps the first articles Wikipedia has on a subject, whole, so you can read and search them with no connection.","Garde les premiers articles de Wikipédia sur un sujet, entiers, pour les lire et les chercher sans connexion.")}),
      UI.key(T("Choose a topic…","Choisir un sujet…"),function(){UI.takeOffline();},"small gold")])]);
  v.appendChild(tools);
  /* finding within */
  var find=h("input.findset",{type:"search",placeholder:T("Find in your library…","Chercher dans votre bibliothèque…"),"aria-label":T("Find in your library","Chercher dans votre bibliothèque"),value:p.f||""});v.appendChild(find);
  var list=h("div.list");v.appendChild(list);
  find.addEventListener("input",LV.debounce(function(){draw();},200));
  var bulk=h("div",{style:{display:"flex",gap:".4rem","flex-wrap":"wrap",margin:"1.2rem 0"}},[UI.key(T("Export the library","Exporter la bibliothèque"),function(){LV.download("clavis-library-"+new Date().toISOString().slice(0,10)+".json",LV.lib.exportJSON(),"application/json");},"small"),
    count(function(i){return i.kind==="paper";})?UI.key(T("Cite every paper","Citer tous les travaux"),function(){UI.cite(items.filter(function(i){return i.kind==="paper";}).map(function(i){return i.paper;}));},"small"):null,
    UI.key(T("Import a library file","Importer un fichier de bibliothèque"),function(){fileIn.click();},"small ghost")]);
  function draw(){LV.clear(list);var f=find.value.trim();
    if(cur[0]==="later"){if(!LV.later.list.length)list.appendChild(h("div.empty",null,h("p",{text:T("Nothing put aside. Press Later on a result, or send a thought to “Search it later”.","Rien de côté. Appuyez sur Plus tard sur un résultat, ou envoyez une pensée vers « À chercher plus tard ».")})));
      LV.later.list.forEach(function(l){list.appendChild(h("div.item",null,[h("div.ico",{text:l.url?"🔖":"🔎"}),h("div.body",null,[h("div.t",null,l.url?h("a",{href:l.url,target:"_blank",rel:"noopener noreferrer",text:l.title||l.url}):h("span",{text:l.q})),h("div.s",{text:UI.ago(l.at)}),
        h("div.acts",null,[l.q&&!l.url?UI.key(T("Search it now","Le chercher maintenant"),function(){LV.later.remove(l.id);UI.submit(l.q);},"tiny primary"):null,UI.key(T("Done","Fait"),function(){LV.later.remove(l.id).then(draw);},"tiny")])])]));});return;}
    var pick=function(arr){return arr.filter(function(i){return cur[2](i);});};
    var pr=f?LV.index.search(f,{only:"lib"}).then(function(hs){return pick(hs.map(function(x){return x.item;}));}):Promise.resolve(pick(LV.lib.items));
    pr.then(function(arr){if(!arr.length){list.appendChild(h("div.empty",null,h("p",{text:f?T("Nothing here matches.","Rien ici ne correspond."):T("Nothing here yet.","Rien ici pour l’instant.")})));return;}
      arr.slice(0,300).forEach(function(it){list.appendChild(UI.libItem(it,draw));});if(arr.length>300)list.appendChild(h("p.small.muted",{text:T("The first 300 are shown; find narrows them.","Les 300 premiers sont montrés ; la recherche les affine.")}));});}
  draw();v.appendChild(bulk);
  LV.usage().then(function(u){if(!u||UI.stale(g))return;v.appendChild(h("p.small.muted",{text:T("This device holds ","Cet appareil garde ")+LV.bytes(u.usage)+T(" for Clavis"," pour Clavis")+(u.quota?T(", of about ",", sur environ ")+LV.bytes(u.quota)+T(" it allows."," autorisés."):".")+(LV.memOnly?" "+T("This browser keeps nothing between visits (a private window?).","Ce navigateur ne garde rien entre les visites (une fenêtre privée ?)"):"")}));});};
UI.libItem=function(it,redraw){var ico={page:"📖",paper:"📄",book:"📚",file:"🗂",image:"🖼",link:"🔗"}[it.kind]||"🔗";
  var open=function(){if(it.kind==="paper"&&it.paper){UI.papers.set(UI.paperId(it.paper),it.paper);LV.go("paper",{id:UI.paperId(it.paper)});}else if(it.html||it.text||it.plain)LV.go("read",{id:it.id});else if(it.url)LV.openUrl(it.url);};
  var del=UI.key(T("Remove","Retirer"),function(){if(del.dataset.sure!=="1"){del.dataset.sure="1";del.textContent=T("Remove? Press again","Retirer ? Appuyez encore");setTimeout(function(){if(del.isConnected){del.dataset.sure="";del.textContent=T("Remove","Retirer");}},4000);return;}
    LV.lib.remove(it.id).then(redraw);},"tiny ghost");
  var sub=[it.kind==="paper"&&it.paper?[(it.paper.authors||[]).slice(0,3).map(function(a){return a.name;}).join(", "),it.paper.venue,it.paper.year].filter(Boolean).join(" · "):it.file?it.file.name+" · "+LV.bytes(it.file.size):LV.host(it.url||""),
    T("kept ","gardé ")+UI.ago(it.at),it.shelf?"🏷 "+it.shelf:""].filter(Boolean).join(" · ");
  return h("div.item",null,[h("div.ico",{text:ico}),h("div.body",null,[h("div.t",null,h("a",{href:"#",on:{click:function(e){e.preventDefault();open();}},text:it.title||T("Untitled","Sans titre")})),h("div.s",{text:sub}),
    it.note?h("div.s",{style:{"font-style":"italic"},text:"✎ "+LV.trunc(it.note,160)}):null,
    h("div.acts",null,[UI.key(it.html||it.text||it.plain||it.paper?T("Open","Ouvrir"):T("Open ↗","Ouvrir ↗"),open,"tiny primary"),it.paper?UI.key(T("Cite","Citer"),function(){UI.cite([it.paper]);},"tiny"):null,
      UI.key(T("Note and shelf","Note et étagère"),function(){UI.noteFor(it.id);},"tiny"),del])])]);};
UI.takeOffline=function(){var inp=h("input.field",{type:"search",placeholder:T("A topic, for example: Roman roads","Un sujet, par exemple : voies romaines"),"aria-label":T("Topic","Sujet")});
  var n=10,seg=UI.seg([[5,"5"],[10,"10"],[25,"25"]],n,function(v){n=+v;},T("How many articles","Combien d’articles")),prog=h("p.small.muted",{"aria-live":"polite"});
  var s=UI.sheet({title:T("Take a topic offline","Emporter un sujet hors ligne"),center:true,body:[h("p",{text:T("Clavis keeps the first articles Wikipedia finds for your topic, whole, with their pictures, so they can be read and searched with no connection.","Clavis garde les premiers articles que Wikipédia trouve pour votre sujet, entiers, avec leurs images, pour les lire et les chercher sans connexion.")}),
    inp,h("div",{style:{margin:".8rem 0 .3rem"}},[h("div.small",{text:T("How many articles","Combien d’articles"),style:{"margin-bottom":".35rem","font-weight":"600"}}),seg]),prog],
    foot:[UI.key(T("Take it offline","L’emporter hors ligne"),function(){var q=inp.value.trim();if(!q){inp.focus();return;}if(!LV.online()){prog.textContent=T("There is no connection right now.","Il n’y a pas de connexion pour l’instant.");return;}
      this.disabled=true;LV.lib.takeOffline(q,n,function(i,tot,t){prog.textContent=(i+1)+" / "+tot+" · "+t;}).then(function(r){prog.textContent=T("Kept ","Gardés : ")+r.got+" / "+r.total+(r.failed?T(" (some did not open)"," (certains ne se sont pas ouverts)"):"")+".";
        setTimeout(function(){s.close();LV.go("library",{room:"pages"});},900);},function(e){prog.textContent=String(e.message||e);});},"primary")]});
  inp.addEventListener("keydown",function(e){if(e.key==="Enter"){e.preventDefault();s.el.querySelector(".sf .key").click();}});};

/* ---------- history: the trail of this search, and before ---------- */
UI.history=function(m,p,g){var v=h("div.view");m.appendChild(v);document.title=T("History","Historique")+" · Clavis";
  v.appendChild(h("div.eyebrow",{text:T("Only on this device","Seulement sur cet appareil")}));v.appendChild(h("h1.h1",{text:T("How you got here","Comment vous êtes arrivé ici")}));
  v.appendChild(h("p.lede",{text:LV.S.history?T("Each search and each page you opened, in order, so a long search can be retraced. It never leaves this device.","Chaque recherche et chaque page ouverte, dans l’ordre, pour retracer une longue recherche. Cela ne quitte jamais cet appareil.")
    :T("History is paused: nothing new is written down.","L’historique est en pause : rien de nouveau n’est noté.")}));
  v.appendChild(h("div",{style:{display:"flex",gap:".4rem","flex-wrap":"wrap","margin-bottom":"1.2rem"}},[UI.key(LV.S.history?T("Pause history","Mettre l’historique en pause"):T("Keep history again","Reprendre l’historique"),function(){LV.set("history",!LV.S.history);UI.render();},"small"),
    UI.key(T("Clear all history","Effacer tout l’historique"),function(){if(this.dataset.sure!=="1"){this.dataset.sure="1";this.textContent=T("Clear all? Press again","Tout effacer ? Appuyez encore");return;}LV.hist.clear().then(UI.render);},"small ghost")]));
  var box=h("div");v.appendChild(box);
  LV.hist.all().then(function(all){if(UI.stale(g))return;if(!all.length){box.appendChild(h("div.empty",null,h("p",{text:T("Nothing yet.","Rien pour l’instant.")})));return;}
    /* grouped into sittings: a new one after half an hour away */
    var groups=[],cur=null;all.forEach(function(e){if(!cur||cur.last-e.at>30*6e4){cur={items:[],last:e.at,first:e.at};groups.push(cur);}cur.items.push(e);cur.last=e.at;});
    groups.slice(0,40).forEach(function(gr,i){var start=gr.items[gr.items.length-1].at,intent=LV.support&&LV.support.intentOf(gr.items[0].session);
      var head=i===0&&LV.session&&gr.items[0].session===LV.session.id?T("This search","Cette recherche"):new Date(start).toLocaleDateString(LV.loc(),{weekday:"long",day:"numeric",month:"long"})+", "+new Date(start).toLocaleTimeString(LV.loc(),{hour:"numeric",minute:"2-digit"});
      var c=h("div.card",{style:{"margin-bottom":"1rem"}},[h("div.eyebrow",{text:head}),intent?h("p.small",{style:{margin:".3rem 0 .5rem"}},[T("You came for: ","Vous étiez venu pour : "),h("b",{text:intent})]):null]);
      var ol=h("ol.trail");gr.items.slice().reverse().forEach(function(e){ol.appendChild(h("li"+(e.kind==="q"?".q":""),null,[h("time",{text:new Date(e.at).toLocaleTimeString(LV.loc(),{hour:"numeric",minute:"2-digit"})}),
        e.kind==="q"?h("a",{href:"#/search?"+new URLSearchParams({q:e.q,m:e.mode||"everyday",t:e.tab||(e.mode==="scholarly"?"articles":"all"),p:"1"}).toString(),text:"🔎 "+e.q}):h("a",{href:e.url,target:"_blank",rel:"noopener noreferrer",text:"↗ "+(e.title||e.url)}),
        " ",h("button.key.tiny.ghost",{type:"button","aria-label":T("Forget this","Oublier ceci"),on:{click:function(){LV.hist.remove(e.id).then(UI.render);}}},"×")]));});
      c.appendChild(ol);box.appendChild(c);});});};

/* ---------- About ---------- */
UI.about=function(){var src=function(list){return h("ul",{style:{margin:".3rem 0 0","padding-left":"1.1rem"}},list.map(function(s){return h("li",{style:{margin:".25rem 0"}},[h("b",{text:s.name}),": ",T(s.about[0],s.about[1])]);}));};
  UI.sheet({title:T("About Clavis","À propos de Clavis"),body:[h("div",{style:{"text-align":"center"}},[UI.seal("seal-big"),h("div",{style:{"font-family":"var(--serif)","font-size":"2.2rem","font-weight":"600"},text:"Clavis"}),
      h("div.eyebrow",{text:T("The Offline Project · v","The Offline Project · v")+LV.VERSION})]),
    h("p",{text:T("Clavis is the Offline Project’s search engine: the open web and the scholarly record when you are online, and everything you keep when you are not.","Clavis est le moteur de recherche de l’Offline Project : le web ouvert et les travaux savants quand vous êtes en ligne, et tout ce que vous gardez quand vous ne l’êtes pas.")}),
    h("div.card",{style:{margin:".6rem 0"}},h("ul",{style:{margin:0,"padding-left":"1.1rem"}},[T("No AI: nothing is summarised, rewritten or ranked by a model.","Aucune IA : rien n’est résumé, réécrit ou classé par un modèle."),
      T("No advertising and no tracking: no account, no cookies of Clavis’s own, nothing counted.","Ni publicité ni pistage : pas de compte, pas de cookies propres à Clavis, rien n’est compté."),
      T("Your words go only to the sources you leave switched on, at the moment you search. What you keep, your history and your notes stay on this device.","Vos mots ne vont qu’aux sources que vous laissez activées, au moment où vous cherchez. Ce que vous gardez, votre historique et vos notes restent sur cet appareil."),
      T("Every result says where it came from and what kind of source that is.","Chaque résultat dit d’où il vient et de quel type de source il s’agit.")].map(function(t){return h("li",{style:{margin:".3rem 0"},text:t});}))),
    h("h3.h3",{style:{"margin-top":"1rem"},text:T("Everyday sources","Sources du quotidien")}),src(Object.keys(LV.web.sources).map(function(k){return LV.web.sources[k];})),
    h("h3.h3",{style:{"margin-top":"1rem"},text:T("Scholarly sources","Sources savantes")}),src(Object.keys(LV.scholar.sources).map(function(k){return LV.scholar.sources[k];})),
    h("h3.h3",{style:{"margin-top":"1rem"},text:T("Carried inside","Embarqué")}),h("p.small",{text:T("WordNet 3.0 (Princeton University) for the dictionary; SCOWL (Kevin Atkinson) for spelling; citeproc-js (Frank Bennett) and the Citation Style Language styles for citations; PDF.js (Mozilla) for reading PDF files; the fonts Cormorant, Cinzel, Inter and Atkinson Hyperlegible (SIL Open Font Licence). Their licences are in the vendor and fonts folders.",
      "WordNet 3.0 (Université de Princeton) pour le dictionnaire ; SCOWL (Kevin Atkinson) pour l’orthographe ; citeproc-js (Frank Bennett) et les styles Citation Style Language pour les citations ; PDF.js (Mozilla) pour lire les PDF ; les polices Cormorant, Cinzel, Inter et Atkinson Hyperlegible (licence SIL Open Font). Leurs licences sont dans les dossiers vendor et fonts.")}),
    h("hr.rule"),h("p",{style:{"text-align":"center","font-family":"var(--serif)","font-style":"italic","font-size":"1.05rem",margin:".2rem 0"},text:T("Designed and built by ","Conçu et réalisé par ")+LV.AUTHOR}),
    h("p.small.muted",{style:{"text-align":"center"},text:"© "+LV.YEAR+" "+LV.AUTHOR+T(". All rights reserved. Build ",". Tous droits réservés. Version ")+LV.BUILD+"."})]});};

/* ---------- Display, in rooms ---------- */
UI.settings=function(room){var S=LV.S,body=h("div"),rooms=h("div.seg",{role:"tablist",style:{margin:"0 0 .4rem"}}),line=h("p.roomline"),box=h("div"),find=h("input.findset",{type:"search",placeholder:T("Find a setting…","Trouver un réglage…"),"aria-label":T("Find a setting","Trouver un réglage")});
  var all=false;body.appendChild(find);body.appendChild(rooms);body.appendChild(line);body.appendChild(box);
  function opt(ico,label,ctl,tip,words){return {ico:ico,label:label,ctl:ctl,tip:tip,words:LV.fold(label+" "+(tip||"")+" "+(words||""))};}
  function seg(k,opts,after){return function(){return UI.seg(opts,S[k],function(v){var val=v==="true"?true:v==="false"?false:/^\d+$/.test(v)?+v:v;LV.set(k,val);if(after)after(val);},"");};}
  function sw(k,lab,after){return function(){var c=h("input",{type:"checkbox",checked:!!S[k],on:{change:function(){LV.set(k,c.checked);if(after)after(c.checked);}}});return h("label.switch",null,[c,h("span.track",{"aria-hidden":"true"}),lab]);};}
  function rerender(){UI.bar();UI.render();}
  var R={
    look:{name:T("Look","Apparence"),line:T("How Clavis looks: day or night, raised or flat, and its language.","L’apparence de Clavis : jour ou nuit, en relief ou à plat, et sa langue."),opts:[
      opt("🌗",T("Dress","Ambiance"),seg("dress",[["day",T("☀ Day","☀ Jour")],["dusk",T("◖ Dusk","◖ Crépuscule")],["night",T("☾ Night","☾ Nuit")],["auto",T("Auto","Auto")]]),T("Day is white paper and green ink. Dusk dims the paper for the evening. Night is dark green with light ink. Auto follows this device.","Jour : papier blanc et encre verte. Crépuscule : le papier s’assombrit pour le soir. Nuit : vert sombre et encre claire. Auto suit cet appareil."),"theme dark light mode sombre clair"),
      opt("🧱",T("Depth","Relief"),seg("depth",[["raised",T("Raised","En relief")],["flat",T("Flat","À plat")]]),T("Raised gives every key and card its small shadow, so the page has depth to hold onto. Flat lays them down with a fine line.","En relief donne à chaque touche et carte sa petite ombre, pour que la page ait de la profondeur. À plat les couche avec un trait fin."),"shadow ombre"),
      opt("🌍",T("Language","Langue"),seg("lang",[["en","English"],["fr","Français"]],rerender),T("Clavis’s own words. The encyclopaedia’s language is chosen under Search.","Les mots de Clavis. La langue de l’encyclopédie se choisit sous Recherche."),"english french anglais francais"),
      opt("🔗",T("Links","Liens"),seg("links",[["plain",T("Plain","Simples")],["underline",T("Underlined","Soulignés")]]),T("Underlined makes every link stand out from the words around it.","Soulignés fait ressortir chaque lien des mots qui l’entourent."),"underline souligne")]},
    reading:{name:T("Reading","Lecture"),line:T("The size, spacing and letters of everything you read here.","La taille, l’espacement et les lettres de tout ce que vous lisez ici."),opts:[
      opt("🔠",T("Text size","Taille du texte"),seg("text",[["s",T("Smaller","Plus petit")],["m",T("Standard","Standard")],["l",T("Larger","Plus grand")],["xl",T("Largest","Le plus grand")]]),T("Everything grows or shrinks together, the keys too.","Tout grandit ou rapetisse ensemble, les touches aussi."),"font size zoom police"),
      opt("↕",T("Line spacing","Interligne"),seg("gap",[["normal",T("Standard","Standard")],["roomy",T("Roomy","Aéré")]]),T("Roomy opens the lines and the letters a little, which many find easier to follow.","Aéré ouvre un peu les lignes et les lettres, ce que beaucoup trouvent plus facile à suivre."),"spacing espacement"),
      opt("🔤",T("Reading letters","Lettres de lecture"),seg("font",[["family",T("Family","Famille")],["legible",T("Hyperlegible","Hyperlisible")],["book",T("Book","Livre")]]),T("Hyperlegible is Atkinson Hyperlegible, drawn so that letters like I, l and 1 never look alike. Book is a serif for long reading.","Hyperlisible est l’Atkinson Hyperlegible, dessinée pour que des lettres comme I, l et 1 ne se ressemblent jamais. Livre est un empattement pour les longues lectures."),"dyslexia dyslexie font atkinson"),
      opt("📏",T("Reading ruler","Règle de lecture"),sw("ruler",T("A soft band follows the line you are reading","Une bande douce suit la ligne que vous lisez")),T("In the reader only. It moves with the pointer.","Dans le lecteur seulement. Elle suit le pointeur."),"ruler line focus regle"),
      opt("✂",T("Snippets","Extraits"),seg("snippets",[["full",T("Full","Complets")],["short",T("Two lines","Deux lignes")]]),T("Two lines keeps each result short, so a page of results is quicker to take in.","Deux lignes garde chaque résultat court, pour qu’une page de résultats se lise plus vite."),"summary"),
      opt("🖼",T("Pictures beside results","Images à côté des résultats"),sw("thumbs",T("Show a small picture where a source gives one","Montrer une petite image quand la source en donne une")),T("Turning them off makes the results page quieter.","Les désactiver rend la page de résultats plus calme."),"thumbnail image")]},
    calm:{name:T("Calm and focus","Calme et concentration"),line:T("Fewer things at once, less movement, and help keeping hold of what you came for.","Moins de choses à la fois, moins de mouvement, et de l’aide pour garder ce que vous cherchiez."),opts:[
      opt("🌊",T("Motion","Mouvement"),seg("motion",[["full",T("Full","Complet")],["calm",T("Calm","Calme")],["still",T("Still","Immobile")]]),T("Calm slows every movement; Still stops it altogether. This device’s own “reduce motion” is always followed.","Calme ralentit chaque mouvement ; Immobile l’arrête. Le réglage « réduire les animations » de cet appareil est toujours suivi."),"animation reduce motion"),
      opt("🍃",T("Calm results","Résultats calmes"),sw("calmResults",T("Five results to a page, two lines each, no pictures","Cinq résultats par page, deux lignes chacun, sans images")),T("For the days when a full page is too much.","Pour les jours où une page pleine est de trop."),"quiet low energy"),
      opt("🔢",T("Results to a page","Résultats par page"),seg("perPage",[[5,"5"],[10,"10"],[20,"20"]],function(){LV.search.forget();}),T("Pages are numbered and never scroll on without end.","Les pages sont numérotées et ne défilent jamais sans fin."),"page count"),
      opt("🎯",T("What you came for","Ce que vous cherchiez"),sw("pinQuestion",T("Keep the question you started with in view","Garder en vue la question de départ")),T("Your first search becomes the question at the top of the results; change it, or mark it found.","Votre première recherche devient la question en haut des résultats ; modifiez-la, ou marquez-la trouvée."),"intention goal question"),
      opt("⌛",T("Time check","Point sur le temps"),seg("timeCheck",[[0,T("Off","Non")],[15,"15 min"],[25,"25 min"],[45,"45 min"]]),T("A gentle card after this long of searching, asking whether you found it, with a way to put the rest aside.","Une carte douce après ce temps de recherche, pour demander si vous avez trouvé, avec un moyen de mettre le reste de côté."),"timer rabbit hole clepsydra"),
      opt("🚪",T("The welcome card","La carte d’accueil"),sw("door",T("Open with the welcome card","Ouvrir avec la carte d’accueil")),T("Off opens straight to the search.","Désactivée, l’app s’ouvre directement sur la recherche."),"door welcome")]},
    search:{name:T("Search","Recherche"),line:T("Which sources are asked, and in what language.","Quelles sources sont interrogées, et en quelle langue."),opts:[
      opt("📖",T("Encyclopaedia language","Langue de l’encyclopédie"),function(){var s=h("select.field",{style:{width:"auto"},on:{change:function(){LV.set("wikiLang",s.value);LV.search.forget();}}},[["auto",T("Same as Clavis","Comme Clavis")],["en","English"],["fr","Français"],["de","Deutsch"],["es","Español"],["it","Italiano"],["pt","Português"],["nl","Nederlands"],["pl","Polski"],["sv","Svenska"],["ja","日本語"],["zh","中文"],["ar","العربية"],["ru","Русский"]].map(function(o){return h("option",{value:o[0],selected:S.wikiLang===o[0],text:o[1]});}));return s;},T("Wikipedia, its pictures and its facts come in this language.","Wikipédia, ses images et ses faits viennent dans cette langue."),"wikipedia language langue"),
      opt("🛡",T("Safe search","Recherche sûre"),sw("safe",T("Leave out explicit pictures and pages where a source allows it","Écarter les images et pages explicites quand une source le permet"),function(){LV.search.forget();}),"",T("adult explicit","adulte explicite")),
      opt("🗂",T("Tabs on the results","Onglets des résultats"),function(){var g=h("div.srcs");LV.search.TABS.everyday.filter(function(t){return t.id!=="all"&&t.id!=="library";}).forEach(function(t){var c=h("input",{type:"checkbox",checked:S.tabs.indexOf(t.id)>=0,on:{change:function(){var l=S.tabs.filter(function(x){return x!==t.id;});if(c.checked)l.push(t.id);LV.set("tabs",["all"].concat(l.filter(function(x){return x!=="all";})));}}});g.appendChild(h("label",null,[c,h("span",{text:t.ico+" "+T(t.name[0],t.name[1])})]));});return g;},T("The rest stay under More…, one press away.","Les autres restent sous Plus…, à une pression."),"tabs onglets"),
      opt("💬",T("Questions and answers from","Questions et réponses de"),function(){var s=h("select.field",{style:{width:"auto"},on:{change:function(){LV.set("seSite",s.value);LV.search.forget();}}},Object.keys(LV.web.seSites).map(function(k){return h("option",{value:k,selected:S.seSite===k,text:LV.web.seSites[k]});}));return s;},T("The Stack Exchange community the Q&A tab asks.","La communauté Stack Exchange qu’interroge l’onglet Q&R."),"stack exchange"),
      opt("🌐",T("Everyday sources","Sources du quotidien"),function(){return srcList(LV.web.sources);},T("A source switched off is never asked. Each is a public index that answers your browser directly.","Une source désactivée n’est jamais interrogée. Chacune est un index public qui répond directement à votre navigateur."),"sources marginalia wikipedia openverse"),
      opt("🎓",T("Scholarly sources","Sources savantes"),function(){return srcList(LV.scholar.sources);},"",T("sources openalex crossref pubmed doaj","sources openalex crossref pubmed doaj")),
      opt("🔑",T("Keys of your own (optional)","Vos propres clés (facultatif)"),function(){var mk=h("input.field",{type:"text",value:S.marginaliaKey,placeholder:T("Marginalia key (free by e-mail; “public” is used without one)","Clé Marginalia (gratuite par e-mail ; « public » sinon)"),autocomplete:"off"}),
        ok=h("input.field",{type:"text",value:S.openalexKey,placeholder:T("OpenAlex key (free at openalex.org)","Clé OpenAlex (gratuite sur openalex.org)"),autocomplete:"off"}),em=h("input.field",{type:"email",value:S.mailto,placeholder:T("An e-mail for the scholarly indexes’ polite queue (optional)","Un e-mail pour la file prioritaire des index savants (facultatif)"),autocomplete:"off"});
        [[mk,"marginaliaKey"],[ok,"openalexKey"],[em,"mailto"]].forEach(function(p){p[0].addEventListener("change",function(){LV.set(p[1],p[0].value.trim());LV.search.forget();});});
        return h("div",{style:{display:"grid",gap:".45rem"}},[mk,ok,em]);},T("Each stays on this device and is sent only to its own source. Crossref, OpenAlex and PubMed answer faster when they know an e-mail to write to.","Chacune reste sur cet appareil et n’est envoyée qu’à sa propre source. Crossref, OpenAlex et PubMed répondent plus vite quand ils ont un e-mail."),"api key cle email")]},
    data:{name:T("Your data","Vos données"),line:T("What this device keeps, and how to take it with you or let it go.","Ce que cet appareil garde, et comment l’emporter ou le laisser partir."),opts:[
      opt("🕘",T("History","Historique"),sw("history",T("Write down each search and page, on this device only","Noter chaque recherche et page, sur cet appareil seulement")),T("History is what lets you retrace a long search. Paused, nothing new is written.","L’historique permet de retracer une longue recherche. En pause, rien de nouveau n’est noté."),"history privacy"),
      opt("📦",T("Your library","Votre bibliothèque"),function(){return h("div",{style:{display:"flex",gap:".4rem","flex-wrap":"wrap"}},[UI.key(T("Export","Exporter"),function(){LV.download("clavis-library-"+new Date().toISOString().slice(0,10)+".json",LV.lib.exportJSON(),"application/json");},"small"),
        UI.key(T("Open the library","Ouvrir la bibliothèque"),function(){UI.closeSheet();LV.go("library");},"small")]);},T("The export is one file holding everything you keep, with notes and shelves. Import it on another device from the library.","L’export est un seul fichier avec tout ce que vous gardez, notes et étagères comprises. Importez-le sur un autre appareil depuis la bibliothèque."),"export backup sauvegarde"),
      opt("💾",T("Storage","Stockage"),function(){var p=h("span.small.muted",{text:"…"});LV.usage().then(function(u){p.textContent=u?LV.bytes(u.usage)+(u.quota?" / "+LV.bytes(u.quota):""):"–";});
        return h("div",{style:{display:"flex",gap:".5rem","align-items":"center","flex-wrap":"wrap"}},[p,UI.key(T("Ask to keep it safe","Demander de le protéger"),function(){LV.persist().then(function(ok){LV.toast(ok?T("This browser will keep Clavis’s library even when space runs low.","Ce navigateur gardera la bibliothèque de Clavis même quand l’espace manque."):T("This browser decides for itself; installing Clavis as an app usually helps.","Ce navigateur décide lui-même ; installer Clavis comme app aide en général."));});},"small")]);},
        T("Browsers may clear a site’s storage when space is short, unless asked not to.","Les navigateurs peuvent vider le stockage d’un site quand l’espace manque, sauf si on le leur demande."),"quota persist"),
      opt("🧹",T("Answers kept from searches","Réponses gardées des recherches"),function(){return UI.key(T("Clear them","Les effacer"),function(){LV.db.clear("cache").then(function(){LV.search.forget();LV.index.dirty=true;LV.toast(T("Cleared. Your library is untouched.","Effacées. Votre bibliothèque est intacte."));});},"small");},T("These let a search come back with no connection. Clearing them leaves your library as it is.","Elles permettent à une recherche de revenir sans connexion. Les effacer laisse votre bibliothèque telle quelle."),"cache"),
      opt("🔄",T("Refresh","Actualiser"),function(){return UI.key(T("Refresh the app","Actualiser l’app"),function(){location.reload();},"small");},T("If the app glitches or stops answering. Your library, settings and history are kept.","Si l’app se fige ou ne répond plus. Votre bibliothèque, vos réglages et votre historique sont gardés."),"reload glitch"),
      opt("⚠",T("Start again","Tout recommencer"),function(){var k=UI.key(T("Erase everything on this device","Tout effacer sur cet appareil"),function(){if(k.dataset.sure!=="1"){k.dataset.sure="1";k.textContent=T("Erase everything? Press again","Tout effacer ? Appuyez encore");return;}
        Promise.all(["items","cache","history","later","meta"].map(function(s){return LV.db.clear(s);})).then(function(){try{localStorage.removeItem("clavis_settings");}catch(e){}location.reload();});},"small ghost");return k;},
        T("Your library, history and settings are erased. Export first if you want to keep anything.","Votre bibliothèque, votre historique et vos réglages sont effacés. Exportez d’abord si vous voulez garder quelque chose."),"reset erase delete")]}};
  function srcList(map){var g=h("div.srcs");Object.keys(map).forEach(function(k){var s=map[k],c=h("input",{type:"checkbox",checked:S.src[k]!==false,on:{change:function(){S.src[k]=c.checked;LV.save();LV.search.forget();}}});
    g.appendChild(h("label",null,[c,h("span",null,[s.name,h("small",{text:T(s.about[0],s.about[1])})])]));});return g;}
  var keys=Object.keys(R);room=room&&R[room]?room:"look";
  keys.forEach(function(k){rooms.appendChild(h("button.key.small",{type:"button",role:"tab","aria-selected":k===room?"true":"false","aria-pressed":k===room?"true":"false",on:{click:function(){room=k;all=false;find.value="";draw();}}},R[k].name));});
  var allKey=UI.key(T("Every setting at once","Tous les réglages"),function(){all=!all;draw();},"small ghost",{id:"set-all"});rooms.appendChild(allKey);
  function row(o){return h("div.opt",null,[h("div.ol",null,[h("span.e",{"aria-hidden":"true",text:o.ico}),o.label]),o.ctl(),o.tip?h("p.tip",{text:o.tip}):null]);}
  function draw(){LV.clear(box);var f=LV.fold(find.value.trim());LV.qsa('[role="tab"]',rooms).forEach(function(b,i){var on=!f&&!all&&keys[i]===room;b.setAttribute("aria-selected",on?"true":"false");b.setAttribute("aria-pressed",on?"true":"false");});
    allKey.setAttribute("aria-pressed",all?"true":"false");
    if(f){line.textContent=T("Settings that match.","Réglages correspondants.");var n=0;keys.forEach(function(k){R[k].opts.forEach(function(o){if(o.words.indexOf(f)>=0){box.appendChild(row(o));n++;}});});if(!n)box.appendChild(h("p.muted",{text:T("No setting has those words.","Aucun réglage n’a ces mots.")}));return;}
    if(all){line.textContent=T("Every setting, room by room.","Tous les réglages, salle par salle.");keys.forEach(function(k){box.appendChild(h("div.eyebrow",{style:{margin:"1rem 0 .2rem"},text:R[k].name}));R[k].opts.forEach(function(o){box.appendChild(row(o));});});return;}
    line.textContent=R[room].line;R[room].opts.forEach(function(o){box.appendChild(row(o));});}
  find.addEventListener("input",draw);draw();
  UI.sheet({title:T("Display and settings","Affichage et réglages"),body:body,focus:".findset",onClose:function(){if(LV.route().path==="search")UI.render();}});};
})();
