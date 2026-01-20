(function () {
    console.log("🚀 Universal Loader v8.2 - Gold & Silver SAFE Auto + Sorted History");

    // ====================== LOAD Chart.js ======================
    function loadChartJS(cb){
        if(window.Chart) return cb();
        const s=document.createElement('script');
        s.src="https://cdn.jsdelivr.net/npm/chart.js";
        s.onload=cb;
        document.head.appendChild(s);
    }

    // ====================== GVIZ PARSER ======================
    function parseGViz(txt){
        try{
            txt = txt.replace(/^\s*\/\*O_o\*\/\s*/, '')
                     .replace(/^google\.visualization\.Query\.setResponse\s*\(/, '')
                     .replace(/\);?\s*$/, '');
            return JSON.parse(txt).table.rows || [];
        }catch(e){
            console.error("GViz parse failed",e);
            return [];
        }
    }

    // ====================== FIND CONFIG ======================
    function findCfg(map,n){
        for(const k in map){
            const r=map[k].range;
            if(Array.isArray(r) && r.includes(n)){
                return {id:map[k].id,off:r.indexOf(n)};
            }
        }
        return null;
    }

    // ====================== SAFE QUEUE ======================
    window._mbkQueue = window._mbkQueue || [];
    function processMBKQueue(){
        window._mbkQueue = window._mbkQueue.filter(x=>{
            if(typeof window[x.fn]==="function"){
                window[x.fn](...x.args);
                return false;
            }
            return true;
        });
    }

    // ====================== QUERY MEMORY ======================
    window.__MBK_LAST_SILVER_Q = null;
    window.__MBK_LAST_GOLD_Q   = null;

    // ========================= SILVER =========================
    let silverQueue=[], silverConfig=null;

    const _Silverdata = window.Silverdata;
    window.Silverdata = function(q,t){
        window.__MBK_LAST_SILVER_Q = q;
        let n=parseInt(String(q).replace(/\D/g,''));
        if(!isNaN(n)) silverQueue.push(n);
        if(silverConfig) runSilver();
        processMBKQueue();
        if(typeof _Silverdata==="function") _Silverdata(q,t);
    };

    function runSilver(){
        if(!silverQueue.length) return;
        const num=silverQueue.pop();
        const cfg=findCfg(silverConfig,num);
        if(!cfg) return;

        const url=`https://docs.google.com/spreadsheets/d/${cfg.id}/gviz/tq?tqx=out:json&sheet=silvweb`;
        fetch(url).then(r=>r.text()).then(t=>{
            let rows=parseGViz(t);

            // ✅ DATE SORT DESC (LATEST FIRST)
            rows.sort((a,b)=>{
                const da=new Date(a.c[0]?.v||0);
                const db=new Date(b.c[0]?.v||0);
                return db-da;
            });

            rows=rows.slice(0,15);
            renderSilver(rows);
        }).catch(()=>setTimeout(runSilver,1500));
    }

    function renderSilver(rows){
        if(!rows.length) return;

        const priceKg=rows[0].c[2]?.v||0;
        if(window.silvr_pricet) silvr_pricet.innerHTML=`₹${priceKg.toLocaleString('hi-IN')}`;
        if(window.udat) udat.textContent=new Date().toLocaleDateString('hi-IN');

        const hist=document.getElementById('data_table1');
        if(hist){
            let h='<table style="width:100%;border-collapse:collapse"><tr><th>तारीख</th><th>1kg भाव</th></tr>';
            rows.forEach(r=>{
                h+=`<tr><td>${r.c[0]?.f||''}</td><td style="text-align:right">₹${(r.c[2]?.v||0).toLocaleString()}</td></tr>`;
            });
            hist.innerHTML=h+'</table>';
        }

        const graf=document.getElementById('silvr_graf');
        if(graf){
            loadChartJS(()=>{
                graf.innerHTML='<canvas id="silverChart"></canvas>';
                new Chart(silverChart,{
                    type:'line',
                    data:{
                        labels:rows.map(r=>r.c[0]?.f||''),
                        datasets:[{
                            label:'Silver 1kg',
                            data:rows.map(r=>r.c[2]?.v||0),
                            borderColor:'#0d6efd',
                            tension:0.3
                        }]
                    },
                    options:{responsive:true}
                });
            });
        }
    }

    // ========================= GOLD =========================
    let goldQueue=[], goldConfig=null;

    const _golddata = window.golddata;
    window.golddata = function(q,t){
        window.__MBK_LAST_GOLD_Q = q;
        let n=parseInt(String(q).replace(/\D/g,''));
        if(!isNaN(n)) goldQueue.push(n);
        if(goldConfig) runGold();
        processMBKQueue();
        if(typeof _golddata==="function") _golddata(q,t);
    };

    function runGold(){
        if(!goldQueue.length) return;
        const num=goldQueue.pop();
        const cfg=findCfg(goldConfig,num);
        if(!cfg) return;

        fetch(`https://docs.google.com/spreadsheets/d/${cfg.id}/gviz/tq?tqx=out:json&sheet=goldweb`)
        .then(r=>r.text()).then(t=>{
            let rows=parseGViz(t);
            rows.sort((a,b)=>new Date(b.c[0]?.v)-new Date(a.c[0]?.v));
            renderGold(rows.slice(0,20));
        });
    }

    function renderGold(rows){
        if(!rows.length) return;
        if(window.g22kt) g22kt.textContent=`₹${rows[0].c[1]?.v||0}`;
        if(window.g24kt) g24kt.textContent=`₹${rows[0].c[3]?.v||0}`;
    }

    // ====================== CONFIG LOAD ======================
    fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/silver-groups.json')
        .then(r=>r.json()).then(j=>{silverConfig=j; if(__MBK_LAST_SILVER_Q) Silverdata(__MBK_LAST_SILVER_Q);});

    fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/gold-groups.json')
        .then(r=>r.json()).then(j=>{goldConfig=j; if(__MBK_LAST_GOLD_Q) golddata(__MBK_LAST_GOLD_Q);});

})();