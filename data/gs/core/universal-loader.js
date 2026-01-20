(function(){
console.log("🚀 Universal Loader v11.1-opt");

/* ================= Chart.js ================= */
function loadChartJS(cb){
 if(window.Chart) return cb();
 const s=document.createElement('script');
 s.src="https://cdn.jsdelivr.net/npm/chart.js";
 s.onload=cb; document.head.appendChild(s);
}

/* ================= GViz ================= */
function parseGViz(txt){
 try{
  txt=txt.replace(/^\s*\/\*O_o\*\/\s*/,'')
         .replace(/^google\.visualization\.Query\.setResponse\s*\(/,'')
         .replace(/\);?\s*$/,'');
  const rows=(JSON.parse(txt).table.rows||[]);
  rows.sort((a,b)=>{
   const da=new Date(a.c[0]?.f||a.c[0]?.v);
   const db=new Date(b.c[0]?.f||b.c[0]?.v);
   return db-da;
  });
  return rows.slice(0,15);
 }catch(e){console.error("GViz parse failed",e);return[];}
}

function findCfg(map,n){
 for(const k in map){
  const r=map[k].range;
  if(Array.isArray(r)&&r.includes(n)) return {id:map[k].id};
 }
 return null;
}

/* ================= GLOBAL REFS ================= */
window.silvr_pricet=document.querySelector('#silvr_pricet');
window.g22kt=document.querySelector('#g22kt');
window.g24kt=document.querySelector('#g24kt');
window.udat=document.querySelector('#udat');

/* ================= SILVER ================= */
let silverCfg=null,silverQueue=[];

function runSilverQueue(){
 while(silverCfg && silverQueue.length){
  const a=silverQueue.shift();
  Silverdata(a[0],a[1]);
 }
}

if(window.silvr_pricet || document.getElementById('silvr_gramtbl')){
 fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/silver-groups.json')
  .then(r=>r.json())
  .then(j=>{silverCfg=j;console.log('✔ Silver config');runSilverQueue();});
}

window.Silverdata=function(q,mtype){
 if(!silverCfg){
  silverQueue.push([q,mtype]);
  console.log("⏳ Silver queued");
  return;
 }
 if(!window.silvr_pricet) return;

 const num=parseInt(String(q).replace(/\D/g,''),10);
 const cfg=findCfg(silverCfg,num);
 if(!cfg) return console.warn("Silver cfg not found",q);

 const url=`https://docs.google.com/spreadsheets/d/${cfg.id}/gviz/tq?tqx=out:json&sheet=silvweb&tq=select * limit 15`;
 fetch(url).then(r=>r.text()).then(t=>{
  const rows=parseGViz(t);
  renderSilver(rows);
 }).catch(e=>console.error("Silver fetch failed",e));
};

function renderSilver(rows){
 if(!rows.length) return;
 const priceKg=rows[0].c[2]?.v||0;
 silvr_pricet.innerHTML=`₹${priceKg.toLocaleString('hi-IN')}`;
 if(window.udat) udat.textContent=new Date().toLocaleDateString('hi-IN');

 const gramTbl=document.getElementById('silvr_gramtbl');
 if(gramTbl){
  let h='<table style="width:100%">';
  [1,10,50,100,500,1000].forEach(g=>{
   h+=`<tr><td>${g}g</td><td align="right">₹${Math.round(g/1000*priceKg).toLocaleString()}</td></tr>`;
  });
  gramTbl.innerHTML=h+'</table>';
 }

 const hist=document.getElementById('data_table1');
 if(hist){
  let h='<table style="width:100%"><tr><th>Date</th><th>1kg</th></tr>';
  rows.forEach(r=>h+=`<tr><td>${r.c[0]?.f||''}</td><td align="right">₹${r.c[2]?.v||0}</td></tr>`);
  hist.innerHTML=h+'</table>';
 }

 const graf=document.getElementById('silvr_graf');
 if(graf){
  loadChartJS(()=>{
   graf.innerHTML='<canvas id="silverChart"></canvas>';
   new Chart(silverChart.getContext('2d'),{
    type:'line',
    data:{labels:rows.map(r=>r.c[0]?.f||''),datasets:[{label:'Silver 1kg',data:rows.map(r=>r.c[2]?.v||0),borderColor:'#0d6efd',tension:.3}]},
    options:{responsive:true,maintainAspectRatio:false}
   });
  });
 }
}

/* ================= GOLD ================= */
let goldCfg=null,goldQueue=[];

function runGoldQueue(){
 while(goldCfg && goldQueue.length){
  const a=goldQueue.shift();
  golddata(a[0],a[1]);
 }
}

if(window.g22kt || window.g24kt){
 fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/gold-groups.json')
  .then(r=>r.json())
  .then(j=>{goldCfg=j;console.log('✔ Gold config');runGoldQueue();});
}

window.golddata=function(q,mtype){
 if(!goldCfg){
  goldQueue.push([q,mtype]);
  console.log("⏳ Gold queued");
  return;
 }
 if(!window.g22kt && !window.g24kt) return;

 const num=parseInt(String(q).replace(/\D/g,''),10);
 const cfg=findCfg(goldCfg,num);
 if(!cfg) return console.warn("Gold cfg not found",q);

 const url=`https://docs.google.com/spreadsheets/d/${cfg.id}/gviz/tq?tqx=out:json&sheet=goldweb&tq=select * limit 15`;
 fetch(url).then(r=>r.text()).then(t=>{
  const rows=parseGViz(t);
  renderGold(rows);
 }).catch(e=>console.error("Gold fetch failed",e));
};

function renderGold(rows){
 if(!rows.length) return;
 g22kt.textContent=`₹${(rows[0].c[1]?.v||0).toLocaleString('hi-IN')}`;
 g24kt.textContent=`₹${(rows[0].c[3]?.v||0).toLocaleString('hi-IN')}`;
 if(window.udat) udat.textContent=new Date().toLocaleDateString('hi-IN');

 const graf=document.getElementById('gldgraf');
 if(graf){
  loadChartJS(()=>{
   graf.innerHTML='<canvas id="goldChart"></canvas>';
   new Chart(goldChart.getContext('2d'),{
    type:'line',
    data:{
     labels:rows.map(r=>r.c[0]?.f||''),
     datasets:[
      {label:'22K',data:rows.map(r=>r.c[1]?.v||0),borderColor:'#d97706',tension:.3},
      {label:'24K',data:rows.map(r=>r.c[3]?.v||0),borderColor:'#7c3aed',tension:.3}
     ]
    },
    options:{responsive:true,maintainAspectRatio:false}
   });
  });
 }
}

})();
