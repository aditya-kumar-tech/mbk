(function(){
/* ================= CONFIG ================= */
const DEBUG = true;
const log = (...a)=>DEBUG && console.log(...a);

/* ================= UTILS ================= */
const once = (fn)=>{let d;return(...a)=>d||(d=fn(...a))};
const has = s=>document.querySelector(s);
const delay = (fn,t=300)=>setTimeout(fn,t);

/* ================= CHART.JS ================= */
const loadChart = once(cb=>{
  if(window.Chart) return cb();
  const s=document.createElement('script');
  s.src="https://cdn.jsdelivr.net/npm/chart.js";
  s.onload=cb; document.head.appendChild(s);
  log("📊 Chart.js loaded");
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
  }catch(e){console.error("GViz parse error",e);return[];}
}

function findCfg(map,n){
  for(const k in map){
    const r=map[k].range;
    if(r && r.includes(n)) return {id:map[k].id};
  }
  return null;
}

/* ================= SILVER ================= */
let silverCfg=null;
const needSilver = has('#silvr_pricet')||has('#silvr_gramtbl');

if(needSilver){
  fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/silver-groups.json')
  .then(r=>r.json()).then(j=>{silverCfg=j;log("✔ Silver config loaded")});
}

window.Silverdata=function(q){
  if(!needSilver) return log("⏭ Silver skipped (DOM missing)");
  if(!silverCfg) return delay(()=>Silverdata(q),300);

  const n=parseInt(q.replace(/\D/g,'')), cfg=findCfg(silverCfg,n);
  if(!cfg) return console.warn("Silver cfg not found",q);

  fetch(`https://docs.google.com/spreadsheets/d/${cfg.id}/gviz/tq?tqx=out:json&sheet=silvweb&tq=select * limit 15`)
  .then(r=>r.text()).then(t=>{
    const rows=parseGViz(t,15);
    if(!rows.length) return log("⏳ Silver retry"),delay(()=>Silverdata(q),400);
    renderSilver(rows);
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

  const g=has('#silvr_graf');
  if(g) loadChart(()=>drawChart('silverChart',g,rows.map(r=>r.c[0]?.f),rows.map(r=>r.c[2]?.v),'Silver 1Kg'));
}

/* ================= GOLD ================= */
let goldCfg=null;
const needGold = has('#g22kt')||has('#g24kt');

if(needGold){
  fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/gold-groups.json')
  .then(r=>r.json()).then(j=>{goldCfg=j;log("✔ Gold config loaded")});
}

window.golddata=function(q){
  if(!needGold) return log("⏭ Gold skipped (DOM missing)");
  if(!goldCfg) return delay(()=>golddata(q),300);

  const n=parseInt(q.replace(/\D/g,'')), cfg=findCfg(goldCfg,n);
  if(!cfg) return console.warn("Gold cfg not found",q);

  fetch(`https://docs.google.com/spreadsheets/d/${cfg.id}/gviz/tq?tqx=out:json&sheet=goldweb&tq=select * limit 15`)
  .then(r=>r.text()).then(t=>{
    const rows=parseGViz(t,15);
    if(!rows.length) return log("⏳ Gold retry"),delay(()=>golddata(q),400);
    renderGold(rows);
  });
};

function renderGold(rows){
  const p22=Number(rows[0].c[1]?.v||0);
  const p24=Number(rows[0].c[3]?.v||0);

  g22kt.textContent=`₹${p22.toLocaleString('hi-IN')}`;
  g24kt.textContent=`₹${p24.toLocaleString('hi-IN')}`;
  udat.textContent=new Date().toLocaleDateString('hi-IN');

  const gram=(id,val)=>{
    const e=has('#'+id); if(!e) return;
    let h='<table>';
    [1,5,10,50,100].forEach(g=>h+=`<tr><td>${g}g</td><td>₹${Math.round(val*g).toLocaleString('hi-IN')}</td></tr>`);
    e.innerHTML=h+'</table>';
  };
  gram('gramtbl22',p22); gram('gramtbl24',p24);

  const h22=has('#data_table1'), h24=has('#data_table2');
  if(h22){
    let h='<table><tr><th>Date</th><th>22K</th></tr>';
    rows.forEach(r=>h+=`<tr><td>${r.c[0]?.f}</td><td>₹${Number(r.c[1]?.v||0).toLocaleString('hi-IN')}</td></tr>`);
    h22.innerHTML=h+'</table>';
  }
  if(h24){
    let h='<table><tr><th>Date</th><th>24K</th></tr>';
    rows.forEach(r=>h+=`<tr><td>${r.c[0]?.f}</td><td>₹${Number(r.c[3]?.v||0).toLocaleString('hi-IN')}</td></tr>`);
    h24.innerHTML=h+'</table>';
  }

  // ================= GOLD GRAPH =================
const grafEl = document.getElementById('gldgraf');
if(grafEl){
  loadChart(()=>{
    grafEl.style.width = "100%";
    grafEl.style.height = "320px"; // ✅ mobile friendly height

    grafEl.innerHTML = `<canvas id="goldChart"></canvas>`;

    const labels = rows.map(r => r.c[0]?.f || '');
    const data22 = rows.map(r => Number(r.c[1]?.v || 0));
    const data24 = rows.map(r => Number(r.c[3]?.v || 0));

    new Chart(document.getElementById('goldChart'), {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: '22K Gold',
            data: data22,
            borderColor: '#d97706',
            backgroundColor: 'rgba(217,119,6,0.15)',
            tension: 0.3,
            fill: true
          },
          {
            label: '24K Gold',
            data: data24,
            borderColor: '#7c3aed',
            backgroundColor: 'rgba(124,58,237,0.15)',
            tension: 0.3,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false, // ✅ allow custom height
        plugins: {
          legend: { display: true }
        },
        scales: {
          y: {
            ticks: {
              callback: v => '₹' + v.toLocaleString('hi-IN')
            }
          }
        }
      }
    });
  });
}


/* ================= CHART ================= */
function drawChart(id,wrap,labels,data,label){
  wrap.innerHTML=`<canvas id="${id}"></canvas>`;
  new Chart(document.getElementById(id),{
    type:'line',
    data:{labels,datasets:[{label,data,tension:.3,fill:true}]},
    options:{responsive:true,maintainAspectRatio:false}
  });
}

/* ================= GLOBAL ================= */
window.g22kt=has('#g22kt');
window.g24kt=has('#g24kt');
window.silvr_pricet=has('#silvr_pricet');
window.udat=has('#udat');

})();
