/* =========================================================
   UNIVERSAL METAL LOADER vSTABLE
   Author: MBK Core
   Gold–Silver HARD ISOLATION | Cache Safe | GViz Safe
========================================================= */

(function () {
  const DEBUG = true;
  const log = (...a) => DEBUG && console.log("🧠[UL]", ...a);

  /* ---------- HARD METAL LOCK ---------- */
  let ACTIVE_METAL = null; // "gold" | "silver"

  /* ---------- STATE ---------- */
  const STATE = {
    gold: { ready: false, queue: [] },
    silver: { ready: false, queue: [] }
  };

  /* ---------- DETECTORS ---------- */
  const hasGold = () => typeof window.golddata === "function";
  const hasSilver = () => typeof window.Silverdata === "function";

  /* ---------- SCRIPT LOADER ---------- */
  function loadJS(src, cb) {
    if (document.querySelector(`script[src="${src}"]`)) return cb && cb();
    const s = document.createElement("script");
    s.src = src;
    s.defer = true;
    s.onload = cb;
    document.head.appendChild(s);
  }

  /* ---------- QUEUE ---------- */
  function flush(type) {
    STATE[type].queue.forEach(fn => fn());
    STATE[type].queue.length = 0;
  }

  /* ---------- FULL DOM RESET ---------- */
  function clearGoldDOM() {
    log("🧹 Clear GOLD DOM");
    document.querySelectorAll(
      "#g22kt,#g24kt,#c22kt,#c24kt,.gold-history,.gold-table"
    ).forEach(el => el.innerHTML = "");

    document.querySelectorAll("canvas").forEach(c => {
      if (c.dataset.metal === "gold") c.remove();
    });
  }

  function clearSilverDOM() {
    log("🧹 Clear SILVER DOM");
    document.querySelectorAll(
      "#s1kg,#s100g,#cs1kg,#cs100g,.silver-history,.silver-table"
    ).forEach(el => el.innerHTML = "");

    document.querySelectorAll("canvas").forEach(c => {
      if (c.dataset.metal === "silver") c.remove();
    });
  }

  /* ---------- SAFE CALLERS ---------- */
  window.golddataSafe = function (q, type) {
    if (!hasGold()) return;

    const run = () => {
      ACTIVE_METAL = "gold";
      clearSilverDOM();   // ❗ HARD BLOCK
      clearGoldDOM();
      log("▶ GOLD RUN", q);
      window.golddata(q, type);
    };

    STATE.gold.ready ? run() : STATE.gold.queue.push(run);
  };

  window.SilverdataSafe = function (q, type) {
    if (!hasSilver()) return;

    const run = () => {
      ACTIVE_METAL = "silver";
      clearGoldDOM();     // ❗ HARD BLOCK
      clearSilverDOM();
      log("▶ SILVER RUN", q);
      window.Silverdata(q, type);
    };

    STATE.silver.ready ? run() : STATE.silver.queue.push(run);
  };

  /* ---------- INIT GOLD ---------- */
  function initGold() {
    if (!hasGold()) return log("⏭ Gold not present");
    STATE.gold.ready = true;
    flush("gold");
    loadJS("https://cdn.jsdelivr.net/npm/chart.js");
    log("🟡 Gold ready");
  }

  /* ---------- INIT SILVER ---------- */
  function initSilver() {
    if (!hasSilver()) return log("⏭ Silver not present");
    STATE.silver.ready = true;
    flush("silver");
    loadJS("https://cdn.jsdelivr.net/npm/chart.js");
    log("⚪ Silver ready");
  }

  /* ---------- AUTO BOOT ---------- */
  window.addEventListener("load", () => {
    log("🚀 Universal Loader Boot");

    initGold();
    initSilver();

    /* AUTO PAGE SAFE CALL */
    if (window.gctqury && hasGold()) {
      golddataSafe(window.gctqury, "Gold");
    }

    if (window.sctqury && hasSilver()) {
      SilverdataSafe(window.sctqury, "Silver");
    }
  });

})();
