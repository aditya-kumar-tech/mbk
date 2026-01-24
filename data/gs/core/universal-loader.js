(function(){

/* ================= LOADER ================= */
const LOADER_HTML = `<span class="mbk-loader"><span class="mbk-spin"></span></span>`;
function scanLoader(){
  document.querySelectorAll('*').forEach(el=>{
    if(el.childNodes.length===1 && el.textContent.trim().toLowerCase()==='loading'){
      el.dataset.mbkLoader=1;
      el.innerHTML=LOADER_HTML;
    }
  });
}
function setVal(el,html){if(!el) return; delete el.dataset.mbkLoader; el.innerHTML=html;}
function setErr(el,msg='डेटा उपलब्ध नहीं'){if(!el) return; el.innerHTML=`<span style="color:#999;font-size:13px;">${msg}</span>`;}
window.MBK_LOADER={scan:scanLoader,set:setVal,error:setErr};
document.addEventListener('DOMContentLoaded',scanLoader);

/* ================= UTIL ================= */
const has=s=>document.querySelector(s);
const arrow=v=>v>0?'▲':v<0?'▼':'—';
const pct=(t,y)=>y?(((t-y)/y)*100).toFixed(2):"0.00";
function clearTable(el){if(el) el.innerHTML='';}

/* ================= CHART ================= */
function loadChart(cb){
  if(window.Chart) return cb();
  const s=document.createElement('script');
  s.src='https://cdn.jsdelivr.net/npm/chart.js';
  s.onload=cb;
  document.head.appendChild(s);
}

/* ================= GVIZ PARSER ================= */
function parseGViz(txt,limit=15){
  try{
    txt=txt.replace(/^\s*\/\*O_o\*\/\s*/,'')
           .replace(/^google\.visualization\.Query\.setResponse\(/,'')
           .replace(/\);?\s*$/,'');
    const r=JSON.parse(txt).table.rows||[];
    return r.slice(0,limit);
  }catch(e){return[];}
}

/* ================= SILVER ================= */
let silverCfg=null;
window.Silverdata=function(q){
  if(!q) return;
  const start=cfg=>{
    if(!cfg?.id) return;
    clearTable(has('#data_table1'));
    clearTable(has('#data_table2'));
    clearTable(has('#silvr_gramtbl'));
    fetch(`https://docs.google.com/spreadsheets/d/${cfg.id}/gviz/tq?tqx=out:json&sheet=silvweb&tq=select * limit 15`)
      .then(r=>r.text())
      .then(t=>{
        const rows=parseGViz(t);
        if(rows.length) renderSilver(rows);
        else setErr(has('#silvr_pricet'));
      }).catch(e=>setErr(has('#silvr_pricet')));
  };
  if(!silverCfg){
    fetch('https://api.mandibhavkhabar.com/data/gs/silver-groups.json')
      .then(r=>r.json())
      .then(j=>{silverCfg=j; start(Object.values(j)[0]); });
  } else start(Object.values(silverCfg)[0]);
};

function renderSilver(rows){
  const today=+rows[0].c[2]?.v||0;
  const yesterday=+rows[1]?.c[2]?.v||today;
  const diffVal=today-yesterday;

  setVal(has('#silvr_pricet'),`₹${today.toLocaleString('hi-IN')}`);
  has('#silvr_change')&&(silvr_change.innerHTML=
    `<span>${arrow(diffVal)} ₹${diffVal} (${pct(today,yesterday)}%)</span>`);

  const u=has('.sudate #udat'); u&&(u.textContent=rows[0].c[0]?.f||'');

  /* grams table */
  const gtbl=has('#silvr_gramtbl');
  if(gtbl){
    let h='<table class="price-table">';
    [1,10,50,100,500,1000].forEach(g=>{h+=`<tr><td>${g}g</td><td>₹${Math.round(today*g/1000).toLocaleString('hi-IN')}</td></tr>`;});
    gtbl.innerHTML=h+'</table>';
  }

  /* history table */
  const ht=has('#data_table1');
  if(ht){
    let h='<div class="table-wrapper"><table class="price-table">';
    h+='<tr><th>Date</th><th>Price</th><th>Δ</th><th>%</th></tr>';
    rows.forEach((r,i)=>{
      const v=+r.c[2]?.v||0; const pv=+rows[i+1]?.c[2]?.v||v;
      h+=`<tr><td>${r.c[0]?.f}</td><td>₹${v}</td><td>${arrow(v-pv)} ${v-pv}</td><td>${pct(v,pv)}%</td></tr>`;
    });
    ht.innerHTML=h+'</table></div>';
  }

  /* graph */
  const g=has('#silvr_graf');
  if(g){
    loadChart(()=>{
      g.style.height='420px';
      g.innerHTML='<canvas id="silverChart"></canvas>';
      new Chart(silverChart,{
        type:'line',
        data:{labels:rows.map(r=>r.c[0]?.f),datasets:[{label:'Silver 1Kg',data:rows.map(r=>r.c[2]?.v),fill:true,tension:.35}]},
        options:{responsive:true,maintainAspectRatio:false}
      });
    });
  }
}

/* ================= GOLD ================= */
let goldCfg=null;
window.golddata=function(q){
  if(!q) return;
  const start=cfg=>{
    if(!cfg?.id) return;
    clearTable(has('#data_table1'));
    clearTable(has('#data_table2'));
    clearTable(has('#gramtbl22'));
    clearTable(has('#gramtbl24'));
    fetch(`https://docs.google.com/spreadsheets/d/${cfg.id}/gviz/tq?tqx=out:json&sheet=goldweb&tq=select * limit 15`)
      .then(r=>r.text())
      .then(t=>{
        const rows=parseGViz(t);
        if(rows.length) renderGold(rows);
        else setErr(has('#g22kt'));
      }).catch(e=>setErr(has('#g22kt')));
  };
  if(!goldCfg){
    fetch('https://api.mandibhavkhabar.com/data/gs/gold-groups.json')
      .then(r=>r.json())
      .then(j=>{goldCfg=j; start(Object.values(j)[0]); });
  } else start(Object.values(goldCfg)[0]);
};

function renderGold(rows){
  const t22=+rows[0].c[1]?.v||0;
  const t24=+rows[0].c[3]?.v||0;

  setVal(has('#g22kt'),`₹${t22.toLocaleString('hi-IN')}`);
  setVal(has('#g24kt'),`₹${t24.toLocaleString('hi-IN')}`);
  const u=has('.udate #udat'); u&&(u.textContent=rows[0].c[0]?.f||'');

  /* grams */
  const makeGram=(el,p)=>{if(!el) return; let h='<table class="price-table">'; [1,10,50,100].forEach(g=>{h+=`<tr><td>${g}g</td><td>₹${Math.round(p*g).toLocaleString('hi-IN')}</td></tr>`;}); el.innerHTML=h+'</table>';}
  makeGram(has('#gramtbl22'),t22); makeGram(has('#gramtbl24'),t24);

  /* history 22k */
  const h22=has('#data_table1');
  if(h22){
    let h='<div class="table-wrapper"><table class="price-table">';
    h+='<tr><th>Date</th><th>22K</th><th>Δ</th><th>%</th></tr>';
    rows.forEach((r,i)=>{const v=+r.c[1]?.v||0; const pv=+rows[i+1]?.c[1]?.v||v;
      h+=`<tr><td>${r.c[0]?.f}</td><td>₹${v}</td><td>${arrow(v-pv)} ${v-pv}</td><td>${pct(v,pv)}%</td></tr>`;});
    h22.innerHTML=h+'</table></div>';
  }

  /* history 24k */
  const h24=has('#data_table2');
  if(h24){
    let h='<div class="table-wrapper"><table class="price-table">';
    h+='<tr><th>Date</th><th>24K</th><th>Δ</th><th>%</th></tr>';
    rows.forEach((r,i)=>{const v=+r.c[3]?.v||0; const pv=+rows[i+1]?.c[3]?.v||v;
      h+=`<tr><td>${r.c[0]?.f}</td><td>₹${v}</td><td>${arrow(v-pv)} ${v-pv}</td><td>${pct(v,pv)}%</td></tr>`;});
    h24.innerHTML=h+'</table></div>';
  }

  /* graph */
  const g=has('#gldgraf');
  if(g){
    loadChart(()=>{
      g.style.height='420px';
      g.innerHTML='<canvas id="goldChart"></canvas>';
      new Chart(goldChart,{
        type:'line',
        data:{labels:rows.map(r=>r.c[0]?.f),datasets:[{label:'22K',data:rows.map(r=>r.c[1]?.v),fill:true,tension:.35},{label:'24K',data:rows.map(r=>r.c[3]?.v),fill:true,tension:.35}]},
        options:{responsive:true,maintainAspectRatio:false}
      });
    });
  }
}

/* ================= INLINE LOADER CSS ================= */
const st=document.createElement('style'); st.textContent=`
.mbk-loader{display:inline-flex;align-items:center}
.mbk-spin{width:16px;height:16px;border:2px solid #ddd;border-top-color:#999;border-radius:50%;animation:mbkspin .8s linear infinite}
@keyframes mbkspin{to{transform:rotate(360deg)}}
`; document.head.appendChild(st);

})();
