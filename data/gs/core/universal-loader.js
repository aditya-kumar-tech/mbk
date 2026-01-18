(function () {
    console.log('🚀 Universal Loader v7.0 (Gold & Silver Separate Config)');

    /* =========================
       GLOBAL QUEUES
    ========================= */
    window._goldQueue = [];
    window._silverQueue = [];

    window.golddata = function (q) {
        q = q.replace(/["']/g, '');
        window._goldQueue.push(q);
        if (window.goldConfig) processGold();
    };

    window.Silverdata = function (q) {
        q = q.replace(/["']/g, '');
        window._silverQueue.push(q);
        if (window.silverConfig) processSilver();
    };

    /* =========================
       GVIZ PARSER (FIXED)
    ========================= */
    function parseGViz(text) {
        let clean = text
            .replace(/^\/\*O_o\*\//, '')
            .replace(/^google\.visualization\.Query\.setResponse\(/i, '')
            .replace(/\);?\s*$/, '')
            .trim();

        const json = JSON.parse(clean);
        return json?.table?.rows || [];
    }

    /* =========================
       SORT BY DATE DESC
    ========================= */
    function sortByISODate(rows, col) {
        return rows.sort((a, b) => {
            const da = new Date(a.c[col]?.v || 0);
            const db = new Date(b.c[col]?.v || 0);
            return db - da;
        });
    }

    /* =========================
       FIND CONFIG (GENERIC)
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

        const q = window._goldQueue.pop();
        const num = parseInt(q.replace(/\D/g, ''));
        const cfg = findConfig(window.goldConfig, num) ||
            { sheetId: Object.values(window.goldConfig)[0].id, offset: 0 };

        const url = `https://docs.google.com/spreadsheets/d/${cfg.sheetId}/gviz/tq?tqx=out:json&sheet=goldweb&tq=select * limit 30 offset ${cfg.offset}`;

        fetch(url).then(r => r.text()).then(txt => {
            let rows = parseGViz(txt);
            rows = sortByISODate(rows, 0);

            const today = rows[0] || {};
            const p22 = parseInt(today.c[1]?.v || 0);
            const p24 = parseInt(today.c[3]?.v || 0);

            updateGoldUI(p22, p24, rows);
        }).catch(e => console.error('Gold error', e));
    }

    /* =========================
       SILVER PROCESS
    ========================= */
    function processSilver() {
        if (!window._silverQueue.length || !window.silverConfig) return;

        const q = window._silverQueue.pop();
        const num = parseInt(q.replace(/\D/g, ''));
        const cfg = findConfig(window.silverConfig, num);
        if (!cfg) return;

        const url = `https://docs.google.com/spreadsheets/d/${cfg.sheetId}/gviz/tq?tqx=out:json&sheet=silvweb&tq=select * limit 30 offset ${cfg.offset}`;

        fetch(url).then(r => r.text()).then(txt => {
            let rows = parseGViz(txt);
            rows = sortByISODate(rows, 0);

            const priceKg = parseInt(rows[0]?.c[2]?.v || 0);
            updateSilverUI(priceKg, rows);
        }).catch(e => console.error('Silver error', e));
    }

    /* =========================
       GOLD UI + HISTORY + GRAPH
    ========================= */
    function updateGoldUI(p22, p24, rows) {
        const g22 = document.querySelector('#g22kt');
        const g24 = document.querySelector('#g24kt');
        if (g22) g22.textContent = `₹${p22.toLocaleString('hi-IN')}`;
        if (g24) g24.textContent = `₹${p24.toLocaleString('hi-IN')}`;

        document.querySelector('#udat') &&
            (document.querySelector('#udat').textContent =
                new Date().toLocaleDateString('hi-IN'));

        gramTable('#gramtbl22', p22, '22K', '#fef3c7', '#d97706');
        gramTable('#gramtbl24', p24, '24K', '#f3e8ff', '#a855f7');

        historyTable('#data_table1', rows, 1, '22K', '#fef3c7');
        historyTable('#data_table2', rows, 3, '24K', '#f3e8ff');

        goldGraph('#gldgraf', rows);
    }

    /* =========================
       SILVER UI + HISTORY
    ========================= */
    function updateSilverUI(priceKg, rows) {
        const el = document.querySelector('#silvr_pricet');
        if (el) el.textContent = `₹${priceKg.toLocaleString('hi-IN')}`;

        const tbl = document.querySelector('#silvr_gramtbl');
        if (tbl) {
            let html = '<table style="width:100%">';
            [1, 10, 50, 100, 500, 1000].forEach(g => {
                html += `<tr><td>${g}g</td>
                <td style="text-align:right">₹${Math.round(priceKg * g / 1000).toLocaleString('hi-IN')}</td></tr>`;
            });
            html += '</table>';
            tbl.innerHTML = html;
        }

        historyTable('#data_table1', rows, 2, '1Kg', '#e6f3ff');
    }

    /* =========================
       HELPERS
    ========================= */
    function gramTable(id, price, type, bg, color) {
        const el = document.querySelector(id);
        if (!el) return;

        let html = `<div style="background:${bg};padding:15px;border-radius:12px">`;
        [1, 8, 10, 50, 100].forEach(g => {
            html += `<div style="display:flex;justify-content:space-between">
                <span>${g}g ${type}</span>
                <b style="color:${color}">₹${Math.round(g * price).toLocaleString('hi-IN')}</b>
            </div>`;
        });
        html += '</div>';
        el.innerHTML = html;
    }

    function historyTable(id, rows, col, label, bg) {
        const el = document.querySelector(id);
        if (!el || !rows.length) return;

        let html = `<table style="width:100%"><tr style="background:${bg}">
            <th>तारीख</th><th>${label}</th></tr>`;

        rows.slice(0, 30).forEach(r => {
            html += `<tr><td>${r.c[0]?.f || ''}</td>
            <td style="text-align:right">₹${parseInt(r.c[col]?.v || 0).toLocaleString('hi-IN')}</td></tr>`;
        });
        html += '</table>';
        el.innerHTML = html;
    }

    function goldGraph(id, rows) {
        const el = document.querySelector(id);
        if (!el || rows.length < 5) return;

        el.innerHTML = '<canvas height="300"></canvas>';
        const c = el.querySelector('canvas');
        const ctx = c.getContext('2d');

        const p22 = rows.slice(0, 12).map(r => r.c[1]?.v || 0);
        const p24 = rows.slice(0, 12).map(r => r.c[3]?.v || 0);
        const max = Math.max(...p22, ...p24);

        function draw(arr, color) {
            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            ctx.beginPath();
            arr.forEach((p, i) => {
                const x = 40 + i * 50;
                const y = 260 - (p / max) * 200;
                i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
            });
            ctx.stroke();
        }

        draw(p22, '#f59e0b');
        draw(p24, '#a855f7');
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
        processGold();
        processSilver();
    });

    /* =========================
       HIDE CITY COMPLETELY
    ========================= */
    const style = document.createElement('style');
    style.textContent = `
        #sscity,.city,.cityname,[data-city]{display:none!important}
    `;
    document.head.appendChild(style);

})();
