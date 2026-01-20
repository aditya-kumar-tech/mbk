(function () {
  console.log("🚀 Universal Loader v8.3 – SILVER FIXED");

  /* ========== Chart.js loader ========== */
  function loadChartJS(cb) {
    if (window.Chart) return cb();
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/chart.js";
    s.onload = cb;
    document.head.appendChild(s);
  }

  /* ========== GVIZ PARSER ========== */
  function parseGViz(txt) {
    try {
      txt = txt
        .replace(/^\s*\/\*O_o\*\/\s*/, "")
        .replace(/^google\.visualization\.Query\.setResponse\(/, "")
        .replace(/\);?\s*$/, "");
      return JSON.parse(txt).table.rows || [];
    } catch (e) {
      return [];
    }
  }

  function findCfg(map, n) {
    for (const k in map) {
      const r = map[k].range;
      if (Array.isArray(r) && r.includes(n))
        return { id: map[k].id, off: r.indexOf(n) };
    }
    return null;
  }

  /* ========== GLOBAL DOM SAFE ========== */
  window.silvr_pricet ||= document.getElementById("silvr_pricet");
  window.g22kt ||= document.getElementById("g22kt");
  window.g24kt ||= document.getElementById("g24kt");
  window.udat ||= document.getElementById("udat");

  /* =====================================================
     ======================= SILVER ======================
     ===================================================== */
  let silverCfg = null;
  let silverQueue = [];

  window.Silverdata = function (q) {
    const num = parseInt(String(q).replace(/\D/g, ""));
    if (!num) return;
    silverQueue.push(num);
    runSilver();
  };

  function runSilver() {
    if (!silverCfg || !silverQueue.length) return;

    const num = silverQueue.shift();
    const cfg = findCfg(silverCfg, num);
    if (!cfg) return;

    // 1️⃣ try with offset
    fetchSilver(cfg, true).then((rows) => {
      if (!rows.length) {
        // 2️⃣ fallback without offset
        fetchSilver(cfg, false).then((rows2) => {
          if (rows2.length) renderSilver(rows2);
        });
      } else {
        renderSilver(rows);
      }
    });
  }

  function fetchSilver(cfg, useOffset) {
    const url =
      `https://docs.google.com/spreadsheets/d/${cfg.id}/gviz/tq` +
      `?tqx=out:json&sheet=silvweb&tq=select * limit 15` +
      (useOffset ? ` offset ${cfg.off}` : "");

    return fetch(url)
      .then((r) => r.text())
      .then(parseGViz)
      .catch(() => []);
  }

  function renderSilver(rows) {
    const priceKg = rows[0].c[2]?.v || 0;

    if (window.silvr_pricet)
      silvr_pricet.innerHTML = `₹${priceKg.toLocaleString("hi-IN")}`;

    if (window.udat)
      udat.textContent = new Date().toLocaleDateString("hi-IN");

    /* history */
    const ht = document.getElementById("data_table1");
    if (ht) {
      let h = "<table><tr><th>Date</th><th>1kg</th></tr>";
      rows.forEach((r) => {
        h += `<tr><td>${r.c[0]?.f || ""}</td><td>₹${(
          r.c[2]?.v || 0
        ).toLocaleString()}</td></tr>`;
      });
      h += "</table>";
      ht.innerHTML = h;
    }

    /* graph */
    const g = document.getElementById("silvr_graf");
    if (g) {
      loadChartJS(() => {
        g.innerHTML = "<canvas id='silverChart'></canvas>";
        new Chart(document.getElementById("silverChart"), {
          type: "line",
          data: {
            labels: rows.map((r) => r.c[0]?.f || ""),
            datasets: [
              {
                label: "Silver 1kg",
                data: rows.map((r) => r.c[2]?.v || 0),
              },
            ],
          },
        });
      });
    }
  }

  /* =====================================================
     ======================== GOLD =======================
     ===================================================== */
  let goldCfg = null;
  let goldQueue = [];

  window.golddata = function (q) {
    const num = parseInt(String(q).replace(/\D/g, ""));
    if (!num) return;
    goldQueue.push(num);
    runGold();
  };

  function runGold() {
    if (!goldCfg || !goldQueue.length) return;
    const num = goldQueue.shift();
    const cfg = findCfg(goldCfg, num);
    if (!cfg) return;

    const url =
      `https://docs.google.com/spreadsheets/d/${cfg.id}/gviz/tq` +
      `?tqx=out:json&sheet=goldweb&tq=select * limit 20`;

    fetch(url)
      .then((r) => r.text())
      .then(parseGViz)
      .then(renderGold);
  }

  function renderGold(rows) {
    const p22 = rows[0].c[1]?.v || 0;
    const p24 = rows[0].c[3]?.v || 0;

    if (window.g22kt)
      g22kt.textContent = `₹${p22.toLocaleString("hi-IN")}`;
    if (window.g24kt)
      g24kt.textContent = `₹${p24.toLocaleString("hi-IN")}`;
  }

  /* ========== LOAD CONFIGS ========== */
  fetch(
    "https://aditya-kumar-tech.github.io/mbk/data/gs/silver-groups.json"
  )
    .then((r) => r.json())
    .then((j) => {
      silverCfg = j;
      runSilver();
      console.log("✅ Silver config ready");
    });

  fetch("https://aditya-kumar-tech.github.io/mbk/data/gs/gold-groups.json")
    .then((r) => r.json())
    .then((j) => {
      goldCfg = j;
      runGold();
      console.log("✅ Gold config ready");
    });
})();