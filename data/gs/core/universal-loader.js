(function(){
/* ================= CONFIG ================= */
const DEBUG = true;
const log = (...a)=>DEBUG && console.log("[UL]",...a);
const manifestURL = "gs-manifest.json"; // manifest file URL
const moduleCache = {};  // Loaded JS/CSS cache

/* ================= UTILS ================= */
const has = s=>document.querySelector(s);
const delay = (fn,t=300)=>setTimeout(fn,t);

// Load JS/CSS once per URL
function loadFile(url,type='js'){
    return new Promise((res,rej)=>{
        if(moduleCache[url]) return res();
        let el;
        if(type==='js'){
            el=document.createElement('script');
            el.src=url;
            el.async=true;
            el.onload=()=>{moduleCache[url]=true; res();};
            el.onerror=()=>rej(`Failed to load ${url}`);
        } else {
            el=document.createElement('link');
            el.href=url;
            el.rel='stylesheet';
            el.onload=()=>{moduleCache[url]=true; res();};
            el.onerror=()=>rej(`Failed to load ${url}`);
            setTimeout(()=>moduleCache[url]=true,res,200); // fallback
        }
        document.head.appendChild(el);
    });
}

// Load multiple files sequentially
async function loadFilesSequential(files){
    for(const f of files){
        const type=f.endsWith('.css')?'css':'js';
        await loadFile(f,type);
    }
}

/* ================= CHART.JS (LAZY) ================= */
const loadChart = (async()=>{
    if(window.Chart) return;
    await loadFile("https://cdn.jsdelivr.net/npm/chart.js",'js');
})();

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
    if(map[k].range?.includes(n)) return map[k];
  }
  return null;
}

/* ================= MODULE LOADER ================= */
async function loadModule(moduleName){
    const manifest = await fetch(manifestURL).then(r=>r.json());
    const mod = manifest.modules[moduleName];
    if(!mod) { log("Module not found in manifest:",moduleName); return; }

    // Check if page has at least one element
    const present = mod.elements.some(el=>has(`#${el}`));
    if(!present){ log("Skipping module, no elements found:",moduleName); return; }

    // Load all JS/CSS files sequentially
    await loadFilesSequential(mod.files);

    // Return functions for use
    const funcs = {};
    if(mod.functions){
        mod.functions.forEach(f=>{
            if(window[f]) funcs[f]=window[f];
        });
    }
    return funcs;
}

/* ================= SILVER ================= */
let silverLock=false;
window.loadSilver = async function(q){
    const funcs = await loadModule('silver-rates');
    if(!funcs?.Silverdata) return;
    if(silverLock) return delay(()=>window.loadSilver(q),200);
    silverLock=true;
    try{
        // Original render logic
        funcs.Silverdata(q);
    } finally { silverLock=false; }
};

/* ================= GOLD ================= */
let goldLock=false;
window.loadGold = async function(q){
    const funcs = await loadModule('gold-rates');
    if(!funcs?.golddata) return;
    if(goldLock) return delay(()=>window.loadGold(q),200);
    goldLock=true;
    try{
        // Original render logic
        funcs.golddata(q);
    } finally { goldLock=false; }
};

/* ================= RENDER HELPERS ================= */
window.renderSilver = function(rows){
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
      loadChart().then(()=>{
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
};

/* ================= GOLD RENDER ================= */
window.renderGold = function(rows){
    const p22=+rows[0].c[1]?.v||0,
          p24=+rows[0].c[3]?.v||0;

    has('#g22kt') && (g22kt.textContent=`₹${p22.toLocaleString('hi-IN')}`);
    has('#g24kt') && (g24kt.textContent=`₹${p24.toLocaleString('hi-IN')}`);
    has('#udat') && (udat.textContent=new Date().toLocaleDateString('hi-IN'));

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

    const grafEl=has('#gldgraf');
    if(grafEl){
      loadChart().then(()=>{
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
};
})();