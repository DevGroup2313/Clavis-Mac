/* CLAVIS · THE SEAL, IN LAYERS. The seal is five pictures stacked in depth (the plate, its rays, the two keys, the open
   book and the rubies), drawn by tools/clavis_seal.py and carried inside the page. Small, in the bar, it is one picture.
   Large (the welcome card, the home page, About), it is a stage: the layers stand at their own depths, so the seal tilts
   towards the pointer with the keys and the book above the plate; and with Motion at Full it arrives with a spring,
   sways when left alone, turns its rays slowly, lets the keys float, breathes a gold light behind it, sweeps a shine
   across its gold and lets a spark glint on the rubies and the wards, one at a time. Pressing it stamps a ring outwards,
   as Carpe Diem's seal does at its door. Calm slows it; Still, and a device that asks for less motion, keep it still. */
(function(){
"use strict";
var LV=window.LV,UI=LV.ui,h=LV.h;
var LAYERS=["plate","rays","keys","book","gem"];
function src(part){var S=window.LV_SEALS||{},d=LV.night()?S.night:S.day;return (d&&d[part])||"";}
UI.seal=function(cls){cls=cls||"seal-mini";
  var w=h("span."+cls,{"data-seal":"auto",role:"img","aria-label":"Clavis"});
  if(cls==="seal-mini"){w.appendChild(h("img",{src:src("small"),alt:"",draggable:"false"}));return w;}
  w.classList.add("seal3d");
  var tilt=h("span.s3-tilt");
  LAYERS.forEach(function(k){tilt.appendChild(h("img.s3-l.s3-"+k,{src:src(k),alt:"",draggable:"false",decoding:"async"}));});
  tilt.appendChild(h("span.s3-shine",{"aria-hidden":"true"}));
  tilt.appendChild(h("span.s3-spark",{"aria-hidden":"true"}));
  w.appendChild(h("span.s3-glow",{"aria-hidden":"true"}));w.appendChild(tilt);w.appendChild(h("span.s3-stamp",{"aria-hidden":"true"}));
  /* the tilt follows the pointer anywhere over the card or page the seal stands on, never more than 12 degrees */
  var raf=0,tx=0,ty=0;
  function still(){return LV.S.motion==="still"||(LV.S.motion!=="full"&&window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches);}
  function move(e){if(still()||e.pointerType==="touch")return;var r=w.getBoundingClientRect();if(!r.width)return;
    tx=LV.clamp((e.clientX-(r.left+r.width/2))/(r.width/2),-1.5,1.5);ty=LV.clamp((e.clientY-(r.top+r.height/2))/(r.height/2),-1.5,1.5);if(!raf)raf=requestAnimationFrame(apply);}
  function apply(){raf=0;w.style.setProperty("--ry",(tx*8).toFixed(2)+"deg");w.style.setProperty("--rx",(-ty*8).toFixed(2)+"deg");w.classList.add("s3-live");}
  function leave(){w.classList.remove("s3-live");w.style.removeProperty("--rx");w.style.removeProperty("--ry");}
  setTimeout(function(){var zone=w.closest(".door-card,.home,.sheet")||w;zone.addEventListener("pointermove",move);zone.addEventListener("pointerleave",leave);},0);
  w.addEventListener("pointerdown",function(){w.classList.remove("s3-stamped");void w.offsetWidth;w.classList.add("s3-stamped");});
  return w;};
/* day and night: each picture follows */
LV.on("dress",function(){LV.qsa('[data-seal="auto"]').forEach(function(s){
  if(s.classList.contains("seal3d"))LV.qsa("img.s3-l",s).forEach(function(im){var m=/s3-(plate|rays|keys|book|gem)/.exec(im.className);if(m)im.src=src(m[1]);});
  else{var im=s.querySelector("img");if(im)im.src=src("small");}});});
})();
