/* ================= UTILS ================= */
const once = fn => { let d; return (...a) => d || (d = fn(...a)) };
const has = s => document.querySelector(s);
const delay = (f, t = 300) => setTimeout(f, t);

/* ================= CSS LOADER ================= */
const loadCSS = once(() => {
    if (has('#mbk-rates-css')) return;
    const link = document.createElement('link');
    link.id = 'mbk-rates-css';
    link.rel = 'stylesheet';
    link.href = 'https://api.mandibhavkhabar.com/data/gs/core/rates-ui.css';
    link.onerror = () => console.warn('CSS load failed');
    document.head.appendChild(link);
});

/* ================= CHART LOADER ================= */
const loadChart = once(cb => {
    if (window.Chart) return cb();
    const s = document.createElement('script');
    s.src = "https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js";
    s.onload = cb;
    s.onerror = () => console.warn('Chart.js load failed');
    document.head.appendChild(s);
});

/* ================= GVIZ PARSER ================= */
function parseGViz(txt, limit = 15) {
    try {
        txt = String(txt || "")
            .replace(/^\s*\/\*O_o\*\/\s*/gi, "")
            .replace(/^google\.visualization\.Query\.setResponse\s*\(\s*/gi, "")
            .replace(/\)\s*;?\s*$/gi, "");
        
        const data = JSON.parse(txt);
        let rows = data.table?.rows || [];
        
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

/* ================= CONFIG FINDER ================= */
const findCfg = (m, n) => {
    if (!m) return null;
    for (const k in m) {
        const r = m[k].range;
        if (Array.isArray(r) && r.includes(n)) {
            return { 
                id: m[k].id, 
                off: r.indexOf(n)
            };
        }
    }
    return null;
};

// Global Config Variables
let silverCfg = null;
let goldCfg = null;

/* ================= SILVER LOGIC ================= */
window.Silverdata = function(q) {
    loadCSS(); // ✅ Auto CSS load
    
    if (!q || (!has('#silvr_pricet') && !has('#silvr_graf'))) return;

    const start = () => {
        const n = parseInt(q.replace(/\D/g, ''));
        const cfg = findCfg(silverCfg, n);
        if (!cfg) return console.warn("Silver config not found for:", n);

        const tq = `select * limit 15 offset ${cfg.off || 0}`;
        fetch(`https://docs.google.com/spreadsheets/d/${cfg.id}/gviz/tq?tqx=out:json&sheet=silvweb&tq=${encodeURIComponent(tq)}`)
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
            .catch(e => {
                console.error('Silver Config Load Fail:', e);
                delay(() => Silverdata(q), 1000);
            });
    } else start();
};

/* ================= GOLD LOGIC ================= */
window.golddata = function(q) {
    loadCSS(); // ✅ Auto CSS load
    
    if (!q || (!has('#g22kt') && !has('#gldgraf'))) return;

    const start = () => {
        const n = parseInt(q.replace(/\D/g, ''));
        const cfg = findCfg(goldCfg, n);
        if (!cfg) return console.warn("Gold config not found for:", n);

        const tq = `select * limit 15 offset ${cfg.off || 0}`;
        fetch(`https://docs.google.com/spreadsheets/d/${cfg.id}/gviz/tq?tqx=out:json&sheet=goldweb&tq=${encodeURIComponent(tq)}`)
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
            .catch(e => {
                console.error('Gold Config Load Fail:', e);
                delay(() => golddata(q), 1000);
            });
    } else start();
};

// ✅ Auto-preload configs + CSS
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        loadCSS(); // ✅ Early CSS load
        fetch('https://api.mandibhavkhabar.com/data/gs/silver-groups.json').then(r=>r.json()).then(j=>silverCfg=j);
        fetch('https://api.mandibhavkhabar.com/data/gs/gold-groups.json').then(r=>r.json()).then(j=>goldCfg=j);
    });
}
