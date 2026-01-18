(function () {
    console.log("🚀 Universal Loader v6.8 STARTED");

    /* =========================
       COMMON GVIZ PARSER (SAFE)
    ========================= */
    function parseGViz(txt) {
        try {
            txt = txt
                .replace(/^\s*\/\*O_o\*\/\s*/, '')
                .replace(/^google\.visualization\.Query\.setResponse\s*\(/, '')
                .replace(/\);?\s*$/, '');
            return JSON.parse(txt).table.rows || [];
        } catch (e) {
            console.error("GViz parse failed", e);
            return [];
        }
    }

    /* =========================
       AUTO RETRY UTILITY
    ========================= */
    const MAX_RETRY = 5;
    const RETRY_DELAY = 1200;
    function autoRetry(fn, count = 0) {
        if (count >= MAX_RETRY) return console.error("❌ Max retries reached");
        setTimeout(() => fn(count + 1), RETRY_DELAY);
    }

    /* =========================
       RANGE MATCHER
    ========================= */
    function findCfg(map, n) {
        for (const k in map) {
            const r = map[k].range;
            if (n >= r[0] && n <= r[1]) {
                return { id: map[k].id, off: n - r[0] };
            }
        }
        return null;
    }

    /* =========================
       HISTORICAL DATA STORE
    ========================= */
    const goldHistory = [];
    const silverHistory = [];
    const HISTORY_LIMIT = 15;

    function addHistory(arr, data) {
        arr.unshift(data);
        if (arr.length > HISTORY_LIMIT) arr.pop();
    }

    /* =========================
       SILVER LOADER
    ========================= */
    let silverQueue = [];
    let silverConfig = null;

    window.Silverdata = function (q) {
        silverQueue.push(parseInt(String(q).replace(/\D/g, '')));
        if (silverConfig) runSilver();
    };

    function runSilver() {
        if (!silverQueue.length || !silverConfig) return;

        const num = silverQueue.pop();
        const cfg = findCfg(silverConfig, num);
        if (!cfg) return;

        const url = `https://docs.google.com/spreadsheets/d/${cfg.id}/gviz/tq?tqx=out:json&sheet=silvweb&tq=select * limit 15 offset ${cfg.off}`;

        fetch(url)
            .then(r => r.text())
            .then(t => {
                const rows = parseGViz(t).sort((a, b) =>
                    (b.c[5]?.f || '').localeCompare(a.c[5]?.f || '')
                );
                if (!rows.length) return autoRetry(runSilver);

                const latest = {
                    date: rows[0].c[0]?.f,
                    price10g: rows[0].c[1]?.v || 0,
                    price1kg: rows[0].c[2]?.v || 0
                };
                addHistory(silverHistory, latest);
                renderSilver(latest, silverHistory);
            })
            .catch(() => autoRetry(runSilver));
    }

    function renderSilver(latest, history) {
        silvr_pricet && (silvr_pricet.textContent = `₹${latest.price1kg.toLocaleString('hi-IN')}`);
        // Render gram table
        const table = document.getElementById("silverTable");
        if (table) {
            table.innerHTML = `<tr><th>Date</th><th>10g</th><th>1Kg</th></tr>` +
                history.map(r => `<tr><td>${r.date}</td><td>₹${r.price10g.toLocaleString('hi-IN')}</td><td>₹${r.price1kg.toLocaleString('hi-IN')}</td></tr>`).join('');
        }
        renderGraph("silverGraph", history.map(r => r.price1kg));
    }

    /* =========================
       GOLD LOADER
    ========================= */
    let goldQueue = [];
    let goldConfig = null;

    window.golddata = function (q) {
        goldQueue.push(parseInt(String(q).replace(/\D/g, '')));
        if (goldConfig) runGold();
    };

    function runGold() {
        if (!goldQueue.length || !goldConfig) return;

        const num = goldQueue.pop();
        const cfg = findCfg(goldConfig, num);
        if (!cfg) return;

        const url = `https://docs.google.com/spreadsheets/d/${cfg.id}/gviz/tq?tqx=out:json&sheet=goldweb&tq=select * limit 15 offset ${cfg.off}`;

        fetch(url)
            .then(r => r.text())
            .then(t => {
                const rows = parseGViz(t).sort((a, b) =>
                    (b.c[9]?.f || '').localeCompare(a.c[9]?.f || '')
                );
                if (!rows.length) return autoRetry(runGold);

                const latest = {
                    date: rows[0].c[0]?.f,
                    price22g: rows[0].c[1]?.v || 0,
                    price24g: rows[0].c[3]?.v || 0
                };
                addHistory(goldHistory, latest);
                renderGold(latest, goldHistory);
            })
            .catch(() => autoRetry(runGold));
    }

    function renderGold(latest, history) {
        g22kt && (g22kt.textContent = `₹${latest.price22g.toLocaleString('hi-IN')}`);
        g24kt && (g24kt.textContent = `₹${latest.price24g.toLocaleString('hi-IN')}`);
        udat && (udat.textContent = new Date().toLocaleDateString('hi-IN'));

        // Render gram table
        const table = document.getElementById("goldTable");
        if (table) {
            table.innerHTML = `<tr><th>Date</th><th>22Kt</th><th>24Kt</th></tr>` +
                history.map(r => `<tr><td>${r.date}</td><td>₹${r.price22g.toLocaleString('hi-IN')}</td><td>₹${r.price24g.toLocaleString('hi-IN')}</td></tr>`).join('');
        }
        renderGraph("goldGraph", history.map(r => r.price22g));
    }

    /* =========================
       MINI GRAPH RENDER
    ========================= */
    function renderGraph(id, data) {
        const el = document.getElementById(id);
        if (!el) return;
        el.innerHTML = ""; // reset
        const max = Math.max(...data, 1);
        const w = el.clientWidth || 200;
        const h = el.clientHeight || 50;
        data.forEach((val, i) => {
            const bar = document.createElement("div");
            bar.style.height = `${(val / max) * h}px`;
            bar.style.width = `${w / data.length - 2}px`;
            bar.style.display = "inline-block";
            bar.style.marginRight = "1px";
            bar.style.background = "#ff9800";
            el.appendChild(bar);
        });
    }

    /* =========================
       FETCH CONFIGS
    ========================= */
    fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/silver-groups.json')
        .then(r => r.json())
        .then(j => { silverConfig = j; runSilver(); })
        .catch(() => autoRetry(() => fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/silver-groups.json').then(r => r.json()).then(j => { silverConfig = j; runSilver(); })));

    fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/gold-groups.json')
        .then(r => r.json())
        .then(j => { goldConfig = j; runGold(); })
        .catch(() => autoRetry(() => fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/gold-groups.json').then(r => r.json()).then(j => { goldConfig = j; runGold(); })));

})();
