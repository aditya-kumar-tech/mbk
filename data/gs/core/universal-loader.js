document.addEventListener('DOMContentLoaded',()=>{
(function(){

/* ================= UTILS ================= */
const once = fn=>{let d;return(...a)=>d||(d=fn(...a))};
const has = s=>document.querySelector(s);
const delay = (fn,t=300)=>setTimeout(fn,t);

/* ================= CHART ================= */
const loadChart = once(cb=>{
  if(window.Chart) return cb();
  const s=document.createElement('script');
  s.src="https://cdn.jsdelivr.net/npm/chart.js";
  s.onload=cb;
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
  }catch(e){ return []; }
}
const findCfg=(m,n)=>{for(const k in m){if(m[k].range?.includes(n))return{id:m[k].id}}};

/* ===================================================
   ================= SILVER ==========================
   =================================================== */
let silverCfg=null;

window.Silverdata=function(q){
  if(!q) return;
  if(!has('#silvr_pricet') && !has('#silvr_graf')) return;

  const start=()=>{
    const n=parseInt(q.replace(/\D/g,'')), cfg=findCfg(silverCfg,n);
    if(!cfg) return;

    fetch(`https://docs.google.com/spreadsheets/d/${cfg.id}/gviz/tq?tqx=out:json&sheet=silvweb&tq=select * limit 15`)
    .then(r=>r.text())
    .then(t=>{
      const rows=parseGViz(t,15);
      if(rows.length) renderSilver(rows);
    });
  };

  if(!silverCfg){
    fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/silver-groups.json')
    .then(r=>r.json()).then(j=>{silverCfg=j;start();});
  } else start();
};

function renderSilver(rows){

  /* 🔒 CLEAR GOLD HISTORY (CACHE FIX) */
  has('#data_table2') && (data_table2.innerHTML='');

  const kg=+rows[0].c[2]?.v||0;
  has('#silvr_pricet') && (silvr_pricet.innerHTML=`₹${kg.toLocaleString('hi-IN')}`);

  const ht=has('#data_table1');
  if(ht){
    let h='<div class="table-wrapper"><table><tr><th>Date</th><th>Silver (1Kg)</th></tr>';
    rows.forEach(r=>h+=`<tr><td>${r.c[0]?.f}</td><td>₹${r.c[2]?.v}</td></tr>`);
    ht.innerHTML=h+'</table></div>';
  }

  const graf=has('#silvr_graf');
  if(graf){
    loadChart(()=>{
      graf.innerHTML='<canvas id="silverChart"></canvas>';
      new Chart(silverChart,{
        type:'line',
        data:{labels:rows.map(r=>r.c[0]?.f),
              datasets:[{label:'Silver 1Kg',data:rows.map(r=>r.c[2]?.v),fill:true,tension:.3}]},
        options:{responsive:true,maintainAspectRatio:false}
      });
    });
  }
}

/* ===================================================
   ================= GOLD ============================
   =================================================== */
let goldCfg=null;

window.golddata=function(q){
  if(!q) return;
  if(!has('#g22kt') && !has('#gldgraf')) return;

  const start=()=>{
    const n=parseInt(q.replace(/\D/g,'')), cfg=findCfg(goldCfg,n);
    if(!cfg) return;

    fetch(`https://docs.google.com/spreadsheets/d/${cfg.id}/gviz/tq?tqx=out:json&sheet=goldweb&tq=select * limit 15`)
    .then(r=>r.text())
    .then(t=>{
      const rows=parseGViz(t,15);
      if(rows.length) renderGold(rows);
    });
  };

  if(!goldCfg){
    fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/gold-groups.json')
    .then(r=>r.json()).then(j=>{goldCfg=j;start();});
  } else start();
};

function renderGold(rows){

  /* 🔒 CLEAR SILVER HISTORY (CACHE FIX) */
  has('#data_table1') && (data_table1.innerHTML='');

  const p22=+rows[0].c[1]?.v||0,
        p24=+rows[0].c[3]?.v||0;

  has('#g22kt') && (g22kt.textContent=`₹${p22.toLocaleString('hi-IN')}`);
  has('#g24kt') && (g24kt.textContent=`₹${p24.toLocaleString('hi-IN')}`);

   /* ✅ GOLD GRAMS 22K */
  const g22=has('#gramtbl22');
  if(g22){
    let h='<table class="price-table">';
    [1,10,50,100].forEach(g=>{
      h+=`<tr><td>${g}g</td><td>₹${Math.round(p22*g).toLocaleString('hi-IN')}</td></tr>`;
    });
    g22.innerHTML=h+'</table>';
  }

  /* ✅ GOLD GRAMS 24K */
  const g24=has('#gramtbl24');
  if(g24){
    let h='<table class="price-table">';
    [1,10,50,100].forEach(g=>{
      h+=`<tr><td>${g}g</td><td>₹${Math.round(p24*g).toLocaleString('hi-IN')}</td></tr>`;
    });
    g24.innerHTML=h+'</table>';
  }
  const h22=has('#data_table1');
  if(h22){
    let h='<div class="table-wrapper"><table><tr><th>Date</th><th>22K</th></tr>';
    rows.forEach(r=>h+=`<tr><td>${r.c[0]?.f}</td><td>₹${r.c[1]?.v}</td></tr>`);
    h22.innerHTML=h+'</table></div>';
  }

  const h24=has('#data_table2');
  if(h24){
    let h='<div class="table-wrapper"><table><tr><th>Date</th><th>24K</th></tr>';
    rows.forEach(r=>h+=`<tr><td>${r.c[0]?.f}</td><td>₹${r.c[3]?.v}</td></tr>`);
    h24.innerHTML=h+'</table></div>';
  }
}

})();
});
