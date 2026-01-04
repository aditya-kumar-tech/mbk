(function () {
  const CSS_URL = "https://aditya-kumar-tech.github.io/mbk/embed/mbk-ui.css?v=3";
  const JS_URL  = "https://aditya-kumar-tech.github.io/mbk/embed/mbk-app.js?v=3";

  const cs = document.currentScript;
  const cfg = document.getElementById("mbk-config");

  // Read config from:
  // 1) function argument
  // 2) <script data-mandi="...">
  // 3) <div id="mbk-config" data-mandi="..."></div>
  function readMandiId(explicitId) {
    const a = (explicitId || "").trim();
    if (a) return a;

    const b = (cs?.dataset?.mandi || "").trim();
    if (b) return b;

    const c = (cfg?.dataset?.mandi || "").trim();
    if (c) return c;

    return "";
  }

  function readAutoload() {
    const a = cs?.dataset?.autoload === "1";
    const b = cfg?.dataset?.autoload === "1";
    return a || b;
  }

  let bootPromise = null;

  function setShellLoading(isLoading) {
    const loader = document.getElementById("loadingMsg");
    const app = document.getElementById("mbkApp");

    if (loader) loader.style.display = isLoading ? "block" : "none";
    if (app) app.style.display = isLoading ? "none" : "block";
  }

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
      s.async = true;
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
  if (!bootPromise) {
    bootPromise = (async () => {
      await loadCssOnce(CSS_URL);   // ✅ CSS first to avoid FOUC
      await loadJsOnce(JS_URL);
    })();
  }
  await bootPromise;
  if (window.MBK && window.MBK.init) await window.MBK.init();
}


  // ✅ same names used in Blogger HTML onclick
  window.mandibhavloadfresh = async function (mandiId) {
    const id = readMandiId(mandiId);

    // ✅ If no mandi id => skip silently (do not break page)
    if (!id) {
      setShellLoading(false);
      return;
    }

    setShellLoading(true);
    try {
      await ensureBoot();
      return await window.MBK.loadMandiBhav(id);
    } finally {
      setShellLoading(false);
    }
  };

  window.toggleViewMode = async function () {
    await ensureBoot();
    return window.MBK.toggleViewMode();
  };

  // On page parse: show only loader (only if we actually plan to load something)
  const autoload = readAutoload();
  const hasMandi = !!readMandiId("");

  if (autoload && hasMandi) {
    setShellLoading(true);
    window.mandibhavloadfresh().catch(() => {
      setShellLoading(false);
    });
  } else {
    // ✅ No mandi/autoload => do not keep loader stuck
    setShellLoading(false);
  }
})();
