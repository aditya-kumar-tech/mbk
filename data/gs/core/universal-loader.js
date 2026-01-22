(function(){
/* ======================================================
   ================== CONFIG =============================
   ====================================================== */
const DEBUG = true;
const log = (...a)=>DEBUG && console.log("[MBK]",...a);

const MANIFEST_URL = "gs-manifest.json";
const CACHE_NAME  = "MBK_GS_CACHE";
const CACHE_LIMIT = 25; // max files

/* ======================================================
   ================== UTILS ==============================
   ====================================================== */
const once = fn=>{let d;return(...a)=>d||(d=fn(...a))};
const has  = s=>document.querySelector(s);
const wait = t=>new Promise(r=>setTimeout(r,t));

/* ======================================================
   ================== MANIFEST ===========================
   ====================================================== */
let MANIFEST=null;

async function loadManifest(){
  if(MANIFEST) return MANIFEST;

  const r = await fetch(MANIFEST_URL);
  MANIFEST = await r.json();

  const v = MANIFEST.manifest_version;
  const pv = localStorage.getItem("mbk_manifest_v");

  if(v !== pv){
    log("♻️ Manifest changed → clearing cache");
    await caches.delete(CACHE_NAME);
    localStorage.setItem("mbk_manifest_v", v);
  }
  return MANIFEST;
}

/* ======================================================
   ================== CACHE + LRU ========================
   ====================================================== */
async function enforceLRU(cache){
  const keys = await cache.keys();
  if(keys.length <= CACHE_LIMIT) return;

  const extra = keys.length - CACHE_LIMIT;
  for(let i=0;i<extra;i++){
    await cache.delete(keys[i]);
  }
}

/* ======================================================
   ================== FILE LOADER ========================
   ====================================================== */
async function loadFile(url){
  const cache = await caches.open(CACHE_NAME);
  const hit = await cache.match(url);

  if(hit){
    log("📦 cache:", url);
    inject(url, await hit.text());
    return;
  }

  log("🌐 net:", url);
  const r = await fetch(url);
  const txt = await r.text();

  await cache.put(url, new Response(txt));
  await enforceLRU(cache);
  inject(url, txt);
}

function inject(url, txt){
  if(url.endsWith(".css")){
    if(document.querySelector(`style[data-src="${url}"]`)) return;
    const s=document.createElement("style");
    s.textContent=txt;
    s.dataset.src=url;
    document.head.appendChild(s);
  }

  if(url.endsWith(".js")){
    if(document.querySelector(`script[data-src="${url}"]`)) return;
    const s=document.createElement("script");
    s.textContent=txt;
    s.dataset.src=url;
    document.body.appendChild(s);
  }
}

/* ======================================================
   ================== MODULE LOADER ======================
   ====================================================== */
const moduleLocks = {};

async function ensureModule(name){
  if(moduleLocks[name]) return moduleLocks[name];

  moduleLocks[name] = (async()=>{
    const m = await loadManifest();
    const mod = m.modules[name];
    if(!mod) return false;

    // CSS first, JS after (safe order)
    const css = mod.files.filter(f=>f.endsWith(".css"));
    const js  = mod.files.filter(f=>f.endsWith(".js"));

    await Promise.all(css.map(loadFile));
    for(const f of js) await loadFile(f);

    log("✅ module loaded:", name);
    return true;
  })();

  return moduleLocks[name];
}

/* ======================================================
   ================== CHART.JS ===========================
   ====================================================== */
const loadChart = once(()=>{
  return new Promise(res=>{
    if(window.Chart) return res();
    const s=document.createElement("script");
    s.src="https://cdn.jsdelivr.net/npm/chart.js";
    s.onload=res;
    document.head.appendChild(s);
  });
});

function safeChart(canvasId, cfg){
  if(window._charts?.[canvasId]){
    window._charts[canvasId].destroy();
  }
  window._charts = window._charts || {};
  window._charts[canvasId] = new Chart(
    document.getElementById(canvasId), cfg
  );
}

/* ======================================================
   ================== GVIZ ===============================
   ====================================================== */
function parseGViz(txt,limit=15){
  try{
    txt=txt.replace(/^\s*\/\*O_o\*\/\s*/,'')
           .replace(/^google\.visualization\.Query\.setResponse\(/,'')
           .replace(/\);?\s*$/,'');
    const r=JSON.parse(txt).table.rows||[];
    r.sort((a,b)=>new Date(b.c[0]?.f||b.c[0]?.v)-new Date(a.c[0]?.f||a.c[0]?.v));
    return r.slice(0,limit);
  }catch{ return []; }
}

const findCfg=(map,n)=>{
  for(const k in map){
    if(map[k].range?.includes(n)) return map[k];
  }
  return null;
};

/* ======================================================
   ================== SILVER =============================
   ====================================================== */
let silverCfg=null, silverBusy=false;

window.Silverdata = async function(q){
  if(!q) return;
  if(!has("#silvr_pricet") && !has("#silvr_graf")) return;

  await ensureModule("silver-rates");

  if(silverBusy) return;
  silverBusy=true;

  if(!silverCfg){
    silverCfg = await fetch(
      "https://aditya-kumar-tech.github.io/mbk/data/gs/silver-groups.json"
    ).then(r=>r.json());
  }

  const n=parseInt(q.replace(/\D/g,''));
  const cfg=findCfg(silverCfg,n);
  if(!cfg) return silverBusy=false;

  const t = await fetch(
    `https://docs.google.com/spreadsheets/d/${cfg.id}/gviz/tq?tqx=out:json&sheet=silvweb&tq=select * limit 15`
  ).then(r=>r.text());

  const rows=parseGViz(t);
  rows.length && renderSilver(rows);
  silverBusy=false;
};

function renderSilver(rows){
  const kg=+rows[0].c[2]?.v||0;

  has("#silvr_pricet")&&(silvr_pricet.textContent=`₹${kg.toLocaleString('hi-IN')}`);
  has("#udat")&&(udat.textContent=new Date().toLocaleDateString('hi-IN'));

  if(has("#silvr_graf")){
    loadChart().then(()=>{
      silvr_graf.innerHTML='<canvas id="silverChart"></canvas>';
      safeChart("silverChart",{
        type:'line',
        data:{
          labels:rows.map(r=>r.c[0]?.f),
          datasets:[{label:"Silver 1kg",data:rows.map(r=>r.c[2]?.v),fill:true,tension:.3}]
        },
        options:{responsive:true,maintainAspectRatio:false}
      });
    });
  }
}

/* ======================================================
   ================== GOLD ===============================
   ====================================================== */
let goldCfg=null, goldBusy=false;

window.golddata = async function(q){
  if(!q) return;
  if(!has("#g22kt") && !has("#gldgraf")) return;

  await ensureModule("gold-rates");

  if(goldBusy) return;
  goldBusy=true;

  if(!goldCfg){
    goldCfg = await fetch(
      "https://aditya-kumar-tech.github.io/mbk/data/gs/gold-groups.json"
    ).then(r=>r.json());
  }

  const n=parseInt(q.replace(/\D/g,''));
  const cfg=findCfg(goldCfg,n);
  if(!cfg) return goldBusy=false;

  const t = await fetch(
    `https://docs.google.com/spreadsheets/d/${cfg.id}/gviz/tq?tqx=out:json&sheet=goldweb&tq=select * limit 15`
  ).then(r=>r.text());

  const rows=parseGViz(t);
  rows.length && renderGold(rows);
  goldBusy=false;
};

function renderGold(rows){
  const p22=+rows[0].c[1]?.v||0,
        p24=+rows[0].c[3]?.v||0;

  has("#g22kt")&&(g22kt.textContent=`₹${p22.toLocaleString('hi-IN')}`);
  has("#g24kt")&&(g24kt.textContent=`₹${p24.toLocaleString('hi-IN')}`);

  if(has("#gldgraf")){
    loadChart().then(()=>{
      gldgraf.innerHTML='<canvas id="goldChart"></canvas>';
      safeChart("goldChart",{
        type:'line',
        data:{
          labels:rows.map(r=>r.c[0]?.f),
          datasets:[
            {label:"22K",data:rows.map(r=>r.c[1]?.v),fill:true,tension:.3},
            {label:"24K",data:rows.map(r=>r.c[3]?.v),fill:true,tension:.3}
          ]
        },
        options:{responsive:true,maintainAspectRatio:false}
      });
    });
  }
}

})();