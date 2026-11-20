/* CLAVIS · THE SCHOLARLY SOURCES. OpenAlex, Crossref, Europe PMC, PubMed, DOAJ and Semantic Scholar, each asked in
   its own words, then joined: one record per work (by its DOI, or its title and year), retracted works left out,
   editorials, letters and errata named for what they are, and every record vetted in Ingenium's words ("Preprint: not
   peer-reviewed", "peer review confirmed (journal listed in DOAJ)"). Nothing here asks a model for anything: Semantic
   Scholar's machine summaries are never requested. Citations are made by citeproc-js with the same styles as Inkwell. */
(function(){
"use strict";
var LV=window.LV,T=LV.T,S=LV.scholar={};

function cleanDOI(d){d=String(d||"").trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i,"").replace(/^doi:\s*/i,"");return /^10\.\d{4,9}\//.test(d)?d.toLowerCase():"";}
S.cleanDOI=cleanDOI;
function abstractOf(inv){if(!inv||typeof inv!=="object")return "";var pos=[];Object.keys(inv).forEach(function(w){(inv[w]||[]).forEach(function(i){pos[i]=w;});});return pos.join(" ").replace(/\s+/g," ").trim();}
function titleKind(t){t=String(t||"").replace(/^\s+/,"");
  if(/^(guest )?editorial\s*([:.,\-–—]|$)/i.test(t))return "editorial";
  if(/^(letters?|correspondence)\s*([:.,\-–—]|$)/i.test(t)||/^letter to the editor\b/i.test(t))return "letter";
  if(/^(erratum|corrigendum|correction)\b/i.test(t))return "erratum";return "";}
function splitName(n){n=String(n||"").replace(/\s+/g," ").trim();if(!n)return {literal:""};
  if(/,/.test(n)){var c=n.split(",");return {family:c[0].trim(),given:c.slice(1).join(",").trim()};}
  var p=n.split(" ");if(p.length<2)return {literal:n};var suf="";if(/^(jr\.?|sr\.?|ii|iii|iv)$/i.test(p[p.length-1])){suf=p.pop();}
  var fam=[p.pop()];while(p.length>1&&/^(van|von|der|den|de|del|della|di|da|du|le|la|dos|das|bin|ibn|al)$/i.test(p[p.length-1]))fam.unshift(p.pop());
  var o={family:fam.join(" "),given:p.join(" ")};if(suf)o.suffix=suf;return o;}
S.splitName=splitName;
function mail(){var m=LV.S.mailto||"";return /@/.test(m)?m:"";}
function oaKey(){return LV.S.openalexKey?"&api_key="+encodeURIComponent(LV.S.openalexKey):"";}
function oaMail(){return mail()?"&mailto="+encodeURIComponent(mail()):"";}
function luceneSafe(q){return String(q||"").replace(/[+\-!(){}\[\]^~*?:\\\/]|&&|\|\|/g," ").replace(/\s+/g," ").trim();}

/* ---------- OpenAlex ---------- */
var OA_SELECT="id,doi,display_name,publication_year,publication_date,type,authorships,primary_location,open_access,cited_by_count,is_retracted,abstract_inverted_index,best_oa_location,biblio,language,ids,referenced_works_count";
function fromOpenAlex(w){var loc=w.primary_location||{},src=loc.source||{},oa=w.open_access||{},best=w.best_oa_location||{},b=w.biblio||{};
  var type=String(w.type||""),doi=cleanDOI(w.doi),ids=w.ids||{};
  return {kind:"paper",src:"openalex",title:LV.text(w.display_name||w.title||""),doi:doi,year:w.publication_year||"",date:w.publication_date||"",
    authors:(w.authorships||[]).map(function(a){return {name:a.author&&a.author.display_name||a.raw_author_name||"",oa:a.author&&a.author.id?String(a.author.id).replace(/^https:\/\/openalex\.org\//,""):"",
      inst:(a.institutions||[]).map(function(i){return i.display_name;}).filter(Boolean).slice(0,2).join("; ")};}).filter(function(a){return a.name;}),
    venue:src.display_name||"",venueType:src.type||"",publisher:src.host_organization_name||"",issn:src.issn_l||"",doaj:!!src.is_in_doaj,
    type:(type==="article"&&titleKind(w.display_name))||type,preprint:type==="preprint"||src.type==="repository",
    oa:!!oa.is_oa,oaStatus:oa.oa_status||"",oaUrl:best.landing_page_url||oa.oa_url||"",pdf:best.pdf_url||"",cites:w.cited_by_count||0,retracted:!!w.is_retracted,
    abstract:abstractOf(w.abstract_inverted_index),volume:b.volume||"",issue:b.issue||"",pages:b.first_page?(b.first_page+(b.last_page&&b.last_page!==b.first_page?"–"+b.last_page:"")):"",
    lang:w.language||"",oaid:String(w.id||"").replace(/^https:\/\/openalex\.org\//,""),pmid:ids.pmid?String(ids.pmid).replace(/\D/g,""):"",pmcid:ids.pmcid?String(ids.pmcid).replace(/^.*\//,""):"",
    refsCount:w.referenced_works_count||0,url:doi?("https://doi.org/"+doi):(loc.landing_page_url||best.landing_page_url||w.id||"")};}
S.fromOpenAlex=fromOpenAlex;
function oaFilters(f,extra){var a=["is_retracted:false"];if(f.from||f.to)a.push("publication_year:"+(f.from||1000)+"-"+(f.to||new Date().getFullYear()+1));
  if(f.oa)a.push("is_oa:true");
  if(f.type==="review")a.push("type:review");else if(f.type==="book")a.push("type:book|book-chapter");else if(f.type==="thesis")a.push("type:dissertation");
  else if(f.type==="dataset")a.push("type:dataset");else if(f.type==="preprint")a.push("type:preprint");else if(f.type==="article")a.push("type:article|review");
  if(f.peer)a.push("primary_location.source.type:journal");if(f.lang)a.push("language:"+f.lang);if(extra)a.push(extra);return a.join(",");}
function oaSort(s){return s==="cited"?"&sort=cited_by_count:desc":s==="new"?"&sort=publication_date:desc":s==="old"?"&sort=publication_date:asc":"";}
S.openalexList=function(params,page,n){return LV.fetch("https://api.openalex.org/works?"+params+"&per-page="+n+"&page="+page+"&select="+OA_SELECT+oaKey()+oaMail(),{name:"OpenAlex",timeout:15000})
  .then(function(d){return {total:d&&d.meta&&d.meta.count,items:((d&&d.results)||[]).map(fromOpenAlex)};});};

/* ---------- the sources, one adapter each ---------- */
var SRC=S.sources={};
function def(id,o){o.id=id;SRC[id]=o;}
def("openalex",{name:"OpenAlex",weight:1,about:["An open catalogue of over 250 million scholarly works, with who cites whom. A free key (openalex.org) raises its daily allowance.","Un catalogue ouvert de plus de 250 millions de travaux savants, avec qui cite qui. Une clé gratuite (openalex.org) augmente son quota quotidien."],
  run:function(q,f,page,n){return S.openalexList("search="+encodeURIComponent(q)+"&filter="+encodeURIComponent(oaFilters(f))+oaSort(f.sort),page,n);}});

def("crossref",{name:"Crossref",weight:.8,about:["The registry of DOIs: every work a publisher has registered, with its exact citation details.","Le registre des DOI : chaque travail enregistré par un éditeur, avec ses références exactes."],
  run:function(q,f,page,n){var fl=[];if(f.from)fl.push("from-pub-date:"+f.from);if(f.to)fl.push("until-pub-date:"+f.to+"-12-31");
    if(f.type==="book")fl.push("type:book,type:book-chapter,type:monograph");else if(f.type==="thesis")fl.push("type:dissertation");else if(f.type==="dataset")fl.push("type:dataset");
    else if(f.type==="preprint")fl.push("type:posted-content");else if(f.peer||f.type==="article"||f.type==="review")fl.push("type:journal-article");
    var sort=f.sort==="cited"?"&sort=is-referenced-by-count&order=desc":f.sort==="new"?"&sort=published&order=desc":f.sort==="old"?"&sort=published&order=asc":"";
    return LV.fetch("https://api.crossref.org/works?query.bibliographic="+encodeURIComponent(q)+"&rows="+n+"&offset="+((page-1)*n)+(fl.length?"&filter="+encodeURIComponent(fl.join(",")):"")+sort+
      "&select=DOI,title,author,issued,container-title,type,is-referenced-by-count,ISSN,ISBN,update-to,updated-by,volume,issue,page,publisher,abstract"+(mail()?"&mailto="+encodeURIComponent(mail()):""),{name:"Crossref",timeout:15000})
      .then(function(d){var m=(d&&d.message)||{};return {total:m["total-results"],items:(m.items||[]).map(S.fromCrossref).filter(function(x){return !x.notice&&!x.retracted;})};});}});
S.fromCrossref=function(w){var doi=cleanDOI(w.DOI),dp=(w.issued&&w.issued["date-parts"]&&w.issued["date-parts"][0])||[],yr=dp[0]||"";
  var notice=Array.isArray(w["update-to"])&&w["update-to"].some(function(u){return /retract/i.test(u&&u.type||"");});
  var gone=(Array.isArray(w["updated-by"])&&w["updated-by"].some(function(u){return /retract|withdraw|remov/i.test(u&&u.type||"");}))||/^\s*retracted\b/i.test((w.title&&w.title[0])||"");
  var t=(w.title&&w.title[0])||"",ty=w.type||"";
  return {kind:"paper",src:"crossref",title:LV.text(t),doi:doi,year:yr,date:dp.length?dp.map(function(x){return String(x).padStart(2,"0");}).join("-"):"",
    authors:(w.author||[]).map(function(a){return {name:[a.given,a.family].filter(Boolean).join(" ")||a.name||"",given:a.given||"",family:a.family||""};}).filter(function(a){return a.name;}),
    venue:LV.text((w["container-title"]&&w["container-title"][0])||""),venueType:/journal/.test(ty)?"journal":"",publisher:w.publisher||"",issn:(w.ISSN&&w.ISSN[0])||"",
    type:ty==="journal-article"?(titleKind(t)||"article"):ty==="posted-content"?"preprint":ty,preprint:ty==="posted-content",doaj:false,oa:false,oaUrl:"",pdf:"",
    cites:w["is-referenced-by-count"]||0,retracted:gone,notice:notice,abstract:LV.text(w.abstract||"").replace(/^abstract\s*/i,""),volume:w.volume||"",issue:w.issue||"",pages:(w.page||"").replace("-","–"),
    lang:w.language||"",url:doi?("https://doi.org/"+doi):""};};

/* Europe PMC keeps its place with a cursor: page n needs the cursor page n-1 returned */
var EPMC_CUR={};
def("europepmc",{name:"Europe PMC",weight:.9,about:["Life sciences and medicine: PubMed, PubMed Central, preprints and more, with free full texts.","Sciences de la vie et médecine : PubMed, PubMed Central, des prépublications et plus, avec des textes intégraux gratuits."],
  run:function(q,f,page,n){var qq="("+q+")";if(f.from||f.to)qq+=" AND (PUB_YEAR:["+(f.from||1000)+" TO "+(f.to||3000)+"])";if(f.oa)qq+=" AND (OPEN_ACCESS:y)";
    if(f.peer)qq+=" NOT (SRC:PPR)";if(f.type==="review")qq+=" AND (PUB_TYPE:\"review\")";else if(f.type==="preprint")qq+=" AND (SRC:PPR)";else if(f.type==="thesis")qq+=" AND (SRC:ETH)";
    else if(f.type==="book")qq+=" AND (SRC:NBK OR SRC:HIR)";else if(f.type==="dataset")return Promise.resolve({items:[]});
    var key=qq+"|"+(f.sort||""),cur=page===1?"*":(EPMC_CUR[key]||{})[page];if(!cur)return Promise.resolve({items:[],gap:true});
    var sort=f.sort==="cited"?"&sort="+encodeURIComponent("CITED desc"):f.sort==="new"?"&sort="+encodeURIComponent("P_PDATE_D desc"):f.sort==="old"?"&sort="+encodeURIComponent("P_PDATE_D asc"):"";
    return LV.fetch("https://www.ebi.ac.uk/europepmc/webservices/rest/search?query="+encodeURIComponent(qq)+"&format=json&resultType=core&pageSize="+n+"&cursorMark="+encodeURIComponent(cur)+sort,{name:"Europe PMC",timeout:15000})
      .then(function(d){if(d&&d.nextCursorMark){(EPMC_CUR[key]=EPMC_CUR[key]||{})[page+1]=d.nextCursorMark;}
        return {total:d&&d.hitCount,items:((d&&d.resultList&&d.resultList.result)||[]).map(S.fromEPMC).filter(function(x){return !x.retracted;})};});}});
S.fromEPMC=function(w){var types=((w.pubTypeList&&w.pubTypeList.pubType)||[]).join(" ").toLowerCase(),doi=cleanDOI(w.doi);
  var retracted=/retract/.test(types),preprint=w.source==="PPR"||/preprint/.test(types);
  var minor=((types.match(/editorial|letter|news|published erratum/)||[""])[0]).replace("published ","");
  if(!minor&&/comment/.test(types)&&!/journal article|research-article|review/.test(types))minor="comment";
  if(w.source==="PAT")minor="patent";else if(w.source==="ETH")minor="thesis";
  var ji=w.journalInfo||{},jt=(ji.journal&&ji.journal.title)||"",full=((w.fullTextUrlList&&w.fullTextUrlList.fullTextUrl)||[]);
  var pdf=full.filter(function(u){return u.documentStyle==="pdf"&&/free|open/i.test(u.availability||"");})[0];
  var authors=(w.authorList&&w.authorList.author)?w.authorList.author.map(function(a){return {name:a.fullName?(a.firstName?a.firstName+" "+a.lastName:a.fullName):"",given:a.firstName||"",family:a.lastName||""};})
    :String(w.authorString||"").replace(/\.$/,"").split(/,\s*/).filter(Boolean).map(function(a){var p=a.trim().split(/\s+/);return {name:p.length>=2&&/^[A-Z]{1,4}$/.test(p[p.length-1])?p[p.length-1].split("").join(" ")+" "+p.slice(0,-1).join(" "):a};});
  return {kind:"paper",src:"europepmc",title:LV.text(String(w.title||"").replace(/\.$/,"")),doi:doi,year:w.pubYear||"",date:w.firstPublicationDate||"",authors:authors.filter(function(a){return a.name;}),
    venue:jt,venueType:jt&&!/patent|thesis/.test(minor)?"journal":"",type:preprint?"preprint":(minor||titleKind(w.title)||(/review/.test(types)?"review":"article")),preprint:preprint,doaj:false,issn:(ji.journal&&(ji.journal.issn||ji.journal.essn))||"",
    oa:w.isOpenAccess==="Y",oaUrl:w.pmcid?("https://europepmc.org/article/PMC/"+w.pmcid):"",pdf:pdf?pdf.url:"",cites:w.citedByCount||0,retracted:retracted,
    abstract:LV.text(w.abstractText||""),volume:ji.volume||"",issue:ji.issue||"",pages:(w.pageInfo||"").replace("-","–"),pmid:w.pmid||"",pmcid:w.pmcid||"",
    url:doi?("https://doi.org/"+doi):("https://europepmc.org/article/"+w.source+"/"+w.id)};};

def("pubmed",{name:"PubMed",weight:.85,about:["The United States National Library of Medicine’s index of biomedical literature.","L’index de la littérature biomédicale de la Bibliothèque nationale de médecine des États-Unis."],
  run:function(q,f,page,n){if(f.type==="book"||f.type==="dataset"||f.type==="thesis"||f.type==="preprint")return Promise.resolve({items:[]});
    var term="("+q+")";if(f.from||f.to)term+=" AND ("+(f.from||1800)+":"+(f.to||3000)+"[dp])";if(f.oa)term+=" AND (free full text[sb])";if(f.type==="review")term+=" AND (review[pt])";
    if(f.peer)term+=" NOT (preprint[pt])";var tool="&tool=clavis"+(mail()?"&email="+encodeURIComponent(mail()):"");
    return LV.fetch("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmode=json&retmax="+n+"&retstart="+((page-1)*n)+"&sort="+(f.sort==="new"?"pub_date":"relevance")+"&term="+encodeURIComponent(term)+tool,{name:"PubMed"})
      .then(function(d){var r=(d&&d.esearchresult)||{},ids=r.idlist||[];if(!ids.length)return {total:+r.count||0,items:[]};
        return LV.fetch("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id="+ids.join(",")+tool,{name:"PubMed"}).then(function(s){var res=(s&&s.result)||{};
          return {total:+r.count||0,items:ids.map(function(id){return res[id];}).filter(Boolean).map(S.fromPubMed).filter(function(x){return !x.retracted;})};});});}});
S.fromPubMed=function(w){var aid={};(w.articleids||[]).forEach(function(a){aid[a.idtype]=a.value;});var pt=(w.pubtype||[]).join(" ").toLowerCase();var doi=cleanDOI(aid.doi);
  var yr=(String(w.pubdate||w.sortpubdate||"").match(/\d{4}/)||[""])[0];
  return {kind:"paper",src:"pubmed",title:LV.text(String(w.title||"").replace(/\.$/,"")),doi:doi,year:yr,date:w.sortpubdate?String(w.sortpubdate).slice(0,10).replace(/\//g,"-"):"",
    authors:(w.authors||[]).filter(function(a){return a.authtype!=="CollectiveName"||a.name;}).map(function(a){var p=String(a.name||"").split(" ");var ini=p.length>1?p.pop():"";return {name:(ini?ini.split("").join(". ")+". ":"")+p.join(" "),family:p.join(" "),given:ini?ini.split("").join(". ")+".":""};}),
    venue:w.fulljournalname||w.source||"",venueType:"journal",type:/retract/.test(pt)?"retraction":/review/.test(pt)?"review":/editorial/.test(pt)?"editorial":/letter/.test(pt)?"letter":/comment/.test(pt)?"comment":/preprint/.test(pt)?"preprint":"article",
    preprint:/preprint/.test(pt),retracted:/retracted publication|retraction of publication/.test(pt),doaj:false,issn:w.issn||w.essn||"",oa:!!aid.pmc,oaUrl:aid.pmc?("https://www.ncbi.nlm.nih.gov/pmc/articles/"+aid.pmc+"/"):"",
    pdf:"",cites:0,abstract:"",volume:w.volume||"",issue:w.issue||"",pages:(w.pages||"").replace("-","–"),pmid:String(w.uid||""),pmcid:aid.pmc||"",url:doi?("https://doi.org/"+doi):("https://pubmed.ncbi.nlm.nih.gov/"+w.uid+"/")};};

def("doaj",{name:"DOAJ",weight:.7,about:["The Directory of Open Access Journals: free-to-read articles from journals whose peer review DOAJ has checked.","Le répertoire des revues en libre accès : des articles gratuits de revues dont le DOAJ a vérifié l’évaluation par les pairs."],
  run:function(q,f,page,n){if(f.type&&f.type!=="article"&&f.type!=="review")return Promise.resolve({items:[]});
    var qq=luceneSafe(q);if(!qq)return Promise.resolve({items:[]});if(f.from||f.to)qq="("+qq+") AND bibjson.year:["+(f.from||1000)+" TO "+(f.to||3000)+"]";
    var sort=f.sort==="new"?"&sort="+encodeURIComponent("created_date:desc"):"";
    return LV.fetch("https://doaj.org/api/search/articles/"+encodeURIComponent(qq)+"?page="+page+"&pageSize="+n+sort,{name:"DOAJ",timeout:15000}).then(function(d){
      return {total:d&&d.total,items:((d&&d.results)||[]).map(function(r){var b=r.bibjson||{},doi="";(b.identifier||[]).forEach(function(i){if(/doi/i.test(i.type))doi=cleanDOI(i.id);});
        var link=((b.link||[]).filter(function(l){return /fulltext/i.test(l.type);})[0]||{}).url||"",j=b.journal||{};
        return {kind:"paper",src:"doaj",title:LV.text(b.title||""),doi:doi,year:b.year||"",date:b.year?(b.year+(b.month?"-"+String(b.month).padStart(2,"0"):"")):"",
          authors:(b.author||[]).map(function(a){return {name:a.name||""};}).filter(function(a){return a.name;}),venue:j.title||"",venueType:"journal",publisher:j.publisher||"",issn:(j.issns||[])[0]||"",
          type:titleKind(b.title)||"article",preprint:false,doaj:true,oa:true,oaUrl:link,pdf:"",cites:0,retracted:false,abstract:LV.text(b.abstract||""),volume:j.volume||"",issue:j.number||"",
          pages:b.start_page?(b.start_page+(b.end_page?"–"+b.end_page:"")):"",url:doi?("https://doi.org/"+doi):link};})};});}});

def("s2",{name:"Semantic Scholar",weight:.85,about:["The Allen Institute’s scholarly index. Clavis asks it only for its records, never for its machine-written summaries.","L’index savant de l’Allen Institute. Clavis ne lui demande que ses notices, jamais ses résumés écrits par machine."],
  run:function(q,f,page,n){var p="&fields=title,year,authors,venue,citationCount,isOpenAccess,openAccessPdf,externalIds,abstract,publicationTypes,journal,publicationDate";
    if(f.from||f.to)p+="&year="+(f.from||"")+"-"+(f.to||"");if(f.oa)p+="&openAccessPdf";
    if(f.type==="review")p+="&publicationTypes=Review";else if(f.type==="book")p+="&publicationTypes=Book,BookSection";else if(f.type==="dataset")p+="&publicationTypes=Dataset";
    else if(f.peer||f.type==="article")p+="&publicationTypes=JournalArticle,Review";else if(f.type==="thesis"||f.type==="preprint")return Promise.resolve({items:[]});
    return LV.fetch("https://api.semanticscholar.org/graph/v1/paper/search?query="+encodeURIComponent(q)+"&offset="+((page-1)*n)+"&limit="+n+p,{name:"Semantic Scholar",timeout:15000})
      .then(function(d){return {total:d&&d.total,items:((d&&d.data)||[]).map(S.fromS2)};});}});
S.fromS2=function(w){var x=w.externalIds||{},doi=cleanDOI(x.DOI),pt=(w.publicationTypes||[]).join(" ").toLowerCase(),j=w.journal||{};var arx=x.ArXiv||"";
  var pre=!!arx&&!doi||/preprint/.test(pt);
  return {kind:"paper",src:"s2",title:LV.text(w.title||""),doi:doi,year:w.year||"",date:w.publicationDate||"",authors:(w.authors||[]).map(function(a){return {name:a.name||"",s2:a.authorId||""};}).filter(function(a){return a.name;}),
    venue:j.name||w.venue||"",venueType:/journalarticle|review/.test(pt)?"journal":"",type:/review/.test(pt)?"review":/book/.test(pt)?"book":/dataset/.test(pt)?"dataset":pre?"preprint":/journalarticle/.test(pt)?(titleKind(w.title)||"article"):(pt.split(" ")[0]||"article"),
    preprint:pre,doaj:false,oa:!!w.isOpenAccess,oaUrl:w.openAccessPdf&&w.openAccessPdf.url||"",pdf:w.openAccessPdf&&w.openAccessPdf.url||"",cites:w.citationCount||0,retracted:false,abstract:LV.text(w.abstract||""),
    volume:j.volume||"",pages:(j.pages||"").replace(/\s/g,"").replace("-","–"),pmid:x.PubMed||"",s2id:w.paperId||"",arxiv:arx,url:doi?("https://doi.org/"+doi):("https://www.semanticscholar.org/paper/"+w.paperId)};};

/* ---------- vetting, in Ingenium's words ---------- */
var TN={editorial:["Editorial","Éditorial"],letter:["Letter","Lettre"],comment:["Comment","Commentaire"],news:["News","Actualité"],erratum:["Erratum","Erratum"],correction:["Correction","Correction"],
  patent:["Patent","Brevet"],thesis:["Thesis","Thèse"],paratext:["Paratext","Paratexte"],retraction:["Retraction notice","Avis de rétractation"]};
S.typeName=function(t){var m={article:["Journal article","Article de revue"],review:["Review","Revue de littérature"],preprint:["Preprint","Prépublication"],book:["Book","Livre"],"book-chapter":["Book chapter","Chapitre"],
  monograph:["Book","Livre"],dissertation:["Thesis","Thèse"],thesis:["Thesis","Thèse"],dataset:["Dataset","Jeu de données"],"proceedings-article":["Conference paper","Communication"]}[t]||TN[t];
  return m?T(m[0],m[1]):(t?t.charAt(0).toUpperCase()+t.slice(1).replace(/-/g," "):T("Scholarly record","Notice savante"));};
S.vet=function(x){var checks=[],trust="low";
  if(x.preprint){checks.push(T("Preprint: not peer-reviewed","Prépublication : non évaluée par les pairs"));trust="low";}
  else if(TN[x.type]){checks.push(S.typeName(x.type)+(x.venue&&x.venueType==="journal"?T(" in "," dans ")+x.venue:"")+T(": not a research article"," : pas un article de recherche"));trust="low";}
  else if(x.venueType==="journal"||x.type==="article"||x.type==="review"){
    if(x.doaj){checks.push(T("Journal article; peer review confirmed (journal listed in DOAJ)","Article de revue ; évaluation par les pairs confirmée (revue listée dans le DOAJ)"));trust="high";}
    else{checks.push(T("Journal article","Article de revue")+(x.venue?T(" in "," dans ")+x.venue:"")+T("; peer review not independently confirmed","; évaluation par les pairs non confirmée de façon indépendante"));trust="medium";}}
  else if(/book/.test(x.type)||x.type==="monograph"){checks.push(T("Book or chapter","Livre ou chapitre"));trust="medium";}
  else{checks.push(S.typeName(x.type));trust="medium";}
  checks.push(x.doi?T("DOI registered","DOI enregistré"):T("No DOI","Pas de DOI"));
  checks.push(T("No retraction listed","Aucune rétractation signalée")+" ("+(x.srcs||[x.src]).map(function(s){return (SRC[s]||{}).name||s;}).join(", ")+")");
  if(x.oa)checks.push(T("Open access","Libre accès"));if(x.cites)checks.push(T("Cited ","Cité ")+LV.plural(x.cites,"time","times","fois","fois"));
  x.vet={trust:trust,checks:checks,label:checks[0]};return x;};
var TRUST={high:3,medium:2,low:1};

/* ---------- joining the sources ---------- */
function keyOf(x){return x.doi?"doi:"+x.doi:"t:"+LV.fold(x.title).replace(/[^\p{L}\p{N}]+/gu,"").slice(0,90)+":"+(x.year||"");}
S.keyOf=keyOf;
function absorb(o,x){if(!o.srcs)o.srcs=[o.src];if(o.srcs.indexOf(x.src)<0)o.srcs.push(x.src);
  ["abstract","venue","publisher","issn","volume","issue","pages","pmid","pmcid","oaid","s2id","arxiv","date","lang","oaUrl","pdf"].forEach(function(k){if(!o[k]&&x[k])o[k]=x[k];});
  if(x.abstract&&o.abstract&&x.abstract.length>o.abstract.length*1.4)o.abstract=x.abstract;
  if(x.doaj)o.doaj=true;if(x.oa)o.oa=true;o.cites=Math.max(o.cites||0,x.cites||0);if(!o.year&&x.year)o.year=x.year;
  if(x.authors&&x.authors.length>(o.authors||[]).length&&x.src==="crossref")o.authors=x.authors;
  else if((!o.authors||!o.authors.length)&&x.authors)o.authors=x.authors;
  if(o.authors&&x.authors&&x.src==="openalex")o.authors.forEach(function(a,i){if(!a.oa&&x.authors[i]&&LV.fold(x.authors[i].name).split(" ").pop()===LV.fold(a.name).split(" ").pop())a.oa=x.authors[i].oa;});
  if(o.venueType!=="journal"&&x.venueType==="journal"&&!o.preprint)o.venueType="journal";
  if(x.preprint===false&&o.preprint&&x.venueType==="journal"&&o.src!=="openalex"){o.preprint=false;o.type=x.type;}
  if(x.retracted)o.retracted=true;}
S.absorb=absorb;
function rel(words,x){if(!words.length)return 1;var t=LV.fold(x.title+" "+(x.abstract||"")),n=0;words.forEach(function(w){if(t.indexOf(w)>=0)n++;});return n/words.length;}
function relTitle(words,x){if(!words.length)return 0;var t=LV.fold(x.title),n=0;words.forEach(function(w){if(t.indexOf(w)>=0)n++;});return n/words.length;}
/* one batch from every source, joined into one list in the order the chosen sort asks for */
S.merge=function(lists,q,f,seen){var words=LV.words(q).filter(function(w){return w.length>=3;}),by={},out=[];
  var vers={};function vkey(x){var t=LV.fold(x.title).replace(/[^\p{L}\p{N}]+/gu," ").trim();if(t.split(" ").length<4||!x.year)return "";var a=(x.authors||[])[0];
    return t+"|"+x.year+"|"+(a?LV.fold(a.family||String(a.name).split(/\s+/).pop()).replace(/[^a-z]/g,""):"");}
  if(seen)seen.forEach(function(o){var v=vkey(o);if(v)vers[v]=o;});
  lists.forEach(function(L){(L.items||[]).forEach(function(x,i){if(!x||!x.title||x.retracted)return;var k=keyOf(x);x.id="p:"+k;
    var w=(SRC[x.src]||{}).weight||.8,sc=w/(8+i),v=vkey(x);
    if(by[k]){absorb(by[k],x);by[k].score+=sc;return;}
    if(seen&&seen.has(k)){var o=seen.get(k);if(o)absorb(o,x);return;}
    if(v&&vers[v]){absorb(vers[v],x);if(vers[v].score!=null)vers[v].score+=sc;return;}
    x.srcs=[x.src];x.score=sc;by[k]=x;if(v)vers[v]=x;out.push(x);});});
  out=out.filter(function(x){x.rel=rel(words,x);x.relT=relTitle(words,x);if(x.retracted)return false;
    if(words.length>=2&&x.rel<0.34)return false;if(f.oa&&!x.oa)return false;if(f.peer&&(x.preprint||TN[x.type]))return false;return true;});
  out.forEach(function(x){S.vet(x);x.score+=x.relT*.05+x.rel*.03+Math.min(x.srcs.length-1,3)*.012;});
  var sort=f.sort||"rel";
  out.sort(function(a,b){if(sort==="cited")return (b.cites||0)-(a.cites||0)||b.score-a.score;
    if(sort==="new")return String(b.date||b.year||"").localeCompare(String(a.date||a.year||""))||b.score-a.score;
    if(sort==="old")return String(a.date||a.year||"9999").localeCompare(String(b.date||b.year||"9999"))||b.score-a.score;
    if(sort==="trust")return TRUST[b.vet.trust]-TRUST[a.vet.trust]||b.score-a.score;
    return b.score-a.score||TRUST[b.vet.trust]-TRUST[a.vet.trust];});
  if(seen)out.forEach(function(x){seen.set(keyOf(x),x);});
  return out;};

/* ---------- one work, in full; who cites it; what it cites; what is like it; an author ---------- */
S.work=function(id){var m;
  if((m=/^doi:(.+)$/.exec(id))||(m=/^(10\.\d{4,9}\/.+)$/.exec(id))){var doi=cleanDOI(m[1]);
    return LV.fetch("https://api.openalex.org/works/doi:"+encodeURIComponent(doi)+"?select="+OA_SELECT+",related_works,referenced_works,topics,locations"+oaKey()+oaMail(),{name:"OpenAlex"})
      .then(full,function(){return LV.fetch("https://api.crossref.org/works/"+encodeURIComponent(doi)+(mail()?"?mailto="+encodeURIComponent(mail()):""),{name:"Crossref"}).then(function(d){var x=S.fromCrossref(d.message||{});x.srcs=["crossref"];return S.vet(x);});});}
  if((m=/^oa:(W\d+)$/i.exec(id))||(m=/^(W\d+)$/.exec(id)))return LV.fetch("https://api.openalex.org/works/"+m[1]+"?select="+OA_SELECT+",related_works,referenced_works,topics,locations"+oaKey()+oaMail(),{name:"OpenAlex"}).then(full);
  if((m=/^pmid:(\d+)$/.exec(id)))return LV.fetch("https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=EXT_ID:"+m[1]+"%20AND%20SRC:MED&format=json&resultType=core",{name:"Europe PMC"})
    .then(function(d){var r=d&&d.resultList&&d.resultList.result&&d.resultList.result[0];if(!r)throw new Error(T("Not found","Introuvable"));var x=S.fromEPMC(r);x.srcs=["europepmc"];return S.vet(x);});
  return Promise.reject(new Error(T("Not found","Introuvable")));
  function full(w){var x=fromOpenAlex(w);x.srcs=["openalex"];x.related=(w.related_works||[]).map(function(u){return String(u).replace(/^https:\/\/openalex\.org\//,"");});
    x.topics=(w.topics||[]).slice(0,4).map(function(t){return t.display_name;});
    x.versions=(w.locations||[]).map(function(l){return {name:(l.source&&l.source.display_name)||LV.host(l.landing_page_url||""),url:l.landing_page_url||l.pdf_url||"",pdf:l.pdf_url||"",version:l.version||"",oa:!!l.is_oa};}).filter(function(v){return v.url;}).slice(0,12);
    return S.vet(x);}};
S.citedBy=function(oaid,page,sort){return S.openalexList("filter="+encodeURIComponent("cites:"+oaid)+(sort==="new"?"&sort=publication_date:desc":"&sort=cited_by_count:desc"),page,10).then(vetAll);};
S.refs=function(oaid,page){return S.openalexList("filter="+encodeURIComponent("cited_by:"+oaid)+"&sort=cited_by_count:desc",page,10).then(vetAll);};
S.related=function(oaid,page){return S.openalexList("filter="+encodeURIComponent("related_to:"+oaid)+"&sort=cited_by_count:desc",page,10).then(vetAll);};
S.byAuthor=function(aid,page,sort){return S.openalexList("filter="+encodeURIComponent("author.id:"+aid)+(sort==="new"?"&sort=publication_date:desc":"&sort=cited_by_count:desc"),page,10).then(vetAll);};
/* when OpenAlex cannot answer, Semantic Scholar is asked who cites a DOI */
S.citedByS2=function(doi,page){return LV.fetch("https://api.semanticscholar.org/graph/v1/paper/DOI:"+encodeURIComponent(doi)+"/citations?fields=title,year,authors,venue,citationCount,externalIds,isOpenAccess,publicationTypes,journal&offset="+((page-1)*10)+"&limit=10",{name:"Semantic Scholar"})
  .then(function(d){return {items:((d&&d.data)||[]).map(function(c){return c.citingPaper;}).filter(Boolean).map(S.fromS2).map(function(x){x.srcs=["s2"];x.id="p:"+keyOf(x);return S.vet(x);})};});};
function vetAll(r){r.items.forEach(function(x){x.srcs=["openalex"];x.id="p:"+keyOf(x);S.vet(x);});return r;}
S.author=function(aid){return LV.fetch("https://api.openalex.org/authors/"+encodeURIComponent(aid)+"?select=id,display_name,orcid,works_count,cited_by_count,summary_stats,last_known_institutions,topics,counts_by_year"+oaKey()+oaMail(),{name:"OpenAlex"})
  .then(function(a){return {id:aid,name:a.display_name,orcid:a.orcid||"",works:a.works_count||0,cites:a.cited_by_count||0,h:(a.summary_stats||{}).h_index,i10:(a.summary_stats||{}).i10_index,
    inst:(a.last_known_institutions||[]).map(function(i){return i.display_name;}).filter(Boolean).slice(0,3),topics:(a.topics||[]).slice(0,6).map(function(t){return t.display_name;}),
    years:(a.counts_by_year||[]).slice(0,10).reverse()};});};

/* ---------- citations: CSL-JSON, then citeproc-js with the family's styles ---------- */
S.STYLES=[["apa","APA (7th)"],["modern-language-association","MLA (9th)"],["chicago-author-date","Chicago (author–date)"],["chicago-notes-bibliography","Chicago (notes)"],
  ["harvard-cite-them-right","Harvard (Cite Them Right)"],["ieee","IEEE"],["nature","Nature"],["mhra-notes","MHRA"],["oscola","OSCOLA"]];
var CSLT={article:"article-journal",review:"article-journal",editorial:"article-journal",letter:"article-journal",comment:"article-journal",erratum:"article-journal",preprint:"article",book:"book","book-chapter":"chapter",
  monograph:"book",dissertation:"thesis",thesis:"thesis",dataset:"dataset","proceedings-article":"paper-conference"};
S.toCSL=function(x){var c={id:x.cslId||("lv"+Math.abs(hash(keyOf(x)))),type:CSLT[x.type]||(x.kind==="book"?"book":x.kind==="paper"?"article-journal":"webpage"),title:x.title};
  c.author=(x.authors||[]).map(function(a){if(a.family)return {family:a.family,given:a.given||""};var s=splitName(a.name);return s.family?s:{literal:s.literal||a.name};});
  if(x.book&&x.book.authors)c.author=x.book.authors.map(function(n){var s=splitName(n);return s.family?s:{literal:n};});
  var y=x.year||(x.book&&x.book.year);if(x.date&&/^\d{4}-\d{2}(-\d{2})?/.test(x.date)){var p=x.date.split("-").map(Number).slice(0,3);c.issued={"date-parts":[p]};}else if(y)c.issued={"date-parts":[[+y]]};
  if(x.venue)c["container-title"]=x.venue;if(x.volume)c.volume=String(x.volume);if(x.issue)c.issue=String(x.issue);if(x.pages)c.page=String(x.pages);
  if(x.doi)c.DOI=x.doi;if(x.publisher||(x.book&&x.book.publisher))c.publisher=x.publisher||x.book.publisher;if(x.issn)c.ISSN=x.issn;if(x.book&&x.book.isbn)c.ISBN=x.book.isbn;
  if(!x.doi&&x.url)c.URL=x.url;if(x.preprint&&x.venue)c.genre="Preprint";if(x.abstract)c.abstract=x.abstract;
  if(c.type==="webpage"){c["container-title"]=LV.host(x.url);c.URL=x.url;c.accessed={"date-parts":[[new Date().getFullYear(),new Date().getMonth()+1,new Date().getDate()]]};}
  return c;};
function hash(s){var h=0;for(var i=0;i<s.length;i++){h=((h<<5)-h)+s.charCodeAt(i);h|=0;}return h;}
var CP=null,STY={},LOC={};
function loadCiteproc(){if(window.CSL)return Promise.resolve(window.CSL);if(CP)return CP;
  CP=LV.script("citeproc.js",function(){return !!window.CSL;}).then(function(){return window.CSL;},function(){CP=null;throw new Error(T("The citation engine could not be opened.","Le moteur de citation n’a pas pu s’ouvrir."));});return CP;}
function text(u,box,k){if(box[k])return Promise.resolve(box[k]);return LV.res(u).then(function(t){box[k]=t;return t;});}
/* format(list of works, style) -> {entries:[html], cite:"(Author, 2020)"} */
S.format=function(works,style){var csl=works.map(S.toCSL);
  return loadCiteproc().then(function(CSL){return text("csl/"+style+".csl",STY,style).then(function(xml){
    var lang=/harvard|oscola|mhra/.test(style)?"en-GB":"en-US";return text("csl/locales-"+lang+".xml",LOC,lang).then(function(loc){
      var by={};csl.forEach(function(c){by[c.id]=c;});
      var e=new CSL.Engine({retrieveLocale:function(){return loc;},retrieveItem:function(id){return by[id];}},xml,lang);
      try{e.opt.development_extensions.wrap_url_and_doi=false;}catch(x){}
      e.setOutputFormat("html");e.updateItems(csl.map(function(c){return c.id;}));
      var b=e.makeBibliography(),entries=b?b[1].map(function(h){return h.trim();}):[];
      var note=/class="note"/.test(xml),cite="";
      try{var r=e.processCitationCluster({citationItems:csl.map(function(c){return {id:c.id};}),properties:{noteIndex:note?1:0}},[],[]);cite=(r[1][0]&&r[1][0][1])||"";}catch(x){}
      return {entries:entries,cite:cite,note:note};});});});};
/* BibTeX and RIS, the two forms Fontes and Inkwell read (and nearly every reference manager) */
S.bibtex=function(works){return works.map(function(x){var c=S.toCSL(x),y=(c.issued&&c.issued["date-parts"][0][0])||"",fa=(c.author&&c.author[0]&&(c.author[0].family||c.author[0].literal)||"anon");
  var key=LV.fold(fa).replace(/[^a-z]/g,"")+y+LV.fold((x.title||"").split(/\s+/).filter(function(w){return w.length>3;})[0]||"").replace(/[^a-z]/g,"");
  var ty={"article-journal":"article",book:"book",chapter:"incollection",thesis:"phdthesis","paper-conference":"inproceedings",dataset:"misc",article:"misc",webpage:"misc"}[c.type]||"misc";
  function nb(s){return String(s==null?"":s).replace(/[{}]/g,"");}
  var f=[["author",(c.author||[]).map(function(a){return a.family?(nb(a.family)+(a.given?", "+nb(a.given):"")):"{"+nb(a.literal)+"}";}).join(" and ")],["title","{"+nb(c.title)+"}"],
    [ty==="incollection"?"booktitle":"journal",ty==="article"?c["container-title"]:ty==="incollection"?c["container-title"]:""],["year",y],["volume",c.volume],["number",c.issue],["pages",(c.page||"").replace("–","--")],
    ["publisher",c.publisher],["doi",c.DOI],["url",c.URL],["isbn",c.ISBN],["issn",c.ISSN],["note",x.preprint?"Preprint":""]];
  return "@"+ty+"{"+(key||"ref")+",\n"+f.filter(function(p){return p[1];}).map(function(p){return "  "+p[0]+" = {"+(p[0]==="author"||p[0]==="title"?String(p[1]):nb(p[1]))+"}";}).join(",\n")+"\n}";}).join("\n\n")+"\n";};
S.ris=function(works){return works.map(function(x){var c=S.toCSL(x),ty={"article-journal":"JOUR",book:"BOOK",chapter:"CHAP",thesis:"THES","paper-conference":"CPAPER",dataset:"DATA",article:"UNPB",webpage:"ELEC"}[c.type]||"GEN";
  var L=["TY  - "+ty];(c.author||[]).forEach(function(a){L.push("AU  - "+(a.family?a.family+(a.given?", "+a.given:""):a.literal));});L.push("TI  - "+c.title);
  if(c["container-title"])L.push((ty==="JOUR"?"JO":"T2")+"  - "+c["container-title"]);if(c.issued)L.push("PY  - "+c.issued["date-parts"][0][0]);
  if(c.volume)L.push("VL  - "+c.volume);if(c.issue)L.push("IS  - "+c.issue);if(c.page){var pp=c.page.split(/[–-]/);L.push("SP  - "+pp[0]);if(pp[1])L.push("EP  - "+pp[1]);}
  if(c.publisher)L.push("PB  - "+c.publisher);if(c.DOI)L.push("DO  - "+c.DOI);if(c.URL)L.push("UR  - "+c.URL);if(c.ISBN)L.push("SN  - "+c.ISBN);else if(c.ISSN)L.push("SN  - "+c.ISSN);
  if(c.abstract)L.push("AB  - "+c.abstract);L.push("ER  - ");return L.join("\r\n");}).join("\r\n\r\n")+"\r\n";};
S.cslJSON=function(works){return JSON.stringify(works.map(S.toCSL),null,2);};
})();
