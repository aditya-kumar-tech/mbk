// mbk/data/gs/core/gold-rates/gold.js
window.golddata = function(gctqury, mtype) {
    const num = parseInt(gctqury.replace('gct', ''));
    
    // PERFECT RANGE MATCHING
    for (let key in window.gsConfig) {
        let group = window.gsConfig[key];
        if (num >= group.range[0] && num <= group.range[1]) {
            const url = `https://docs.google.com/spreadsheets/d/${group.id}/gviz/tq?tqx=out:json&sheet=goldweb&tq=select * limit 15`;
            
            document.getElementById("sctitle")?.setAttribute('data-state', group.state);
            
            fetch(url)
                .then(r => r.text())
                .then(data => {
                    try {
                        const json = JSON.parse(data.substr(47).slice(0, -2));
                        const rows = json.table.rows;
                        
                        // 1. मुख्य Prices (22K/24K)
                        document.getElementById("g22kt").innerHTML = `₹${rows[0].c[1].v.toFixed(2)}`;
                        document.getElementById("g24kt").innerHTML = `₹${rows[0].c[2].v.toFixed(2)}`;
                        document.getElementById("udat").textContent = new Date().toLocaleDateString("hi-IN");
                        
                        // 2. COMPLETE FEATURES
                        GoldTable22(rows);    // 22K Table
                        GoldTable24(rows);    // 24K Table
                        GoldChart(rows);      // Graph
                        GramTable(rows);      // Gram Table
                        
                    } catch (e) {
                        console.log("Gold data error:", e);
                    }
                });
            return;
        }
    }
};

// ========== COMPLETE FEATURES ==========

function GoldTable22(rows) {
    let html = '<table style="width:100%;border-collapse:collapse;font-size:12px;"><tr style="background:#f5f5f5;font-weight:bold;"><th>तारीख</th><th>22K (1g)</th></tr>';
    rows.slice(0, 10).forEach(row => {
        html += `<tr><td>${row.c[0]?.f || '-'}</td><td>₹${row.c[1]?.f || '-'}</td></tr>`;
    });
    document.getElementById("gramtbl22").innerHTML = html + '</table>';
}

function GoldTable24(rows) {
    let html = '<table style="width:100%;border-collapse:collapse;font-size:12px;"><tr style="background:#f5f5f5;font-weight:bold;"><th>तारीख</th><th>24K (1g)</th></tr>';
    rows.slice(0, 10).forEach(row => {
        html += `<tr><td>${row.c[0]?.f || '-'}</td><td>₹${row.c[2]?.f || '-'}</td></tr>`;
    });
    document.getElementById("gramtbl24").innerHTML = html + '</table>';
}

function GoldChart(rows) {
    if (typeof Plotly !== 'undefined') {
        const dates = rows.map(r => r.c[0]?.f).slice(0, 15);
        const prices22 = rows.map(r => parseFloat(r.c[1]?.f || 0)).slice(0, 15);
        const prices24 = rows.map(r => parseFloat(r.c[2]?.f || 0)).slice(0, 15);
        
        Plotly.newPlot("gldgraf", [
            {
                x: dates,
                y: prices22,
                name: "22K",
                line: { color: "gold", width: 3 }
            },
            {
                x: dates,
                y: prices24,
                name: "24K", 
                line: { color: "orange", width: 3 }
            }
        ], {
            title: "22K vs 24K Gold Trend",
            font: { family: "Arial, sans-serif" },
            margin: { t: 30, r: 20, b: 50, l: 50 }
        });
    }
}

function GramTable(rows) {
    const today22 = rows[0].c[1].v;
    const today24 = rows[0].c[2].v;
    
    const gramPrices22 = [1, 2, 5, 8, 10].map(g => (g * today22).toFixed(2));
    const gramPrices24 = [1, 2, 5, 8, 10].map(g => (g * today24).toFixed(2));
    
    let html = '<table style="width:100%;border-collapse:collapse;font-size:12px;"><tr style="background:#f5f5f5;font-weight:bold;"><th>Gram</th><th>22K</th><th>24K</th></tr>';
    [1, 2, 5, 8, 10].forEach((g, i) => {
        html += `<tr><td>${g}g</td><td>₹${gramPrices22[i]}</td><td>₹${gramPrices24[i]}</td></tr>`;
    });
    document.getElementById("data_table1").innerHTML = html + '</table>';
}
