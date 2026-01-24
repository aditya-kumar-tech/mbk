
/* =========================================================
   UNIVERSAL METAL LOADER vFINAL
   Author: MBK Core
   Scope-safe | Cache-safe | GViz-safe
========================================================= */

(function () {
  const DEBUG = true;
  const log = (...a) => DEBUG && console.log("🧠[UL]", ...a);

  /* ---------- GLOBAL STATE (ISOLATED) ---------- */
  const STATE = {
    gold: { ready: false, cfg: null, queue: [] },
    silver: { ready: false, cfg: null, queue: [] }
  };

  /* ---------- SAFE FUNCTION DETECTION ---------- */
  const hasGold = () => typeof window.golddata === "function";
  const hasSilver = () => typeof window.Silverdata === "function";

  /* ---------- DYNAMIC SCRIPT LOADER ---------- */
  function loadJS(src, cb) {
    if (document.querySelector(`script[src="${src}"]`)) return cb && cb();
    const s = document.createElement("script");
    s.src = src;
    s.defer = true;
    s.onload = cb;
    document.head.appendChild(s);
  }

  /* ---------- JSON LOADER ---------- */
  function loadJSON(url, cb) {
    fetch(url).then(r => r.json()).then(cb);
  }

  /* ---------- QUEUE EXECUTOR ---------- */
  function flushQueue(type) {
    STATE[type].queue.forEach(fn => fn());
    STATE[type].queue.length = 0;
  }

  /* ---------- GOLD INIT ---------- */
  function initGold() {
    if (!hasGold()) {
      log("⏭ Gold function missing → skip gold");
      return;
    }

    log("🟡 Gold detected");

    loadJSON(
      "https://aditya-kumar-tech.github.io/mbk/data/gs/gold-groups.json",
      cfg => {
        STATE.gold.cfg = cfg;
        STATE.gold.ready = true;
        log("✔ Gold config loaded");
        flushQueue("gold");
      }
    );

    loadJS("https://cdn.jsdelivr.net/npm/chart.js", () =>
      log("📊 Chart.js ready (gold)")
    );
  }

  /* ---------- SILVER INIT ---------- */
  function initSilver() {
    if (!hasSilver()) {
      log("⏭ Silver function missing → skip silver");
      return;
    }

    log("⚪ Silver detected");

    loadJSON(
      "https://aditya-kumar-tech.github.io/mbk/data/gs/silver-groups.json",
      cfg => {
        STATE.silver.cfg = cfg;
        STATE.silver.ready = true;
        log("✔ Silver config loaded");
        flushQueue("silver");
      }
    );

    loadJS("https://cdn.jsdelivr.net/npm/chart.js", () =>
      log("📊 Chart.js ready (silver)")
    );
  }

  /* ---------- SAFE CALL WRAPPERS ---------- */
  window.golddataSafe = function (q, type) {
    if (!hasGold()) return;

    const run = () => {
      log("▶ GOLD RUN", q);
      clearGoldDOM();
      window.golddata(q, type);
    };

    STATE.gold.ready ? run() : STATE.gold.queue.push(run);
  };

  window.SilverdataSafe = function (q, type) {
    if (!hasSilver()) return;

    const run = () => {
      log("▶ SILVER RUN", q);
      clearSilverDOM();
      window.Silverdata(q, type);
    };

    STATE.silver.ready ? run() : STATE.silver.queue.push(run);
  };

  /* ---------- DOM CLEAR (ANTI MIX FIX) ---------- */
  function clearGoldDOM() {
    document.querySelectorAll(
      "#g22kt,#g24kt,#c22kt,#c24kt,.gold-history,.gold-table,canvas[data-metal='gold']"
    ).forEach(el => el.innerHTML = "");
  }

  function clearSilverDOM() {
    document.querySelectorAll(
      "#s1kg,#s100g,#cs1kg,#cs100g,.silver-history,.silver-table,canvas[data-metal='silver']"
    ).forEach(el => el.innerHTML = "");
  }

  /* ---------- AUTO BOOT ---------- */
  window.addEventListener("load", () => {
    log("🚀 Loader boot");

    initGold();
    initSilver();

    /* AUTO PAGE CALL (OPTIONAL SAFE) */
    if (window.gctqury && hasGold())
      golddataSafe(window.gctqury, "Gold");

    if (window.sctqury && hasSilver())
      SilverdataSafe(window.sctqury, "Silver");
  });

})();
