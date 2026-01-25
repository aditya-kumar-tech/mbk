/* =========================================================
   UNIVERSAL LOADER v8 – MBK (Silver / Gold Safe)
   Fixes:
   ✔ Timing issue
   ✔ loadCSS undefined
   ✔ GViz late load
   ✔ Auto recall if data empty
   ✔ Silver & Gold isolation
   ✔ Old color CSS supported
========================================================= */

(function () {
  "use strict";

  /* ================= BASIC UTILS ================= */
  const has = s => document.querySelector(s);
  const delay = (f, t = 400) => setTimeout(f, t);

  /* ================= SAFE LOADERS ================= */
  function loadCSS(href) {
    return new Promise(res => {
      if (document.querySelector(`link[href="${href}"]`)) return res();
      const l = document.createElement("link");
      l.rel = "stylesheet";
      l.href = href;
      l.onload = res;
      document.head.appendChild(l);
    });
  }

  function loadJS(src) {
    return new Promise(res => {
      if (document.querySelector(`script[src="${src}"]`)) return res();
      const s = document.createElement("script");
      s.src = src;
      s.defer = true;
      s.onload = res;
      document.body.appendChild(s);
    });
  }

  /* ================= CSS (OLD COLORS RESTORED) ================= */
  const RATES_CSS = "https://api.mandibhavkhabar.com/data/gs/core/rates-ui.css";

  /* ================= CHART ================= */
  function ensureChart(cb) {
    if (window.Chart) return cb();
    loadJS("https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js").then(cb);
  }

  /* ================= GVIZ PARSER ================= */
  function parseGViz(txt, limit = 15) {
    try {
      txt = String(txt)
        .replace(/^\s*\/\*O_o\*\/\s*/i, "")
        .replace(/^google\.visualization\.Query\.setResponse\s*\(/i, "")
        .replace(/\);\s*$/i, "");

      const j = JSON.parse(txt);
      let rows = j.table?.rows || [];

      rows.sort((a, b) =>
        new Date(b.c[0]?.f || b.c[0]?.v) -
        new Date(a.c[0]?.f || a.c[0]?.v)
      );

      return rows.slice(0, limit);
    } catch (e) {
      console.error("GViz parse failed", e);
      return [];
    }
  }

  /* ================= CONFIG FINDER ================= */
  const findCfg = (map, n) => {
    if (!map) return null;
    for (const k in map) {
      if (Array.isArray(map[k].range) && map[k].range.includes(n)) {
        return { id: map[k].id, off: map[k].range.indexOf(n) };
      }
    }
    return null;
  };

  let silverCfg = null;
  let goldCfg = null;

  /* ================= SILVER ================= */
  window.Silverdata = function (q) {
    if (!q) return;

    const start = () => {
      const n = parseInt(q.replace(/\D/g, ""));
      const cfg = findCfg(silverCfg, n);
      if (!cfg) return;

      fetch(
        `https://docs.google.com/spreadsheets/d/${cfg.id}/gviz/tq?tqx=out:json&sheet=silvweb&tq=${encodeURIComponent(
          `select * limit 15 offset ${cfg.off || 0}`
        )}`
      )
        .then(r => r.text())
        .then(t => {
          const rows = parseGViz(t);
          if (rows.length) renderSilver(rows);
        });
    };

    if (!silverCfg) {
      fetch("https://api.mandibhavkhabar.com/data/gs/silver-groups.json")
        .then(r => r.json())
        .then(j => {
          silverCfg = j;
          start();
        });
    } else start();
  };

  function renderSilver(rows) {
    has("#gold-history-table") && (gold-history-table.innerHTML = "");

    const price = +rows[0].c[2]?.v || 0;
    has("#silvr_pricet") && (silvr_pricet.innerHTML = `₹${price.toLocaleString("hi-IN")}`);

    const tbl = has("#silver-history-table");
    if (tbl) {
      let h = `<tr><th>Date</th><th>1Kg</th></tr>`;
      rows.forEach(r => h += `<tr><td>${r.c[0]?.f}</td><td>₹${r.c[2]?.v}</td></tr>`);
      tbl.innerHTML = h;
    }

    const graf = has("#silvr_graf");
    if (graf) {
      ensureChart(() => {
        graf.innerHTML = `<canvas id="silverChart"></canvas>`;
        new Chart(silverChart, {
          type: "line",
          data: {
            labels: rows.map(r => r.c[0]?.f),
            datasets: [{ label: "Silver 1Kg", data: rows.map(r => r.c[2]?.v), fill: true }]
          },
          options: { responsive: true }
        });
      });
    }
  }

  /* ================= GOLD ================= */
  window.golddata = function (q) {
    if (!q) return;

    const start = () => {
      const n = parseInt(q.replace(/\D/g, ""));
      const cfg = findCfg(goldCfg, n);
      if (!cfg) return;

      fetch(
        `https://docs.google.com/spreadsheets/d/${cfg.id}/gviz/tq?tqx=out:json&sheet=goldweb&tq=${encodeURIComponent(
          `select * limit 15 offset ${cfg.off || 0}`
        )}`
      )
        .then(r => r.text())
        .then(t => {
          const rows = parseGViz(t);
          if (rows.length) renderGold(rows);
        });
    };

    if (!goldCfg) {
      fetch("https://api.mandibhavkhabar.com/data/gs/gold-groups.json")
        .then(r => r.json())
        .then(j => {
          goldCfg = j;
          start();
        });
    } else start();
  };

  function renderGold(rows) {
    has("#silver-history-table") && (silver-history-table.innerHTML = "");

    const p22 = +rows[0].c[1]?.v || 0;
    const p24 = +rows[0].c[3]?.v || 0;

    has("#g22kt") && (g22kt.innerHTML = `₹${p22.toLocaleString("hi-IN")}`);
    has("#g24kt") && (g24kt.innerHTML = `₹${p24.toLocaleString("hi-IN")}`);

    const tbl = has("#gold-history-table");
    if (tbl) {
      let h = `<tr><th>Date</th><th>22K</th><th>24K</th></tr>`;
      rows.forEach(r =>
        h += `<tr><td>${r.c[0]?.f}</td><td>₹${r.c[1]?.v}</td><td>₹${r.c[3]?.v}</td></tr>`
      );
      tbl.innerHTML = h;
    }
  }

  /* ================= AUTO CALL FIX ================= */
  function autoCall() {
    if (!window.pageConfig) return;
    let tryCount = 0;

    const t = setInterval(() => {
      tryCount++;
      if (window.pageConfig.type === "silver") Silverdata(window.pageConfig.query);
      if (window.pageConfig.type === "gold") golddata(window.pageConfig.query);
      if (tryCount > 10) clearInterval(t);
    }, 600);
  }

  document.addEventListener("DOMContentLoaded", () => {
    loadCSS(RATES_CSS);
    autoCall();
  });

})();
