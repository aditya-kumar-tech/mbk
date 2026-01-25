console.log("🟢 MBK: Loader Init");

(function(){

/* ================= CONFIG ================= */
const BASE = "https://api.mandibhavkhabar.com/data/gs/";
let goldCfg=null, silverCfg=null;

let ready = {
  dom:false,
  css:false,
  gviz:false,
  gold:false,
  silver:false
};

let started=false;

/* ================= DOM READY ================= */
if(document.readyState==="loading"){
  document.addEventListener("DOMContentLoaded", ()=>{
    ready.dom=true;
    console.log("🟢 MBK: DOM Ready");
    checkStart();
  });
}else{
  ready.dom=true;
}

/* ================= CSS LOAD ================= */
(function(){
  const l=document.createElement("link");
  l.rel="stylesheet";
  l.href=BASE+"core/rates-ui.css";
  l.onload=()=>{ready.css=true; checkStart();}
  l.onerror=()=>console.warn("❌ CSS load failed");
  document.head.appendChild(l);
})();

/* ================= GVIZ LOAD ================= */
(function(){
  const s=document.createElement("script");
  s.src="https://www.gstatic.com/charts/loader.js";
  s.onload=()=>{
    google.charts.load("current",{packages:["corechart","table"]});
    google.charts.setOnLoadCallback(()=>{
      ready.gviz=true;
      checkStart();
    });
  };
  document.head.appendChild(s);
})();

/* ================= SAFE JSON FETCH ================= */
async function safeFetchJSON(url){
  try{
    const r=await fetch(url,{cache:"no-store"});
    const t=await r.text();
    return JSON.parse(t);
  }catch(e){
    console.error("❌ JSON FAIL:",url,e);
    return null;
  }
}

/* ================= GROUP LOAD ================= */
(async function(){
  goldCfg   = await safeFetchJSON(BASE+"gold-groups.json");
  silverCfg = await safeFetchJSON(BASE+"silver-groups.json");

  ready.gold   = !!goldCfg;
  ready.silver = !!silverCfg;
  checkStart();
})();

/* ================= CITY EXTRACT ================= */
function extractCityNo(v){
  if(!v) return null;
  const m=String(v).match(/(\d+)/);
  return m ? parseInt(m[1],10) : null;
}

/* ================= VARIABLE DETECTOR ================= */
function detectRequest(){
  let req={};

  if(window.gctqury){
    req.type="gold";
    req.raw=window.gctqury;
    req.city=extractCityNo(window.gctqury);
  }

  if(window.sctqury){
    req.type="silver";
    req.raw=window.sctqury;
    req.city=extractCityNo(window.sctqury);
  }

  if(window.mtype){
    req.type=window.mtype.toLowerCase();
  }

  return req;
}

/* ================= MAIN START ================= */
function checkStart(){
  if(started) return;
  if(!ready.dom || !ready.css || !ready.gviz) return;

  const req=detectRequest();
  if(!req.type || !req.city) return;

  if(req.type==="gold" && ready.gold){
    started=true;
    console.log("🟢 MBK: golddata START after DOM", req.city);
    callGold(req.city);
  }

  if(req.type==="silver" && ready.silver){
    started=true;
    console.log("🟢 MBK: silverdata START after DOM", req.city);
    callSilver(req.city);
  }
}

/* ================= AUTO RETRY (TABLE SAFE) ================= */
function waitForTables(fn){
  let tries=0;
  const t=setInterval(()=>{
    tries++;
    if(document.querySelector(".price-table") || tries>15){
      clearInterval(t);
      fn();
    }
  },500);
}

/* ================= GOLD CALL ================= */
function callGold(city){
  waitForTables(()=>golddata(city,"gold"));
}

/* ================= SILVER CALL ================= */
function callSilver(city){
  waitForTables(()=>Silverdata(city,"Silver"));
}

})();
