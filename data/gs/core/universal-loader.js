(async function(){
/* ================= CONFIG ================= */
const DEBUG = true;
const log = (...a)=>DEBUG && console.log("[UL]",...a);
const manifestURL = "gs-manifest.json"; 
const moduleCache = {};  

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
            el.onerror=()=>{
                moduleCache[url]=true;
                alert(`फ़ाइल लोड नहीं हो पाई: ${url}`);
                rej(`Failed to load ${url}`);
            };
        } else {
            el=document.createElement('link');
            el.href=url;
            el.rel='stylesheet';
            el.onload=()=>{moduleCache[url]=true; res();};
            el.onerror=()=>{
                moduleCache[url]=true;
                alert(`CSS लोड नहीं हो पाई: ${url}`);
                rej(`Failed to load ${url}`);
            };
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
    if(map[k].range?.includes(n)) return {id:map[k].id};
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

    await loadFilesSequential(mod.files);  

    const funcs = {};
    if(mod.functions){
        for(const f of mod.functions){
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
let silverCfg=null, silverLock=false;

window.loadSilver = async function(q){
    const funcs = await loadModule('silver-rates');
    if(!funcs?.Silverdata) return;
    if(silverLock) return delay(()=>window.loadSilver(q),200);
    silverLock=true;

    const startSilver = ()=>{
        const n=parseInt(q.replace(/\D/g,'')),
              cfg=findCfg(silverCfg,n);
        if(!cfg){ silverLock=false; return; }

        fetch(`https://docs.google.com/spreadsheets/d/${cfg.id}/gviz/tq?tqx=out:json&sheet=silvweb&tq=select * limit 15`)
          .then(r=>r.text())
          .then(t=>{
            const rows=parseGViz(t,15);
            if(!rows.length){ silverLock=false; return delay(startSilver,400); }
            funcs.Silverdata(q);  
            silverLock=false;
          }).catch(()=>{ 
            silverLock=false; 
            alert("सिल्वर डेटा लोड नहीं हो पाया। कृपया बाद में पुनः प्रयास करें।");
          });
    };

    if(!silverCfg){
        fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/silver-groups.json')
          .then(r=>r.json())
          .then(j=>{ silverCfg=j; startSilver(); })
          .catch(()=>{ silverLock=false; alert("सिल्वर कॉन्फ़िग डेटा लोड नहीं हुआ।"); });
    } else startSilver();
};

/* ================= GOLD ================= */
let goldCfg=null, goldLock=false;

window.loadGold = async function(q){
    const funcs = await loadModule('gold-rates');
    if(!funcs?.golddata) return;
    if(goldLock) return delay(()=>window.loadGold(q),200);
    goldLock=true;

    const startGold = ()=>{
        const n=parseInt(q.replace(/\D/g,'')),
              cfg=findCfg(goldCfg,n);
        if(!cfg){ goldLock=false; return; }

        fetch(`https://docs.google.com/spreadsheets/d/${cfg.id}/gviz/tq?tqx=out:json&sheet=goldweb&tq=select * limit 15`)
          .then(r=>r.text())
          .then(t=>{
            const rows=parseGViz(t,15);
            if(!rows.length){ goldLock=false; return delay(startGold,400); }
            funcs.golddata(q);  
            goldLock=false;
          }).catch(()=>{ 
            goldLock=false; 
            alert("गोल्ड डेटा लोड नहीं हो पाया। कृपया बाद में पुनः प्रयास करें।");
          });
    };

    if(!goldCfg){
        fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/gold-groups.json')
          .then(r=>r.json())
          .then(j=>{ goldCfg=j; startGold(); })
          .catch(()=>{ goldLock=false; alert("गोल्ड कॉन्फ़िग डेटा लोड नहीं हुआ।"); });
    } else startGold();
};
})();