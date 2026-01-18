// 🚀 Universal Loader v6.5 – PERFECT SEPARATION (Gold + Silver)

(function () {
    console.log('🚀 Universal Loader v6.5 Loaded');

    window._silverQueue = [];
    window._goldQueue = [];

    window.silverConfig = null;
    window.goldConfig = null;

    /* ======================
       ENTRY FUNCTIONS
    ====================== */

    window.Silverdata = function (q) {
        _silverQueue.push(String(q || '').replace(/\D/g, ''));
        if (silverConfig) processSilver();
    };

    window.golddata = function (q) {
        _goldQueue.push(String(q || '').replace(/\D/g, ''));
        if (goldConfig) processGold();
    };

    /* ======================
       GVIZ PARSER
    ====================== */

    function parseGViz(txt) {
        try {
            txt = txt
                .replace(/^\s*\/\*O_o\*\/\s*/, '')
                .replace(/^google\.visualization\.Query\.setResponse\s*\(/, '')
                .replace(/\);?\s*$/, '');
            return JSON.parse(txt).table.rows || [];
        } catch {
            return [];
        }
    }

    function sortByISO(rows, idx) {
        return rows.slice().sort((a, b) =>
            (b.c[idx]?.f || '').localeCompare(a.c[idx]?.f || '')
        );
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

    /* ======================
       SILVER PROCESS
    ====================== */

    function processSilver() {
        if (!_silverQueue.length) return;

        const n = parseInt(_silverQueue.pop());
        const cfg = findCfg(silverConfig, n);
        if (!cfg) return;

        fetch(`https://docs.google.com/spreadsheets/d/${cfg.id}/gviz/tq?tqx=out:json&sheet=silvweb&tq=select * limit 30 offset ${cfg.off}`)
            .then(r => r.text())
            .then(t => {
                let rows = sortByISO(parseGViz(t), 5);
                updateSilverUI(rows[0]?.c[2]?.v || 0, rows);
            });
    }

    /* ======================
       GOLD PROCESS
    ====================== */

    function processGold() {
        if (!_goldQueue.length) return;

        const n = parseInt(_goldQueue.pop());
        const cfg = findCfg(goldConfig, n);
        if (!cfg) return;

        fetch(`https://docs.google.com/spreadsheets/d/${cfg.id}/gviz/tq?tqx=out:json&sheet=goldweb&tq=select * limit 30 offset ${cfg.off}`)
            .then(r => r.text())
            .then(t => {
                let rows = sortByISO(parseGViz(t), 9);
                if (!rows.length) return;

                updateGoldUI(
                    rows[0].c[1].v,
                    rows[0].c[3].v,
                    rows
                );
            });
    }

    /* ======================
       UI FUNCTIONS (UNCHANGED)
    ====================== */

    function updateSilverUI(p, rows) {
        silvr_pricet && (silvr_pricet.textContent = `₹${p.toLocaleString('hi-IN')}`);
    }

    function updateGoldUI(p22, p24, rows) {
        g22kt && (g22kt.textContent = `₹${p22.toLocaleString('hi-IN')}`);
        g24kt && (g24kt.textContent = `₹${p24.toLocaleString('hi-IN')}`);
        udat && (udat.textContent = new Date().toLocaleDateString('hi-IN'));
    }

    /* ======================
       LOAD CONFIGS (SEPARATE)
    ====================== */

    fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/silver-groups.json')
        .then(r => r.json())
        .then(j => {
            silverConfig = j;
            processSilver();
        });

    fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/gold-groups.json')
        .then(r => r.json())
        .then(j => {
            goldConfig = j;
            processGold();
        });

})();
