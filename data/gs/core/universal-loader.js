(function () {
    console.log("🚀 Universal Loader v7.5 - BLOGGER + RETRY FIXED");

    let silverQueue = [], goldQueue = [], silverConfig = null, goldConfig = null;
    let SILVER_ROWS = [], GOLD_ROWS = [], retryCount = 0, maxRetries = 5;

    function parseGViz(txt) {
        try {
            txt = txt.replace(/^\s*\/\*O_o\*\/\s*/, '').replace(/^google\.visualization\.Query\.setResponse\s*\(/, '').replace(/\);?\s*$/, '');
            const data = JSON.parse(txt);
            const rows = data.table?.rows || [];
            console.log("✅ GViz Parsed:", rows.length, "rows");
            return rows;
        } catch (e) {
            console.error("❌ GViz parse failed:", e);
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

    // 🔄 AUTO-RETRY QUEUE SYSTEM
    function safeRunSilver() {
        if (!silverConfig || !silverQueue.length) return;
        const num = silverQueue.shift();
        const cfg = findCfg(silverConfig, num);
        if (!cfg) return safeRunSilver(); // Retry next

        const url = `https://docs.google.com/spreadsheets/d/${cfg.id}/gviz/tq?tqx=out:json&sheet=silvweb&tq=select * limit 15 offset ${cfg.off}`;
        fetch(url).then(r => r.text()).then(t => {
            SILVER_ROWS = parseGViz(t);
            if (SILVER_ROWS.length) {
                const priceKg = SILVER_ROWS[0].c[2]?.v || 0;
                renderSilver(priceKg, SILVER_ROWS);
                retryCount = 0; // Reset retry
            } else {
                retryFetchSilver();
            }
        }).catch(err => {
            console.error("Silver fetch failed:", err);
            retryFetchSilver();
        });
    }

    function safeRunGold() {
        if (!goldConfig || !goldQueue.length) return;
        const num = goldQueue.shift();
        const cfg = findCfg(goldConfig, num);
        if (!cfg) return safeRunGold();

        const url = `https://docs.google.com/spreadsheets/d/${cfg.id}/gviz/tq?tqx=out:json&sheet=goldweb&tq=select * limit 20`;
        fetch(url).then(r => r.text()).then(t => {
            GOLD_ROWS = parseGViz(t);
            if (GOLD_ROWS.length) {
                const p22 = parseInt(GOLD_ROWS[0].c[1]?.v || 0);
                const p24 = parseInt(GOLD_ROWS[0].c[3]?.v || 0);
                renderGold(p22, p24, GOLD_ROWS);
                retryCount = 0;
            } else {
                retryFetchGold();
            }
        }).catch(err => {
            console.error("Gold fetch failed:", err);
            retryFetchGold();
        });
    }

    // 🔁 RETRY LOGIC (3 sec delay)
    function retryFetchSilver() {
        if (retryCount < maxRetries) {
            retryCount++;
            console.log(`🔄 Silver retry ${retryCount}/${maxRetries}`);
            setTimeout(safeRunSilver, 3000);
        } else {
            console.error("❌ Silver max retries reached");
        }
    }

    function retryFetchGold() {
        if (retryCount < maxRetries) {
            retryCount++;
            console.log(`🔄 Gold retry ${retryCount}/${maxRetries}`);
            setTimeout(safeRunGold, 3000);
        } else {
            console.error("❌ Gold max retries reached");
        }
    }

    // PUBLIC FUNCTIONS (Safe with queue)
    window.Silverdata = function(q, mtype) {
        const num = parseInt(String(q).replace(/\D/g, ''));
        if (num) {
            silverQueue.push(num);
            console.log("📥 Silver queued:", num);
            safeRunSilver();
        }
    };

    window.golddata = function(q, mtype) {
        const num = parseInt(String(q).replace(/\D/g, ''));
        if (num) {
            goldQueue.push(num);
            console.log("📥 Gold queued:", num);
            safeRunGold();
        }
    };

    // RENDER FUNCTIONS (Your existing code)
    function renderSilver(priceKg, rows) {
        console.log("✅ Silver rendered:", priceKg);
        const priceEl = document.querySelector('#silvr_pricet');
        if (priceEl) priceEl.textContent = `₹${priceKg.toLocaleString('hi-IN')}`;

        // Gram table
        const gramTbl = document.querySelector('#silvr_gramtbl');
        if (gramTbl) {
            const price10g = priceKg / 100;
            let html = '<div style="background:#e6f3ff;padding:15px;border-radius:10px;">';
            [1,10,50,100,500,1000].forEach(g => {
                const price = Math.round((g/10) * price10g);
                html += `<div style="display:flex;justify:space-between;padding:6px 0;border-bottom:1px solid #bee5eb;"><span>${g}g</span><span style="color:#0dcaf0;font-weight:600;">₹${price.toLocaleString()}</span></div>`;
            });
            html += '</div>';
            gramTbl.innerHTML = html;
        }

        // History table
        const histTbl = document.querySelector('#data_table1');
        if (histTbl && rows.length) {
            let html = '<table style="width:100%;border-collapse:collapse;">';
            html += '<tr style="background:#e6f3ff;"><th style="padding:10px;">तारीख</th><th style="padding:10px;">1kg भाव</th></tr>';
            rows.slice(0,12).forEach(row => {
                const date = row.c[0]?.f || '';
                const price = parseInt(row.c[2]?.v || 0);
                html += `<tr style="border-bottom:1px solid #dee2e6;"><td style="padding:8px;">${date}</td><td style="padding:8px;text-align:right;color:#0dcaf0;">₹${price.toLocaleString()}</td></tr>`;
            });
            html += '</table>';
            histTbl.innerHTML = html;
        }

        // Graph (Simple SVG for Blogger)
        const grafEl = document.querySelector('#silvr_graf');
        if (grafEl && rows.length > 3) renderSimpleGraph('#silvr_graf', rows, 'silver');

        // Disclaimer
        const silverDisc = document.querySelector('#disclamerSilver');
        if (silverDisc) silverDisc.innerHTML = `
            <div style="background:#fff3cd;border-left:4px solid #c0c0c0;padding:12px;margin:15px 0;border-radius:6px;font-size:13px;">
                <strong>⚠️</strong> चाँदी के भाव स्थानीय ज्वेलर्स से। mandibhavkhabar.com केवल सूचना देता है।
            </div>`;
    }

    function renderGold(p22, p24, rows) {
        console.log("✅ Gold rendered: 22K", p22, "24K", p24);
        document.querySelector('#g22kt').textContent = `₹${p22.toLocaleString('hi-IN')}`;
        document.querySelector('#g24kt').textContent = `₹${p24.toLocaleString('hi-IN')}`;
        document.querySelector('#udat').textContent = new Date().toLocaleDateString('hi-IN');

        updateGramTable('#gramtbl22', p22, '#fef3c7', '#d97706', '22K');
        updateGramTable('#gramtbl24', p24, '#f3e8ff', '#a855f7', '24K');
        updateHistoryTable('#data_table1', rows, '22K', '#fef3c7', 1);
        updateHistoryTable('#data_table2', rows, '24K', '#f3e8ff', 3);

        const grafEl = document.querySelector('#gldgraf');
        if (grafEl && rows.length > 3) renderSimpleGraph('#gldgraf', rows, 'gold');

        const goldDisc = document.querySelector('#disclamergold');
        if (goldDisc) goldDisc.innerHTML = `
            <div style="background:#fff3cd;border-left:4px solid #f59e0b;padding:12px;margin:15px 0;border-radius:6px;font-size:13px;">
                <strong>⚠️</strong> सोने के भाव स्थानीय ज्वेलर्स से। mandibhavkhabar.com केवल सूचना देता है।
            </div>`;
    }

    // Simple SVG Graph (Blogger Safe)
    function renderSimpleGraph(id, rows, type) {
        const el = document.querySelector(id);
        let html = `<svg width="100%" height="300" viewBox="0 0 700 300" style="border:2px solid ${type=='gold'?'#f59e0b':'#c0c0c0'};border-radius:10px;">
            <rect width="700" height="300" fill="${type=='gold'?'#fef3c7':'#e6f3ff'}"/>
            <g stroke="rgba(0,0,0,0.1)" stroke-width="1">${Array(5).fill().map((_,i)=>`<line x1="80" y1="${70+i*55}" x2="620" y2="${70+i*55}"/>`).join('')}</g>
            <path d="${rows.slice(0,10).map((r,i)=>{const c=type=='silver'?2:1;const p=r.c[c]?.v||0;const x=90+i*60;const y=260-(p/80000)*220;return i?'L'+x+' '+y:'M'+x+' '+y;}).join('')}" stroke="${type=='silver'?'#c0c0c0':'#f59e0b'}" stroke-width="3" fill="none"/>
            <text x="350" y="25" text-anchor="middle" font-size="14" font-weight="bold" fill="#495057">${type=='silver'?'चाँदी':'सोना'}</text>
        </svg>`;
        el.innerHTML = html;
    }

    // Helper functions (shortened)
    function updateGramTable(id, price, bg, color, type) {
        const el = document.querySelector(id);
        if (!el) return;
        let html = `<div style="background:${bg};padding:15px;border-radius:10px;">`;
        [1,8,10,50,100].forEach(g => html += `<div style="display:flex;justify:space-between;padding:5px 0;"><span>${g}g ${type}</span><span style="color:${color};font-weight:600;">₹${Math.round(g*price).toLocaleString()}</span></div>`);
        el.innerHTML = html + '</div>';
    }

    function updateHistoryTable(id, rows, type, bg, colIdx) {
        const el = document.querySelector(id);
        if (!el || !rows.length) return;
        let html = `<table style="width:100%;border-collapse:collapse;"><tr style="background:${bg}"><th style="padding:10px;">तारीख</th><th>${type}</th></tr>`;
        rows.slice(0,10).forEach(r => {
            html += `<tr style="border-bottom:1px solid #eee;"><td style="padding:8px;">${r.c[0]?.f||''}</td><td style="padding:8px;text-align:right;color:${colIdx==1?'#d97706':'#a855f7'};">₹${parseInt(r.c[colIdx]?.v||0).toLocaleString()}</td></tr>`;
        });
        el.innerHTML = html + '</table>';
    }

    // LOAD CONFIGS + AUTO TRIGGER
    Promise.all([
        fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/silver-groups.json').then(r=>r.json()),
        fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/gold-groups.json').then(r=>r.json())
    ]).then(([s,g]) => {
        silverConfig = s; goldConfig = g;
        console.log('✅ Configs loaded');
        // Auto trigger after 2 sec
        setTimeout(() => {
            window.Silverdata("sct345", "Silver");
            window.golddata("gct361", "gold");
        }, 2000);
    }).catch(() => setTimeout(() => location.reload(), 5000)); // Reload if config fail

    // CSS
    const style = document.createElement('style');
    style.textContent = `
        .silvrbox,.gldbox{padding:20px;border-radius:12px;margin:10px 0;box-shadow:0 4px 15px rgba(0,0,0,0.1);}
        .silvrbox{background:linear-gradient(135deg,#e6f3ff,#bfdbfe)!important;}
        .gldbox{background:linear-gradient(135deg,#fef3c7,#fde68a)!important;}
        #silvr_pricet,#g22kt,#g24kt{font-size:26px!important;font-weight:800!important;color:#d97706!important;}
        table{font-family:Arial,sans-serif;border-collapse:collapse;width:100%;}
        th{background:#f8f9fa;color:#333;padding:10px;}
        .whirly{display:none;}
        #sscity{display:none;}
    `;
    document.head.appendChild(style);
})();
