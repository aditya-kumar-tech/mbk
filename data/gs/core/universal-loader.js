// Universal Loader v6.3 – REAL GVIZ FIX (Silver + Gold)

(function () {
    console.log('🚀 Universal Loader v6.3 – GVIZ PERFECT');

    window.sctqury = window.sctqury || '';
    window.gctqury = window.gctqury || '';

    /* ======================
       ENTRY FUNCTIONS
    ====================== */

    window.Silverdata = function (q) {
        window.sctqury = String(q || '').replace(/["']/g, '');
        window._silverQueue = window._silverQueue || [];
        window._silverQueue.push(window.sctqury);
        if (window.gsConfig) processSilver();
    };

    window.golddata = function (q) {
        window.gctqury = String(q || '').replace(/["']/g, '');
        window._goldQueue = window._goldQueue || [];
        window._goldQueue.push(window.gctqury);
        if (window.gsConfig) processGold();
    };

    /* ======================
       GVIZ PARSER
    ====================== */

    function parseGViz(data) {
        try {
            let t = data
                .replace(/^\s*\/\*O_o\*\/\s*/, '')
                .replace(/^google\.visualization\.Query\.setResponse\s*\(/i, '')
                .replace(/\)\s*;?\s*$/, '');
            return JSON.parse(t)?.table?.rows || [];
        } catch (e) {
            console.error('❌ GVIZ parse error', e);
            return [];
        }
    }

    /* ======================
       DATE SORT (REAL FIX)
       Silver → col[5]
       Gold   → col[9]
    ====================== */

    function sortByISODate(rows, index) {
        return rows.slice().sort((a, b) => {
            const da = a.c[index]?.f || '';
            const db = b.c[index]?.f || '';
            return db.localeCompare(da);
        });
    }

    /* ======================
       CONFIG FINDER
    ====================== */

    function findConfig(num) {
        for (let k in gsConfig) {
            const r = gsConfig[k].range;
            if (num >= r[0] && num <= r[1]) {
                return { sheetId: gsConfig[k].id, offset: num - r[0] };
            }
        }
        return null;
    }

    /* ======================
       SILVER PROCESS
    ====================== */

    function processSilver() {
        if (!window._silverQueue?.length) return;

        const q = window._silverQueue.pop();
        const num = parseInt(q.replace(/\D/g, ''));
        const cfg = findConfig(num);
        if (!cfg) return;

        const url = `https://docs.google.com/spreadsheets/d/${cfg.sheetId}/gviz/tq?tqx=out:json&sheet=silvweb&tq=select * limit 30 offset ${cfg.offset}`;

        fetch(url).then(r => r.text()).then(txt => {
            let rows = parseGViz(txt);
            rows = sortByISODate(rows, 5);

            const priceKg = parseInt(rows[0]?.c[2]?.v || 0);
            updateSilverUI(priceKg, rows);
        });
    }

    /* ======================
       GOLD PROCESS
    ====================== */

    function processGold() {
        if (!window._goldQueue?.length) return;

        const q = window._goldQueue.pop();
        const num = parseInt(q.replace(/\D/g, ''));
        const cfg = findConfig(num) || { sheetId: Object.values(gsConfig)[0].id, offset: 0 };

        const url = `https://docs.google.com/spreadsheets/d/${cfg.sheetId}/gviz/tq?tqx=out:json&sheet=goldweb&tq=select * limit 30 offset ${cfg.offset}`;

        fetch(url).then(r => r.text()).then(txt => {
            let rows = parseGViz(txt);
            rows = sortByISODate(rows, 9);

            const r0 = rows[0] || {};
            updateGoldUI(
                parseInt(r0.c[1]?.v || 0),
                parseInt(r0.c[3]?.v || 0),
                rows
            );
        });
    }

    /* ======================
       SILVER UI
    ====================== */

    function updateSilverUI(priceKg, rows) {
        document.querySelector('#silvr_pricet') &&
            (silvr_pricet.textContent = `₹${priceKg.toLocaleString('hi-IN')}`);

        // gram table
        const gtbl = document.querySelector('#silvr_gramtbl');
        if (gtbl) {
            const p10 = priceKg / 100;
            let h = '<table style="width:100%">';
            [1, 10, 50, 100, 500, 1000].forEach(g => {
                h += `<tr><td>${g}g</td><td style="text-align:right">₹${Math.round(g * p10 / 10).toLocaleString('hi-IN')}</td></tr>`;
            });
            gtbl.innerHTML = h + '</table>';
        }

        // history
        const ht = document.querySelector('#data_table1');
        if (ht) {
            let h = '<table style="width:100%"><tr><th>तारीख</th><th>1Kg</th></tr>';
            rows.slice(0, 15).forEach(r => {
                h += `<tr><td>${r.c[0]?.f}</td><td style="text-align:right">₹${parseInt(r.c[2]?.v).toLocaleString('hi-IN')}</td></tr>`;
            });
            ht.innerHTML = h + '</table>';
        }

        drawSilverGraph('#silvr_graf', rows);
    }

    function drawSilverGraph(id, rows) {
        const el = document.querySelector(id);
        if (!el || rows.length < 5) return;

        el.innerHTML = '<canvas width="700" height="350"></canvas>';
        const ctx = el.querySelector('canvas').getContext('2d');
        const data = rows.slice(0, 15).map(r => r.c[2]?.v || 0);
        const max = Math.max(...data);

        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 3;
        ctx.beginPath();
        data.forEach((p, i) => {
            const x = 50 + (i / 14) * 600;
            const y = 300 - (p / max) * 250;
            i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        });
        ctx.stroke();
    }

    /* ======================
       GOLD UI
    ====================== */

    function updateGoldUI(p22, p24, rows) {
        g22kt && (g22kt.textContent = `₹${p22.toLocaleString('hi-IN')}`);
        g24kt && (g24kt.textContent = `₹${p24.toLocaleString('hi-IN')}`);
        udat && (udat.textContent = new Date().toLocaleDateString('hi-IN'));

        makeHist('#data_table1', rows, 1, '22K');
        makeHist('#data_table2', rows, 3, '24K');
        drawGoldGraph('#gldgraf', rows);
    }

    function makeHist(id, rows, col, label) {
        const el = document.querySelector(id);
        if (!el) return;

        let h = `<table style="width:100%"><tr><th>तारीख</th><th>${label}</th></tr>`;
        rows.slice(0, 15).forEach(r => {
            h += `<tr><td>${r.c[0]?.f}</td><td style="text-align:right">₹${parseInt(r.c[col]?.v).toLocaleString('hi-IN')}</td></tr>`;
        });
        el.innerHTML = h + '</table>';
    }

    function drawGoldGraph(id, rows) {
        const el = document.querySelector(id);
        if (!el) return;

        el.innerHTML = '<canvas width="700" height="350"></canvas>';
        const ctx = el.querySelector('canvas').getContext('2d');

        const d22 = rows.slice(0, 15).map(r => r.c[1]?.v || 0);
        const d24 = rows.slice(0, 15).map(r => r.c[3]?.v || 0);
        const max = Math.max(...d22, ...d24);

        draw(ctx, d22, max, '#f59e0b');
        draw(ctx, d24, max, '#9333ea');
    }

    function draw(ctx, data, max, color) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        data.forEach((p, i) => {
            const x = 50 + (i / 14) * 600;
            const y = 300 - (p / max) * 250;
            i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        });
        ctx.stroke();
    }

    /* ======================
       LOAD CONFIG
    ====================== */

    fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/silver-groups.json')
        .then(r => r.json())
        .then(c => {
            window.gsConfig = c;
            setTimeout(() => { processSilver(); processGold(); }, 500);
        });

})();
