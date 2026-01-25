/* ================= RETRY WRAPPER ================= */
function waitForEl(selector, callback, tries = 20, interval = 200) {
    // tries = kitni baar check kare; interval = delay ms
    const attempt = () => {
        const el = has(selector);
        if (el) callback(el);
        else if (tries > 0) {
            setTimeout(() => waitForEl(selector, callback, tries - 1, interval), interval);
        } else {
            console.warn("Element not found:", selector);
        }
    };
    attempt();
}

/* ================= SILVER ================= */
window.Silverdata = function(q) {
    loadCSS();
    if (!q) return;

    const start = () => {
        const n = parseInt(q.replace(/\D/g, ''));
        const cfg = findCfg(silverCfg, n);
        if (!cfg) return console.warn("Silver config not found for:", n);

        const tq = `select * limit 15 offset ${cfg.off || 0}`;
        const url = `https://docs.google.com/spreadsheets/d/${cfg.id}/gviz/tq?tqx=out:json&sheet=silvweb&tq=${encodeURIComponent(tq)}`;

        fetch(url)
            .then(r => r.text())
            .then(t => {
                const rows = parseGViz(t);
                if (!rows.length) return;

                // Wait for elements before rendering
                waitForEl('#silvr_pricet', () => renderSilver(rows));
            })
            .catch(e => {
                console.error('Silver Fetch Error:', e);
                delay(() => start(), 1000);
            });
    };

    if (!silverCfg) {
        fetch('https://api.mandibhavkhabar.com/data/gs/silver-groups.json')
            .then(r => r.json())
            .then(j => { silverCfg = j; start(); })
            .catch(e => { console.error('Silver Config Load Fail:', e); delay(() => Silverdata(q), 1000); });
    } else start();
};

/* ================= GOLD ================= */
window.golddata = function(q) {
    loadCSS();
    if (!q) return;

    const start = () => {
        const n = parseInt(q.replace(/\D/g, ''));
        const cfg = findCfg(goldCfg, n);
        if (!cfg) return console.warn("Gold config not found for:", n);

        const tq = `select * limit 15 offset ${cfg.off || 0}`;
        const url = `https://docs.google.com/spreadsheets/d/${cfg.id}/gviz/tq?tqx=out:json&sheet=goldweb&tq=${encodeURIComponent(tq)}`;

        fetch(url)
            .then(r => r.text())
            .then(t => {
                const rows = parseGViz(t);
                if (!rows.length) return;

                waitForEl('#g22kt', () => renderGold(rows));
            })
            .catch(e => { console.error('Gold Fetch Error:', e); delay(() => start(), 1000); });
    };

    if (!goldCfg) {
        fetch('https://api.mandibhavkhabar.com/data/gs/gold-groups.json')
            .then(r => r.json())
            .then(j => { goldCfg = j; start(); })
            .catch(e => { console.error('Gold Config Load Fail:', e); delay(() => golddata(q), 1000); });
    } else start();
};
