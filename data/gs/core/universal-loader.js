(function () {
    console.log("🚀 Universal Loader v8.6 – Conditional Gold & Silver Loader with Queue & 15-days");

    const RUPEE = "₹";
    function rs(v) { return RUPEE + Number(v||0).toLocaleString("hi-IN"); }

    let chartLoaded = false;
    function loadChartJS(cb){
        if(window.Chart){ cb(); return; }
        const s=document.createElement('script');
        s.src="https://cdn.jsdelivr.net/npm/chart.js";
        s.onload=()=>{ chartLoaded=true; console.log("✅ Chart.js loaded"); cb(); };
        document.head.appendChild(s);
    }

    function parseGViz(txt){
        try{
            txt = txt.replace(/^\s*\/\*O_o\*\/\s*/,"")
                     .replace(/^google\.visualization\.Query\.setResponse\s*\(/,"")
                     .replace(/\);?\s*$/,"");
            return JSON.parse(txt).table.rows || [];
        }catch(e){ console.error("❌ GViz parse failed",e); return []; }
    }

    function findCfg(map,num){
        for(const k in map){ const r=map[k].range;
            if(Array.isArray(r) && r.includes(num)) return {id:map[k].id,off:r.indexOf(num)};
        } return null;
    }

    /* ======= QUEUE SYSTEM ======= */
    const queue = [];
    function enqueue(fn) { queue.push(fn); }
    function processQueue() {
        while(queue.length>0){ const fn=queue.shift(); fn(); }
    }

    /* ================= SILVER ================= */
    let silverCfg=null, SILVER_HIST=[];
    function initSilver(){
        if(typeof Silverdata!=='function'){ console.log("⚪ Silverdata not found – skipped"); return; }
        console.log("🔹 Silverdata exists – fetching config...");
        fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/silver-groups.json')
            .then(r=>r.json()).then(j=>{
                silverCfg=j; console.log("✔ Silver config loaded");
                if(window.sctqury && window.mtype==='Silver') SilverdataSafe(window.sctqury,window.mtype);
                processQueue();
            }).catch(e=>{ console.error("❌ Silver config fetch failed",e); });
    }

    window.SilverdataSafe=function(q,mtype){
        if(!silverCfg){ 
            enqueue(()=>SilverdataSafe(q,mtype)); 
            return; 
        }

        const num=Number(String(q).replace(/\D/g,""));
        const cfg=findCfg(silverCfg,num);
        if(!cfg) return console.warn("❌ Silver cfg not found",q);

        const url=`https://docs.google.com/spreadsheets/d/${cfg.id}/gviz/tq?tqx=out:json&sheet=silvweb&tq=select * limit 15`;
        fetch(url).then(r=>r.text()).then(t=>{
            let rows=parseGViz(t);
            // sort by date descending
            rows.sort((a,b)=>new Date(b.c[0]?.f)-new Date(a.c[0]?.f));
            SILVER_HIST=rows.slice(0,15); // strictly last 15 days
            renderSilver(SILVER_HIST);
        }).catch(e=>{ console.error("Silver fetch failed, retrying...",e); setTimeout(()=>SilverdataSafe(q,mtype),1500); });
    };

    function renderSilver(rows){
        if(!rows.length) return;
        if(window.silvr_pricet) silvr_pricet.innerHTML=rs(rows[0]?.c[2]?.v||0);
        if(window.udat) udat.textContent=new Date().toLocaleDateString('hi-IN');

        const gramTbl=document.getElementById('silvr_gramtbl');
        if(gramTbl){
            let html='<table style="width:100%;border-collapse:collapse;">';
            [1,10,50,100,500,1000].forEach(g=>{ const val=Math.round((g/1000)*(rows[0]?.c[2]?.v||0));
                html+=`<tr><td>${g}g</td><td style="text-align:right">${rs(val)}</td></tr>`; });
            html+='</table>'; gramTbl.innerHTML=html;
        }

        const histTbl=document.getElementById('data_table1');
        if(histTbl){ let html='<table style="width:100%;border-collapse:collapse;"><tr><th>Date</th><th>1kg Price</th></tr>';
            rows.forEach(r=>html+=`<tr><td>${r.c[0]?.f||''}</td><td style="text-align:right">${rs(r.c[2]?.v||0)}</td></tr>`);
            html+='</table>'; histTbl.innerHTML=html;
        }

        const graf=document.getElementById('silvr_graf');
        if(graf){
            loadChartJS(()=>{ graf.innerHTML='<canvas id="silverChart"></canvas>';
                new Chart(document.getElementById('silverChart').getContext('2d'),{
                    type:'line',
                    data:{ labels:rows.map(r=>r.c[0]?.f||''), datasets:[{label:'Silver 1kg', data:rows.map(r=>r.c[2]?.v||0), borderColor:'#0d6efd', backgroundColor:'rgba(13,110,253,0.2)', tension:0.3}] },
                    options:{responsive:true, maintainAspectRatio:false}
                });
            });
        }
        console.log("✔ Silver rendered");
    }

    /* ================= GOLD ================= */
    let goldCfg=null;
    function initGold(){
        if(typeof golddata!=='function'){ console.log("⚪ golddata not found – skipped"); return; }
        console.log("🔹 golddata exists – fetching config...");
        fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/gold-groups.json')
            .then(r=>r.json()).then(j=>{
                goldCfg=j; console.log("✔ Gold config loaded");
                if(window.gctqury && window.mtype==='Gold') golddataSafe(window.gctqury,window.mtype);
                processQueue();
            }).catch(e=>{ console.error("❌ Gold config fetch failed",e); });
    }

    window.golddataSafe=function(q,mtype){
        if(!goldCfg){ 
            enqueue(()=>golddataSafe(q,mtype)); 
            return; 
        }

        const num=Number(String(q).replace(/\D/g,""));
        const cfg=findCfg(goldCfg,num);
        if(!cfg) return console.warn("❌ Gold cfg not found",q);

        const url=`https://docs.google.com/spreadsheets/d/${cfg.id}/gviz/tq?tqx=out:json&sheet=goldweb&tq=select * limit 15`;
        fetch(url).then(r=>r.text()).then(t=>renderGold(parseGViz(t).slice(0,15)))
        .catch(e=>{ console.error("Gold fetch failed, retrying...",e); setTimeout(()=>golddataSafe(q,mtype),1500); });
    };

    function renderGold(rows){
        if(!rows.length) return;
        if(window.g22kt) g22kt.textContent=rs(rows[0]?.c[1]?.v||0);
        if(window.g24kt) g24kt.textContent=rs(rows[0]?.c[3]?.v||0);
        if(window.udat) udat.textContent=new Date().toLocaleDateString('hi-IN');

        const hist22=document.getElementById('data_table1');
        const hist24=document.getElementById('data_table2');
        if(hist22){ let html='<table><tr><th>Date</th><th>22K Price</th></tr>'; rows.forEach(r=>html+=`<tr><td>${r.c[0]?.f||''}</td><td>${rs(r.c[1]?.v||0)}</td></tr>`); html+='</table>'; hist22.innerHTML=html; }
        if(hist24){ let html='<table><tr><th>Date</th><th>24K Price</th></tr>'; rows.forEach(r=>html+=`<tr><td>${r.c[0]?.f||''}</td><td>${rs(r.c[3]?.v||0)}</td></tr>`); html+='</table>'; hist24.innerHTML=html; }

        const grafEl=document.getElementById('gldgraf');
        if(grafEl){ loadChartJS(()=>{ grafEl.innerHTML='<canvas id="goldChart"></canvas>';
            new Chart(document.getElementById('goldChart').getContext('2d'),{
                type:'line',
                data:{ labels:rows.map(r=>r.c[0]?.f||''), datasets:[
                    {label:'22K Gold', data:rows.map(r=>r.c[1]?.v||0), borderColor:'#d97706', backgroundColor:'rgba(217,119,6,0.2)', tension:0.3},
                    {label:'24K Gold', data:rows.map(r=>r.c[3]?.v||0), borderColor:'#a855f7', backgroundColor:'rgba(168,85,247,0.2)', tension:0.3}
                ]},
                options:{responsive:true, maintainAspectRatio:false}
            }); });
        }
        console.log("✔ Gold rendered");
    }

    /* ================= AUTO INIT ================= */
    window.addEventListener('load',()=>{
        initSilver();
        initGold();
    });

})();
