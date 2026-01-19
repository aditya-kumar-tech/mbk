(function () {
    console.log("🚀 Universal Loader v8.0 - Gold & Silver Auto Update with Retry & Graphs");

    // ====================== HELPER ======================
    function parseGViz(txt) {
        try {
            txt = txt.replace(/^\s*\/\*O_o\*\/\s*/, '')
                     .replace(/^google\.visualization\.Query\.setResponse\s*\(/, '')
                     .replace(/\);?\s*$/, '');
            const rows = JSON.parse(txt).table.rows || [];
            return rows;
        } catch (e) {
            console.error("GViz parse failed", e);
            return [];
        }
    }

    function findCfg(map, n) {
        for (const k in map) {
            const r = map[k].range;
            if (n >= r[0] && n <= r[1]) {
                return { id: map[k].id, off: n - r[0] };
            }
        }
        return null;
    }

    // ====================== BLOGGER-SAFE QUEUE ======================
    window._mbkQueue = window._mbkQueue || [];

    function enqueueMBKCall(fnName, ...args) {
        if (typeof window[fnName] === 'function') {
            window[fnName](...args);
        } else {
            window._mbkQueue.push({ fnName, args });
        }
    }

    function processMBKQueue() {
        if (!window._mbkQueue.length) return;
        for (const item of window._mbkQueue) {
            if (typeof window[item.fnName] === 'function') {
                window[item.fnName](...item.args);
            }
        }
        window._mbkQueue = window._mbkQueue.filter(item => typeof window[item.fnName] !== 'function');
    }

    // ========================= SILVER =========================
    let silverQueue = [], silverConfig = null, SILVER_HIST = [];
    window.Silverdata = function(q, mtype){
        let num = String(q).replace(/[^0-9]/g,'');
        num = parseInt(num);
        silverQueue.push(num);
        if(silverConfig) runSilver();
        processMBKQueue();
    };

    function runSilver() {
        if (!silverQueue.length) return;
        const num = silverQueue.pop();
        const cfg = findCfg(silverConfig, num);
        if (!cfg) return;

        const url = `https://docs.google.com/spreadsheets/d/${cfg.id}/gviz/tq?tqx=out:json&sheet=silvweb&tq=select * limit 15 offset ${cfg.off}`;
        fetch(url)
            .then(r => r.text())
            .then(t => {
                const rows = parseGViz(t);
                if (!rows.length) {
                    setTimeout(runSilver, 1500); // retry
                    return;
                }
                SILVER_HIST.splice(0, 0, ...rows.slice(0, 15));
                if (SILVER_HIST.length > 15) SILVER_HIST.length = 15;

                renderSilver(rows);
            })
            .catch(err => {
                console.error("Silver fetch failed, retrying...", err);
                setTimeout(runSilver, 1500);
            });
    }

    function renderSilver(rows) {
        if (!rows.length) return;

        // Parse number properly
        const priceKg = Number(rows[0].c[2]?.v || 0);
        if (window.silvr_pricet) silvr_pricet.textContent = `₹${priceKg.toLocaleString('hi-IN')}`;
        if (window.udat) udat.textContent = new Date().toLocaleDateString('hi-IN');

        // gram table
        const gramTbl = document.getElementById('silvr_gramtbl');
        if (gramTbl) {
            let html = '<table style="width:100%;border-collapse:collapse;">';
            [1,10,50,100,500,1000].forEach(g => {
                const price = Math.round((g/1000)*priceKg);
                html += `<tr style="border-bottom:1px solid #eee;"><td style="padding:6px;">${g}g</td><td style="text-align:right;padding:6px;">₹${price.toLocaleString('hi-IN')}</td></tr>`;
            });
            html += '</table>';
            gramTbl.innerHTML = html;
        }

        // history table
        const histTbl = document.getElementById('data_table1');
        if (histTbl) {
            let html = '<table style="width:100%;border-collapse:collapse;"><tr style="background:#e6f3ff;"><th style="padding:8px;">तारीख</th><th style="padding:8px;">1kg भाव</th></tr>';
            rows.forEach(row => {
                const date = row.c[0]?.f || '';
                const val = Number(row.c[2]?.v || 0);
                html += `<tr style="border-bottom:1px solid #eee;"><td style="padding:6px;">${date}</td><td style="text-align:right;padding:6px;">₹${val.toLocaleString('hi-IN')}</td></tr>`;
            });
            html += '</table>';
            histTbl.innerHTML = html;
        }

        // disclaimer
        const discSilver = document.getElementById('disclamerSilver');
        if (discSilver) discSilver.innerHTML = `<div style="background:#fff3cd;border-left:4px solid #c0c0c0;padding:10px;margin:10px 0;border-radius:5px;font-size:13px;line-height:1.4;">
        ⚠️ Disclaimer: The silver rates are sourced from local jewellers and other sources. mandibhavkhabar.com has made every effort to ensure accuracy; however, we do not guarantee such accuracy. Rates are for informational purposes only. mandibhavkhabar.com does not accept liability for losses based on silver information.
        </div>`;

        // graph
        const grafEl = document.getElementById('silvr_graf');
        if (grafEl) {
            grafEl.innerHTML = '<canvas id="silverChart" width="700" height="400"></canvas>';
            const ctx = document.getElementById('silverChart').getContext('2d');
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: rows.map(r=>r.c[0]?.f||''),
                    datasets:[{
                        label:'Silver 1kg',
                        data: rows.map(r=>Number(r.c[2]?.v||0)),
                        borderColor:'#0d6efd',
                        backgroundColor:'rgba(13,110,253,0.2)',
                        tension:0.3
                    }]
                },
                options:{responsive:true, maintainAspectRatio:false, plugins:{legend:{display:true}}}
            });
        }
    }

    // ========================= GOLD =========================
    let goldQueue = [], goldConfig = null;
    window.golddata = function(q, mtype){
        let num = String(q).replace(/[^0-9]/g,'');
        num = parseInt(num);
        goldQueue.push(num);
        if(goldConfig) runGold();
        processMBKQueue();
    };

    function runGold() {
        if (!goldQueue.length) return;
        const num = goldQueue.pop();
        const cfg = findCfg(goldConfig, num);
        if (!cfg) return;

        const url = `https://docs.google.com/spreadsheets/d/${cfg.id}/gviz/tq?tqx=out:json&sheet=goldweb&tq=select * limit 20`;
        fetch(url)
            .then(r=>r.text())
            .then(t=>{
                const rows = parseGViz(t);
                if (!rows.length){ setTimeout(runGold,1500); return;}
                renderGold(rows);
            })
            .catch(err=>{ console.error("Gold fetch failed, retrying...",err); setTimeout(runGold,1500); });
    }

    function renderGold(rows){
        if (!rows.length) return;
        const p22 = rows[0].c[1]?.v||0;
        const p24 = rows[0].c[3]?.v||0;
        if (window.g22kt) g22kt.textContent = `₹${p22.toLocaleString('hi-IN')}`;
        if (window.g24kt) g24kt.textContent = `₹${p24.toLocaleString('hi-IN')}`;
        if (window.udat) udat.textContent = new Date().toLocaleDateString('hi-IN');

        function updateGramTable(id,val){ 
            const el=document.getElementById(id); 
            if(el){ 
                let html='<table style="width:100%;border-collapse:collapse;">';
                [1,5,10,50,100].forEach(g=>{ 
                    html+=`<tr style="border-bottom:1px solid #eee;"><td style="padding:6px;">${g}g</td><td style="text-align:right;padding:6px;">₹${Math.round(val*g)} </td></tr>`; 
                }); html+='</table>'; el.innerHTML=html; 
            } 
        }
        updateGramTable('gramtbl22',p22);
        updateGramTable('gramtbl24',p24);

        const discGold=document.getElementById('disclamergold');
        if(discGold) discGold.innerHTML=`<div style="background:#fff3cd;border-left:4px solid #f59e0b;padding:10px;margin:10px 0;border-radius:5px;font-size:13px;line-height:1.4;">
        ⚠️ Disclaimer: The gold rates are sourced from local jewellers and other sources. mandibhavkhabar.com has made every effort to ensure accuracy; however, we do not guarantee such accuracy. Rates are for informational purposes only. mandibhavkhabar.com does not accept liability for losses based on gold information.
        </div>`;

        const hist22=document.getElementById('data_table1');
        const hist24=document.getElementById('data_table2');
        if(hist22){ 
            let html='<table style="width:100%;border-collapse:collapse;"><tr style="background:#fef3c7;"><th style="padding:8px;">Date</th><th style="padding:8px;">22K Price</th></tr>';
            rows.forEach(r=>{ html+=`<tr style="border-bottom:1px solid #eee;"><td style="padding:6px;">${r.c[0]?.f||''}</td><td style="text-align:right;padding:6px;">₹${r.c[1]?.v||0}</td></tr>`});
            html+='</table>'; hist22.innerHTML=html;
        }
        if(hist24){ 
            let html='<table style="width:100%;border-collapse:collapse;"><tr style="background:#f3e8ff;"><th style="padding:8px;">Date</th><th style="padding:8px;">24K Price</th></tr>';
            rows.forEach(r=>{ html+=`<tr style="border-bottom:1px solid #eee;"><td style="padding:6px;">${r.c[0]?.f||''}</td><td style="text-align:right;padding:6px;">₹${r.c[3]?.v||0}</td></tr>`});
            html+='</table>'; hist24.innerHTML=html;
        }

        const grafEl=document.getElementById('gldgraf');
        if(grafEl){
            grafEl.innerHTML='<canvas id="goldChart" width="700" height="400"></canvas>';
            const ctx=document.getElementById('goldChart').getContext('2d');
            new Chart(ctx,{type:'line',data:{labels:rows.map(r=>r.c[0]?.f||''),datasets:[
                {label:'22K Gold',data:rows.map(r=>r.c[1]?.v||0),borderColor:'#d97706',backgroundColor:'rgba(217,119,6,0.2)',tension:0.3},
                {label:'24K Gold',data:rows.map(r=>r.c[3]?.v||0),borderColor:'#a855f7',backgroundColor:'rgba(168,85,247,0.2)',tension:0.3}
            ]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:true}}}});
        }
    }

    // ====================== FETCH CONFIGS ======================
    fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/silver-groups.json').then(r=>r.json()).then(j=>{silverConfig=j; runSilver(); console.log('✅ Silver config loaded');});
    fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/gold-groups.json').then(r=>r.json()).then(j=>{goldConfig=j; runGold(); console.log('✅ Gold config loaded');});

    // ====================== GLOBAL REFS ======================
    window.g22kt=document.querySelector('#g22kt');
    window.g24kt=document.querySelector('#g24kt');
    window.udat=document.querySelector('#udat');
    window.silvr_pricet=document.querySelector('#silvr_pricet');

})();
