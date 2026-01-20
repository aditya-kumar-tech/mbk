// universal-loader.js v8.7
(function(){
    console.log("🚀 Universal Loader v8.7 – Conditional Silver & Gold Loader with Queue");

    const RUPEE = "₹";
    const MAX_HISTORY = 15;

    function rs(v){return RUPEE + Number(v||0).toLocaleString("hi-IN");}

    /* ================= Chart.js Lazy Load ================= */
    function loadChartJS(cb){
        if(window.Chart) return cb();
        const s=document.createElement('script');
        s.src='https://cdn.jsdelivr.net/npm/chart.js';
        s.onload=cb;
        document.head.appendChild(s);
    }

    /* ================= GViz Parser ================= */
    function parseGViz(txt){
        try{
            txt=txt.replace(/^\s*\/\*O_o\*\/\s*/,"")
                   .replace(/^google\.visualization\.Query\.setResponse\s*\(/,"")
                   .replace(/\);?\s*$/,"");
            return JSON.parse(txt).table.rows||[];
        }catch(e){
            console.error("GViz parse failed",e);
            return [];
        }
    }

    /* ================= Config Finder ================= */
    function findCfg(map,num){
        for(const k in map){
            const r=map[k].range;
            if(Array.isArray(r)&&r.includes(num)){
                return {id: map[k].id, off:r.indexOf(num)};
            }
        }
        return null;
    }

    /* ========================== Silver ========================== */
    let silverCfg=null, SILVER_QUEUE=[];
    function processSilverQueue(){
        while(SILVER_QUEUE.length && silverCfg){
            const args=SILVER_QUEUE.shift();
            _runSilver(...args);
        }
    }

    if(typeof Silverdata==='function'){
        fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/silver-groups.json')
            .then(r=>r.json())
            .then(j=>{
                silverCfg=j;
                console.log('✔ Silver config loaded');
                processSilverQueue();
            })
            .catch(e=>console.error("Silver config fetch failed",e));
    }

    function SilverdataSafe(q,mtype){
        if(!silverCfg){
            SILVER_QUEUE.push([q,mtype]);
            console.log("⏳ Silver queued:",q);
            return;
        }
        _runSilver(q,mtype);
    }

    function _runSilver(q,mtype){
        const num=Number(String(q).replace(/\D/g,""));
        const cfg=findCfg(silverCfg,num);
        if(!cfg){console.warn("❌ Silver cfg not found",q); return;}

        const url=`https://docs.google.com/spreadsheets/d/${cfg.id}/gviz/tq?tqx=out:json&sheet=silvweb&tq=select * limit ${MAX_HISTORY}`;

        fetch(url).then(r=>r.text())
            .then(t=>{
                let rows=parseGViz(t);
                rows.sort((a,b)=>new Date(b.c[0]?.f)-new Date(a.c[0]?.f));
                renderSilver(rows.slice(0,MAX_HISTORY));
            })
            .catch(err=>{
                console.error("Silver fetch failed, retrying...",err);
                setTimeout(()=>_runSilver(q,mtype),1500);
            });
    }

    function renderSilver(rows){
        if(!rows.length) return;
        const priceKg=rows[0]?.c[2]?.v||0;
        if(window.silvr_pricet) silvr_pricet.innerHTML=rs(priceKg);
        if(window.udat) udat.textContent=new Date().toLocaleDateString('hi-IN');

        // gram table
        const gramTbl=document.getElementById('silvr_gramtbl');
        if(gramTbl){
            let html='<table style="width:100%;border-collapse:collapse;">';
            [1,10,50,100,500,1000].forEach(g=>{
                const val=Math.round((g/1000)*priceKg);
                html+=`<tr><td>${g}g</td><td style="text-align:right">${rs(val)}</td></tr>`;
            });
            html+='</table>';
            gramTbl.innerHTML=html;
        }

        // history table
        const histTbl=document.getElementById('data_table1');
        if(histTbl){
            let html='<table style="width:100%;border-collapse:collapse;"><tr><th>Date</th><th>1kg Price</th></tr>';
            rows.forEach(r=>{
                const date=r.c[0]?.f||'';
                const val=r.c[2]?.v||0;
                html+=`<tr><td>${date}</td><td style="text-align:right">${rs(val)}</td></tr>`;
            });
            html+='</table>';
            histTbl.innerHTML=html;
        }

        // graph
        const graf=document.getElementById('silvr_graf');
        if(graf){
            loadChartJS(()=>{
                graf.innerHTML='<canvas id="silverChart"></canvas>';
                new Chart(document.getElementById('silverChart').getContext('2d'),{
                    type:'line',
                    data:{
                        labels:rows.map(r=>r.c[0]?.f||''),
                        datasets:[{
                            label:'Silver 1kg',
                            data:rows.map(r=>r.c[2]?.v||0),
                            borderColor:'#0d6efd',
                            backgroundColor:'rgba(13,110,253,0.2)',
                            tension:0.3
                        }]
                    },
                    options:{responsive:true, maintainAspectRatio:false}
                });
            });
        }
    }

    window.SilverdataSafe=SilverdataSafe;

    /* ========================== Gold ========================== */
    let goldCfg=null, GOLD_QUEUE=[];
    function processGoldQueue(){
        while(GOLD_QUEUE.length && goldCfg){
            const args=GOLD_QUEUE.shift();
            _runGold(...args);
        }
    }

    if(typeof golddata==='function'){
        fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/gold-groups.json')
            .then(r=>r.json())
            .then(j=>{
                goldCfg=j;
                console.log('✔ Gold config loaded');
                processGoldQueue();
            })
            .catch(e=>console.error("Gold config fetch failed",e));
    }

    function golddataSafe(q,mtype){
        if(!goldCfg){
            GOLD_QUEUE.push([q,mtype]);
            console.log("⏳ Gold queued:",q);
            return;
        }
        _runGold(q,mtype);
    }

    function _runGold(q,mtype){
        const num=Number(String(q).replace(/\D/g,""));
        const cfg=findCfg(goldCfg,num);
        if(!cfg){console.warn("❌ Gold cfg not found",q); return;}

        const url=`https://docs.google.com/spreadsheets/d/${cfg.id}/gviz/tq?tqx=out:json&sheet=goldweb&tq=select * limit ${MAX_HISTORY}`;

        fetch(url).then(r=>r.text())
            .then(t=>{
                let rows=parseGViz(t).slice(0,MAX_HISTORY);
                renderGold(rows);
            })
            .catch(err=>{
                console.error("Gold fetch failed, retrying...",err);
                setTimeout(()=>_runGold(q,mtype),1500);
            });
    }

    function renderGold(rows){
        if(!rows.length) return;
        const p22=rows[0]?.c[1]?.v||0;
        const p24=rows[0]?.c[3]?.v||0;
        if(window.g22kt) g22kt.textContent=rs(p22);
        if(window.g24kt) g24kt.textContent=rs(p24);
        if(window.udat) udat.textContent=new Date().toLocaleDateString('hi-IN');

        // history tables
        const hist22=document.getElementById('data_table1');
        if(hist22){
            let html='<table style="width:100%;border-collapse:collapse;"><tr><th>Date</th><th>22K Price</th></tr>';
            rows.forEach(r=>html+=`<tr><td>${r.c[0]?.f||''}</td><td style="text-align:right">${rs(r.c[1]?.v||0)}</td></tr>`);
            html+='</table>'; hist22.innerHTML=html;
        }
        const hist24=document.getElementById('data_table2');
        if(hist24){
            let html='<table style="width:100%;border-collapse:collapse;"><tr><th>Date</th><th>24K Price</th></tr>';
            rows.forEach(r=>html+=`<tr><td>${r.c[0]?.f||''}</td><td style="text-align:right">${rs(r.c[3]?.v||0)}</td></tr>`);
            html+='</table>'; hist24.innerHTML=html;
        }

        // graph
        const grafEl=document.getElementById('gldgraf');
        if(grafEl){
            loadChartJS(()=>{
                grafEl.innerHTML='<canvas id="goldChart"></canvas>';
                new Chart(document.getElementById('goldChart').getContext('2d'),{
                    type:'line',
                    data:{
                        labels:rows.map(r=>r.c[0]?.f||''),
                        datasets:[
                            {label:'22K Gold', data:rows.map(r=>r.c[1]?.v||0), borderColor:'#d97706', backgroundColor:'rgba(217,119,6,0.2)', tension:0.3},
                            {label:'24K Gold', data:rows.map(r=>r.c[3]?.v||0), borderColor:'#a855f7', backgroundColor:'rgba(168,85,247,0.2)', tension:0.3}
                        ]
                    },
                    options:{responsive:true, maintainAspectRatio:false}
                });
            });
        }
    }

    window.golddataSafe=golddataSafe;
})();
