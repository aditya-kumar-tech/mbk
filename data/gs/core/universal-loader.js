/* ================= GVIZ PARSER (FIXED) ================= */
function parseGViz(txt, limit = 15) {
    try {
        if (!txt) return [];
        // Google Sheets JSON response ko clean karne ka behtar tarika
        const startIdx = txt.indexOf('{');
        const endIdx = txt.lastIndexOf('}') + 1;
        if (startIdx === -1 || endIdx === -1) throw new Error("Invalid JSON format");
        
        const jsonStr = txt.substring(startIdx, endIdx);
        const data = JSON.parse(jsonStr);
        let rows = data.table?.rows || [];
        
        // Sorting and cleaning
        rows.sort((a, b) => {
            const da = new Date(a.c[0]?.f || a.c[0]?.v || 0);
            const db = new Date(b.c[0]?.f || b.c[0]?.v || 0);
            return db - da;
        });
        
        return rows.slice(0, limit);
    } catch (e) {
        console.error('GViz Parse Error (Detailed):', e.message);
        return [];
    }
}

/* ================= UTILS & LOADERS ================= */
const once = fn => { let d; return (...a) => d || (d = fn(...a)) };
const has = s => document.querySelector(s);
const delay = (f, t = 300) => setTimeout(f, t);

const loadCSS = once(() => {
    if (has('#mbk-rates-css')) return;
    const link = document.createElement('link');
    link.id = 'mbk-rates-css';
    link.rel = 'stylesheet';
    link.href = 'https://api.mandibhavkhabar.com/data/gs/core/rates-ui.css';
    document.head.appendChild(link);
});

/* ================= SHARED DATA HANDLER ================= */
// Yeh function fetch aur retry handle karega
async function fetchSheetData(cfg, sheetName, limit) {
    const tq = encodeURIComponent(`select * limit ${limit}`);
    const url = `https://docs.google.com/spreadsheets/d/${cfg.id}/gviz/tq?tqx=out:json&sheet=${sheetName}&tq=${tq}`;
    
    try {
        const response = await fetch(url);
        const text = await response.text();
        return parseGViz(text, limit);
    } catch (err) {
        console.error(`Fetch error for ${sheetName}:`, err);
        return [];
    }
}

/* ================= CONFIG FINDER ================= */
const findCfg = (m, n) => {
    if (!m) return null;
    for (const k in m) {
        const r = m[k].range;
        if (Array.isArray(r) && r.includes(n)) return { id: m[k].id };
    }
    return null;
};

let silverCfg = null, goldCfg = null;

/* ================= SILVER LOGIC ================= */
window.Silverdata = async function(q) {
    loadCSS();
    if (!q || (!has('#silvr_pricet') && !has('#silvr_graf'))) return;

    const n = parseInt(q.replace(/\D/g, ''));
    
    if (!silverCfg) {
        try {
            const res = await fetch('https://api.mandibhavkhabar.com/data/gs/silver-groups.json');
            silverCfg = await res.json();
        } catch(e) { return delay(() => window.Silverdata(q), 1000); }
    }

    const cfg = findCfg(silverCfg, n);
    if (cfg) {
        const rows = await fetchSheetData(cfg, 'silvweb', 15);
        if (rows.length && typeof renderSilver === 'function') renderSilver(rows);
    }
};

/* ================= GOLD LOGIC ================= */
window.golddata = async function(q) {
    loadCSS();
    if (!q || (!has('#g22kt') && !has('#gldgraf'))) return;

    const n = parseInt(q.replace(/\D/g, ''));
    
    if (!goldCfg) {
        try {
            const res = await fetch('https://api.mandibhavkhabar.com/data/gs/gold-groups.json');
            goldCfg = await res.json();
        } catch(e) { return delay(() => window.golddata(q), 1000); }
    }

    const cfg = findCfg(goldCfg, n);
    if (cfg) {
        const rows = await fetchSheetData(cfg, 'goldweb', 15);
        if (rows.length && typeof renderGold === 'function') renderGold(rows);
    }
};
