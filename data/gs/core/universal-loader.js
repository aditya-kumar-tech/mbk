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
        updateGraphAfterData();
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

        const offsetVal = 0; // Always 0 for Gold
        const url = `https://docs.google.com/spreadsheets/d/${cfg.id}/gviz/tq?tqx=out:json&sheet=goldweb&tq=select * limit 15${offsetVal ? ` offset ${offsetVal}` : ''}`;

        fetch(url)
            .then(r => r.text())
            .then(t => {
                const rows = parseGViz(t);
                if (!rows.length) {
                    console.warn("Gold rows empty, retrying...");
                    setTimeout(runGold, 1200);
                    return;
                }

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

        updateGraphAfterData();
    }

    fetch('https://aditya-kumar-tech.github.io/mbk/data/gs/gold-groups.json')
        .then(r => r.json())
        .then(j => {
            goldConfig = j;
            runGold();
        });

    /* ========================= GRAPH ========================= */
    let chartInstance = null;

    function renderChart() {
        const ctx = document.getElementById("goldSilverChart").getContext("2d");

        const labels = GOLD_HIST_22.map((r, i) => r.c[0]?.v || `Day ${i+1}`).reverse();
        const data22k = GOLD_HIST_22.map(r => r.c[1]?.v || 0).reverse();
        const data24k = GOLD_HIST_24.map(r => r.c[3]?.v || 0).reverse();
        const dataSilver = SILVER_HIST.map(r => r.c[2]?.v || 0).reverse();

        if (chartInstance) chartInstance.destroy();

        chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    { label: 'Gold 22K ₹', data: data22k, borderColor: 'gold', backgroundColor: 'rgba(255,215,0,0.2)', tension: 0.3 },
                    { label: 'Gold 24K ₹', data: data24k, borderColor: 'orange', backgroundColor: 'rgba(255,165,0,0.2)', tension: 0.3 },
                    { label: 'Silver ₹', data: dataSilver, borderColor: 'silver', backgroundColor: 'rgba(192,192,192,0.2)', tension: 0.3 },
                ]
            },
            options: {
                responsive: true,
                plugins: { legend: { position: 'top' }, tooltip: { mode: 'index', intersect: false } },
                scales: { y: { beginAtZero: false } }
            }
        });
    }

    function updateGraphAfterData() {
        renderChart();
    }

    /* ========================= DISCLAIMER ========================= */
    document.getElementById("disclamergold").textContent =
        "Disclaimer: The gold/silver rates are sourced from local jewellers and other sources. mandibhavkhabar.com has made every effort to ensure accuracy of information provided; however, we do not guarantee such accuracy. The rates are for informational purposes only. It is not a solicitation to buy, sell in precious gold/silver. mandibhavkhabar.com does not accept culpability for losses and/or damages arising based on gold/silver information provided.";

})();
