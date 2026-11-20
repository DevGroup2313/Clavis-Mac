/* CLAVIS · ANSWERS THAT NEED NO CONNECTION. A sum, a conversion, a date, a word's meanings and its other words, and
   "did you mean" for a slip of the keys. Each is worked out here, on the device, by plain rules: nothing is guessed by a
   model and nothing is sent. The dictionary is Princeton's WordNet and the spelling list is SCOWL, the same two Inkwell
   carries (vendor/), read the first time they are needed. */
(function(){
"use strict";
var LV=window.LV,T=LV.T,A=LV.answers={};

/* ---------- the calculator: + - × ÷ ^ %, brackets, and the usual functions; no eval ---------- */
var FN={sqrt:Math.sqrt,cbrt:Math.cbrt,abs:Math.abs,ln:Math.log,log:Math.log10,log2:Math.log2,exp:Math.exp,round:Math.round,floor:Math.floor,ceil:Math.ceil,
  sin:function(x){return Math.sin(x*DEG);},cos:function(x){return Math.cos(x*DEG);},tan:function(x){return Math.tan(x*DEG);},
  asin:function(x){return Math.asin(x)/DEG;},acos:function(x){return Math.acos(x)/DEG;},atan:function(x){return Math.atan(x)/DEG;}};
var DEG=1,CONST={pi:Math.PI,"π":Math.PI,e:Math.E,tau:2*Math.PI,phi:(1+Math.sqrt(5))/2};
function tokens(s){var out=[],i=0;s=s.replace(/×/g,"*").replace(/÷/g,"/").replace(/−/g,"-").replace(/,(?=\d{3}\b)/g,"").replace(/\*\*/g,"^");
  while(i<s.length){var c=s[i];if(/\s/.test(c)){i++;continue;}
    var m=/^(\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?/i.exec(s.slice(i));if(m){out.push({t:"n",v:parseFloat(m[0])});i+=m[0].length;continue;}
    m=/^[a-zπ]+\d?/i.exec(s.slice(i));if(m){var w=m[0].toLowerCase();out.push(w in CONST?{t:"n",v:CONST[w]}:w in FN?{t:"f",v:w}:{t:"?",v:w});i+=m[0].length;continue;}
    if("+-*/^%()!".indexOf(c)>=0){out.push({t:c});i++;continue;}return null;}
  return out;}
function parse(tk){var i=0;function peek(){return tk[i];}function next(){return tk[i++];}
  function prim(){var t=next();if(!t)throw 0;
    if(t.t==="n"){var v=t.v;while(peek()&&peek().t==="!"){next();v=fact(v);}return v;}
    if(t.t==="f"){var a;if(peek()&&peek().t==="("){next();a=add();if(!next()||tk[i-1].t!==")")throw 0;}else a=un();return FN[t.v](a);}
    if(t.t==="("){var x=add();var c=next();if(!c||c.t!==")")throw 0;while(peek()&&peek().t==="!"){next();x=fact(x);}return x;}
    if(t.t==="-")return -pow();if(t.t==="+")return pow();throw 0;}
  function pow(){var b=prim();if(peek()&&peek().t==="^"){next();return Math.pow(b,un());}return b;}
  function un(){if(peek()&&peek().t==="-"){next();return -un();}if(peek()&&peek().t==="+"){next();return un();}return pow();}
  function mul(){var v=un();for(;;){var t=peek();if(!t)return v;
    if(t.t==="*"){next();v*=un();}else if(t.t==="/"){next();v/=un();}
    else if(t.t==="%"){next();var n=peek();if(n&&(n.t==="n"||n.t==="("||n.t==="f")){v=v%un();}else v=v/100;}
    else if(t.t==="n"||t.t==="("||t.t==="f"){v*=un();}else return v;}}
  function add(){var v=mul();for(;;){var t=peek();if(!t)return v;if(t.t==="+"){next();v+=mul();}else if(t.t==="-"){next();v-=mul();}else return v;}}
  var r=add();if(i!==tk.length)throw 0;return r;}
function fact(n){if(n<0||n!==Math.floor(n)||n>170)return NaN;var r=1;for(var k=2;k<=n;k++)r*=k;return r;}
function fmt(v){if(!isFinite(v))return null;if(Math.abs(v)>=1e15||(Math.abs(v)<1e-6&&v!==0))return v.toExponential(8).replace(/\.?0+e/,"e");
  var s=(Math.round(v*1e10)/1e10).toString();try{var p=s.split(".");return Number(p[0]).toLocaleString(LV.loc())+(p[1]?(LV.lang()==="fr"?",":".")+p[1]:"");}catch(e){return s;}}
A.calc=function(q){var s=String(q||"").trim().replace(/^(calc(ulate)?|what\s+is|what's|combien\s+font|calcule[rz]?)\s+/i,"").replace(/[=?]\s*$/,"");
  if(!/\d/.test(s)||!/[-+*/^%×÷!()]|sqrt|sin|cos|tan|log|ln|pi|π/i.test(s))return null;if(/^\d{4}-\d{2}-\d{2}$/.test(s))return null;
  if(/^[\d\s()+-]+$/.test(s)&&/^\+?\d[\d\s()-]{6,}$/.test(s))return null;  /* a telephone number, not a sum */
  var tk=tokens(s);if(!tk||!tk.length||tk.some(function(t){return t.t==="?";}))return null;
  try{var v=parse(tk.slice()),out=fmt(v);return out==null?null:{kind:"calc",q:s.replace(/\*/g,"×").replace(/\//g,"÷"),value:out,raw:v};}catch(e){return null;}};

/* ---------- conversions ---------- */
var U={ /* length in metres */
  len:{m:1,metre:1,metres:1,meter:1,meters:1,km:1000,kilometre:1000,kilometres:1000,kilometer:1000,kilometers:1000,cm:.01,centimetre:.01,centimetres:.01,centimeter:.01,centimeters:.01,
    mm:.001,millimetre:.001,millimetres:.001,millimeter:.001,millimeters:.001,mi:1609.344,mile:1609.344,miles:1609.344,yd:.9144,yard:.9144,yards:.9144,ft:.3048,foot:.3048,feet:.3048,
    "in":.0254,inch:.0254,inches:.0254,nmi:1852,"nautical mile":1852,"nautical miles":1852},
  mass:{kg:1,kilogram:1,kilograms:1,kilo:1,kilos:1,g:.001,gram:.001,grams:.001,gramme:.001,grammes:.001,mg:1e-6,milligram:1e-6,milligrams:1e-6,lb:.45359237,lbs:.45359237,pound:.45359237,pounds:.45359237,
    oz:.028349523125,ounce:.028349523125,ounces:.028349523125,st:6.35029318,stone:6.35029318,stones:6.35029318,t:1000,tonne:1000,tonnes:1000,ton:907.18474,tons:907.18474},
  vol:{l:1,litre:1,litres:1,liter:1,liters:1,ml:.001,millilitre:.001,millilitres:.001,milliliter:.001,milliliters:.001,cl:.01,dl:.1,gal:3.785411784,gallon:3.785411784,gallons:3.785411784,
    "uk gallon":4.54609,"uk gallons":4.54609,qt:.946352946,quart:.946352946,quarts:.946352946,pt:.473176473,pint:.473176473,pints:.473176473,"uk pint":.56826125,"uk pints":.56826125,
    cup:.2365882365,cups:.2365882365,tbsp:.01478676478,tablespoon:.01478676478,tablespoons:.01478676478,tsp:.00492892159,teaspoon:.00492892159,teaspoons:.00492892159,"fl oz":.0295735295625},
  area:{"m2":1,"sq m":1,"square metre":1,"square metres":1,"square meter":1,"square meters":1,"km2":1e6,"sq km":1e6,ha:1e4,hectare:1e4,hectares:1e4,acre:4046.8564224,acres:4046.8564224,
    "ft2":.09290304,"sq ft":.09290304,"square foot":.09290304,"square feet":.09290304,"mi2":2589988.110336,"sq mi":2589988.110336},
  speed:{"m/s":1,"km/h":1/3.6,kph:1/3.6,mph:.44704,knot:.514444,knots:.514444,kn:.514444},
  time:{s:1,sec:1,second:1,seconds:1,min:60,mins:60,minute:60,minutes:60,h:3600,hr:3600,hrs:3600,hour:3600,hours:3600,day:86400,days:86400,week:604800,weeks:604800,
    year:31557600,years:31557600},
  data:{b:1,byte:1,bytes:1,kb:1e3,mb:1e6,gb:1e9,tb:1e12,kib:1024,mib:1048576,gib:1073741824,tib:1099511627776,kilobyte:1e3,kilobytes:1e3,megabyte:1e6,megabytes:1e6,gigabyte:1e9,gigabytes:1e9,terabyte:1e12,terabytes:1e12},
  energy:{j:1,joule:1,joules:1,kj:1000,cal:4.184,kcal:4184,calorie:4184,calories:4184,kwh:3.6e6,wh:3600}};
var TEMP={c:"c","°c":"c",celsius:"c",centigrade:"c",f:"f","°f":"f",fahrenheit:"f",k:"k",kelvin:"k"};
function unitOf(w){w=String(w||"").toLowerCase().replace(/\.$/,"").trim();if(TEMP[w])return {dim:"temp",u:TEMP[w]};
  for(var d in U)if(Object.prototype.hasOwnProperty.call(U[d],w))return {dim:d,u:w,f:U[d][w]};
  if(/s$/.test(w))return unitOf(w.slice(0,-1));return null;}
function toC(v,u){return u==="c"?v:u==="f"?(v-32)*5/9:v-273.15;}
function fromC(v,u){return u==="c"?v:u==="f"?v*9/5+32:v+273.15;}
A.convert=function(q){var s=String(q||"").trim().toLowerCase().replace(/^convert\s+/,"").replace(/^(convertir|combien de)\s+/,"").replace(/\?$/,"");
  var m=/^(-?[\d.,]+)\s*([a-z°/²0-9 .]+?)\s+(?:in|to|into|as|en|vers|=)\s+([a-z°/²0-9 .]+)$/.exec(s);if(!m)return null;
  var v=parseFloat(m[1].replace(/,(?=\d{3}\b)/g,"").replace(",",".")),a=unitOf(m[2].replace("²","2")),b=unitOf(m[3].replace("²","2"));
  if(!isFinite(v)||!a||!b||a.dim!==b.dim)return null;
  var out=a.dim==="temp"?fromC(toC(v,a.u),b.u):v*a.f/b.f;
  return {kind:"convert",q:fmt(v)+" "+m[2].trim()+" =",value:fmt(out)+" "+m[3].trim(),raw:out};};

/* ---------- dates: today, the time, how many days until, what day a date falls on ---------- */
var MONTHS={january:0,jan:0,janvier:0,february:1,feb:1,"février":1,fevrier:1,march:2,mar:2,mars:2,april:3,apr:3,avril:3,may:4,mai:4,june:5,jun:5,juin:5,july:6,jul:6,juillet:6,
  august:7,aug:7,"août":7,aout:7,september:8,sep:8,sept:8,septembre:8,october:9,oct:9,octobre:9,november:10,nov:10,novembre:10,december:11,dec:11,"décembre":11,decembre:11};
function readDate(s){s=String(s||"").trim().toLowerCase().replace(/(\d)(st|nd|rd|th|er)\b/g,"$1");var m,now=new Date();
  if(s==="today"||s==="aujourd'hui"||s==="aujourd’hui")return new Date(now.getFullYear(),now.getMonth(),now.getDate());
  if(s==="tomorrow"||s==="demain")return new Date(now.getFullYear(),now.getMonth(),now.getDate()+1);
  if(s==="christmas"||s==="noël"||s==="noel")return next(11,25);if(s==="new year"||s==="new year's day"||s==="nouvel an")return next(0,1);
  if((m=/^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s)))return new Date(+m[1],+m[2]-1,+m[3]);
  if((m=/^(\d{1,2})\s+([a-zéû]+)\.?(?:\s+(\d{4}))?$/.exec(s))&&m[2] in MONTHS)return m[3]?new Date(+m[3],MONTHS[m[2]],+m[1]):next(MONTHS[m[2]],+m[1]);
  if((m=/^([a-zéû]+)\.?\s+(\d{1,2})(?:,?\s+(\d{4}))?$/.exec(s))&&m[1] in MONTHS)return m[3]?new Date(+m[3],MONTHS[m[1]],+m[2]):next(MONTHS[m[1]],+m[2]);
  return null;
  function next(mo,d){var y=now.getFullYear(),t=new Date(y,mo,d);if(t<new Date(now.getFullYear(),now.getMonth(),now.getDate()))t=new Date(y+1,mo,d);return t;}}
A.dates=function(q){var s=String(q||"").trim().toLowerCase().replace(/\?$/,""),m,now=new Date(),dl=LV.loc();
  if(/^(what('s| is) )?(the )?(time|current time)( now)?$|^quelle heure( est-il)?$|^heure$/.test(s))
    return {kind:"date",q:T("The time on this device","L’heure sur cet appareil"),value:now.toLocaleTimeString(dl,{hour:"numeric",minute:"2-digit"}),sub:now.toLocaleDateString(dl,{weekday:"long",day:"numeric",month:"long",year:"numeric"})};
  if(/^(what('s| is) )?(the )?(date|today'?s date|day)( today)?$|^(quelle est la )?date( d'aujourd'hui)?$|^quel jour( sommes-nous)?$/.test(s))
    return {kind:"date",q:T("Today","Aujourd’hui"),value:now.toLocaleDateString(dl,{weekday:"long",day:"numeric",month:"long",year:"numeric"})};
  if((m=/^(?:how many )?days?\s+(?:until|till|to|before)\s+(.+)$|^(?:combien de )?jours?\s+(?:avant|jusqu'à|jusqu’à)\s+(.+)$/.exec(s))){var d=readDate(m[1]||m[2]);if(!d)return null;
    var today=new Date(now.getFullYear(),now.getMonth(),now.getDate()),n=Math.round((d-today)/864e5);
    return {kind:"date",q:T("Days until ","Jours avant le ")+d.toLocaleDateString(dl,{weekday:"long",day:"numeric",month:"long",year:"numeric"}),value:LV.plural(n,"day","days","jour","jours")};}
  if((m=/^(?:what day (?:is|was|will be)|quel jour (?:est|était|sera))\s+(.+)$/.exec(s))){var d2=readDate(m[1]);if(!d2)return null;
    return {kind:"date",q:d2.toLocaleDateString(dl,{day:"numeric",month:"long",year:"numeric"}),value:d2.toLocaleDateString(dl,{weekday:"long"})};}
  return null;};

/* ---------- the dictionary (WordNet, as Inkwell's lexicon holds it) ----------
   vendor/wordnet-lex.txt has four kinds of line: S|pos|gloss|word:n;word:n (a meaning, in file order), W|word|level|
   register|pos:n,...|sense:n,h<sense>:n (a word and its meanings by number; "h" marks a meaning known only by its broader
   one), N (near meanings) and E|pos|form|base (irregular forms: "mice" is "mouse"). */
var WN=null,WNP=null;
A.loadWordNet=function(){if(WN)return Promise.resolve(WN);if(WNP)return WNP;
  WNP=LV.res("wordnet-lex.txt").then(function(t){var S=[],W=new Map(),E=new Map();
    t.split("\n").forEach(function(line){var c=line.charCodeAt(0);if(c!==83&&c!==87&&c!==69)return;var p=line.split("|");
      if(c===83){S.push({pos:p[1],gloss:p[2],lem:(p[3]||"").split(";").map(function(x){var i=x.lastIndexOf(":");return i>0?x.slice(0,i):x;}).filter(Boolean)});}
      else if(c===87){W.set(p[1].toLowerCase(),(p[5]||"").split(",").filter(Boolean).map(function(x){var h=x[0]==="h",q=(h?x.slice(1):x).split(":");return [+q[0],+q[1]||0,h];}));}
      else if(c===69){if(!E.has(p[2]))E.set(p[2],p[3]);}});
    WN={S:S,W:W,E:E};return WN;}).catch(function(e){WNP=null;throw e;});return WNP;};
var POS={n:"noun",v:"verb",a:"adjective",s:"adjective",r:"adverb"};
function baseForms(w){var f=[w];if(/ies$/.test(w))f.push(w.slice(0,-3)+"y");if(/(ses|xes|zes|ches|shes)$/.test(w))f.push(w.slice(0,-2));if(/men$/.test(w))f.push(w.slice(0,-3)+"man");if(/s$/.test(w))f.push(w.slice(0,-1));
  if(/ied$/.test(w))f.push(w.slice(0,-3)+"y");if(/ed$/.test(w)){f.push(w.slice(0,-2));f.push(w.slice(0,-1));if(/(.)\1ed$/.test(w))f.push(w.slice(0,-3));}
  if(/ing$/.test(w)){f.push(w.slice(0,-3));f.push(w.slice(0,-3)+"e");if(/(.)\1ing$/.test(w))f.push(w.slice(0,-4));}
  if(/ier$/.test(w))f.push(w.slice(0,-3)+"y");if(/iest$/.test(w))f.push(w.slice(0,-4)+"y");if(/er$/.test(w))f.push(w.slice(0,-2));if(/est$/.test(w))f.push(w.slice(0,-3));return f;}
A.define=function(word){word=String(word||"").trim().toLowerCase().replace(/^(define|definition of|meaning of|what does|définir|définition de|sens de|defini|sa .+ vle di)\s+/,"").replace(/\s+mean\??$/,"").replace(/[?.!]$/,"").trim();
  if(!word||word.split(/\s+/).length>3)return Promise.resolve(null);
  return A.loadWordNet().then(function(wn){var forms=[word];if(wn.E.has(word))forms.push(wn.E.get(word));forms=forms.concat(baseForms(word));var senses=null,form=word;
    for(var i=0;i<forms.length&&!senses;i++){var s=wn.W.get(forms[i]);if(s&&s.length){senses=s;form=forms[i];}}
    if(!senses)return null;
    var own=senses.filter(function(x){return !x[2];}),use=(own.length?own:senses).slice().sort(function(a,b){return b[1]-a[1];}).slice(0,8);
    var groups={};use.forEach(function(x){var syn=wn.S[x[0]];if(!syn)return;var pos=LV.T(POS[syn.pos]||"word");
      (groups[pos]=groups[pos]||[]).push({gloss:(x[2]?LV.T("a kind of ")+(syn.lem[0]||"")+": ":"")+syn.gloss,also:x[2]?[]:syn.lem.filter(function(w){return w.toLowerCase()!==form;}).slice(0,6)});});
    return Object.keys(groups).length?{kind:"define",word:form,groups:groups,source:"WordNet 3.0 (Princeton University)"}:null;});};

/* ---------- spelling (SCOWL): "did you mean" for a word the list does not hold ---------- */
var SP=null,SPP=null;
A.loadWords=function(){if(SP)return Promise.resolve(SP);if(SPP)return SPP;
  SPP=LV.res("scowl-words.txt").then(function(t){
    var set=new Map();t.split("\n").forEach(function(line){var i=line.indexOf(" ");if(i<0)return;var lvl=+line.slice(0,i)||60;
      line.slice(i+1).split(" ").forEach(function(w){if(!w)return;var k=w.toLowerCase().replace(/'s$/,"");if(!set.has(k))set.set(k,lvl);});});
    SP=set;return SP;}).catch(function(e){SPP=null;throw e;});return SPP;};
var AL="abcdefghijklmnopqrstuvwxyz";
function edits1(w){var out=[],i,c;for(i=0;i<=w.length;i++){
  if(i<w.length)out.push(w.slice(0,i)+w.slice(i+1));
  if(i<w.length-1)out.push(w.slice(0,i)+w[i+1]+w[i]+w.slice(i+2));
  for(c=0;c<26;c++){if(i<w.length)out.push(w.slice(0,i)+AL[c]+w.slice(i+1));out.push(w.slice(0,i)+AL[c]+w.slice(i));}}return out;}
function best(w,set){if(set.has(w))return w;var c=null,cl=99;edits1(w).forEach(function(x){var l=set.get(x);if(l!=null&&l<cl){cl=l;c=x;}});
  if(c&&cl<=50)return c;if(w.length>=5&&w.length<=12){var seen={};edits1(w).forEach(function(x){if(seen[x])return;seen[x]=1;edits1(x).forEach(function(y){var l=set.get(y);if(l!=null&&l<cl&&l<=35){cl=l;c=y;}});});}
  return c;}
/* only plain lower-case English words are checked; names, numbers and words in capitals are left as typed */
A.spell=function(q){if(LV.lang()==="fr"&&LV.wikiLang()==="fr")return Promise.resolve(null);
  var raw=String(q||"").trim();if(!raw||raw.length>80||/["\d:/@#]/.test(raw))return Promise.resolve(null);
  return A.loadWords().then(function(set){var changed=false,out=raw.split(/(\s+)/).map(function(tok){
      if(/^\s+$/.test(tok)||!/^[a-z]+$/.test(tok)||tok.length<3||set.has(tok))return tok;var b=best(tok,set);if(b&&b!==tok){changed=true;return b;}return tok;}).join("");
    return changed?out:null;}).catch(function(){return null;});};

/* which answer, if any, this query asks for (the dictionary only when asked, or for one plain word) */
A.detect=function(q,tab){var s=String(q||"").trim();if(!s)return Promise.resolve(null);
  var r=A.convert(s)||A.dates(s)||A.calc(s);if(r)return Promise.resolve(r);
  var asks=/^(define|definition of|meaning of|définir|définition de|sens de)\s+/i.test(s)||/^what does .+ mean\??$/i.test(s);
  if(asks||tab==="dictionary")return A.define(s).catch(function(){return null;});
  return Promise.resolve(null);};
})();
