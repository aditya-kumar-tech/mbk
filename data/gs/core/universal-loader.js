(function () {
console.log("🚀 Universal Loader v8.2 FINAL – Gold & Silver SAFE");

let chartLoaded = false;
function loadChartJS(cb){
    if(window.Chart){ cb(); return; }
    if(chartLoaded) return;
    chartLoaded = true;
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/chart.js";
    s.onload = cb;
    document.head.appendChild(s);
}

// ================= GViz PARSER =================
function parseGViz(txt){
    try{
        txt = txt.replace(/^\s*\/\*O_o\*\/\s*/,'')
                 .replace(/^google\.visualization\.Query\.setResponse\s*\(/,'')
                 .replace(/\);?\s*$/,'');
        return JSON.parse(txt).table.rows || [];
    }catch(e){
        console.error("GViz parse error",e);
        return [];
    }
}

// ================= SAFE ₹ FORMAT =================
function rupee(val){
    return "₹" + Number(val||0).toLocaleString("hi-IN");
}

// ================= CONFIG FIND =================
function findCfg(map,n){
    for(const k in map){
        const r = map[k].range;
        if(n>=r[0] && n<=r[1]){
            return {id:map[k].id,off:n-r[0]};
        }
    }
    return null;
}

// ================= SILVER =================
let silverQueue=[], silverConfig=null;

window.Silverdata=function(q){
    const num=parseInt(String(q).replace(/\D/g,''))||0;
    silverQueue.push(num);
    if(silverConfig) runSilver();
};

function runSilver(){
    if(!silverQueue.length) return;
    const cfg=findCfg(silverConfig,silverQueue.pop());
    if(!cfg) return;

    fetch(`https://docs.google.com/spreadsheets/d/${cfg.id}/gviz/tq?tqx=out:json&sheet=silvweb&tq=select * limit 15 offset ${cfg.off}`)
    .then(r=>r.text())
    .then(t=>{
        const rows=parseGViz(t);
        if(!rows.length){ setTimeout(runSilver,1500); return; }
        renderSilver(rows);
    })
    .catch(()=>setTimeout(runSilver,1500));
}

function renderSilver(rows){
    const priceKg = rows[0]?.c[2]?.v||0;

    if(window.silvr_pricet){
        silvr_pricet.textContent = rupee(priceKg);
    }
    if(window.udat){
        udat.textContent = new Date().toLocaleDateString("hi-IN");
    }

    const tbl=document.getElementById("data_table1");
    if(tbl){
        let h=`<table style="width:100%;border-collapse:collapse">
        <tr style="background:#e6f3ff"><th>तारीख</th><th>1Kg</th></tr>`;
        const seen=new Set();
        rows.forEach(r=>{
            const d=r.c[0]?.f||"";
            if(seen.has(d)) return;
            seen.add(d);
            h+=`<tr><td>${d}</td><td style="text-align:right">${rupee(r.c[2]?.v)}</td></tr>`;
        });
        h+=`</table>`;
        tbl.innerHTML=h;
    }

    const graf=document.getElementById("silvr_graf");
    if(graf){
        loadChartJS(()=>{
            requestAnimationFrame(()=>{
                graf.innerHTML='<canvas id="silverChart"></canvas>';
                const c=document.getElementById("silverChart");
                if(!c) return;
                new Chart(c,{
                    type:"line",
                    data:{
                        labels:rows.map(r=>r.c[0]?.f||""),
                        datasets:[{
                            label:"Silver 1Kg",
                            data:rows.map(r=>r.c[2]?.v||0),
                            borderColor:"#0d6efd",
                            tension:0.3
                        }]
                    },
                    options:{responsive:true}
                });
            });
        });
    }
}

// ================= GOLD =================
let goldQueue=[], goldConfig=null;

window.golddata=function(q){
    const num=parseInt(String(q).replace(/\D/g,''))||0;
    goldQueue.push(num);
    if(goldConfig) runGold();
};

function runGold(){
    if(!goldQueue.length) return;
    const cfg=findCfg(goldConfig,goldQueue.pop());
    if(!cfg) return;

    fetch(`https://docs.google.com/spreadsheets/d/${cfg.id}/gviz/tq?tqx=out:json&sheet=goldweb&tq=select * limit 20`)
    .then(r=>r.text())
    .then(t=>{
        const rows=parseGViz(t);
        if(!rows.length){ setTimeout(runGold,1500); return; }
        renderGold(rows);
    })
    .catch(()=>setTimeout(runGold,1500));
}

function renderGold(rows){
    const p22=rows[0]?.c[1]?.v||0;
    const p24=rows[0]?.c[3]?.v||0;

    if(window.g22kt) g22kt.textContent=rupee(p22);
    if(window.g24kt) g24kt.textContent=rupee(p24);

    const graf=document.getElementById("gldgraf");
    if(graf){
        loadChartJS(()=>{
            requestAnimationFrame(()=>{
                graf.innerHTML='<canvas id="goldChart"></canvas>';
                const c=document.getElementById("goldChart");
                if(!c) return;
                new Chart(c,{
                    type:"line",
                    data:{
                        labels:rows.map(r=>r.c[0]?.f||""),
                        datasets:[
                            {label:"22K",data:rows.map(r=>r.c[1]?.v||0),borderColor:"#d97706"},
                            {label:"24K",data:rows.map(r=>r.c[3]?.v||0),borderColor:"#9333ea"}
                        ]
                    },
                    options:{responsive:true}
                });
            });
        });
    }
}

// ================= CONFIG LOAD =================
fetch("https://aditya-kumar-tech.github.io/mbk/data/gs/silver-groups.json")
.then(r=>r.json()).then(j=>{silverConfig=j; runSilver();});

fetch("https://aditya-kumar-tech.github.io/mbk/data/gs/gold-groups.json")
.then(r=>r.json()).then(j=>{goldConfig=j; runGold();});

// ================= GLOBAL IDS =================
window.g22kt=document.querySelector("#g22kt");
window.g24kt=document.querySelector("#g24kt");
window.udat=document.querySelector("#udat");
window.silvr_pricet=document.querySelector("#silvr_pricet");

})();
