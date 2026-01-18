(function () {
    console.log("🚀 Universal Loader v7.4 - BLOGGER SAFE");

    function parseGViz(txt) {
        try {
            txt = txt
                .replace(/^s*/*O_o*/s*/, '')
                .replace(/^google.visualization.Query.setResponses*(/, '')
                .replace(/);?s*$/, '');
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
    let silverQueue = [], silverConfig = null;
    window.Silverdata = function (q, mtype) {
        silverQueue.push(parseInt(String(q).replace(/D/g, '')));
        if (silverConfig) runSilver();
    };

    let SILVER_ROWS = [];
    function runSilver() {
        if (!silverQueue.length) return;
        const num = silverQueue.pop();
        const cfg = findCfg(silverConfig, num);
        if (!cfg) return;

        const url = `https://docs.google.com/spreadsheets/d/${cfg.id}/gviz/tq?tqx=out:json&sheet=silvweb&tq=select * limit 15 offset ${cfg.off}`;
        fetch(url)
            .then(r => r.text())
            .then(t => {
                SILVER_ROWS = parseGViz(t);
                if (SILVER_ROWS.length) {
                    const priceKg = SILVER_ROWS[0].c[2]?.v || 0;
                    renderSilver(priceKg, SILVER_ROWS);
                }
            })
            .catch(err => console.error("Silver failed:", err));
    }

    function renderSilver(priceKg, rows) {
        console.log("✅ Silver 1kg:", priceKg);
        
        // 1. MAIN PRICE
        document.querySelector('#silvr_pricet')?.replaceChildren(document.createTextNode(`₹${priceKg.toLocaleString('hi-IN')}`));
        
        // 2. GRAM TABLE
        const gramTbl = document.querySelector('#silvr_gramtbl');
        if (gramTbl) {
            const price10g = priceKg / 100;
            let html = '<div style="background:#e6f3ff;padding:20px;border-radius:12px;">';
            [1,10,50,100,500,1000].forEach(g => {
                const price = Math.round((g/10) * price10g);
                html += `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #bee5eb;">
                    <span>${g}g</span>
                    <span style="color:#0dcaf0;font-weight:700;">₹${price.toLocaleString()}</span>
                </div>`;
            });
            html += '</div>';
            gramTbl.innerHTML = html;
        }
        
        // 3. HISTORY TABLE
        const histTbl = document.querySelector('#data_table1');
        if (histTbl && rows.length) {
            let html = '<table style="width:100%;border-collapse:collapse;">';
            html += '<tr style="background:#e6f3ff;"><th style="padding:12px;">तारीख</th><th style="padding:12px;">1kg भाव</th></tr>';
            rows.slice(0,10).forEach(row => {
                const date = row.c[0]?.f || '';
                const price = parseInt(row.c[2]?.v || 0);
                html += `<tr style="border-bottom:1px solid #dee2e6;">
                    <td style="padding:10px;">${date}</td>
                    <td style="padding:10px;text-align:right;color:#0dcaf0;">₹${price.toLocaleString()}</td>
                </tr>`;
            });
            html += '</table>';
            histTbl.innerHTML = html;
        }
        
        // 4. DISCLAIMER
        const silverDisc = document.querySelector('#disclamerSilver');
        if (silverDisc) {
            silverDisc.innerHTML = `
                <div style="background:#fff3cd;border-left:4px solid #c0c0c0;padding:15px;margin:20px 0;border-radius:8px;font-size:13px;line-height:1.5;">
                    <strong>⚠️ सूचना:</strong> चाँदी के भाव स्थानीय ज्वेलर्स से। mandibhavkhabar.com केवल सूचना प्रदान करता है।
                </div>`;
        }
    }

    /* ========================= GOLD =========================== */
    let goldQueue = [], goldConfig = null;
    window.golddata = function (q, mtype) {
        goldQueue.push(parseInt(String(q).replace(/D/g, '')));
        if (goldConfig) runGold();
    };

    let GOLD_ROWS = [];
    function runGold() {
        if (!goldQueue.length) return;
        const num = goldQueue.pop();
        const cfg = findCfg(goldConfig, num);
        if (!cfg) return;

        const url = `https://docs.google.com/spreadsheets/d/${cfg.id}/gviz/tq?tqx=out:json&sheet=goldweb&tq=select * limit 20`;
        fetch(url)
            .then(r => r.text())
            .then(t => {
                GOLD_ROWS = parseGViz(t);
                if (GOLD_ROWS.length) {
                    const p22 = parseInt(GOLD_ROWS[0].c[1]?.v || 0);
                    const p24 = parseInt(GOLD_ROWS[0].c[3]?.v || 0);
                    renderGold(p22, p24, GOLD_ROWS);
                }
            })
            .catch(err => console.error("Gold failed:", err));
    }

    function renderGold(p22, p24, rows) {
        console.log("✅ Gold → 22K:", p22, "24K:", p24);
        
        // 1. MAIN PRICES
        document.querySelector('#g22kt')?.replaceChildren(document.createTextNode(`₹${p22.toLocaleString('hi-IN')}`));
        document.querySelector('#g24kt')?.replaceChildren(document.createTextNode(`₹${p24.toLocaleString('hi-IN')}`));
        document.querySelector('#udat')?.replaceChildren(document.createTextNode(new Date().toLocaleDateString('hi-IN')));
        
        // 2. GRAM TABLES
        updateGramTable('#gramtbl22', p22, '#fef3c7', '#d97706', '22K');
        updateGramTable('#gramtbl24', p24, '#f3e8ff', '#a855f7', '24K');
        
        // 3. HISTORY TABLES
        if (rows.length > 1) {
            updateHistoryTable('#data_table1', rows, '22K', '#fef3c7', 1);
            updateHistoryTable('#data_table2', rows, '24K', '#f3e8ff', 3);
        }
        
        // 4. DISCLAIMER
        const goldDisc = document.querySelector('#disclamergold');
        if (goldDisc) {
            goldDisc.innerHTML = `
                <div style="background:#fff3cd;border-left:4px solid #f59e0b;padding:15px;margin:20px 0;border-radius:8px;font-size:13px;line-height:1.5;">
                    <strong>⚠️ सूचना:</strong> सोने के भाव स्थानीय ज्वेलर्स से। mandibhavkhabar.com केवल सूचना प्रदान करता है।
                </div>`;
        }
    }

    /* ========================= SIMPLE GRAPH (Blogger Safe) ========================= */
    function renderSimpleGraph(containerId, rows, type = 'silver') {
        const el = document.querySelector(containerId);
        if (!el || !rows.length) return;
        
        // Blogger-safe SVG graph
        let html = `
        <svg width="100%" height="350" viewBox="0 0 700 350" style="border:2px solid ${type==='gold'?'#f59e0b':'#c0c0c0'};border-radius:12px;">
            <defs>
                <linearGradient id="bg${type}" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:${type==='gold'?'#fef3c7':'#e6f3ff'};stop-opacity:1"/>
                    <stop offset="100%" style="stop-color:${type==='gold'?'#fde68a':'#bfdbfe'};stop-opacity:1"/>
                </linearGradient>
            </defs>
            <rect width="700" height="350" fill="url(#bg${type})"/>
            
            <!-- Grid -->
            <g stroke="rgba(0,0,0,0.08)" stroke-width="1">
                ${[0,1,2,3,4,5].map(i => `
                    <line x1="80" y1="${60+i*60}" x2="660" y2="${60+i*60}"/>
                    <line x1="${80+i*90}" y1="60" x2="${80+i*90}" y2="310"/>
                `).join('')}
            </g>
            
            <!-- Axes -->
            <path d="M80 60 L80 310 L660 310" stroke="#dee2e6" stroke-width="2.5" fill="none"/>
            
            <!-- Data line (Silver: C=2, Gold22: B=1, Gold24: D=3) -->
            ${rows.slice(0,10).map((row, i) => {
                const col = type==='silver' ? 2 : type==='gold22' ? 1 : 3;
                const price = parseFloat(row.c[col]?.v || 0);
                const x = 100 + i * 56;
                const y = 300 - (price/80000)*250; // Scale
                return `<circle cx="${x}" cy="${y}" r="6" fill="${type==='silver'?'#c0c0c0':type==='gold22'?'#f59e0b':'#a855f7'}" stroke="white" stroke-width="2"/>`;
            }).join('')}
            
            <!-- Line path -->
            <path d="${rows.slice(0,10).map((row, i) => {
                const col = type==='silver' ? 2 : type==='gold22' ? 1 : 3;
                const price = parseFloat(row.c[col]?.v || 0);
                const x = 100 + i * 56;
                const y = 300 - (price/80000)*250;
                return i===0 ? `M ${x} ${y}` : `L ${x} ${y}`;
            }).join(' ')}" 
            stroke="${type==='silver'?'#c0c0c0':type==='gold22'?'#f59e0b':'#a855f7'}" 
            stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
            
            <!-- Title -->
            <text x="350" y="30" text-anchor="middle" font-size="16" font-weight="bold" fill="#495057">${type==='silver'?'चाँदी के भाव':'सोने के भाव'} (${rows[0]?.c[0]?.f || ''})</text>
        </svg>`;
        
        el.innerHTML = html;
    }

    /* ========================= HELPERS ========================= */
    function updateGramTable(id, price, bg, color, type) {
        const el = document.querySelector(id);
        if (!el) return;
        let html = `<div style="background:${bg};padding:20px;border-radius:12px;">`;
        [1,8,10,50,100].forEach(g => {
            html += `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(0,0,0,0.1);">
                <span>${g}g ${type}</span>
                <span style="color:${color};font-weight:700;">₹${Math.round(g*price).toLocaleString('hi-IN')}</span>
            </div>`;
        });
        html += '</div>';
        el.innerHTML = html;
    }

    function updateHistoryTable(id, rows, type, bg, colIdx) {
        const el = document.querySelector(id);
        if (!el || !rows.length) return;
        let html = `<table style="width:100%;border-collapse:collapse;font-size:14px;">`;
        html += `<tr style="background:${bg}"><th style="padding:12px;">तारीख</th><th style="padding:12px;">${type} 1g</th></tr>`;
        rows.slice(0,10).forEach((row,i) => {
            const date = row.c[0]?.f || `Day ${i+1}`;
            const price = parseInt(row.c[colIdx]?.v || 0);
            html += `<tr style="border-bottom:1px solid #eee;">
                <td style="padding:10px;">${date}</td>
                <td style="padding:10px;text-align:right;color:${colIdx===1?'#d97706':'#a855f7'};font-weight:600;">₹${price.toLocaleString('hi-IN')}</td>
            </tr>`;
        });
        html += '</table>';
        el.innerHTML = html;
    }

    // LOAD CONFIGS
    fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/silver-groups.json')
        .then(r => r.json()).then(j => { silverConfig = j; runSilver(); });
    fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/gold-groups.json')
        .then(r => r.json()).then(j => { goldConfig = j; runGold(); });

    // CSS (Blogger Safe)
    const style = document.createElement('style');
    style.textContent = `
        .gldbox,.silvrbox{padding:25px;border-radius:15px;box-shadow:0 8px 25px rgba(0,0,0,0.1);}
        .gldbox{background:linear-gradient(135deg,#fef3c7 0%,#fde68a 100%)!important;}
        .silvrbox{background:linear-gradient(135deg,#e6f3ff 0%,#bfdbfe 100%)!important;}
        #g22kt,#g24kt,#silvr_pricet{font-size:28px!important;font-weight:800!important;color:#d97706!important;}
        #sscity{display:none!important;}
        table{font-family:Arial,sans-serif;}
        svg{border-radius:12px!important;}
    `;
    document.head.appendChild(style);
})();