(function(){
/* ================= CONFIG ================= */
const DEBUG = true;
const log = (...a)=>DEBUG && console.log("[UL]",...a);

/* ================= UTILS ================= */
const once = fn=>{let d;return(...a)=>d||(d=fn(...a))};
const has = s=>document.querySelector(s);
const delay = (fn,t=300)=>setTimeout(fn,t);

/* ================= CHART.JS ================= */
const loadChart = once(cb=>{
  if(window.Chart) return cb();
  const s=document.createElement('script');
  s.src="https://cdn.jsdelivr.net/npm/chart.js";
  s.onload=()=>cb();
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
  }catch(e){ console.error("GViz error",e); return []; }
}

function findCfg(map,n){
  for(const k in map){
    if(map[k].range?.includes(n)) return {id:map[k].id};
  }
  return null;
}

/* ================= SILVER ================= */
let silverCfg=null, silverLock=false;
window.Silverdata = function(q){
  if(!q) return;
  if(silverLock) return delay(()=>Silverdata(q),200);
  silverLock=true;

  const start = ()=>{
    const n=parseInt(q.replace(/\D/g,'')),
          cfg=findCfg(silverCfg,n);
    if(!cfg){ silverLock=false; return; }

    fetch(`https://docs.google.com/spreadsheets/d/${cfg.id}/gviz/tq?tqx=out:json&sheet=silvweb&tq=select * limit 15`)
      .then(r=>r.text())
      .then(t=>{
        const rows=parseGViz(t,15);
        if(!rows.length){ silverLock=false; return delay(()=>Silverdata(q),400); }
        renderSilver(rows);
        silverLock=false;
      }).catch(()=>silverLock=false);
  };

  if(!silverCfg){
    fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/silver-groups.json')
      .then(r=>r.json())
      .then(j=>{ silverCfg=j; start(); })
      .catch(()=>silverLock=false);
  } else start();
};

function renderSilver(rows){
  const kg=+rows[0].c[2]?.v||0;
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

  const ht=has('#data_table1');
  if(ht){
    let h='<table><tr><th>Date</th><th>1Kg</th></tr>';
    rows.forEach(r=>h+=`<tr><td>${r.c[0]?.f}</td><td>₹${r.c[2]?.v}</td></tr>`);
    ht.innerHTML=h+'</table>';
  }

  const grafEl=has('#silvr_graf');
  if(grafEl){
    loadChart(()=>{
      grafEl.style.height="420px";
      grafEl.innerHTML='<canvas id="silverChart"></canvas>';
      new Chart(silverChart,{
        type:'line',
        data:{
          labels:rows.map(r=>r.c[0]?.f),
          datasets:[{label:'Silver 1kg',data:rows.map(r=>r.c[2]?.v),fill:true,tension:.3}]
        },
        options:{responsive:true,maintainAspectRatio:false}
      });
    });
  }
}

/* ================= GOLD ================= */
let goldCfg=null, goldLock=false;
window.golddata = function(q){
  if(!q) return;
  if(goldLock) return delay(()=>golddata(q),200);
  goldLock=true;

  const start = ()=>{
    const n=parseInt(q.replace(/\D/g,'')),
          cfg=findCfg(goldCfg,n);
    if(!cfg){ goldLock=false; return; }

    fetch(`https://docs.google.com/spreadsheets/d/${cfg.id}/gviz/tq?tqx=out:json&sheet=goldweb&tq=select * limit 15`)
      .then(r=>r.text())
      .then(t=>{
        const rows=parseGViz(t,15);
        if(!rows.length){ goldLock=false; return delay(()=>golddata(q),400); }
        renderGold(rows);
        goldLock=false;
      }).catch(()=>goldLock=false);
  };

  if(!goldCfg){
    fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/gold-groups.json')
      .then(r=>r.json())
      .then(j=>{ goldCfg=j; start(); })
      .catch(()=>goldLock=false);
  } else start();
};

function renderGold(rows){
  const p22=+rows[0].c[1]?.v||0,
        p24=+rows[0].c[3]?.v||0;

  has('#g22kt') && (g22kt.textContent=`₹${p22.toLocaleString('hi-IN')}`);
  has('#g24kt') && (g24kt.textContent=`₹${p24.toLocaleString('hi-IN')}`);
  has('#udat') && (udat.textContent=new Date().toLocaleDateString('hi-IN'));

  // HISTORY TABLE
  const h22=has('#data_table1');
  if(h22){
    let h='<table><tr><th>Date</th><th>22K</th></tr>';
    rows.forEach(r=>h+=`<tr><td>${r.c[0]?.f}</td><td>₹${r.c[1]?.v}</td></tr>`);
    h22.innerHTML=h+'</table>';
  }

  const h24=has('#data_table2');
  if(h24){
    let h='<table><tr><th>Date</th><th>24K</th></tr>';
    rows.forEach(r=>h+=`<tr><td>${r.c[0]?.f}</td><td>₹${r.c[3]?.v}</td></tr>`);
    h24.innerHTML=h+'</table>';
  }

  // GOLD GRAMS TABLE
  const gram22=has('#gramtbl22');
  if(gram22){
      let h='<table>';
      [1,10,50,100].forEach(g=>{
          h+=`<tr><td>${g}g</td><td>₹${Math.round(p22*g).toLocaleString('hi-IN')}</td></tr>`;
      });
      gram22.innerHTML=h+'</table>';
  }

  const gram24=has('#gramtbl24');
  if(gram24){
      let h='<table>';
      [1,10,50,100].forEach(g=>{
          h+=`<tr><td>${g}g</td><td>₹${Math.round(p24*g).toLocaleString('hi-IN')}</td></tr>`;
      });
      gram24.innerHTML=h+'</table>';
  }

  // CHART
  const grafEl=has('#gldgraf');
  if(grafEl){
    loadChart(()=>{
      grafEl.style.height="420px";
      grafEl.innerHTML='<canvas id="goldChart"></canvas>';
      new Chart(goldChart,{
        type:'line',
        data:{
          labels:rows.map(r=>r.c[0]?.f),
          datasets:[
            {label:'22K',data:rows.map(r=>r.c[1]?.v),fill:true,tension:.3},
            {label:'24K',data:rows.map(r=>r.c[3]?.v),fill:true,tension:.3}
          ]
        },
        options:{responsive:true,maintainAspectRatio:false}
      });
    });
  }
}
})();