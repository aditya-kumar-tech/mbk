/* =====================================================
   MBK UNIVERSAL LOADER (TIMING + CACHE SAFE)
   DO NOT TOUCH PAGES (1200+ SAFE)
===================================================== */

(function () {
  "use strict";

  const DEBUG = true;
  const log = (...a) => DEBUG && console.log("🟢 MBK:", ...a);

  /* ================= CSS LOADER ================= */
  window.loadCSS = function (href) {
    return new Promise((resolve, reject) => {
      if (!href || !href.endsWith(".css")) return resolve();

      if ([...document.styleSheets].some(s => s.href && s.href.includes(href))) {
        return resolve();
      }

      const l = document.createElement("link");
      l.rel = "stylesheet";
      l.href = href;
      l.onload = resolve;
      l.onerror = reject;
      document.head.appendChild(l);
    });
  };

  /* ================= SCRIPT LOADER ================= */
  function loadJS(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) return resolve();
      const s = document.createElement("script");
      s.src = src;
      s.defer = true;
      s.onload = resolve;
      s.onerror = reject;
      document.body.appendChild(s);
    });
  }

  /* ================= SAFE CALL ================= */
  function waitFor(fnName, cb, retry = 40) {
    const t = setInterval(() => {
      if (typeof window[fnName] === "function") {
        clearInterval(t);
        cb();
      } else if (--retry <= 0) {
        clearInterval(t);
        log(`❌ ${fnName} not available`);
      }
    }, 250);
  }

  /* ================= CLEAR TABLE ================= */
  function clearTable(id) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = "";
  }

  /* ================= PAGE TYPE ================= */
  function isSilverPage() {
    return /silver/i.test(location.pathname);
  }

  function isGoldPage() {
    return /gold/i.test(location.pathname);
  }

  /* ================= MAIN INIT ================= */
  function init() {
    log("Loader Init");

    /* clear mixed cache */
    clearTable("silver_history");
    clearTable("gold_history");
    clearTable("price_table");

    /* AUTO RECALL SILVER */
    if (isSilverPage()) {
      waitFor("Silverdata", () => {
        log("Calling Silverdata()");
        window.Silverdata(
          window.sctqury || "sct180",
          "Silver"
        );
      });
    }

    /* AUTO RECALL GOLD */
    if (isGoldPage()) {
      waitFor("golddata", () => {
        log("Calling golddata()");
        window.golddata(
          window.gctqury || "gct322",
          "gold"
        );
      });
    }
  }

  /* ================= DOM READY ================= */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();
