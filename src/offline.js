/* CLAVIS · WHAT IT KEEPS, AND SEARCHING IT WITH NO CONNECTION. The library (pages, papers, books and files you keep,
   on shelves you name), a full-text index of everything in it and of every result you have already seen, the history
   of your searches (only if you want it), and the list of things to search later. The index ranks by BM25, the plain
   arithmetic of how often and where a word appears: worked out here, and the same every time. */
(function(){
"use strict";
var LV=window.LV,T=LV.T;

/* ---------- the library ---------- */
var L=LV.lib={items:[],byId:new Map(),loaded:false};
L.load=function(){return LV.db.all("items").then(function(all){L.items=(all||[]).sort(function(a,b){return (b.at||0)-(a.at||0);});L.byId=new Map(L.items.map(function(i){return [i.id,i];}));
  L.loaded=true;LV.index.dirty=true;LV.emit("library");return L.items;}).catch(function(){L.loaded=true;return [];});};
L.get=function(id){return L.byId.get(id)||null;};
L.has=function(id){return L.byId.has(id);};
L.put=function(item){item.at=item.at||Date.now();item.edited=Date.now();
  if(!L.byId.has(item.id))L.items.unshift(item);else L.items=L.items.map(function(i){return i.id===item.id?item:i;});
  L.byId.set(item.id,item);LV.index.dirty=true;LV.persist();return LV.db.put("items",item).then(function(){LV.emit("library");return item;},function(e){
    LV.toast(T("This device would not keep it (its storage may be full).","Cet appareil n’a pas pu le garder (son stockage est peut-être plein)."));throw e;});};
L.remove=function(id){L.items=L.items.filter(function(i){return i.id!==id;});L.byId.delete(id);LV.index.dirty=true;
  return LV.db.del("items",id).then(function(){LV.emit("library");});};
L.update=function(id,patch){var it=L.get(id);if(!it)return Promise.resolve(null);for(var k in patch)it[k]=patch[k];return L.put(it);};
L.shelves=function(){var s={};L.items.forEach(function(i){if(i.shelf)s[i.shelf]=(s[i.shelf]||0)+1;});return Object.keys(s).sort().map(function(k){return {name:k,n:s[k]};});};
/* a result becomes an item: its words, where it came from, the search it came from */
L.fromResult=function(r,q){var it={id:r.kind==="paper"?r.id:("u:"+r.url),kind:r.kind==="paper"?"paper":r.kind==="book"?"book":r.kind==="image"?"image":"link",
  title:r.title,url:r.url,src:r.src,snippet:r.snippet||"",thumb:r.thumb||"",q:q||"",vet:r.vet?{trust:r.vet.trust,label:r.vet.label||r.vet.checks&&r.vet.checks[0]}:null,shelf:"",note:"",text:""};
  if(r.kind==="paper"){it.paper=JSON.parse(JSON.stringify(r));delete it.paper.score;it.text=[r.abstract,(r.authors||[]).map(function(a){return a.name;}).join(" "),r.venue].filter(Boolean).join(" \n");it.snippet=r.abstract||"";}
  if(r.book)it.book=r.book;if(r.place)it.place=r.place;if(r.wiki)it.wiki=r.wiki;if(r.full)it.full=r.full;return it;};
/* keeping a result: a Wikipedia article is fetched whole so it can be read here with no connection; anything else keeps
   its title, its link and its words (a page on another site cannot be fetched by a browser app) */
L.keep=function(r,q){if(r.wiki)return L.keepArticle(r.wiki.title,r.wiki.lang,q).catch(function(){return L.put(L.fromResult(r,q));});return L.put(L.fromResult(r,q));};
L.keepArticle=function(title,lang,q,quiet){return LV.web.article(title,lang).then(function(a){
  var it={id:"w:"+a.lang+":"+a.wtitle,kind:"page",title:a.title,url:a.url,src:"wikipedia",html:a.html,text:a.text,sections:a.sections,wiki:{lang:a.lang,title:a.wtitle},revid:a.revid,
    snippet:LV.trunc(a.text,300),q:q||"",shelf:"",note:"",vet:{trust:"low",label:T("Encyclopaedia (background, not evidence)","Encyclopédie (contexte, pas une preuve)")}};
  var old=L.get(it.id);if(old){it.shelf=old.shelf;it.note=old.note;it.at=old.at;}
  /* the article's pictures are kept too, so it reads the same with no connection */
  keepPictures(a.html);return L.put(it).then(function(x){if(!quiet)LV.toast(T("Kept to read offline: ","Gardé pour lire hors ligne : ")+a.title);return x;});});};
function keepPictures(html){try{if(!window.caches)return;var srcs=[],m,re=/<img[^>]+src="([^"]+)"/g;while((m=re.exec(html))&&srcs.length<30)srcs.push(m[1].replace(/&amp;/g,"&"));
  caches.open("clavis-pictures").then(function(c){srcs.forEach(function(u){if(!/^https:\/\/upload\.wikimedia\.org\//.test(u))return;
    c.match(u).then(function(hit){if(hit)return;fetch(u,{mode:"cors",credentials:"omit"}).then(function(r){if(r.ok)c.put(u,r);}).catch(function(){});});});});}catch(e){}}
/* take a topic offline: the first articles Wikipedia finds for it, each kept whole */
L.takeOffline=function(q,n,progress){var got=0,failed=0;
  return LV.web.sources.wikipedia.run(q,{n:n,page:1}).then(function(r){var list=r.items||[];
    return list.reduce(function(p,x,i){return p.then(function(){if(progress)progress(i,list.length,x.title);
      return L.keepArticle(x.wiki.title,x.wiki.lang,q,true).then(function(){got++;},function(){failed++;}).then(function(){return new Promise(function(ok){setTimeout(ok,250);});});});},Promise.resolve())
      .then(function(){return {got:got,failed:failed,total:list.length};});});};

/* ---------- your own files: text, Markdown, web pages, PDF, BibTeX and RIS ---------- */
L.importFiles=function(files,shelf){var arr=[].slice.call(files||[]),done=0,errs=[];
  return arr.reduce(function(p,f){return p.then(function(){return readFile(f).then(function(items){return Promise.all(items.map(function(it){it.shelf=it.shelf||shelf||"";return L.put(it);}));})
    .then(function(){done++;},function(e){errs.push(f.name+": "+(e&&e.message||e));});});},Promise.resolve()).then(function(){return {done:done,errs:errs};});};
function readFile(f){var name=f.name||"file",ext=(name.match(/\.([a-z0-9]+)$/i)||[,""])[1].toLowerCase();
  if(f.size>60*1024*1024)return Promise.reject(new Error(T("larger than 60 MB","plus de 60 Mo")));
  var base={kind:"file",src:"file",title:name.replace(/\.[^.]+$/,""),url:"",file:{name:name,type:f.type||ext,size:f.size,modified:f.lastModified||0},shelf:"",note:""};
  if(ext==="pdf")return readPDF(f).then(function(t){return [Object.assign(base,{id:"f:"+name+":"+f.size,text:t.text,pages:t.pages,snippet:LV.trunc(t.text,300),title:t.title||base.title})];});
  return f.text().then(function(s){
    if(ext==="bib"||/^\s*@\w+\s*\{/.test(s))return parseBib(s);
    if(ext==="ris"||/^TY  - /m.test(s))return parseRIS(s);
    if(ext==="json"){try{var j=JSON.parse(s);if(j&&j.clavis&&Array.isArray(j.items))return j.items;if(Array.isArray(j)&&j[0]&&(j[0].title||j[0].type))return j.map(cslToItem);}catch(e){}}
    var text=s,html="";if(ext==="html"||ext==="htm"){html=LV.web.clean(s,null);text=LV.text(html);var tm=/<title[^>]*>([^<]*)<\/title>/i.exec(s);if(tm&&tm[1].trim())base.title=LV.text(tm[1]);}
    else if(ext==="md"||ext==="markdown"){var h1=/^#\s+(.+)$/m.exec(s);if(h1)base.title=h1[1].trim();}
    return [Object.assign(base,{id:"f:"+name+":"+f.size,text:text,html:html,snippet:LV.trunc(text,300),plain:!html?s:""})];});}
var PDFP=null;function pdfjs(){if(window.pdfjsLib)return Promise.resolve(window.pdfjsLib);if(PDFP)return PDFP;
  PDFP=LV.script("pdf.min.js",function(){return !!(window.pdfjsLib||window["pdfjs-dist/build/pdf"]);}).then(function(){var p=window.pdfjsLib||window["pdfjs-dist/build/pdf"];window.pdfjsLib=p;
    return LV.res("pdf.worker.min.js").then(function(w){p.GlobalWorkerOptions.workerSrc=URL.createObjectURL(new Blob([w],{type:"text/javascript"}));return p;});})
    .catch(function(){PDFP=null;throw new Error(T("The PDF reader could not be opened.","Le lecteur PDF n’a pas pu s’ouvrir."));});return PDFP;}
function readPDF(f){return pdfjs().then(function(p){return f.arrayBuffer().then(function(buf){return p.getDocument({data:buf,isEvalSupported:false}).promise;}).then(function(doc){
  var n=Math.min(doc.numPages,400),out=[],i=1;
  function next(){if(i>n)return Promise.resolve();var k=i++;return doc.getPage(k).then(function(pg){return pg.getTextContent();}).then(function(tc){out.push(tc.items.map(function(x){return x.str;}).join(" ").replace(/\s+/g," "));return next();});}
  return next().then(function(){return doc.getMetadata().catch(function(){return null;}).then(function(md){var title=md&&md.info&&md.info.Title;return {text:out.join("\n\n"),pages:doc.numPages,title:title&&String(title).trim()};});});});});}
function cslToItem(c){var x={kind:"paper",title:c.title||"",doi:LV.scholar.cleanDOI(c.DOI),year:(c.issued&&c.issued["date-parts"]&&c.issued["date-parts"][0][0])||"",
  authors:(c.author||[]).map(function(a){return {name:a.literal||[a.given,a.family].filter(Boolean).join(" "),given:a.given||"",family:a.family||""};}),venue:c["container-title"]||"",
  volume:c.volume||"",issue:c.issue||"",pages:c.page||"",publisher:c.publisher||"",abstract:c.abstract||"",type:{"article-journal":"article",book:"book",chapter:"book-chapter",thesis:"thesis"}[c.type]||"article",url:c.URL||(c.DOI?"https://doi.org/"+c.DOI:"")};
  x.src="file";x.srcs=["file"];x.venueType=x.type==="article"?"journal":"";x.id="p:"+LV.scholar.keyOf(x);LV.scholar.vet(x);return L.fromResult(x,"");}
function parseBib(s){var out=[],i=0;
  while((i=s.indexOf("@",i))>=0){var m=/^@(\w+)\s*([{(])/.exec(s.slice(i));if(!m){i++;continue;}var type=m[1].toLowerCase(),open=m[2],close=open==="{"?"}":")",j=i+m[0].length,depth=1,start=j;
    while(j<s.length&&depth>0){var ch=s[j];if(ch==="{"||ch===open&&open==="(")depth++;else if(ch==="}"||ch===close&&close===")")depth--;j++;}
    var body=s.slice(start,j-1);i=j;if(type==="comment"||type==="string"||type==="preamble")continue;
    var comma=body.indexOf(",");if(comma<0)continue;var f={},rest=body.slice(comma+1),k=0;
    while(k<rest.length){var fm=/^\s*,?\s*([\w-]+)\s*=\s*/.exec(rest.slice(k));if(!fm)break;k+=fm[0].length;var name=fm[1].toLowerCase(),val="";
      if(rest[k]==="{"){var d=1,st=k+1;k++;while(k<rest.length&&d>0){if(rest[k]==="{")d++;else if(rest[k]==="}")d--;k++;}val=rest.slice(st,k-1);}
      else if(rest[k]==='"'){var st2=k+1;k++;while(k<rest.length&&rest[k]!=='"')k++;val=rest.slice(st2,k);k++;}
      else{var vm=/^[^,]*/.exec(rest.slice(k));val=vm[0];k+=vm[0].length;}
      f[name]=val.replace(/[{}]/g,"").replace(/\\&/g,"&").replace(/\s+/g," ").trim();}
    out.push(cslToItem({type:type==="article"?"article-journal":type==="book"?"book":type==="incollection"||type==="inbook"?"chapter":/thesis/.test(type)?"thesis":"article",title:f.title,DOI:f.doi,URL:f.url,
      issued:f.year?{"date-parts":[[+f.year]]}:null,author:(f.author||"").split(/\s+and\s+/).filter(Boolean).map(function(a){var p=a.split(",");return p.length>1?{family:p[0].trim(),given:p.slice(1).join(",").trim()}:LV.scholar.splitName(a);}),
      "container-title":f.journal||f.booktitle,volume:f.volume,issue:f.number,page:(f.pages||"").replace(/--?/,"–"),publisher:f.publisher,abstract:f.abstract}));}
  return out;}
function parseRIS(s){var out=[],cur=null;s.split(/\r?\n/).forEach(function(line){var m=/^([A-Z][A-Z0-9])  -\s?(.*)$/.exec(line);if(!m)return;var k=m[1],v=m[2].trim();
  if(k==="TY"){cur={type:v,au:[]};return;}if(!cur)return;if(k==="ER"){out.push(cur);cur=null;return;}
  if(k==="AU"||k==="A1")cur.au.push(v);else if(k==="TI"||k==="T1")cur.ti=v;else if(k==="JO"||k==="JF"||k==="T2")cur.jo=cur.jo||v;else if(k==="PY"||k==="Y1")cur.py=(v.match(/\d{4}/)||[""])[0];
  else if(k==="DO")cur.doi=v;else if(k==="UR")cur.ur=cur.ur||v;else if(k==="VL")cur.vl=v;else if(k==="IS")cur.is=v;else if(k==="SP")cur.sp=v;else if(k==="EP")cur.ep=v;else if(k==="AB")cur.ab=v;else if(k==="PB")cur.pb=v;});
  return out.map(function(r){return cslToItem({type:r.type==="JOUR"?"article-journal":r.type==="BOOK"?"book":r.type==="CHAP"?"chapter":r.type==="THES"?"thesis":"article",title:r.ti,DOI:r.doi,URL:r.ur,
    issued:r.py?{"date-parts":[[+r.py]]}:null,author:r.au.map(function(a){var p=a.split(",");return p.length>1?{family:p[0].trim(),given:p.slice(1).join(",").trim()}:LV.scholar.splitName(a);}),
    "container-title":r.jo,volume:r.vl,issue:r.is,page:r.sp?(r.sp+(r.ep?"–"+r.ep:"")):"",publisher:r.pb,abstract:r.ab});});}
/* the whole library as one file, and back */
L.exportJSON=function(){return JSON.stringify({clavis:LV.VERSION,exported:new Date().toISOString(),items:L.items},null,1);};

/* ---------- the index: BM25 over the library and the results already seen ---------- */
var IX=LV.index={dirty:true,docs:[],post:new Map(),avg:1,seenAt:0};
function stem(w){if(w.length<=4||/\d/.test(w))return w;
  if(/ies$/.test(w))return w.slice(0,-3)+"y";if(/(sses|xes|ches|shes)$/.test(w))return w.slice(0,-2);if(/[^su]s$/.test(w))return w.slice(0,-1);
  if(w.length>6&&/ing$/.test(w))return w.slice(0,-3);if(w.length>5&&/ed$/.test(w))return w.slice(0,-2);return w;}
IX.terms=function(s){return LV.words(s).map(stem);};
function addDoc(ref,title,body,extra){var d={ref:ref,len:0,title:title,body:body},tf=new Map(),tt=IX.terms(title),tb=IX.terms(body+" "+(extra||""));
  tt.forEach(function(t){var e=tf.get(t)||[0,0];e[0]++;tf.set(t,e);});tb.forEach(function(t){var e=tf.get(t)||[0,0];e[1]++;tf.set(t,e);});
  d.len=tt.length*3+tb.length;var di=IX.docs.length;IX.docs.push(d);tf.forEach(function(e,t){var p=IX.post.get(t);if(!p)IX.post.set(t,p=[]);p.push([di,e[0],e[1]]);});}
/* the results seen before come from the result cache: each a title, a few words and a link */
IX.build=function(){if(!IX.dirty&&IX.docs.length)return Promise.resolve(IX);
  return LV.db.all("cache").catch(function(){return [];}).then(function(cache){IX.docs=[];IX.post=new Map();var seen={};
    L.items.forEach(function(it){var body=[it.text||it.snippet||"",it.note||"",it.shelf||""].join(" \n ");
      var extra=it.paper?[(it.paper.authors||[]).map(function(a){return a.name;}).join(" "),it.paper.venue,it.paper.year].join(" "):it.book?[(it.book.authors||[]).join(" "),it.book.year].join(" "):"";
      addDoc({lib:it.id},it.title||"",body,extra);if(it.url)seen[it.url]=1;});
    (cache||[]).forEach(function(c){var items=c&&c.data&&c.data.items;if(!Array.isArray(items))return;items.forEach(function(x){if(!x||!x.title)return;var k=x.url||x.id;if(!k||seen[k])return;seen[k]=1;
      addDoc({seen:x,at:c.at},x.title,(x.snippet||x.abstract||""),x.kind==="paper"?[(x.authors||[]).map(function(a){return a.name;}).join(" "),x.venue,x.year].join(" "):"");});});
    var tot=0;IX.docs.forEach(function(d){tot+=d.len;});IX.avg=IX.docs.length?tot/IX.docs.length:1;IX.dirty=false;return IX;});};
/* search(q,{only:"lib"|"seen"|"", kind}) -> [{item or seen result, score, snippet}] */
IX.search=function(q,o){o=o||{};return IX.build().then(function(){var pq=LV.parseQuery(q),terms=IX.terms(pq.plain),N=IX.docs.length,k1=1.2,b=.75,sc=new Map();
  if(!terms.length&&!pq.phrases.length&&!pq.site&&!o.kind)return [];
  terms.forEach(function(t){var p=IX.post.get(t);if(!p)return;var idf=Math.log(1+(N-p.length+.5)/(p.length+.5));
    p.forEach(function(e){var d=IX.docs[e[0]],tf=e[1]*3+e[2],s=idf*(tf*(k1+1))/(tf+k1*(1-b+b*d.len/IX.avg));sc.set(e[0],(sc.get(e[0])||0)+s);});});
  if(!terms.length)IX.docs.forEach(function(d,i){sc.set(i,1);});
  var out=[];sc.forEach(function(s,i){var d=IX.docs[i],ft=LV.fold(d.title+" "+d.body);
    if(pq.phrases.some(function(ph){return ft.indexOf(LV.fold(ph))<0;}))return;
    if(pq.not.some(function(w){return ft.indexOf(w)>=0;}))return;
    var item=d.ref.lib?L.get(d.ref.lib):d.ref.seen;if(!item)return;
    if(pq.site&&LV.host(item.url||"").indexOf(pq.site)<0)return;
    if(o.only==="lib"&&!d.ref.lib)return;if(o.only==="seen"&&d.ref.lib)return;if(o.kind&&item.kind!==o.kind&&!(o.kind==="paper"&&item.paper))return;
    /* everything kept counts a little more than something only seen in passing */
    if(d.ref.lib)s*=1.35;
    var matched=terms.filter(function(t){return ft.indexOf(t)>=0;}).length;if(terms.length>=3&&matched<Math.ceil(terms.length/2))return;
    out.push({lib:!!d.ref.lib,item:item,score:s,at:d.ref.at||item.at,snippet:snip(d.body,pq.words.concat(pq.phrases.map(LV.fold)))});});
  out.sort(function(a,b){return b.score-a.score;});return out.slice(0,o.max||200);});};
function snip(body,words){body=String(body||"").replace(/\s+/g," ").trim();if(body.length<=260||!words.length)return LV.trunc(body,260);
  var f=LV.fold(body),best=0,bestN=-1,step=60;for(var i=0;i<f.length;i+=step){var win=f.slice(i,i+260),n=0;words.forEach(function(w){if(win.indexOf(w)>=0)n++;});if(n>bestN){bestN=n;best=i;}if(n===words.length)break;}
  var s=body.slice(Math.max(0,best-20),best+260).replace(/^\S*\s/,"");return (best>20?"… ":"")+s.replace(/\s\S*$/,"")+" …";}

/* ---------- history (only if you want it) and the searches for later ---------- */
var HI=LV.hist={};
HI.add=function(e){if(!LV.S.history)return Promise.resolve();e.id=e.id||LV.uid("h");e.at=e.at||Date.now();e.session=LV.session&&LV.session.id||"";return LV.db.put("history",e).then(function(){LV.emit("history");}).catch(function(){});};
HI.all=function(){return LV.db.all("history").then(function(a){return (a||[]).sort(function(x,y){return y.at-x.at;});}).catch(function(){return [];});};
HI.clear=function(){return LV.db.clear("history").then(function(){LV.emit("history");});};
HI.remove=function(id){return LV.db.del("history",id).then(function(){LV.emit("history");});};
var LA=LV.later={list:[]};
LA.load=function(){return LV.db.all("later").then(function(a){LA.list=(a||[]).sort(function(x,y){return y.at-x.at;});LV.emit("later");return LA.list;}).catch(function(){return [];});};
LA.add=function(o){o.id=o.id||LV.uid("l");o.at=Date.now();LA.list=LA.list.filter(function(x){return !(x.q&&x.q===o.q&&!o.url)&&!(o.url&&x.url===o.url);});LA.list.unshift(o);
  return LV.db.put("later",o).then(function(){LV.emit("later");});};
LA.remove=function(id){LA.list=LA.list.filter(function(x){return x.id!==id;});return LV.db.del("later",id).then(function(){LV.emit("later");});};
})();
