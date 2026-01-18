(function () {
    console.log("🚀 Universal Loader v6.9 STARTED");

    /* =========================
       COMMON GVIZ PARSER
    ========================= */
    function parseGViz(txt) {
        try {
            txt = txt
                .replace(/^\s*\/\*O_o\*\/\s*/, '')
                .replace(/^google\.visualization\.Query\.setResponse\s*\(/, '')
                .replace(/\);?\s*$/, '');
            const json = JSON.parse(txt);
            const rows = json.table.rows || [];
            console.log("GViz Data:", rows); // DEBUG: fetched GViz data
            return rows;
        } catch (e) {
            console.error("GViz parse failed", e);
            return [];
        }
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

    /* ======================================================
       ===================== SILVER =========================
       ====================================================== */
    let silverQueue = [];
    let silverConfig = null;
    const SILVER_HIST = []; // last 15 days data

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
                const rows = parseGViz(t)
                    .sort((a, b) => (b.c[5]?.f || '').localeCompare(a.c[5]?.f || ''));
                if (!rows.length) return;

                // maintain 15 days history
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
        console.log("Silver latest 1kg price:", priceKg);
        console.log("Silver historical rows:", SILVER_HIST);

        // Gram table example
        if (window.silvr_pricet) {
            silvr_pricet.textContent = `₹${priceKg.toLocaleString('hi-IN')}`;
        }

        // Graph example data
        const graphData = SILVER_HIST.map(r => r.c[2]?.v || 0);
        if (window.silvr_graf) {
            silvr_graf.innerHTML = graphData.map(v => `<div class="graph-bar" style="height:${v/1000}px;width:10px;"></div>`).join('');
        }
    }

    fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/silver-groups.json')
        .then(r => r.json())
        .then(j => {
            silverConfig = j;
            runSilver();
        });

    /* ======================================================
       ===================== GOLD ===========================
       ====================================================== */
    let goldQueue = [];
    let goldConfig = null;
    const GOLD_HIST_22 = [];
    const GOLD_HIST_24 = [];

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
                const rows = parseGViz(t)
                    .sort((a, b) => (b.c[9]?.f || '').localeCompare(a.c[9]?.f || ''));

                if (!rows.length) return;

                // maintain 15 days history
                GOLD_HIST_22.splice(0, 0, ...rows.slice(0, 15));
                GOLD_HIST_24.splice(0, 0, ...rows.slice(0, 15));
                if (GOLD_HIST_22.length > 15) GOLD_HIST_22.length = 15;
                if (GOLD_HIST_24.length > 15) GOLD_HIST_24.length = 15;

                renderGold(
                    rows[0].c[1]?.v || 0,
                    rows[0].c[3]?.v || 0,
                    rows
                );
            })
            .catch(err => {
                console.error("Gold fetch failed, retrying...", err);
                setTimeout(runGold, 1200);
            });
    }

    function renderGold(p22, p24, rows) {
        console.log("Gold 22k price:", p22, "Gold 24k price:", p24);
        console.log("Gold historical rows 22k:", GOLD_HIST_22);
        console.log("Gold historical rows 24k:", GOLD_HIST_24);

        if (window.g22kt) g22kt.textContent = `₹${p22.toLocaleString('hi-IN')}`;
        if (window.g24kt) g24kt.textContent = `₹${p24.toLocaleString('hi-IN')}`;
        if (window.udat) udat.textContent = new Date().toLocaleDateString('hi-IN');

        // Mini comparative graph
        if (window.gldgraf) {
            const graphData22 = GOLD_HIST_22.map(r => r.c[1]?.v || 0);
            const graphData24 = GOLD_HIST_24.map(r => r.c[3]?.v || 0);
            gldgraf.innerHTML = graphData22.map((v, i) =>
                `<div class="graph-bar" style="height:${v/1000}px;width:8px;background:#ff9800;"></div>`).join('') +
                graphData24.map((v, i) =>
                `<div class="graph-bar" style="height:${v/1000}px;width:8px;background:#ffc107;margin-left:1px;"></div>`).join('');
        }
    }

    fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/gold-groups.json')
        .then(r => r.json())
        .then(j => {
            goldConfig = j;
            runGold();
        });
})();
