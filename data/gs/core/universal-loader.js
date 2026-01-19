(function () {
  console.log("🚀 Universal Loader v8.4 – FIXED for range[] list (Gold & Silver)");

  const RUPEE = "₹";
  const MAX_RETRY = 4;
  const LIMIT = 15;

  const charts = { silver: null, gold: null };
  let silverCfg = null, goldCfg = null;

  function rs(v) {
    return RUPEE + Number(v || 0).toLocaleString("hi-IN");
  }

  /* ================= Chart.js loader (safe) ================= */
  function loadChartJS(cb) {
    if (window.Chart) return cb();
    if (document.getElementById("chartjs_cdn")) {
      const t = setInterval(() => {
        if (window.Chart) { clearInterval(t); cb(); }
      }, 80);
      return;
    }
    const s = document.createElement("script");
    s.id = "chartjs_cdn";
    s.src = "https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js";
    s.onload = cb;
    s.onerror = () => console.warn("⚠️ Chart.js blocked/failed (Blogger CSP?)");
    document.head.appendChild(s);
  }

  /* ================= GViz parser (robust) ================= */
  function parseGViz(txt) {
    try {
      txt = String(txt || "")
        .replace(/^\s*\/\*O_o\*\/\s*/i, "")
        .replace(/^[\s\S]*google\.visualization\.Query\.setResponse\s*\(/i, "")
        .replace(/\)\s*;?\s*$/i, "");
      return JSON.parse(txt)?.table?.rows || [];
    } catch (e) {
      console.error("❌ GViz parse failed", e);
      return [];
    }
  }

  /* ================= findCfg for range LIST ================= */
  function findCfgList(map, num) {
    for (const k in map) {
      const rec = map[k];
      const r = rec?.range;
      if (Array.isArray(r) && r.length) {
        const idx = r.indexOf(num);
        if (idx !== -1) return { id: rec.id, off: idx };
      }
    }
    return null;
  }

  /* ================= configs load ================= */
  const silverCfgP = fetch("https://aditya-kumar-tech.github.io/mbk/data/gs/silver-groups.json")
    .then(r => r.json())
    .then(j => { silverCfg = j; console.log("✅ Silver config loaded"); })
    .catch(e => console.error("❌ Silver config load fail", e));

  const goldCfgP = fetch("https://aditya-kumar-tech.github.io/mbk/data/gs/gold-groups.json")
    .then(r => r.json())
    .then(j => { goldCfg = j; console.log("✅ Gold config loaded"); })
    .catch(e => console.error("❌ Gold config load fail", e));

  /* ================= SILVER ================= */
  window.Silverdata = function (q) { runSilver(q, 0); };

  function runSilver(q, retry) {
    if (!silverCfg) return silverCfgP.finally(() => setTimeout(() => runSilver(q, retry), 200));

    const num = Number(String(q).replace(/\D/g, ""));
    const cfg = findCfgList(silverCfg, num);
    if (!cfg) return console.warn("❌ Silver cfg not found for", q);

    const url =
      `https://docs.google.com/spreadsheets/d/${cfg.id}/gviz/tq` +
      `?tqx=out:json&sheet=silvweb&tq=${encodeURIComponent(`select * limit ${LIMIT} offset ${cfg.off}`)}`;

    fetch(url)
      .then(r => r.text())
      .then(t => renderSilver(parseGViz(t)))
      .catch(err => {
        console.warn("Silver fetch fail", err);
        if (retry < MAX_RETRY) setTimeout(() => runSilver(q, retry + 1), 900 + retry * 300);
      });
  }

  function renderSilver(rows) {
    if (!rows.length) return;

    const priceKg = rows[0]?.c?.[2]?.v || 0;

    document.getElementById("silvr_pricet")?.replaceChildren(document.createTextNode(rs(priceKg)));
    document.getElementById("udat")?.replaceChildren(document.createTextNode(new Date().toLocaleDateString("hi-IN")));

    const graf = document.getElementById("silvr_graf");
    if (graf) {
      loadChartJS(() => {
        if (!window.Chart) return;

        graf.innerHTML = '<div style="height:380px"><canvas id="silverChart"></canvas></div>';
        const canvas = document.getElementById("silverChart");
        if (!canvas) return;

        if (charts.silver) { try { charts.silver.destroy(); } catch {} charts.silver = null; } // [web:230]

        charts.silver = new Chart(canvas.getContext("2d"), {
          type: "line",
          data: {
            labels: rows.map(r => r.c?.[0]?.f || r.c?.[0]?.v || ""),
            datasets: [{
              label: "Silver (1kg)",
              data: rows.map(r => Number(r.c?.[2]?.v || 0)),
              borderColor: "#9ca3af",
              backgroundColor: "rgba(156,163,175,0.15)",
              tension: 0.35,
              fill: true,
              pointRadius: 2
            }]
          },
          options: { responsive: true, maintainAspectRatio: false }
        });
      });
    }
  }

  /* ================= GOLD ================= */
  window.golddata = function (q) { runGold(q, 0); };

  function runGold(q, retry) {
    if (!goldCfg) return goldCfgP.finally(() => setTimeout(() => runGold(q, retry), 200));

    const num = Number(String(q).replace(/\D/g, ""));
    const cfg = findCfgList(goldCfg, num);
    if (!cfg) return console.warn("❌ Gold cfg not found for", q);

    const url =
      `https://docs.google.com/spreadsheets/d/${cfg.id}/gviz/tq` +
      `?tqx=out:json&sheet=goldweb&tq=${encodeURIComponent(`select * limit ${LIMIT} offset ${cfg.off}`)}`;

    fetch(url)
      .then(r => r.text())
      .then(t => renderGold(parseGViz(t)))
      .catch(err => {
        console.warn("Gold fetch fail", err);
        if (retry < MAX_RETRY) setTimeout(() => runGold(q, retry + 1), 900 + retry * 300);
      });
  }

  function renderGold(rows) {
    if (!rows.length) return;

    const p22 = rows[0]?.c?.[1]?.v || 0;
    const p24 = rows[0]?.c?.[3]?.v || 0;

    document.getElementById("g22kt")?.replaceChildren(document.createTextNode(rs(p22)));
    document.getElementById("g24kt")?.replaceChildren(document.createTextNode(rs(p24)));
    document.getElementById("udat")?.replaceChildren(document.createTextNode(new Date().toLocaleDateString("hi-IN")));

    const graf = document.getElementById("gldgraf");
    if (graf) {
      loadChartJS(() => {
        if (!window.Chart) return;

        graf.innerHTML = '<div style="height:380px"><canvas id="goldChart"></canvas></div>';
        const canvas = document.getElementById("goldChart");
        if (!canvas) return;

        if (charts.gold) { try { charts.gold.destroy(); } catch {} charts.gold = null; } // [web:230]

        charts.gold = new Chart(canvas.getContext("2d"), {
          type: "line",
          data: {
            labels: rows.map(r => r.c?.[0]?.f || r.c?.[0]?.v || ""),
            datasets: [
              {
                label: "22K",
                data: rows.map(r => Number(r.c?.[1]?.v || 0)),
                borderColor: "#f59e0b",
                backgroundColor: "rgba(245,158,11,0.15)",
                tension: 0.35,
                fill: true,
                pointRadius: 2
              },
              {
                label: "24K",
                data: rows.map(r => Number(r.c?.[3]?.v || 0)),
                borderColor: "#a855f7",
                backgroundColor: "rgba(168,85,247,0.12)",
                tension: 0.35,
                fill: true,
                pointRadius: 2
              }
            ]
          },
          options: { responsive: true, maintainAspectRatio: false }
        });
      });
    }
  }
})();
