/* =====================================================
   UNIVERSAL LOADER FINAL
   Gold + Silver | JSON SAFE | Chart AUTO | Pages SAFE
   ===================================================== */

(function(){

/* ---------------- BASIC UTILS ---------------- */

const RUPEE = "₹";
const MAX_RETRY = 3;

function rupee(v){
  return RUPEE + Number(v).toLocaleString("hi-IN");
}

function log(...a){ console.log("🔵", ...a); }
function err(...a){ console.warn("🔴", ...a); }

/* ---------------- AUTO LOAD CHART.JS ---------------- */

function loadChartJS(cb){
  if(window.Chart){ cb(); return; }
  const s=document.createElement("script");
  s.src="https://cdn.jsdelivr.net/npm/chart.js";
  s.onload=cb;
  document.head.appendChild(s);
}

loadChartJS(()=>log("✅ Chart.js ready"));

/* ---------------- CONFIG CACHE ---------------- */

let gsConfig = null;
let ssConfig = null;

/* ---------------- SAFE FIND CONFIG ---------------- */
/* JSON range = ARRAY OF VALUES (NOT MIN-MAX) */

function findCfg(map, num){
  for(const k in map){
    const r = map[k].range;
    if(Array.isArray(r) && r.includes(num)){
      return {
        id: map[k].id,
        off: r.indexOf(num)
      };
    }
  }
  return null;
}

/* ---------------- FETCH JSON ---------------- */

function fetchJSON(url){
  return fetch(url).then(r=>{
    if(!r.ok) throw "fetch failed";
    return r.json();
  });
}

/* ---------------- GOLD ---------------- */

window.golddata = function(gctqury){
  runGold(gctqury, 0);
};

function runGold(q, retry){
  if(!gsConfig){
    fetchJSON("https://aditya-kumar-tech.github.io/mbk/data/gs/gold-groups.json")
      .then(j=>{
        gsConfig=j;
        log("✅ Gold config loaded");
        runGold(q, retry);
      })
      .catch(()=>err("Gold config load failed"));
    return;
  }

  const n = Number(q.replace(/\D/g,""));
  const cfg = findCfg(gsConfig, n);

  if(!cfg){
    err("Gold config not found for", q);
    return;
  }

  const url =
    "https://docs.google.com/spreadsheets/d/" +
    cfg.id +
    "/gviz/tq?tqx=out:json";

  fetch(url)
    .then(r=>r.text())
    .then(txt=>{
      const json = JSON.parse(txt.substr(47).slice(0,-2));
      renderGold(json, cfg.off);
    })
    .catch(e=>{
      if(retry < MAX_RETRY){
        err("Gold fetch retry", retry+1);
        runGold(q, retry+1);
      }
    });
}

function renderGold(data, off){
  const rows = data.table.rows;

  const today22 = rows[off].c[1].v;
  const today24 = rows[off].c[2].v;

  if(window.gold_pricet)
    gold_pricet.textContent = rupee(today24);

  if(window.gold_price22)
    gold_price22.textContent = rupee(today22);

  renderGoldGraph(rows);
}

function renderGoldGraph(rows){
  if(!document.getElementById("gold_graph")) return;
  if(!window.Chart) return;

  const labels = rows.map(r=>r.c[0].v);
  const data24 = rows.map(r=>r.c[2].v);

  const ctx = document.getElementById("gold_graph").getContext("2d");
  new Chart(ctx,{
    type:"line",
    data:{
      labels,
      datasets:[{
        label:"24K Gold",
        data:data24,
        borderWidth:2
      }]
    }
  });
}

/* ---------------- SILVER ---------------- */

window.Silverdata = function(sctqury){
  runSilver(sctqury,0);
};

function runSilver(q, retry){
  if(!ssConfig){
    fetchJSON("https://aditya-kumar-tech.github.io/mbk/data/gs/silver-groups.json")
      .then(j=>{
        ssConfig=j;
        log("✅ Silver config loaded");
        runSilver(q,retry);
      })
      .catch(()=>err("Silver config load failed"));
    return;
  }

  const n = Number(q.replace(/\D/g,""));
  const cfg = findCfg(ssConfig,n);

  if(!cfg){
    err("Silver config not found for", q);
    return;
  }

  const url =
    "https://docs.google.com/spreadsheets/d/" +
    cfg.id +
    "/gviz/tq?tqx=out:json";

  fetch(url)
    .then(r=>r.text())
    .then(txt=>{
      const json = JSON.parse(txt.substr(47).slice(0,-2));
      renderSilver(json, cfg.off);
    })
    .catch(e=>{
      if(retry < MAX_RETRY){
        err("Silver fetch retry", retry+1);
        runSilver(q, retry+1);
      }
    });
}

function renderSilver(data, off){
  const rows = data.table.rows;

  const todayKg = rows[off].c[1].v;

  /* 🔴 ₹ ENTITY FIX (NO innerHTML) */
  if(window.silvr_pricet)
    silvr_pricet.textContent = rupee(todayKg);

  renderSilverGraph(rows);
}

function renderSilverGraph(rows){
  if(!document.getElementById("silvr_graf")) return;
  if(!window.Chart) return;

  const labels = rows.map(r=>r.c[0].v);
  const prices = rows.map(r=>r.c[1].v);

  const ctx = document
    .getElementById("silvr_graf")
    .appendChild(document.createElement("canvas"))
    .getContext("2d");

  new Chart(ctx,{
    type:"line",
    data:{
      labels,
      datasets:[{
        label:"Silver / Kg",
        data:prices,
        borderWidth:2
      }]
    }
  });
}

})();
