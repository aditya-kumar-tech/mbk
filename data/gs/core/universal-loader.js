(function(){
/* ================= CONFIG ================= */
const DEBUG = true;
const log = (...a)=>DEBUG && console.log("[UL]",...a);

/* ================= UTILS ================= */
const once = fn=>{let d;return(...a)=>d||(d=fn(...a))};
const has = s=>document.querySelector(s);
const delay = (fn,t=300)=>setTimeout(fn,t);

/* ================= PAGE DETECT ================= */
const IS_SILVER_PAGE = () => has('#silvr_pricet') || has('#silvr_graf');
const IS_GOLD_PAGE   = () => has('#g22kt') || has('#gldgraf');

/* ================= CHART.JS ================= */
const loadChart = once(cb=>{
  if(window.Chart) return cb();
  const s=document.createElement('script');
  s.src="https://cdn.jsdelivr.net/npm/chart.js";
  s.onload=()=>{ log("Chart.js loaded"); cb(); };
  document.head.appendChild(s);
});

/* ================= GVIZ ================= */
function parseGViz(txt,limit=15){
  try{
    txt=txt.replace(/^\s*\/\*O_o\*\/\s*/,'')
           .replace(/^google\.visualization\.Query\.setResponse\(/,'')
           .replace(/\);?\s*$/,'');
    const rows = JSON.parse(txt).table.rows || [];
    rows.sort((a,b)=>new Date(b.c[0]?.f||b.c[0]?.v) - new Date(a.c[0]?.f||a.c[0]?.v));
    return rows.slice(0,limit);
  }catch(e){
    console.error("GViz parse error",e);
    return [];
  }
}

function findCfg(map,n){
  for(const k in map){
    if(map[k].range?.includes(n)) return {id:map[k].id};
  }
  return null;
}

/* ======================================================
   ================= SILVER MODULE ======================
   ====================================================== */
if(typeof Silverdata !== "undefined"){
let silverCfg=null;
const LOCK={};

window.Silverdata = function(q){
  if(!q) return log("Silver skipped (no query)");
  if(!IS_SILVER_PAGE()) return log("Silver skipped (not silver page)");

  runSafe("silver", done=>{
    if(!silverCfg){
      fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/silver-groups.json')
        .then(r=>r.json())
        .then(j=>{ silverCfg=j; log("Silver config loaded"); fetchSilver(q,done); })
        .catch(()=>done());
    } else fetchSilver(q,done);
  });
};

function runSafe(key,fn){
  if(LOCK[key]) return delay(()=>runSafe(key,fn),100);
  LOCK[key]=true; fn(()=>LOCK[key]=false);
}

function fetchSilver(q,done){
  const n=parseInt(q.replace(/\D/g,'')), cfg=findCfg(silverCfg,n);
  if(!cfg){ log("Silver cfg not found",q); done(); return; }

  fetch(`https://docs.google.com/spreadsheets/d/${cfg.id}/gviz/tq?tqx=out:json&sheet=silvweb&tq=select * limit 15`)
    .then(r=>r.text())
    .then(t=>{
      const rows=parseGViz(t,15);
      if(!rows.length){
        log("Silver retry");
        delay(()=>Silverdata(q),400);
        done(); return;
      }
      renderSilver(rows);
      done();
    }).catch(done);
}

function renderSilver(rows){
  log("Render Silver");

  const kg = Number(rows[0].c[2]?.v||0);
  has('#silvr_pricet') && (silvr_pricet.innerHTML=`₹${kg.toLocaleString('hi-IN')}`);
  has('#udat') && (udat.textContent=new Date().toLocaleDateString('hi-IN'));

  const gtbl=has('#silvr_gramtbl');
  if(gtbl){
    let h='<table>';
    [1,10,50,100,500,1000].forEach(g=>{
      h+=`<tr><td>${g}g</td><td>₹${Math.round(g/1000*kg).toLocaleString('hi-IN')}</td></tr>`;
    });
    gtbl.innerHTML=h+'</table>';
  }

  /* ---- Silver history ONLY on silver page ---- */
  const ht=has('#data_table1');
  if(ht && !IS_GOLD_PAGE()){
    let h='<table><tr><th>Date</th><th>1Kg</th></tr>';
    rows.forEach(r=>{
      h+=`<tr><td>${r.c[0]?.f||''}</td><td>₹${Number(r.c[2]?.v||0).toLocaleString('hi-IN')}</td></tr>`;
    });
    ht.innerHTML=h+'</table>';
  }

  const grafEl=has('#silvr_graf');
  if(grafEl){
    loadChart(()=>{
      grafEl.style.height = window.innerWidth<768 ? "440px":"340px";
      grafEl.innerHTML='<canvas id="silverChart"></canvas>';
      new Chart(silverChart,{
        type:'line',
        data:{
          labels: rows.map(r=>r.c[0]?.f||''),
          datasets:[{
            label:'Silver 1kg',
            data: rows.map(r=>r.c[2]?.v||0),
            tension:.3,
            fill:true
          }]
        },
        options:{responsive:true,maintainAspectRatio:false}
      });
    });
  }
}
}

/* ======================================================
   ================== GOLD MODULE =======================
   ====================================================== */
if(typeof golddata !== "undefined"){
let goldCfg=null;
const LOCK={};

window.golddata = function(q){
  if(!q) return log("Gold skipped (no query)");
  if(!IS_GOLD_PAGE()) return log("Gold skipped (not gold page)");

  runSafe("gold", done=>{
    if(!goldCfg){
      fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/gold-groups.json')
        .then(r=>r.json())
        .then(j=>{ goldCfg=j; log("Gold config loaded"); fetchGold(q,done); })
        .catch(()=>done());
    } else fetchGold(q,done);
  });
};

function runSafe(key,fn){
  if(LOCK[key]) return delay(()=>runSafe(key,fn),100);
  LOCK[key]=true; fn(()=>LOCK[key]=false);
}

function fetchGold(q,done){
  const n=parseInt(q.replace(/\D/g,'')), cfg=findCfg(goldCfg,n);
  if(!cfg){ log("Gold cfg not found",q); done(); return; }

  fetch(`https://docs.google.com/spreadsheets/d/${cfg.id}/gviz/tq?tqx=out:json&sheet=goldweb&tq=select * limit 15`)
    .then(r=>r.text())
    .then(t=>{
      const rows=parseGViz(t,15);
      if(!rows.length){
        log("Gold retry");
        delay(()=>golddata(q),400);
        done(); return;
      }
      renderGold(rows);
      done();
    }).catch(done);
}

function renderGold(rows){
  log("Render Gold");

  const p22=Number(rows[0].c[1]?.v||0);
  const p24=Number(rows[0].c[3]?.v||0);

  has('#g22kt') && (g22kt.textContent=`₹${p22.toLocaleString('hi-IN')}`);
  has('#g24kt') && (g24kt.textContent=`₹${p24.toLocaleString('hi-IN')}`);
  has('#udat') && (udat.textContent=new Date().toLocaleDateString('hi-IN'));

  const gram22=has('#gramtbl22');
  if(gram22){
    let h='<table>';
    [1,10,50,100].forEach(g=>h+=`<tr><td>${g}g</td><td>₹${(p22*g).toLocaleString('hi-IN')}</td></tr>`);
    gram22.innerHTML=h+'</table>';
  }

  const gram24=has('#gramtbl24');
  if(gram24){
    let h='<table>';
    [1,10,50,100].forEach(g=>h+=`<tr><td>${g}g</td><td>₹${(p24*g).toLocaleString('hi-IN')}</td></tr>`);
    gram24.innerHTML=h+'</table>';
  }

  /* ---- Gold history ONLY on gold page ---- */
  const h22=has('#data_table1');
  if(h22 && !IS_SILVER_PAGE()){
    let h='<table><tr><th>Date</th><th>22K</th></tr>';
    rows.forEach(r=>h+=`<tr><td>${r.c[0]?.f||''}</td><td>₹${r.c[1]?.v}</td></tr>`);
    h22.innerHTML=h+'</table>';
  }

  const h24=has('#data_table2');
  if(h24 && !IS_SILVER_PAGE()){
    let h='<table><tr><th>Date</th><th>24K</th></tr>';
    rows.forEach(r=>h+=`<tr><td>${r.c[0]?.f||''}</td><td>₹${r.c[3]?.v}</td></tr>`);
    h24.innerHTML=h+'</table>';
  }

  const grafEl=has('#gldgraf');
  if(grafEl){
    loadChart(()=>{
      grafEl.style.height = window.innerWidth<768 ? "440px":"340px";
      grafEl.innerHTML='<canvas id="goldChart"></canvas>';
      new Chart(goldChart,{
        type:'line',
        data:{
          labels: rows.map(r=>r.c[0]?.f||''),
          datasets:[
            {label:'22K',data:rows.map(r=>r.c[1]?.v||0),tension:.3,fill:true},
            {label:'24K',data:rows.map(r=>r.c[3]?.v||0),tension:.3,fill:true}
          ]
        },
        options:{responsive:true,maintainAspectRatio:false}
      });
    });
  }
}
}
})();