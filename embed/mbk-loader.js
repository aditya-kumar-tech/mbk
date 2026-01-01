
(function () {
  const CSS_URL = "https://aditya-kumar-tech.github.io/mbk/embed/mbk-ui.css?v=3";
  const JS_URL  = "https://aditya-kumar-tech.github.io/mbk/embed/mbk-app.js?v=3";

  const cs = document.currentScript;
  const mandiDefault = (cs && cs.dataset && cs.dataset.mandi) ? cs.dataset.mandi.trim() : "";
  const autoload = (cs && cs.dataset && cs.dataset.autoload) === "1";

  let bootPromise = null;

  function setShellLoading(isLoading) {
    const loader = document.getElementById('loadingMsg');
    const app = document.getElementById('mbkApp');

    if (loader) loader.style.display = isLoading ? 'block' : 'none';
    if (app) app.style.display = isLoading ? 'none' : 'block';
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
    if (!bootPromise) bootPromise = Promise.all([loadCssOnce(CSS_URL), loadJsOnce(JS_URL)]);
    await bootPromise;
    if (window.MBK && window.MBK.init) await window.MBK.init();
  }

  // ✅ same names used in Blogger HTML onclick
  window.mandibhavloadfresh = async function (mandiId) {
    setShellLoading(true);
    try {
      await ensureBoot();
      const id = (mandiId || mandiDefault || "").trim();
      if (!id) throw new Error("No mandi id. Set data-mandi or pass mandibhavloadfresh('19044003').");
      return await window.MBK.loadMandiBhav(id);
    } finally {
      // ✅ always show app after attempt (even if error)
      setShellLoading(false);
    }
  };

  window.toggleViewMode = async function () {
    await ensureBoot();
    return window.MBK.toggleViewMode();
  };

  // ✅ on page parse: show only loader
  setShellLoading(true);

  if (autoload) {
    window.mandibhavloadfresh().catch(() => {});
  }
})();
