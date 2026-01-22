(function(){
/* ================= CONFIG ================= */
const DEBUG = true;
const log = (...a)=>DEBUG && console.log(...a);

/* ================= GLOBAL FLAGS ================= */
let SILVER_ACTIVE = false;
let GOLD_ACTIVE   = false;

/* ================= UTILS ================= */
const once = fn=>{let d;return(...a)=>d||(d=fn(...a))};
const has = s=>document.querySelector(s);
const delay = (fn,t=300)=>setTimeout(fn,t);

/* ================= CHART.JS ================= */
const loadChart = once(cb=>{
  if(window.Chart) return cb();
  const s=document.createElement('script');
  s.src="https://cdn.jsdelivr.net/npm/chart.js";
  s.onload=()=>{log("📊 Chart.js loaded"); cb()};
  document.head.appendChild(s);
});

/* ================= GVIZ ================= */
function parseGViz(txt,limit=15){
  try{
    txt=txt.replace(/^\s*\/\*O_o\*\/\s*/,'')
           .replace(/^google\.visualization\.Query\.setResponse\(/,'')
           .replace(/\);?\s*$/,'');
    const r=JSON.parse(txt).table.rows||[];
    r.sort((a,b)=>new Date(b.c[0]?.f||b.c[0]?.v)-new Date(a.c[0]?.f||a.c[0]?.v));
    return r.slice(0,limit);
  }catch(e){console.error("❌ GViz parse error",e); return [];}
}

function findCfg(map,n){
  for(const k in map){
    if(map[k].range?.includes(n)) return {id:map[k].id};
  }
  return null;
}

/* ================= SILVER MODULE ================= */
if(typeof Silverdata !== "undefined") {
  let silverCfg=null;
  const LOCK={};

  window.Silverdata = function(q){
    if(GOLD_ACTIVE) return log("⛔ Silver blocked (Gold active)");
    SILVER_ACTIVE = true;

    if(!q) return log("⏭ Silver skipped (no query)");

    runSafe("silver", done=>{
      if(!silverCfg){
        fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/silver-groups.json')
          .then(r=>r.json())
          .then(j=>{ silverCfg=j; log("✔ Silver config loaded"); fetchSilver(q, done); })
          .catch(()=>done());
      } else fetchSilver(q, done);
    });
  };

  function runSafe(key, fn){
    if(LOCK[key]) return delay(()=>runSafe(key,fn),100);
    LOCK[key]=true;
    fn(()=>{LOCK[key]=false});
  }

  function fetchSilver(q, done){
    const n=parseInt(q.replace(/\D/g,'')), cfg=findCfg(silverCfg,n);
    if(!cfg){ done(); return; }

    fetch(`https://docs.google.com/spreadsheets/d/${cfg.id}/gviz/tq?tqx=out:json&sheet=silvweb&tq=select * limit 15`)
      .then(r=>r.text())
      .then(t=>{
        const rows=parseGViz(t,15);
        if(!rows.length){ delay(()=>Silverdata(q),400); done(); return; }
        renderSilver(rows);
        done();
      }).catch(done);
  }

  function renderSilver(rows){
    if(!SILVER_ACTIVE || GOLD_ACTIVE) return; // 🔐 HARD BLOCK

    const kg=Number(rows[0].c[2]?.v||0);
    has('#silvr_pricet')?.innerHTML = `₹${kg.toLocaleString('hi-IN')}`;
    has('#udat')?.textContent = new Date().toLocaleDateString('hi-IN');

    const ht=has('#data_table1');
    if(ht){
      let h='<table><tr><th>Date</th><th>1Kg</th></tr>';
      rows.forEach(r=>h+=`<tr><td>${r.c[0]?.f}</td><td>₹${r.c[2]?.v}</td></tr>`);
      ht.innerHTML=h+'</table>';
    }
  }
}

/* ================= GOLD MODULE ================= */
if(typeof golddata !== "undefined") {
  let goldCfg=null;
  const LOCK={};

  window.golddata = function(q){
    if(SILVER_ACTIVE) return log("⛔ Gold blocked (Silver active)");
    GOLD_ACTIVE = true;

    if(!q) return log("⏭ Gold skipped (no query)");

    runSafe("gold", done=>{
      if(!goldCfg){
        fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/gold-groups.json')
          .then(r=>r.json())
          .then(j=>{ goldCfg=j; log("✔ Gold config loaded"); fetchGold(q, done); })
          .catch(()=>done());
      } else fetchGold(q, done);
    });
  };

  function runSafe(key, fn){
    if(LOCK[key]) return delay(()=>runSafe(key,fn),100);
    LOCK[key]=true;
    fn(()=>{LOCK[key]=false});
  }

  function fetchGold(q, done){
    const n=parseInt(q.replace(/\D/g,'')), cfg=findCfg(goldCfg,n);
    if(!cfg){ done(); return; }

    fetch(`https://docs.google.com/spreadsheets/d/${cfg.id}/gviz/tq?tqx=out:json&sheet=goldweb&tq=select * limit 15`)
      .then(r=>r.text())
      .then(t=>{
        const rows=parseGViz(t,15);
        if(!rows.length){ delay(()=>golddata(q),400); done(); return; }
        renderGold(rows);
        done();
      }).catch(done);
  }

  function renderGold(rows){
    if(!GOLD_ACTIVE || SILVER_ACTIVE) return; // 🔐 HARD BLOCK

    has('#g22kt')?.textContent = `₹${rows[0].c[1]?.v}`;
    has('#g24kt')?.textContent = `₹${rows[0].c[3]?.v}`;
    has('#udat')?.textContent = new Date().toLocaleDateString('hi-IN');

    const ht=has('#data_table1');
    if(ht){
      let h='<table><tr><th>Date</th><th>22K</th></tr>';
      rows.forEach(r=>h+=`<tr><td>${r.c[0]?.f}</td><td>₹${r.c[1]?.v}</td></tr>`);
      ht.innerHTML=h+'</table>';
    }
  }
}
})();