(function () {
    console.log("🚀 Universal Loader v6.7 STARTED");

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
       UTILITY: AUTO RETRY
    ========================= */
    const MAX_RETRY = 5;
    const RETRY_DELAY = 1200;

    function autoRetry(fn, count = 0) {
        if (count >= MAX_RETRY) {
            console.error("❌ Max retries reached for loader");
            return;
        }
        setTimeout(() => fn(count + 1), RETRY_DELAY);
    }

    /* =========================
       RANGE MATCHER (SHARED)
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

                const priceKg = rows[0].c[2]?.v || 0;
                renderSilver(priceKg, rows);
            })
            .catch(() => autoRetry(runSilver));
    }

    function renderSilver(priceKg, rows) {
        silvr_pricet &&
            (silvr_pricet.textContent = `₹${priceKg.toLocaleString('hi-IN')}`);
        // Future: gram table & history render can be added here
    }

    fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/silver-groups.json')
        .then(r => r.json())
        .then(j => {
            silverConfig = j;
            runSilver();
        })
        .catch(() => autoRetry(() => fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/silver-groups.json').then(r => r.json()).then(j => { silverConfig = j; runSilver(); })));

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

                renderGold(rows[0].c[1]?.v || 0, rows[0].c[3]?.v || 0, rows);
            })
            .catch(() => autoRetry(runGold));
    }

    function renderGold(p22, p24, rows) {
        g22kt && (g22kt.textContent = `₹${p22.toLocaleString('hi-IN')}`);
        g24kt && (g24kt.textContent = `₹${p24.toLocaleString('hi-IN')}`);
        udat && (udat.textContent = new Date().toLocaleDateString('hi-IN'));
        // Future: gold history & graph render can be added here
    }

    fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/gold-groups.json')
        .then(r => r.json())
        .then(j => {
            goldConfig = j;
            runGold();
        })
        .catch(() => autoRetry(() => fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/gold-groups.json').then(r => r.json()).then(j => { goldConfig = j; runGold(); })));

})();
