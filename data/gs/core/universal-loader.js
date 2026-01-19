(function () {
  console.log("🚀 Universal Loader v8.2 FINAL – Gold & Silver");

  /* ================= BASIC ================= */
  const RUPEE = "₹";
  const MAX_RETRY = 3;

  function rs(v) {
    return RUPEE + Number(v || 0).toLocaleString("hi-IN");
  }

  /* ================= CHART AUTO LOAD ================= */
  function loadChartJS(cb) {
    if (window.Chart) return cb();
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/chart.js";
    s.onload = cb;
    document.head.appendChild(s);
  }

  loadChartJS(() => console.log("✅ Chart.js loaded"));

  /* ================= GVIZ PARSER ================= */
  function parseGViz(txt) {
    txt = txt.replace(/^\s*\/\*O_o\*\/\s*/, "")
             .replace(/^google\.visualization\.Query\.setResponse\(/, "")
             .replace(/\);$/, "");
    return JSON.parse(txt).table.rows || [];
  }

  /* ================= RANGE SAFE FIND ================= */
  function findCfg(map, num) {
    for (const k in map) {
      const r = map[k].range;
      if (Array.isArray(r) && r.includes(num)) {
        return { id: map[k].id, off: r.indexOf(num) };
      }
    }
    return null;
  }

  /* ================= CONFIG ================= */
  let silverCfg = null;
  let goldCfg = null;

  fetch("https://aditya-kumar-tech.github.io/mbk/data/gs/silver-groups.json")
    .then(r => r.json())
    .then(j => { silverCfg = j; console.log("✅ Silver config loaded"); });

  fetch("https://aditya-kumar-tech.github.io/mbk/data/gs/gold-groups.json")
    .then(r => r.json())
    .then(j => { goldCfg = j; console.log("✅ Gold config loaded"); });

  /* ================= SILVER ================= */
  window.Silverdata = function (q) {
    runSilver(q, 0);
  };

  function runSilver(q, retry) {
    if (!silverCfg) return setTimeout(() => runSilver(q, retry), 500);

    const num = Number(String(q).replace(/\D/g, ""));
    const cfg = findCfg(silverCfg, num);
    if (!cfg) return console.warn("❌ Silver cfg not found", q);

    const url = `https://docs.google.com/spreadsheets/d/${cfg.id}/gviz/tq?tqx=out:json&sheet=silvweb&tq=select *`;

    fetch(url)
      .then(r => r.text())
      .then(t => renderSilver(parseGViz(t), cfg.off))
      .catch(() => retry < MAX_RETRY && runSilver(q, retry + 1));
  }

  function renderSilver(rows, off) {
    if (!rows.length) return;

    const priceKg = rows[off]?.c[2]?.v || 0;

    if (window.silvr_pricet)
      silvr_pricet.textContent = rs(priceKg); // 🔴 ENTITY FIX

    if (window.udat)
      udat.textContent = new Date().toLocaleDateString("hi-IN");

    const graf = document.getElementById("silvr_graf");
    if (graf) {
      loadChartJS(() => {
        graf.innerHTML = '<canvas id="silverChart"></canvas>';
        new Chart(silverChart.getContext("2d"), {
          type: "line",
          data: {
            labels: rows.map(r => r.c[0]?.f || ""),
            datasets: [{
              label: "Silver 1kg",
              data: rows.map(r => r.c[2]?.v || 0),
              borderWidth: 2
            }]
          }
        });
      });
    }
  }

  /* ================= GOLD ================= */
  window.golddata = function (q) {
    runGold(q, 0);
  };

  function runGold(q, retry) {
    if (!goldCfg) return setTimeout(() => runGold(q, retry), 500);

    const num = Number(String(q).replace(/\D/g, ""));
    const cfg = findCfg(goldCfg, num);
    if (!cfg) return console.warn("❌ Gold cfg not found", q);

    const url = `https://docs.google.com/spreadsheets/d/${cfg.id}/gviz/tq?tqx=out:json&sheet=goldweb&tq=select *`;

    fetch(url)
      .then(r => r.text())
      .then(t => renderGold(parseGViz(t)))
      .catch(() => retry < MAX_RETRY && runGold(q, retry + 1));
  }

  function renderGold(rows) {
    if (!rows.length) return;

    const p22 = rows[0]?.c[1]?.v || 0;
    const p24 = rows[0]?.c[3]?.v || 0;

    if (window.g22kt) g22kt.textContent = rs(p22);
    if (window.g24kt) g24kt.textContent = rs(p24);
    if (window.udat) udat.textContent = new Date().toLocaleDateString("hi-IN");

    const graf = document.getElementById("gldgraf");
    if (graf) {
      loadChartJS(() => {
        graf.innerHTML = '<canvas id="goldChart"></canvas>';
        new Chart(goldChart.getContext("2d"), {
          type: "line",
          data: {
            labels: rows.map(r => r.c[0]?.f || ""),
            datasets: [
              { label: "22K", data: rows.map(r => r.c[1]?.v || 0) },
              { label: "24K", data: rows.map(r => r.c[3]?.v || 0) }
            ]
          }
        });
      });
    }
  }

})();
