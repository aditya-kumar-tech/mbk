(function () {
  console.log("🚀 Universal Loader v8.5 – AUTO-DETECT + ZERO PAGE EDITS");

  const RUPEE = "₹";
  const MAX_RETRY = 4;
  const LIMIT = 15;
  let silverCfg = null, goldCfg = null;
  const charts = { silver: null, gold: null };
  let autoTriggerDelay = 0; // auto increase if fails

  function rs(v) { return RUPEE + Number(v || 0).toLocaleString("hi-IN"); }

  // 🔥 AUTO-TRIGGER SYSTEM (detects page calls automatically)
  function autoTrigger() {
    const silverCall = document.querySelector('[onclick*="Silverdata"], script:not([src])');
    const goldCall = document.querySelector('[onclick*="golddata"], script:not([src])');
    
    if (silverCall) {
      const match = silverCall.textContent.match(/Silverdata\(["']?([a-z0-9]+)["']?/i);
      if (match) {
        console.log("🔍 Auto-detected Silver:", match[1]);
        setTimeout(() => window.Silverdata(match[1]), autoTriggerDelay * 100);
      }
    }
    
    if (goldCall) {
      const match = goldCall.textContent.match(/golddata\(["']?([a-z0-9]+)["']?/i);
      if (match) {
        console.log("🔍 Auto-detected Gold:", match[1]);
        setTimeout(() => window.golddata(match[1]), autoTriggerDelay * 100);
      }
    }
  }

  /* ================= CHART LOADER ================= */
  function loadChartJS(cb) {
    if (window.Chart) return cb();
    if (document.getElementById("chartjs_cdn")) return setTimeout(cb, 100);
    
    const s = document.createElement("script");
    s.id = "chartjs_cdn";
    s.src = "https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js";
    s.onload = cb;
    document.head.appendChild(s);
  }

  /* ================= GVIZ + RANGE LIST ================= */
  function parseGViz(txt) {
    try {
      txt = String(txt)
        .replace(/^\s*\/\*O_o\*\/\s*/gi, "")
        .replace(/^google\.visualization\.Query\.setResponse\s*\(\s*/gi, "")
        .replace(/\)\s*;?\s*$/gi, "");
      return JSON.parse(txt)?.table?.rows || [];
    } catch (e) { console.error("❌ GViz fail"); return []; }
  }

  function findCfgList(map, num) {
    for (const k in map) {
      const r = map[k]?.range;
      if (Array.isArray(r)) {
        const idx = r.indexOf(num);
        if (idx !== -1) return { id: map[k].id, off: idx };
      }
    }
    return null;
  }

  /* ================= CONFIGS ================= */
  Promise.all([
    fetch("https://aditya-kumar-tech.github.io/mbk/data/gs/silver-groups.json").then(r=>r.json()),
    fetch("https://aditya-kumar-tech.github.io/mbk/data/gs/gold-groups.json").then(r=>r.json())
  ]).then(([silver, gold]) => {
    silverCfg = silver; goldCfg = gold;
    console.log("✅ Configs loaded - Auto-triggering...");
    autoTriggerDelay = 1; // first try immediate
    autoTrigger();
  }).catch(() => {
    setTimeout(() => {
      autoTriggerDelay = 3; // retry after 300ms
      autoTrigger();
    }, 500);
  });

  /* ================= SILVER ================= */
  window.Silverdata = function(q) {
    console.log("📥 Silverdata called:", q);
    runSilver(q, 0);
  };

  function runSilver(q, retry) {
    if (!silverCfg) return setTimeout(() => runSilver(q, retry), 250);
    
    const num = Number(String(q).replace(/\D/g, ""));
    const cfg = findCfgList(silverCfg, num);
    if (!cfg) return console.warn("❌ Silver config missing:", q);

    const url = `https://docs.google.com/spreadsheets/d/${cfg.id}/gviz/tq?tqx=out:json&sheet=silvweb&tq=${encodeURIComponent(`select * limit ${LIMIT} offset ${cfg.off}`)}`;

    fetch(url)
      .then(r => r.text())
      .then(t => {
        const rows = parseGViz(t);
        if (rows.length) renderSilver(rows);
        else retrySilver(q, retry);
      })
      .catch(e => retrySilver(q, retry));
  }

  function retrySilver(q, retry) {
    if (retry < MAX_RETRY) {
      console.log(`🔄 Silver retry ${retry + 1}/${MAX_RETRY}`);
      setTimeout(() => runSilver(q, retry + 1), 600 + retry * 400);
    }
  }

  function renderSilver(rows) {
    const priceKg = rows[0]?.c?.[2]?.v || 0;
    
    document.getElementById("silvr_pricet")?.textContent = rs(priceKg);
    document.getElementById("udat")&&(document.getElementById("udat").textContent = new Date().toLocaleDateString("hi-IN"));

    // Gram table (your existing HTML)
    const gramTbl = document.getElementById("silvr_gramtbl");
    if (gramTbl && priceKg) {
      const price10g = priceKg / 100;
      let html = '<table style="width:100%;border-collapse:collapse;">';
      [1,10,50,100,500,1000].forEach(g => {
        const price = Math.round((g/10) * price10g);
        html += `<tr style="border-bottom:1px solid #eee;"><td style="padding:8px;">${g}g</td><td style="text-align:right;padding:8px;">₹${price.toLocaleString()}</td></tr>`;
      });
      gramTbl.innerHTML = html + '</table>';
    }

    // History table
    const histTbl = document.getElementById("data_table1");
    if (histTbl && rows.length) {
      let html = '<table style="width:100%;border-collapse:collapse;">';
      html += '<tr style="background:#e6f3ff;"><th style="padding:12px;">तारीख</th><th>1kg भाव</th></tr>';
      rows.slice(0,15).forEach(row => {
        const date = row.c[0]?.f || '';
        const price = parseInt(row.c[2]?.v || 0);
        html += `<tr style="border-bottom:1px solid #eee;"><td style="padding:10px;">${date}</td><td style="padding:10px;text-align:right;">₹${price.toLocaleString()}</td></tr>`;
      });
      histTbl.innerHTML = html + '</table>';
    }

    // Chart
    const graf = document.getElementById("silvr_graf");
    if (graf && rows.length > 3) {
      loadChartJS(() => {
        graf.innerHTML = '<canvas id="silverChart" style="height:380px;width:100%;"></canvas>';
        const canvas = document.getElementById("silverChart");
        if (charts.silver) charts.silver.destroy();
        charts.silver = new Chart(canvas.getContext("2d"), {
          type: "line",
          data: {
            labels: rows.map(r => r.c?.[0]?.f || ""),
            datasets: [{label: "चाँदी 1kg", data: rows.map(r => Number(r.c?.[2]?.v || 0)), 
              borderColor: "#c0c0c0", backgroundColor: "rgba(192,192,192,0.2)", tension: 0.4, fill: true}]
          },
          options: {responsive: true, maintainAspectRatio: false}
        });
      });
    }
  }

  /* ================= GOLD (similar pattern) ================= */
  window.golddata = function(q) {
    console.log("📥 golddata called:", q);
    runGold(q, 0);
  };

  function runGold(q, retry) {
    if (!goldCfg) return setTimeout(() => runGold(q, retry), 250);
    
    const num = Number(String(q).replace(/\D/g, ""));
    const cfg = findCfgList(goldCfg, num);
    if (!cfg) return console.warn("❌ Gold config missing:", q);

    const url = `https://docs.google.com/spreadsheets/d/${cfg.id}/gviz/tq?tqx=out:json&sheet=goldweb&tq=${encodeURIComponent(`select * limit ${LIMIT} offset ${cfg.off}`)}`;

    fetch(url)
      .then(r => r.text())
      .then(t => {
        const rows = parseGViz(t);
        if (rows.length) renderGold(rows);
        else retryGold(q, retry);
      })
      .catch(e => retryGold(q, retry));
  }

  function retryGold(q, retry) {
    if (retry < MAX_RETRY) {
      console.log(`🔄 Gold retry ${retry + 1}/${MAX_RETRY}`);
      setTimeout(() => runGold(q, retry + 1), 600 + retry * 400);
    }
  }

  function renderGold(rows) {
    const p22 = rows[0]?.c?.[1]?.v || 0;
    const p24 = rows[0]?.c?.[3]?.v || 0;
    
    document.getElementById("g22kt")&&(document.getElementById("g22kt").textContent = rs(p22));
    document.getElementById("g24kt")&&(document.getElementById("g24kt").textContent = rs(p24));
    document.getElementById("udat")&&(document.getElementById("udat").textContent = new Date().toLocaleDateString("hi-IN"));

    // Charts + tables (your existing pattern)
    const graf = document.getElementById("gldgraf");
    if (graf && rows.length > 3) {
      loadChartJS(() => {
        graf.innerHTML = '<canvas id="goldChart" style="height:380px;width:100%;"></canvas>';
        const canvas = document.getElementById("goldChart");
        if (charts.gold) charts.gold.destroy();
        charts.gold = new Chart(canvas.getContext("2d"), {
          type: "line",
          data: {
            labels: rows.map(r => r.c?.[0]?.f || ""),
            datasets: [
              {label: "22K", data: rows.map(r => Number(r.c?.[1]?.v || 0)), borderColor: "#f59e0b", backgroundColor: "rgba(245,158,11,0.15)", tension: 0.4, fill: true},
              {label: "24K", data: rows.map(r => Number(r.c?.[3]?.v || 0)), borderColor: "#a855f7", backgroundColor: "rgba(168,85,247,0.12)", tension: 0.4, fill: true}
            ]
          },
          options: {responsive: true, maintainAspectRatio: false}
        });
      });
    }
  }

  // 🔥 OBSERVER - detect late page calls
  setInterval(autoTrigger, 1500);
})();
