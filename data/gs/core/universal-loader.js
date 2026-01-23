document.addEventListener('DOMContentLoaded',()=>{
  
(function(){
  /* ================= CSS LOADER ================= */
if(document.getElementById('rates-ui-css')) return;
  const l = document.createElement('link');
  l.id = 'rates-ui-css';
  l.rel = 'stylesheet';
  l.href = 'https://aditya-kumar-tech.github.io/mbk/data/gs/core/rates-ui.css'; // ← yahi aapka css path
  document.head.appendChild(l);
/* ================= UTILS ================= */
const once = fn=>{let d;return(...a)=>d||(d=fn(...a))};
const has = s=>document.querySelector(s);
const delay=(f,t=300)=>setTimeout(f,t);

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
  }catch(e){return[];}
}
const findCfg=(m,n)=>{for(const k in m){if(m[k].range?.includes(n))return{id:m[k].id}}};

/* ================= HELPERS ================= */
const diff=(t,y)=>t-y;
const pct=(t,y)=>y?(((t-y)/y)*100).toFixed(2):"0.00";
const arrow=(v)=>v>0?'▲':v<0?'▼':'—';

/* ===================================================
   ================= SILVER ==========================
   =================================================== */
let silverCfg=null;

window.Silverdata=function(q){
  if(!q) return;
  if(!has('#silvr_pricet') && !has('#silvr_graf')) return;

  const start=()=>{
    const n=parseInt(q.replace(/\D/g,'')),cfg=findCfg(silverCfg,n);
    if(!cfg) return;

    fetch(`https://docs.google.com/spreadsheets/d/${cfg.id}/gviz/tq?tqx=out:json&sheet=silvweb&tq=select * limit 15`)
    .then(r=>r.text())
    .then(t=>{
      const rows=parseGViz(t);
      if(rows.length) renderSilver(rows);
    });
  };

  if(!silverCfg){
    fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/silver-groups.json')
    .then(r=>r.json()).then(j=>{silverCfg=j;start();});
  } else start();
  // existing fetch code...
  fetch(...).then(r=>r.text())
  .then(t=>{
    const rows=parseGViz(t);
    if(rows.length) renderSilver(rows);
    hideLoader(); // hide loader after data loaded
  }).catch(()=>hideLoader());
};

function renderSilver(rows){
  has('#data_table2')&&(data_table2.innerHTML=''); // clear gold

  const today=+rows[0].c[2]?.v||0;
  (function(){
  const u = document.querySelector('.sudate #udat');
  if(u){
    u.textContent = rows[0].c[0]?.f || '';
    console.log('⚪ Silver last updated set');
  }
})();
  const yesterday=+rows[1]?.c[2]?.v||today;
  const ch=diff(today,yesterday);
  const pc=pct(today,yesterday);

  has('#silvr_pricet')&&(silvr_pricet.innerHTML=`₹${today.toLocaleString('hi-IN')}`);
  has('#silvr_change')&&(silvr_change.innerHTML=
    `<span class="${ch>=0?'up':'down'}">${arrow(ch)} ₹${ch} (${pc}%)</span>`);

  /* GRAMS */
  const gtbl=has('#silvr_gramtbl');
  if(gtbl){
    let h='<table class="price-table">';
    [1,10,50,100,500,1000].forEach(g=>{
      h+=`<tr><td>${g}g</td><td>₹${Math.round(today*g/1000).toLocaleString('hi-IN')}</td></tr>`;
    });
    gtbl.innerHTML=h+'</table>';
  }

  /* HISTORY */
  const ht=has('#data_table1');
  if(ht){
    let h='<div class="table-wrapper"><table class="price-table">';
    h+='<tr><th>Date</th><th>Price</th><th>Δ</th><th>%</th></tr>';
    rows.forEach((r,i)=>{
      const v=+r.c[2]?.v||0;
      const pv=+rows[i+1]?.c[2]?.v||v;
      const d=diff(v,pv),p=pct(v,pv);
      h+=`<tr>
        <td>${r.c[0]?.f}</td>
        <td>₹${v}</td>
        <td class="${d>=0?'up':'down'}">${arrow(d)} ${d}</td>
        <td>${p}%</td></tr>`;
    });
    ht.innerHTML=h+'</table></div>';
  }

  /* GRAPH */
  const g=has('#silvr_graf');
  if(g){
    loadChart(()=>{
      g.style.height="420px";
      g.innerHTML='<canvas id="silverChart"></canvas>';
      new Chart(silverChart,{
        type:'line',
        data:{
          labels:rows.map(r=>r.c[0]?.f),
          datasets:[{
            label:'Silver 1Kg',
            data:rows.map(r=>r.c[2]?.v),
            fill:true,tension:.35
          }]
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
    const n=parseInt(q.replace(/\D/g,'')),cfg=findCfg(goldCfg,n);
    if(!cfg) return;

    fetch(`https://docs.google.com/spreadsheets/d/${cfg.id}/gviz/tq?tqx=out:json&sheet=goldweb&tq=select * limit 15`)
    .then(r=>r.text())
    .then(t=>{
      const rows=parseGViz(t);
      if(rows.length) renderGold(rows);
    });
  };

  if(!goldCfg){
    fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/gold-groups.json')
    .then(r=>r.json()).then(j=>{goldCfg=j;start();});
  } else start();
  fetch(...).then(r=>r.text())
  .then(t=>{
    const rows=parseGViz(t);
    if(rows.length) renderGold(rows);
    hideLoader(); // hide loader after data loaded
  }).catch(()=>hideLoader());
};

function renderGold(rows){
  has('#data_table1')&&(data_table1.innerHTML=''); // clear silver

  const t22=+rows[0].c[1]?.v||0, y22=+rows[1]?.c[1]?.v||t22;
  (function(){
  const u = document.querySelector('.udate #udat');
  if(u){
    u.textContent = rows[0].c[0]?.f || '';
    console.log('🟡 Gold last updated set');
  }
})();
  const t24=+rows[0].c[3]?.v||0, y24=+rows[1]?.c[3]?.v||t24;

  has('#g22kt')&&(g22kt.innerHTML=`₹${t22.toLocaleString('hi-IN')}`);
  has('#g24kt')&&(g24kt.innerHTML=`₹${t24.toLocaleString('hi-IN')}`);

  has('#gold_change')&&(gold_change.innerHTML=
    `<span class="${t22-y22>=0?'up':'down'}">${arrow(t22-y22)} ${pct(t22,y22)}%</span>`);

  /* GRAMS */
  const makeGram=(el,p)=>{
    if(!el) return;
    let h='<table class="price-table">';
    [1,10,50,100].forEach(g=>{
      h+=`<tr><td>${g}g</td><td>₹${Math.round(p*g).toLocaleString('hi-IN')}</td></tr>`;
    });
    el.innerHTML=h+'</table>';
  };
  makeGram(has('#gramtbl22'),t22);
  makeGram(has('#gramtbl24'),t24);

  /* HISTORY */
  const h22=has('#data_table1');
  if(h22){
    let h='<div class="table-wrapper"><table class="price-table">';
    h+='<tr><th>Date</th><th>22K</th><th>Δ</th><th>%</th></tr>';
    rows.forEach((r,i)=>{
      const v=+r.c[1]?.v||0,pv=+rows[i+1]?.c[1]?.v||v;
      h+=`<tr><td>${r.c[0]?.f}</td><td>₹${v}</td>
      <td class="${v-pv>=0?'up':'down'}">${arrow(v-pv)} ${v-pv}</td>
      <td>${pct(v,pv)}%</td></tr>`;
    });
    h22.innerHTML=h+'</table></div>';
  }

  const h24=has('#data_table2');
  if(h24){
    let h='<div class="table-wrapper"><table class="price-table">';
    h+='<tr><th>Date</th><th>24K</th><th>Δ</th><th>%</th></tr>';
    rows.forEach((r,i)=>{
      const v=+r.c[3]?.v||0,pv=+rows[i+1]?.c[3]?.v||v;
      h+=`<tr><td>${r.c[0]?.f}</td><td>₹${v}</td>
      <td class="${v-pv>=0?'up':'down'}">${arrow(v-pv)} ${v-pv}</td>
      <td>${pct(v,pv)}%</td></tr>`;
    });
    h24.innerHTML=h+'</table></div>';
  }

  /* GRAPH */
  const g=has('#gldgraf');
  if(g){
    loadChart(()=>{
      g.style.height="420px";
      g.innerHTML='<canvas id="goldChart"></canvas>';
      new Chart(goldChart,{
        type:'line',
        data:{
          labels:rows.map(r=>r.c[0]?.f),
          datasets:[
            {label:'22K',data:rows.map(r=>r.c[1]?.v),fill:true,tension:.35},
            {label:'24K',data:rows.map(r=>r.c[3]?.v),fill:true,tension:.35}
          ]
        },
        options:{responsive:true,maintainAspectRatio:false}
      });
    });
  }
}

})();
});
