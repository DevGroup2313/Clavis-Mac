/* CLAVIS · ASKING THE SOURCES. Each tab names the sources it asks. A search is asked in batches, one batch from every
   source at a time, joined into one list; page two adds the next batch after page one, so a page you have seen never
   changes under you. Each source's answer is kept in the result cache: with no connection, the same search comes back
   from the cache, and anything never seen comes from your library. */
(function(){
"use strict";
var LV=window.LV,T=LV.T,Q=LV.search={};

Q.TABS={
  everyday:[
    {id:"all",name:["All","Tout"],ico:"✦",src:["wikipedia","marginalia"],extras:true},
    {id:"web",name:["Web","Web"],ico:"🌐",src:["marginalia","wikipedia","ddg"]},
    {id:"wikipedia",name:["Encyclopaedia","Encyclopédie"],ico:"📖",src:["wikipedia"]},
    {id:"images",name:["Images","Images"],ico:"🖼",src:["openverse","commons"],layout:"images",n:20},
    {id:"books",name:["Books","Livres"],ico:"📚",src:["openlibrary"]},
    {id:"places",name:["Places","Lieux"],ico:"📍",src:["osm"],layout:"places",n:8,single:true},
    {id:"news",name:["News","Actualités"],ico:"📰",src:["gdelt","hn"]},
    {id:"qa",name:["Q&A","Q&R"],ico:"💬",src:["stackexchange"]},
    {id:"code",name:["Code","Code"],ico:"⌨",src:["github"]},
    {id:"dictionary",name:["Dictionary","Dictionnaire"],ico:"🔤",src:["wiktionary"],layout:"dictionary",single:true},
    {id:"archive",name:["Archive","Archives"],ico:"🏛",src:["archive"]},
    {id:"library",name:["Your library","Votre bibliothèque"],ico:"⌂",src:[],layout:"library"}],
  scholarly:[
    {id:"articles",name:["Articles","Articles"],ico:"📄",src:["openalex","crossref","europepmc","pubmed","doaj","s2"],scholar:true},
    {id:"books",name:["Scholarly books","Livres savants"],ico:"📚",src:["openalex","crossref","s2"],scholar:true,type:"book"},
    {id:"authors",name:["Authors","Auteurs"],ico:"👤",src:[],layout:"authors"},
    {id:"library",name:["Your library","Votre bibliothèque"],ico:"⌂",src:[],layout:"library",kind:"paper"}]};
Q.tab=function(mode,id){var l=Q.TABS[mode]||Q.TABS.everyday;for(var i=0;i<l.length;i++)if(l[i].id===id)return l[i];return l[0];};
Q.srcOn=function(id){return LV.S.src[id]!==false;};
Q.srcName=function(id){var s=LV.web.sources[id]||LV.scholar.sources[id];return s?s.name:id;};

/* ---------- a stream: the batches of one search ---------- */
var STREAMS=new Map();
var FRESH=6*36e5;  /* a source's answer is asked again after six hours */
function ask(mode,src,q,f,page,n){var key=LV.cache.key(["r",mode,src,q,f||{},page,n,LV.wikiLang()]);
  var run=function(){var s=mode==="scholarly"?LV.scholar.sources[src]:LV.web.sources[src];
    return (mode==="scholarly"?s.run(q,f||{},page,n):s.run(q,{page:page,n:n,f:f})).then(function(r){
      /* what is kept in the cache is the answer itself, small, without the parts that only make sense this minute */
      if(!r.gap)LV.cache.put(key,{items:(r.items||[]).map(slim),total:r.total,suggestion:r.suggestion,answer:r.answer,dict:r.dict},{q:q,src:src});return r;});};
  return LV.cache.get(key).then(function(hit){
    if(hit&&(Date.now()-hit.at<FRESH||!LV.online()))return Object.assign({cached:true,at:hit.at},hit.data);
    if(!LV.online()){var e=new Error("offline");e.offline=true;throw e;}
    return run().catch(function(e){if(hit)return Object.assign({cached:true,stale:true,at:hit.at},hit.data);throw e;});});}
function slim(x){var o={};for(var k in x)if(k!=="score"&&k!=="rel"&&k!=="relT")o[k]=x[k];return o;}
Q.ask=ask;

Q.stream=function(mode,tabId,q,f){var tab=Q.tab(mode,tabId),srcs=tab.src.filter(Q.srcOn),key=LV.cache.key([mode,tab.id,q,f||{},LV.wikiLang(),srcs]);
  var st=STREAMS.get(key);if(st)return st;
  st={key:key,mode:mode,tab:tab,q:q,f:f||{},srcs:srcs,batches:0,items:[],seen:new Map(),urls:{},status:{},totals:{},done:{},extras:{},busy:null,suggestion:"",cachedAt:0,offline:false};
  srcs.forEach(function(s){st.status[s]={state:"idle",n:0};});STREAMS.set(key,st);if(STREAMS.size>40)STREAMS.delete(STREAMS.keys().next().value);return st;};
/* fetch the next batch from every source still giving */
Q.more=function(st,onStep){if(st.busy)return st.busy;var page=st.batches+1,n=st.tab.n||(st.mode==="scholarly"?10:LV.perPage()),live=st.srcs.filter(function(s){return !st.done[s];});
  if(!live.length){return Promise.resolve(st);}
  live.forEach(function(s){st.status[s]={state:"wait",n:st.status[s]?st.status[s].n:0};});if(onStep)onStep(st);
  var f=Object.assign({},st.f);if(st.tab.type&&!f.type)f.type=st.tab.type;
  st.busy=Promise.all(live.map(function(s){var t0=Date.now();
    return ask(st.mode,s,st.q,f,page,n).then(function(r){var got=(r.items||[]).length;st.status[s]={state:r.cached?"kept":got?"ok":"none",n:(st.status[s].n||0)+got,ms:Date.now()-t0,at:r.at};
      if(r.total!=null)st.totals[s]=r.total;if(!got&&!r.gap)st.done[s]=true;if(r.total!=null&&page*n>=r.total)st.done[s]=true;
      if(r.suggestion&&!st.suggestion)st.suggestion=r.suggestion;if(r.answer)st.extras.ddg=r.answer;if(r.dict)st.extras.dict=r.dict;if(r.cached)st.cachedAt=Math.max(st.cachedAt,r.at||0);
      if(onStep)onStep(st);return {src:s,items:r.items||[]};},
    function(e){st.status[s]={state:"err",n:st.status[s].n||0,err:e&&e.offline?T("no connection","pas de connexion"):(e&&e.message)||String(e)};st.done[s]=true;if(e&&e.offline)st.offline=true;if(onStep)onStep(st);return {src:s,items:[]};});}))
  .then(function(lists){st.batches=page;var added;
    if(st.mode==="scholarly")added=LV.scholar.merge(lists,st.q,f,st.seen);
    else added=mergeWeb(lists,st);
    added.forEach(function(x){x.batch=page;});st.items=st.items.concat(added);st.busy=null;return st;});
  return st.busy;};
/* the web's lists joined by reciprocal rank: an address seen by two sources counts for both, and Wikipedia's own first
   article comes first when its title is what you asked for */
function mergeWeb(lists,st){var by={},out=[],words=LV.words(st.q);
  lists.forEach(function(L){L.items.forEach(function(x,i){var k=LV.cleanUrl(x.url).replace(/^https?:\/\/(www\.)?/,"").replace(/\/$/,"").toLowerCase()||x.id;
    if(st.urls[k])return;var sc=1/(6+i);if(by[k]){by[k].score+=sc;if(!by[k].thumb&&x.thumb)by[k].thumb=x.thumb;if(!by[k].snippet&&x.snippet)by[k].snippet=x.snippet;return;}
    x.score=sc;x.key=k;by[k]=x;out.push(x);});});
  out.forEach(function(x){var t=LV.fold(x.title),n=0;words.forEach(function(w){if(t.indexOf(w)>=0)n++;});x.score+=words.length?(n/words.length)*.04:0;
    if(x.src==="wikipedia"&&words.length&&LV.fold(x.title).replace(/[^\p{L}\p{N}]+/gu," ").trim()===words.join(" "))x.score+=.5;
    if(LV.S.safe&&/\b(porn|xxx|nsfw)\b/i.test(x.title+" "+x.url))x.score=-1;});
  out=out.filter(function(x){return x.score>=0;});out.sort(function(a,b){return b.score-a.score;});out.forEach(function(x){st.urls[x.key]=1;});return out;}
/* make sure the stream holds what page p shows */
Q.page=function(st,p,onStep){var per=st.tab.n||LV.perPage(),need=p*per;
  function step(){if(st.items.length>=need)return Promise.resolve(st);if(st.srcs.every(function(s){return st.done[s];}))return Promise.resolve(st);
    if(st.batches>=p+3)return Promise.resolve(st);return Q.more(st,onStep).then(step);}
  return step();};
Q.slice=function(st,p){var per=st.tab.n||LV.perPage();return st.items.slice((p-1)*per,p*per);};
Q.pages=function(st){var per=st.tab.n||LV.perPage(),have=Math.ceil(st.items.length/per),more=!st.srcs.every(function(s){return st.done[s];});return {have:have,more:more};};
Q.forget=function(){STREAMS.clear();};

/* ---------- the extras beside the "All" list ---------- */
Q.panelFor=function(st){var first=st.items.filter(function(x){return x.src==="wikipedia";})[0];if(!first||!Q.srcOn("wikipedia"))return Promise.resolve(null);
  var words=LV.words(st.q),t=LV.fold(first.title);if(!words.length)return Promise.resolve(null);
  var hits=words.filter(function(w){return t.indexOf(w)>=0;}).length;if(hits<Math.max(1,Math.ceil(words.length*.6)))return Promise.resolve(null);
  var key=LV.cache.key(["panel",first.wiki.lang,first.wiki.title,LV.lang()]);
  return LV.cache.get(key).then(function(hit){if(hit&&(Date.now()-hit.at<24*36e5||!LV.online()))return hit.data;if(!LV.online())return null;
    return LV.web.panel(first.wiki.title).then(function(p){if(p)LV.cache.put(key,p);return p;},function(){return hit?hit.data:null;});});};
Q.imagesFor=function(q){var srcs=["openverse","commons"].filter(Q.srcOn);if(!srcs.length)return Promise.resolve([]);
  return ask("everyday",srcs[0],q,{},1,8).then(function(r){return (r.items||[]).slice(0,6);},function(){return [];});};

/* ---------- scholarly authors (OpenAlex) ---------- */
Q.authors=function(q,page){var key=LV.cache.key(["authors",q,page]);
  return LV.cache.get(key).then(function(hit){if(hit&&(Date.now()-hit.at<FRESH||!LV.online()))return hit.data;
    return LV.fetch("https://api.openalex.org/authors?search="+encodeURIComponent(q)+"&per-page=10&page="+page+"&select=id,display_name,works_count,cited_by_count,summary_stats,last_known_institutions,topics"+
      (LV.S.openalexKey?"&api_key="+encodeURIComponent(LV.S.openalexKey):""),{name:"OpenAlex"}).then(function(d){
      var r={total:d&&d.meta&&d.meta.count,items:((d&&d.results)||[]).map(function(a){return {id:String(a.id).replace(/^https:\/\/openalex\.org\//,""),name:a.display_name,works:a.works_count,cites:a.cited_by_count,
        h:(a.summary_stats||{}).h_index,inst:((a.last_known_institutions||[])[0]||{}).display_name||"",topics:(a.topics||[]).slice(0,3).map(function(t){return t.display_name;})};})};
      LV.cache.put(key,r);return r;},function(e){if(hit)return hit.data;throw e;});});};
})();
