(function () {
  console.log("🚀 Universal Loader v8.2 – Gold & Silver (JSON List Range Safe)");

  /* ================= HELPER ================= */

  function parseGViz(txt) {
    try {
      txt = txt
        .replace(/^\s*\/\*O_o\*\/\s*/, "")
        .replace(/^google\.visualization\.Query\.setResponse\s*\(/, "")
        .replace(/\);?\s*$/, "");
      return JSON.parse(txt).table.rows || [];
    } catch (e) {
      console.error("GViz parse failed", e);
      return [];
    }
  }

  /* ✅ FIXED: list-based range support */
  function findCfg(map, n) {
    for (const k in map) {
      const cfg = map[k];
      if (!Array.isArray(cfg.range)) continue;

      const idx = cfg.range.indexOf(n);
      if (idx !== -1) {
        return {
          id: cfg.id,
          state: cfg.state,
          offset: idx
        };
      }
    }
    return null;
  }

  /* ================= QUEUE ================= */

  window._mbkQueue = window._mbkQueue || [];

  function processMBKQueue() {
    window._mbkQueue = window._mbkQueue.filter(q => {
      if (typeof window[q.fn] === "function") {
        window[q.fn](...q.args);
        return false;
      }
      return true;
    });
  }

  /* ================= SILVER ================= */

  let silverQueue = [], silverConfig = null;

  window.Silverdata = function (q) {
    let num = parseInt(String(q).replace(/\D/g, ""), 10);
    if (!num) return;

    silverQueue.push(num);
    if (silverConfig) runSilver();
    processMBKQueue();
  };

  function runSilver() {
    if (!silverQueue.length) return;

    const num = silverQueue.pop();
    const cfg = findCfg(silverConfig, num);
    if (!cfg) return;

    const url =
      `https://docs.google.com/spreadsheets/d/${cfg.id}/gviz/tq` +
      `?tqx=out:json&sheet=silvweb&tq=select * limit 15 offset ${cfg.offset}`;

    fetch(url)
      .then(r => r.text())
      .then(t => renderSilver(parseGViz(t)))
      .catch(e => console.warn("Silver retry", e));
  }

  function renderSilver(rows) {
    if (!rows.length) return;

    const priceKg = rows[0].c[2]?.v || 0;

    if (window.silvr_pricet)
      silvr_pricet.innerHTML = `₹${priceKg.toLocaleString("hi-IN")}`;

    if (window.udat)
      udat.textContent = new Date().toLocaleDateString("hi-IN");

    /* gram table */
    const gtbl = document.getElementById("silvr_gramtbl");
    if (gtbl) {
      let h = "<table style='width:100%'>";
      [1, 10, 50, 100, 500, 1000].forEach(g => {
        h += `<tr><td>${g}g</td><td style="text-align:right">₹${Math.round(priceKg * g / 1000).toLocaleString("hi-IN")}</td></tr>`;
      });
      gtbl.innerHTML = h + "</table>";
    }

    /* history */
    const hist = document.getElementById("data_table1");
    if (hist) {
      let h = "<table style='width:100%'><tr><th>तारीख</th><th>1kg</th></tr>";
      rows.forEach(r => {
        h += `<tr><td>${r.c[0]?.f || ""}</td><td style="text-align:right">₹${(r.c[2]?.v || 0).toLocaleString("hi-IN")}</td></tr>`;
      });
      hist.innerHTML = h + "</table>";
    }

    /* chart (safe) */
    if (window.Chart && document.getElementById("silvr_graf")) {
      silvr_graf.innerHTML = "<canvas id='svChart'></canvas>";
      new Chart(document.getElementById("svChart"), {
        type: "line",
        data: {
          labels: rows.map(r => r.c[0]?.f || ""),
          datasets: [{
            label: "Silver 1kg",
            data: rows.map(r => r.c[2]?.v || 0),
            borderColor: "#0d6efd",
            tension: 0.3
          }]
        }
      });
    }
  }

  /* ================= GOLD ================= */

  let goldQueue = [], goldConfig = null;

  window.golddata = function (q) {
    let num = parseInt(String(q).replace(/\D/g, ""), 10);
    if (!num) return;

    goldQueue.push(num);
    if (goldConfig) runGold();
    processMBKQueue();
  };

  function runGold() {
    if (!goldQueue.length) return;

    const num = goldQueue.pop();
    const cfg = findCfg(goldConfig, num);
    if (!cfg) return;

    const url =
      `https://docs.google.com/spreadsheets/d/${cfg.id}/gviz/tq` +
      `?tqx=out:json&sheet=goldweb&tq=select * limit 20 offset ${cfg.offset}`;

    fetch(url)
      .then(r => r.text())
      .then(t => renderGold(parseGViz(t)))
      .catch(e => console.warn("Gold retry", e));
  }

  function renderGold(rows) {
    if (!rows.length) return;

    const p22 = rows[0].c[1]?.v || 0;
    const p24 = rows[0].c[3]?.v || 0;

    if (window.g22kt) g22kt.innerHTML = `₹${p22.toLocaleString("hi-IN")}`;
    if (window.g24kt) g24kt.innerHTML = `₹${p24.toLocaleString("hi-IN")}`;
    if (window.udat) udat.textContent = new Date().toLocaleDateString("hi-IN");
  }

  /* ================= LOAD CONFIG ================= */

  fetch("https://aditya-kumar-tech.github.io/mbk/data/gs/silver-groups.json")
    .then(r => r.json())
    .then(j => { silverConfig = j; console.log("✅ Silver config loaded"); runSilver(); });

  fetch("https://aditya-kumar-tech.github.io/mbk/data/gs/gold-groups.json")
    .then(r => r.json())
    .then(j => { goldConfig = j; console.log("✅ Gold config loaded"); runGold(); });

  /* ================= GLOBAL REFS ================= */
  window.silvr_pricet = document.getElementById("silvr_pricet");
  window.g22kt = document.getElementById("g22kt");
  window.g24kt = document.getElementById("g24kt");
  window.udat = document.getElementById("udat");

})();
