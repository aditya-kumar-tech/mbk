// mbk/data/gs/core/silver-rates/silver.js
window.Silverdata = function(sctqury, mtype) {
    const num = parseInt(sctqury.replace('sct', ''));
    
    // PERFECT RANGE MATCHING
    for (let key in window.gsConfig) {
        let group = window.gsConfig[key];
        if (num >= group.range[0] && num <= group.range[1]) {
            const url = `https://docs.google.com/spreadsheets/d/${group.id}/gviz/tq?tqx=out:json&sheet=silvweb&tq=select * limit 15`;
            
            fetch(url)
                .then(r => r.text())
                .then(data => {
                    try {
                        const json = JSON.parse(data.substr(47).slice(0, -2));
                        const rows = json.table.rows;
                        const today10g = rows[0].c[1].v;
                        
                        // 1. मुख्य Silver Price (100g)
                        document.getElementById("silvr_pricet").innerHTML = `₹${(today10g * 100).toFixed(0)}`;
                        document.getElementById("sctitle").innerHTML = `${group.state} Silver | ${group.state} चाँदी का भाव`;
                        document.getElementById("udat").textContent = new Date().toLocaleDateString("hi-IN");
                        
                        // 2. COMPLETE FEATURES
                        SilverTable(rows);        // Price Table
                        SilverChart(rows);        // Graph  
                        SilverGramTable(rows);    // Gram Table
                        
                    } catch (e) {
                        console.log("Silver data error:", e);
                    }
                });
            return;
        }
    }
};

// ========== COMPLETE FEATURES ==========

function SilverTable(rows) {
    let html = '<table style="width:100%;border-collapse:collapse;font-size:12px;"><tr style="background:#f5f5f5;font-weight:bold;"><th>तारीख</th><th>चाँदी (10g)</th></tr>';
    rows.slice(0, 10).forEach(row => {
        html += `<tr><td>${row.c[0]?.f || '-'}</td><td>₹${(row.c[1]?.v * 100 || 0).toFixed(0)}</td></tr>`;
    });
    document.getElementById("silvr_gramtbl").innerHTML = html + '</table>';
}

function SilverChart(rows) {
    if (typeof Plotly !== 'undefined') {
        const dates = rows.map(r => r.c[0]?.f).slice(0, 15);
        const prices10g = rows.map(r => (r.c[1]?.v * 100 || 0)).slice(0, 15);
        
        Plotly.newPlot("silvr_graf", [
            {
                x: dates,
                y: prices10g,
                name: "Silver (100g)",
                line: { color: "#c0c0c0", width: 3 },
                type: 'scatter'
            }
        ], {
            title: "Silver Price Trend (100g)",
            font: { family: "Arial, sans-serif" },
            margin: { t: 30, r: 20, b: 50, l: 50 }
        });
    }
}

function SilverGramTable(rows) {
    const today10g = rows[0].c[1].v;
    const gramPrices = [1, 10, 50, 100, 500, 1000].map(g => ((g / 10) * today10g * 100).toFixed(0));
    
    let html = '<table style="width:100%;border-collapse:collapse;font-size:12px;"><tr style="background:#f5f5f5;font-weight:bold;"><th>Gram</th><th>मूल्य</th></tr>';
    const grams = [1, 10, 50, 100, 500, 1000];
    grams.forEach((g, i) => {
        html += `<tr><td>${g}g</td><td>₹${gramPrices[i]}</td></tr>`;
    });
    document.getElementById("data_table1").innerHTML = html + '</table>';
}
