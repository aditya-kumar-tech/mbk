(function(){
/* ================= CONFIG ================= */
const DEBUG = true;
const log = (...a)=>DEBUG && console.log(...a);

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
    if(!cfg){ console.warn("Silver cfg not found",q); done(); return; }

    fetch(`https://docs.google.com/spreadsheets/d/${cfg.id}/gviz/tq?tqx=out:json&sheet=silvweb&tq=select * limit 15`)
      .then(r=>r.text())
      .then(t=>{
        const rows=parseGViz(t,15);
        if(!rows.length){ log("⏳ Silver retry"); delay(()=>Silverdata(q),400); done(); return; }
        renderSilver(rows);
        done();
      }).catch(done);
  }

  function renderSilver(rows){
    const kg=Number(rows[0].c[2]?.v||0);
    const sp = has('#silvr_pricet'); if(sp) sp.innerHTML=`₹${kg.toLocaleString('hi-IN')}`;
    const u = has('#udat'); if(u) u.textContent=new Date().toLocaleDateString('hi-IN');

    const gtbl=has('#silvr_gramtbl');
    if(gtbl){ let h='<table>'; [1,10,50,100,500,1000].forEach(g=>h+=`<tr><td>${g}g</td><td>₹${Math.round(g/1000*kg).toLocaleString('hi-IN')}</td></tr>`); gtbl.innerHTML=h+'</table>'; }

    const ht=has('#data_table1');
    if(ht){ let h='<table><tr><th>Date</th><th>1Kg</th></tr>'; rows.forEach(r=>h+=`<tr><td>${r.c[0]?.f}</td><td>₹${Number(r.c[2]?.v||0).toLocaleString('hi-IN')}</td></tr>`); ht.innerHTML=h+'</table>'; }

     // graph
  const grafEl=has('#silvr_graf');
  if(grafEl){
    loadChart(()=>{
      grafEl.style.height = window.innerWidth<768 ? "420px":"320px";
      grafEl.innerHTML='<canvas id="silverChart"></canvas>';
      new Chart(silverChart,{
        type:'line',
        data:{
          labels: rows.map(r=>r.c[0]?.f||''),
          datasets:[{label:'Silver 1kg', data: rows.map(r=>r.c[2]?.v||0), tension:.3, fill:true, borderColor:'#0d6efd', backgroundColor:'rgba(13,110,253,0.18)'}]
        },
        options:{responsive:true, maintainAspectRatio:false}
      });
    });
  }
}

/* ================= GOLD MODULE ================= */
if(typeof golddata !== "undefined") {
  let goldCfg=null;
  const LOCK={};
  window.golddata = function(q, mtype){
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
    if(!cfg){ console.warn("Gold cfg not found",q); done(); return; }

    fetch(`https://docs.google.com/spreadsheets/d/${cfg.id}/gviz/tq?tqx=out:json&sheet=goldweb&tq=select * limit 15`)
      .then(r=>r.text())
      .then(t=>{
        const rows=parseGViz(t,15);
        if(!rows.length){ log("⏳ Gold retry"); delay(()=>golddata(q,"gold"),400); done(); return; }
        renderGold(rows);
        done();
      }).catch(done);
  }

  function renderGold(rows){
    const p22=Number(rows[0].c[1]?.v||0), p24=Number(rows[0].c[3]?.v||0);
    const g22=has('#g22kt'); if(g22) g22.textContent=`₹${p22.toLocaleString('hi-IN')}`;
    const g24=has('#g24kt'); if(g24) g24.textContent=`₹${p24.toLocaleString('hi-IN')}`;
    const u = has('#udat'); if(u) u.textContent=new Date().toLocaleDateString('hi-IN');

    const gram22=has('#gramtbl22'); if(gram22){ let h='<table>'; [1,10,50,100].forEach(g=>h+=`<tr><td>${g}g</td><td>₹${Math.round(p22*g).toLocaleString('hi-IN')}</td></tr>`); gram22.innerHTML=h+'</table>'; }
    const gram24=has('#gramtbl24'); if(gram24){ let h='<table>'; [1,10,50,100].forEach(g=>h+=`<tr><td>${g}g</td><td>₹${Math.round(p24*g).toLocaleString('hi-IN')}</td></tr>`); gram24.innerHTML=h+'</table>'; }

    const hist22=has('#data_table1'); if(hist22){ let h='<table><tr><th>Date</th><th>22K</th></tr>'; rows.forEach(r=>h+=`<tr><td>${r.c[0]?.f}</td><td>₹${r.c[1]?.v}</td></tr>`); hist22.innerHTML=h+'</table>'; }
    const hist24=has('#data_table2'); if(hist24){ let h='<table><tr><th>Date</th><th>24K</th></tr>'; rows.forEach(r=>h+=`<tr><td>${r.c[0]?.f}</td><td>₹${r.c[3]?.v}</td></tr>`); hist24.innerHTML=h+'</table>'; }

    const grafEl=has('#gldgraf');
  if(grafEl){
    loadChart(()=>{
      grafEl.style.height = window.innerWidth<768 ? "420px":"320px";
      grafEl.innerHTML='<canvas id="goldChart"></canvas>';
      new Chart(goldChart,{
        type:'line',
        data:{
          labels: rows.map(r=>r.c[0]?.f||''),
          datasets:[
            {label:'22K',data:rows.map(r=>r.c[1]?.v||0),tension:.3,fill:true,borderColor:'#d97706',backgroundColor:'rgba(217,119,6,0.15)'},
            {label:'24K',data:rows.map(r=>r.c[3]?.v||0),tension:.3,fill:true,borderColor:'#7c3aed',backgroundColor:'rgba(124,58,237,0.15)'}
          ]
        },
        options:{
          responsive:true,
          maintainAspectRatio:false,
          plugins:{legend:{display:true}},
          scales:{y:{ticks:{callback:v=>'₹'+v.toLocaleString('hi-IN')}}}
        }
      });
    });
  }
}
}
})();
