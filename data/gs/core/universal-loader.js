(function () {
    console.log('🚀 Universal Loader v7.2 (GViz SAFE + Separate Config)');

    /* =========================
       GLOBAL QUEUES (SAFE)
    ========================= */
    window._goldQueue = window._goldQueue || [];
    window._silverQueue = window._silverQueue || [];

    window.golddata = function (q) {
        if (!q) return;
        window._goldQueue.push(q.replace(/["']/g, ''));
        tryRun();
    };

    window.Silverdata = function (q) {
        if (!q) return;
        window._silverQueue.push(q.replace(/["']/g, ''));
        tryRun();
    };

    function tryRun() {
        if (window.goldConfig) processGold();
        if (window.silverConfig) processSilver();
    }

    /* =========================
       🔥 GVIZ PARSER (100% SAFE)
    ========================= */
    function parseGViz(text) {
        const start = text.indexOf('{');
        const end = text.lastIndexOf('}');
        if (start === -1 || end === -1) {
            throw new Error('Invalid GViz response');
        }
        const jsonStr = text.substring(start, end + 1);
        return JSON.parse(jsonStr).table.rows || [];
    }

    /* =========================
       SORT BY DATE DESC
    ========================= */
    function sortByDate(rows, col) {
        return rows.sort((a, b) => {
            const da = new Date(a.c[col]?.v || 0);
            const db = new Date(b.c[col]?.v || 0);
            return db - da;
        });
    }

    /* =========================
       FIND CONFIG
    ========================= */
    function findConfig(cfg, num) {
        for (let k in cfg) {
            const r = cfg[k].range;
            if (num >= r[0] && num <= r[1]) {
                return {
                    sheetId: cfg[k].id,
                    offset: num - r[0]
                };
            }
        }
        return null;
    }

    /* =========================
       GOLD PROCESS
    ========================= */
    function processGold() {
        if (!window._goldQueue.length || !window.goldConfig) return;

        const q = window._goldQueue.shift();
        const num = parseInt(q.replace(/\D/g, ''));
        const cfg = findConfig(window.goldConfig, num) ||
            { sheetId: Object.values(window.goldConfig)[0].id, offset: 0 };

        const url = `https://docs.google.com/spreadsheets/d/${cfg.sheetId}/gviz/tq?tqx=out:json&sheet=goldweb&tq=select * limit 30 offset ${cfg.offset}`;

        fetch(url).then(r => r.text()).then(txt => {
            let rows = parseGViz(txt);
            rows = sortByDate(rows, 0);

            const r0 = rows[0] || {};
            updateGoldUI(
                parseInt(r0.c[1]?.v || 0),
                parseInt(r0.c[3]?.v || 0),
                rows
            );
        }).catch(e => console.error('❌ GOLD PARSE FAIL', e));
    }

    /* =========================
       SILVER PROCESS
    ========================= */
    function processSilver() {
        if (!window._silverQueue.length || !window.silverConfig) return;

        const q = window._silverQueue.shift();
        const num = parseInt(q.replace(/\D/g, ''));
        const cfg = findConfig(window.silverConfig, num);
        if (!cfg) return;

        const url = `https://docs.google.com/spreadsheets/d/${cfg.sheetId}/gviz/tq?tqx=out:json&sheet=silvweb&tq=select * limit 30 offset ${cfg.offset}`;

        fetch(url).then(r => r.text()).then(txt => {
            let rows = parseGViz(txt);
            rows = sortByDate(rows, 0);

            const priceKg = parseInt(rows[0]?.c[2]?.v || 0);
            updateSilverUI(priceKg, rows);
        }).catch(e => console.error('❌ SILVER PARSE FAIL', e));
    }

    /* =========================
       GOLD UI
    ========================= */
    function updateGoldUI(p22, p24, rows) {
        document.querySelector('#g22kt')?.textContent = `₹${p22.toLocaleString('hi-IN')}`;
        document.querySelector('#g24kt')?.textContent = `₹${p24.toLocaleString('hi-IN')}`;
        document.querySelector('#udat') &&
            (document.querySelector('#udat').textContent = new Date().toLocaleDateString('hi-IN'));

        historyTable('#data_table1', rows, 1, '22K');
        historyTable('#data_table2', rows, 3, '24K');
        goldGraph('#gldgraf', rows);
    }

    /* =========================
       SILVER UI
    ========================= */
    function updateSilverUI(priceKg, rows) {
        document.querySelector('#silvr_pricet')?.textContent =
            `₹${priceKg.toLocaleString('hi-IN')}`;

        historyTable('#data_table1', rows, 2, '1Kg');
    }

    /* =========================
       HISTORY TABLE
    ========================= */
    function historyTable(id, rows, col, label) {
        const el = document.querySelector(id);
        if (!el) return;

        let html = `<table style="width:100%">
            <tr><th>तारीख</th><th>${label}</th></tr>`;

        rows.slice(0, 30).forEach(r => {
            html += `<tr>
                <td>${r.c[0]?.f || ''}</td>
                <td style="text-align:right">₹${parseInt(r.c[col]?.v || 0).toLocaleString('hi-IN')}</td>
            </tr>`;
        });
        html += '</table>';
        el.innerHTML = html;
    }

    /* =========================
       GOLD GRAPH
    ========================= */
    function goldGraph(id, rows) {
        const el = document.querySelector(id);
        if (!el || rows.length < 5) return;

        el.innerHTML = '<canvas height="300"></canvas>';
        const ctx = el.querySelector('canvas').getContext('2d');

        const a = rows.slice(0, 12).map(r => r.c[1]?.v || 0);
        const b = rows.slice(0, 12).map(r => r.c[3]?.v || 0);
        const m = Math.max(...a, ...b);

        draw(a, '#f59e0b');
        draw(b, '#a855f7');

        function draw(arr, color) {
            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            ctx.beginPath();
            arr.forEach((p, i) => {
                const x = 40 + i * 50;
                const y = 260 - (p / m) * 200;
                i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
            });
            ctx.stroke();
        }
    }

    /* =========================
       LOAD CONFIGS (SEPARATE)
    ========================= */
    Promise.all([
        fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/gold-groups.json').then(r => r.json()),
        fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/silver-groups.json').then(r => r.json())
    ]).then(([g, s]) => {
        window.goldConfig = g;
        window.silverConfig = s;
        console.log('✅ Configs ready');
        tryRun();
    });

})();
