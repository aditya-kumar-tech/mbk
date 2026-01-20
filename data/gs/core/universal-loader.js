(function(){
    console.log("🚀 Universal Loader v11.0 - Page-Aware Silver & Gold");

    // ====================== Chart.js Loader ======================
    function loadChartJS(cb){
        if(window.Chart) return cb();
        const s=document.createElement('script');
        s.src="https://cdn.jsdelivr.net/npm/chart.js";
        s.onload=cb;
        document.head.appendChild(s);
    }

    // ====================== GViz Parser & Date Sort ======================
    function parseGViz(txt){
        try{
            txt = txt.replace(/^\s*\/\*O_o\*\/\s*/, '')
                     .replace(/^google\.visualization\.Query\.setResponse\s*\(/, '')
                     .replace(/\);?\s*$/, '');
            const rows = JSON.parse(txt).table.rows || [];
            rows.sort((a,b)=>{
                const da=new Date(a.c[0]?.f||a.c[0]?.v);
                const db=new Date(b.c[0]?.f||b.c[0]?.v);
                return db-da;
            });
            return rows.slice(0,15); // last 15 days
        }catch(e){console.error("GViz parse failed", e); return [];}
    }

    function findCfg(map, n){
        for(const k in map){
            const r=map[k].range;
            if(Array.isArray(r) && r.includes(n)) return {id: map[k].id, off: r.indexOf(n)};
        }
        return null;
    }

    // ====================== Silver ======================
    let silverCfg=null;
    if(document.querySelector('#silvr_pricet') || document.querySelector('#silvr_gramtbl')){
        fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/silver-groups.json')
            .then(r=>r.json())
            .then(j=>{silverCfg=j; console.log('✔ Silver config loaded');});
        
        window.Silverdata=function(q,mtype){
            if(!silverCfg){setTimeout(()=>Silverdata(q,mtype),500); return;}
            if(!document.querySelector('#silvr_pricet')) return; // skip if Silver table not on page

            const num=parseInt(String(q).replace(/\D/g,'')), cfg=findCfg(silverCfg,num);
            if(!cfg){console.warn("Silver cfg not found",q); return;}

            const url=`https://docs.google.com/spreadsheets/d/${cfg.id}/gviz/tq?tqx=out:json&sheet=silvweb&tq=select * limit 15`;
            fetch(url).then(r=>r.text()).then(t=>{
                const rows=parseGViz(t);
                renderSilver(rows);
            }).catch(e=>console.error("Silver fetch failed",e));
        };

        function renderSilver(rows){
            if(!rows.length) return;

            const priceKg=rows[0].c[2]?.v||0;
            if(window.silvr_pricet) silvr_pricet.innerHTML=`₹${priceKg.toLocaleString('hi-IN')}`;
            if(window.udat) udat.textContent=new Date().toLocaleDateString('hi-IN');

            // gram table
            const gramTbl=document.getElementById('silvr_gramtbl');
            if(gramTbl){
                let html='<table style="width:100%;border-collapse:collapse;">';
                [1,10,50,100,500,1000].forEach(g=>{
                    const val=Math.round((g/1000)*priceKg);
                    html+=`<tr><td>${g}g</td><td style="text-align:right;">₹${val.toLocaleString()}</td></tr>`;
                });
                html+='</table>';
                gramTbl.innerHTML=html;
            }

            // history table
            const histTbl=document.getElementById('data_table1');
            if(histTbl){
                let html='<table style="width:100%;border-collapse:collapse;"><tr style="background:#e6f3ff;"><th>Date</th><th>1kg Price</th></tr>';
                rows.forEach(r=>{
                    const date=r.c[0]?.f||'';
                    const val=r.c[2]?.v||0;
                    html+=`<tr><td>${date}</td><td style="text-align:right;">₹${val.toLocaleString()}</td></tr>`;
                });
                html+='</table>'; histTbl.innerHTML=html;
            }

            // graph
            const grafEl=document.getElementById('silvr_graf');
            if(grafEl){
                loadChartJS(()=>{
                    grafEl.innerHTML='<canvas id="silverChart" width="700" height="400"></canvas>';
                    const ctx=document.getElementById('silverChart').getContext('2d');
                    new Chart(ctx,{
                        type:'line',
                        data:{
                            labels:rows.map(r=>r.c[0]?.f||''),
                            datasets:[{label:'Silver 1kg',data:rows.map(r=>r.c[2]?.v||0),borderColor:'#0d6efd',backgroundColor:'rgba(13,110,253,0.2)',tension:0.3}]
                        },
                        options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:true}}}
                    });
                });
            }
        }
    }

    // ====================== Gold ======================
    let goldCfg=null;
    if(document.querySelector('#g22kt') || document.querySelector('#g24kt')){
        fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/gold-groups.json')
            .then(r=>r.json())
            .then(j=>{goldCfg=j; console.log('✔ Gold config loaded');});

        window.golddata=function(q,mtype){
            if(!goldCfg){setTimeout(()=>golddata(q,mtype),500); return;}
            if(!document.querySelector('#g22kt') && !document.querySelector('#g24kt')) return; // skip if Gold table not on page

            const num=parseInt(String(q).replace(/\D/g,'')), cfg=findCfg(goldCfg,num);
            if(!cfg){console.warn("Gold cfg not found",q); return;}

            const url=`https://docs.google.com/spreadsheets/d/${cfg.id}/gviz/tq?tqx=out:json&sheet=goldweb&tq=select * limit 15`;
            fetch(url).then(r=>r.text()).then(t=>{
                const rows=parseGViz(t);
                renderGold(rows);
            }).catch(e=>console.error("Gold fetch failed",e));
        };

        function renderGold(rows){
            if(!rows.length) return;
            const p22=rows[0].c[1]?.v||0;
            const p24=rows[0].c[3]?.v||0;
            if(window.g22kt) g22kt.textContent=`₹${p22.toLocaleString('hi-IN')}`;
            if(window.g24kt) g24kt.textContent=`₹${p24.toLocaleString('hi-IN')}`;
            if(window.udat) udat.textContent=new Date().toLocaleDateString('hi-IN');

            // gram tables
            function updateGram(id,val){
                const el=document.getElementById(id);
                if(el){
                    let html='<table style="width:100%;border-collapse:collapse;">';
                    [1,5,10,50,100].forEach(g=>html+=`<tr><td>${g}g</td><td style="text-align:right;">₹${Math.round(val*g)}</td></tr>`);
                    html+='</table>';
                    el.innerHTML=html;
                }
            }
            updateGram('gramtbl22',p22); updateGram('gramtbl24',p24);

            // history tables
            const hist22=document.getElementById('data_table1');
            const hist24=document.getElementById('data_table2');
            if(hist22){
                let html='<table style="width:100%;border-collapse:collapse;"><tr style="background:#fef3c7;"><th>Date</th><th>22K Price</th></tr>';
                rows.forEach(r=>html+=`<tr><td>${r.c[0]?.f||''}</td><td style="text-align:right;">₹${r.c[1]?.v||0}</td></tr>`); html+='</table>'; hist22.innerHTML=html;
            }
            if(hist24){
                let html='<table style="width:100%;border-collapse:collapse;"><tr style="background:#f3e8ff;"><th>Date</th><th>24K Price</th></tr>';
                rows.forEach(r=>html+=`<tr><td>${r.c[0]?.f||''}</td><td style="text-align:right;">₹${r.c[3]?.v||0}</td></tr>`); html+='</table>'; hist24.innerHTML=html;
            }

            // graph
            const grafEl=document.getElementById('gldgraf');
            if(grafEl){
                loadChartJS(()=>{
                    grafEl.innerHTML='<canvas id="goldChart" width="700" height="400"></canvas>';
                    const ctx=document.getElementById('goldChart').getContext('2d');
                    new Chart(ctx,{
                        type:'line',
                        data:{
                            labels:rows.map(r=>r.c[0]?.f||''),
                            datasets:[
                                {label:'22K Gold',data:rows.map(r=>r.c[1]?.v||0),borderColor:'#d97706',backgroundColor:'rgba(217,119,6,0.2)',tension:0.3},
                                {label:'24K Gold',data:rows.map(r=>r.c[3]?.v||0),borderColor:'#a855f7',backgroundColor:'rgba(168,85,247,0.2)',tension:0.3}
                            ]
                        },
                        options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:true}}}
                    });
                });
            }
        }
    }

    // ====================== GLOBAL REFS ======================
    window.g22kt=document.querySelector('#g22kt');
    window.g24kt=document.querySelector('#g24kt');
    window.udat=document.querySelector('#udat');
    window.silvr_pricet=document.querySelector('#silvr_pricet');

})();
