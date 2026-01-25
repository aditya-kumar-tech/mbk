console.log("🟢 MBK: Loader Init");

(function(){

/* ================= CONFIG ================= */
const BASE = "https://api.mandibhavkhabar.com/data/gs/";
let goldCfg=null, silverCfg=null;
let ready = {css:false, gviz:false, gold:false, silver:false};

/* ================= CSS LOAD ================= */
(function loadCSS(){
  const l=document.createElement("link");
  l.rel="stylesheet";
  l.href=BASE+"core/rates-ui.css";
  l.onload=()=>{ready.css=true; checkStart();}
  l.onerror=()=>console.warn("❌ CSS load failed");
  document.head.appendChild(l);
})();

/* ================= GVIZ LOAD ================= */
(function loadGViz(){
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
  goldCfg  = await safeFetchJSON(BASE+"gold-groups.json");
  silverCfg= await safeFetchJSON(BASE+"silver-groups.json");

  ready.gold = !!goldCfg;
  ready.silver = !!silverCfg;
  checkStart();
})();

/* ================= VARIABLE DETECTOR ================= */
function detectRequest(){
  let req={};

  if(window.gctqury){ 
    req.type="gold";
    req.q=window.gctqury;
  }
  if(window.sctqury){
    req.type="silver";
    req.q=window.sctqury;
  }
  if(window.mtype){
    req.type=window.mtype.toLowerCase();
  }

  return req;
}

/* ================= MAIN START ================= */
function checkStart(){
  if(!ready.css || !ready.gviz) return;
  const req=detectRequest();
  if(!req.type) return;

  if(req.type==="gold" && ready.gold){
    console.log("🟢 MBK: golddata START");
    callGold(req.q);
  }

  if(req.type==="silver" && ready.silver){
    console.log("🟢 MBK: silverdata START");
    callSilver(req.q);
  }
}

/* ================= AUTO RETRY (TIMING FIX) ================= */
function waitForTables(fn){
  let tries=0;
  const timer=setInterval(()=>{
    tries++;
    if(document.querySelector(".price-table") || tries>10){
      clearInterval(timer);
      fn();
    }
  },500);
}

/* ================= GOLD CALL ================= */
function callGold(q){
  waitForTables(()=>golddata(q,"gold"));
}

/* ================= SILVER CALL ================= */
function callSilver(q){
  waitForTables(()=>Silverdata(q,"Silver"));
}

})();
