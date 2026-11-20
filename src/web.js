/* CLAVIS · THE EVERYDAY SOURCES. Each is a public index that answers a browser directly and runs no AI on what it
   gives back: Marginalia (an independent, non-commercial index of the open web), Wikipedia and Wikidata, Wiktionary,
   DuckDuckGo's instant answers, Open Library, the Internet Archive, Openverse and Wikimedia Commons for pictures,
   OpenStreetMap for places, GDELT and Hacker News for news, Stack Exchange for questions and answers, and GitHub for code.
   Every result says where it came from and what kind of source that is, in Ingenium's words. */
(function(){
"use strict";
var LV=window.LV,T=LV.T,W=LV.web={};
var UA={"Api-User-Agent":"Clavis/"+LV.VERSION+" (The Offline Project; offline search app)"};

/* what kind of source a web address is (Ingenium's labels, so the family speaks with one voice) */
var KINDS=[
  [/(^|\.)(gov|gov\.[a-z]{2}|gouv\.fr|europa\.eu|who\.int|un\.org|oecd\.org|worldbank\.org|nih\.gov|nhs\.uk|service-public\.fr)$/,["Government or international body","Administration ou organisme international"],"high"],
  [/(^|\.)(jstor\.org|springer\.com|sciencedirect\.com|wiley\.com|tandfonline\.com|cambridge\.org|oup\.com|sagepub\.com|nature\.com|science\.org|plos\.org|frontiersin\.org|muse\.jhu\.edu|degruyter\.com|brill\.com|annualreviews\.org|ncbi\.nlm\.nih\.gov|europepmc\.org|doi\.org|openedition\.org|cairn\.info|persee\.fr|erudit\.org|scielo\.org|doaj\.org)$/,["Scholarly publisher or index","Éditeur ou index scientifique"],"high"],
  [/(^|\.)(edu|ac\.[a-z]{2}|edu\.[a-z]{2}|univ-[a-z-]+\.fr)$/,["University","Université"],"medium"],
  [/(^|\.)mdpi\.com$/,["Scholarly publisher (check the journal: quality varies)","Éditeur scientifique (vérifiez la revue : qualité variable)"],"medium"],
  [/(^|\.)(arxiv\.org|ssrn\.com|biorxiv\.org|medrxiv\.org|osf\.io|zenodo\.org|hal\.science|hal\.archives-ouvertes\.fr)$/,["Preprint or repository (not peer-reviewed)","Prépublication ou archive (non évaluée par les pairs)"],"low"],
  [/(^|\.)(researchgate\.net|academia\.edu)$/,["A shared copy (check the published version)","Une copie partagée (vérifiez la version publiée)"],"low"],
  [/(^|\.)plato\.stanford\.edu$/,["Encyclopaedia (peer-reviewed)","Encyclopédie (évaluée par les pairs)"],"medium"],
  [/(^|\.)(wikipedia\.org|britannica\.com|iep\.utm\.edu|larousse\.fr|universalis\.fr)$/,["Encyclopaedia (background, not evidence)","Encyclopédie (contexte, pas une preuve)"],"low"],
  [/(^|\.)(wiktionary\.org|merriam-webster\.com|oed\.com|cnrtl\.fr|collinsdictionary\.com)$/,["Dictionary","Dictionnaire"],"medium"],
  [/(^|\.)(bbc\.co\.uk|bbc\.com|nytimes\.com|theguardian\.com|reuters\.com|apnews\.com|ft\.com|economist\.com|washingtonpost\.com|lemonde\.fr|npr\.org|aljazeera\.com|lefigaro\.fr|liberation\.fr)$/,["News","Presse"],"low"],
  [/(^|\.)(stackoverflow\.com|stackexchange\.com|superuser\.com|serverfault\.com|askubuntu\.com|mathoverflow\.net)$/,["Questions and answers (community)","Questions et réponses (communauté)"],"low"],
  [/(^|\.)(github\.com|gitlab\.com|codeberg\.org)$/,["Code","Code"],"low"],
  [/(^|\.)(archive\.org)$/,["Library and archive","Bibliothèque et archives"],"medium"],
  [/(^|\.)(openstreetmap\.org)$/,["Map","Carte"],"medium"],
  [/(^|\.)(reddit\.com|x\.com|twitter\.com|facebook\.com|instagram\.com|tiktok\.com|youtube\.com|quora\.com|medium\.com|substack\.com)$/,["Social or personal (opinion)","Réseau social ou page personnelle (opinion)"],"low"]];
W.kind=function(url){var h=LV.host(url);for(var i=0;i<KINDS.length;i++)if(KINDS[i][0].test(h))return {label:T(KINDS[i][1][0],KINDS[i][1][1]),trust:KINDS[i][2]};
  return {label:T("Website (unvetted)","Site web (non vérifié)"),trust:"low"};};

function res(o){o.kind=o.kind||"web";o.url=LV.safeUrl(o.url);o.id=o.id||("u:"+o.url);o.title=LV.text(o.title)||o.url;o.snippet=LV.text(o.snippet||"");
  if(!o.vet)o.vet=W.kind(o.url);return o;}

/* ---------- the sources ---------- */
var SRC=W.sources={};
function def(id,o){o.id=id;SRC[id]=o;}

def("marginalia",{name:"Marginalia",about:["An independent, non-commercial index of the open web, without ads and without AI. Its shared key is busy; a free key of your own (by e-mail) makes it steady.","Un index indépendant et non commercial du web ouvert, sans publicité et sans IA. Sa clé partagée est très demandée ; une clé gratuite à votre nom (par e-mail) la rend régulière."],
  tabs:["all","web"],run:function(q,o){var key=LV.S.marginaliaKey||"public",n=o.n||10;
    return LV.fetch("https://api2.marginalia-search.com/search?query="+encodeURIComponent(q)+"&count="+n+"&page="+(o.page||1)+"&dc=2"+(LV.S.safe?"&nsfw=1":""),{name:"Marginalia",headers:{"API-Key":key},timeout:12000})
      .then(function(d){return {items:(d&&d.results||[]).map(function(r){return res({src:"marginalia",title:r.title,url:r.url,snippet:r.description});})};});}});

def("wikipedia",{name:"Wikipedia",about:["The free encyclopaedia: background to begin from, not evidence to end on.","L’encyclopédie libre : un contexte pour commencer, pas une preuve pour conclure."],
  tabs:["all","web","wikipedia"],run:function(q,o){var lang=LV.wikiLang(),n=o.n||10,off=((o.page||1)-1)*n;
    var u="https://"+lang+".wikipedia.org/w/api.php?action=query&format=json&formatversion=2&origin=*&generator=search&gsrsearch="+encodeURIComponent(q)+"&gsrlimit="+n+"&gsroffset="+off+
      "&gsrinfo=totalhits%7Csuggestion&gsrwhat=text&prop=pageimages%7Cdescription%7Cextracts%7Cinfo&inprop=url&piprop=thumbnail&pithumbsize=200&exintro=1&explaintext=1&exsentences=2&exlimit="+n;
    return LV.fetch(u,{name:"Wikipedia",headers:UA}).then(function(d){var pages=(d&&d.query&&d.query.pages)||[];pages.sort(function(a,b){return (a.index||0)-(b.index||0);});
      var info=(d&&d.query&&d.query.searchinfo)||{};
      return {total:info.totalhits,suggestion:info.suggestion||"",items:pages.map(function(p){return res({src:"wikipedia",title:p.title,url:p.fullurl||("https://"+lang+".wikipedia.org/wiki/"+encodeURIComponent(p.title.replace(/ /g,"_"))),
        snippet:(p.description?p.description+". ":"")+(p.extract||""),thumb:p.thumbnail&&p.thumbnail.source,wiki:{lang:lang,title:p.title}});})};});}});

def("ddg",{name:"DuckDuckGo",about:["DuckDuckGo’s instant answers: a short abstract, a definition or a fact, from its own sources.","Les réponses instantanées de DuckDuckGo : un résumé, une définition ou un fait, de ses propres sources."],
  tabs:[],run:function(q){return LV.fetch("https://api.duckduckgo.com/?q="+encodeURIComponent(q)+"&format=json&no_html=1&skip_disambig=1&t=clavis",{name:"DuckDuckGo"}).then(function(d){
    return {answer:d&&{heading:d.Heading,abstract:d.AbstractText,source:d.AbstractSource,url:d.AbstractURL,answer:d.Answer,definition:d.Definition,defSource:d.DefinitionSource,defUrl:d.DefinitionURL,image:d.Image?("https://duckduckgo.com"+d.Image):"",
      infobox:(d.Infobox&&d.Infobox.content||[]).filter(function(x){return x&&typeof x.value==="string";}).slice(0,8).map(function(x){return [x.label,x.value];})},
      items:((d&&d.Results)||[]).map(function(r){return res({src:"ddg",title:r.Text,url:r.FirstURL,snippet:""});})};});}});

def("openlibrary",{name:"Open Library",about:["The Internet Archive’s catalogue of books, with free copies to borrow where there are any.","Le catalogue de livres de l’Internet Archive, avec des exemplaires à emprunter quand il y en a."],
  tabs:["books"],run:function(q,o){var n=o.n||10;
    return LV.fetch("https://openlibrary.org/search.json?q="+encodeURIComponent(q)+"&limit="+n+"&page="+(o.page||1)+"&fields=key,title,author_name,first_publish_year,cover_i,edition_count,ebook_access,subject,isbn,publisher,language,number_of_pages_median",{name:"Open Library"})
      .then(function(d){return {total:d&&d.numFound,items:((d&&d.docs)||[]).map(function(b){return res({src:"openlibrary",kind:"book",title:b.title,url:"https://openlibrary.org"+b.key,
        snippet:[(b.author_name||[]).slice(0,3).join(", "),b.first_publish_year,b.edition_count?LV.plural(b.edition_count,"edition","editions","édition","éditions"):""].filter(Boolean).join(" · "),
        thumb:b.cover_i?("https://covers.openlibrary.org/b/id/"+b.cover_i+"-M.jpg"):"",book:{authors:b.author_name||[],year:b.first_publish_year,isbn:(b.isbn||[])[0]||"",publisher:(b.publisher||[])[0]||"",pages:b.number_of_pages_median||"",
          access:b.ebook_access||""},vet:{label:T("Book (library catalogue)","Livre (catalogue de bibliothèque)"),trust:"medium"}});})};});}});

def("archive",{name:"Internet Archive",about:["Books, films, sound and old web pages kept by the Internet Archive.","Livres, films, sons et anciennes pages web conservés par l’Internet Archive."],
  tabs:["archive","books"],run:function(q,o){var n=o.n||10;
    return LV.fetch("https://archive.org/advancedsearch.php?q="+encodeURIComponent(q)+"&fl%5B%5D=identifier&fl%5B%5D=title&fl%5B%5D=description&fl%5B%5D=mediatype&fl%5B%5D=year&fl%5B%5D=creator&rows="+n+"&page="+(o.page||1)+"&output=json",{name:"Internet Archive"})
      .then(function(d){var r=(d&&d.response)||{};return {total:r.numFound,items:(r.docs||[]).map(function(x){var desc=Array.isArray(x.description)?x.description.join(" "):x.description;
        return res({src:"archive",title:Array.isArray(x.title)?x.title[0]:x.title,url:"https://archive.org/details/"+x.identifier,snippet:[x.mediatype,x.year,Array.isArray(x.creator)?x.creator.join(", "):x.creator].filter(Boolean).join(" · ")+(desc?" — "+LV.trunc(LV.text(desc),220):""),
          thumb:"https://archive.org/services/img/"+x.identifier,vet:{label:T("Library and archive","Bibliothèque et archives"),trust:"medium"}});})};});}});

def("openverse",{name:"Openverse",about:["Openly licensed pictures from museums, libraries and photographers, with the licence named on each.","Des images sous licence libre de musées, bibliothèques et photographes, avec la licence de chacune."],
  tabs:["images"],run:function(q,o){var n=o.n||20;
    return LV.fetch("https://api.openverse.org/v1/images/?q="+encodeURIComponent(q)+"&page_size="+n+"&page="+(o.page||1)+(LV.S.safe?"&mature=false":""),{name:"Openverse"}).then(function(d){
      return {total:d&&d.result_count,items:((d&&d.results)||[]).map(function(x){return res({src:"openverse",kind:"image",title:x.title||T("Untitled","Sans titre"),url:x.foreign_landing_url||x.url,
        thumb:x.thumbnail||x.url,full:x.url,snippet:[x.creator,(x.license||"").toUpperCase()+(x.license_version?" "+x.license_version:"")].filter(Boolean).join(" · "),
        vet:{label:T("Openly licensed picture","Image sous licence libre"),trust:"medium"}});})};});}});

def("commons",{name:"Wikimedia Commons",about:["The free picture library behind Wikipedia.","La photothèque libre derrière Wikipédia."],
  tabs:["images"],run:function(q,o){var n=o.n||20,off=((o.page||1)-1)*n;
    return LV.fetch("https://commons.wikimedia.org/w/api.php?action=query&format=json&formatversion=2&origin=*&generator=search&gsrsearch="+encodeURIComponent("filetype:bitmap "+q)+"&gsrnamespace=6&gsrlimit="+n+"&gsroffset="+off+
      "&prop=imageinfo&iiprop=url%7Cextmetadata&iiurlwidth=320&iiextmetadatafilter=ImageDescription%7CArtist%7CLicenseShortName",{name:"Commons",headers:UA}).then(function(d){
      var pages=(d&&d.query&&d.query.pages)||[];pages.sort(function(a,b){return (a.index||0)-(b.index||0);});
      return {items:pages.filter(function(p){return p.imageinfo&&p.imageinfo[0];}).map(function(p){var ii=p.imageinfo[0],m=ii.extmetadata||{};
        return res({src:"commons",kind:"image",title:p.title.replace(/^File:/,"").replace(/\.[a-z]+$/i,""),url:ii.descriptionurl,thumb:ii.thumburl,full:ii.url,
          snippet:[LV.text(m.Artist&&m.Artist.value),m.LicenseShortName&&m.LicenseShortName.value].filter(Boolean).join(" · "),vet:{label:T("Openly licensed picture","Image sous licence libre"),trust:"medium"}});})};});}});

def("osm",{name:"OpenStreetMap",about:["The free map of the world, drawn by the people who live in it (searched by Nominatim).","La carte libre du monde, dessinée par ceux qui y vivent (cherchée par Nominatim)."],
  tabs:["places"],run:function(q,o){return LV.fetch("https://nominatim.openstreetmap.org/search?q="+encodeURIComponent(q)+"&format=jsonv2&limit="+(o.n||8)+"&addressdetails=0&extratags=1&accept-language="+LV.lang(),{name:"OpenStreetMap"})
    .then(function(d){return {items:(d||[]).map(function(p){var lat=+p.lat,lon=+p.lon;
      return res({src:"osm",kind:"place",title:p.name||p.display_name.split(",")[0],url:"https://www.openstreetmap.org/"+p.osm_type+"/"+p.osm_id,snippet:p.display_name,
        place:{lat:lat,lon:lon,bbox:p.boundingbox,type:(p.type||"").replace(/_/g," "),cat:p.category,web:p.extratags&&p.extratags.website,wiki:p.extratags&&p.extratags.wikipedia},
        vet:{label:T("Map","Carte"),trust:"medium"}});})};});}});

def("gdelt",{name:"GDELT",about:["An open index of news articles from around the world (it asks for one search every few seconds).","Un index ouvert d’articles de presse du monde entier (il demande une recherche toutes les quelques secondes)."],
  tabs:["news"],run:function(q,o){return LV.fetch("https://api.gdeltproject.org/api/v2/doc/doc?query="+encodeURIComponent(q.length<4?q+" news":q)+"&mode=artlist&format=json&sort=datedesc&maxrecords="+(o.n||15)+"&timespan=3months",{name:"GDELT",timeout:15000})
    .then(function(d){return {items:((d&&d.articles)||[]).filter(function(a){return !LV.S.safe||!/porn|xxx/i.test(a.url);}).map(function(a){var dt=a.seendate?a.seendate.replace(/^(\d{4})(\d\d)(\d\d)T(\d\d)(\d\d).*/,"$1-$2-$3T$4:$5:00Z"):"";
      return res({src:"gdelt",kind:"news",title:a.title,url:a.url,snippet:[a.domain,a.sourcecountry,a.language].filter(Boolean).join(" · "),date:dt,thumb:a.socialimage,vet:{label:T("News","Presse"),trust:"low"}});})};});}});

def("hn",{name:"Hacker News",about:["Links and discussions about technology and science, gathered by Hacker News.","Liens et discussions sur la technologie et les sciences, réunis par Hacker News."],
  tabs:["news"],run:function(q,o){return LV.fetch("https://hn.algolia.com/api/v1/search?query="+encodeURIComponent(q)+"&tags=story&hitsPerPage="+(o.n||10)+"&page="+((o.page||1)-1),{name:"Hacker News"})
    .then(function(d){return {total:d&&d.nbHits,items:((d&&d.hits)||[]).map(function(h){var disc="https://news.ycombinator.com/item?id="+h.objectID;
      return res({src:"hn",kind:"news",title:h.title,url:h.url||disc,snippet:LV.plural(h.points||0,"point","points","point","points")+" · "+LV.plural(h.num_comments||0,"comment","comments","commentaire","commentaires"),
        date:h.created_at,also:{label:T("Discussion","Discussion"),url:disc},vet:{label:T("Link shared on Hacker News","Lien partagé sur Hacker News"),trust:"low"}});})};});}});

var SE_SITES={stackoverflow:"Stack Overflow",superuser:"Super User",askubuntu:"Ask Ubuntu",serverfault:"Server Fault",math:"Mathematics",stats:"Cross Validated (statistics)",english:"English Language",
  french:"French Language",writing:"Writing",academia:"Academia",cooking:"Seasoned Advice (cooking)",diy:"Home Improvement",money:"Personal Finance",health:"Medical Sciences",psychology:"Psychology & Neuroscience",
  biology:"Biology",physics:"Physics",chemistry:"Chemistry",history:"History",philosophy:"Philosophy",gardening:"Gardening",travel:"Travel",apple:"Ask Different (Apple)",android:"Android"};
W.seSites=SE_SITES;
def("stackexchange",{name:"Stack Exchange",about:["Questions answered by people, with the answers voted up or down (choose the community in Settings).","Des questions auxquelles des personnes ont répondu, les réponses notées (choisissez la communauté dans Réglages)."],
  tabs:["qa"],run:function(q,o){var site=LV.S.seSite||"stackoverflow";
    return LV.fetch("https://api.stackexchange.com/2.3/search/advanced?order=desc&sort=relevance&q="+encodeURIComponent(q)+"&site="+encodeURIComponent(site)+"&pagesize="+(o.n||10)+"&page="+(o.page||1)+"&filter=default",{name:"Stack Exchange"})
      .then(function(d){return {total:d&&d.total,items:((d&&d.items)||[]).map(function(x){
        return res({src:"stackexchange",kind:"qa",title:x.title,url:x.link,snippet:(x.is_answered?T("Answered","Résolue"):T("Not answered yet","Pas encore résolue"))+(x.accepted_answer_id?" ✓ "+T("an answer was accepted","une réponse a été acceptée"):"")+" · "+
          LV.plural(x.answer_count||0,"answer","answers","réponse","réponses")+" · "+LV.plural(x.score||0,"vote","votes","vote","votes")+((x.tags||[]).length?" · "+x.tags.slice(0,4).join(", "):""),
          date:x.creation_date?new Date(x.creation_date*1000).toISOString():"",vet:{label:SE_SITES[site]||site,trust:x.accepted_answer_id?"medium":"low"}});})};});}});

def("github",{name:"GitHub",about:["Public code on GitHub (ten searches a minute without an account).","Le code public de GitHub (dix recherches par minute sans compte)."],
  tabs:["code"],run:function(q,o){return LV.fetch("https://api.github.com/search/repositories?q="+encodeURIComponent(q)+"&per_page="+(o.n||10)+"&page="+(o.page||1),{name:"GitHub",headers:{"Accept":"application/vnd.github+json"}})
    .then(function(d){return {total:d&&d.total_count,items:((d&&d.items)||[]).map(function(r){
      return res({src:"github",kind:"code",title:r.full_name,url:r.html_url,snippet:(r.description||"")+" · ★ "+LV.num(r.stargazers_count||0)+(r.language?" · "+r.language:"")+(r.license&&r.license.spdx_id&&r.license.spdx_id!=="NOASSERTION"?" · "+r.license.spdx_id:""),
        date:r.pushed_at,vet:{label:T("Code","Code"),trust:"low"}});})};});}});

def("wiktionary",{name:"Wiktionary",about:["The free dictionary, with every sense, in many languages.","Le dictionnaire libre, avec tous les sens, en de nombreuses langues."],
  tabs:["dictionary"],run:function(q){var w=String(q).trim().replace(/^(define|definition of|définir|définition de)\s+/i,"").trim();
    return LV.fetch("https://en.wiktionary.org/api/rest_v1/page/definition/"+encodeURIComponent(w.replace(/ /g,"_")),{name:"Wiktionary",headers:UA}).then(function(d){
      var out=[];Object.keys(d||{}).forEach(function(lang){(d[lang]||[]).forEach(function(e){out.push({lang:e.language,pos:e.partOfSpeech,defs:(e.definitions||[]).map(function(x){return LV.text(x.definition);}).filter(Boolean).slice(0,6)});});});
      var mine=LV.lang()==="fr"?"French":"English";out.sort(function(a,b){return (b.lang===mine)-(a.lang===mine)||(b.lang==="English")-(a.lang==="English");});
      return {dict:{word:w,url:"https://en.wiktionary.org/wiki/"+encodeURIComponent(w.replace(/ /g,"_")),entries:out.slice(0,8)},items:[]};});}});

/* ---------- the panel at the side: Wikipedia's summary, with a few facts from Wikidata ---------- */
var FACTS=[["P31",["Instance of","Nature"]],["P569",["Born","Naissance"]],["P570",["Died","Décès"]],["P19",["Place of birth","Lieu de naissance"]],["P27",["Citizenship","Nationalité"]],["P106",["Occupation","Profession"]],
  ["P17",["Country","Pays"]],["P36",["Capital","Capitale"]],["P1082",["Population","Population"]],["P2046",["Area","Superficie"]],["P571",["Founded","Fondation"]],["P159",["Headquarters","Siège"]],
  ["P112",["Founded by","Fondateur"]],["P50",["Author","Auteur"]],["P577",["Published","Publication"]],["P61",["Discovered or invented by","Découverte ou invention"]],["P575",["Discovered","Découverte"]],
  ["P856",["Website","Site web"]]];
W.panel=function(title){var lang=LV.wikiLang();
  return LV.fetch("https://"+lang+".wikipedia.org/api/rest_v1/page/summary/"+encodeURIComponent(title.replace(/ /g,"_"))+"?redirect=true",{name:"Wikipedia",headers:UA}).then(function(s){
    if(!s||s.type==="disambiguation"||!s.extract)return null;
    var p={title:s.title,desc:s.description||"",extract:s.extract,image:s.thumbnail&&s.thumbnail.source,url:s.content_urls&&s.content_urls.desktop&&s.content_urls.desktop.page,wikidata:s.wikibase_item,lang:lang,facts:[]};
    if(!p.wikidata||!LV.S.src.wikidata)return p;
    return W.facts(p.wikidata).then(function(f){p.facts=f;return p;},function(){return p;});});};
W.facts=function(qid){var lang=LV.lang();
  return LV.fetch("https://www.wikidata.org/w/api.php?action=wbgetentities&ids="+qid+"&props=claims&format=json&origin=*",{name:"Wikidata",headers:UA}).then(function(d){
    var c=(d&&d.entities&&d.entities[qid]&&d.entities[qid].claims)||{},rows=[],need={};
    FACTS.forEach(function(f){var cl=(c[f[0]]||[]).filter(function(x){return x.rank!=="deprecated";});if(!cl.length)return;
      var pref=cl.filter(function(x){return x.rank==="preferred";});if(pref.length)cl=pref;
      var vals=cl.slice(0,f[0]==="P106"||f[0]==="P31"?3:1).map(function(x){var v=x.mainsnak&&x.mainsnak.datavalue;if(!v)return null;
        if(v.type==="wikibase-entityid"){need[v.value.id]=1;return {ent:v.value.id};}
        if(v.type==="time"){var t=v.value.time,m=/^([+-])0*(\d+)-(\d\d)-(\d\d)/.exec(t);if(!m)return null;var y=(m[1]==="-"?"-":"")+m[2];
          var pr=v.value.precision;if(pr>=11&&m[3]!=="00")try{return {txt:new Date(Date.UTC(+y,+m[3]-1,+m[4])).toLocaleDateString(LV.loc(),{day:"numeric",month:"long",year:"numeric",timeZone:"UTC"})};}catch(e){}
          return {txt:m[1]==="-"?m[2]+T(" BC"," av. J.-C."):m[2]};}
        if(v.type==="quantity"){var a=+v.value.amount;return {txt:LV.num(a)+(f[0]==="P2046"?" km²":"")};}
        if(v.type==="string")return {txt:v.value,url:f[0]==="P856"?v.value:null};return null;}).filter(Boolean);
      if(vals.length)rows.push({label:T(f[1][0],f[1][1]),vals:vals});});
    var ids=Object.keys(need).slice(0,40);if(!ids.length)return rows;
    return LV.fetch("https://www.wikidata.org/w/api.php?action=wbgetentities&ids="+ids.join("%7C")+"&props=labels&languages="+lang+"%7Cen&format=json&origin=*",{name:"Wikidata",headers:UA}).then(function(l){
      var ents=(l&&l.entities)||{};rows.forEach(function(r){r.vals.forEach(function(v){if(v.ent){var e=ents[v.ent],lb=e&&e.labels&&(e.labels[lang]||e.labels.en);v.txt=lb?lb.value:"";}});
        r.vals=r.vals.filter(function(v){return v.txt;});});return rows.filter(function(r){return r.vals.length;});},function(){return rows.filter(function(r){return r.vals.every(function(v){return v.txt;});});});});};

/* ---------- reading a Wikipedia article here, kept clean ---------- */
var DROP=".mw-editsection,.navbox,.vertical-navbox,.navbox-styles,.metadata,.ambox,.mbox-small,.sistersitebox,.noprint,.mw-empty-elt,style,script,link,meta,.reference-text .mw-cite-backlink,.mw-jump-link,.shortdescription,#coordinates,.portalbox,.authority-control,.catlinks,.printfooter,.mw-references-wrap .mw-cite-backlink,.reflist .mw-cite-backlink,sup.noprint,.hatnote.navigation-not-searchable";
var KEEP_TAGS={P:1,A:1,B:1,STRONG:1,I:1,EM:1,U:1,SUB:1,SUP:1,BR:1,H2:1,H3:1,H4:1,H5:1,UL:1,OL:1,LI:1,DL:1,DT:1,DD:1,BLOCKQUOTE:1,TABLE:1,THEAD:1,TBODY:1,TR:1,TD:1,TH:1,CAPTION:1,
  FIGURE:1,FIGCAPTION:1,IMG:1,SPAN:1,DIV:1,CODE:1,PRE:1,ABBR:1,CITE:1,Q:1,SMALL:1,S:1,DEL:1,INS:1,MARK:1,HR:1,SECTION:1};
/* any HTML a source sends is rebuilt from a short list of plain tags; scripts, styles, frames and handlers never pass */
W.clean=function(html,base){var doc=new DOMParser().parseFromString("<body>"+String(html||"")+"</body>","text/html");
  LV.qsa(DROP,doc.body).forEach(function(n){n.remove();});
  (function walk(n){[].slice.call(n.childNodes).forEach(function(c){if(c.nodeType===3)return;if(c.nodeType!==1){c.remove();return;}
    if(!KEEP_TAGS[c.tagName]){if(/^(SCRIPT|STYLE|IFRAME|OBJECT|EMBED|FORM|INPUT|BUTTON|SELECT|TEXTAREA|SVG|MATH|NOSCRIPT|AUDIO|VIDEO|SOURCE|LINK|META)$/.test(c.tagName)){c.remove();return;}
      walk(c);while(c.firstChild)c.parentNode.insertBefore(c.firstChild,c);c.remove();return;}
    [].slice.call(c.attributes).forEach(function(a){var nm=a.name.toLowerCase();
      if(c.tagName==="A"&&nm==="href"){var hr=a.value;
        if(/^\/wiki\//.test(hr)&&base&&base.wiki){var t=decodeURIComponent(hr.slice(6).split("#")[0]);if(/^[^:]+$/.test(t)){c.setAttribute("href","#/read?wiki="+encodeURIComponent(t)+"&lang="+base.wiki);c.setAttribute("data-in","1");return;}}
        if(/^#/.test(hr))return;var u=LV.safeUrl(/^\/\//.test(hr)?"https:"+hr:/^\//.test(hr)&&base&&base.origin?base.origin+hr:hr);if(u){c.setAttribute("href",u);c.setAttribute("target","_blank");c.setAttribute("rel","noopener noreferrer");}else c.removeAttribute("href");return;}
      if(c.tagName==="IMG"&&(nm==="src"||nm==="alt"||nm==="width"||nm==="height")){if(nm==="src"){var s=LV.safeUrl(a.value);if(s)c.setAttribute("src",s);else c.removeAttribute("src");}return;}
      if((c.tagName==="TD"||c.tagName==="TH")&&(nm==="colspan"||nm==="rowspan"))return;
      if(nm==="id"&&/^(cite_note|cite_ref|[\w-]+)$/.test(a.value)&&a.value.length<80){c.setAttribute("id","w-"+a.value);return;}
      c.removeAttribute(a.name);});
    if(c.tagName==="A"&&!c.hasAttribute("data-in")&&/^#(?!\/)/.test(c.getAttribute("href")||""))c.setAttribute("href","#w-"+c.getAttribute("href").slice(1));
    if(c.tagName==="IMG"){c.setAttribute("loading","lazy");c.setAttribute("decoding","async");if(!c.getAttribute("src"))c.remove();}
    walk(c);});})(doc.body);
  return doc.body.innerHTML;};
W.article=function(title,lang){lang=lang||LV.wikiLang();
  return LV.fetch("https://"+lang+".wikipedia.org/w/api.php?action=parse&format=json&formatversion=2&origin=*&redirects=1&disableeditsection=1&disabletoc=1&prop=text%7Cdisplaytitle%7Csections%7Crevid&page="+encodeURIComponent(title),{name:"Wikipedia",headers:UA,timeout:20000})
    .then(function(d){if(!d||!d.parse)throw new Error(T("Wikipedia has no article by that name.","Wikipédia n’a pas d’article de ce nom."));var p=d.parse;
      var html=W.clean(p.text,{wiki:lang,origin:"https://"+lang+".wikipedia.org"});
      return {title:LV.text(p.displaytitle||p.title),wtitle:p.title,lang:lang,html:html,text:LV.text(html),url:"https://"+lang+".wikipedia.org/wiki/"+encodeURIComponent(p.title.replace(/ /g,"_")),
        sections:(p.sections||[]).filter(function(s){return +s.toclevel===1;}).map(function(s){return {t:LV.text(s.line),a:"w-"+s.anchor};}),revid:p.revid};});};

/* the places Clavis sends a search when you ask for another engine: each opened in its own tab, the AI parts left out
   where the engine allows it (Google's "Web" results, DuckDuckGo without AI) */
W.elsewhere=function(q,mode){var e=encodeURIComponent(q);
  if(mode==="scholarly")return [["Google Scholar","https://scholar.google.com/scholar?q="+e],["BASE","https://www.base-search.net/Search/Results?lookfor="+e],["CORE","https://core.ac.uk/search?q="+e],
    ["Semantic Scholar","https://www.semanticscholar.org/search?q="+e],["PubMed","https://pubmed.ncbi.nlm.nih.gov/?term="+e],["PhilPapers","https://philpapers.org/s/"+e],["JSTOR","https://www.jstor.org/action/doBasicSearch?Query="+e],
    ["arXiv","https://arxiv.org/search/?searchtype=all&query="+e],["HAL","https://hal.science/search/index/?q="+e],["Cairn","https://www.cairn.info/resultats_recherche.php?searchTerm="+e],["WorldCat","https://search.worldcat.org/search?q="+e]];
  return [["Google · "+T("web only, no AI","web seul, sans IA"),"https://www.google.com/search?udm=14&q="+e],["DuckDuckGo · "+T("no AI","sans IA"),"https://noai.duckduckgo.com/?q="+e],["Mojeek","https://www.mojeek.com/search?q="+e],
    ["Marginalia","https://marginalia-search.com/search?query="+e],["Startpage","https://www.startpage.com/do/search?query="+e],["Bing","https://www.bing.com/search?q="+e],
    ["Wikipedia","https://"+LV.wikiLang()+".wikipedia.org/w/index.php?search="+e],["Wayback Machine","https://web.archive.org/web/*/"+e],["OpenStreetMap","https://www.openstreetmap.org/search?query="+e]];};
})();
