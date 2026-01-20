<script>
(function () {
    console.log("🚀 Universal Loader v8.3 - Conditional Silver & Gold Loader");

    /* ================= BASIC ================= */
    const RUPEE = "₹";
    const MAX_RETRY = 3;

    function rs(v) {
        return RUPEE + Number(v || 0).toLocaleString("hi-IN");
    }

    /* ================= CHART AUTO LOAD ================= */
    function loadChartJS(cb) {
        if (window.Chart) return cb();
        const s = document.createElement("script");
        s.src = "https://cdn.jsdelivr.net/npm/chart.js";
        s.onload = cb;
        document.head.appendChild(s);
    }

    /* ================= GVIZ PARSER ================= */
    function parseGViz(txt) {
        try {
            txt = txt.replace(/^\s*\/\*O_o\*\/\s*/, "")
                     .replace(/^google\.visualization\.Query\.setResponse\s*\(/, "")
                     .replace(/\);?\s*$/, "");
            const rows = JSON.parse(txt).table.rows || [];
            return rows;
        } catch (e) {
            console.error("GViz parse failed", e);
            return [];
        }
    }

    /* ================= RANGE SAFE FIND ================= */
    function findCfg(map, num) {
        for (const k in map) {
            const r = map[k].range;
            if (Array.isArray(r) && r.includes(num)) {
                return { id: map[k].id, off: r.indexOf(num) };
            }
        }
        return null;
    }

    /* ========================= SILVER ========================= */
    let silverCfg = null;
    let SILVER_HIST = [];

    if (typeof Silverdata === 'function') {
        fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/silver-groups.json')
            .then(r => r.json())
            .then(j => {
                silverCfg = j;
                console.log('✔ Silver config loaded');
                // auto call if page has Silverdata
                if (window.sctqury && window.mtype === 'Silver') {
                    Silverdata(window.sctqury, window.mtype);
                }
            });
    }

    window.SilverdataSafe = function(q, mtype) {
        if (!silverCfg) return setTimeout(() => SilverdataSafe(q, mtype), 500);

        const num = Number(String(q).replace(/\D/g, ""));
        const cfg = findCfg(silverCfg, num);
        if (!cfg) return console.warn("❌ Silver cfg not found", q);

        const url = `https://docs.google.com/spreadsheets/d/${cfg.id}/gviz/tq?tqx=out:json&sheet=silvweb&tq=select * limit 15`;

        fetch(url)
            .then(r => r.text())
            .then(t => {
                let rows = parseGViz(t);
                // sort date descending
                rows.sort((a, b) => new Date(b.c[0]?.f) - new Date(a.c[0]?.f));
                SILVER_HIST = rows.slice(0, 15);
                renderSilver(SILVER_HIST);
            })
            .catch(err => {
                console.error("Silver fetch failed, retrying...", err);
                setTimeout(() => SilverdataSafe(q, mtype), 1500);
            });
    };

    function renderSilver(rows) {
        if (!rows.length) return;
        const priceKg = rows[0]?.c[2]?.v || 0;
        if (window.silvr_pricet) silvr_pricet.innerHTML = rs(priceKg);
        if (window.udat) udat.textContent = new Date().toLocaleDateString('hi-IN');

        // gram table
        const gramTbl = document.getElementById('silvr_gramtbl');
        if (gramTbl) {
            let html = '<table style="width:100%;border-collapse:collapse;">';
            [1,10,50,100,500,1000].forEach(g => {
                const val = Math.round((g/1000)*priceKg);
                html += `<tr><td>${g}g</td><td style="text-align:right">`+rs(val)+`</td></tr>`;
            });
            html += '</table>';
            gramTbl.innerHTML = html;
        }

        // history table
        const histTbl = document.getElementById('data_table1');
        if (histTbl) {
            let html = '<table style="width:100%;border-collapse:collapse;"><tr><th>Date</th><th>1kg Price</th></tr>';
            rows.forEach(r => {
                const date = r.c[0]?.f || '';
                const val = r.c[2]?.v || 0;
                html += `<tr><td>${date}</td><td style="text-align:right">${rs(val)}</td></tr>`;
            });
            html += '</table>';
            histTbl.innerHTML = html;
        }

        // chart
        const graf = document.getElementById('silvr_graf');
        if (graf) {
            loadChartJS(() => {
                graf.innerHTML = '<canvas id="silverChart"></canvas>';
                new Chart(document.getElementById('silverChart').getContext('2d'), {
                    type: 'line',
                    data: {
                        labels: rows.map(r => r.c[0]?.f || ''),
                        datasets: [{
                            label: 'Silver 1kg',
                            data: rows.map(r => r.c[2]?.v || 0),
                            borderColor: '#0d6efd',
                            backgroundColor: 'rgba(13,110,253,0.2)',
                            tension: 0.3
                        }]
                    },
                    options: { responsive:true, maintainAspectRatio:false }
                });
            });
        }
    }

    /* ========================= GOLD ========================= */
    let goldCfg = null;

    if (typeof golddata === 'function') {
        fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/gold-groups.json')
            .then(r => r.json())
            .then(j => {
                goldCfg = j;
                console.log('✔ Gold config loaded');
                if (window.gctqury && window.mtype === 'Gold') {
                    golddata(window.gctqury, window.mtype);
                }
            });
    }

    window.golddataSafe = function(q, mtype) {
        if (!goldCfg) return setTimeout(() => golddataSafe(q, mtype), 500);

        const num = Number(String(q).replace(/\D/g, ""));
        const cfg = findCfg(goldCfg, num);
        if (!cfg) return console.warn("❌ Gold cfg not found", q);

        const url = `https://docs.google.com/spreadsheets/d/${cfg.id}/gviz/tq?tqx=out:json&sheet=goldweb&tq=select * limit 15`;

        fetch(url)
            .then(r => r.text())
            .then(t => {
                const rows = parseGViz(t).slice(0,15);
                renderGold(rows);
            })
            .catch(err => {
                console.error("Gold fetch failed, retrying...", err);
                setTimeout(() => golddataSafe(q, mtype), 1500);
            });
    };

    function renderGold(rows){
        if (!rows.length) return;
        const p22 = rows[0]?.c[1]?.v || 0;
        const p24 = rows[0]?.c[3]?.v || 0;
        if (window.g22kt) g22kt.textContent = rs(p22);
        if (window.g24kt) g24kt.textContent = rs(p24);
        if (window.udat) udat.textContent = new Date().toLocaleDateString('hi-IN');

        const hist22 = document.getElementById('data_table1');
        const hist24 = document.getElementById('data_table2');
        if(hist22) {
            let html='<table><tr><th>Date</th><th>22K Price</th></tr>';
            rows.forEach(r => html+=`<tr><td>${r.c[0]?.f||''}</td><td>${rs(r.c[1]?.v||0)}</td></tr>`);
            html+='</table>'; hist22.innerHTML=html;
        }
        if(hist24) {
            let html='<table><tr><th>Date</th><th>24K Price</th></tr>';
            rows.forEach(r => html+=`<tr><td>${r.c[0]?.f||''}</td><td>${rs(r.c[3]?.v||0)}</td></tr>`);
            html+='</table>'; hist24.innerHTML=html;
        }

        // graph
        const grafEl = document.getElementById('gldgraf');
        if (grafEl) {
            loadChartJS(() => {
                grafEl.innerHTML = '<canvas id="goldChart"></canvas>';
                new Chart(document.getElementById('goldChart').getContext('2d'), {
                    type:'line',
                    data:{
                        labels: rows.map(r=>r.c[0]?.f||''),
                        datasets:[
                            {label:'22K Gold', data: rows.map(r=>r.c[1]?.v||0), borderColor:'#d97706', backgroundColor:'rgba(217,119,6,0.2)', tension:0.3},
                            {label:'24K Gold', data: rows.map(r=>r.c[3]?.v||0), borderColor:'#a855f7', backgroundColor:'rgba(168,85,247,0.2)', tension:0.3}
                        ]
                    },
                    options:{responsive:true, maintainAspectRatio:false}
                });
            });
        }
    }

})();
</script>
