(function () {
  const CSS_URL = "https://aditya-kumar-tech.github.io/mbk/embed/mbk-ui.css?v=1";
  const JS_URL  = "https://aditya-kumar-tech.github.io/mbk/embed/mbk-app.js?v=1";

  // ✅ read config from <script ... data-mandi="19044003" data-autoload="1">
  // document.currentScript works while the script is being processed (not a module). [web:321]
  const scriptEl = document.currentScript;
  const cfg = (scriptEl && scriptEl.dataset) ? scriptEl.dataset : {};

  const DEFAULT_MANDI = (cfg.mandi || "").trim();     // e.g. "19044003"
  const AUTOLOAD = (cfg.autoload || "") === "1";      // "1" => autoload

  let bootPromise = null;

  function loadCssOnce(href) {
    return new Promise((resolve, reject) => {
      if (document.querySelector('link[data-mbk="css"]')) return resolve();
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      link.setAttribute("data-mbk", "css");
      link.onload = () => resolve();
      link.onerror = () => reject(new Error("MBK CSS load failed"));
      document.head.appendChild(link);
    });
  }

  function loadJsOnce(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector('script[data-mbk="js"]')) return resolve();
      const s = document.createElement("script");
      s.src = src;
      s.defer = true;
      s.setAttribute("data-mbk", "js");
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("MBK JS load failed"));
      document.head.appendChild(s);
    });
  }

  async function ensureBoot() {
    if (window.MBK && window.MBK.loadMandiBhav) {
      if (window.MBK.init) await window.MBK.init();
      return;
    }
    if (!bootPromise) bootPromise = Promise.all([loadCssOnce(CSS_URL), loadJsOnce(JS_URL)]);
    await bootPromise;
    if (window.MBK && window.MBK.init) await window.MBK.init();
  }

  // ✅ same names as your HTML onclick uses
  window.mandibhavloadfresh = async function (mandiId) {
    await ensureBoot();
    const id = (mandiId || DEFAULT_MANDI || "").trim();
    if (!id) throw new Error("No mandi id provided. Use mandibhavloadfresh('19044003') or set data-mandi.");
    return window.MBK.loadMandiBhav(id);
  };

  window.toggleViewMode = async function () {
    await ensureBoot();
    return window.MBK.toggleViewMode();
  };

  // ✅ optional: direct API too
  window.loadMandiBhav = async function (id) {
    return window.mandibhavloadfresh(id);
  };

  // ✅ optional autoload (per page)
  if (AUTOLOAD) {
    // defer script runs after parsing; safe to call immediately here
    window.mandibhavloadfresh().catch(() => {});
  }
})();
