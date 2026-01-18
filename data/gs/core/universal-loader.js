(function () {
    console.log("🚀 Universal Loader v7.0 STARTED");

    function parseGViz(txt) {
        try {
            txt = txt
                .replace(/^\s*\/\*O_o\*\/\s*/, '')
                .replace(/^google\.visualization\.Query\.setResponse\s*\(/, '')
                .replace(/\);?\s*$/, '');
            const rows = JSON.parse(txt).table.rows || [];
            console.log("GViz Data:", rows);
            return rows;
        } catch (e) {
            console.error("GViz parse failed", e);
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
                renderSilver(priceKg, rows);
            })
            .catch(err => {
                console.error("Silver fetch failed, retrying...", err);
                setTimeout(runSilver, 1200);
            });
    }

    function renderSilver(priceKg, rows) {
        console.log("Silver latest 1kg:", priceKg, "Historical rows:", SILVER_HIST);
        if (window.silvr_pricet) silvr_pricet.textContent = `₹${priceKg.toLocaleString('hi-IN')}`;
    }

    fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/silver-groups.json')
        .then(r => r.json())
        .then(j => {
            silverConfig = j;
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

        const url = `https://docs.google.com/spreadsheets/d/${cfg.id}/gviz/tq?tqx=out:json&sheet=goldweb&tq=select * limit 15 offset ${cfg.off}`;
        fetch(url)
            .then(r => r.text())
            .then(t => {
                const rows = parseGViz(t);
                if (!rows.length) return;

                GOLD_HIST_22.splice(0, 0, ...rows.slice(0, 15));
                GOLD_HIST_24.splice(0, 0, ...rows.slice(0, 15));
                if (GOLD_HIST_22.length > 15) GOLD_HIST_22.length = 15;
                if (GOLD_HIST_24.length > 15) GOLD_HIST_24.length = 15;

                renderGold(rows[0].c[1]?.v || 0, rows[0].c[3]?.v || 0, rows);
            })
            .catch(err => {
                console.error("Gold fetch failed, retrying...", err);
                setTimeout(runGold, 1200);
            });
    }

    function renderGold(p22, p24, rows) {
        console.log("Gold 22k:", p22, "24k:", p24, "Historical 22k:", GOLD_HIST_22, "24k:", GOLD_HIST_24);
        if (window.g22kt) g22kt.textContent = `₹${p22.toLocaleString('hi-IN')}`;
        if (window.g24kt) g24kt.textContent = `₹${p24.toLocaleString('hi-IN')}`;
        if (window.udat) udat.textContent = new Date().toLocaleDateString('hi-IN');
    }

    fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/gold-groups.json')
        .then(r => r.json())
        .then(j => {
            goldConfig = j;
            runGold();
        });
})();
