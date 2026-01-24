(function () {
    console.log("🚀 Universal Loader v7.3 - PROFESSIONAL PLOTLY-STYLE LINE GRAPHS");

    // ====================== HELPER PARSERS ======================
    function parseGViz(txt) {
        try {
            txt = txt
                .replace(/^\s*\/\*O_o\*\/\s*/, '')
                .replace(/^google\.visualization\.Query\.setResponse\s*\(/, '')
                .replace(/\);?\s*$/, '');
            const rows = JSON.parse(txt).table.rows || [];
            console.log("✅ GViz Parsed:", rows.length, "rows");
            return rows;
        } catch (e) {
            console.error("❌ GViz parse failed", e);
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
            window._mbkQueue.push({fnName, args});
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
    window.Silverdata = function (q, mtype) {
        silverQueue.push(parseInt(String(q).replace(/\D/g, '')));
        if (silverConfig) runSilver();
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
                if (!rows.length) return;

                SILVER_HIST.splice(0, 0, ...rows.slice(0, 15));
                if (SILVER_HIST.length > 15) SILVER_HIST.length = 15;

                const priceKg = rows[0].c[2]?.v || 0;
                renderSilver(priceKg, SILVER_HIST);
            })
            .catch(err => {
                console.error("Silver fetch failed, retrying...", err);
                setTimeout(runSilver, 1200);
            });
    }

    function renderSilver(priceKg, rows) {
        const priceEl = document.querySelector('#silvr_pricet');
        if (priceEl) priceEl.textContent = `₹${priceKg.toLocaleString('hi-IN')}`;

        const gramTbl = document.querySelector('#silvr_gramtbl');
        if (gramTbl) {
            const price10g = priceKg / 100;
            let html = '<table style="width:100%;border-collapse:collapse;">';
            [1,10,50,100,500,1000].forEach(g => {
                const price = Math.round((g/10) * price10g);
                html += `<tr style="border-bottom:1px solid #eee;"><td style="padding:8px;">${g}g</td><td style="text-align:right;padding:8px;color:#c0c0c0;">₹${price.toLocaleString()}</td></tr>`;
            });
            html += '</table>';
            gramTbl.innerHTML = html;
        }

        const histTbl = document.querySelector('#data_table1');
        if (histTbl && rows.length) {
            let html = '<table style="width:100%;border-collapse:collapse;">';
            html += '<tr style="background:#e6f3ff;"><th style="padding:12px;">तारीख</th><th style="padding:12px;">1kg भाव</th></tr>';
            rows.slice(0,15).forEach(row => {
                const date = row.c[0]?.f || '';
                const price = parseInt(row.c[2]?.v || 0);
                html += `<tr style="border-bottom:1px solid #eee;"><td style="padding:10px;">${date}</td><td style="padding:10px;text-align:right;">₹${price.toLocaleString()}</td></tr>`;
            });
            html += '</table>';
            histTbl.innerHTML = html;
        }

        const silverDisc = document.querySelector('#disclamerSilver');
        if (silverDisc) {
            silverDisc.innerHTML = `
                <div style="background:#fff3cd;border-left:4px solid #c0c0c0;padding:15px;margin:20px 0;border-radius:8px;font-size:13px;line-height:1.5;">
                    <strong>⚠️ सूचना:</strong> चाँदी के भाव स्थानीय ज्वेलर्स और अन्य स्रोतों से लिए गए हैं। mandibhavkhabar.com ने सूचना की सटीकता सुनिश्चित करने का हर प्रयास किया है; हालांकि हम इसकी गारंटी नहीं देते।
                </div>`;
        }

        const grafEl = document.querySelector('#silvr_graf');
        if (grafEl && rows.length > 5) {
            grafEl.innerHTML = '<canvas id="silverChart" width="700" height="400" style="width:100%;height:400px;border:2px solid #c0c0c0;border-radius:12px;background:linear-gradient(135deg,#f8f9fa 0%,#e9ecef 100%);"></canvas>';
            const canvas = document.getElementById('silverChart');
            drawProfessionalSilverGraph(canvas, rows);
        }
    }

    // ========================= GOLD =========================
    let goldQueue = [], goldConfig = null;
    window.golddata = function (q, mtype) {
        goldQueue.push(parseInt(String(q).replace(/\D/g, '')));
        if (goldConfig) runGold();
        processMBKQueue();
    };

    function runGold() {
        if (!goldQueue.length) return;
        const num = goldQueue.pop();
        const cfg = findCfg(goldConfig, num);
        if (!cfg) return;

        const offsetVal = 0;
        const url = `https://docs.google.com/spreadsheets/d/${cfg.id}/gviz/tq?tqx=out:json&sheet=goldweb&tq=select * limit 20${offsetVal ? ` offset ${offsetVal}` : ''}`;

        fetch(url)
            .then(r => r.text())
            .then(t => {
                const rows = parseGViz(t);
                if (!rows.length) {
                    setTimeout(runGold, 1200);
                    return;
                }

                const p22 = parseInt(rows[0].c[1]?.v || 0);
                const p24 = parseInt(rows[0].c[3]?.v || 0);
                renderGold(p22, p24, rows);
            })
            .catch(err => {
                console.error("Gold fetch failed, retrying...", err);
                setTimeout(runGold, 1200);
            });
    }

    function renderGold(p22, p24, rows) {
        const g22El = document.querySelector('#g22kt');
        const g24El = document.querySelector('#g24kt');
        const udatEl = document.querySelector('#udat');
        if (g22El) g22El.textContent = `₹${p22.toLocaleString('hi-IN')}`;
        if (g24El) g24El.textContent = `₹${p24.toLocaleString('hi-IN')}`;
        if (udatEl) udatEl.textContent = new Date().toLocaleDateString('hi-IN');

        updateGramTable('#gramtbl22', p22, '#fef3c7', '#d97706', '22K');
        updateGramTable('#gramtbl24', p24, '#f3e8ff', '#a855f7', '24K');

        if (rows.length > 1) {
            updateHistoryTable('#data_table1', rows, '22K', '#fef3c7', 1);
            updateHistoryTable('#data_table2', rows, '24K', '#f3e8ff', 3);
        }

        const goldDisc = document.querySelector('#disclamergold');
        if (goldDisc) {
            goldDisc.innerHTML = `
                <div style="background:#fff3cd;border-left:4px solid #f59e0b;padding:15px;margin:20px 0;border-radius:8px;font-size:13px;line-height:1.5;">
                    <strong>⚠️ सूचना:</strong> सोने के भाव स्थानीय ज्वेलर्स और अन्य स्रोतों से लिए गए हैं। mandibhavkhabar.com ने सूचना की सटीकता सुनिश्चित करने का हर प्रयास किया है; हालांकि हम इसकी गारंटी नहीं देते।
                </div>`;
        }

        const grafEl = document.querySelector('#gldgraf');
        if (grafEl && rows.length > 5) {
            grafEl.innerHTML = '<canvas id="goldChart" width="700" height="400" style="width:100%;height:400px;border:2px solid #f59e0b;border-radius:12px;background:linear-gradient(135deg,#fef3c7 0%,#fde68a 100%);"></canvas>';
            const canvas = document.getElementById('goldChart');
            drawProfessionalGoldGraph(canvas, rows);
        }
    }

    // ====================== FETCH CONFIGS ======================
    fetch('https://api.mandibhavkhabar.com/data/gs/gold-groups.json')
        .then(r => r.json())
        .then(j => { goldConfig = j; runGold(); console.log('✅ Gold config loaded'); });

    fetch('https://api.mandibhavkhabar.com/data/gs/silver-groups.json')
        .then(r => r.json())
        .then(j => { silverConfig = j; runSilver(); console.log('✅ Silver config loaded'); });

    // ====================== GRAPH FUNCTIONS ======================
    // Silver & Gold graph functions same as your previous code
    // drawProfessionalSilverGraph(), drawProfessionalGoldGraph() - unchanged
    // updateGramTable(), updateHistoryTable() - unchanged

    // ====================== GLOBAL REFS + CSS ======================
    window.g22kt = document.querySelector('#g22kt');
    window.g24kt = document.querySelector('#g24kt');
    window.udat = document.querySelector('#udat');
    window.silvr_pricet = document.querySelector('#silvr_pricet');

    const style = document.createElement('style');
    style.textContent = `
        .gldbox {background:linear-gradient(135deg,#fef3c7 0%,#fde68a 100%)!important;padding:25px;border-radius:15px;box-shadow:0 8px 25px rgba(0,0,0,0.1);}
        .silvrbox {background:linear-gradient(135deg,#e6f3ff 0%,#bfdbfe 100%)!important;}
        #g22kt,#g24kt,#silvr_pricet {color:#d97706!important;font-size:28px!important;font-weight:800!important;}
        #sscity{display:none!important;}
        table{font-family:Arial,sans-serif;}
        th{background:#f8f9fa!important;color:#333!important;}
    `;
    document.head.appendChild(style);

})();
