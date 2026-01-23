document.addEventListener('DOMContentLoaded',()=>{
(function(){

/* ================= UTILS ================= */
const once = fn=>{let d;return(...a)=>d||(d=fn(...a))};
const has = s=>document.querySelector(s);

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

/* ================= GLOBAL CHART CACHE ================= */
let silverChartObj=null;
let goldChartObj=null;

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
      rows.length && renderSilver(rows);
    });
  };

  silverCfg
    ? start()
    : fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/silver-groups.json')
        .then(r=>r.json()).then(j=>{silverCfg=j;start();});
};

function renderSilver(rows){

  /* 🔒 CLEAR GOLD TABLES */
  has('#data_table2') && (data_table2.innerHTML='');

  const price=+rows[0].c[2]?.v||0;
  has('#silvr_pricet') && (silvr_pricet.innerHTML=`₹${price.toLocaleString('hi-IN')}`);

  /* HISTORY TABLE */
  const ht=has('#data_table1');
  if(ht){
    let h='<div class="table-wrapper"><table class="price-table"><tr><th>Date</th><th>Silver (1Kg)</th></tr>';
    rows.forEach(r=>h+=`<tr><td>${r.c[0]?.f}</td><td>₹${r.c[2]?.v}</td></tr>`);
    ht.innerHTML=h+'</table></div>';
  }

  /* GRAPH */
  const graf=has('#silvr_graf');
  if(graf){
    loadChart(()=>{
      graf.innerHTML='<canvas id="silverChart"></canvas>';
      silverChartObj && silverChartObj.destroy();
      silverChartObj=new Chart(silverChart,{
        type:'line',
        data:{
          labels:rows.map(r=>r.c[0]?.f),
          datasets:[{label:'Silver 1Kg',data:rows.map(r=>r.c[2]?.v),fill:true,tension:.3}]
        },
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
      rows.length && renderGold(rows);
    });
  };

  goldCfg
    ? start()
    : fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/gold-groups.json')
        .then(r=>r.json()).then(j=>{goldCfg=j;start();});
};

function renderGold(rows){

  /* 🔒 CLEAR SILVER TABLE */
  has('#data_table1') && (data_table1.innerHTML='');

  const p22=+rows[0].c[1]?.v||0;
  const p24=+rows[0].c[3]?.v||0;

  has('#g22kt') && (g22kt.textContent=`₹${p22.toLocaleString('hi-IN')}`);
  has('#g24kt') && (g24kt.textContent=`₹${p24.toLocaleString('hi-IN')}`);

  /* ===== GRAMS TABLES FIX ===== */
  const makeGram=(price)=>{
    let h='<table class="price-table">';
    [1,10,50,100].forEach(g=>{
      h+=`<tr><td>${g}g</td><td>₹${Math.round(price*g).toLocaleString('hi-IN')}</td></tr>`;
    });
    return h+'</table>';
  };
  has('#gramtbl22') && (gramtbl22.innerHTML=makeGram(p22));
  has('#gramtbl24') && (gramtbl24.innerHTML=makeGram(p24));

  /* HISTORY TABLES */
  const h22=has('#data_table1');
  if(h22){
    let h='<div class="table-wrapper"><table class="price-table"><tr><th>Date</th><th>22K</th></tr>';
    rows.forEach(r=>h+=`<tr><td>${r.c[0]?.f}</td><td>₹${r.c[1]?.v}</td></tr>`);
    h22.innerHTML=h+'</table></div>';
  }

  const h24=has('#data_table2');
  if(h24){
    let h='<div class="table-wrapper"><table class="price-table"><tr><th>Date</th><th>24K</th></tr>';
    rows.forEach(r=>h+=`<tr><td>${r.c[0]?.f}</td><td>₹${r.c[3]?.v}</td></tr>`);
    h24.innerHTML=h+'</table></div>';
  }

  /* GRAPH */
  const graf=has('#gldgraf');
  if(graf){
    loadChart(()=>{
      graf.innerHTML='<canvas id="goldChart"></canvas>';
      goldChartObj && goldChartObj.destroy();
      goldChartObj=new Chart(goldChart,{
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
});
