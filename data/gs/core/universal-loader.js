/* ================= UTILS ================= */
const once = fn => { let d; return (...a) => d || (d = fn(...a)) };
const has = s => document.querySelector(s);
const delay = (f, t = 300) => setTimeout(f, t);

/* ================= CHART LOADER ================= */
const loadChart = once(cb => {
    if (window.Chart) return cb();
    const s = document.createElement('script');
    s.src = "https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"; // ✅ version pin
    s.onload = cb;
    s.onerror = () => console.warn('Chart.js load failed'); // ✅ error handling
    document.head.appendChild(s);
});

/* ================= GVIZ PARSER (FIXED) ================= */
function parseGViz(txt, limit = 15) {
    try {
        // ✅ Robust regex - handles all variations
        txt = String(txt || "")
            .replace(/^\s*\/\*O_o\*\/\s*/gi, "")
            .replace(/^google\.visualization\.Query\.setResponse\s*\(\s*/gi, "")
            .replace(/\)\s*;?\s*$/gi, "");
        
        const data = JSON.parse(txt);
        let rows = data.table?.rows || [];
        
        // ✅ Safe date sorting (recent first)
        rows.sort((a, b) => {
            const da = new Date(a.c[0]?.f || a.c[0]?.v || 0);
            const db = new Date(b.c[0]?.f || b.c[0]?.v || 0);
            return db - da;
        });
        
        return rows.slice(0, limit);
    } catch (e) {
        console.error('GViz Parse Error:', e);
        return [];
    }
}

/* ================= CONFIG FINDER (FIXED for range list) ================= */
const findCfg = (m, n) => {
    if (!m) return null;
    for (const k in m) {
        const r = m[k].range;
        if (Array.isArray(r) && r.includes(n)) {  // ✅ Exact match in range list
            return { 
                id: m[k].id, 
                off: r.indexOf(n)  // ✅ Offset for precise row selection
            };
        }
    }
    return null;
};

// Global Config Variables
let silverCfg = null;
let goldCfg = null;

/* ================= SILVER LOGIC (FIXED) ================= */
window.Silverdata = function(q) {
    if (!q || (!has('#silvr_pricet') && !has('#silvr_graf'))) return;

    const start = () => {
        const n = parseInt(q.replace(/\D/g, ''));
        const cfg = findCfg(silverCfg, n);
        if (!cfg) return console.warn("Silver config not found for:", n);

        // ✅ Use offset for precise data
        const tq = `select * limit 15 offset ${cfg.off || 0}`;
        fetch(`https://docs.google.com/spreadsheets/d/${cfg.id}/gviz/tq?tqx=out:json&sheet=silvweb&tq=${encodeURIComponent(tq)}`)
            .then(r => r.text())
            .then(t => {
                const rows = parseGViz(t);
                if (rows.length) renderSilver(rows);
            }).catch(e => console.error('Silver Fetch Error:', e));
    };

    if (!silverCfg) {
        // ✅ Fallback to GitHub if API fails
        fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/silver-groups.json')
            .then(r => r.json())
            .then(j => { silverCfg = j; start(); })
            .catch(e => {
                console.error('Silver Config Load Fail:', e);
                // Retry after delay
                delay(() => Silverdata(q), 1000);
            });
    } else start();
};

/* ================= GOLD LOGIC (FIXED) ================= */
window.golddata = function(q) {
    if (!q || (!has('#g22kt') && !has('#gldgraf'))) return;

    const start = () => {
        const n = parseInt(q.replace(/\D/g, ''));
        const cfg = findCfg(goldCfg, n);
        if (!cfg) return console.warn("Gold config not found for:", n);

        // ✅ Use offset for precise data
        const tq = `select * limit 15 offset ${cfg.off || 0}`;
        fetch(`https://docs.google.com/spreadsheets/d/${cfg.id}/gviz/tq?tqx=out:json&sheet=goldweb&tq=${encodeURIComponent(tq)}`)
            .then(r => r.text())
            .then(t => {
                const rows = parseGViz(t);
                if (rows.length) renderGold(rows);
            }).catch(e => console.error('Gold Fetch Error:', e));
    };

    if (!goldCfg) {
        // ✅ Fallback to GitHub if API fails
        fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/gold-groups.json')
            .then(r => r.json())
            .then(j => { goldCfg = j; start(); })
            .catch(e => {
                console.error('Gold Config Load Fail:', e);
                // Retry after delay
                delay(() => golddata(q), 1000);
            });
    } else start();
};

// ✅ Auto-preload configs on load (optional speedup)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/silver-groups.json').then(r=>r.json()).then(j=>silverCfg=j);
        fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/gold-groups.json').then(r=>r.json()).then(j=>goldCfg=j);
    });
}
