/* CLAVIS · OPENING. The dress first (so the page never flashes the wrong colours), then the bar, the keep on this
   device, the room the address names, and the welcome card. The keeper (sw.js) is asked to hold the app so it opens with
   no connection. */
(function(){
"use strict";
var LV=window.LV,T=LV.T,UI=LV.ui;
LV.dress();UI.bar();LV.support.init();
/* one render for each change of address, however many events announce it */
var pending=false;LV.on("route",function(){if(pending)return;pending=true;(window.requestAnimationFrame||setTimeout)(function(){pending=false;UI.render();});});
LV.on("library",function(){var b=document.getElementById("bar-library");if(b)b.setAttribute("title",LV.plural(LV.lib.items.length,"thing kept","things kept","élément gardé","éléments gardés"));});
LV.db.ready().then(function(){return Promise.all([LV.lib.load(),LV.later.load()]);}).then(function(){UI.render();UI.door();LV.cache.prune();},function(e){console.error(e);UI.render();UI.door();});
/* the connection coming and going */
function net(){LV.search.forget();UI.net();LV.toast(LV.online()?T("Back online.","De nouveau en ligne."):T("No connection: Clavis searches what this device keeps.","Pas de connexion : Clavis cherche dans ce que cet appareil garde."));}
window.addEventListener("online",net);window.addEventListener("offline",net);
/* "/" from anywhere goes to the search box; Esc puts away the time check */
document.addEventListener("keydown",function(e){var t=e.target,typing=t&&(t.tagName==="INPUT"||t.tagName==="TEXTAREA"||t.tagName==="SELECT"||t.isContentEditable);
  if(e.key==="/"&&!typing&&!e.ctrlKey&&!e.metaKey&&!e.altKey){var q=document.getElementById("q");if(q){e.preventDefault();q.focus();q.select();}}
  if(e.key==="Escape"){var n=document.getElementById("nudge");if(n)n.remove();}});
/* the keeper: the app itself, and the files it reads later, kept for opening with no connection */
if("serviceWorker" in navigator&&/^https?:$/.test(location.protocol)&&!/[?&]nosw\b/.test(location.search))
  window.addEventListener("load",function(){navigator.serviceWorker.register("sw.js").catch(function(){});});
})();
