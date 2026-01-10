(function () {

  const BASE = "https://aditya-kumar-tech.github.io/mbk/embed/";
  const MANIFEST_URL = BASE + "manifest.json";

  const cs  = document.currentScript;
  const cfg = document.getElementById("mbk-config");

  let bootPromise = null;
  let manifestCache = null;

  /* -------------------------------------------------- */
  /* 🔹 CONFIG READERS                                  */
  /* -------------------------------------------------- */

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
    return cs?.dataset?.autoload === "1" || cfg?.dataset?.autoload === "1";
  }

  /* -------------------------------------------------- */
  /* 🔹 UI SHELL HANDLING                               */
  /* -------------------------------------------------- */

  function setShellLoading(isLoading) {
    const loader = document.getElementById("loadingMsg");
    const app    = document.getElementById("mbkApp");

    if (loader) loader.style.display = isLoading ? "block" : "none";
    if (app)    app.style.display    = isLoading ? "none"  : "block";
  }

  /* -------------------------------------------------- */
  /* 🔹 MANIFEST + VERSION                              */
  /* -------------------------------------------------- */

  async function loadManifest() {
    if (manifestCache) return manifestCache;

    const res = await fetch(MANIFEST_URL, { cache: "no-store" });
    if (!res.ok) throw new Error("MBK manifest load failed");

    manifestCache = await res.json();
    return manifestCache;
  }

  /* -------------------------------------------------- */
  /* 🔹 ASSET LOADERS (VERSIONED)                       */
  /* -------------------------------------------------- */

  function loadCssOnce(href) {
    return new Promise((resolve, reject) => {
      if (document.querySelector('link[data-mbk="css"]')) return resolve();

      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      link.setAttribute("data-mbk", "css");
      link.onload = resolve;
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
      s.onload = resolve;
      s.onerror = () => reject(new Error("MBK JS load failed"));

      document.head.appendChild(s);
    });
  }

  /* -------------------------------------------------- */
  /* 🔹 BOOTSTRAP                                      */
  /* -------------------------------------------------- */

  async function ensureBoot() {
    if (window.MBK && window.MBK.loadMandiBhav) {
      if (window.MBK.init) await window.MBK.init();
      return;
    }

    if (!bootPromise) {
      bootPromise = (async () => {
        const manifest = await loadManifest();
        const v = encodeURIComponent(manifest.maps_ver || "1");

        await loadCssOnce(`${BASE}mbk-ui.css?v=${v}`); // ✅ CSS first
        await loadJsOnce(`${BASE}mbk-app.js?v=${v}`);
      })();
    }

    await bootPromise;
    if (window.MBK?.init) await window.MBK.init();
  }

  /* -------------------------------------------------- */
  /* 🔹 PUBLIC API (Blogger-safe names)                 */
  /* -------------------------------------------------- */

  window.mandibhavloadfresh = async function (mandiId) {
    const id = readMandiId(mandiId);

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

  /* -------------------------------------------------- */
  /* 🔹 AUTOLOAD                                       */
  /* -------------------------------------------------- */

  const autoload = readAutoload();
  const hasMandi = !!readMandiId("");

  if (autoload && hasMandi) {
    setShellLoading(true);
    window.mandibhavloadfresh().catch(() => setShellLoading(false));
  } else {
    setShellLoading(false);
  }

})();
