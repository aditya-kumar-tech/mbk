(async function(){
/* ================= CONFIG ================= */
const DEBUG = true;
const log = (...a)=>DEBUG && console.log("[UL]",...a);
const manifestURL = "gs-manifest.json"; // manifest file URL
const moduleCache = {};  // Loaded JS/CSS cache

/* ================= UTILS ================= */
const has = s=>document.querySelector(s);
const delay = (fn,t=300)=>setTimeout(fn,t);

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
            setTimeout(()=>moduleCache[url]=true,res,200);
        }
        document.head.appendChild(el);
    });
}

async function loadFilesSequential(files){
    for(const f of files){
        const type=f.endsWith('.css')?'css':'js';
        await loadFile(f,type);
    }
}

/* ================= CHART.JS ================= */
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

    const present = mod.elements.some(el=>has(`#${el}`));
    if(!present){ log("Skipping module, no elements found:",moduleName); return; }

    await loadFilesSequential(mod.files);  // JS + CSS fully loaded

    // JS load hone ke baad hi functions exist karenge
    const funcs = {};
    if(mod.functions){
        for(const f of mod.functions){
            // Wait till function is defined
            await new Promise(res=>{
                const check = ()=>{
                    if(window[f]) return res(window[f]);
                    setTimeout(check,50);
                };
                check();
            });
            funcs[f]=window[f];
        }
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
    try{ funcs.Silverdata(q); }
    finally{ silverLock=false; }
};

/* ================= GOLD ================= */
let goldLock=false;
window.loadGold = async function(q){
    const funcs = await loadModule('gold-rates');
    if(!funcs?.golddata) return;
    if(goldLock) return delay(()=>window.loadGold(q),200);
    goldLock=true;
    try{ funcs.golddata(q); }
    finally{ goldLock=false; }
};
})();