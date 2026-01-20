(function(){
/* ================= CONFIG ================= */
const DEBUG = true;
const log = (...a)=>DEBUG && console.log(...a);

/* ================= QUEUE / LOCK ================= */
const LOCK={}, QUEUE={};
function runSafe(key, fn){
  if(LOCK[key]){
    log("⏳ QUEUED:", key);
    QUEUE[key]=fn; return;
  }
  LOCK[key]=true;
  fn(()=> {
    LOCK[key]=false;
    if(QUEUE[key]){
      log("▶ RUN QUEUED:", key);
      const q=QUEUE[key];
      delete QUEUE[key];
      runSafe(key,q);
    }
  });
}

/* ================= UTILS ================= */
const once = fn=>{let d;return(...a)=>d||(d=fn(...a))};
const has = s=>document.querySelector(s);
const delay = (fn,t=300)=>setTimeout(fn,t);

/* ================= CHART ================= */
const loadChart = once(cb=>{
  if(window.Chart) return cb();
  const s=document.createElement('script');
  s.src="https://cdn.jsdelivr.net/npm/chart.js";
  s.onload=()=>{log("📊 Chart.js loaded");cb()};
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
  }catch(e){
    console.error("❌ GViz parse error",e);
    return [];
  }
}

function findCfg(map,n){
  for(const k in map){
    if(map[k].range?.includes(n)) return {id:map[k].id};
  }
  return null;
}

/* ================= SILVER ================= */
let silverCfg=null;
const needSilver = has('#silvr_pricet')||has('#silvr_gramtbl')||has('#silvr_graf');

if(needSilver){
  fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/silver-groups.json')
  .then(r=>r.json()).then(j=>{silverCfg=j;log("✔ Silver config loaded")});
}

window.Silverdata=function(q){
  if(!needSilver) return log("⏭ Silver skipped");
  if(!silverCfg) return delay(()=>Silverdata(q),300);

  runSafe("silver", done=>{
    const n=parseInt(q.replace(/\D/g,'')), cfg=findCfg(silverCfg,n);
    if(!cfg){console.warn("Silver cfg not found",q);done();return;}

    fetch(`https://docs.google.com/spreadsheets/d/${cfg.id}/gviz/tq?tqx=out:json&sheet=silvweb&tq=select * limit 15`)
    .then(r=>r.text()).then(t=>{
      const rows=parseGViz(t,15);
      if(!rows.length){log("⏳ Silver retry");delay(()=>Silverdata(q),400);done();return;}
      renderSilver(rows);
      done();
    });
  });
};

function renderSilver(rows){
  const kg=Number(rows[0].c[2]?.v||0);
  silvr_pricet.innerHTML=`₹${kg.toLocaleString('hi-IN')}`;
  udat.textContent=new Date().toLocaleDateString('hi-IN');

  const gtbl=has('#silvr_gramtbl');
  if(gtbl){
    let h='<table>';
    [1,10,50,100,500,1000].forEach(g=>{
      h+=`<tr><td>${g}g</td><td>₹${Math.round(g/1000*kg).toLocaleString('hi-IN')}</td></tr>`;
    });
    gtbl.innerHTML=h+'</table>';
  }

  const ht=has('#data_table1');
  if(ht){
    let h='<table><tr><th>Date</th><th>1Kg</th></tr>';
    rows.forEach(r=>h+=`<tr><td>${r.c[0]?.f}</td><td>₹${Number(r.c[2]?.v||0).toLocaleString('hi-IN')}</td></tr>`);
    ht.innerHTML=h+'</table>';
  }

  const grafEl=has('#silvr_graf');
  if(grafEl){
    loadChart(()=>{
      grafEl.style.height=window.innerWidth<768?"420px":"320px";
      grafEl.innerHTML='<canvas id="silverChart"></canvas>';
      new Chart(silverChart,{
        type:'line',
        data:{
          labels:rows.map(r=>r.c[0]?.f||''),
          datasets:[{label:'Silver 1kg',data:rows.map(r=>r.c[2]?.v||0),tension:.3,fill:true}]
        },
        options:{responsive:true,maintainAspectRatio:false}
      });
    });
  }
}

/* ================= GOLD ================= */
let goldCfg=null;
const needGold = has('#g22kt')||has('#g24kt')||has('#gldgraf')||has('#gold_gramtbl')||has('#gold_history');

if(needGold){
  fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/gold-groups.json')
  .then(r=>r.json()).then(j=>{goldCfg=j;log("✔ Gold config loaded")});
}

window.golddata=function(q){
  if(!needGold) return log("⏭ Gold skipped");
  if(!goldCfg) return delay(()=>golddata(q),300);

  runSafe("gold", done=>{
    const n=parseInt(q.replace(/\D/g,'')), cfg=findCfg(goldCfg,n);
    if(!cfg){console.warn("Gold cfg not found",q);done();return;}

    fetch(`https://docs.google.com/spreadsheets/d/${cfg.id}/gviz/tq?tqx=out:json&sheet=goldweb&tq=select * limit 15`)
    .then(r=>r.text()).then(t=>{
      const rows=parseGViz(t,15);
      if(!rows.length){log("⏳ Gold retry");delay(()=>golddata(q),400);done();return;}
      renderGold(rows);
      done();
    });
  });
};

function renderGold(rows){
  const p22=Number(rows[0].c[1]?.v||0);
  const p24=Number(rows[0].c[3]?.v||0);

  g22kt.textContent=`₹${p22.toLocaleString('hi-IN')}`;
  g24kt.textContent=`₹${p24.toLocaleString('hi-IN')}`;
  udat.textContent=new Date().toLocaleDateString('hi-IN');

  /* grams table */
  const gt=has('#gold_gramtbl');
  if(gt){
    let h='<table>';
    [1,10,50,100].forEach(g=>{
      h+=`<tr><td>${g}g (22K)</td><td>₹${Math.round(p22/10*g).toLocaleString('hi-IN')}</td></tr>`;
    });
    gt.innerHTML=h+'</table>';
  }

  /* history table */
  const ht=has('#gold_history');
  if(ht){
    let h='<table><tr><th>Date</th><th>22K</th><th>24K</th></tr>';
    rows.forEach(r=>h+=`<tr><td>${r.c[0]?.f}</td><td>₹${r.c[1]?.v}</td><td>₹${r.c[3]?.v}</td></tr>`);
    ht.innerHTML=h+'</table>';
  }

  /* graph */
  const grafEl=has('#gldgraf');
  if(grafEl){
    loadChart(()=>{
      grafEl.style.height=window.innerWidth<768?"420px":"320px";
      grafEl.innerHTML='<canvas id="goldChart"></canvas>';
      new Chart(goldChart,{
        type:'line',
        data:{
          labels:rows.map(r=>r.c[0]?.f||''),
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

/* ================= GLOBAL ================= */
window.g22kt=has('#g22kt');
window.g24kt=has('#g24kt');
window.silvr_pricet=has('#silvr_pricet');
window.udat=has('#udat');

})();
