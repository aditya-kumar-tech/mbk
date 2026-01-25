/* =====================================================
   MBK UNIVERSAL LOADER vFINAL
   Rocket Loader + CSP + Timing SAFE
   Pages untouched (1200+ SAFE)
===================================================== */

(function () {
  "use strict";

  const log = (...a) => console.log("🟢 MBK:", ...a);

  /* ================= QUEUE ================= */
  const callQueue = [];

  /* ================= SAFE STUBS ================= */
  if (!window.Silverdata) {
    window.Silverdata = function () {
      log("⏳ Silverdata queued");
      callQueue.push({ fn: "Silverdata", args: arguments });
    };
  }

  if (!window.golddata) {
    window.golddata = function () {
      log("⏳ golddata queued");
      callQueue.push({ fn: "golddata", args: arguments });
    };
  }

  /* ================= PAGE TYPE ================= */
  const isSilver = /silver/i.test(location.pathname);
  const isGold   = /gold/i.test(location.pathname);

  /* ================= CLEAR MIXED CACHE ================= */
  function clearTables() {
    [
      "silver_history",
      "gold_history",
      "price_table"
    ].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = "";
    });
  }

  /* ================= WAIT FOR REAL FUNCTIONS ================= */
  function waitForReal(fn, cb, retry = 60) {
    const t = setInterval(() => {
      if (window[fn] && window[fn].toString().indexOf("queued") === -1) {
        clearInterval(t);
        cb();
      }
      if (--retry <= 0) clearInterval(t);
    }, 250);
  }

  /* ================= REPLAY QUEUE ================= */
  function replayQueue() {
    callQueue.forEach(item => {
      if (
        (item.fn === "Silverdata" && isSilver) ||
        (item.fn === "golddata" && isGold)
      ) {
        log("▶ Replaying", item.fn);
        window[item.fn].apply(null, item.args);
      }
    });
    callQueue.length = 0;
  }

  /* ================= INIT ================= */
  function init() {
    log("Loader Init");

    clearTables();

    if (isSilver) {
      waitForReal("Silverdata", replayQueue);
    }

    if (isGold) {
      waitForReal("golddata", replayQueue);
    }
  }

  /* ================= DOM READY ================= */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();
