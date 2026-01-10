(function () {
  const CSS_URL = "https://aditya-kumar-tech.github.io/mbk/embed/mbk-ui.css?v=3";
  const JS_URL  = "https://aditya-kumar-tech.github.io/mbk/embed/mbk-app.js?v=3";

  const cs = document.currentScript;
  const cfg = document.getElementById("mbk-config");

  function readMandiId(explicitId) {
    return (explicitId || cs?.dataset?.mandi || cfg?.dataset?.mandi || "").trim();
  }

  function readAutoload() {
    return cs?.dataset?.autoload === "1" || cfg?.dataset?.autoload === "1";
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
      link.rel = "stylesheet"; link.href = href; link.setAttribute("data-mbk","css");
      link.onload = () => resolve(); link.onerror = () => reject(new Error("CSS load failed"));
      document.head.appendChild(link);
    });
  }

  function loadJsOnce(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector('script[data-mbk="js"]')) return resolve();
      const s = document.createElement("script");
      s.src = src; s.async = true; s.setAttribute("data-mbk","js");
      s.onload = () => resolve(); s.onerror = () => reject(new Error("JS load failed"));
      document.head.appendChild(s);
    });
  }

  async function ensureBoot() {
    if (window.MBK && window.MBK.loadMandiBhav) {
      if (window.MBK.init) await window.MBK.init();
      return;
    }
    if (!bootPromise) {
      bootPromise = (async () => { await loadCssOnce(CSS_URL); await loadJsOnce(JS_URL); })();
    }
    await bootPromise;
    if (window.MBK && window.MBK.init) await window.MBK.init();
  }

  // ✅ Button call: fetch latest data, no cache clear
  window.mandibhavloadfresh = async function (mandiId) {
    const id = readMandiId(mandiId);
    if (!id) { setShellLoading(false); return; }
    setShellLoading(true);
    try { await ensureBoot(); return await window.MBK.loadMandiBhav(id); }
    finally { setShellLoading(false); }
  };

  window.toggleViewMode = async function () { await ensureBoot(); return window.MBK.toggleViewMode(); };

  // Auto load on page parse
  const autoload = readAutoload();
  const hasMandi = !!readMandiId();
  if (autoload && hasMandi) {
    setShellLoading(true);
    window.mandibhavloadfresh().catch(()=>{ setShellLoading(false); });
  } else { setShellLoading(false); }
})();
