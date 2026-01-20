!function(){
console.log("🚀 Universal Loader v11.3 - GViz Fixed");

/* ========= Chart Loader ========= */
function loadChart(cb){
 if(window.Chart) return cb();
 const s=document.createElement("script");
 s.src="https://cdn.jsdelivr.net/npm/chart.js";
 s.onload=cb; document.head.appendChild(s);
}

/* ========= GViz ========= */
function parseGViz(txt){
 try{
  txt=txt.replace(/^\s*\/\*O_o\*\/\s*/,"")
         .replace(/^google\.visualization\.Query\.setResponse\s*\(/,"")
         .replace(/\);?\s*$/,"");
  const r=(JSON.parse(txt).table.rows||[]);
  r.sort((a,b)=>new Date(b.c[0]?.f||b.c[0]?.v)-new Date(a.c[0]?.f||a.c[0]?.v));
  return r.slice(0,15);
 }catch(e){console.error("GViz parse failed",e);return[];}
}

function findCfg(map,n){
 for(const k in map){
  const r=map[k].range;
  if(Array.isArray(r)&&r.includes(n))
   return {id:map[k].id};
 }
 return null;
}

/* ================= SILVER ================= */
let silverCfg=null,silverQ=[];

function runSilver(){
 while(silverCfg && silverQ.length){
  const a=silverQ.shift();
  SilverdataSafe(a[0],a[1]);
 }
}

if(document.querySelector("#silvr_pricet")){
 fetch("https://aditya-kumar-tech.github.io/mbk/data/gs/silver-groups.json")
 .then(r=>r.json())
 .then(j=>{silverCfg=j;console.log("✔ Silver cfg");runSilver();});
}

window.SilverdataSafe=function(q){
 if(!silverCfg){silverQ.push([q]);console.log("⏳ Silver queued");return;}
 const num=parseInt(String(q).replace(/\D/g,""));
 const cfg=findCfg(silverCfg,num);
 if(!cfg) return console.warn("❌ Silver cfg missing",q);

 const url=`https://docs.google.com/spreadsheets/d/${cfg.id}/gviz/tq?tqx=out:json&sheet=silvweb&tq=select * limit 15`;
 fetch(url).then(r=>r.text()).then(t=>{
  const rows=parseGViz(t);
  if(!rows.length) return;
  const p=rows[0].c[2]?.v||0;
  silvr_pricet.innerHTML="₹"+p.toLocaleString("hi-IN");
 }).catch(e=>console.error("Silver GViz failed",e));
};

/* ================= GOLD ================= */
let goldCfg=null,goldQ=[];

function runGold(){
 while(goldCfg && goldQ.length){
  const a=goldQ.shift();
  golddataSafe(a[0],a[1]);
 }
}

if(document.querySelector("#g22kt")){
 fetch("https://aditya-kumar-tech.github.io/mbk/data/gs/gold-groups.json")
 .then(r=>r.json())
 .then(j=>{goldCfg=j;console.log("✔ Gold cfg");runGold();});
}

window.golddataSafe=function(q){
 if(!goldCfg){goldQ.push([q]);console.log("⏳ Gold queued");return;}
 const num=parseInt(String(q).replace(/\D/g,""));
 const cfg=findCfg(goldCfg,num);
 if(!cfg) return console.warn("❌ Gold cfg missing",q);

 const url=`https://docs.google.com/spreadsheets/d/${cfg.id}/gviz/tq?tqx=out:json&sheet=goldweb&tq=select * limit 15`;
 fetch(url).then(r=>r.text()).then(t=>{
  const rows=parseGViz(t);
  if(!rows.length) return;
  g22kt.textContent="₹"+(rows[0].c[1]?.v||0).toLocaleString("hi-IN");
  g24kt.textContent="₹"+(rows[0].c[3]?.v||0).toLocaleString("hi-IN");
 }).catch(e=>console.error("Gold GViz failed",e));
};

/* ========= refs ========= */
window.g22kt=document.querySelector("#g22kt");
window.g24kt=document.querySelector("#g24kt");
window.silvr_pricet=document.querySelector("#silvr_pricet");
window.udat=document.querySelector("#udat");

}();
