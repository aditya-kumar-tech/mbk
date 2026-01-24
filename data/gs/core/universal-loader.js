/* ================= UTILS ================= */
const once = fn => { let d; return (...a) => d || (d = fn(...a)) };
const has = s => document.querySelector(s);
const delay = (f, t = 300) => setTimeout(f, t);

/* ================= CHART LOADER ================= */
const loadChart = once(cb => {
    if (window.Chart) return cb();
    const s = document.createElement('script');
    s.src = "https://cdn.jsdelivr.net/npm/chart.js";
    s.onload = cb;
    document.head.appendChild(s);
});

/* ================= GVIZ PARSER ================= */
function parseGViz(txt, limit = 15) {
    try {
        // Regex ko zyada flexible banaya gaya hai
        const jsonStr = txt.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\);/)[1];
        const rows = JSON.parse(jsonStr).table?.rows || [];
        rows.sort((a, b) => new Date(b.c[0]?.f || b.c[0]?.v) - new Date(a.c[0]?.f || a.c[0]?.v));
        return rows.slice(0, limit);
    } catch (e) {
        console.error('GViz Parse Error:', e);
        return [];
    }
}

const findCfg = (m, n) => {
    if (!m) return null;
    for (const k in m) {
        if (m[k].range?.includes(n)) return { id: m[k].id };
    }
    return null;
};

// Global Config Variables
let silverCfg = null;
let goldCfg = null;

/* ================= SILVER LOGIC ================= */
window.Silverdata = function(q) {
    if (!q || (!has('#silvr_pricet') && !has('#silvr_graf'))) return;

    const start = () => {
        const n = parseInt(q.replace(/\D/g, '')), cfg = findCfg(silverCfg, n);
        if (!cfg) return console.warn("Silver config matching range not found for:", n);

        fetch(`https://docs.google.com/spreadsheets/d/${cfg.id}/gviz/tq?tqx=out:json&sheet=silvweb&tq=select * limit 15`)
            .then(r => r.text())
            .then(t => {
                const rows = parseGViz(t);
                if (rows.length) renderSilver(rows);
            }).catch(e => console.error('Silver Fetch Error:', e));
    };

    if (!silverCfg) {
        fetch('https://api.mandibhavkhabar.com/data/gs/silver-groups.json')
            .then(r => r.json())
            .then(j => { silverCfg = j; start(); })
            .catch(e => console.error('Silver Config Load Fail:', e));
    } else start();
};

/* ================= GOLD LOGIC ================= */
window.golddata = function(q) {
    if (!q || (!has('#g22kt') && !has('#gldgraf'))) return;

    const start = () => {
        const n = parseInt(q.replace(/\D/g, '')), cfg = findCfg(goldCfg, n);
        if (!cfg) return console.warn("Gold config matching range not found for:", n);

        fetch(`https://docs.google.com/spreadsheets/d/${cfg.id}/gviz/tq?tqx=out:json&sheet=goldweb&tq=select * limit 15`)
            .then(r => r.text())
            .then(t => {
                const rows = parseGViz(t);
                if (rows.length) renderGold(rows);
            }).catch(e => console.error('Gold Fetch Error:', e));
    };

    if (!goldCfg) {
        fetch('https://api.mandibhavkhabar.com/data/gs/gold-groups.json')
            .then(r => r.json())
            .then(j => { goldCfg = j; start(); })
            .catch(e => console.error('Gold Config Load Fail:', e));
    } else start();
};

// Helper aur Render functions same rahenge (unhe yahan paste karein)
