(function () {
    console.log("🚀 Universal Loader v7.2 - HISTORY + GRAPH + DISCLAIMER PERFECT");

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

    /* ========================= SILVER ========================= */
    let silverQueue = [], silverConfig = null, SILVER_HIST = [];
    window.Silverdata = function (q, mtype) {
        silverQueue.push(parseInt(String(q).replace(/\D/g, '')));
        if (silverConfig) runSilver();
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
        console.log("✅ Silver 1kg:", priceKg, "History rows:", rows.length);
        
        // Main price
        const priceEl = document.querySelector('#silvr_pricet');
        if (priceEl) priceEl.textContent = `₹${priceKg.toLocaleString('hi-IN')}`;
        
        // Gram table
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
        
        // HISTORY TABLE
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
            console.log('✅ Silver HISTORY table created');
        }
        
        // SILVER DISCLAIMER
        const silverDisc = document.querySelector('#disclamerSilver');
        if (silverDisc) {
            silverDisc.innerHTML = `
                <div style="background:#fff3cd;border-left:4px solid #c0c0c0;padding:15px;margin:20px 0;border-radius:8px;font-size:13px;line-height:1.5;">
                    <strong>⚠️ सूचना:</strong> चाँदी के भाव स्थानीय ज्वेलर्स और अन्य स्रोतों से लिए गए हैं। mandibhavkhabar.com ने सूचना की सटीकता सुनिश्चित करने का हर प्रयास किया है; हालांकि हम इसकी गारंटी नहीं देते। ये भाव केवल सूचना के उद्देश्य से हैं। यह सोने/चाँदी खरीदने-बेचने का निमंत्रण नहीं है। mandibhavkhabar.com को सोने/चाँदी की सूचना के आधार पर होने वाले नुकसान/हानि की कोई जिम्मेदारी नहीं है।
                </div>`;
        }
        
        // GRAPH
        const grafEl = document.querySelector('#silvr_graf');
        if (grafEl && rows.length > 5) {
            grafEl.innerHTML = '<canvas width="700" height="350" style="width:100%;height:350px;border:2px solid #c0c0c0;border-radius:12px;"></canvas>';
            const canvas = grafEl.querySelector('canvas');
            drawSilverGraph(canvas, rows);
        }
    }

    fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/silver-groups.json')
        .then(r => r.json())
        .then(j => {
            silverConfig = j;
            console.log('✅ Silver config loaded');
            runSilver();
        });

    /* ========================= GOLD =========================== */
    let goldQueue = [], goldConfig = null, GOLD_HIST_22 = [], GOLD_HIST_24 = [];
    window.golddata = function (q, mtype) {
        goldQueue.push(parseInt(String(q).replace(/\D/g, '')));
        if (goldConfig) runGold();
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
                    console.warn("Gold rows empty, retrying...");
                    setTimeout(runGold, 1200);
                    return;
                }

                GOLD_HIST_22.splice(0, 0, ...rows.slice(0, 15));
                GOLD_HIST_24.splice(0, 0, ...rows.slice(0, 15));
                if (GOLD_HIST_22.length > 15) GOLD_HIST_22.length = 15;
                if (GOLD_HIST_24.length > 15) GOLD_HIST_24.length = 15;

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
        console.log("✅ Gold → 22K:", p22, "24K:", p24, "History rows:", rows.length);
        
        // Main prices
        const g22El = document.querySelector('#g22kt');
        const g24El = document.querySelector('#g24kt');
        const udatEl = document.querySelector('#udat');
        if (g22El) g22El.textContent = `₹${p22.toLocaleString('hi-IN')}`;
        if (g24El) g24El.textContent = `₹${p24.toLocaleString('hi-IN')}`;
        if (udatEl) udatEl.textContent = new Date().toLocaleDateString('hi-IN');
        
        // Gram tables
        updateGramTable('#gramtbl22', p22, '#fef3c7', '#d97706', '22K');
        updateGramTable('#gramtbl24', p24, '#f3e8ff', '#a855f7', '24K');
        
        // HISTORY TABLES
        if (rows.length > 1) {
            console.log('📋 Creating Gold HISTORY tables...');
            updateHistoryTable('#data_table1', rows, '22K', '#fef3c7', 1);
            updateHistoryTable('#data_table2', rows, '24K', '#f3e8ff', 3);
        }
        
        // GOLD DISCLAIMER
        const goldDisc = document.querySelector('#disclamergold');
        if (goldDisc) {
            goldDisc.innerHTML = `
                <div style="background:#fff3cd;border-left:4px solid #f59e0b;padding:15px;margin:20px 0;border-radius:8px;font-size:13px;line-height:1.5;">
                    <strong>⚠️ सूचना:</strong> सोने के भाव स्थानीय ज्वेलर्स और अन्य स्रोतों से लिए गए हैं। mandibhavkhabar.com ने सूचना की सटीकता सुनिश्चित करने का हर प्रयास किया है; हालांकि हम इसकी गारंटी नहीं देते। ये भाव केवल सूचना के उद्देश्य से हैं। यह सोने/चाँदी खरीदने-बेचने का निमंत्रण नहीं है। mandibhavkhabar.com को सोने/चाँदी की सूचना के आधार पर होने वाले नुकसान/हानि की कोई जिम्मेदारी नहीं है।
                </div>`;
        }
        
        // GRAPH
        const grafEl = document.querySelector('#gldgraf');
        if (grafEl && rows.length > 5) {
            console.log('📈 Creating Gold GRAPH...');
            grafEl.innerHTML = '<canvas width="700" height="350" style="width:100%;height:350px;border:2px solid #f59e0b;border-radius:12px;"></canvas>';
            const canvas = grafEl.querySelector('canvas');
            drawGoldGraph(canvas, rows);
        }
    }

    fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/gold-groups.json')
        .then(r => r.json())
        .then(j => {
            goldConfig = j;
            console.log('✅ Gold config loaded');
            runGold();
        });

    /* ========================= HELPERS ========================= */
    function updateGramTable(id, price, bg, color, type) {
        const el = document.querySelector(id);
        if (!el) return;
        let html = `<div style="background:${bg};padding:20px;border-radius:12px;">`;
        [1, 8, 10, 50, 100].forEach(g => {
            html += `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(0,0,0,0.1);">
                <span>${g}g ${type}</span>
                <span style="color:${color};font-weight:700;">₹${Math.round(g * price).toLocaleString('hi-IN')}</span>
            </div>`;
        });
        html += '</div>';
        el.innerHTML = html;
    }

    function updateHistoryTable(id, rows, type, bg, colIdx) {
        const el = document.querySelector(id);
        if (!el || !rows.length) return;
        
        let html = `<table style="width:100%;border-collapse:collapse;font-size:14px;">`;
        html += `<tr style="background:${bg}"><th style="padding:12px;border:1px solid #ddd;">तारीख</th><th style="padding:12px;border:1px solid #ddd;">${type} 1g</th></tr>`;
        rows.slice(0, 15).forEach((row, i) => {
            const date = row.c[0]?.f || `Day ${i + 1}`;
            const price = parseInt(row.c[colIdx]?.v || 0);
            html += `<tr style="border-bottom:1px solid #eee;">
                <td style="padding:10px;border-right:1px solid #eee;">${date}</td>
                <td style="padding:10px;text-align:right;color:${colIdx === 1 ? '#d97706' : '#a855f7'};font-weight:600;">₹${price.toLocaleString('hi-IN')}</td>
            </tr>`;
        });
        html += '</table>';
        el.innerHTML = html;
        console.log('✅ HISTORY created:', id);
    }

    function drawSilverGraph(canvas, rows) {
        const ctx = canvas.getContext('2d');
        const prices = rows.slice(0, 12).map(r => parseInt(r.c[2]?.v || 0));
        const maxP = Math.max(...prices);
        const w = canvas.width, h = canvas.height, pad = 60;

        ctx.clearRect(0, 0, w, h);
        ctx.strokeStyle = '#c0c0c0'; ctx.lineWidth = 3;
        ctx.lineJoin = 'round'; ctx.shadowBlur = 10; ctx.shadowColor = 'rgba(192,192,192,0.5)';
        
        ctx.beginPath();
        prices.forEach((p, i) => {
            const x = pad + (i / 11) * (w - pad * 2);
            const y = h - pad - (p / maxP) * (h - pad * 1.5);
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            ctx.fillStyle = '#c0c0c0'; ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
        });
        ctx.stroke();
        console.log('✅ Silver GRAPH OK');
    }

    function drawGoldGraph(canvas, rows) {
        const ctx = canvas.getContext('2d');
        const p22 = rows.slice(0, 12).map(r => parseInt(r.c[1]?.v || 0));
        const p24 = rows.slice(0, 12).map(r => parseInt(r.c[3]?.v || 0));
        const maxP = Math.max(...p22, ...p24);
        const w = canvas.width, h = canvas.height, pad = 60;

        ctx.clearRect(0, 0, w, h);
        
        // 22K orange
        ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 3; ctx.shadowBlur = 10; ctx.shadowColor = 'rgba(245,158,11,0.5)';
        ctx.beginPath();
        p22.forEach((p, i) => {
            const x = pad + (i / 11) * (w - pad * 2);
            const y = h - pad - (p / maxP) * (h - pad * 1.5);
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            ctx.fillStyle = '#fbbf24'; ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill();
        });
        ctx.stroke();

        // 24K purple
        ctx.strokeStyle = '#a855f7'; ctx.lineWidth = 3; ctx.shadowBlur = 10; ctx.shadowColor = 'rgba(168,85,247,0.5)';
        ctx.beginPath();
        p24.forEach((p, i) => {
            const x = pad + (i / 11) * (w - pad * 2);
            const y = h - pad - (p / maxP) * (h - pad * 1.5);
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            ctx.fillStyle = '#c084fc'; ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill();
        });
        ctx.stroke();

        // Legend
        ctx.shadowBlur = 0; ctx.fillStyle = '#1f2937'; ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'start'; ctx.textBaseline = 'middle';
        ctx.fillText('🟠 22 कैरेट', pad + 10, pad - 20);
        ctx.fillText('🟣 24 कैरेट', pad + 120, pad - 20);
        
        console.log('✅ Gold DUAL GRAPH OK');
    }

    // Global refs
    window.g22kt = document.querySelector('#g22kt');
    window.g24kt = document.querySelector('#g24kt');
    window.udat = document.querySelector('#udat');
    window.silvr_pricet = document.querySelector('#silvr_pricet');

    // CSS
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
